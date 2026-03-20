"""
Bullet hole detection on difference image via Otsu + connected components.

Primary: Otsu threshold + connected components (parameter-free on clean diff image)
Secondary: LoG on difference image (confirmation for borderline candidates)

Operates on the difference image where holes are bright blobs on dark background.
"""

import math
from typing import List

import cv2
import numpy as np

from .types import HoleCandidate, FusedHole, TargetCalibration


def detect_holes(
    diff_img: np.ndarray,
    calibration: TargetCalibration,
    pellet_diameter_mm: float = 4.5,
) -> List[FusedHole]:
    """
    Detect bullet holes from a difference image.

    Parameters
    ----------
    diff_img : Difference image (uint8) where holes are bright blobs.
    calibration : Target geometry with mm_per_pixel.
    pellet_diameter_mm : Pellet diameter in mm (default 4.5mm for air rifle).

    Returns
    -------
    List of FusedHole with confidence >= 0.3.
    """
    cx, cy = calibration.center
    radius = calibration.major_radius
    mm_per_pixel = calibration.mm_per_pixel

    if mm_per_pixel <= 0:
        mm_per_pixel = 0.1  # Fallback

    pellet_radius_px = (pellet_diameter_mm / 2.0) / mm_per_pixel
    expected_area = math.pi * pellet_radius_px ** 2

    candidates: List[HoleCandidate] = []

    # Primary: Otsu + connected components
    m1 = _method_otsu_cc(diff_img, pellet_radius_px, expected_area)
    candidates.extend(m1)

    # Secondary: LoG on difference image
    m2 = _method_log_diff(diff_img, pellet_radius_px)
    candidates.extend(m2)

    # Contrast validation on difference image
    for c in candidates:
        c.contrast_ratio = _measure_diff_contrast(diff_img, c.x, c.y, max(3.0, c.radius))

    # Fuse and filter
    fused = _fuse_candidates(candidates, pellet_radius_px)

    # Reject low confidence
    fused = [f for f in fused if f.confidence >= 0.3]

    # Reject holes outside target boundary
    max_dist = radius * 1.05
    result = []
    for hole in fused:
        dist = math.sqrt((hole.x - cx) ** 2 + (hole.y - cy) ** 2)
        if dist <= max_dist:
            result.append(hole)

    return result


