"""CLAHE preprocessing: enhance local contrast to reveal bullet holes.

Two modes
---------
apply_clahe()             — applies CLAHE to the full warped image (used in
                            the existing pipeline as a baseline enhancement).
apply_clahe_to_bullseye() — applies a stronger CLAHE only inside the dark
                            bullseye zone, where black shot holes must be
                            distinguished from black ring lines.  Outside the
                            bullseye the image is returned unchanged.

The bullseye zone is the dark (black) area at the centre of the target; its
physical radius comes from the TargetSpec.black_area_radius_mm field and is
converted to pixels using the calibrated mm_per_pixel ratio.
"""

import cv2
import numpy as np
from typing import Tuple


def apply_clahe(
    gray: np.ndarray,
    clip_limit: float = 2.0,
    tile_grid_size: Tuple[int, int] = (8, 8),
) -> np.ndarray:
    """
    Apply CLAHE to the full warped grayscale image.

    The tile-based nature of CLAHE handles both the dark centre zone
    (7–10 rings) where holes appear bright, and the cream outer rings
    where holes appear dark — each tile is normalised independently.

    Args:
        gray:           Grayscale image (uint8). Typically 1000x1000 warped.
        clip_limit:     Contrast limiting threshold. 2.0 is conservative
                        enough to avoid noise amplification in the cream zone.
        tile_grid_size: Grid of tiles for local histogram equalisation.
                        (8, 8) → 125x125 px tiles on a 1000 px canvas.

    Returns:
        Enhanced grayscale image (uint8, same shape as input).
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(gray)


def apply_clahe_to_bullseye(
    gray: np.ndarray,
    center: Tuple[float, float],
    bullseye_radius_px: float,
    clip_limit: float = 3.5,
    tile_grid_size: Tuple[int, int] = (4, 4),
    blend_border_px: int = 20,
) -> np.ndarray:
    """
    Apply strong CLAHE only inside the dark bullseye area of the target.

    The bullseye (black zone) covers rings 7–10 for 10m targets and rings
    8–10 for 25/50m targets.  Shot holes inside this zone appear as slightly
    lighter or torn-paper regions on a uniformly dark background — they need
    stronger local contrast enhancement than the cream outer zone.

    The enhanced region is blended back onto the original with a soft circular
    mask to avoid a hard edge that could trigger false hole detections.

    Args:
        gray:              Input grayscale image (uint8).
        center:            (cx, cy) pixel coordinates of the target centre.
        bullseye_radius_px: Radius of the bullseye zone in pixels.
        clip_limit:        CLAHE clip limit inside the bullseye.  Higher (3.5)
                           than the full-image pass (2.0) to aggressively pull
                           out low-contrast holes on the black background.
        tile_grid_size:    Tile grid for bullseye CLAHE.  Smaller grid = larger
                           tiles = coarser local adaptation (better for uniform
                           dark zone).
        blend_border_px:   Width of the soft blend border at the bullseye edge.

    Returns:
        Grayscale image (uint8) with CLAHE applied inside the bullseye zone
        and the original pixel values preserved outside.
    """
    h, w = gray.shape[:2]
    cx, cy = float(center[0]), float(center[1])
    r = float(bullseye_radius_px)

    if r < 1:
        return gray

    # --- Apply CLAHE to the whole image at bullseye strength ---
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    enhanced = clahe.apply(gray)

    # --- Build a soft circular mask centred on the bullseye ---
    # Inner solid region (r - blend_border) then feathered out to (r)
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2).astype(np.float32)

    inner = max(0.0, r - blend_border_px)
    # alpha = 1 inside the bullseye, 0 outside, smooth ramp in between
    alpha = np.clip((r - dist) / max(blend_border_px, 1), 0.0, 1.0)

    # --- Blend: result = alpha*enhanced + (1-alpha)*original ---
    result = (alpha * enhanced.astype(np.float32) +
              (1.0 - alpha) * gray.astype(np.float32))
    return np.clip(result, 0, 255).astype(np.uint8)


def bullseye_radius_from_calibration(
    mm_per_pixel: float,
    black_area_radius_mm: float,
) -> float:
    """
    Convert the physical bullseye radius (mm) to pixels using mm_per_pixel.

    Args:
        mm_per_pixel:          Calibrated mm/px from TargetCalibration or
                               the calibration engine.
        black_area_radius_mm:  Physical radius of the dark zone in mm
                               (from the ISSF target spec).

    Returns:
        Bullseye radius in pixels on the warped canvas.  Returns 0.0 if
        mm_per_pixel is not available.
    """
    if mm_per_pixel <= 0:
        return 0.0
    return black_area_radius_mm / mm_per_pixel
