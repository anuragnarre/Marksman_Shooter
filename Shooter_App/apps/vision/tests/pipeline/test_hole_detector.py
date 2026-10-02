import os
import sys
import pytest
import numpy as np
import math

# Add apps/vision to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from pipeline.types import TargetCalibration
from pipeline.hole_detector import detect_holes, _has_radial_gradient, _deduplicate, FusedHole

def test_detect_holes_small_radius():
    # Setup
    gray = np.zeros((100, 100), dtype=np.uint8)
    calibration = TargetCalibration(
        center=(50, 50),
        major_radius=5.0, # < 10, should return early
        minor_radius=5.0,
        rotation_deg=0.0,
        eccentricity=0.0,
    )

    # Execute
    result = detect_holes(gray, calibration)

    # Assert
    assert result == []

def test_has_radial_gradient_bright():
    # Setup: Create a patch with a bright center and dark surround
    gray = np.zeros((100, 100), dtype=np.uint8)

    # Draw dark background
    cv2 = __import__("cv2")
    cv2.circle(gray, (50, 50), 20, 50, -1)

    # Draw bright center
    cv2.circle(gray, (50, 50), 10, 200, -1)

    # Execute
    result = _has_radial_gradient(gray, cx=50.0, cy=50.0, r=20.0, bright=True)

    # Assert
    assert result == True

    # Test rejection
    result_reject = _has_radial_gradient(gray, cx=50.0, cy=50.0, r=20.0, bright=False)
    assert result_reject == False

def test_deduplicate():
    # Setup
    holes = [
        FusedHole(x=10.0, y=10.0, radius=5.0, confidence=0.9),
        FusedHole(x=11.0, y=11.0, radius=5.0, confidence=0.8), # Should merge with first
        FusedHole(x=50.0, y=50.0, radius=5.0, confidence=0.9), # Should remain separate
    ]

    # Execute
    result = _deduplicate(holes, merge_r=5.0)

    # Assert
    assert len(result) == 2

    # Find merged hole (close to 10,10)
    merged = next(h for h in result if h.x < 20)
    assert 10.0 <= merged.x <= 11.0
    assert 10.0 <= merged.y <= 11.0
    assert merged.confidence > 0.9 # Confidence should increase slightly

    # Find unmerged hole
    unmerged = next(h for h in result if h.x > 20)
    assert unmerged.x == 50.0
    assert unmerged.y == 50.0

def test_has_radial_gradient_edge_cases():
    # Setup
    gray = np.zeros((100, 100), dtype=np.uint8)

    # Test 1: Near edge, where bbox exceeds image
    result1 = _has_radial_gradient(gray, cx=1.0, cy=1.0, r=20.0, bright=True)
    assert result1 == True  # Returns true when it can't check

    # Test 2: Flat image, no dynamic range
    result2 = _has_radial_gradient(gray, cx=50.0, cy=50.0, r=20.0, bright=True)
    assert result2 == True  # Returns true when dynamic range is too low


def test_has_radial_gradient_dark():
    # Setup: Create a patch with a dark center and bright surround
    gray = np.zeros((100, 100), dtype=np.uint8)

    # Draw bright background
    cv2 = __import__("cv2")
    cv2.circle(gray, (50, 50), 20, 200, -1)

    # Draw dark center
    cv2.circle(gray, (50, 50), 10, 50, -1)

    # Execute
    result = _has_radial_gradient(gray, cx=50.0, cy=50.0, r=20.0, bright=False)

    # Assert
    assert result == True

    # Test rejection (expecting bright but got dark)
    result_reject = _has_radial_gradient(gray, cx=50.0, cy=50.0, r=20.0, bright=True)
    assert result_reject == False

def test_find_saddle_splits():
    from pipeline.hole_detector import _find_saddle_splits

    # Create a 100x100 accumulator array
    acc = np.zeros((100, 100), dtype=np.float32)

    # Add a main peak at (50, 50)
    acc[50, 50] = 100.0

    # Add a secondary peak at (70, 50) to represent a merged shot
    # This is 20 pixels away. If visible_r is 12, min_sep=14.4, max_sep=24.0.
    # So 20 is within the search range.
    acc[50, 70] = 80.0

    # Fill in a bit of the area around the peaks so the mean calculations work
    cv2 = __import__("cv2")
    cv2.circle(acc, (50, 50), 5, 50.0, -1)
    cv2.circle(acc, (70, 50), 5, 40.0, -1)

    # The saddle between them should be lower
    acc[50, 60] = 10.0

    peaks = [(50.0, 50.0)]
    visible_r = 12.0

    # Execute
    result = _find_saddle_splits(acc, peaks, visible_r)

    # Assert
    assert len(result) > 1
    # Check that the new peak is near (70, 50)
    new_peaks = [p for p in result if p != (50.0, 50.0)]
    assert len(new_peaks) > 0
    assert 65.0 <= new_peaks[0][0] <= 75.0
    assert 45.0 <= new_peaks[0][1] <= 55.0


