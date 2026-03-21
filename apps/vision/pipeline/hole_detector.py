"""
Bullet-hole detection for Indian NR / ISSF air rifle targets.

Key observations from real target photos:
  - Black filled center zone (rings 7-10) with cream outer zone
  - Holes punch through paper → BRIGHT WHITE spots on black background
  - Multiple shots cluster tightly, creating merged white regions
  - Pellet size must be estimated from the image, NOT from mm_per_pixel
    (because the detected target radius often doesn't match ring 1)

Detection pipeline:
  1. Find black zone boundary
  2. Estimate actual pellet size from black zone radius
  3. Threshold for bright spots in black zone
  4. Distance transform + local maxima to split merged holes
  5. Dark holes in cream zone
"""

import math
from typing import List, Optional, Tuple

import cv2
import numpy as np

from .types import HoleCandidate, FusedHole, TargetCalibration


def detect_holes(
    gray: np.ndarray,
    calibration: TargetCalibration,
    pellet_diameter_mm: float = 4.5,
    diff_img: Optional[np.ndarray] = None,
) -> List[FusedHole]:
    """Detect bullet holes using zone-aware brightness + distance transform."""
    cx, cy = calibration.center
    radius = calibration.major_radius

    if radius < 10:
        return []

    h, w = gray.shape[:2]
    target_mask = _circle_mask(h, w, cx, cy, radius * 1.02)

    # Find the black center zone
    black_zone, black_radius = _find_black_zone(gray, cx, cy, radius, target_mask)
    cream_zone = target_mask & ~black_zone

    # Estimate visible hole radius from image scale
    # The black zone ≈ rings 7-10 ≈ 10mm physical radius
    # Visible bright spot of a 4.5mm hole is about 2-3mm (center of tear)
    # Ratio: visible_spot / black_zone ≈ 2.5 / 10 = 0.25
    if black_radius > 10:
        pellet_radius_px = max(3.0, black_radius * 0.08)
    else:
        pellet_radius_px = max(3.0, radius * 0.03)

    candidates: List[FusedHole] = []

    # Erode black zone slightly to exclude the boundary ring line
    erode_k = max(3, int(pellet_radius_px * 0.4)) | 1
    erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (erode_k, erode_k))
    black_interior = cv2.erode(black_zone.astype(np.uint8) * 255, erode_kernel) > 0

    # PRIMARY: Bright holes in black zone interior
    c1 = _detect_bright_holes(gray, black_interior, cx, cy, pellet_radius_px)
    candidates.extend(c1)

    # SECONDARY: Dark holes in cream zone
    c2 = _detect_dark_holes(gray, cream_zone, pellet_radius_px, cx, cy)
    candidates.extend(c2)

    # Remove printed center ring (inner-10 marking)
    center_exclude_px = max(pellet_radius_px * 1.5, black_radius * 0.03)
    candidates = [
        c for c in candidates
        if math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2) > center_exclude_px
    ]

    # Deduplicate
    candidates = _deduplicate(candidates, pellet_radius_px)

    # Reject outside target
    max_dist_sq = (radius * 1.05) ** 2
    candidates = [c for c in candidates if (c.x - cx) ** 2 + (c.y - cy) ** 2 <= max_dist_sq]

    # Post-filter: remove ring-line artifacts
    # If many shots cluster at the same distance from center, they're ring lines
    candidates = _filter_ring_artifacts(candidates, cx, cy, pellet_radius_px)

    return candidates


def _circle_mask(h: int, w: int, cx: float, cy: float, r: float) -> np.ndarray:
    yy, xx = np.ogrid[:h, :w]
    return ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2


def _find_black_zone(
    gray: np.ndarray, cx: float, cy: float, radius: float,
    target_mask: np.ndarray,
) -> Tuple[np.ndarray, float]:
    """Find the filled black center zone."""
    h, w = gray.shape[:2]
    max_r = int(radius)
    if max_r < 10:
        return np.zeros((h, w), dtype=bool), 0.0

    # Radial profile to find dark→light transition
    num_angles = 36
    angles = np.linspace(0, 2 * np.pi, num_angles, endpoint=False)
    radii = np.arange(0, max_r)

    cos_a = np.cos(angles)[:, None]
    sin_a = np.sin(angles)[:, None]
    r_arr = radii[None, :]

    px = np.clip((cx + r_arr * cos_a).astype(int), 0, w - 1)
    py = np.clip((cy + r_arr * sin_a).astype(int), 0, h - 1)

    values = gray[py, px].astype(np.float64)
    profile = np.median(values, axis=0)

    if len(profile) < 20:
        black_r = radius * 0.4
    else:
        gradient = np.diff(profile)
        if len(gradient) > 5:
            gradient = np.convolve(gradient, np.ones(5) / 5, mode='same')

        search_start = max(1, int(max_r * 0.15))
        search_end = min(len(gradient), int(max_r * 0.65))

        if search_end > search_start:
            region = gradient[search_start:search_end]
            best_idx = np.argmax(region) + search_start
            black_r = float(best_idx)
        else:
            black_r = radius * 0.4

    # Return GEOMETRIC mask (circle), not brightness-filtered
    # Holes are bright spots INSIDE this geometric region
    black_mask = _circle_mask(h, w, cx, cy, black_r)

    return black_mask, black_r


