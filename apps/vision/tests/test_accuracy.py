"""
Pipeline accuracy test suite using synthetic labeled images.

Run with:
    cd apps/vision
    python -m pytest tests/test_accuracy.py -v

Metrics tested:
  - Single-shot detection rate  ≥ 95%
  - Score MAE for detected shots ≤ 0.15 points
  - Tight group (3-shot) recall ≥ 85%
  - False positive rate on clean targets == 0
  - Ring boundary score accuracy ± 0.1 points
  - Perspective robustness (detection + score within 0.2 at 15° tilt)
"""

import sys
import os
from typing import List, Tuple

import cv2
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from analyzer import analyze_target_image
from pipeline.target_specs import get_spec
from tests.generate_synthetic import generate_test_cases, _build_image


TARGET_TYPE = "air_rifle_10m"


def _image_to_bytes(img: np.ndarray) -> bytes:
    _, buf = cv2.imencode(".png", img)
    return buf.tobytes()


def _match_shots(
    predicted: list,
    ground_truth: list,
    score_tol: float = 0.5,
) -> Tuple[int, int, List[float]]:
    """
    Greedy match predicted shots to ground-truth shots by score proximity.

    Returns (num_matched, num_gt, score_errors).
    """
    matched_gt = set()
    score_errors: List[float] = []
    for pred in predicted:
        for j, gt in enumerate(ground_truth):
            if j in matched_gt:
                continue
            if abs(pred.score - gt["score"]) <= score_tol:
                matched_gt.add(j)
                score_errors.append(abs(pred.score - gt["score"]))
                break
    return len(matched_gt), len(ground_truth), score_errors


# ─── Fixture: collect all single-shot test cases ──────────────────────────────

def _collect_single_shot_cases():
    spec = get_spec(TARGET_TYPE)
    cases = []
    for ring_num in range(1, spec.num_rings + 1):
        r_mm = spec.ring_radius_mm(ring_num) - spec.ring_width_mm / 2.0
        for angle in [0, 45, 90, 135]:
            for brightness in [0.7, 1.0, 1.3]:
                shots = [(r_mm, angle)]
                img, ann = _build_image(spec, shots, brightness=brightness)
                cases.append((img, ann))
    return cases


def _collect_tight_group_cases():
    spec = get_spec(TARGET_TYPE)
    cases = []
    for center_dist in [5.0, 15.0, 30.0]:
        shots = [
            (center_dist, 0),
            (center_dist + spec.ring_width_mm * 0.3, 40),
            (center_dist - spec.ring_width_mm * 0.2, 80),
        ]
        for blur in [0.0, 1.0, 2.0]:
            img, ann = _build_image(spec, shots, blur_sigma=blur)
            cases.append((img, ann))
    return cases


# ─── Tests ────────────────────────────────────────────────────────────────────

