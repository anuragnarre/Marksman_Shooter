"""Perspective correction: warp target card to a canonical 1000x1000 square.

Primary path: detect 4 corners of the rectangular target card via
  cv2.findContours + cv2.approxPolyDP, then cv2.warpPerspective.

Fallback: if no card boundary found, use the existing ellipse-to-circle
  approach based on the detected outer ring ellipse.
"""

import cv2
import numpy as np
from typing import List, Optional, Tuple

from .types import TargetCalibration

ECCENTRICITY_THRESHOLD = 0.05
OUTPUT_SIZE = 1000   # warped output side length in pixels


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def correct_perspective(
    img_bgr: np.ndarray,
    gray: np.ndarray,
    calibration: TargetCalibration,
) -> Tuple[np.ndarray, np.ndarray, TargetCalibration]:
    """
    Warp the image so the target is presented as a canonical square.

    Tries the 4-corner card-boundary warp first; falls back to the
    ellipse-to-circle warp when card edges are not detectable.

    Returns updated (img_bgr, gray, calibration).
    """
    result = _four_corner_warp(img_bgr, gray, calibration)
    if result is not None:
        return result

    return _ellipse_warp(img_bgr, gray, calibration)


# ---------------------------------------------------------------------------
# 4-corner warp (primary path)
# ---------------------------------------------------------------------------

def _four_corner_warp(
    img_bgr: np.ndarray,
    gray: np.ndarray,
    calibration: TargetCalibration,
) -> Optional[Tuple[np.ndarray, np.ndarray, TargetCalibration]]:
    """
    Detect the 4 corners of the target card and warp to OUTPUT_SIZE square.
    Returns None if no valid card boundary is found.
    """
    h, w = gray.shape[:2]
    img_area = h * w

    # Edge detection on a lightly blurred copy
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 100)

    # Dilate edges slightly to close small gaps in card border
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_quad: Optional[np.ndarray] = None
    best_area = 0.0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 0.05 * img_area:
            continue

        perimeter = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * perimeter, True)

        if len(approx) != 4:
            continue
        if not cv2.isContourConvex(approx):
            continue

        # Aspect ratio check: target cards are roughly square (0.5–2.0)
        pts = approx.reshape(4, 2).astype(np.float32)
        rect_w = np.linalg.norm(pts[0] - pts[1])
        rect_h = np.linalg.norm(pts[1] - pts[2])
        if rect_h < 1:
            continue
        aspect = rect_w / rect_h
        if not (0.5 <= aspect <= 2.0):
            continue

        # Card center should be near the image center (within 45%); relaxed from
        # 35% to accommodate slightly off-centre shots in the camera frame.
        cx_card = pts[:, 0].mean()
        cy_card = pts[:, 1].mean()
        if abs(cx_card - w / 2) > 0.45 * w or abs(cy_card - h / 2) > 0.45 * h:
            continue

        if area > best_area:
            best_area = area
            best_quad = pts

    if best_quad is None:
        return None

    src_pts = _sort_corners(best_quad)

    # Destination: OUTPUT_SIZE square with 10px inset
    margin = 10
    s = OUTPUT_SIZE - 2 * margin
    dst_pts = np.array([
        [margin,     margin    ],
        [margin + s, margin    ],
        [margin + s, margin + s],
        [margin,     margin + s],
    ], dtype=np.float32)

    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
    if H is None:
        return None

    warped_bgr = cv2.warpPerspective(img_bgr, H, (OUTPUT_SIZE, OUTPUT_SIZE), flags=cv2.INTER_CUBIC)
    warped_gray = cv2.warpPerspective(gray,    H, (OUTPUT_SIZE, OUTPUT_SIZE), flags=cv2.INTER_CUBIC)

    # Recompute calibration for the warped square.
    # The target is centred at the middle of the OUTPUT_SIZE canvas.
    new_cx = OUTPUT_SIZE / 2.0
    new_cy = OUTPUT_SIZE / 2.0

    # Map the original calibration centre through the homography.
    orig_cx, orig_cy = calibration.center
    src_c = np.array([[[orig_cx, orig_cy]]], dtype=np.float32)
    dst_c = cv2.perspectiveTransform(src_c, H)
    new_cx, new_cy = float(dst_c[0, 0, 0]), float(dst_c[0, 0, 1])

    # Sanity check: mapped centre should land near the canvas centre (within 30%).
    # If it ends up in a corner the homography is wrong (e.g. circle detected as quad).
    margin_frac = 0.30
    lo = OUTPUT_SIZE * margin_frac
    hi = OUTPUT_SIZE * (1.0 - margin_frac)
    if not (lo < new_cx < hi and lo < new_cy < hi):
        return None

    # Map a ring radius point to estimate the new pixel scale.
    # ring_radii[0] is ring 1 (outermost); ring_radii[-1] is ring 10 (innermost, ~0.25mm).
    # Must use [0] — using [-1] would make new_major ≈ 1px and break mm_per_pixel.
    new_major = calibration.major_radius
    if calibration.ring_radii:
        outer_r_px = calibration.ring_radii[0]
        src_r_pt = np.array([[[orig_cx + outer_r_px, orig_cy]]], dtype=np.float32)
        dst_r_pt = cv2.perspectiveTransform(src_r_pt, H)
        new_major = float(np.linalg.norm(
            dst_r_pt[0, 0] - np.array([new_cx, new_cy])
        ))

    # mm_per_pixel: use mapped scale if available, else carry over
    new_mm_per_pixel = calibration.mm_per_pixel
    if calibration.major_radius > 0 and new_major > 0:
        scale_factor = new_major / calibration.major_radius
        if calibration.mm_per_pixel > 0:
            new_mm_per_pixel = calibration.mm_per_pixel / scale_factor

    # Map all ring radii
    new_ring_radii: List[float] = []
    for r in calibration.ring_radii:
        rpt = np.array([[[orig_cx + r, orig_cy]]], dtype=np.float32)
        rpt_w = cv2.perspectiveTransform(rpt, H)
        new_ring_radii.append(float(np.linalg.norm(
            rpt_w[0, 0] - np.array([new_cx, new_cy])
        )))

    new_cal = TargetCalibration(
        center=(new_cx, new_cy),
        major_radius=new_major,
        minor_radius=new_major,  # square output → circular target
        rotation_deg=0.0,
        eccentricity=0.0,
        ring_radii=new_ring_radii,
        confidence=calibration.confidence,
        mm_per_pixel=new_mm_per_pixel,
        card_corners_found=True,
    )

    return warped_bgr, warped_gray, new_cal