def _robust_background_stats(pixels: np.ndarray) -> Tuple[float, float]:
    """Compute background median/std using only the darkest 60% of pixels.

    Holes are bright outliers that inflate std dramatically (5→46).
    By using only the lower 60%, we get the true background stats.
    """
    if len(pixels) == 0:
        return 0.0, 1.0
    sorted_px = np.sort(pixels)
    cutoff = max(10, int(len(sorted_px) * 0.6))
    dark_only = sorted_px[:cutoff]
    return float(np.median(dark_only)), float(max(np.std(dark_only), 1.0))


def _detect_bright_holes(
    gray: np.ndarray,
    black_zone: np.ndarray,
    cx: float, cy: float,
    pellet_radius_px: float,
) -> List[FusedHole]:
    """Detect bright white holes in black zone.

    Strategy:
      1. Robust threshold (exclude hole brightness from stats)
      2. Morphological close (fill gaps) then open (kill thin arcs)
      3. Connected components with circularity filter (reject ring arcs)
      4. Distance transform splitting for merged blobs
    """
    if not np.any(black_zone):
        return []

    black_pixels = gray[black_zone]
    bg_median, bg_std = _robust_background_stats(black_pixels)

    # Primary threshold: well above true background noise floor
    thresh_val = bg_median + max(bg_std * 4.0, 25.0)
    thresh_val = min(thresh_val, 200)

    bright = (gray > thresh_val) & black_zone
    binary = bright.astype(np.uint8) * 255

    # Close to fill small gaps within holes
    k = max(3, int(pellet_radius_px * 0.5)) | 1
    close_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, close_kernel)

    # Open to remove thin ring-line arcs (larger kernel = more aggressive)
    ok = max(3, int(pellet_radius_px * 0.4)) | 1
    open_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ok, ok))
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, open_kernel)

    if cv2.countNonZero(binary) == 0:
        # Fallback with lower threshold
        thresh_val = bg_median + max(bg_std * 2.5, 15.0)
        bright = (gray > thresh_val) & black_zone
        binary = bright.astype(np.uint8) * 255
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, close_kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, open_kernel)

    if cv2.countNonZero(binary) == 0:
        return []

    # Connected components to find blobs
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, 8)

    expected_area = math.pi * pellet_radius_px ** 2
    min_area = max(12, expected_area * 0.25)
    max_single = expected_area * 5.0  # single hole max area

    holes: List[FusedHole] = []

    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < min_area:
            continue

        cw = stats[i, cv2.CC_STAT_WIDTH]
        ch = stats[i, cv2.CC_STAT_HEIGHT]
        if cw < 2 or ch < 2:
            continue

        # Circularity: reject elongated arc fragments
        aspect = min(cw, ch) / max(cw, ch)
        bbox_area = cw * ch
        fill_ratio = area / bbox_area if bbox_area > 0 else 0

        # Ring arcs: low aspect ratio (elongated) AND low fill ratio
        # Real holes: roughly square bbox with high fill
        if aspect < 0.35:
            continue
        if aspect < 0.5 and fill_ratio < 0.3:
            continue

        bx = float(centroids[i, 0])
        by = float(centroids[i, 1])

        # Brightness check at centroid
        px_b = int(round(bx))
        py_b = int(round(by))
        h_img, w_img = gray.shape
        if 0 <= px_b < w_img and 0 <= py_b < h_img:
            brightness = float(gray[py_b, px_b])
        else:
            brightness = bg_median + 30  # assume ok if out of bounds

        min_brightness = bg_median + max(bg_std * 3.0, 18.0)

        # For large merged blobs, split with distance transform
        if area > max_single:
            # Extra check: very large low-fill blobs are ring arcs, not merged holes
            if fill_ratio < 0.2:
                continue
            blob_mask = (labels == i).astype(np.uint8) * 255
            sub = _split_blob(blob_mask, pellet_radius_px, 0.7)
            # Cap sub-holes: area/expected gives rough count, but cap at 5
            max_sub = min(5, max(2, int(area / expected_area + 0.5)))
            sub.sort(key=lambda s: s.confidence, reverse=True)
            sub = sub[:max_sub]
            # Validate each sub-hole brightness
            for sh in sub:
                spx, spy = int(round(sh.x)), int(round(sh.y))
                if 0 <= spx < w_img and 0 <= spy < h_img:
                    sb = float(gray[spy, spx])
                    if sb >= min_brightness:
                        holes.append(sh)
            continue

        if brightness < min_brightness:
            # Check mean brightness of blob instead (centroid might miss)
            blob_pixels = gray[labels == i]
            if float(np.mean(blob_pixels)) < min_brightness:
                continue

        brightness_ratio = (brightness - bg_median) / max(1.0, 255 - bg_median)
        conf = min(0.95, 0.5 + brightness_ratio * 0.3 + min(1.0, fill_ratio) * 0.15)

        holes.append(FusedHole(
            x=bx, y=by,
            radius=math.sqrt(area / math.pi),
            confidence=conf,
            methods_agreed=1,
        ))

    return holes


