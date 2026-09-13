"""Calibration engine: ISSF-exact scoring and mm/px ratios.

All physical dimensions are derived directly from the official ISSF target
specifications (see ISSF_SPECS below).

mm/px ratios
------------
10 m  (Air Rifle / Air Pistol)  :  170 mm card / 1000 px  =  0.17 mm/px
25 m  (NR Pistol)               :  550 mm card / 1000 px  =  0.55 mm/px
50 m  (NR Rifle)                :  550 mm card / 1000 px  =  0.55 mm/px

These values assume the warped output canvas is OUTPUT_SIZE = 1000 px
(set in pipeline/perspective.py).  Pass canvas_size to any function to
adjust automatically for a different warp size.
"""

import math
from dataclasses import dataclass
from typing import Dict, Optional

from .target_specs import TargetType, get_spec as _get_target_spec

# ---------------------------------------------------------------------------
# ISSF physical dimensions (source: official ISSF target spec JSON)
# ---------------------------------------------------------------------------
#
#  10m Air Pistol / Air Rifle
#    card_size_mm           : 170
#    black_area_radius_mm   : 29.75   (= 7-ring outer radius)
#    10-ring diameter       : 11.5  mm  → radius  5.75 mm
#     9-ring diameter       : 27.5  mm  → radius 13.75 mm
#     8-ring diameter       : 43.5  mm  → radius 21.75 mm
#     7-ring diameter       : 59.5  mm  → radius 29.75 mm
#     6-ring diameter       : 75.5  mm  → radius 37.75 mm
#     5-ring diameter       : 91.5  mm  → radius 45.75 mm
#    inner-ten diameter     :  5.0  mm  → radius  2.5  mm
#    ring_width_radius      : (27.5 - 11.5) / 2 = 8.0 mm
#
#  25 m / 50 m Pistol & Rifle
#    card_size_mm           : 550
#    black_area_radius_mm   : 100.0  (= 9-ring outer radius)
#    10-ring diameter       :  50   mm  → radius  25 mm
#     9-ring diameter       : 100   mm  → radius  50 mm
#     8-ring diameter       : 150   mm  → radius  75 mm
#     7-ring diameter       : 200   mm  → radius 100 mm
#     6-ring diameter       : 250   mm  → radius 125 mm
#     5-ring diameter       : 300   mm  → radius 150 mm
#    inner-ten diameter     :  25   mm  → radius  12.5 mm
#    ring_width_radius      : (100 - 50) / 2 = 25.0 mm

@dataclass(frozen=True)
class _ISSFSpec:
    card_size_mm: float         # physical card side length
    ring_width_radius_mm: float # radial width of each scoring ring
    inner_ten_radius_mm: float  # radius of the inner ten (X) ring
    ten_ring_radius_mm: float   # outer radius of the 10-ring
    black_area_radius_mm: float # radius of the black (dark) zone
    max_score: float = 10.9     # perfect centre score


# Map TargetType → ISSF spec
_ISSF_SPECS: Dict[TargetType, _ISSFSpec] = {
    TargetType.AIR_PISTOL_10M: _ISSFSpec(
        card_size_mm=170.0,
        ring_width_radius_mm=8.0,     # (27.5 - 11.5) / 2
        inner_ten_radius_mm=2.5,      # 5.0 / 2
        ten_ring_radius_mm=5.75,      # 11.5 / 2
        black_area_radius_mm=29.75,   # 7-ring outer radius
    ),
    TargetType.AIR_RIFLE_10M: _ISSFSpec(
        card_size_mm=170.0,
        ring_width_radius_mm=2.5,       # 10m Air Rifle: 2.5mm per ring (45.5mm / 10 rings / 2)
        inner_ten_radius_mm=0.25,       # X-ring: 0.5mm diameter / 2 = 0.25mm radius (must be < ten_ring_radius_mm)
        ten_ring_radius_mm=0.25,        # ring 10 outer: outer_radius(22.75) - 9×ring_width(2.5) = 0.25mm radius
        black_area_radius_mm=10.25,     # rings 6-10 are black: outer_radius(22.75) - 5×ring_width(2.5) = 10.25mm
    ),
    TargetType.NR_50M: _ISSFSpec(
        card_size_mm=550.0,
        ring_width_radius_mm=25.0,    # (100 - 50) / 2
        inner_ten_radius_mm=12.5,     # 25.0 / 2
        ten_ring_radius_mm=25.0,      # 50.0 / 2
        black_area_radius_mm=100.0,   # 9-ring outer radius
    ),
    TargetType.NR_25M_PISTOL: _ISSFSpec(
        card_size_mm=500.0,           # outer ring diameter (not card size) so card_size/warp_size mm/px matches scorer
        ring_width_radius_mm=25.0,
        inner_ten_radius_mm=12.5,
        ten_ring_radius_mm=25.0,
        black_area_radius_mm=100.0,   # ring 7 outer = outer_radius(250) - 6*ring_width(25) = 100mm
    ),
}

