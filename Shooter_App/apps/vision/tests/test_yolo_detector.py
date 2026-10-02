import os
import sys
from unittest.mock import MagicMock, patch

import cv2
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.types import TargetCalibration
from pipeline import yolo_detector
from pipeline.yolo_detector import detect_holes_yolo, _parse_yolov8_output

@pytest.fixture
def mock_onnx_session():
    orig_session = yolo_detector._ort_session
    orig_available = yolo_detector._yolo_available

    mock_session = MagicMock()
    yolo_detector._ort_session = mock_session
    yolo_detector._yolo_available = True

    yield mock_session

    yolo_detector._ort_session = orig_session
    yolo_detector._yolo_available = orig_available


def test_parse_yolov8_output():
    # Test Format A (1, num_anchors, 4+num_classes) -> (1, 8400, 5)
    raw_a = np.zeros((1, 10, 5), dtype=np.float32)
    raw_a[0, 0] = [100.0, 100.0, 20.0, 20.0, 0.9]  # valid
    raw_a[0, 1] = [50.0, 50.0, 10.0, 10.0, 0.1]    # below threshold

    boxes_a = _parse_yolov8_output(raw_a, conf_threshold=0.5)
    assert len(boxes_a) == 1
    assert pytest.approx(boxes_a[0][0]) == 100.0
    assert pytest.approx(boxes_a[0][4]) == 0.9

    # Test Format B (1, 4+num_classes, num_anchors) -> (1, 5, 8400) - ultralytics default
    raw_b = np.zeros((1, 5, 10), dtype=np.float32)
    raw_b[0, :, 0] = [200.0, 200.0, 30.0, 30.0, 0.8]  # valid
    raw_b[0, :, 1] = [60.0, 60.0, 15.0, 15.0, 0.2]    # below threshold

    boxes_b = _parse_yolov8_output(raw_b, conf_threshold=0.5)
    assert len(boxes_b) == 1
    assert pytest.approx(boxes_b[0][0]) == 200.0
    assert pytest.approx(boxes_b[0][4]) == 0.8


def test_detect_holes_yolo(mock_onnx_session):
    fake_output = np.zeros((1, 5, 8400), dtype=np.float32)
    fake_output[0, 0, 0] = 640.0 # cx
    fake_output[0, 1, 0] = 640.0 # cy
    fake_output[0, 2, 0] = 40.0  # bw
    fake_output[0, 3, 0] = 40.0  # bh
    fake_output[0, 4, 0] = 0.9   # conf

    mock_onnx_session.run.return_value = [fake_output]

    warped_gray = np.full((1000, 1000), 200, dtype=np.uint8)

    cv2.circle(warped_gray, (275, 275), 10, 50, -1)

    cal = TargetCalibration(
        major_radius=100.0,
        minor_radius=100.0,
        center=(500, 500),
        rotation_deg=0.0,
        mm_per_pixel=0.1,
        eccentricity=0.0,
        confidence=1.0
    )

    holes = detect_holes_yolo(
        warped_gray=warped_gray,
        calibration=cal,
        target_type="air_rifle_10m",
        conf_threshold=0.25
    )

    assert len(holes) == 4

    h1 = sorted(holes, key=lambda h: h.x**2 + h.y**2)[0]
    assert h1.method == "yolo"
    assert h1.methods_agreed == 1
    assert pytest.approx(h1.confidence, rel=1e-3) == 0.9
    assert 270 <= h1.x <= 280
    assert 270 <= h1.y <= 280

def test_detect_holes_yolo_unavailable():
    orig_session = yolo_detector._ort_session
    orig_available = yolo_detector._yolo_available

    yolo_detector._ort_session = None
    yolo_detector._yolo_available = False

    warped_gray = np.full((1000, 1000), 200, dtype=np.uint8)
    cal = TargetCalibration(
        major_radius=100.0,
        minor_radius=100.0,
        center=(500, 500),
        rotation_deg=0.0,
        mm_per_pixel=0.1,
        eccentricity=0.0,
        confidence=1.0
    )

    holes = detect_holes_yolo(
        warped_gray=warped_gray,
        calibration=cal,
        target_type="air_rifle_10m"
    )

    assert len(holes) == 0

    yolo_detector._ort_session = orig_session
    yolo_detector._yolo_available = orig_available
