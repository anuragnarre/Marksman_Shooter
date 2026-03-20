"""
Target detection via synthetic template matching + radial profile refinement.

Stages:
  A. Multi-scale template matching (synthetic ISSF target)
  B. Radial profile refinement (sub-pixel center + precise mm_per_pixel)
  C. Perspective estimation (single outer-ring ellipse)

Fallback chain: template match -> Hough circles -> frame center.
"""

import cv2
import numpy as np
from typing import List, Optional, Tuple

from .types import TargetCalibration
from .target_specs import get_spec, TargetSpec


def detect_target(
    gray: np.ndarray,
    target_type: str = "air_rifle_10m",
) -> TargetCalibration:
    """
    Detect the target in a grayscale image using synthetic template matching.

    Returns TargetCalibration with center, radii, perspective, and mm_per_pixel.
    """
    h, w = gray.shape[:2]
    min_dim = min(h, w)
    spec = get_spec(target_type)

    # Stage A: Multi-scale template matching
    result = _template_match(gray, spec, min_dim)

    if result is None:
        # Fallback: Hough circles
        result = _hough_fallback(gray, h, w)

    if result is None:
        # Last resort: assume target fills frame
        cx, cy = w / 2.0, h / 2.0
        r = min_dim / 2.0
        return TargetCalibration(
            center=(cx, cy),
            major_radius=r,
            minor_radius=r,
            rotation_deg=0.0,
            eccentricity=0.0,
            confidence=0.1,
            mm_per_pixel=spec.outer_radius_mm / r,
        )

    cx, cy, radius, confidence = result

    # Stage B: Radial profile refinement
    cx, cy, mm_per_pixel, ring_radii = _radial_profile_refine(
        gray, cx, cy, radius, spec
    )

    # Stage C: Perspective estimation via outer-ring ellipse
    major_r, minor_r, rotation, eccentricity = _estimate_perspective(
        gray, cx, cy, radius
    )

    return TargetCalibration(
        center=(cx, cy),
        major_radius=major_r,
        minor_radius=minor_r,
        rotation_deg=rotation,
        eccentricity=eccentricity,
        ring_radii=ring_radii,
        confidence=confidence,
        mm_per_pixel=mm_per_pixel,
    )


