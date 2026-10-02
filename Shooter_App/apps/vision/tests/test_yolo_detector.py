import pytest
import numpy as np
from unittest.mock import patch, MagicMock

import cv2
from pipeline.types import TargetCalibration, FusedHole
import pipeline.yolo_detector as yolo_detector

@pytest.fixture
def mock_ort_session():
    with patch('pipeline.yolo_detector._ort_session') as mock_session:
        with patch('pipeline.yolo_detector._yolo_available', True):
            yield mock_session

def test_detect_holes_yolo_not_available():
    # Setup
    yolo_detector._yolo_available = False
    warped_gray = np.zeros((1000, 1000), dtype=np.uint8)
    calibration = TargetCalibration(center=(500.0, 500.0), major_radius=100.0, minor_radius=100.0, rotation_deg=0.0, eccentricity=0.0)

    # Execute
    result = yolo_detector.detect_holes_yolo(warped_gray, calibration, "nr_50m")

    # Assert
    assert result == []


@patch('pipeline.yolo_detector._sahi_four_quadrant')
@patch('pipeline.yolo_detector._refine_centroid')
def test_detect_holes_yolo_success(mock_refine_centroid, mock_sahi, mock_ort_session):
    # Setup
    yolo_detector._yolo_available = True
    yolo_detector._ort_session = mock_ort_session

    warped_gray = np.zeros((1000, 1000), dtype=np.uint8)
    calibration = TargetCalibration(center=(500.0, 500.0), major_radius=100.0, minor_radius=100.0, rotation_deg=0.0, eccentricity=0.0)

    # Mock SAHI to return 2 dummy detections
    # format: cx_full, cy_full, bw_full, bh_full, conf
    mock_sahi.return_value = [
        (100.0, 100.0, 20.0, 20.0, 0.9),
        (500.0, 500.0, 15.0, 15.0, 0.8)
    ]

    # Mock centroid refinement
    mock_refine_centroid.side_effect = [
        (101.0, 101.0),
        (501.0, 501.0)
    ]

    # Execute
    result = yolo_detector.detect_holes_yolo(warped_gray, calibration, "nr_50m", conf_threshold=0.25)

    # Assert
    assert mock_sahi.called
    assert mock_refine_centroid.call_count == 2

    assert len(result) == 2
    assert isinstance(result[0], FusedHole)

    assert result[0].x == 101.0
    assert result[0].y == 101.0
    assert result[0].radius == 10.0
    assert result[0].confidence == 0.9
    assert result[0].method == "yolo"

    assert result[1].x == 501.0
    assert result[1].y == 501.0
    assert result[1].radius == 7.5
    assert result[1].confidence == 0.8
    assert result[1].method == "yolo"

def test_nms_raw():
    # Setup
    boxes = [
        (100.0, 100.0, 20.0, 20.0, 0.9), # Keep: highest conf
        (105.0, 105.0, 20.0, 20.0, 0.8), # Suppress: highly overlaps with first box
        (500.0, 500.0, 15.0, 15.0, 0.7), # Keep: no overlap
    ]

    # Execute
    result = yolo_detector._nms_raw(boxes, iou_threshold=0.3)

    # Assert
    assert len(result) == 2
    assert result[0] == boxes[0]
    assert result[1] == boxes[2]

def test_raw_iou():
    # Perfect overlap
    box_a = (100.0, 100.0, 20.0, 20.0, 0.9)
    box_b = (100.0, 100.0, 20.0, 20.0, 0.8)
    assert yolo_detector._raw_iou(box_a, box_b) == 1.0

    # No overlap
    box_c = (200.0, 200.0, 20.0, 20.0, 0.9)
    assert yolo_detector._raw_iou(box_a, box_c) == 0.0

    # Partial overlap
    box_d = (110.0, 100.0, 20.0, 20.0, 0.9)
    # Area of each box = 400.
    # Intersection = 10 (width) * 20 (height) = 200.
    # Union = 400 + 400 - 200 = 600.
    # IoU = 200 / 600 = 1/3
    assert pytest.approx(yolo_detector._raw_iou(box_a, box_d), 0.01) == 0.333

