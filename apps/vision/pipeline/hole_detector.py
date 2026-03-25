"""
Bullet-hole detection using disc-convolution matched filter.

Approach (reverse-engineered from TargetScan):
  1. Inpaint ring numbers at known cardinal positions (prevents false positives)
  2. Build signal image:
       - Black zone  → subtract dark background   → bright = light-through-hole
       - Cream zone  → subtract from cream median → bright = dark-hole-in-cream
  3. Convolve with a filled disc kernel of visible_hole_radius
     (matched filter: peak response = circular signal of right size)
  4. Find peaks in the accumulator via greedy NMS
  5. Deduplicate across zones; remove ring-arc artefacts
"""

import math
from typing import List, Optional, Tuple

import cv2
import numpy as np

from .types import FusedHole, TargetCalibration


# ─── public API ────────────────────────────────────────────────────────────────

def detect_holes(
    gray: np.ndarray,
    calibration: TargetCalibration,
    pellet_diameter_mm: float = 4.5,
    diff_img: Optional[np.ndarray] = None,
) -> List[FusedHole]:
    """Detect bullet holes using disc-convolution matched filter."""
    cx, cy = calibration.center
    radius = calibration.major_radius

    if radius < 10:
        return []

    h, w = gray.shape[:2]
    target_mask = _circle_mask(h, w, cx, cy, radius * 1.02)

    # ── Scale calibration ──────────────────────────────────────────────────────
    mm_per_pixel = calibration.mm_per_pixel
    if mm_per_pixel < 0.005 or mm_per_pixel > 5.0:
        mm_per_pixel = 22.75 / max(radius, 1)

    pellet_radius_px = (pellet_diameter_mm / 2.0) / mm_per_pixel
    pellet_radius_px = max(4.0, pellet_radius_px)

    # Visible hole radius in each zone
    # Black zone: torn paper → bright disc, visible ≈ 45% of physical pellet radius
    # Cream zone: dark patch, visible ≈ 30% of physical pellet radius
    visible_r_black = max(4.0, pellet_radius_px * 0.45)
    visible_r_cream = max(4.0, pellet_radius_px * 0.30)

    ring_width_px = 2.5 / mm_per_pixel  # ISSF ring width in pixels

    # Ring boundary radii (for inpainting + filtering)
    ring_radii_px = list(calibration.ring_radii)
    if not ring_radii_px:
        from .target_specs import get_spec
        spec = get_spec("air_rifle_10m")
        ring_radii_px = [spec.ring_radius_mm(n) / mm_per_pixel for n in range(1, spec.num_rings + 1)]

    # ── Find black centre zone ─────────────────────────────────────────────────
    black_zone, black_radius = _find_black_zone(gray, cx, cy, radius, target_mask)
    cream_zone = target_mask & ~black_zone

    # ── Erode zone edges to avoid ring-boundary contamination ─────────────────
    ek_b = max(3, int(visible_r_black * 0.30)) | 1
    ek_c = max(3, int(visible_r_cream * 0.30)) | 1
    black_roi = cv2.erode(black_zone.astype(np.uint8) * 255,
                          cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ek_b, ek_b))) > 0
    cream_roi = cv2.erode(cream_zone.astype(np.uint8) * 255,
                          cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ek_c, ek_c))) > 0

    # ── Inpaint ring numbers BEFORE detection ─────────────────────────────────
    gray_clean = _inpaint_ring_features(gray, cx, cy, ring_radii_px, ring_width_px, black_radius)

    # ── Fill ring boundary lines in cream zone ─────────────────────────────────
    # Replaces the ring-line dark signal with local cream background so the disc
    # filter never sees ring arcs. Real holes at ring radii survive because their
    # signal comes from the hole interior, not the ring line.
    gray_cream = _fill_ring_lines(gray_clean, cx, cy, ring_radii_px, ring_width_px, black_radius)

    # ── Detect holes via disc convolution ─────────────────────────────────────
    candidates: List[FusedHole] = []

    holes_black = _detect_disc(gray_clean, black_roi, cx, cy,
                                visible_r_black, pellet_radius_px, bright=True)
    candidates.extend(holes_black)

    # Ring suppression not needed: ring lines are already filled in gray_cream
    holes_cream = _detect_disc(gray_cream, cream_roi, cx, cy,
                                visible_r_cream, pellet_radius_px, bright=False,
                                ring_radii_px=ring_radii_px,
                                ring_suppress_px=0.0)
    candidates.extend(holes_cream)

    # ── Centre exclusion (printed 10-ring dot) ─────────────────────────────────
    centre_excl = max(visible_r_black * 0.6, black_radius * 0.02)
    candidates = [
        c for c in candidates
        if math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2) > centre_excl
    ]

    # ── Deduplicate ────────────────────────────────────────────────────────────
    merge_r = min(visible_r_black, visible_r_cream)
    candidates = _deduplicate(candidates, merge_r)

    # ── Boundary filter ────────────────────────────────────────────────────────
    if ring_radii_px:
        outer_r = ring_radii_px[0]  # ring 1 outer edge in pixels
    else:
        outer_r = radius
    max_dist_sq = outer_r ** 2
    candidates = [
        c for c in candidates
        if (c.x - cx) ** 2 + (c.y - cy) ** 2 <= max_dist_sq
    ]

    # ── Remove ring-arc patterns ───────────────────────────────────────────────
    candidates = _filter_ring_artifacts(candidates, cx, cy, min(visible_r_black, visible_r_cream))

    return candidates