def _template_match(
    gray: np.ndarray,
    spec: TargetSpec,
    min_dim: int,
) -> Optional[Tuple[float, float, float, float]]:
    """
    Multi-scale template matching against synthetic ISSF target.

    Returns (cx, cy, radius, confidence) or None.
    """
    h, w = gray.shape[:2]

    # Generate templates at 5-7 scales (10% to 70% of min dimension)
    scales = np.linspace(0.10, 0.70, 7)
    best_val = -1.0
    best_cx, best_cy, best_radius = 0.0, 0.0, 0.0

    # Downsample large images for speed during template matching
    max_search_dim = 800
    scale_factor = 1.0
    search_gray = gray
    if min_dim > max_search_dim:
        scale_factor = max_search_dim / min_dim
        search_gray = cv2.resize(
            gray, None, fx=scale_factor, fy=scale_factor,
            interpolation=cv2.INTER_AREA,
        )

    sh, sw = search_gray.shape[:2]
    search_min = min(sh, sw)

    for s in scales:
        radius_px = int(search_min * s / 2)
        if radius_px < 20:
            continue

        template = spec.render_template(radius_px)
        th, tw = template.shape[:2]

        if th >= sh or tw >= sw:
            continue

        result = cv2.matchTemplate(search_gray, template, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(result)

        if max_val > best_val:
            best_val = max_val
            # max_loc is top-left corner of match; center is offset by radius
            best_cx = (max_loc[0] + radius_px) / scale_factor
            best_cy = (max_loc[1] + radius_px) / scale_factor
            best_radius = radius_px / scale_factor

    if best_val < 0.15:
        return None

    confidence = min(1.0, max(0.3, (best_val - 0.15) / 0.5 + 0.3))
    return (best_cx, best_cy, best_radius, confidence)


def _radial_profile_refine(
    gray: np.ndarray,
    cx: float,
    cy: float,
    radius: float,
    spec: TargetSpec,
) -> Tuple[float, float, float, List[float]]:
    """
    Refine center and scale using the radial intensity profile.

    The ISSF target has a characteristic staircase pattern (alternating
    black/white rings). We extract the radial profile and fit against
    the known ring positions.

    Returns (refined_cx, refined_cy, mm_per_pixel, ring_radii_pixels).
    """
    h, w = gray.shape[:2]

    # Iterative refinement: adjust center based on profile symmetry
    best_cx, best_cy = cx, cy

    for iteration in range(3):
        # Extract radial intensity profile
        max_r = int(min(radius * 1.3, min(best_cx, best_cy, w - best_cx, h - best_cy) - 1))
        if max_r < 20:
            break

        num_samples = max_r
        profile = np.zeros(num_samples, dtype=np.float64)
        counts = np.zeros(num_samples, dtype=np.float64)

        # Sample in a grid around center
        y_lo = max(0, int(best_cy - max_r))
        y_hi = min(h, int(best_cy + max_r + 1))
        x_lo = max(0, int(best_cx - max_r))
        x_hi = min(w, int(best_cx + max_r + 1))

        # Vectorized radial profile extraction
        ys = np.arange(y_lo, y_hi)
        xs = np.arange(x_lo, x_hi)
        yy, xx = np.meshgrid(ys, xs, indexing='ij')
        dists = np.sqrt((xx - best_cx) ** 2 + (yy - best_cy) ** 2)
        dist_idx = dists.astype(np.int32)

        mask = dist_idx < num_samples
        vals = gray[y_lo:y_hi, x_lo:x_hi].astype(np.float64)

        np.add.at(profile, dist_idx[mask], vals[mask])
        np.add.at(counts, dist_idx[mask], 1.0)

        counts[counts == 0] = 1
        profile /= counts

        # Find ring transitions (large intensity changes)
        if len(profile) < 10:
            break

        # Smooth profile for gradient computation
        kernel_size = max(3, int(radius * 0.02))
        if kernel_size % 2 == 0:
            kernel_size += 1
        smoothed = cv2.GaussianBlur(
            profile.reshape(1, -1).astype(np.float32),
            (kernel_size, 1), 0
        ).flatten()

        gradient = np.abs(np.diff(smoothed))

        # Find peaks in gradient (ring transitions)
        ring_positions_px = []
        min_ring_gap = int(radius / spec.num_rings * 0.5)
        threshold = np.percentile(gradient, 85)

        i = 0
        while i < len(gradient):
            if gradient[i] > threshold:
                # Find local max
                j = i
                while j < len(gradient) - 1 and gradient[j + 1] >= gradient[j]:
                    j += 1
                ring_positions_px.append(float(j))
                i = j + max(min_ring_gap, 1)
            else:
                i += 1

        # Try to center-refine using profile symmetry
        # Compare left vs right half-profiles
        if iteration < 2:
            shift_x, shift_y = _symmetry_shift(gray, best_cx, best_cy, max_r)
            best_cx += shift_x * 0.5
            best_cy += shift_y * 0.5

    # Compute mm_per_pixel from ring positions
    mm_per_pixel = spec.outer_radius_mm / radius  # Default

    if len(ring_positions_px) >= 3:
        # Match detected transitions to known ring positions
        known_radii_mm = []
        for ring_num in range(1, spec.num_rings + 1):
            known_radii_mm.append(spec.ring_radius_mm(ring_num))

        # Least-squares fit: detected_px = known_mm / mm_per_pixel
        # Try to match the detected transitions to known ones
        if len(ring_positions_px) >= 2:
            detected = np.array(ring_positions_px[:min(len(ring_positions_px), len(known_radii_mm))])
            known = np.array(known_radii_mm[:len(detected)])
            # mm_per_pixel = sum(known_mm) / sum(detected_px) via least squares
            if np.sum(detected ** 2) > 0:
                mm_per_pixel_fit = float(np.dot(known, detected) / np.dot(detected, detected))
                if 0.01 < mm_per_pixel_fit < 10.0:
                    mm_per_pixel = mm_per_pixel_fit

    # Generate ring radii in pixels from spec
    ring_radii = []
    for ring_num in range(1, spec.num_rings + 1):
        r_mm = spec.ring_radius_mm(ring_num)
        r_px = r_mm / mm_per_pixel
        ring_radii.append(r_px)

    return (best_cx, best_cy, mm_per_pixel, ring_radii)


def _symmetry_shift(
    gray: np.ndarray,
    cx: float,
    cy: float,
    max_r: int,
) -> Tuple[float, float]:
    """Estimate center offset by comparing radial profile in 4 quadrants."""
    h, w = gray.shape[:2]
    sample_r = min(max_r, 100)

    # Sample horizontal profile
    x_lo = max(0, int(cx - sample_r))
    x_hi = min(w, int(cx + sample_r))
    y_int = int(cy)
    if y_int < 0 or y_int >= h or x_hi <= x_lo:
        return (0.0, 0.0)

    h_strip = gray[y_int, x_lo:x_hi].astype(np.float64)
    mid = int(cx - x_lo)
    if mid < 5 or mid >= len(h_strip) - 5:
        return (0.0, 0.0)

    left = h_strip[:mid][::-1]
    right = h_strip[mid:]
    min_len = min(len(left), len(right))
    if min_len < 5:
        return (0.0, 0.0)

    diff_h = np.mean(right[:min_len]) - np.mean(left[:min_len])
    shift_x = diff_h * 0.1  # Small correction

    # Sample vertical profile
    y_lo = max(0, int(cy - sample_r))
    y_hi = min(h, int(cy + sample_r))
    x_int = int(cx)
    if x_int < 0 or x_int >= w or y_hi <= y_lo:
        return (shift_x, 0.0)

    v_strip = gray[y_lo:y_hi, x_int].astype(np.float64)
    mid = int(cy - y_lo)
    if mid < 5 or mid >= len(v_strip) - 5:
        return (shift_x, 0.0)

    top = v_strip[:mid][::-1]
    bottom = v_strip[mid:]
    min_len = min(len(top), len(bottom))
    if min_len < 5:
        return (shift_x, 0.0)

    diff_v = np.mean(bottom[:min_len]) - np.mean(top[:min_len])
    shift_y = diff_v * 0.1

    return (shift_x, shift_y)


def _estimate_perspective(
    gray: np.ndarray,
    cx: float,
    cy: float,
    radius: float,
) -> Tuple[float, float, float, float]:
    """
    Estimate perspective distortion from a single outer-ring ellipse fit.

    Uses Canny edges only in the 85-115% radius band.
    Returns (major_radius, minor_radius, rotation_deg, eccentricity).
    """
    h, w = gray.shape[:2]

    # Create annular mask at 85-115% of detected radius
    inner_r = int(radius * 0.85)
    outer_r = int(radius * 1.15)

    y_lo = max(0, int(cy - outer_r))
    y_hi = min(h, int(cy + outer_r + 1))
    x_lo = max(0, int(cx - outer_r))
    x_hi = min(w, int(cx + outer_r + 1))

    roi = gray[y_lo:y_hi, x_lo:x_hi]
    if roi.size == 0:
        return (radius, radius, 0.0, 0.0)

    # Create annular mask
    roi_h, roi_w = roi.shape[:2]
    ys = np.arange(roi_h)
    xs = np.arange(roi_w)
    yy, xx = np.meshgrid(ys, xs, indexing='ij')
    dists = np.sqrt((xx - (cx - x_lo)) ** 2 + (yy - (cy - y_lo)) ** 2)
    annular_mask = ((dists >= inner_r) & (dists <= outer_r)).astype(np.uint8) * 255

    # Edge detection within annular region
    blurred = cv2.GaussianBlur(roi, (5, 5), 1.5)
    edges = cv2.Canny(blurred, 50, 150)
    edges = cv2.bitwise_and(edges, annular_mask)

    # Find contours and fit ellipse
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

    # Collect all edge points
    all_points = []
    for cnt in contours:
        if len(cnt) >= 3:
            all_points.append(cnt)

    if not all_points:
        return (radius, radius, 0.0, 0.0)

    all_points = np.vstack(all_points)
    if len(all_points) < 5:
        return (radius, radius, 0.0, 0.0)

    try:
        ellipse = cv2.fitEllipse(all_points)
    except cv2.error:
        return (radius, radius, 0.0, 0.0)

    (ex, ey), (ma, MA), angle = ellipse
    semi_major = max(ma, MA) / 2.0
    semi_minor = min(ma, MA) / 2.0

    if semi_major < 1:
        return (radius, radius, 0.0, 0.0)

    ecc = 1.0 - semi_minor / semi_major
    return (semi_major, semi_minor, angle, ecc)


def _hough_fallback(
    gray: np.ndarray, img_h: int, img_w: int
) -> Optional[Tuple[float, float, float, float]]:
    """Fall back to Hough Circle Transform for target detection."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 1.5)
    min_dim = min(img_h, img_w)

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.5,
        minDist=img_w // 2,
        param1=100,
        param2=50,
        minRadius=min_dim // 6,
        maxRadius=min_dim // 2,
    )

    if circles is None:
        return None

    c = circles[0, 0]
    return (float(c[0]), float(c[1]), float(c[2]), 0.4)
