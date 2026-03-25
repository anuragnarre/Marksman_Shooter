"""
Shot detection pipeline orchestrator.

Multi-stage local CV pipeline (v5 — CLAHE + YOLO augmentation):
  1. Quality check (blur, glare, resolution)
  2. Target detection (Hough + gradient + contour cascade)
  3. Perspective correction (4-corner card warp or ellipse → circle fallback)
  3.5 CLAHE enhancement (improve black-hole visibility on dark rings)
  4a. CV hole detection (disc-convolution zone-aware, always runs)
  4b. YOLO hole detection (YOLOv8-S via ONNX Runtime, if model loaded)
  4c. NMS fusion (merge CV + YOLO candidates)
  5. ISSF decimal scoring
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
from pipeline.clahe import apply_clahe, apply_clahe_to_bullseye, bullseye_radius_from_calibration
from pipeline.calibration_engine import get_mm_per_pixel, get_black_area_radius_mm
from pipeline.hole_detector import detect_holes
from pipeline.yolo_detector import detect_holes_yolo, _yolo_available
from pipeline.nms import fuse_candidates
from pipeline.scorer import score_holes
from pipeline.target_specs import get_spec


def analyze_target_image(
    image_bytes: bytes,
    target_type: str = "air_rifle_10m",
    debug: bool = False,
) -> AnalysisResponse:
    """Full analysis pipeline."""
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

    # Stage 2: Target detection
    calibration = detect_target(gray, target_type)

    # Stage 3: Perspective correction
    # 4-corner warp is attempted first (sets calibration.card_corners_found=True
    # on success); ellipse warp is used as fallback for non-square angles.
    # The eccentricity gate is bypassed when card corners were found.
    if calibration.card_corners_found or (0.05 < calibration.eccentricity < 0.45):
        img_bgr, gray, calibration = correct_perspective(img_bgr, gray, calibration)

    # Stage 3.5a: Full-image CLAHE (baseline contrast pass)
    gray = apply_clahe(gray)

    # Stage 3.5b: Bullseye-specific CLAHE
    # A stronger CLAHE is applied only inside the dark centre zone where black
    # shot holes must be separated from black ring lines.  Outside the bullseye
    # the image is unchanged so the cream zone is not over-amplified.
    mm_per_px = get_mm_per_pixel(target_type)
    black_r_mm = get_black_area_radius_mm(target_type)
    bullseye_r_px = bullseye_radius_from_calibration(mm_per_px, black_r_mm)
    if bullseye_r_px > 0:
        gray = apply_clahe_to_bullseye(gray, calibration.center, bullseye_r_px)

    # Stage 4a: CV hole detection (always runs)
    spec = get_spec(target_type)
    cv_holes = detect_holes(gray, calibration, spec.pellet_diameter_mm,
                            dark_center_rings=spec.dark_center_rings)

    # Stage 4b: YOLO hole detection (runs only when model is loaded)
    yolo_holes = detect_holes_yolo(gray, calibration, target_type) if _yolo_available else []

    # Stage 4c: Fuse CV + YOLO with NMS
    holes = fuse_candidates(cv_holes, yolo_holes)

    # Stage 5: ISSF decimal scoring
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
            is_inner_ten=s.get("is_inner_ten", False),
            dist_mm=s.get("dist_mm", 0.0),
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

    if debug:
        debug_img = _draw_debug(img_bgr, calibration, holes, shot_results)
        _, buf = cv2.imencode(".png", debug_img)
        response.debug_image = base64.b64encode(buf.tobytes()).decode("utf-8")

    return response


def _draw_debug(img_bgr, calibration, holes, shots):
    """Draw detected holes and scores on debug output."""
    debug = img_bgr.copy()
    cx, cy = int(calibration.center[0]), int(calibration.center[1])

    # Target center
    cv2.drawMarker(debug, (cx, cy), (0, 255, 255), cv2.MARKER_CROSS, 20, 2)

    # Rings
    if calibration.ring_radii:
        for r in calibration.ring_radii:
            cv2.circle(debug, (cx, cy), int(r), (0, 200, 0), 1)
    else:
        cv2.circle(debug, (cx, cy), int(calibration.major_radius), (0, 200, 0), 2)

    # Detected holes — colour by detection method
    method_colors = {
        "cv":    (0,   0,   255),   # red
        "yolo":  (255, 128, 0  ),   # orange
        "fused": (0,   255, 128),   # teal
    }
    for hole in holes:
        hx, hy = int(round(hole.x)), int(round(hole.y))
        hr = max(4, int(round(hole.radius * 1.5)))
        color = method_colors.get(getattr(hole, "method", "cv"), (0, 0, 255))
        cv2.circle(debug, (hx, hy), hr, color, 2)

    # Scores
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

    return debug
