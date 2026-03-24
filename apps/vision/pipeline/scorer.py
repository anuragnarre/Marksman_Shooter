"""ISSF-accurate decimal scoring based on target calibration and hole positions."""

import math
from typing import List, Tuple

from .types import FusedHole, TargetCalibration
from .target_specs import get_spec


def score_holes(
    holes: List[FusedHole],
    calibration: TargetCalibration,
    target_type: str = "air_rifle_10m",
) -> List[dict]:
    """
    Convert detected holes to scored shot results.

    Uses ISSF decimal scoring:
      score = max_score - (distance_mm / ring_width_mm)

    Returns list of dicts matching ShotResult fields, sorted by distance
    from center (closest first).
    """
    spec = get_spec(target_type)
    cx, cy = calibration.center
    target_pixel_radius = calibration.major_radius

    if target_pixel_radius < 1:
        return []

    # Prefer mm_per_pixel from radial profile fit (more accurate, uses multiple rings)
    # Fall back to simple ratio if not available
    mm_per_pixel = calibration.mm_per_pixel
    if mm_per_pixel <= 0:
        mm_per_pixel = spec.outer_radius_mm / target_pixel_radius

    # Pellet radius in mm (outer edge scores per ISSF rules)
    pellet_radius_mm = spec.pellet_diameter_mm / 2.0

    shots = []
    for hole in holes:
        pixel_dist = math.sqrt((hole.x - cx) ** 2 + (hole.y - cy) ** 2)
        distance_mm = pixel_dist * mm_per_pixel

        # ISSF: the outer edge of the pellet hole determines the score
        # So we subtract pellet radius from distance
        scoring_dist_mm = max(0.0, distance_mm - pellet_radius_mm)

        # Decimal score: 10.9 - (distance / ring_width)
        # 10.9 is center, each ring_width_mm step decreases by 1.0
        raw_score = spec.max_score() - (scoring_dist_mm / spec.ring_width_mm)

        # Clamp to valid range; skip shots completely outside ring 1 (score < 1)
        if raw_score < 1.0:
            continue
        score = min(spec.max_score(), raw_score)

        # Map to target coordinate space (-10 to +10)
        target_x = (hole.x - cx) * (10.0 / target_pixel_radius) if target_pixel_radius > 0 else 0.0
        target_y = -(hole.y - cy) * (10.0 / target_pixel_radius) if target_pixel_radius > 0 else 0.0

        shots.append({
            "pixel_dist": pixel_dist,
            "score": round(score, 1),
            "x": round(target_x, 3),
            "y": round(target_y, 3),
            "pixel_x": int(round(hole.x)),
            "pixel_y": int(round(hole.y)),
            "confidence": round(hole.confidence, 3),
        })

    # Sort by distance from center
    shots.sort(key=lambda s: s["pixel_dist"])

    # Assign shot numbers and remove internal field
    result = []
    for idx, s in enumerate(shots):
        del s["pixel_dist"]
        s["shot_number"] = idx + 1
        result.append(s)

    return result
