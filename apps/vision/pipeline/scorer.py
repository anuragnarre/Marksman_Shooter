"""ISSF-accurate decimal scoring based on ISSF physical target dimensions.

All scoring is delegated to calibration_engine.get_decimal_score(), which
implements the exact ISSF formula from the official target spec JSON:

    ratio    = card_size_mm / warp_size          (mm per pixel)
    dist_mm  = hypot(shot_x - cx, shot_y - cy) * ratio
    score    = 10.9 - (dist_mm / ring_width_radius_mm)

Scoring distance rule (ISSF outer-edge rule — applied universally)
---------------------------------------------------------------------------
All detected hole centres (whether from CV, YOLO, or fused) represent the
centre of the physical pellet mark.  ISSF Rule 7.10 states: a shot is scored
by the ring whose inner boundary the OUTER EDGE of the hole touches or
crosses.  This means the effective scoring distance is:

    effective_dist_mm = centre_dist_mm − pellet_radius_mm

This offset is now applied consistently for ALL detection methods to eliminate
the score inflation that previously occurred for YOLO/fused detections.
"""

import logging
import math
from typing import List

logger = logging.getLogger(__name__)

from .calibration_engine import get_decimal_score, get_mm_per_pixel
from .types import FusedHole, TargetCalibration
from .target_specs import get_spec


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
    mm_per_pixel: float = None,
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
        use_pellet_offset: Subtract pellet radius before scoring (ISSF
                           outer-edge rule).  Default False.
        mm_per_pixel:      Ring-calibrated mm/px ratio from TargetCalibration.
                           When provided, overrides the card-formula ratio so
                           both scoring paths use the same physical scale.

    Returns:
        ISSF decimal score in [1.0, 10.9].  0.0 = miss (outside all rings).
    """
    # Translate so the detected centre maps to the canvas midpoint
    canvas_cx = canvas_size / 2.0
    canvas_cy = canvas_size / 2.0
    translated_x = x_pixel - center_x + canvas_cx
    translated_y = y_pixel - center_y + canvas_cy

    result = get_decimal_score(
        target_type, translated_x, translated_y, canvas_size,
        apply_pellet_offset=use_pellet_offset,
        mm_per_pixel_override=mm_per_pixel,
    )
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

    # Always use calibration.mm_per_pixel for distance → mm conversion.
    #
    # calibration.mm_per_pixel is derived directly from the ring pattern by
    # target_detector._calibrate_rings() and then adjusted by _scale_calibration()
    # for any resizing. It is accurate regardless of warp type:
    #
    #   - True 4-corner card warp: mm_per_pixel ≈ 170/1000 = 0.17
    #   - Ellipse warp (correct_perspective sets card_corners_found=True as a
    #     side effect): mm_per_pixel ≈ ring_width_mm / ring_width_px (correct)
    #   - No warp: same ring-pattern calibration
    #
    # The old card formula (get_decimal_score with canvas_size=1000) assumed
    # canvas was exactly 1000px = card_size_mm. After an ellipse warp the canvas
    # has major_r=806+ — the formula would give dist_mm ≈ 36mm for a hole 214px
    # away → score = -3.6 → filtered. Using mm_per_pixel fixes this for all cases.
    mm_per_px = calibration.mm_per_pixel

    if spec.ring_width_mm <= 0:
        logger.warning("Degenerate spec for %s: ring_width_mm=%s — no shots scored", target_type, spec.ring_width_mm)
        return []

    shots = []
    for hole in holes:
        dist_px = math.hypot(hole.x - cx, hole.y - cy)
        dist_mm = dist_px * mm_per_px

        # Apply pellet-radius offset for ALL detection methods (ISSF outer-edge rule):
        # a shot is scored by the ring whose inner boundary the OUTER EDGE of the
        # hole touches — so effective distance = centre_dist − pellet_radius.
        pellet_r_mm = spec.pellet_diameter_mm / 2.0
        adjusted_dist = max(0.0, dist_mm - pellet_r_mm)
        raw = spec.max_score() - (adjusted_dist / spec.ring_width_mm)
        final_score = round(max(0.0, min(spec.max_score(), raw)), 1)
        is_inner_ten = adjusted_dist <= (spec.inner_ten_diameter_mm / 2.0)

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
            "is_inner_ten":  is_inner_ten,
            "dist_mm":       round(dist_mm, 3),
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