# ─── zone helpers ──────────────────────────────────────────────────────────────

def _circle_mask(h: int, w: int, cx: float, cy: float, r: float) -> np.ndarray:
    yy, xx = np.ogrid[:h, :w]
    return ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2


def _find_black_zone(
    gray: np.ndarray, cx: float, cy: float, radius: float,
    target_mask: np.ndarray,
) -> Tuple[np.ndarray, float]:
    """Locate the filled black centre zone via radial median profile."""
    h, w = gray.shape[:2]
    max_r = int(radius)
    if max_r < 10:
        return np.zeros((h, w), dtype=bool), 0.0

    angles = np.linspace(0, 2 * np.pi, 36, endpoint=False)
    radii  = np.arange(0, max_r)
    cos_a  = np.cos(angles)[:, None]
    sin_a  = np.sin(angles)[:, None]
    r_arr  = radii[None, :]
    px = np.clip((cx + r_arr * cos_a).astype(int), 0, w - 1)
    py = np.clip((cy + r_arr * sin_a).astype(int), 0, h - 1)
    profile = np.median(gray[py, px].astype(np.float64), axis=0)

    if len(profile) < 20:
        black_r = radius * 0.40
    else:
        gradient = np.diff(profile)
        if len(gradient) > 5:
            gradient = np.convolve(gradient, np.ones(5) / 5, mode='same')
        s = max(1, int(max_r * 0.15))
        e = min(len(gradient), int(max_r * 0.65))
        if e > s:
            black_r = float(np.argmax(gradient[s:e]) + s)
        else:
            black_r = radius * 0.40

    return _circle_mask(h, w, cx, cy, black_r), black_r


# ─── ring number / line inpainting ────────────────────────────────────────────

