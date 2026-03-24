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
    # Ring numbers are printed at each cream-zone ring midpoint at 0/90/180/270°.
    # They are compact dark spots — identical to bullet holes — so we must erase
    # them before disc convolution.  Background is estimated from the same ring
    # band at ±45° offsets so the fill tone matches the local cream background.
    gray_clean = _inpaint_ring_features(gray, cx, cy, ring_radii_px, ring_width_px, black_radius)

    # ── Detect holes via disc convolution ─────────────────────────────────────
    candidates: List[FusedHole] = []

    # Ring boundary suppression — cream zone only.
    ring_suppress_c = visible_r_cream + max(1.0, ring_width_px * 0.15)

    holes_black = _detect_disc(gray_clean, black_roi, cx, cy,
                                visible_r_black, pellet_radius_px, bright=True)
    candidates.extend(holes_black)

    holes_cream = _detect_disc(gray_clean, cream_roi, cx, cy,
                                visible_r_cream, pellet_radius_px, bright=False,
                                ring_radii_px=ring_radii_px,
                                ring_suppress_px=ring_suppress_c)
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
    # Use the calibrated ring-1 outer radius when available; this is consistent
    # with the mm_per_pixel scale used in the scorer and avoids score-0 ghosts
    # that arise when the raw detected radius > calibrated ring-1 radius.
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

    ISSF ring numbers are printed at the MIDPOINT of each ring band
    (NOT at the boundary) at 0°/90°/180°/270°.  Only cream-zone rings
    (midpoint > black_radius) are inpainted — the black zone is skipped
    because inpainting there erases real bullet holes in the bull.
    Background is sampled from the same ring radius at ±45° offsets.
    """
    result = gray.astype(np.float32).copy()
    h, w = gray.shape[:2]

    # Inpaint radius: ring numbers fill ~65% of the ring width
    num_r = max(5, int(ring_width_px * 0.65))

    # Cardinal angles where numbers are printed
    angles_rad = [0.0, math.pi / 2, math.pi, 3 * math.pi / 2]

    # Ring numbers sit at the MIDPOINT of each ring band (not at the boundary).
    # ring_radii_px[i] = outer edge of ring (i+1), so band i spans
    # ring_radii_px[i] (outer) to ring_radii_px[i+1] (inner).
    for i in range(len(ring_radii_px) - 1):
        ring_r = (ring_radii_px[i] + ring_radii_px[i + 1]) / 2.0

        # CREAM ZONE only: skip ring bands inside the black zone centre.
        # Black-zone ring numbers appear as white-on-black text and do NOT
        # produce false positives (handled by erosion + 35% threshold).
        # Inpainting black-zone positions would erase real bull hits.
        if ring_r <= black_radius * 1.05:
            continue

        for angle in angles_rad:
            nx = int(round(cx + ring_r * math.cos(angle)))
            ny = int(round(cy + ring_r * math.sin(angle)))
            if not (0 <= ny < h and 0 <= nx < w):
                continue

            # Sample background from same ring band at ±45° offsets —
            # this avoids sampling the ring number itself or adjacent ones.
            bg_samples: List[float] = []
            ss = max(4, num_r // 2)
            for off in (math.pi / 4, -math.pi / 4, 3 * math.pi / 4, -3 * math.pi / 4):
                sa = angle + off
                sx = int(round(cx + ring_r * math.cos(sa)))
                sy = int(round(cy + ring_r * math.sin(sa)))
                y1, y2 = max(0, sy - ss), min(h, sy + ss + 1)
                x1, x2 = max(0, sx - ss), min(w, sx + ss + 1)
                if y2 > y1 and x2 > x1:
                    bg_samples.append(float(np.median(gray[y1:y2, x1:x2])))
            bg_val = float(np.mean(bg_samples)) if bg_samples else float(np.median(gray))

            cv2.circle(result, (nx, ny), num_r, bg_val, -1)

    return result.astype(np.uint8)


# ─── disc convolution detector ─────────────────────────────────────────────────

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
    """
    Zero out accumulator values near known ring boundary radii.

    Ring lines in the cream zone create elongated arc responses in the
    accumulator.  Suppressing a narrow annular band at each ring boundary
    removes these artefacts without affecting compact hole blobs (which sit
    away from ring edges).
    """
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
        # Black zone: bilateral filter preserves bright hole edges while suppressing
        # JPEG block noise in the dark background.
        gray_smooth = cv2.bilateralFilter(gray, d=5, sigmaColor=25, sigmaSpace=5)
        img_f = gray_smooth.astype(np.float32)
        # Signal: brightness above dark background (global median OK for uniform black zone)
        signal = np.where(zone_mask, np.clip(img_f - bg_med, 0.0, None), 0.0).astype(np.float32)
        min_signal = max(bg_std * 2.5, 15.0)
    else:
        # Cream zone: use LOCAL background model to normalise illumination variation.
        # A single global bg_med fails when the image has vignetting or uneven lighting:
        # the outer rings are darker overall, making the entire outer ring appear as a
        # "dark spot" and producing many false positives.
        # Fix: compute a per-pixel background estimate via a large Gaussian blur.
        # sigma_bg >> visible_r (larger than any hole) so holes don't bias their own bg.
        # sigma_bg is capped to stay well within the ring width to avoid bleeding across
        # ring boundaries.
        gray_smooth = cv2.GaussianBlur(gray, (5, 5), 1.5)
        img_f = gray_smooth.astype(np.float32)
        # sigma_bg must be >> visible_r (holes don't bias own bg) and large enough
        # to capture illumination gradients across the full target (vignetting,
        # shadows). Using ring_radii_px[0]/6 gives ~1/6 of the target radius,
        # which spans ~3-4 ring widths and normalises broad gradients well.
        sigma_bg = (ring_radii_px[0] / 8.0) if ring_radii_px else (visible_r * 5.0)
        bg_local = cv2.GaussianBlur(gray_smooth, (0, 0), sigma_bg).astype(np.float32)
        # Recompute bg_std on the residual (after local bg removal) for a tighter threshold
        residual_pixels = (bg_local - img_f)[zone_mask]
        bg_std = float(max(np.std(residual_pixels), 1.0))
        # Signal: local darkness (per-pixel)
        signal = np.where(zone_mask, np.clip(bg_local - img_f, 0.0, None), 0.0).astype(np.float32)
        min_signal = max(bg_std * 1.8, 12.0)

    # Disc convolution (matched filter at visible_r)
    kernel = _disc_kernel(visible_r)
    acc = cv2.filter2D(signal, cv2.CV_32F, kernel)
    acc = np.where(zone_mask, acc, 0.0).astype(np.float32)

    # Suppress accumulator near ring boundaries (removes ring-line artefacts)
    if ring_radii_px and ring_suppress_px > 0:
        acc = _suppress_ring_boundaries(acc, cx, cy, ring_radii_px, ring_suppress_px)

    acc_max = float(acc.max())
    if acc_max < min_signal * 0.20:
        return []

    # Adaptive threshold: 35% of peak, at least min_signal * 0.25
    threshold = max(min_signal * 0.25, acc_max * 0.35)

    # NMS separation: in the cream zone, use a wider separation than the black
    # zone to suppress multiple spurious peaks from pen marks / writing on the
    # target (which cluster at ~15-20px). Real cream-zone shots at ring 7+
    # are at least ~30px apart even when angularly close.
    # Black zone: keep smaller value so tightly-grouped bull hits aren't merged.
    nms_sep = visible_r * 2.5 if not bright else visible_r * 1.5
    peaks = _find_acc_peaks(acc, nms_sep, threshold)

    holes: List[FusedHole] = []
    for px, py in peaks[:max_holes]:
        ipy, ipx = int(round(py)), int(round(px))
        if not (0 <= ipy < h and 0 <= ipx < w):
            continue
        if not zone_mask[ipy, ipx]:
            continue

        # Sub-pixel centroid refinement: weighted mean of signal within visible_r.
        # More accurate than the NMS peak for asymmetric bright/dark regions.
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
                # Accept centroid only if within 0.6 * visible_r of NMS peak
                if (abs(cx_ref - px) < visible_r * 0.6 and
                        abs(cy_ref - py) < visible_r * 0.6):
                    px, py = cx_ref, cy_ref

        # Confidence from accumulator response relative to peak
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
    1. Groups of ≥ 4 at the same radius → keep top 2 (obvious arc cluster).
    2. Diametrically-opposed pairs at the same radius → remove lower-confidence
       one.  Ring lines generate symmetric ghosts 180° apart; two real shots
       landing at the same distance from centre are almost never exactly
       opposite each other.
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
                # Remove the lower-confidence ghost
                loser = a if holes[a].confidence <= holes[b].confidence else b
                artifacts.add(loser)

        i = j

    return [h for i, h in enumerate(holes) if i not in artifacts]
