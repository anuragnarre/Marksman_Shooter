"""Perspective correction: warp elliptical target to a canonical circle."""

import cv2
import numpy as np
from typing import Tuple

from .types import TargetCalibration

ECCENTRICITY_THRESHOLD = 0.05


def correct_perspective(
    img_bgr: np.ndarray,
    gray: np.ndarray,
    calibration: TargetCalibration,
) -> Tuple[np.ndarray, np.ndarray, TargetCalibration]:
    """
    Warp the image so the elliptical target becomes circular.

    Uses the single outer-ring ellipse fit from target_detector Stage C.
    Skips correction if eccentricity < 0.05 (already nearly circular).
    Returns updated (img_bgr, gray, calibration).
    """
    if calibration.eccentricity < ECCENTRICITY_THRESHOLD:
        return img_bgr, gray, calibration

    cx, cy = calibration.center
    a = calibration.major_radius  # semi-major
    b = calibration.minor_radius  # semi-minor
    angle_deg = calibration.rotation_deg
    angle_rad = np.deg2rad(angle_deg)

    # Sample 4 points on the ellipse (0, 90, 180, 270 degrees)
    src_points = []
    dst_points = []
    for theta_deg in [0, 90, 180, 270]:
        theta = np.deg2rad(theta_deg)
        # Point on the ellipse (rotated)
        ex = a * np.cos(theta)
        ey = b * np.sin(theta)
        # Rotate by ellipse angle
        rx = ex * np.cos(angle_rad) - ey * np.sin(angle_rad) + cx
        ry = ex * np.sin(angle_rad) + ey * np.cos(angle_rad) + cy
        src_points.append([rx, ry])

        # Corresponding point on a circle of radius = major axis
        circle_x = a * np.cos(theta) + cx
        circle_y = a * np.sin(theta) + cy
        dst_points.append([circle_x, circle_y])

    src_pts = np.array(src_points, dtype=np.float32)
    dst_pts = np.array(dst_points, dtype=np.float32)

    # Compute homography
    H, _ = cv2.findHomography(src_pts, dst_pts)
    if H is None:
        return img_bgr, gray, calibration

    h, w = img_bgr.shape[:2]
    warped_bgr = cv2.warpPerspective(img_bgr, H, (w, h), flags=cv2.INTER_CUBIC)
    warped_gray = cv2.warpPerspective(gray, H, (w, h), flags=cv2.INTER_CUBIC)

    # After warp, target is now circular with radius = major axis
    # Recompute mm_per_pixel for circular target
    new_mm_per_pixel = calibration.mm_per_pixel
    if b > 0 and calibration.mm_per_pixel > 0:
        # Scale factor: rings were compressed along minor axis, now expanded
        new_mm_per_pixel = calibration.mm_per_pixel

    new_cal = TargetCalibration(
        center=(cx, cy),
        major_radius=a,
        minor_radius=a,  # Now circular
        rotation_deg=0.0,
        eccentricity=0.0,
        ring_radii=[r * (a / b) for r in calibration.ring_radii] if calibration.ring_radii and b > 0 else [],
        confidence=calibration.confidence,
        mm_per_pixel=new_mm_per_pixel,
    )

    return warped_bgr, warped_gray, new_cal