_REFERENCE_CANVAS_SIZE = 1000  # px — matches perspective.OUTPUT_SIZE


# ---------------------------------------------------------------------------
# Public result type
# ---------------------------------------------------------------------------

@dataclass
class ScoreResult:
    """Result returned by get_decimal_score()."""
    score: float        # ISSF decimal score (0.0 – 10.9); 0.0 = miss
    is_inner_ten: bool  # True when the shot lands inside the X-ring
    dist_mm: float      # physical distance from centre in mm
    dist_px: float      # pixel distance from centre on the warped canvas


# ---------------------------------------------------------------------------
# Primary scoring function
# ---------------------------------------------------------------------------

def get_decimal_score(
    target_type: str,
    shot_x: float,
    shot_y: float,
    warp_size: int = 1000,
    apply_pellet_offset: bool = True,
    mm_per_pixel_override: Optional[float] = None,
) -> ScoreResult:
    """
    Calculate the ISSF decimal score for a detected shot on a warped canvas.

    Steps
    -----
    1. Look up the card_size_mm and ring dimensions for target_type.
    2. Compute ratio = card_size_mm / warp_size (mm per pixel), or use
       mm_per_pixel_override when the ring-calibrated value is available.
    3. Compute pixel distance from (shot_x, shot_y) to the canvas centre
       (warp_size/2, warp_size/2).
    4. Convert to mm:  dist_mm = pixel_dist * ratio.
    5. Optionally subtract pellet radius (ISSF outer-edge rule).
    6. Score = 10.9 - (dist_mm / ring_width_radius_mm), clamped to [0.0, 10.9].
    7. is_inner_ten = dist_mm <= inner_ten_radius_mm.

    Args:
        target_type:          One of "air_pistol_10m", "air_rifle_10m",
                              "nr_50m", "nr_25m".  Unknown types default to
                              "air_rifle_10m".
        shot_x:               X pixel coordinate on the warped canvas.
        shot_y:               Y pixel coordinate on the warped canvas.
        warp_size:            Side length of the warped canvas in pixels.
                              Must match the value used in perspective.OUTPUT_SIZE
                              (default 1000).
        apply_pellet_offset:  If True, apply the ISSF outer-edge rule by
                              subtracting the pellet radius from dist_mm before
                              scoring (default True — ISSF-correct behaviour).
        mm_per_pixel_override: When provided, use this as the mm/px ratio instead
                              of computing it from card_size_mm / warp_size.
                              Pass calibration.mm_per_pixel for accurate results
                              when the card warp may not fill the full canvas.

    Returns:
        ScoreResult with score, is_inner_ten, dist_mm, dist_px.

    Examples
    --------
    >>> r = get_decimal_score("air_pistol_10m", 500, 500)
    >>> r.score, r.is_inner_ten
    (10.9, True)

    >>> r = get_decimal_score("nr_50m", 545, 500)  # ~45 px = ~24.75 mm from centre
    >>> r.score  # 10.9 - (24.75 / 25.0) ≈ 9.9
    9.9
    """
    spec = _get_spec(target_type)

    # Step 1-2: mm per pixel — prefer ring-calibrated override when available
    if mm_per_pixel_override and mm_per_pixel_override > 0:
        ratio = mm_per_pixel_override
    else:
        ratio = spec.card_size_mm / warp_size  # mm / px

    # Step 3: pixel distance to canvas centre
    centre = warp_size / 2.0
    dist_px = math.hypot(shot_x - centre, shot_y - centre)

    # Step 4: convert to mm
    dist_mm = dist_px * ratio

    # Step 5: ISSF outer-edge rule (optional)
    if apply_pellet_offset:
        target_spec = _get_target_spec(target_type)
        pellet_r_mm = target_spec.pellet_diameter_mm / 2.0
        dist_mm = max(0.0, dist_mm - pellet_r_mm)

    # Step 6: decimal score
    raw = spec.max_score - (dist_mm / spec.ring_width_radius_mm)
    score = round(max(0.0, min(spec.max_score, raw)), 1)

    # Step 7: inner ten (X-ring) check
    # A shot touching the X-ring line from the inside counts; add a small
    # epsilon to guard against floating-point rounding at the exact boundary.
    is_inner_ten = dist_mm <= spec.inner_ten_radius_mm + 1e-9

    return ScoreResult(
        score=score,
        is_inner_ten=is_inner_ten,
        dist_mm=round(dist_mm, 3),
        dist_px=round(dist_px, 3),
    )


