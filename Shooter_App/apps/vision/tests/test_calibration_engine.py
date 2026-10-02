import sys
import os
import pytest
import math

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.calibration_engine import get_decimal_score, ScoreResult, calculate_decimal_score, scale_mm_per_pixel, get_black_area_radius_mm
from pipeline.target_specs import TargetType

def test_get_decimal_score_perfect_center():
    """Test a perfectly centered shot (0 mm distance)."""
    # 500, 500 is exactly in the center of a 1000px canvas
    result = get_decimal_score(
        target_type="air_pistol_10m",
        shot_x=500,
        shot_y=500,
        warp_size=1000,
        apply_pellet_offset=False
    )
    assert result.score == 10.9
    assert result.is_inner_ten is True
    assert result.dist_px == 0.0
    assert result.dist_mm == 0.0

def test_get_decimal_score_without_pellet_offset():
    """Test distance-based score decay without pellet offset (pure geometric math)."""
    # air_pistol_10m spec:
    # card_size = 170mm, warp_size = 1000px => 0.17 mm/px
    # ring_width_radius_mm = 8.0
    # max_score = 10.9
    # inner_ten_radius_mm = 2.5

    # 1. 8.0 mm offset => score should be 10.9 - (8.0 / 8.0) = 9.9
    # distance in px = 8.0 / 0.17 = 47.0588235...
    result1 = get_decimal_score(
        "air_pistol_10m",
        500 + (8.0 / 0.17), 500,
        apply_pellet_offset=False
    )
    assert result1.score == 9.9
    assert result1.is_inner_ten is False

    # 2. 2.5 mm offset => inner ten boundary
    result2 = get_decimal_score(
        "air_pistol_10m",
        500, 500 + (2.5 / 0.17),
        apply_pellet_offset=False
    )
    assert result2.is_inner_ten is True

    # 3. 2.6 mm offset => just outside inner ten
    result3 = get_decimal_score(
        "air_pistol_10m",
        500, 500 + (2.6 / 0.17),
        apply_pellet_offset=False
    )
    assert result3.is_inner_ten is False

def test_get_decimal_score_with_pellet_offset():
    """Test that applying pellet offset increases the score properly."""
    # For air_pistol_10m, pellet_diameter = 4.5mm -> radius = 2.25mm
    # A geometric distance of 8.0mm becomes an effective distance of 8.0 - 2.25 = 5.75mm
    # Score = 10.9 - (5.75 / 8.0) = 10.9 - 0.71875 = 10.18125 => rounded to 10.2
    result = get_decimal_score(
        "air_pistol_10m",
        500 + (8.0 / 0.17), 500,
        apply_pellet_offset=True
    )
    assert result.score == 10.2

def test_get_decimal_score_miss():
    """Test a shot that misses entirely, should be capped at 0.0."""
    # A very far shot
    result = get_decimal_score(
        "air_pistol_10m",
        0, 0,  # ~707 px from center => ~120 mm from center
        apply_pellet_offset=False
    )
    assert result.score == 0.0

def test_get_decimal_score_invalid_target_type():
    """Test that invalid target types fallback to air_rifle_10m."""
    result_invalid = get_decimal_score("some_unknown_target", 500, 500)
    result_default = get_decimal_score("air_rifle_10m", 500, 500)

    assert result_invalid.score == result_default.score
    assert result_invalid.dist_mm == result_default.dist_mm

def test_get_decimal_score_custom_warp_size():
    """Test scaling with a different warp size."""
    # If canvas is 2000px, then 170mm / 2000px = 0.085 mm/px
    # A point at x=1000 + (8.0 / 0.085) should be exactly 8.0mm away.
    dist_px = 8.0 / 0.085
    result = get_decimal_score(
        "air_pistol_10m",
        1000 + dist_px, 1000,
        warp_size=2000,
        apply_pellet_offset=False
    )
    assert result.dist_px == round(dist_px, 3)
    assert result.dist_mm == 8.0
    assert result.score == 9.9

def test_get_decimal_score_mm_per_pixel_override():
    """Test overriding the mm per pixel ratio."""
    # Use override ratio of 1.0 mm/px for simplicity
    # Offset of 8 px => 8 mm
    result = get_decimal_score(
        "air_pistol_10m",
        508, 500,
        apply_pellet_offset=False,
        mm_per_pixel_override=1.0
    )
    assert result.dist_mm == 8.0
    assert result.score == 9.9

def test_calculate_decimal_score_wrapper():
    """Test the simplified calculate_decimal_score wrapper."""
    result = calculate_decimal_score(500, 500, "air_pistol_10m", warp_size=1000)
    assert result.score == 10.9
    assert result.is_inner_ten is True

def test_scale_mm_per_pixel():
    base = 0.17 # 170 / 1000
    # Canvas size double -> mm per px halves
    scaled = scale_mm_per_pixel(base, 2000)
    assert math.isclose(scaled, 0.085)

    # Zero or negative canvas size should return base
    assert scale_mm_per_pixel(base, 0) == base
    assert scale_mm_per_pixel(base, -100) == base

def test_get_black_area_radius_mm():
    radius = get_black_area_radius_mm("air_pistol_10m")
    assert radius == 29.75