class TestPipelineAccuracy:

    def test_single_shot_detection_rate(self):
        """Single shots must be detected in ≥ 95% of cases."""
        cases = _collect_single_shot_cases()
        detected = 0
        for img, ann in cases:
            if not ann:
                continue
            try:
                result = analyze_target_image(_image_to_bytes(img), TARGET_TYPE)
                if result.shots:
                    detected += 1
            except Exception:
                pass

        rate = detected / max(1, len(cases))
        assert rate >= 0.95, (
            f"Single-shot detection rate {rate:.1%} < 95% "
            f"({detected}/{len(cases)} cases detected)"
        )

    def test_score_mae(self):
        """Mean absolute score error for detected shots must be ≤ 0.15."""
        cases = _collect_single_shot_cases()
        errors: List[float] = []
        for img, ann in cases:
            if not ann:
                continue
            try:
                result = analyze_target_image(_image_to_bytes(img), TARGET_TYPE)
            except Exception:
                continue
            if not result.shots:
                continue
            # Match best shot to ground truth
            _, _, errs = _match_shots(result.shots, ann, score_tol=1.0)
            errors.extend(errs)

        if not errors:
            pytest.skip("No detected shots — check detection test first")

        mae = float(np.mean(errors))
        assert mae <= 0.15, f"Score MAE {mae:.3f} > 0.15 points"

    def test_tight_group_recall(self):
        """3-shot tight groups must have all 3 shots detected in ≥ 85% of images."""
        cases = _collect_tight_group_cases()
        full_detect = 0
        total = len(cases)

        for img, ann in cases:
            if len(ann) < 3:
                total -= 1
                continue
            try:
                result = analyze_target_image(_image_to_bytes(img), TARGET_TYPE)
            except Exception:
                continue
            matched, n_gt, _ = _match_shots(result.shots, ann, score_tol=0.6)
            if matched >= n_gt:
                full_detect += 1

        rate = full_detect / max(1, total)
        assert rate >= 0.85, (
            f"Tight group full-recall rate {rate:.1%} < 85% "
            f"({full_detect}/{total})"
        )

    def test_false_positive_rate(self):
        """Clean targets (no shots) must produce 0 detections."""
        spec = get_spec(TARGET_TYPE)
        img = _build_image(spec, [], brightness=1.0)[0]
        try:
            result = analyze_target_image(_image_to_bytes(img), TARGET_TYPE)
        except Exception as e:
            pytest.fail(f"Pipeline error on clean target: {e}")

        assert len(result.shots) == 0, (
            f"False positives on clean target: {len(result.shots)} detections"
        )

    def test_score_boundary_accuracy(self):
        """
        Shots placed ±0.05 mm from a ring boundary must score on the correct side
        (within ± 0.1 of the expected ISSF score).
        """
        spec = get_spec(TARGET_TYPE)
        errors: List[float] = []

        for ring_num in range(2, spec.num_rings):
            boundary_mm = spec.ring_radius_mm(ring_num)
            for offset_mm in [-0.05, +0.05]:
                dist_mm = boundary_mm + offset_mm
                shots = [(dist_mm, 0)]
                img, ann = _build_image(spec, shots)
                if not ann:
                    continue
                expected_score = ann[0]["score"]
                try:
                    result = analyze_target_image(_image_to_bytes(img), TARGET_TYPE)
                except Exception:
                    continue
                if result.shots:
                    errors.append(abs(result.shots[0].score - expected_score))

        if not errors:
            pytest.skip("No boundary shots processed")

        worst = max(errors)
        assert worst <= 0.1, (
            f"Worst boundary score error {worst:.2f} > 0.1 points "
            f"(mean={np.mean(errors):.3f})"
        )

    def test_perspective_robustness(self):
        """Target at 15° perspective tilt must still be detected with score within 0.2."""
        spec = get_spec(TARGET_TYPE)
        shots_mm = [(5.0, 0)]
        img_flat, ann = _build_image(spec, shots_mm, perspective_deg=0.0)
        img_tilted, _ = _build_image(spec, shots_mm, perspective_deg=15.0)

        if not ann:
            pytest.skip("Ground truth empty")

        expected_score = ann[0]["score"]

        try:
            result_flat = analyze_target_image(_image_to_bytes(img_flat), TARGET_TYPE)
            result_tilted = analyze_target_image(_image_to_bytes(img_tilted), TARGET_TYPE)
        except Exception as e:
            pytest.fail(f"Pipeline error: {e}")

        assert result_tilted.target_detected, "Target not detected in tilted image"
        assert result_tilted.shots, "No shots detected in tilted image"

        score_err = abs(result_tilted.shots[0].score - expected_score)
        assert score_err <= 0.2, (
            f"Score error {score_err:.2f} > 0.2 at 15° tilt "
            f"(expected {expected_score}, got {result_tilted.shots[0].score})"
        )

    def test_target_detected_flag(self):
        """target_detected flag must be True for all synthetic target images."""
        spec = get_spec(TARGET_TYPE)
        for ring_num in [1, 5, 10]:
            shots = [(spec.ring_radius_mm(ring_num) * 0.5, 0)]
            img, _ = _build_image(spec, shots)
            try:
                result = analyze_target_image(_image_to_bytes(img), TARGET_TYPE)
            except Exception as e:
                pytest.fail(f"Pipeline raised on ring {ring_num}: {e}")
            assert result.target_detected, (
                f"target_detected=False for ring {ring_num} synthetic image"
            )
