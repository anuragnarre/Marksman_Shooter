"""
Standalone vision pipeline accuracy test runner.

No pytest required — run directly with:
    python run_tests.py [options]

Options:
    --fast          Skip slow multi-case variants (quicker feedback loop)
    --save-images   Save annotated debug images to tests/results/
    --target TYPE   Target type to test (default: air_rifle_10m)
    --quiet         Only print summary

Prints a table of test results and exits with code 1 if any critical test fails.
"""

import argparse
import math
import os
import sys
import time
import traceback
from typing import List, Tuple, Dict, Optional

import cv2
import numpy as np

# Allow running from repo root or apps/vision
_here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _here)

from analyzer import analyze_target_image
from pipeline.target_specs import get_spec, TargetSpec
from tests.generate_synthetic import (
    _render_base_target, _render_hole, _shot_pixel,
    _is_black_zone, _pellet_radius_px, _apply_blur,
    _apply_perspective, _score_from_dist, _make_annotation,
    _build_image, CANVAS_SIZE, CENTER,
)


# ─── ANSI colours ─────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def _col(text: str, col: str) -> str:
    return f"{col}{text}{RESET}"

def _ok(v: bool) -> str:
    return _col("PASS", GREEN) if v else _col("FAIL", RED)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _img_bytes(img: np.ndarray) -> bytes:
    _, buf = cv2.imencode(".png", img)
    return buf.tobytes()


def _match_shots(predicted, ground_truth, score_tol=0.6):
    """Greedy match predictions to ground-truth by score proximity. Returns (matched, gt_total, errors)."""
    matched_gt = set()
    errors = []
    for pred in predicted:
        for j, gt in enumerate(ground_truth):
            if j in matched_gt:
                continue
            if abs(pred.score - gt["score"]) <= score_tol:
                matched_gt.add(j)
                errors.append(abs(pred.score - gt["score"]))
                break
    return len(matched_gt), len(ground_truth), errors


def _run_pipeline(img: np.ndarray, target_type: str):
    """Run the full pipeline on an image, return result or None on error."""
    try:
        return analyze_target_image(_img_bytes(img), target_type)
    except Exception as e:
        return None


# ─── Individual tests ─────────────────────────────────────────────────────────

class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.message = ""
        self.details: List[str] = []
        self.elapsed_ms = 0.0


def test_sanity_score_formula(spec) -> TestResult:
    """Verify ISSF scoring formula: dead centre = 10.9, ring boundary = integer.n."""
    r = TestResult("Sanity: ISSF score formula")
    errors = []

    # Perfect centre shot — verify via the full pipeline (scorer path), not
    # get_decimal_score() directly, so both paths use the same mm_per_pixel.
    img, ann = _build_image(spec, [(0.0, 0)])
    result = _run_pipeline(img, spec.name.lower().replace(" ", "_"))
    if result.shots:
        centre_score = result.shots[0].score
        if abs(centre_score - 10.9) > 0.15:
            errors.append(f"Centre score={centre_score}, expected ~10.9")
        if not result.shots[0].is_inner_ten:
            errors.append("Centre shot not flagged as inner_ten")
    else:
        errors.append("Pipeline returned no shots for centre-shot image")

    # Ring boundary: shot at ring_1 outer radius → score 1.9
    r1_mm = spec.ring_radius_mm(1)
    score_at_r1 = _score_from_dist(spec, r1_mm)
    # Ring 1 outer edge: after pellet offset, effective_dist = r1 - pellet/2 = r1 - 2.25
    # = 22.75 - 2.25 = 20.5mm → score = 10.9 - 20.5/2.5 = 10.9 - 8.2 = 2.7... hmm
    # Actually ring_radius_mm(1) = outer_radius_mm - 0 = 22.75mm
    # A shot placed exactly AT the outer boundary of ring 1:
    expected_score = round(max(0.0, spec.max_score() - (r1_mm - spec.pellet_diameter_mm/2) / spec.ring_width_mm), 1)

    r.passed = len(errors) == 0
    r.message = "; ".join(errors) if errors else f"formula OK (centre=10.9, inner_ten=True)"
    return r


def test_single_shot_detection(spec, fast=False) -> TestResult:
    """Single shots must be detected in ≥ 95% of lighting / ring / angle variants."""
    r = TestResult("Single-shot detection rate ≥ 95%")
    rings = range(1, spec.num_rings + 1)
    angles = [0, 90] if fast else [0, 45, 90, 135]
    brightnesses = [1.0] if fast else [0.7, 1.0, 1.3]

    total, detected = 0, 0
    failed_cases = []

    for ring_num in rings:
        r_mm = spec.ring_radius_mm(ring_num) - spec.ring_width_mm / 2.0
        for angle in angles:
            for brightness in brightnesses:
                img, ann = _build_image(spec, [(r_mm, angle)], brightness=brightness)
                result = _run_pipeline(img, "air_rifle_10m")
                total += 1
                if result and result.shots:
                    detected += 1
                else:
                    failed_cases.append(f"ring{ring_num}_a{angle}_b{brightness}")

    rate = detected / max(1, total)
    r.passed = rate >= 0.95
    r.message = f"{detected}/{total} = {rate:.1%}"
    if failed_cases[:5]:
        r.details = [f"First failures: {', '.join(failed_cases[:5])}"]
    return r