def _inpaint_ring_features(
    gray: np.ndarray,
    cx: float, cy: float,
    ring_radii_px: List[float],
    ring_width_px: float,
    black_radius: float = 0.0,
) -> np.ndarray:
    """
    Inpaint CREAM-ZONE ring number positions so they don't appear as holes.

    Inpaints at two positions per ring band:
      - Band midpoint (between two ring boundaries): where numbers are usually printed
      - Ring boundary itself: some targets print numbers directly on the ring line
    Only cream-zone positions (radius > black_radius) are inpainted.
    Background is sampled from the same ring radius at ±45° offsets.
    """
    result = gray.astype(np.float32).copy()
    h, w = gray.shape[:2]

    num_r_mid = max(5, int(ring_width_px * 0.65))   # Inpaint radius at midpoint
    num_r_bnd = max(4, int(ring_width_px * 0.40))   # Inpaint radius at boundary

    angles_rad = [0.0, math.pi / 2, math.pi, 3 * math.pi / 2]

    def _inpaint_at(ring_r: float, inpaint_r: int) -> None:
        if ring_r <= black_radius * 1.05:
            return
        for angle in angles_rad:
            nx = int(round(cx + ring_r * math.cos(angle)))
            ny = int(round(cy + ring_r * math.sin(angle)))
            if not (0 <= ny < h and 0 <= nx < w):
                continue
            bg_samples: List[float] = []
            ss = max(4, inpaint_r // 2)
            for off in (math.pi / 4, -math.pi / 4, 3 * math.pi / 4, -3 * math.pi / 4):
                sa = angle + off
                sx = int(round(cx + ring_r * math.cos(sa)))
                sy = int(round(cy + ring_r * math.sin(sa)))
                y1, y2 = max(0, sy - ss), min(h, sy + ss + 1)
                x1, x2 = max(0, sx - ss), min(w, sx + ss + 1)
                if y2 > y1 and x2 > x1:
                    bg_samples.append(float(np.median(gray[y1:y2, x1:x2])))
            bg_val = float(np.mean(bg_samples)) if bg_samples else float(np.median(gray))
            cv2.circle(result, (nx, ny), inpaint_r, bg_val, -1)

    # Midpoint of each ring band
    for i in range(len(ring_radii_px) - 1):
        mid_r = (ring_radii_px[i] + ring_radii_px[i + 1]) / 2.0
        _inpaint_at(mid_r, num_r_mid)

    # Ring boundary positions (numbers printed near ring lines on some targets)
    for r_px in ring_radii_px:
        _inpaint_at(r_px, num_r_bnd)

    return result.astype(np.uint8)


def _fill_ring_lines(
    gray: np.ndarray,
    cx: float, cy: float,
    ring_radii_px: List[float],
    ring_width_px: float,
    black_radius: float,
) -> np.ndarray:
    """
    Fill cream-zone ring boundary lines with local background before disc detection.

    Ring lines are dark printed arcs at known radii. The disc filter cannot
    distinguish them from bullet holes, so we paint them with the cream
    background sampled from adjacent ring-band midpoints BEFORE running the
    filter. Only actual dark holes remain after filling.

    Strategy (vectorised):
      For each cream-zone ring boundary r_i:
        mask  = pixels where |dist_from_centre - r_i| ≤ half_w
        fill  = average of gray sampled at (r_i - offset) and (r_i + offset)
                where offset = ring_width_px * 0.45 (ring-band midpoints)
    """
    h, w = gray.shape[:2]
    result = gray.astype(np.float32).copy()

    yy, xx = np.ogrid[:h, :w]
    dx = xx.astype(np.float32) - cx
    dy = yy.astype(np.float32) - cy
    dists = np.sqrt(dx ** 2 + dy ** 2)

    safe_dists = np.where(dists > 0.5, dists, 1.0)
    cos_a = dx / safe_dists
    sin_a = dy / safe_dists

    half_w = 3.0          # ±3 px covers ISSF ring line (0.3–0.5 mm @ phone scale)
    offset = ring_width_px * 0.45   # sample from ~centre of adjacent bands

    for r in ring_radii_px:
        if r <= black_radius * 0.88:
            continue   # skip ring lines clearly inside the black zone (white-on-black, not cream arcs)

        mask = (np.abs(dists - r) <= half_w) & (dists > 0.5)
        if not np.any(mask):
            continue

        # Sample inner band midpoint (closer to centre)
        r_in = max(1.0, r - offset)
        sx_in = np.clip(np.round(cx + r_in * cos_a).astype(int), 0, w - 1)
        sy_in = np.clip(np.round(cy + r_in * sin_a).astype(int), 0, h - 1)

        # Sample outer band midpoint (further from centre)
        r_out = r + offset
        sx_out = np.clip(np.round(cx + r_out * cos_a).astype(int), 0, w - 1)
        sy_out = np.clip(np.round(cy + r_out * sin_a).astype(int), 0, h - 1)

        fill = (gray[sy_in, sx_in].astype(np.float32) +
                gray[sy_out, sx_out].astype(np.float32)) * 0.5
        result[mask] = fill[mask]

    return result.astype(np.uint8)


# ─── disc convolution detector ─────────────────────────────────────────────────

def _fill_ratio_check(signal: np.ndarray, cx: float, cy: float, r: float) -> float:
    """
    Fraction of pixels within disc-radius r around (cx, cy) where signal > 20% of disc peak.

    Real holes are uniformly-filled dark (cream zone) or bright (black zone) discs
    → fill ratio typically 0.55–0.85.

    Ink strokes, ring-boundary arcs, and handwriting only partially cover the disc
    → fill ratio typically 0.10–0.35.

    Uses the pre-computed signal map (bg_local – img_f or img_f – bg_med) so the
    check is invariant to global brightness and local illumination gradients.
    """
    h, w = signal.shape
    ir = max(2, int(round(r)))
    ix, iy = int(round(cx)), int(round(cy))
    y1, y2 = max(0, iy - ir), min(h, iy + ir + 1)
    x1, x2 = max(0, ix - ir), min(w, ix + ir + 1)
    if y2 <= y1 or x2 <= x1:
        return 0.0
    patch = signal[y1:y2, x1:x2]
    py0, px0 = iy - y1, ix - x1
    yy, xx = np.ogrid[:patch.shape[0], :patch.shape[1]]
    disc = (yy - py0) ** 2 + (xx - px0) ** 2 <= ir ** 2
    if not np.any(disc):
        return 0.0
    vals = patch[disc]
    peak = float(vals.max())
    if peak <= 0:
        return 0.0
    return float(np.sum(vals > peak * 0.20)) / float(disc.sum())


def _disc_kernel(radius_px: float) -> np.ndarray:
    """Normalised filled disc kernel (matched filter for circular holes)."""
    r = max(1, int(round(radius_px)))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)).astype(np.float32)
    k /= k.sum()
    return k