def test_parse_yolov8_output():
    # Setup
    # Format B: (1, 4+num_classes, num_anchors)
    # E.g., 1 class. 4+1 = 5. Let's make 2 anchors.
    # We want this to be [cx, cy, w, h, conf]
    raw = np.array([
        [
            [10.0, 20.0], # cx
            [30.0, 40.0], # cy
            [15.0, 25.0], # w
            [15.0, 25.0], # h
            [0.9, 0.1]    # conf
        ]
    ])

    # Execute
    result = yolo_detector._parse_yolov8_output(raw, conf_threshold=0.5)

    # Assert
    assert len(result) == 1
    assert result[0] == (10.0, 30.0, 15.0, 15.0, 0.9)

def test_parse_yolov8_output_format_a():
    # Format A: (1, num_anchors, 4+num_classes)
    raw = np.array([
        [
            [10.0, 30.0, 15.0, 15.0, 0.9],
            [20.0, 40.0, 25.0, 25.0, 0.1]
        ]
    ])

    # Execute
    result = yolo_detector._parse_yolov8_output(raw, conf_threshold=0.5)

    # Assert
    assert len(result) == 1
    assert result[0] == (10.0, 30.0, 15.0, 15.0, 0.9)

@patch('pipeline.yolo_detector._run_inference')
def test_sahi_four_quadrant_mocked(mock_run_inference):
    # Setup
    yolo_detector.YOLO_INPUT_SIZE = 1280
    # Create dummy 1000x1000 rgb
    rgb_full = np.zeros((1000, 1000, 3), dtype=np.uint8)

    # We have 4 tiles. Let's have _run_inference return 1 box for the first tile, and 0 for others.
    # First tile is TL (0, 0), size 550x550
    # Let's say model output is (640, 640, 64, 64, 0.9)
    # So cx_t = 640.0. actual_w = 550. YOLO_INPUT_SIZE = 1280.
    # cx_full = (640 / 1280) * 550 + 0 = 275.

    def side_effect(tile, conf_threshold):
        # We can distinguish tiles by call count or we just return one box for the first call
        if side_effect.calls == 0:
            side_effect.calls += 1
            return [(640.0, 640.0, 64.0, 64.0, 0.9)]
        return []

    side_effect.calls = 0
    mock_run_inference.side_effect = side_effect

    # Execute
    result = yolo_detector._sahi_four_quadrant(rgb_full, conf_threshold=0.25)

    # Assert
    assert mock_run_inference.call_count == 4
    assert len(result) == 1

    # cx, cy, bw, bh, conf
    assert result[0][0] == 275.0 # cx_full
    assert result[0][1] == 275.0 # cy_full
    assert result[0][2] == 27.5  # bw_full: (64 / 1280) * 550
    assert result[0][3] == 27.5  # bh_full
    assert result[0][4] == 0.9

def test_refine_centroid_degenerate():
    # If moments are degenerate (e.g. hole is entirely flat), we should fall back to cx, cy
    gray = np.zeros((1000, 1000), dtype=np.uint8)
    # Place a very small box that evaluates to all zeros
    cx, cy = 50.0, 50.0
    bw, bh = 2.0, 2.0

    ref_cx, ref_cy = yolo_detector._refine_centroid(gray, cx, cy, bw, bh)

    assert ref_cx == cx
    assert ref_cy == cy

def test_refine_centroid_dark_hole_on_light():
    gray = np.full((1000, 1000), 200, dtype=np.uint8)

    # Draw a dark hole
    cv2.circle(gray, (100, 100), 10, 50, -1)

    # Initial bounding box off by a bit
    cx, cy = 102.0, 102.0
    bw, bh = 25.0, 25.0

    ref_cx, ref_cy = yolo_detector._refine_centroid(gray, cx, cy, bw, bh)

    # The refined centroid should be closer to 100, 100
    assert isinstance(ref_cx, float)
    assert abs(ref_cx - 100.0) < 5.0
    assert isinstance(ref_cy, float)
    assert abs(ref_cy - 100.0) < 5.0

def test_refine_centroid_light_hole_on_dark():
    gray = np.full((1000, 1000), 50, dtype=np.uint8)

    # Draw a light hole
    cv2.circle(gray, (100, 100), 10, 200, -1)

    # Initial bounding box off by a bit
    cx, cy = 102.0, 102.0
    bw, bh = 25.0, 25.0

    ref_cx, ref_cy = yolo_detector._refine_centroid(gray, cx, cy, bw, bh)

    # The refined centroid should be closer to 100, 100
    assert isinstance(ref_cx, float)
    assert abs(ref_cx - 100.0) < 5.0
    assert isinstance(ref_cy, float)
    assert abs(ref_cy - 100.0) < 5.0