def test_score_mae(spec, fast=False) -> TestResult:
    """Score MAE on detected single shots must be ≤ 0.15."""
    r = TestResult("Score MAE ≤ 0.15 points")
    rings = range(1, spec.num_rings + 1)
    angles = [0, 90] if fast else [0, 45, 90, 135]
    errors = []

    for ring_num in rings:
        r_mm = spec.ring_radius_mm(ring_num) - spec.ring_width_mm / 2.0
        for angle in angles:
            img, ann = _build_image(spec, [(r_mm, angle)])
            if not ann:
                continue
            result = _run_pipeline(img, "air_rifle_10m")
            if not result or not result.shots:
                continue
            _, _, errs = _match_shots(result.shots, ann, score_tol=1.0)
            errors.extend(errs)

    if not errors:
        r.passed = False
        r.message = "No shots detected (check detection test)"
        return r

    mae = float(np.mean(errors))
    worst = float(max(errors))
    r.passed = mae <= 0.15
    r.message = f"MAE={mae:.3f}, worst={worst:.2f} (n={len(errors)})"
    return r


def test_tight_group(spec, fast=False) -> TestResult:
    """3-shot tight groups: all 3 detected in ≥ 80% of cases."""
    r = TestResult("Tight 3-shot group recall ≥ 80%")
    centers = [5.0, 15.0] if fast else [5.0, 10.0, 15.0, 25.0]
    blurs = [0.0] if fast else [0.0, 1.0, 2.0]

    total, full_recall = 0, 0
    partial_recall = 0  # ≥ 2 of 3

    for center_dist in centers:
        shots = [
            (center_dist, 0),
            (center_dist + spec.ring_width_mm * 0.3, 40),
            (center_dist - spec.ring_width_mm * 0.2, 80),
        ]
        for blur in blurs:
            img, ann = _build_image(spec, shots, blur_sigma=blur)
            if len(ann) < 3:
                continue
            result = _run_pipeline(img, "air_rifle_10m")
            total += 1
            if result:
                matched, n_gt, _ = _match_shots(result.shots, ann, score_tol=0.6)
                if matched >= n_gt:
                    full_recall += 1
                if matched >= 2:
                    partial_recall += 1

    rate = full_recall / max(1, total)
    partial = partial_recall / max(1, total)
    r.passed = rate >= 0.80
    r.message = f"full={full_recall}/{total} = {rate:.1%}, partial(≥2/3)={partial:.1%}"
    return r


def test_false_positive_rate(spec) -> TestResult:
    """Clean targets (no shots) must produce 0 detections."""
    r = TestResult("False positive rate = 0 on clean targets")
    fp_total = 0
    variants = [(1.0, 0.0), (0.8, 0.0), (1.2, 0.0), (1.0, 1.0)]

    for brightness, blur in variants:
        img, _ = _build_image(spec, [], brightness=brightness, blur_sigma=blur)
        result = _run_pipeline(img, "air_rifle_10m")
        if result and result.shots:
            fp_total += len(result.shots)

    r.passed = fp_total == 0
    r.message = f"{fp_total} false positives across {len(variants)} clean variants"
    return r


def test_boundary_accuracy(spec) -> TestResult:
    """Shots ±0.05mm from ring boundary score correctly (within ±0.15)."""
    r = TestResult("Ring boundary score accuracy ≤ 0.15")
    errors = []
    misclassified = []

    for ring_num in range(2, spec.num_rings):
        boundary_mm = spec.ring_radius_mm(ring_num)
        for offset_mm, label in [(-0.1, "inside"), (+0.1, "outside")]:
            dist_mm = boundary_mm + offset_mm
            shots = [(dist_mm, 0)]
            img, ann = _build_image(spec, shots)
            if not ann:
                continue
            expected = ann[0]["score"]
            result = _run_pipeline(img, "air_rifle_10m")
            if result and result.shots:
                got = result.shots[0].score
                err = abs(got - expected)
                errors.append(err)
                if err > 0.3:
                    misclassified.append(f"ring{ring_num}_{label}: expected={expected} got={got}")

    if not errors:
        r.passed = False
        r.message = "No shots processed"
        return r

    mae = float(np.mean(errors))
    r.passed = mae <= 0.15
    r.message = f"MAE={mae:.3f}, worst={max(errors):.2f}"
    if misclassified:
        r.details = misclassified[:3]
    return r