def _find_acc_peaks(
    acc: np.ndarray,
    min_sep_px: float,
    threshold: float,
) -> List[Tuple[float, float]]:
    """Greedy NMS on accumulator image; returns (x, y) list sorted by value."""
    nms_sz = max(3, int(min_sep_px * 1.6) | 1)
    dilated = cv2.dilate(acc, np.ones((nms_sz, nms_sz), np.float32))
    local_max = (acc >= dilated - 1e-4) & (acc > threshold)
    ys, xs = np.where(local_max)
    if not len(ys):
        return []
    vals = sorted(
        [(acc[y, x], float(x), float(y)) for y, x in zip(ys.tolist(), xs.tolist())],
        reverse=True,
    )
    # Greedy NMS with min separation
    min_sep_sq = min_sep_px ** 2
    kept: List[Tuple[float, float, float]] = []
    for v, px, py in vals:
        if all((px - kx) ** 2 + (py - ky) ** 2 >= min_sep_sq for _, kx, ky in kept):
            kept.append((v, px, py))
    return [(px, py) for _, px, py in kept]


def _suppress_ring_boundaries(
    acc: np.ndarray,
    cx: float, cy: float,
    ring_radii_px: List[float],
    suppress_px: float,
) -> np.ndarray:
    """Zero out accumulator values near known ring boundary radii."""
    if not ring_radii_px or suppress_px <= 0:
        return acc
    h, w = acc.shape
    yy, xx = np.ogrid[:h, :w]
    dists = np.sqrt((xx.astype(np.float32) - cx) ** 2 +
                    (yy.astype(np.float32) - cy) ** 2)
    mask = np.zeros((h, w), dtype=bool)
    for r in ring_radii_px:
        mask |= np.abs(dists - r) <= suppress_px
    result = acc.copy()
    result[mask] = 0.0
    return result


