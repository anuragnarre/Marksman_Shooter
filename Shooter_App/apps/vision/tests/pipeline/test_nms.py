import pytest
import sys
import os

# Adjust path so we can import pipeline modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from pipeline.types import FusedHole
from pipeline.nms import fuse_candidates, nms_boxes, CV_SOLO_THRESHOLD, YOLO_SOLO_THRESHOLD, PAIR_CONFIDENCE_BOOST

def test_fuse_empty():
    assert fuse_candidates([], []) == []

def test_fuse_yolo_empty():
    # Only CV holes, YOLO empty
    cv_holes = [
        FusedHole(x=10, y=10, radius=5, confidence=0.8, method="cv")
    ]
    res = fuse_candidates(cv_holes, [])
    assert len(res) == 1
    assert res[0].method == "cv"
    assert res[0].confidence == 0.8

def test_fuse_candidates_matching():
    # CV and YOLO holes are close to each other
    cv_holes = [
        FusedHole(x=10, y=10, radius=5, confidence=0.6, method="cv")
    ]
    yolo_holes = [
        FusedHole(x=11, y=9, radius=5, confidence=0.7, method="yolo")
    ]

    res = fuse_candidates(cv_holes, yolo_holes)
    assert len(res) == 1
    fused = res[0]
    assert fused.method == "fused"
    assert fused.methods_agreed == 2

    # Check weighted centroid logic
    total_w = 0.6 + 0.7
    expected_x = (10 * 0.6 + 11 * 0.7) / total_w
    expected_y = (10 * 0.6 + 9 * 0.7) / total_w
    expected_r = (5 * 0.6 + 5 * 0.7) / total_w
    expected_conf = min(1.0, (0.6 + 0.7) / 2 + PAIR_CONFIDENCE_BOOST)

    assert fused.x == pytest.approx(expected_x)
    assert fused.y == pytest.approx(expected_y)
    assert fused.radius == pytest.approx(expected_r)
    assert fused.confidence == pytest.approx(expected_conf)

def test_fuse_unmatched_cv_above_threshold():
    cv_holes = [
        FusedHole(x=100, y=100, radius=5, confidence=CV_SOLO_THRESHOLD + 0.1, method="cv")
    ]
    # For unmatched CV to hit threshold check, yolo_holes must not be empty
    # (otherwise it goes to early return NMS only)
    yolo_holes = [
        FusedHole(x=500, y=500, radius=5, confidence=YOLO_SOLO_THRESHOLD + 0.1, method="yolo")
    ]
    res = fuse_candidates(cv_holes, yolo_holes)
    assert len(res) == 2
    methods = [r.method for r in res]
    assert "cv" in methods
    assert "yolo" in methods

def test_fuse_unmatched_cv_below_threshold():
    cv_holes = [
        FusedHole(x=100, y=100, radius=5, confidence=CV_SOLO_THRESHOLD - 0.05, method="cv")
    ]
    yolo_holes = [
        FusedHole(x=500, y=500, radius=5, confidence=YOLO_SOLO_THRESHOLD + 0.1, method="yolo")
    ]
    res = fuse_candidates(cv_holes, yolo_holes)
    # The CV hole should be dropped, YOLO hole should be kept.
    assert len(res) == 1
    assert res[0].method == "yolo"

def test_fuse_unmatched_yolo_above_threshold():
    yolo_holes = [
        FusedHole(x=200, y=200, radius=5, confidence=YOLO_SOLO_THRESHOLD + 0.1, method="yolo")
    ]
    # No CV holes, YOLO hole > YOLO_SOLO_THRESHOLD
    res = fuse_candidates([], yolo_holes)
    assert len(res) == 1
    assert res[0].method == "yolo"

def test_fuse_unmatched_yolo_below_threshold():
    yolo_holes = [
        FusedHole(x=200, y=200, radius=5, confidence=YOLO_SOLO_THRESHOLD - 0.05, method="yolo")
    ]
    res = fuse_candidates([], yolo_holes)
    assert len(res) == 0

def test_fuse_final_nms():
    # Provide multiple matches/holes that will end up overlapping
    cv_holes = [
        FusedHole(x=50, y=50, radius=5, confidence=0.8, method="cv"),
        FusedHole(x=52, y=52, radius=5, confidence=0.6, method="cv")
    ]
    yolo_holes = [
        # This will pair with the first CV hole
        FusedHole(x=49, y=51, radius=5, confidence=0.9, method="yolo")
    ]
    # So we get one fused hole (from cv[0] and yolo[0]), and one unmatched cv[1].
    # But cv[1] and the fused hole overlap significantly, so final NMS should remove cv[1].
    res = fuse_candidates(cv_holes, yolo_holes, iou_threshold=0.3)
    assert len(res) == 1
    assert res[0].method == "fused"

def test_nms_boxes():
    holes = [
        FusedHole(x=10, y=10, radius=5, confidence=0.9),
        FusedHole(x=11, y=11, radius=5, confidence=0.8), # overlap with 1st -> suppress
        FusedHole(x=100, y=100, radius=5, confidence=0.7),
        FusedHole(x=101, y=101, radius=5, confidence=0.95), # overlap with 3rd, higher conf -> suppress 3rd
    ]
    res = nms_boxes(holes, iou_threshold=0.3)
    assert len(res) == 2
    # The two kept should be the ones with higher confidence
    confidences = [h.confidence for h in res]
    assert 0.95 in confidences
    assert 0.9 in confidences
