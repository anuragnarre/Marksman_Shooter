import sys
import os
import cv2
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.target_detector import detect_target
from pipeline.target_specs import get_spec

TARGET_TYPE = "air_rifle_10m"

def test_detect_target_basic():
    """Test target detection on a basic image with known circles (tests Hough cascade)."""
    # Create a synthetic image with concentric circles simulating a target
    h, w = 500, 500
    cx, cy = 250, 250
    gray = np.full((h, w), 255, dtype=np.uint8)

    spec = get_spec(TARGET_TYPE)
    # Estimate mm to pixel ratio so that target fits in the image
    mm_per_px = spec.outer_radius_mm / 200.0

    # Draw rings from outside in
    for i in range(spec.num_rings, 0, -1):
        r_px = int(spec.ring_radius_mm(i) / mm_per_px)
        color = 0 if i <= 3 else 255
        cv2.circle(gray, (cx, cy), r_px, color, -1)
        # Draw ring boundary
        cv2.circle(gray, (cx, cy), r_px, 0, 1)

    # Blur a bit to simulate camera noise
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Add a cross for the bullseye
    cv2.circle(gray, (cx, cy), int(0.5 / mm_per_px), 255, -1)

    # Detect
    calib = detect_target(gray, TARGET_TYPE)

    # Verify
    assert calib is not None
    assert abs(calib.center[0] - cx) < 5
    assert abs(calib.center[1] - cy) < 5
    assert calib.confidence > 0.0
    assert len(calib.ring_radii) == spec.num_rings

def test_detect_target_blank_image():
    """Test detection on a blank image handles failures gracefully."""
    gray = np.full((500, 500), 255, dtype=np.uint8)

    calib = detect_target(gray, TARGET_TYPE)

    assert calib is not None
    # In target_detector.py, fallback returns 0.1 confidence when methods fail
    assert calib.confidence <= 0.1

def test_detect_target_scaled_image():
    """Test detection on a large image that triggers downscaling."""
    # Create a large image (>800x800)
    h, w = 1200, 1200
    cx, cy = 600, 600
    gray = np.full((h, w), 255, dtype=np.uint8)

    spec = get_spec(TARGET_TYPE)
    mm_per_px = spec.outer_radius_mm / 400.0

    for i in range(spec.num_rings, 0, -1):
        r_px = int(spec.ring_radius_mm(i) / mm_per_px)
        color = 0 if i <= 3 else 255
        cv2.circle(gray, (cx, cy), r_px, color, -1)
        cv2.circle(gray, (cx, cy), r_px, 0, 1)

    calib = detect_target(gray, TARGET_TYPE)

    assert calib is not None
    # Because of downscaling and then upscaling the coordinates,
    # the tolerance should be slightly higher.
    assert abs(calib.center[0] - cx) < 15
    assert abs(calib.center[1] - cy) < 15
    assert calib.confidence > 0.0
    assert len(calib.ring_radii) == spec.num_rings
