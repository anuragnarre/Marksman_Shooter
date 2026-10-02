import pytest
from unittest.mock import patch, MagicMock

# Import the module to test
from pipeline.scorer import calculate_score, score_holes
from pipeline.types import FusedHole, TargetCalibration

# Mock ScoreResult
class MockScoreResult:
    def __init__(self, score, dist_mm, ring_radius_mm):
        self.score = score
        self.dist_mm = dist_mm
        self.ring_radius_mm = ring_radius_mm

@patch('pipeline.scorer.get_decimal_score')
def test_calculate_score_direct_hit(mock_get_decimal_score):
    # Setup mock
    mock_get_decimal_score.return_value = MockScoreResult(10.9, 0.0, 0.0)

    # Target center is (500, 500)
    score = calculate_score(
        x_pixel=500.0,
        y_pixel=500.0,
        center_x=500.0,
        center_y=500.0,
        target_type="air_rifle_10m",
        canvas_size=1000,
    )

    # Assert get_decimal_score was called with translated coordinates (center of canvas)
    mock_get_decimal_score.assert_called_once_with(
        "air_rifle_10m", 500.0, 500.0, 1000,
        apply_pellet_offset=False,
        mm_per_pixel_override=None
    )

    assert score == 10.9

@patch('pipeline.scorer.get_decimal_score')
def test_calculate_score_off_center(mock_get_decimal_score):
    mock_get_decimal_score.return_value = MockScoreResult(9.5, 5.0, 10.0)

    # Target center is (400, 400), but hit is at (450, 400)
    score = calculate_score(
        x_pixel=450.0,
        y_pixel=400.0,
        center_x=400.0,
        center_y=400.0,
        target_type="air_rifle_10m",
        canvas_size=1000,
    )

    # The expected translated coords:
    # translated_x = 450 - 400 + 500 = 550
    # translated_y = 400 - 400 + 500 = 500
    mock_get_decimal_score.assert_called_once_with(
        "air_rifle_10m", 550.0, 500.0, 1000,
        apply_pellet_offset=False,
        mm_per_pixel_override=None
    )

    assert score == 9.5

@patch('pipeline.scorer.get_decimal_score')
def test_calculate_score_miss(mock_get_decimal_score):
    # Setup mock to return a score less than 1.0
    mock_get_decimal_score.return_value = MockScoreResult(0.5, 50.0, 50.0)

    score = calculate_score(
        x_pixel=100.0,
        y_pixel=100.0,
        center_x=500.0,
        center_y=500.0,
        target_type="air_rifle_10m",
        canvas_size=1000,
    )

    # The function should return 0.0 for scores < 1.0
    assert score == 0.0

@patch('pipeline.scorer.get_decimal_score')
def test_calculate_score_with_pellet_offset(mock_get_decimal_score):
    mock_get_decimal_score.return_value = MockScoreResult(10.0, 0.0, 0.0)

    score = calculate_score(
        x_pixel=500.0,
        y_pixel=500.0,
        center_x=500.0,
        center_y=500.0,
        target_type="air_rifle_10m",
        use_pellet_offset=True
    )

    # Assert apply_pellet_offset=True was passed down
    mock_get_decimal_score.assert_called_once_with(
        "air_rifle_10m", 500.0, 500.0, 1000,
        apply_pellet_offset=True,
        mm_per_pixel_override=None
    )

@patch('pipeline.scorer.get_decimal_score')
def test_calculate_score_with_mm_per_pixel(mock_get_decimal_score):
    mock_get_decimal_score.return_value = MockScoreResult(10.0, 0.0, 0.0)

    score = calculate_score(
        x_pixel=500.0,
        y_pixel=500.0,
        center_x=500.0,
        center_y=500.0,
        target_type="air_rifle_10m",
        mm_per_pixel=0.17
    )

    # Assert mm_per_pixel_override was passed down
    mock_get_decimal_score.assert_called_once_with(
        "air_rifle_10m", 500.0, 500.0, 1000,
        apply_pellet_offset=False,
        mm_per_pixel_override=0.17
    )

def test_score_holes_empty_holes():
    # Setup calibration and empty holes
    calibration = TargetCalibration(
        center=(500, 500),
        major_radius=400,
        minor_radius=400,
        mm_per_pixel=0.17,
        rotation_deg=0.0,
        eccentricity=0.0
    )

    results = score_holes([], calibration, "air_rifle_10m")
    assert len(results) == 0

@patch('pipeline.scorer.get_spec')
def test_score_holes_degenerate_spec(mock_get_spec):
    # Mock a spec with ring_width_mm <= 0
    mock_spec = MagicMock()
    mock_spec.ring_width_mm = 0.0
    mock_get_spec.return_value = mock_spec

    calibration = TargetCalibration(
        center=(500, 500),
        major_radius=400,
        minor_radius=400,
        mm_per_pixel=0.17,
        rotation_deg=0.0,
        eccentricity=0.0
    )

    holes = [FusedHole(x=500.0, y=500.0, radius=10.0, confidence=0.9, method="cv")]
    results = score_holes(holes, calibration, "air_rifle_10m")

    assert len(results) == 0