# ---------------------------------------------------------------------------
# mm/px helpers (used by scorer.py)
# ---------------------------------------------------------------------------

def get_mm_per_pixel(target_type: str, canvas_size: int = 1000) -> float:
    """
    Return the calibrated mm-per-pixel ratio derived from the ISSF card size.

    Ratio = card_size_mm / canvas_size.  No magic constants — the value
    flows directly from the physical spec (170 mm → 0.17 at 1000 px,
    550 mm → 0.55 at 1000 px).

    Args:
        target_type:  String key matching TargetType values.
        canvas_size:  Warped output canvas side length in pixels.

    Returns:
        mm per pixel as a float.
    """
    spec = _get_spec(target_type)
    if canvas_size <= 0:
        canvas_size = _REFERENCE_CANVAS_SIZE
    return spec.card_size_mm / canvas_size


def scale_mm_per_pixel(
    base_ratio: float,
    canvas_size: int,
    reference_size: int = _REFERENCE_CANVAS_SIZE,
) -> float:
    """
    Scale a mm/px ratio from one canvas size to another.

    A larger canvas → more pixels per mm → smaller mm/px:
        scaled = base * (reference_size / canvas_size)
    """
    if canvas_size <= 0:
        return base_ratio
    return base_ratio * (reference_size / canvas_size)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def get_black_area_radius_mm(target_type: str) -> float:
    """
    Return the physical radius of the dark (bullseye) zone in mm.

    Used by the CLAHE bullseye-only enhancement to focus contrast
    improvement on the zone where holes are hardest to see.

    Args:
        target_type: String key matching TargetType values.

    Returns:
        Black area radius in mm.
    """
    return _get_spec(target_type).black_area_radius_mm


def calculate_decimal_score(
    x: float,
    y: float,
    target_type: str = "air_pistol_10m",
    warp_size: int = 1000,
) -> ScoreResult:
    """
    Simplified scoring entry point matching the ISSF formula:

        Ratio           = Physical_Card_Size_mm / warp_size
        Distance_Pixels = sqrt((x − 500)² + (y − 500)²)
        Distance_mm     = Distance_Pixels × Ratio
        Score           = 10.9 − (Distance_mm / ring_width_radius_mm)

    The target centre is always assumed to be (warp_size/2, warp_size/2).
    This is the canonical form after perspective correction.

    Args:
        x:           X pixel coordinate of the detected shot on the warped canvas.
        y:           Y pixel coordinate of the detected shot on the warped canvas.
        target_type: "air_pistol_10m" | "air_rifle_10m" | "nr_50m" | "nr_25m".
                     Defaults to "air_pistol_10m".
        warp_size:   Side length of the warped canvas in pixels (default 1000).

    Returns:
        ScoreResult(score, is_inner_ten, dist_mm, dist_px).

    Examples
    --------
    >>> calculate_decimal_score(500, 500, "air_pistol_10m").score
    10.9
    >>> calculate_decimal_score(500, 500, "air_pistol_10m").is_inner_ten
    True
    >>> calculate_decimal_score(547, 500, "air_pistol_10m").score  # ~8mm out
    9.9
    """
    return get_decimal_score(target_type, x, y, warp_size, apply_pellet_offset=True)


def _get_spec(target_type: str) -> _ISSFSpec:
    """Look up _ISSFSpec by string key, defaulting to air_rifle_10m."""
    try:
        return _ISSF_SPECS[TargetType(target_type)]
    except (ValueError, KeyError):
        return _ISSF_SPECS[TargetType.AIR_RIFLE_10M]