def _detect_disc(
    gray: np.ndarray,
    zone_mask: np.ndarray,
    cx: float, cy: float,
    visible_r: float,
    pellet_radius_px: float,
    bright: bool,
    max_holes: int = 30,
    ring_radii_px: Optional[List[float]] = None,
    ring_suppress_px: float = 0.0,
) -> List[FusedHole]:
    """
    Detect holes using disc-matched-filter convolution.

    bright=True  → black zone (holes are BRIGHTER than background)
    bright=False → cream zone (holes are DARKER  than background)
    """
    if not np.any(zone_mask):
        return []

    h, w = gray.shape[:2]
    zone_pixels = gray[zone_mask]
    bg_med = float(np.median(zone_pixels))
    bg_std = float(max(np.std(zone_pixels), 1.0))

    if bright:
        gray_smooth = cv2.bilateralFilter(gray, d=5, sigmaColor=25, sigmaSpace=5)
        img_f = gray_smooth.astype(np.float32)
        signal = np.where(zone_mask, np.clip(img_f - bg_med, 0.0, None), 0.0).astype(np.float32)
        min_signal = max(bg_std * 2.5, 15.0)
    else:
        gray_smooth = cv2.GaussianBlur(gray, (5, 5), 1.5)
        img_f = gray_smooth.astype(np.float32)
        sigma_bg = (ring_radii_px[0] / 8.0) if ring_radii_px else (visible_r * 5.0)
        bg_local = cv2.GaussianBlur(gray_smooth, (0, 0), sigma_bg).astype(np.float32)
        residual_pixels = (bg_local - img_f)[zone_mask]
        bg_std = float(max(np.std(residual_pixels), 1.0))
        signal = np.where(zone_mask, np.clip(bg_local - img_f, 0.0, None), 0.0).astype(np.float32)
        min_signal = max(bg_std * 1.8, 12.0)

    # Disc convolution (matched filter at visible_r)
    kernel = _disc_kernel(visible_r)
    acc = cv2.filter2D(signal, cv2.CV_32F, kernel)
    acc = np.where(zone_mask, acc, 0.0).astype(np.float32)

    # Suppress accumulator near ring boundaries
    if ring_radii_px and ring_suppress_px > 0:
        acc = _suppress_ring_boundaries(acc, cx, cy, ring_radii_px, ring_suppress_px)

    acc_max = float(acc.max())
    if acc_max < min_signal * 0.20:
        return []

    if bright:
        # Black zone: lower threshold so weaker shots in a tight group aren't cut off.
        # Smaller NMS separation so closely-spaced shots are found individually.
        threshold = max(min_signal * 0.18, acc_max * 0.20)
        nms_sep = visible_r * 1.0
    else:
        # Cream zone: higher threshold to suppress ring-arc / dirt false positives.
        # Larger NMS separation because real cream-zone hits are well-separated.
        threshold = max(min_signal * 0.25, acc_max * 0.35)
        nms_sep = visible_r * 2.5
    peaks = _find_acc_peaks(acc, nms_sep, threshold)

    # ── Cream-zone: precompute connected components for size-based rejection ──
    # Real holes are small isolated blobs (~physical pellet area).
    # Cursive writing forms enormous connected components (all letters join).
    # The CC bounding box distinguishes: writing spans hundreds of pixels,
    # holes span ~2× pellet diameter.
    # Threshold is low (min_signal*0.4) because cream pixels between holes and
    # ring lines have near-zero signal → holes and ring arcs are SEPARATE CCs.
    if not bright:
        _cc_thresh = min_signal * 0.40
        _cc_bin = (signal > _cc_thresh).astype(np.uint8)
        _, _cc_labels, _cc_stats, _ = cv2.connectedComponentsWithStats(_cc_bin, connectivity=8)
        # Max bounding-box extent: real holes fit within 3× pellet diameter.
        # Cursive writing / large marks span > 5× pellet diameter.
        _max_cc_extent = pellet_radius_px * 2.5
    else:
        _cc_labels = None
        _max_cc_extent = 0.0

    holes: List[FusedHole] = []
    for px, py in peaks[:max_holes]:
        ipy, ipx = int(round(py)), int(round(px))
        if not (0 <= ipy < h and 0 <= ipx < w):
            continue
        if not zone_mask[ipy, ipx]:
            continue

        # CC size check (cream zone): reject if peak belongs to a large connected
        # dark region → connected handwriting, bold text, or large stain.
        if _cc_labels is not None:
            _lbl = _cc_labels[ipy, ipx]
            if _lbl > 0:
                _cc_w = _cc_stats[_lbl, cv2.CC_STAT_WIDTH]
                _cc_h = _cc_stats[_lbl, cv2.CC_STAT_HEIGHT]
                if max(_cc_w, _cc_h) > _max_cc_extent:
                    continue

        # Sub-pixel centroid refinement
        r_patch = max(2, int(visible_r))
        y0c = max(0, ipy - r_patch)
        y1c = min(h, ipy + r_patch + 1)
        x0c = max(0, ipx - r_patch)
        x1c = min(w, ipx + r_patch + 1)
        patch_s = signal[y0c:y1c, x0c:x1c]
        if patch_s.sum() > 0:
            Mc = cv2.moments(patch_s)
            if Mc['m00'] > 0:
                cx_ref = Mc['m10'] / Mc['m00'] + x0c
                cy_ref = Mc['m01'] / Mc['m00'] + y0c
                if (abs(cx_ref - px) < visible_r * 0.6 and
                        abs(cy_ref - py) < visible_r * 0.6):
                    px, py = cx_ref, cy_ref

        # Fill-ratio check: real holes are solid discs; ink strokes/arcs/writing
        # only partially cover the disc → rejected by a fill threshold.
        # Cream zone is stricter (0.38) because ring arcs and handwriting are the
        # main false-positive sources. Black zone is more lenient (0.28) because
        # torn paper creates irregular bright patches.
        # Black zone: lenient fill (torn paper, overlapping holes create irregular shapes)
        # Cream zone: strict fill (must be a solid circular dark spot, not a ring arc or mark)
        fill_min = 0.22 if bright else 0.42
        if _fill_ratio_check(signal, px, py, visible_r) < fill_min:
            continue

        conf_ratio = acc[ipy, ipx] / (acc_max + 1e-6)
        conf = min(0.92, 0.45 + float(conf_ratio) * 0.47)
        holes.append(FusedHole(
            x=float(px), y=float(py),
            radius=visible_r,
            confidence=conf,
            methods_agreed=1,
        ))

    return holes