def _detect_dark_holes(
    gray: np.ndarray,
    cream_zone: np.ndarray,
    pellet_radius_px: float,
    cx: float = 0, cy: float = 0,
) -> List[FusedHole]:
    """Detect dark holes in cream/outer zone using SimpleBlobDetector.

    Uses blob detection with circularity/convexity filtering, plus
    axis-line rejection to filter out printed ring numbers (1-8)
    which sit on the cardinal axes of the target.
    """
    if not np.any(cream_zone):
        return []

    h, w = gray.shape
    cream_pixels = gray[cream_zone]
    bg_median = float(np.median(cream_pixels))
    masked = gray.copy()
    masked[~cream_zone] = int(bg_median)

    params = cv2.SimpleBlobDetector_Params()
    params.filterByColor = True
    params.blobColor = 0  # dark blobs
    params.filterByArea = True
    params.minArea = max(25, math.pi * (pellet_radius_px * 0.4) ** 2)
    params.maxArea = math.pi * (pellet_radius_px * 3.5) ** 2
    params.filterByCircularity = True
    params.minCircularity = 0.5
    params.filterByConvexity = True
    params.minConvexity = 0.55
    params.filterByInertia = True
    params.minInertiaRatio = 0.4
    params.minThreshold = 30
    params.maxThreshold = 180
    params.thresholdStep = 10

    detector = cv2.SimpleBlobDetector_create(params)
    keypoints = detector.detect(masked)

    # Axis tolerance: printed ring numbers sit on H/V axes through center
    # Use wider tolerance to catch numbers slightly off-axis due to perspective
    axis_tol = max(pellet_radius_px * 3.0, 25.0)
    # Brightness threshold: real holes are much darker than printed numbers
    hole_dark_thresh = bg_median - 60

    holes = []
    for kp in keypoints:
        kx, ky = kp.pt
        ikx, iky = int(kx), int(ky)
        if not (0 <= iky < h and 0 <= ikx < w and cream_zone[iky, ikx]):
            continue

        brightness = float(gray[iky, ikx])

        # Filter printed ring numbers: they sit on cardinal axes
        on_h_axis = abs(ky - cy) < axis_tol
        on_v_axis = abs(kx - cx) < axis_tol
        if on_h_axis or on_v_axis:
            # Only keep axis blobs if they're very dark (actual holes)
            if brightness > hole_dark_thresh:
                continue

        # General brightness filter: must be noticeably darker than cream
        if brightness > bg_median - 30:
            continue

        brightness_ratio = (bg_median - brightness) / max(1, bg_median)
        conf = min(0.85, 0.4 + brightness_ratio * 0.4)

        holes.append(FusedHole(
            x=float(kx),
            y=float(ky),
            radius=kp.size / 2.0,
            confidence=conf,
            methods_agreed=1,
        ))

    return holes


def _connected_component_holes(
    binary: np.ndarray,
    pellet_radius_px: float,
    base_conf: float = 0.6,
) -> List[FusedHole]:
    """Extract holes via connected components, splitting large blobs."""
    expected_area = math.pi * pellet_radius_px ** 2
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, 8)

    holes = []
    # Very permissive area range
    min_area = max(2, expected_area * 0.03)
    max_single = expected_area * 5.0

    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < min_area:
            continue

        cw = stats[i, cv2.CC_STAT_WIDTH]
        ch = stats[i, cv2.CC_STAT_HEIGHT]
        if cw < 2 or ch < 2:
            continue

        # If blob is much larger than expected, split it
        if area > max_single:
            blob_mask = (labels == i).astype(np.uint8) * 255
            sub = _split_blob(blob_mask, pellet_radius_px, base_conf)
            if sub:
                holes.extend(sub)
                continue

        hx = float(centroids[i, 0])
        hy = float(centroids[i, 1])
        hole_r = math.sqrt(area / math.pi)

        holes.append(FusedHole(
            x=hx, y=hy, radius=hole_r,
            confidence=base_conf,
            methods_agreed=1,
        ))

    return holes