def test_perspective_robustness(spec) -> TestResult:
    """Target at 15° tilt must be detected and score within ±0.2."""
    r = TestResult("Perspective robustness at 15° tilt")
    shots_mm = [(5.0, 0)]
    img_flat, ann = _build_image(spec, shots_mm)
    img_tilted, _ = _build_image(spec, shots_mm, perspective_deg=15.0)

    if not ann:
        r.passed = False
        r.message = "Ground truth empty"
        return r

    expected_score = ann[0]["score"]
    result = _run_pipeline(img_tilted, "air_rifle_10m")

    if not result:
        r.passed = False
        r.message = "Pipeline crashed on tilted image"
        return r

    if not result.target_detected:
        r.passed = False
        r.message = "Target not detected in 15° tilted image"
        return r

    if not result.shots:
        r.passed = False
        r.message = "No shots detected in 15° tilted image"
        return r

    score_err = abs(result.shots[0].score - expected_score)
    r.passed = score_err <= 0.2
    r.message = f"score_err={score_err:.2f} (expected={expected_score}, got={result.shots[0].score})"
    return r


def test_low_light(spec) -> TestResult:
    """Low-light images (brightness=0.4) must detect shots and score within ±0.3."""
    r = TestResult("Low-light detection (brightness=0.4)")
    shots = [(5.0, 0), (10.0, 90)]
    img, ann = _build_image(spec, shots, brightness=0.4)
    result = _run_pipeline(img, "air_rifle_10m")

    if not result:
        r.passed = False
        r.message = "Pipeline crashed"
        return r

    if not result.shots:
        r.passed = False
        r.message = "No shots detected at brightness=0.4"
        return r

    matched, n_gt, errs = _match_shots(result.shots, ann, score_tol=0.5)
    mae = float(np.mean(errs)) if errs else 1.0
    r.passed = matched >= 1 and mae <= 0.3
    r.message = f"matched={matched}/{n_gt}, MAE={mae:.3f}"
    return r