def test_filter_ring_artifacts():
    from pipeline.hole_detector import _filter_ring_artifacts

    # Strategy 1: Multiple detections at the SAME known ring-boundary radius in the CREAM ZONE
    holes = [
        FusedHole(x=10.0, y=10.0, radius=5.0, confidence=0.9), # Real hole
        FusedHole(x=100.0, y=0.0, radius=5.0, confidence=0.8), # Ring artifact 1
        FusedHole(x=0.0, y=100.0, radius=5.0, confidence=0.8), # Ring artifact 2
    ]

    # cx, cy = 0, 0
    # Artifacts are at distance 100. Real hole is at distance ~14.

    # Setup
    cx, cy = 0.0, 0.0
    visible_r = 5.0
    ring_radii_px = [100.0]
    ring_width_px = 1.0
    black_radius = 50.0 # Cream zone starts at 50

    # Execute
    result = _filter_ring_artifacts(
        holes, cx, cy, visible_r,
        ring_radii_px=ring_radii_px,
        ring_width_px=ring_width_px,
        black_radius=black_radius
    )

    # Assert
    assert len(result) == 1
    assert result[0].x == 10.0

    # Strategy 2: Groups of >= 3 at same radius
    holes2 = [
        FusedHole(x=10.0, y=10.0, radius=5.0, confidence=0.9),  # Real hole (dist ~14)
        FusedHole(x=60.0, y=0.0, radius=5.0, confidence=0.6),   # Artifact 1 (dist 60)
        FusedHole(x=0.0, y=60.0, radius=5.0, confidence=0.7),   # Artifact 2 (dist 60)
        FusedHole(x=-60.0, y=0.0, radius=5.0, confidence=0.5),  # Artifact 3 (dist 60)
    ]

    # Execute
    result2 = _filter_ring_artifacts(
        holes2, cx, cy, visible_r,
        ring_radii_px=None,
        ring_width_px=0.0,
        black_radius=0.0
    )

    # Assert
    assert len(result2) == 3
    # Artifact 3 should be removed because it has the lowest confidence
    assert not any(h.x == -60.0 and h.y == 0.0 for h in result2)

def test_detect_holes_with_synthetic_image():
    from pipeline.target_specs import get_spec
    from tests.generate_synthetic import _build_image
    from pipeline.target_detector import detect_target
    import cv2

    spec = get_spec("air_rifle_10m")
    # Add a shot near the center (black zone)
    shots = [(2.0, 0)]
    img, ann = _build_image(spec, shots, brightness=1.0)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    cal = detect_target(gray, "air_rifle_10m")

    # Execute
    holes = detect_holes(gray, cal, spec.pellet_diameter_mm, dark_center_rings=spec.dark_center_rings)

    # Assert
    assert len(holes) >= 1

    # We generated holes. They might have false positives but we must detect the ones we added.
    px_per_mm = 1.0 / cal.mm_per_pixel
    cx, cy = cal.center

    # Synthetic generator draws center at (w/2, h/2).
    # Since we added at angle=0, x increases by r * px_per_mm.
    sx1 = cx + 2.0 * px_per_mm
    sy1 = cy

    # Second shot at angle=90, y decreases by r * px_per_mm.
    sx2 = cx
    sy2 = cy - 20.0 * px_per_mm

    # The detector might find multiple candidates, we just check that there is at least one near our expected locations
    # (distance within roughly half a pellet radius, 2.25mm)
    tol = 2.25 * px_per_mm

    found_shot1 = [h for h in holes if math.dist((h.x, h.y), (sx1, sy1)) < tol]

    assert len(found_shot1) >= 1, f"Missing shot 1 near ({sx1}, {sy1}). Detected: {holes}"