# ─── post-processing ────────────────────────────────────────────────────────────

def _deduplicate(holes: List[FusedHole], merge_r: float) -> List[FusedHole]:
    """Weighted-average merge of detections within merge_r * 1.6 of each other."""
    if len(holes) <= 1:
        return holes
    merge_dsq = (merge_r * 1.6) ** 2
    holes.sort(key=lambda h: h.confidence, reverse=True)
    result: List[FusedHole] = []
    used = [False] * len(holes)

    for i, h in enumerate(holes):
        if used[i]:
            continue
        used[i] = True
        gx, gy, gw = h.x * h.confidence, h.y * h.confidence, h.confidence
        for j in range(i + 1, len(holes)):
            if used[j]:
                continue
            if (h.x - holes[j].x) ** 2 + (h.y - holes[j].y) ** 2 < merge_dsq:
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
    holes: List[FusedHole], cx: float, cy: float, visible_r: float
) -> List[FusedHole]:
    """Remove circular arc patterns (ring-line false positives).

    Two strategies:
    1. Groups of ≥ 3 at the same radius → keep top 2 (obvious arc cluster).
    2. Diametrically-opposed pairs at the same radius → remove lower-confidence
       one.  Ring lines generate symmetric ghosts 180° apart.
    """
    if len(holes) <= 1:
        return holes

    dists = [math.sqrt((h.x - cx) ** 2 + (h.y - cy) ** 2) for h in holes]
    angles = [math.atan2(h.y - cy, h.x - cx) for h in holes]
    tol = max(3.0, visible_r * 0.6)

    sorted_idx = sorted(range(len(dists)), key=lambda i: dists[i])
    artifacts: set = set()

    i = 0
    while i < len(sorted_idx):
        group = [sorted_idx[i]]
        j = i + 1
        while j < len(sorted_idx) and dists[sorted_idx[j]] - dists[sorted_idx[i]] < tol:
            group.append(sorted_idx[j])
            j += 1

        if len(group) >= 3:
            # Arc cluster: keep only top-2 by confidence
            group.sort(key=lambda idx: holes[idx].confidence, reverse=True)
            for idx in group[2:]:
                artifacts.add(idx)
        elif len(group) == 2:
            # Check if the pair is diametrically opposed (angle diff ≈ 180°)
            a, b = group
            diff = abs(angles[a] - angles[b])
            if diff > math.pi:
                diff = 2 * math.pi - diff
            if abs(diff - math.pi) < 0.35:  # within ~20° of exact opposite
                # If both are medium-confidence → likely symmetric ring artifacts, remove both
                if holes[a].confidence < 0.75 and holes[b].confidence < 0.75:
                    artifacts.add(a)
                    artifacts.add(b)
                else:
                    # One is high-confidence (likely real) → only remove the weaker ghost
                    loser = a if holes[a].confidence <= holes[b].confidence else b
                    artifacts.add(loser)

        i = j

    return [h for i, h in enumerate(holes) if i not in artifacts]
