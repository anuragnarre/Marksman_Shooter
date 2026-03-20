"""
Shot detection pipeline orchestrator.

Multi-stage local CV pipeline (v2 — synthetic template + difference imaging):
  1. Quality check (blur, glare, resolution)
  2. Target detection (template matching + radial profile)
  3. Perspective correction (single outer-ring ellipse)
  4. Difference imaging (synthetic template subtraction)
  5. Hole detection (Otsu + CC on difference image)
  6. ISSF decimal scoring
"""

import base64
import time
from typing import Optional

import cv2
import numpy as np

from models import AnalysisResponse, ShotResult
from pipeline.quality_check import check_quality
from pipeline.target_detector import detect_target
from pipeline.perspective import correct_perspective
from pipeline.differencer import compute_difference_image
from pipeline.hole_detector import detect_holes
from pipeline.scorer import score_holes
from pipeline.target_specs import get_spec


def analyze_target_image(
    image_bytes: bytes,
    target_type: str = "air_rifle_10m",
    debug: bool = False,
) -> AnalysisResponse:
    """
    Full analysis pipeline.

    Parameters
    ----------
    image_bytes  : Raw image bytes (JPEG / PNG / BMP / TIFF).
    target_type  : ISSF target type key (default: air_rifle_10m).
    debug        : If True, include annotated debug image in response.

    Returns
    -------
    AnalysisResponse with detected shots, target geometry, and timing.
    """
    start = time.perf_counter()

    # Decode image
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image. Ensure it is a valid JPEG/PNG/BMP.")

    img_h, img_w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Stage 1: Quality check
    quality = check_quality(gray)

    # Stage 2: Target detection (template matching + radial profile)
    calibration = detect_target(gray, target_type)

    # Stage 3: Perspective correction (if target is elliptical)
    if calibration.eccentricity > 0.05:
        img_bgr, gray, calibration = correct_perspective(img_bgr, gray, calibration)

    # Stage 4: Difference imaging (synthetic template subtraction)
    spec = get_spec(target_type)
    diff_img = compute_difference_image(
        gray, calibration, target_type,
        blur_score=quality.blur_score,
    )

    # Stage 5: Hole detection on difference image
    holes = detect_holes(diff_img, calibration, spec.pellet_diameter_mm)

    # Stage 6: ISSF decimal scoring
    shots_data = score_holes(holes, calibration, target_type)

    # Build response
    shot_results = [
        ShotResult(
            shot_number=s["shot_number"],
            score=s["score"],
            x=s["x"],
            y=s["y"],
            pixel_x=s["pixel_x"],
            pixel_y=s["pixel_y"],
            confidence=s["confidence"],
        )
        for s in shots_data
    ]

    elapsed_ms = (time.perf_counter() - start) * 1000

    response = AnalysisResponse(
        shots=shot_results,
        target_detected=calibration.confidence > 0.2,
        image_width=img_w,
        image_height=img_h,
        processing_time_ms=round(elapsed_ms, 2),
    )

    # Debug mode: annotate and attach base64 image
    if debug:
        debug_img = _draw_debug(img_bgr, calibration, holes, shot_results, diff_img)
        _, buf = cv2.imencode(".png", debug_img)
        response.debug_image = base64.b64encode(buf.tobytes()).decode("utf-8")

    return response


def _draw_debug(img_bgr, calibration, holes, shots, diff_img=None):
    """Draw detected rings, holes, scores, and difference image on debug output."""
    h, w = img_bgr.shape[:2]

    # Create side-by-side: original annotated + difference image
    debug = img_bgr.copy()
    cx, cy = int(calibration.center[0]), int(calibration.center[1])

    # Draw target center
    cv2.drawMarker(debug, (cx, cy), (0, 255, 255), cv2.MARKER_CROSS, 20, 2)

    # Draw detected rings from calibration
    if calibration.ring_radii:
        for r in calibration.ring_radii:
            cv2.circle(debug, (cx, cy), int(r), (0, 200, 0), 1)
    else:
        cv2.circle(debug, (cx, cy), int(calibration.major_radius), (0, 200, 0), 2)

    # Draw detected holes
    for hole in holes:
        hx, hy = int(round(hole.x)), int(round(hole.y))
        hr = max(3, int(round(hole.radius)))
        cv2.circle(debug, (hx, hy), hr, (0, 0, 255), 2)

    # Draw scores
    for shot in shots:
        cv2.putText(
            debug,
            f"{shot.score}",
            (shot.pixel_x + 10, shot.pixel_y - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 0),
            1,
        )

    # If difference image available, create side-by-side composite
    if diff_img is not None:
        diff_bgr = cv2.cvtColor(diff_img, cv2.COLOR_GRAY2BGR)
        # Apply colormap for better visualization
        diff_color = cv2.applyColorMap(diff_img, cv2.COLORMAP_JET)

        # Resize diff to match if needed
        if diff_color.shape[:2] != (h, w):
            diff_color = cv2.resize(diff_color, (w, h))

        # Stack horizontally: annotated original | colorized difference
        debug = np.hstack([debug, diff_color])

    return debug