def _sort_corners(pts: np.ndarray) -> np.ndarray:
    """
    Sort 4 corner points into [TL, TR, BR, BL] order.
    TL: smallest x+y sum  BR: largest x+y sum
    TR: smallest x-y diff  BL: largest x-y diff
    """
    pts = pts.reshape(4, 2)
    s = pts.sum(axis=1)
    d = pts[:, 0] - pts[:, 1]
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(d)]
    bl = pts[np.argmax(d)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


# ---------------------------------------------------------------------------
# Ellipse fallback (original logic preserved)
# ---------------------------------------------------------------------------

def _ellipse_warp(
    img_bgr: np.ndarray,
    gray: np.ndarray,
    calibration: TargetCalibration,
) -> Tuple[np.ndarray, np.ndarray, TargetCalibration]:
    """
    Warp the image so the elliptical target becomes circular.
    Skips correction if eccentricity < ECCENTRICITY_THRESHOLD.
    """
    if calibration.eccentricity < ECCENTRICITY_THRESHOLD:
        return img_bgr, gray, calibration

    cx, cy = calibration.center
    a = calibration.major_radius
    b = calibration.minor_radius
    angle_deg = calibration.rotation_deg
    angle_rad = np.deg2rad(angle_deg)

    src_points = []
    dst_points = []
    for theta_deg in [0, 90, 180, 270]:
        theta = np.deg2rad(theta_deg)
        ex = a * np.cos(theta)
        ey = b * np.sin(theta)
        rx = ex * np.cos(angle_rad) - ey * np.sin(angle_rad) + cx
        ry = ex * np.sin(angle_rad) + ey * np.cos(angle_rad) + cy
        src_points.append([rx, ry])

        circle_x = a * np.cos(theta) + cx
        circle_y = a * np.sin(theta) + cy
        dst_points.append([circle_x, circle_y])

    src_pts = np.array(src_points, dtype=np.float32)
    dst_pts = np.array(dst_points, dtype=np.float32)

    H, _ = cv2.findHomography(src_pts, dst_pts)
    if H is None:
        return img_bgr, gray, calibration

    h, w = img_bgr.shape[:2]
    warped_bgr = cv2.warpPerspective(img_bgr, H, (w, h), flags=cv2.INTER_CUBIC)
    warped_gray = cv2.warpPerspective(gray, H, (w, h), flags=cv2.INTER_CUBIC)

    new_cal = TargetCalibration(
        center=(cx, cy),
        major_radius=a,
        minor_radius=a,
        rotation_deg=0.0,
        eccentricity=0.0,
        ring_radii=list(calibration.ring_radii),
        confidence=calibration.confidence,
        mm_per_pixel=calibration.mm_per_pixel,
        card_corners_found=False,
    )

    return warped_bgr, warped_gray, new_cal