def _method_otsu_cc(
    diff_img: np.ndarray,
    pellet_radius_px: float,
    expected_area: float,
) -> List[HoleCandidate]:
    """Otsu threshold + connected components on difference image."""
    # Otsu's method: parameter-free threshold
    _, binary = cv2.threshold(diff_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Morphological closing to fill small gaps within holes
    k = max(3, int(pellet_radius_px * 0.5))
    if k % 2 == 0:
        k += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Connected components
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        binary, connectivity=8
    )

    candidates = []
    min_area = expected_area * 0.5
    max_area = expected_area * 2.0

    for i in range(1, num_labels):  # Skip background (label 0)
        area = stats[i, cv2.CC_STAT_AREA]

        if not (min_area <= area <= max_area):
            continue

        # Circularity check
        comp_w = stats[i, cv2.CC_STAT_WIDTH]
        comp_h = stats[i, cv2.CC_STAT_HEIGHT]
        if comp_w < 1 or comp_h < 1:
            continue

        aspect = min(comp_w, comp_h) / max(comp_w, comp_h)
        # Relaxed circularity: torn/irregular holes are still valid
        if aspect < 0.25:
            continue

        # Compute actual circularity from contour
        comp_mask = (labels == i).astype(np.uint8)
        contours, _ = cv2.findContours(comp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        circularity = 0.5
        if contours:
            perimeter = cv2.arcLength(contours[0], True)
            if perimeter > 0:
                circularity = 4 * math.pi * area / (perimeter * perimeter)

        if circularity < 0.25:
            continue

        # Sub-pixel centroid from moments
        M = cv2.moments(comp_mask)
        if M["m00"] < 1:
            hx, hy = float(centroids[i, 0]), float(centroids[i, 1])
        else:
            hx = M["m10"] / M["m00"]
            hy = M["m01"] / M["m00"]

        hole_r = math.sqrt(area / math.pi)
        conf = min(1.0, circularity * 0.6 + (area / expected_area) * 0.4)

        candidates.append(HoleCandidate(
            x=hx, y=hy, radius=hole_r,
            confidence=conf, method="otsu_cc",
        ))

    return candidates


def _method_log_diff(
    diff_img: np.ndarray,
    pellet_radius_px: float,
) -> List[HoleCandidate]:
    """LoG blob detection on the difference image (confirmation method)."""
    min_sigma = max(1.0, pellet_radius_px * 0.4)
    max_sigma = pellet_radius_px * 2.0
    sigmas = np.linspace(min_sigma, max_sigma, 4)

    diff_f = diff_img.astype(np.float64)
    h, w = diff_img.shape[:2]

    best_response = np.zeros((h, w), dtype=np.float64)
    best_sigma = np.zeros((h, w), dtype=np.float64)

    for sigma in sigmas:
        blurred = cv2.GaussianBlur(diff_f, (0, 0), sigma)
        lap = cv2.Laplacian(blurred, cv2.CV_64F)
        response = -lap * (sigma ** 2)

        update_mask = response > best_response
        best_response[update_mask] = response[update_mask]
        best_sigma[update_mask] = sigma

    if best_response.max() <= 0:
        return []

    # Threshold at 30% of max response
    threshold = best_response.max() * 0.30

    # Non-maximum suppression
    nms_size = max(3, int(pellet_radius_px * 2))
    if nms_size % 2 == 0:
        nms_size += 1
    local_max = cv2.dilate(
        best_response.astype(np.float32),
        np.ones((nms_size, nms_size)),
    ).astype(np.float64)

    peaks = (best_response == local_max) & (best_response > threshold)
    peak_coords = np.argwhere(peaks)

    candidates = []
    max_resp = best_response.max()

    for py, px in peak_coords:
        sigma = best_sigma[py, px]
        blob_r = sigma * math.sqrt(2)
        conf = float(best_response[py, px] / max_resp) * 0.7

        candidates.append(HoleCandidate(
            x=float(px), y=float(py), radius=blob_r,
            confidence=conf, method="log",
        ))

    return candidates


def _measure_diff_contrast(
    diff_img: np.ndarray, x: float, y: float, r: float
) -> float:
    """Measure contrast: mean blob value / mean background in difference image."""
    h, w = diff_img.shape[:2]
    ix, iy = int(round(x)), int(round(y))
    ir = max(2, int(round(r)))

    y1 = max(0, iy - ir * 2)
    y2 = min(h, iy + ir * 2 + 1)
    x1 = max(0, ix - ir * 2)
    x2 = min(w, ix + ir * 2 + 1)

    if y2 <= y1 or x2 <= x1:
        return 0.0

    patch = diff_img[y1:y2, x1:x2].astype(np.float64)
    py, px = np.ogrid[:patch.shape[0], :patch.shape[1]]
    center_y = iy - y1
    center_x = ix - x1
    dist_sq = (py - center_y) ** 2 + (px - center_x) ** 2

    inner_mask = dist_sq <= ir ** 2
    outer_mask = (dist_sq > (ir * 1.5) ** 2) & (dist_sq <= (ir * 2.5) ** 2)

    if not np.any(inner_mask) or not np.any(outer_mask):
        return 0.0

    inner_mean = float(np.mean(patch[inner_mask]))
    outer_mean = float(np.mean(patch[outer_mask]))

    # In difference image: holes are bright, background is dark
    # Contrast = inner / (outer + epsilon)
    return inner_mean / (outer_mean + 1.0)


def _fuse_candidates(
    candidates: List[HoleCandidate],
    pellet_radius_px: float,
) -> List[FusedHole]:
    """Spatially cluster nearby candidates and merge them."""
    if not candidates:
        return []

    # Merge distance: 1.2x pellet diameter — two hits closer than this
    # are the same hole measured twice
    merge_dist = max(3.0, 1.2 * pellet_radius_px * 2)

    candidates.sort(key=lambda c: c.confidence, reverse=True)

    used = [False] * len(candidates)
    fused: List[FusedHole] = []

    for i, c in enumerate(candidates):
        if used[i]:
            continue
        used[i] = True

        group = [c]
        for j in range(i + 1, len(candidates)):
            if used[j]:
                continue
            dist = math.sqrt((c.x - candidates[j].x) ** 2 + (c.y - candidates[j].y) ** 2)
            if dist < merge_dist:
                group.append(candidates[j])
                used[j] = True

        methods = set(g.method for g in group)
        total_conf = sum(g.confidence for g in group)

        # Weighted average position
        wx = sum(g.x * g.confidence for g in group) / total_conf
        wy = sum(g.y * g.confidence for g in group) / total_conf
        wr = sum(g.radius * g.confidence for g in group) / total_conf

        # Confidence: method agreement + shape quality + contrast
        method_agreement = min(1.0, len(methods) / 2.0)
        avg_conf = total_conf / len(group)
        avg_contrast = sum(g.contrast_ratio for g in group) / len(group)

        final_conf = (
            method_agreement * 0.4 +
            avg_conf * 0.35 +
            min(1.0, avg_contrast) * 0.25
        )

        fused.append(FusedHole(
            x=wx, y=wy, radius=wr,
            confidence=final_conf,
            methods_agreed=len(methods),
        ))

    return fused
