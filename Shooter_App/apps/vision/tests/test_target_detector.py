import cv2
import numpy as np
import pytest

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.target_detector import (
    detect_target,
    _robust_hough_detect,
    _gradient_voting_detect,
    _contour_based_detect,
    _calibrate_rings,
    _refine_center_symmetry,
    _estimate_perspective
)
from pipeline.target_specs import get_spec

def _create_concentric_circles_image(size=800, cx=400, cy=400, radii=[200, 160, 120, 80, 40], thickness=2):
    img = np.full((size, size), 255, dtype=np.uint8)
    for r in radii:
        cv2.circle(img, (cx, cy), r, 0, thickness)
    return img

def test_robust_hough_detect():
    img = _create_concentric_circles_image()
    result = _robust_hough_detect(img, 800, 800)
    assert result is not None
    res_cx, res_cy, res_r, conf = result
    assert abs(res_cx - 400) < 5
    assert abs(res_cy - 400) < 5
    assert conf > 0.0

def test_gradient_voting_detect():
    img = _create_concentric_circles_image(radii=[180, 150, 120, 90, 60], thickness=5)
    result = _gradient_voting_detect(img, 800, 800)
    assert result is not None
    res_cx, res_cy, res_r, conf = result
    assert abs(res_cx - 400) < 5
    assert abs(res_cy - 400) < 5
    assert conf > 0.0

def test_contour_based_detect():
    # Needs multiple concentric circles to find a cluster
    img = _create_concentric_circles_image(radii=[180, 150, 120, 90, 60], thickness=3)
    result = _contour_based_detect(img, 800, 800)
    assert result is not None
    res_cx, res_cy, res_r, conf = result
    assert abs(res_cx - 400) < 5
    assert abs(res_cy - 400) < 5
    assert conf > 0.0

def test_contour_based_detect_none_returned():
    # Blank image should return None
    img = np.full((800, 800), 255, dtype=np.uint8)
    result = _contour_based_detect(img, 800, 800)
    assert result is None

def test_detect_target_full_pipeline_clean_image():
    # 10 rings roughly evenly spaced
    img = _create_concentric_circles_image(radii=[300, 270, 240, 210, 180, 150, 120, 90, 60, 30])
    calib = detect_target(img, "air_rifle_10m")

    assert abs(calib.center[0] - 400) < 10
    assert abs(calib.center[1] - 400) < 10
    assert calib.confidence > 0.1
    # Check that we found 10 rings
    assert len(calib.ring_radii) == 10

def test_detect_target_fallback_on_blank():
    # A completely blank image should return fallback values (center in the middle)
    img = np.full((800, 800), 255, dtype=np.uint8)
    calib = detect_target(img, "air_rifle_10m")

    assert abs(calib.center[0] - 400) < 1
    assert abs(calib.center[1] - 400) < 1
    assert calib.confidence == 0.1

def test_refine_center_symmetry():
    # Provide a perfect target to start, giving exact true center.
    # The symmetry refine function can be a bit jittery,
    # just ensure it doesn't drift too wildly.
    img = _create_concentric_circles_image(cx=400, cy=400)
    refined_cx, refined_cy = _refine_center_symmetry(img, 400.0, 400.0, 200.0)

    # Check it didn't drift wildly
    assert abs(refined_cx - 400) <= 10.0
    assert abs(refined_cy - 400) <= 10.0

def test_estimate_perspective_no_tilt():
    img = _create_concentric_circles_image(radii=[200])
    major_r, minor_r, rotation, ecc = _estimate_perspective(img, 400, 400, 200)

    # A perfect circle has eccentricity near 0, and major/minor radius ~200
    assert abs(major_r - 200) < 5
    assert abs(minor_r - 200) < 5
    assert ecc < 0.1

def test_calibrate_rings():
    img = _create_concentric_circles_image(radii=[300, 270, 240, 210, 180, 150, 120, 90, 60, 30])
    spec = get_spec("air_rifle_10m")

    mm_per_pixel, ring_radii = _calibrate_rings(img, 400, 400, 300, spec)

    # 10 rings total
    assert len(ring_radii) == 10

    # The outer ring (radius=300px) is ~22.75mm for air rifle
    # mm_per_pixel should be roughly 22.75 / 300 = ~0.0758
    expected_ratio = spec.outer_radius_mm / 300.0

    assert abs(mm_per_pixel - expected_ratio) < 0.01

    # ring_radii[0] is the outer ring, should be ~300 pixels
    assert abs(ring_radii[0] - 300) < 10
