"""
Test the vision pipeline on sample images and save annotated results.

Usage:
  cd apps/vision
  python test_pipeline.py

Reads images from ../../shoot/ and saves annotated results to ../../shoot/results/
"""

import os
import sys
import time
import glob

import cv2
import numpy as np

# Add current dir to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from pipeline.quality_check import check_quality
from pipeline.target_detector import detect_target
from pipeline.perspective import correct_perspective
from pipeline.hole_detector import detect_holes
from pipeline.scorer import score_holes
from pipeline.target_specs import get_spec


def process_image(image_path: str, target_type: str = "air_rifle_10m"):
    """Process a single image and return annotated result."""
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(f"  SKIP: Could not read {image_path}")
        return None, None, []

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    spec = get_spec(target_type)

    # Detect target
    cal = detect_target(gray, target_type)

    # Perspective correction
    if cal.eccentricity > 0.05:
        img_bgr, gray, cal = correct_perspective(img_bgr, gray, cal)

    # Detect holes
    holes = detect_holes(gray, cal, spec.pellet_diameter_mm)

    # Score
    shots = score_holes(holes, cal, target_type)

    # Draw annotations
    debug = img_bgr.copy()
    cx, cy = int(cal.center[0]), int(cal.center[1])

    # Draw target center
    cv2.drawMarker(debug, (cx, cy), (0, 255, 255), cv2.MARKER_CROSS, 15, 1)

    # Draw outer ring
    cv2.circle(debug, (cx, cy), int(cal.major_radius), (0, 200, 0), 1)

    # Draw each detected hole
    for hole in holes:
        hx, hy = int(round(hole.x)), int(round(hole.y))
        hr = max(5, int(round(hole.radius * 2)))
        cv2.circle(debug, (hx, hy), hr, (0, 0, 255), 2)

    # Draw scores next to each shot
    for s in shots:
        label = f"{s['score']}"
        cv2.putText(debug, label, (s['pixel_x'] + 8, s['pixel_y'] - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1)

    return debug, cal, shots


def main():
    shoot_dir = os.path.join(os.path.dirname(__file__), "..", "..", "shoot")
    shoot_dir = os.path.abspath(shoot_dir)

    if not os.path.isdir(shoot_dir):
        print(f"ERROR: Directory not found: {shoot_dir}")
        sys.exit(1)

    results_dir = os.path.join(shoot_dir, "results")
    os.makedirs(results_dir, exist_ok=True)

    images = sorted(glob.glob(os.path.join(shoot_dir, "*.jpeg")))
    if not images:
        images = sorted(glob.glob(os.path.join(shoot_dir, "*.jpg")))
    if not images:
        images = sorted(glob.glob(os.path.join(shoot_dir, "*.png")))

    print(f"Found {len(images)} images in {shoot_dir}")
    print(f"Results will be saved to {results_dir}")
    print()

    # Process first 50 images as a test (use all with images[:])
    test_images = images[:50]

    total_shots = 0
    total_time = 0.0

    for i, img_path in enumerate(test_images):
        fname = os.path.basename(img_path)
        print(f"[{i+1}/{len(test_images)}] {fname}")

        t0 = time.perf_counter()
        debug_img, cal, shots = process_image(img_path)
        elapsed = (time.perf_counter() - t0) * 1000

        if debug_img is None:
            continue

        total_time += elapsed
        total_shots += len(shots)

        # Save annotated result
        out_name = f"result_{i+1:03d}.jpg"
        out_path = os.path.join(results_dir, out_name)
        cv2.imwrite(out_path, debug_img)

        # Print results
        scores_str = ", ".join(f"{s['score']}" for s in shots)
        print(f"  Target detected: conf={cal.confidence:.2f}, "
              f"center=({cal.center[0]:.0f},{cal.center[1]:.0f}), "
              f"radius={cal.major_radius:.0f}")
        print(f"  Shots found: {len(shots)} | Scores: [{scores_str}]")
        print(f"  Time: {elapsed:.0f}ms")
        print()

    print("=" * 60)
    print(f"SUMMARY: {total_shots} total shots across {len(test_images)} images")
    print(f"Average time: {total_time / max(1, len(test_images)):.0f}ms per image")
    print(f"Results saved to: {results_dir}")


if __name__ == "__main__":
    main()
