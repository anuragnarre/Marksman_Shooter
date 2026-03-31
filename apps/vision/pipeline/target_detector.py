"""
Robust target detection via multi-method concentric circle detection.

Optimized for speed: vectorized operations, reduced parameter sweeps,
early exit on confident detection.
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
    """Detect the target using a cascade of robust methods."""
    h, w = gray.shape[:2]
    min_dim = min(h, w)
    spec = get_spec(target_type)

    # Downscale large images for faster detection
    scale = 1.0
    work_gray = gray
    if min_dim > 800:
        scale = 600.0 / min_dim
        work_gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    wh, ww = work_gray.shape[:2]

    # Preprocess: CLAHE for robust contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(work_gray)

    # Method A: Hough circle sweep (reduced params)
    result = _robust_hough_detect(enhanced, wh, ww)

    # Method B: Gradient voting (vectorized)
    if result is None:
        result = _gradient_voting_detect(enhanced, wh, ww)

    # Method C: Contour-based
    if result is None:
        result = _contour_based_detect(enhanced, wh, ww)

    if result is None:
        # All three methods failed — return confidence=0.0 so the caller
        # (analyzer.py) can exit early rather than scoring against a wrong centre.
        cx, cy = w / 2.0, h / 2.0
        r = min_dim * 0.3
        return TargetCalibration(
            center=(cx, cy),
            major_radius=r,
            minor_radius=r,
            rotation_deg=0.0,
            eccentricity=0.0,
            confidence=0.0,
            mm_per_pixel=spec.outer_radius_mm / r,
        )

    cx, cy, radius, confidence = result

    # Scale back to original resolution
    if scale != 1.0:
        cx /= scale
        cy /= scale
        radius /= scale

    # Sanity check: target radius should be 10-50% of image min dimension
    # (targets don't fill the entire frame in real photos)
    max_reasonable_radius = min_dim * 0.48
    if radius > max_reasonable_radius:
        radius = max_reasonable_radius
        confidence *= 0.7

    # Calibrate rings using full-image harmonic analysis
    mm_per_pixel, ring_radii = _calibrate_rings(gray, cx, cy, radius, spec)

    # ring_radii[0] = outer ring (ring 1) in pixels, corrected by harmonic analysis.
    # Use it as the definitive radius (overrides the possibly-wrong Hough radius).
    calibrated_radius = ring_radii[0]

    # Refine center with the corrected radius
    cx, cy = _refine_center_symmetry(gray, cx, cy, calibrated_radius)

    # Estimate perspective using the calibrated, correct radius
    major_r, minor_r, rotation, eccentricity = _estimate_perspective(
        gray, cx, cy, calibrated_radius
    )

    # Clamp: _estimate_perspective can return wildly wrong semi_major when
    # Canny edges in the 80-120% annular zone include the paper boundary or
    # background clutter (causes the green ring to extend beyond the paper).
    if major_r > calibrated_radius * 1.25 or major_r < calibrated_radius * 0.70:
        major_r = calibrated_radius
        minor_r = calibrated_radius
        rotation = 0.0
        eccentricity = 0.0

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


def _robust_hough_detect(
    gray: np.ndarray, img_h: int, img_w: int
) -> Optional[Tuple[float, float, float, float]]:
    """Hough circle detection with fast-first parameter sweep.

    Loop order: param2 high→low (strict→permissive), dp large→small (fast→slow).
    This lets confident real-image detections exit after 2-4 calls instead of
    running all combinations.  param2=15 / dp=1.0 are reserved as last-resort
    fallbacks for very low-contrast targets.
    """
    min_dim = min(img_h, img_w)
    best = None
    best_score = -1.0

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Precompute Canny edges once — shared by all _verify_circle_edge calls
    # below (the helper recomputes internally; keep the shared one for the
    # fast-path edge check we do inline before calling the helper).
    # Note: _verify_circle_edge recomputes its own blur+Canny on purpose so it
    # can use a tighter blurring kernel; we don't override that.

    # Ordered: strict (fast) → permissive (slow).
    # dp=2.0 builds a half-res accumulator (4× fewer cells) — very fast first pass.
    for param2 in [80, 50, 30, 15]:
        for dp in [2.0, 1.5, 1.0]:
            for min_r_frac, max_r_frac in [(0.08, 0.45), (0.15, 0.55)]:
                min_r = max(20, int(min_dim * min_r_frac))
                max_r = int(min_dim * max_r_frac)
                if min_r >= max_r:
                    continue

                circles = cv2.HoughCircles(
                    blurred,
                    cv2.HOUGH_GRADIENT,
                    dp=dp,
                    minDist=min_dim // 3,
                    param1=100,
                    param2=param2,
                    minRadius=min_r,
                    maxRadius=max_r,
                )

                if circles is None:
                    continue

                for c in circles[0][:5]:  # Only check top 5
                    cx, cy, r = float(c[0]), float(c[1]), float(c[2])
                    dist_from_center = np.sqrt(
                        (cx - img_w / 2) ** 2 + (cy - img_h / 2) ** 2
                    )
                    center_score = 1.0 - min(1.0, dist_from_center / (min_dim * 0.4))
                    size_score = max(0.0, min(1.0, 1.0 - abs(r / (min_dim * 0.25) - 1.0) * 0.5))
                    edge_score = _verify_circle_edge(gray, cx, cy, r)
                    score = center_score * 0.25 + size_score * 0.25 + edge_score * 0.5

                    if score > best_score:
                        best_score = score
                        best = (cx, cy, r, min(1.0, score * 1.2))

                # Early exit: real targets typically score > 0.5 on the first
                # strict pass (param2=80); skip the slow fallback calls.
                if best_score > 0.5:
                    return best

    if best is not None and best_score > 0.2:
        return best
    return None


def _gradient_voting_detect(
    gray: np.ndarray, img_h: int, img_w: int
) -> Optional[Tuple[float, float, float, float]]:
    """Vectorized gradient direction voting for center detection."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 1.5)
    gx = cv2.Sobel(blurred, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(blurred, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx ** 2 + gy ** 2)

    mag_thresh = np.percentile(mag, 90)
    ys, xs = np.where(mag > mag_thresh)
    if len(ys) < 100:
        return None

    # Subsample
    if len(ys) > 3000:
        idx = np.random.RandomState(42).choice(len(ys), 3000, replace=False)
        ys, xs = ys[idx], xs[idx]

    # Normalize gradients
    m = mag[ys, xs]
    dx = (gx[ys, xs] / m).astype(np.float32)
    dy = (gy[ys, xs] / m).astype(np.float32)

    # Vectorized: cast votes at multiple distances at once
    scale = 4
    acc_h, acc_w = img_h // scale, img_w // scale
    accumulator = np.zeros((acc_h, acc_w), dtype=np.float32)

    dists = np.arange(20, min(img_h, img_w) // 2, 5, dtype=np.float32)  # Coarser steps
    for sign in [-1.0, 1.0]:
        for d in dists:
            vx = ((xs + sign * dx * d) / scale).astype(np.int32)
            vy = ((ys + sign * dy * d) / scale).astype(np.int32)
            valid = (vx >= 0) & (vx < acc_w) & (vy >= 0) & (vy < acc_h)
            np.add.at(accumulator, (vy[valid], vx[valid]), 1.0)

    if accumulator.max() < 10:
        return None

    accumulator = cv2.GaussianBlur(accumulator, (11, 11), 3)
    _, max_val, _, max_loc = cv2.minMaxLoc(accumulator)

    cx = (max_loc[0] + 0.5) * scale
    cy = (max_loc[1] + 0.5) * scale

    radius = _estimate_radius_from_center(gray, cx, cy)
    if radius is None:
        return None

    confidence = min(1.0, max_val / (accumulator.mean() + 1) * 0.1)
    return (cx, cy, radius, max(0.3, confidence))


def _contour_based_detect(
    gray: np.ndarray, img_h: int, img_w: int
) -> Optional[Tuple[float, float, float, float]]:
    """Detect target via concentric circular contours."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 1.5)
    binary = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 5
    )

    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    circles = []
    for cnt in contours:
        if len(cnt) < 30:
            continue
        area = cv2.contourArea(cnt)
        perimeter = cv2.arcLength(cnt, True)
        if perimeter < 1:
            continue
        circularity = 4 * np.pi * area / (perimeter ** 2)
        if circularity < 0.5:
            continue
        if len(cnt) < 5:
            continue

        (ex, ey), (ma, MA), angle = cv2.fitEllipse(cnt)
        if ma < 1 or MA < 1:
            continue
        if min(ma, MA) / max(ma, MA) < 0.6:
            continue
        r = (ma + MA) / 4.0
        circles.append((ex, ey, r, circularity))

    if not circles:
        return None

    # Find concentric cluster
    best_cx, best_cy, best_r = 0.0, 0.0, 0.0
    best_count = 0

    for i, (cx1, cy1, r1, _) in enumerate(circles):
        count = 0
        max_r = r1
        for j, (cx2, cy2, r2, _) in enumerate(circles):
            if i == j:
                continue
            dist = np.sqrt((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2)
            if dist < min(r1, r2) * 0.3:
                count += 1
                max_r = max(max_r, r2)
        if count > best_count:
            best_count = count
            best_cx, best_cy, best_r = cx1, cy1, max_r

    if best_count < 2:
        return None

    confidence = min(1.0, best_count / 5.0 * 0.6 + 0.3)
    return (best_cx, best_cy, best_r, confidence)


def _verify_circle_edge(
    gray: np.ndarray, cx: float, cy: float, r: float
) -> float:
    """Vectorized edge verification along expected circle."""
    h, w = gray.shape[:2]
    angles = np.linspace(0, 2 * np.pi, 36, endpoint=False)  # 36 samples (was 72)
    offsets = np.array([-2, -1, 0, 1, 2], dtype=np.float32)

    # Precompute edge map once
    blurred = cv2.GaussianBlur(gray, (3, 3), 1)
    edges = cv2.Canny(blurred, 50, 150)

    cos_a = np.cos(angles)
    sin_a = np.sin(angles)
    on_edge = 0
    total = 0

    for dr in offsets:
        px = np.clip((cx + (r + dr) * cos_a).astype(int), 0, w - 1)
        py = np.clip((cy + (r + dr) * sin_a).astype(int), 0, h - 1)
        total += len(px)
        on_edge += np.count_nonzero(edges[py, px])

    return on_edge / max(1, total)


def _estimate_radius_from_center(
    gray: np.ndarray, cx: float, cy: float
) -> Optional[float]:
    """Vectorized radial profile for radius estimation."""
    h, w = gray.shape[:2]
    max_r = int(min(cx, cy, w - cx, h - cy) * 0.9)
    if max_r < 30:
        return None

    profile = _compute_radial_profile(gray, cx, cy, max_r, num_angles=36)

    grad = np.abs(np.diff(profile))
    smoothed_grad = cv2.GaussianBlur(
        grad.reshape(1, -1).astype(np.float32), (1, 15), 0
    ).flatten()

    thresh = np.percentile(smoothed_grad, 80)
    peaks = np.where(smoothed_grad > thresh)[0]
    if len(peaks) == 0:
        return None

    last_peak = float(peaks[-1])
    return last_peak if last_peak >= 20 else None


def _compute_radial_profile(
    gray: np.ndarray, cx: float, cy: float, max_r: int, num_angles: int = 36
) -> np.ndarray:
    """Vectorized radial intensity profile computation."""
    h, w = gray.shape[:2]
    angles = np.linspace(0, 2 * np.pi, num_angles, endpoint=False)
    radii = np.arange(max_r, dtype=np.float32)

    # Create coordinate grids: (num_angles, max_r)
    cos_a = np.cos(angles)[:, None]  # (A, 1)
    sin_a = np.sin(angles)[:, None]  # (A, 1)
    r = radii[None, :]              # (1, R)

    px = (cx + r * cos_a).astype(np.int32)  # (A, R)
    py = (cy + r * sin_a).astype(np.int32)  # (A, R)

    # Clip and sample
    valid = (px >= 0) & (px < w) & (py >= 0) & (py < h)
    px = np.clip(px, 0, w - 1)
    py = np.clip(py, 0, h - 1)

    values = gray[py, px].astype(np.float64)
    values[~valid] = 0

    counts = valid.astype(np.float64).sum(axis=0)
    counts[counts == 0] = 1
    profile = values.sum(axis=0) / counts

    return profile


def _refine_center_symmetry(
    gray: np.ndarray, cx: float, cy: float, radius: float
) -> Tuple[float, float]:
    """Refine center using radial profile symmetry (3 iterations max)."""
    h, w = gray.shape[:2]

    for _ in range(3):
        sample_r = int(min(radius * 0.8, min(cx, cy, w - cx, h - cy) - 1))
        if sample_r < 20:
            break

        # Horizontal symmetry
        y_int = int(round(cy))
        x_lo = max(0, int(cx - sample_r))
        x_hi = min(w, int(cx + sample_r))
        if 0 <= y_int < h and x_hi > x_lo:
            strip = gray[y_int, x_lo:x_hi].astype(np.float64)
            mid = int(cx - x_lo)
            if 5 <= mid < len(strip) - 5:
                left = strip[:mid][::-1]
                right = strip[mid:]
                ml = min(len(left), len(right))
                if ml > 5:
                    best_shift, best_corr = 0, -1.0
                    for shift in range(-3, 4):
                        nmid = mid + shift
                        if nmid < 5 or nmid >= len(strip) - 5:
                            continue
                        l = strip[:nmid][::-1][:ml]
                        r = strip[nmid:][:ml]
                        corr = float(np.corrcoef(l, r)[0, 1]) if len(l) == len(r) else 0
                        if corr > best_corr:
                            best_corr = corr
                            best_shift = shift
                    cx += best_shift * 0.5

        # Vertical symmetry
        x_int = int(round(cx))
        y_lo = max(0, int(cy - sample_r))
        y_hi = min(h, int(cy + sample_r))
        if 0 <= x_int < w and y_hi > y_lo:
            strip = gray[y_lo:y_hi, x_int].astype(np.float64)
            mid = int(cy - y_lo)
            if 5 <= mid < len(strip) - 5:
                top = strip[:mid][::-1]
                bottom = strip[mid:]
                ml = min(len(top), len(bottom))
                if ml > 5:
                    best_shift, best_corr = 0, -1.0
                    for shift in range(-3, 4):
                        nmid = mid + shift
                        if nmid < 5 or nmid >= len(strip) - 5:
                            continue
                        t = strip[:nmid][::-1][:ml]
                        b = strip[nmid:][:ml]
                        corr = float(np.corrcoef(t, b)[0, 1]) if len(t) == len(b) else 0
                        if corr > best_corr:
                            best_corr = corr
                            best_shift = shift
                    cy += best_shift * 0.5

    return (cx, cy)


def _calibrate_rings(
    gray: np.ndarray, cx: float, cy: float, radius: float, spec: TargetSpec
) -> Tuple[float, List[float]]:
    """
    Compute mm_per_pixel using harmonic period analysis on the full radial profile.

    Key improvement over previous version: extend the profile to the full
    image boundary (not radius * 1.3), then search for the period k
    (ring_width_px) that explains the most gradient peaks via arithmetic
    progression.  This self-corrects when the initial radius guess is wrong
    (e.g. Hough found ring 3 instead of ring 1).
    """
    simple_ratio = spec.outer_radius_mm / max(radius, 1.0)
    h, w = gray.shape[:2]

    # Extend profile to near-full image boundary (was capped at radius * 1.3)
    max_r = int(min(cx, cy, w - cx, h - cy) * 0.96)
    max_r = max(max_r, int(radius * 1.5), 30)

    profile = _compute_radial_profile(gray, cx, cy, max_r, num_angles=60)

    # Smooth then compute gradient magnitude.
    # Kernel must suppress sub-ring features (shot holes ~5-10px) while preserving
    # ring-boundary peaks (~ring_width_px wide). Scale by estimated ring width.
    estimated_ring_px = spec.ring_width_mm / simple_ratio
    # (ks, 1) blurs along columns of a (1, N) row-vector; (1, ks) would blur
    # vertically and have zero effect on a single-row image.
    ks = max(9, int(estimated_ring_px * 1.0) | 1)
    smoothed = cv2.GaussianBlur(
        profile.reshape(1, -1).astype(np.float32), (ks, 1), 0
    ).flatten()
    gradient = np.abs(np.diff(smoothed))

    # Find all candidate ring-boundary peaks
    min_gap = max(8, int(radius / spec.num_rings * 0.3))
    threshold = np.percentile(gradient, 70)
    peaks: List[float] = []
    i = 0
    while i < len(gradient):
        if gradient[i] > threshold:
            j = i
            while j < len(gradient) - 1 and gradient[j + 1] >= gradient[j]:
                j += 1
            if gradient[j] > threshold:
                peaks.append(float(j))
            i = j + min_gap
        else:
            i += 1

    if len(peaks) < 3:
        ring_radii = [spec.ring_radius_mm(n) / simple_ratio
                      for n in range(1, spec.num_rings + 1)]
        return simple_ratio, ring_radii

    # ── Harmonic period search ─────────────────────────────────────────────
    # ISSF rings are evenly spaced at ring_width_mm per ring.
    # Gradient peaks should form an arithmetic progression with period k = ring_width_px.
    ring_width_mm = spec.ring_width_mm
    # k_min raised from ring_width/0.18 to ring_width/0.12 (or 20px minimum):
    # Ring lines are ~0.3mm wide, which at typical resolution creates two gradient
    # peaks separated by ~0.3mm/mm_per_px ≈ 6-18px.  The sub-ring-spacing period
    # formed by these double-peaks (≈15-19px) would otherwise win the harmonic
    # search.  The 20px floor excludes ring-line-width artifacts for all targets.
    k_min = max(20.0, ring_width_mm / 0.12)  # minimum 20px to skip line-width artifacts
    k_max = min(float(max_r) / 2, ring_width_mm / 0.025)  # coarsest (0.025 mm/px)

    peaks_arr = np.array(peaks, dtype=np.float64)
    best_k: Optional[float] = None
    best_count = 0
    best_p0 = 0.0

    # Scan from LARGEST k (coarsest scale) to smallest (finest).
    # This finds the FUNDAMENTAL ring-spacing period first, before its harmonics
    # (sub-ring-spacing periods that can achieve equal counts but wrong scale).
    for k in np.arange(k_max, k_min, -0.5):
        tol = k * 0.18
        for p0 in peaks:
            offsets = (peaks_arr - p0) % k
            count = int(np.sum((offsets <= tol) | (offsets >= k - tol)))
            if count > best_count:
                best_count = count
                best_k = k
                best_p0 = p0

    mm_per_pixel = simple_ratio

    if best_k is not None and best_count >= 4:
        mm_harmonic = ring_width_mm / best_k
        # Find outermost peak that fits the harmonic pattern
        tol = best_k * 0.18
        offsets = (peaks_arr - best_p0) % best_k
        fitting = peaks_arr[(offsets <= tol) | (offsets >= best_k - tol)]
        if len(fitting):
            # Recompute ring-1 radius in pixels from harmonic mm_per_pixel
            ring1_px = spec.outer_radius_mm / mm_harmonic
            # Accept only if harmonic result is at least as large as Hough radius
            # (harmonic should enlarge/confirm, never shrink the detected target)
            # and is not wildly outside the image.  The upper bound is relaxed to
            # 1.10 × max_r so that ring-1 is accepted even when it falls right at
            # the image edge (e.g. synthetic images where ring-1 == image boundary).
            if ring1_px >= radius * 0.9 and ring1_px < max_r * 1.10:
                mm_per_pixel = mm_harmonic

    # Hard clamp: never more than 3× off from simple-ratio baseline
    mm_per_pixel = float(np.clip(mm_per_pixel, simple_ratio / 3.0, simple_ratio * 3.0))

    ring_radii = [spec.ring_radius_mm(n) / mm_per_pixel
                  for n in range(1, spec.num_rings + 1)]
    return mm_per_pixel, ring_radii


def _estimate_perspective(
    gray: np.ndarray, cx: float, cy: float, radius: float
) -> Tuple[float, float, float, float]:
    """Estimate perspective from outer-ring ellipse."""
    h, w = gray.shape[:2]

    inner_r = int(radius * 0.80)
    outer_r = int(radius * 1.20)

    y_lo = max(0, int(cy - outer_r))
    y_hi = min(h, int(cy + outer_r + 1))
    x_lo = max(0, int(cx - outer_r))
    x_hi = min(w, int(cx + outer_r + 1))

    roi = gray[y_lo:y_hi, x_lo:x_hi]
    if roi.size == 0:
        return (radius, radius, 0.0, 0.0)

    roi_h, roi_w = roi.shape[:2]
    ys, xs = np.ogrid[:roi_h, :roi_w]
    dists = np.sqrt((xs - (cx - x_lo)) ** 2 + (ys - (cy - y_lo)) ** 2)
    annular_mask = ((dists >= inner_r) & (dists <= outer_r)).astype(np.uint8) * 255

    blurred = cv2.GaussianBlur(roi, (5, 5), 1.5)
    edges = cv2.Canny(blurred, 40, 120)
    edges = cv2.bitwise_and(edges, annular_mask)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

    all_points = [cnt for cnt in contours if len(cnt) >= 3]
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
