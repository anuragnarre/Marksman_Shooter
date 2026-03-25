"""ISSF-accurate decimal scoring based on ISSF physical target dimensions.

All scoring is delegated to calibration_engine.get_decimal_score(), which
implements the exact ISSF formula from the official target spec JSON:

    ratio    = card_size_mm / warp_size          (mm per pixel)
    dist_mm  = hypot(shot_x - cx, shot_y - cy) * ratio
    score    = 10.9 - (dist_mm / ring_width_radius_mm)

Scoring distance rule
---------------------
- YOLO / fused detections  (method = "yolo" | "fused"):
    Pure centre-to-centre — the YOLO bounding-box centre IS the hole centre,
    so no pellet-radius offset is applied.
- CV-only detections  (method = "cv"):
    ISSF outer-edge rule: pellet radius subtracted before scoring so the
    outer edge of the physical hole (not the centre) determines the score.
"""

import math
from typing import List

from .calibration_engine import get_decimal_score, get_mm_per_pixel
from .types import FusedHole, TargetCalibration
from .target_specs import get_spec

# Detection methods that score from the hole-centre directly
_CENTRE_SCORE_METHODS = {"yolo", "fused"}


# ---------------------------------------------------------------------------
# Standalone helper (used by mobile / export scripts and unit tests)
# ---------------------------------------------------------------------------

def calculate_score(
    x_pixel: float,
    y_pixel: float,
    center_x: float,
    center_y: float,
    target_type: str,
    canvas_size: int = 1000,
    use_pellet_offset: bool = False,
) -> float:
    """
    ISSF decimal score for a single pixel coordinate.

    Delegates to get_decimal_score() after translating (x_pixel, y_pixel)
    so that center_x / center_y maps to the canvas centre expected by the
    calibration engine.

    Args:
        x_pixel:           X coordinate of hole centre in the warped image.
        y_pixel:           Y coordinate of hole centre in the warped image.
        center_x:          X coordinate of target centre in the warped image.
        center_y:          Y coordinate of target centre in the warped image.
        target_type:       Key from target_specs, e.g. "air_pistol_10m".
        canvas_size:       Side length of warped image in pixels (default 1000).
        use_pellet_offset: Subtract pellet radius before scoring (CV / ISSF
                           outer-edge rule).  Default False.

    Returns:
        ISSF decimal score in [1.0, 10.9].  0.0 = miss (outside all rings).
    """
    # Translate so the detected centre maps to the canvas midpoint
    canvas_cx = canvas_size / 2.0
    canvas_cy = canvas_size / 2.0
    translated_x = x_pixel - center_x + canvas_cx
    translated_y = y_pixel - center_y + canvas_cy

    result = get_decimal_score(target_type, translated_x, translated_y, canvas_size)

    if use_pellet_offset:
        spec = get_spec(target_type)
        mm_per_pixel = get_mm_per_pixel(target_type, canvas_size)
        pellet_r_mm = spec.pellet_diameter_mm / 2.0
        adjusted_dist_mm = max(0.0, result.dist_mm - pellet_r_mm)
        adjusted_score_raw = 10.9 - (adjusted_dist_mm / spec.ring_width_mm)
        return round(max(0.0, min(10.9, adjusted_score_raw)), 1)

    return result.score if result.score >= 1.0 else 0.0


# ---------------------------------------------------------------------------
# Pipeline entry point
# ---------------------------------------------------------------------------

def score_holes(
    holes: List[FusedHole],
    calibration: TargetCalibration,
    target_type: str = "air_rifle_10m",
) -> List[dict]:
    """
    Convert detected holes to scored shot results using ISSF card dimensions.

    The canvas centre is taken from calibration.center.  For each hole,
    get_decimal_score() is called with coordinates translated so the target
    centre maps to (warp_size/2, warp_size/2).

    YOLO / fused detections are scored centre-to-centre (no pellet offset).
    CV-only detections apply the ISSF outer-edge rule (pellet radius offset).

    Returns list of dicts matching ShotResult fields, sorted by distance
    from centre (closest first).
    """
    spec = get_spec(target_type)
    cx, cy = calibration.center

    # Determine the canvas size from the calibration geometry.
    # For a card-corner-warped 1000 px output, major_radius ≈ 500.
    if calibration.card_corners_found:
        canvas_size = 1000
    elif calibration.major_radius > 0:
        canvas_size = int(round(calibration.major_radius * 2))
    else:
        canvas_size = 1000

    canvas_cx = canvas_size / 2.0
    canvas_cy = canvas_size / 2.0

    shots = []
    for hole in holes:
        # Translate so the detected target centre → canvas midpoint
        tx = hole.x - cx + canvas_cx
        ty = hole.y - cy + canvas_cy

        result = get_decimal_score(target_type, tx, ty, canvas_size)

        # Apply pellet-radius offset for CV-only detections
        detection_method = getattr(hole, "method", "cv")
        if detection_method not in _CENTRE_SCORE_METHODS:
            pellet_r_mm = spec.pellet_diameter_mm / 2.0
            adjusted_dist = max(0.0, result.dist_mm - pellet_r_mm)
            raw = spec.max_score() - (adjusted_dist / spec.ring_width_mm)
            final_score = round(max(0.0, min(spec.max_score(), raw)), 1)
        else:
            final_score = result.score

        if final_score < 1.0:
            continue

        # Normalised target coordinates (-10 to +10, Y-up)
        pixel_dist = math.hypot(hole.x - cx, hole.y - cy)
        if calibration.major_radius > 0:
            norm = 10.0 / calibration.major_radius
            target_x = (hole.x - cx) * norm
            target_y = -(hole.y - cy) * norm
        else:
            target_x = target_y = 0.0

        shots.append({
            "pixel_dist":    pixel_dist,
            "score":         final_score,
            "is_inner_ten":  result.is_inner_ten,
            "dist_mm":       result.dist_mm,
            "x":             round(target_x, 3),
            "y":             round(target_y, 3),
            "pixel_x":       int(round(hole.x)),
            "pixel_y":       int(round(hole.y)),
            "confidence":    round(hole.confidence, 3),
        })

    shots.sort(key=lambda s: s["pixel_dist"])

    result_list = []
    for idx, s in enumerate(shots):
        del s["pixel_dist"]
        s["shot_number"] = idx + 1
        result_list.append(s)

    return result_list