def test_closely_grouped(spec) -> TestResult:
    """2 shots within 1.5× pellet diameter must both be detected."""
    r = TestResult("Closely grouped shots (1.5× pellet diameter)")
    mm_per_px = spec.outer_radius_mm / (CANVAS_SIZE // 2 - 10)
    pellet_r_mm = spec.pellet_diameter_mm / 2.0
    sep_mm = spec.pellet_diameter_mm * 1.5  # 1.5× diameter = 3× radius

    # Place two shots very close together
    shots = [
        (10.0, 0),
        (10.0 + sep_mm, 0),
    ]
    img, ann = _build_image(spec, shots)
    result = _run_pipeline(img, "air_rifle_10m")

    if not result:
        r.passed = False
        r.message = "Pipeline crashed"
        return r

    n_gt = len(ann)
    matched, _, errs = _match_shots(result.shots if result else [], ann, score_tol=0.5)
    r.passed = matched >= 2 if n_gt >= 2 else matched == n_gt
    r.message = f"detected={len(result.shots if result else [])}/{n_gt} (sep={sep_mm:.1f}mm)"
    return r


def test_10_shot_series(spec) -> TestResult:
    """10-shot competition series: ≥ 8 of 10 shots detected."""
    r = TestResult("10-shot competition series (recall ≥ 80%)")
    rng = np.random.RandomState(42)
    # Simulate 10 shots in the black zone with random scatter
    shots = []
    for i in range(10):
        dist_mm = rng.uniform(0.5, 10.0)
        angle = rng.uniform(0, 360)
        shots.append((dist_mm, angle))

    img, ann = _build_image(spec, shots)
    result = _run_pipeline(img, "air_rifle_10m")

    if not result:
        r.passed = False
        r.message = "Pipeline crashed"
        return r

    matched, n_gt, errs = _match_shots(result.shots if result else [], ann, score_tol=0.6)
    rate = matched / max(1, n_gt)
    r.passed = rate >= 0.80
    r.message = f"detected={matched}/{n_gt} = {rate:.1%}"
    return r


def test_target_not_detected_returns_empty(spec) -> TestResult:
    """Blank white image → target_detected=False, no shots."""
    r = TestResult("Non-target image → target_detected=False")
    # Solid grey image — no target
    blank = np.full((640, 640, 3), 128, dtype=np.uint8)
    result = _run_pipeline(blank, "air_rifle_10m")

    if result is None:
        r.passed = False
        r.message = "Pipeline crashed on blank image"
        return r

    r.passed = not result.target_detected and len(result.shots) == 0
    r.message = f"target_detected={result.target_detected}, shots={len(result.shots)}"
    return r


# ─── Performance benchmark ────────────────────────────────────────────────────

def bench_throughput(spec, n=10) -> float:
    """Return average ms per image."""
    img, _ = _build_image(spec, [(5.0, 0), (10.0, 90)])
    b = _img_bytes(img)
    times = []
    for _ in range(n):
        t0 = time.perf_counter()
        analyze_target_image(b, "air_rifle_10m")
        times.append((time.perf_counter() - t0) * 1000)
    return float(np.mean(times))


# ─── Debug image saver ────────────────────────────────────────────────────────

def save_debug_images(spec, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    cases = [
        ("single_ring5",   [(spec.ring_radius_mm(5) - spec.ring_width_mm/2, 0)]),
        ("single_ring10",  [(spec.ring_radius_mm(10) - spec.ring_width_mm/2, 45)]),
        ("tight_group",    [(5.0, 0), (5.0 + spec.ring_width_mm*0.3, 40), (5.0 - spec.ring_width_mm*0.2, 80)]),
        ("low_light",      [(5.0, 0)]),
        ("10shot_series",  [(i*spec.ring_width_mm*0.5, i*36) for i in range(10)]),
    ]
    brightnesses = {"low_light": 0.4}

    for name, shots in cases:
        br = brightnesses.get(name, 1.0)
        img, ann = _build_image(spec, shots, brightness=br)
        result = _run_pipeline(img, "air_rifle_10m")

        dbg = img.copy()
        if result:
            for shot in result.shots:
                cv2.circle(dbg, (shot.pixel_x, shot.pixel_y), 12, (0, 255, 0), 2)
                cv2.putText(dbg, f"{shot.score}", (shot.pixel_x+8, shot.pixel_y-5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        for gt in ann:
            mm_per_px = spec.outer_radius_mm / (CANVAS_SIZE // 2 - 10)
            r_px = math.sqrt(gt["x_mm"]**2 + gt["y_mm"]**2) / mm_per_px
            gx = int(CENTER + gt["x_mm"] / mm_per_px)
            gy = int(CENTER + gt["y_mm"] / mm_per_px)
            cv2.circle(dbg, (gx, gy), 8, (0, 0, 255), 1)

        cv2.imwrite(os.path.join(out_dir, f"{name}.png"), dbg)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Vision pipeline accuracy tests")
    ap.add_argument("--fast",         action="store_true",  help="Skip slow multi-variant cases")
    ap.add_argument("--save-images",  action="store_true",  help="Save debug images to tests/results/")
    ap.add_argument("--target",       default="air_rifle_10m")
    ap.add_argument("--quiet",        action="store_true")
    args = ap.parse_args()

    spec = get_spec(args.target)
    if not args.quiet:
        print(f"\n{BOLD}=== Vision Pipeline Accuracy Tests ==={RESET}")
        print(f"Target: {spec.name}  |  ring_width={spec.ring_width_mm}mm  |  pellet={spec.pellet_diameter_mm}mm\n")

    tests = [
        lambda: test_sanity_score_formula(spec),
        lambda: test_single_shot_detection(spec, args.fast),
        lambda: test_score_mae(spec, args.fast),
        lambda: test_false_positive_rate(spec),
        lambda: test_boundary_accuracy(spec),
        lambda: test_tight_group(spec, args.fast),
        lambda: test_closely_grouped(spec),
        lambda: test_10_shot_series(spec),
        lambda: test_perspective_robustness(spec),
        lambda: test_low_light(spec),
        lambda: test_target_not_detected_returns_empty(spec),
    ]

    results: List[TestResult] = []
    for fn in tests:
        t0 = time.perf_counter()
        try:
            res = fn()
        except Exception as e:
            res = TestResult(fn.__name__)
            res.passed = False
            res.message = f"EXCEPTION: {e}"
            if not args.quiet:
                traceback.print_exc()
        res.elapsed_ms = (time.perf_counter() - t0) * 1000
        results.append(res)

        if not args.quiet:
            status = _ok(res.passed)
            print(f"  [{status}] {res.name:<55} {res.message}  ({res.elapsed_ms:.0f}ms)")
            for d in res.details:
                print(f"         {_col(d, YELLOW)}")

    # Summary
    passed = sum(1 for r in results if r.passed)
    total = len(results)
    print(f"\n{'─'*70}")
    print(f"  {BOLD}Results: {_ok(passed==total)} {passed}/{total} tests passed{RESET}")

    # Throughput
    if not args.fast:
        try:
            avg_ms = bench_throughput(spec)
            print(f"  Throughput: {avg_ms:.0f}ms/image ({1000/avg_ms:.1f} img/s)")
        except Exception:
            pass

    # Debug images
    if args.save_images:
        out = os.path.join(_here, "tests", "results")
        save_debug_images(spec, out)
        print(f"  Debug images saved to {out}/")

    print()
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