def _split_blob(
    blob_binary: np.ndarray,
    pellet_radius_px: float,
    base_conf: float,
) -> List[FusedHole]:
    """Split a large merged blob into individual holes."""
    dist = cv2.distanceTransform(blob_binary, cv2.DIST_L2, 5)

    # Larger dilation to find only well-separated peaks
    dilation_size = max(5, int(pellet_radius_px * 0.8)) | 1
    dilation_size = min(dilation_size, 15)
    dilated = cv2.dilate(dist, np.ones((dilation_size, dilation_size)))

    # Higher min_r to reject noise peaks and thin bridge regions
    min_r = max(2.0, pellet_radius_px * 0.25)
    peaks = (dist == dilated) & (dist > min_r)
    ys, xs = np.where(peaks)

    if len(xs) == 0:
        M = cv2.moments(blob_binary)
        if M["m00"] > 0:
            return [FusedHole(
                x=M["m10"] / M["m00"], y=M["m01"] / M["m00"],
                radius=pellet_radius_px, confidence=base_conf * 0.8,
                methods_agreed=1,
            )]
        return []

    # Sort by distance transform value (biggest peaks first = most reliable)
    peak_data = [(float(dist[y, x]), float(x), float(y))
                 for x, y in zip(xs.tolist(), ys.tolist())]
    peak_data.sort(reverse=True)

    return [
        FusedHole(x=px, y=py, radius=r,
                  confidence=base_conf, methods_agreed=1)
        for r, px, py in peak_data
    ]


def _deduplicate(holes: List[FusedHole], pellet_radius_px: float) -> List[FusedHole]:
    """Remove near-duplicate detections."""
    if len(holes) <= 1:
        return holes

    merge_dist = max(3.0, pellet_radius_px * 1.5)
    merge_dist_sq = merge_dist * merge_dist

    holes.sort(key=lambda h: h.confidence, reverse=True)
    result = []
    used = [False] * len(holes)

    for i, h in enumerate(holes):
        if used[i]:
            continue
        used[i] = True

        gx = h.x * h.confidence
        gy = h.y * h.confidence
        gw = h.confidence

        for j in range(i + 1, len(holes)):
            if used[j]:
                continue
            dx = h.x - holes[j].x
            dy = h.y - holes[j].y
            if dx * dx + dy * dy < merge_dist_sq:
                used[j] = True
                gx += holes[j].x * holes[j].confidence
                gy += holes[j].y * holes[j].confidence
                gw += holes[j].confidence

        result.append(FusedHole(
            x=gx / gw, y=gy / gw,
            radius=h.radius,
            confidence=min(1.0, h.confidence + 0.05),
            methods_agreed=h.methods_agreed,
        ))

    return result


def _filter_ring_artifacts(
    holes: List[FusedHole], cx: float, cy: float, pellet_radius_px: float
) -> List[FusedHole]:
    """
    Remove shots that form circular arc patterns (ring line artifacts).

    Real shots are scattered; ring artifacts cluster at the same radius.
    If >4 shots share similar distance from center (within tolerance),
    they're likely ring-line fragments.
    """
    if len(holes) <= 5:
        return holes

    tolerance = max(3.0, pellet_radius_px * 0.5)

    # Compute distance from center for each hole
    dists = [math.sqrt((h.x - cx) ** 2 + (h.y - cy) ** 2) for h in holes]

    # Find clusters of shots at the same radius
    sorted_idx = sorted(range(len(dists)), key=lambda i: dists[i])
    artifact_indices = set()

    i = 0
    while i < len(sorted_idx):
        # Find group with similar distance
        group = [sorted_idx[i]]
        j = i + 1
        while j < len(sorted_idx) and dists[sorted_idx[j]] - dists[sorted_idx[i]] < tolerance:
            group.append(sorted_idx[j])
            j += 1

        # If >4 shots at same radius, mark as artifacts (keep best 2)
        if len(group) > 4:
            # Sort group by confidence, keep top 2
            group.sort(key=lambda idx: holes[idx].confidence, reverse=True)
            for idx in group[2:]:
                artifact_indices.add(idx)

        i = j

    return [h for i, h in enumerate(holes) if i not in artifact_indices]