@patch('pipeline.scorer.get_spec')
def test_score_holes_scoring(mock_get_spec):
    # Setup mock spec for a realistic target
    mock_spec = MagicMock()
    mock_spec.ring_width_mm = 2.5
    mock_spec.max_score.return_value = 10.9
    mock_spec.pellet_diameter_mm = 4.5
    mock_spec.inner_ten_diameter_mm = 5.0
    mock_get_spec.return_value = mock_spec

    calibration = TargetCalibration(
        center=(500.0, 500.0),
        major_radius=400.0,
        minor_radius=400.0,
        mm_per_pixel=0.17,
        rotation_deg=0.0,
        eccentricity=0.0
    )

    # Direct hit at (500, 500)
    holes = [FusedHole(x=500.0, y=500.0, radius=10.0, confidence=0.95, method="cv")]
    results = score_holes(holes, calibration, "air_rifle_10m")

    assert len(results) == 1
    assert results[0]["score"] == 10.9
    assert results[0]["is_inner_ten"] is True
    assert results[0]["shot_number"] == 1

    # A bit off-center
    holes = [FusedHole(x=510.0, y=500.0, radius=10.0, confidence=0.9, method="cv")]
    results = score_holes(holes, calibration, "air_rifle_10m")

    assert len(results) == 1
    # distance in px = 10, distance in mm = 1.7
    # pellet_r = 2.25
    # adjusted_dist = max(0, 1.7 - 2.25) = 0.0
    # score should be 10.9
    assert results[0]["score"] == 10.9

    # Further off-center
    holes = [FusedHole(x=600.0, y=500.0, radius=10.0, confidence=0.9, method="cv")]
    results = score_holes(holes, calibration, "air_rifle_10m")

    assert len(results) == 1
    # distance in px = 100, distance in mm = 17.0
    # pellet_r = 2.25
    # adjusted_dist = 17.0 - 2.25 = 14.75
    # raw = 10.9 - (14.75 / 2.5) = 10.9 - 5.9 = 5.0
    assert results[0]["score"] == 5.0
    assert results[0]["is_inner_ten"] is False

@patch('pipeline.scorer.get_spec')
def test_score_holes_multiple_sorting(mock_get_spec):
    mock_spec = MagicMock()
    mock_spec.ring_width_mm = 2.5
    mock_spec.max_score.return_value = 10.9
    mock_spec.pellet_diameter_mm = 4.5
    mock_spec.inner_ten_diameter_mm = 5.0
    mock_get_spec.return_value = mock_spec

    calibration = TargetCalibration(
        center=(500.0, 500.0),
        major_radius=400.0,
        minor_radius=400.0,
        mm_per_pixel=0.17,
        rotation_deg=0.0,
        eccentricity=0.0
    )

    # Create multiple holes with different distances
    holes = [
        FusedHole(x=600.0, y=500.0, radius=10.0, confidence=0.9, method="cv"),  # Dist 100
        FusedHole(x=510.0, y=500.0, radius=10.0, confidence=0.9, method="cv"),  # Dist 10
        FusedHole(x=550.0, y=500.0, radius=10.0, confidence=0.9, method="cv")   # Dist 50
    ]

    results = score_holes(holes, calibration, "air_rifle_10m")

    assert len(results) == 3
    # Should be sorted by distance (closest first)
    assert results[0]["shot_number"] == 1
    assert results[0]["pixel_x"] == 510

    assert results[1]["shot_number"] == 2
    assert results[1]["pixel_x"] == 550

    assert results[2]["shot_number"] == 3
    assert results[2]["pixel_x"] == 600

@patch('pipeline.scorer.get_spec')
def test_score_holes_filter_low_scores(mock_get_spec):
    mock_spec = MagicMock()
    mock_spec.ring_width_mm = 2.5
    mock_spec.max_score.return_value = 10.9
    mock_spec.pellet_diameter_mm = 4.5
    mock_spec.inner_ten_diameter_mm = 5.0
    mock_get_spec.return_value = mock_spec

    calibration = TargetCalibration(
        center=(500.0, 500.0),
        major_radius=400.0,
        minor_radius=400.0,
        mm_per_pixel=0.17,
        rotation_deg=0.0,
        eccentricity=0.0
    )

    # Create a hole that would score < 1.0
    # adjusted_dist = 170.0 - 2.25 = 167.75
    # raw = 10.9 - (167.75 / 2.5) = 10.9 - 67.1 = -56.2
    holes = [FusedHole(x=1500.0, y=500.0, radius=10.0, confidence=0.9, method="cv")]

    results = score_holes(holes, calibration, "air_rifle_10m")

    # Should be filtered out
    assert len(results) == 0
