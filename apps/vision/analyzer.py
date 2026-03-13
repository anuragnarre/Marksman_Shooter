# apps/vision/analyzer.py
"""
Bullet-hole detection pipeline combining Roboflow ML inference with OpenCV.

Detection strategy:
  1. Roboflow hosted model (primary)  — ML-based, high accuracy on real targets
  2. OpenCV adaptive threshold        — fallback if Roboflow key is absent or call fails

Target geometry pipeline (shared):
  1. Decode image bytes to BGR array
  2. Hough Circle Transform → target centre (cx, cy) and radius (r)
  3. Map each detected hole centre to target coordinate space (−10 to +10)
  4. Score each shot by distance from centre using ISSF ring thresholds
"""

import base64
import math
import os
import time
from typing import List, Optional, Tuple

import cv2
import numpy as np
import requests

from models import AnalysisResponse, ShotResult

# ── Roboflow model config ──────────────────────────────────────────────────────

ROBOFLOW_MODEL_ID = "bullet-hole-object-detection/12"
ROBOFLOW_API_URL  = "https://detect.roboflow.com"

# ── ISSF scoring constants ─────────────────────────────────────────────────────
# Ring boundaries as fractions of the detected target radius (0 = centre, 1 = edge)
RING_RADII_FRACTIONS: List[float] = [
    0.05,   # ring 10 inner (bullseye)
    0.10,   # ring 10 outer
    0.18,   # ring 9
    0.27,   # ring 8
    0.37,   # ring 7
    0.48,   # ring 6
    0.60,   # ring 5
    0.73,   # ring 4
    0.86,   # ring 3
    1.00,   # ring 2/1 boundary
]
RING_SCORES: List[float] = [10.9, 10.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0]


# ── Public entry point ────────────────────────────────────────────────────────

def analyze_target_image(
    image_bytes: bytes,
    roboflow_api_key: Optional[str] = None,
) -> AnalysisResponse:
    """
    Full analysis pipeline.

    Parameters
    ----------
    image_bytes     : Raw image bytes (JPEG / PNG / BMP / TIFF).
    roboflow_api_key: Roboflow publishable API key. When present the Roboflow
                      hosted model is used for bullet-hole detection. Falls back
                      to the OpenCV contour detector when absent or on error.

    Returns
    -------
    AnalysisResponse with detected shots, target geometry, and timing.
    """
    start = time.perf_counter()

    # ── Decode image ──────────────────────────────────────────────────────────
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Could not decode image. Ensure it is a valid JPEG/PNG/BMP.")

    img_h, img_w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # ── Step 1: Detect outer target ring via Hough Circles ────────────────────
    blurred = cv2.GaussianBlur(gray, (5, 5), sigmaX=1.5)

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.5,
        minDist=img_w // 2,
        param1=100,
        param2=50,
        minRadius=img_w // 6,
        maxRadius=min(img_w, img_h) // 2,
    )

    target_detected = circles is not None

    if target_detected:
        c = np.round(circles[0, 0]).astype(int)
        cx, cy, r = int(c[0]), int(c[1]), int(c[2])
    else:
        # Fallback: assume target fills ~90 % of the frame
        cx, cy = img_w // 2, img_h // 2
        r = min(img_w, img_h) // 2

    # ── Step 2: Detect bullet holes ───────────────────────────────────────────
    hole_positions: List[Tuple[int, int, float]] = []   # (px, py, confidence)

    roboflow_ok = False
    if roboflow_api_key:
        try:
            hole_positions = _detect_holes_roboflow(
                image_bytes, img_w, img_h, roboflow_api_key
            )
            roboflow_ok = True
        except Exception:
            # Any network / API error → fall through to OpenCV
            roboflow_ok = False

    if not roboflow_ok:
        hole_positions = _detect_holes_opencv(gray, cx, cy, r, img_w, img_h)

    # Sort by distance from target centre so shots closer to centre get lower numbers
    hole_positions.sort(
        key=lambda p: math.sqrt((p[0] - cx) ** 2 + (p[1] - cy) ** 2)
    )

    # ── Step 3: Map pixel positions to target coordinate space and score ───────
    shot_results: List[ShotResult] = []

    for idx, (hx, hy, confidence) in enumerate(hole_positions):
        pixel_dist = math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2)
        norm_dist  = pixel_dist / r if r > 0 else 1.0

        target_x = (hx - cx) * (10.0 / r) if r > 0 else 0.0
        target_y = -(hy - cy) * (10.0 / r) if r > 0 else 0.0

        score = _score_from_distance(norm_dist)

        shot_results.append(
            ShotResult(
                shot_number=idx + 1,
                score=round(score, 1),
                x=round(target_x, 3),
                y=round(target_y, 3),
                pixel_x=hx,
                pixel_y=hy,
                confidence=round(confidence, 3),
            )
        )

    elapsed_ms = (time.perf_counter() - start) * 1000

    return AnalysisResponse(
        shots=shot_results,
        target_detected=target_detected,
        image_width=img_w,
        image_height=img_h,
        processing_time_ms=round(elapsed_ms, 2),
    )


# ── Roboflow detector ─────────────────────────────────────────────────────────

def _detect_holes_roboflow(
    image_bytes: bytes,
    img_w: int,
    img_h: int,
    api_key: str,
) -> List[Tuple[int, int, float]]:
    """
    Call the Roboflow hosted inference API and return bullet-hole centres.

    The API accepts a base64-encoded image in the request body and returns
    bounding-box predictions in the original image pixel coordinate space.

    Parameters
    ----------
    image_bytes : Raw image bytes.
    img_w, img_h: Original image dimensions (used to validate returned coords).
    api_key     : Roboflow publishable key.

    Returns
    -------
    List of (pixel_x, pixel_y, confidence) tuples for each detected hole.
    """
    url = f"{ROBOFLOW_API_URL}/{ROBOFLOW_MODEL_ID}?api_key={api_key}"

    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = requests.post(
        url,
        data=b64_image,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    response.raise_for_status()

    data = response.json()
    predictions = data.get("predictions", [])

    # Roboflow image dimensions (may differ from original if resized for inference)
    rf_img = data.get("image", {})
    rf_w = rf_img.get("width", img_w) or img_w
    rf_h = rf_img.get("height", img_h) or img_h

    # Scale factor in case Roboflow resized the image for inference
    scale_x = img_w / rf_w
    scale_y = img_h / rf_h

    holes: List[Tuple[int, int, float]] = []
    for pred in predictions:
        # Roboflow returns bounding-box centre as x, y
        px = int(round(pred["x"] * scale_x))
        py = int(round(pred["y"] * scale_y))
        confidence = float(pred.get("confidence", 1.0))

        # Clamp to image bounds
        px = max(0, min(img_w - 1, px))
        py = max(0, min(img_h - 1, py))

        holes.append((px, py, confidence))

    return holes


# ── OpenCV fallback detector ──────────────────────────────────────────────────

def _detect_holes_opencv(
    gray: np.ndarray,
    cx: int,
    cy: int,
    r: int,
    img_w: int,
    img_h: int,
) -> List[Tuple[int, int, float]]:
    """
    Fallback bullet-hole detector using adaptive thresholding and contour analysis.

    Crops the image to the detected target circle, applies adaptive threshold
    (handles non-uniform lighting), then filters contours by area and circularity.

    Returns
    -------
    List of (pixel_x, pixel_y, confidence) in original image coordinates.
    """
    # Crop to target bounding box
    x1 = max(cx - r, 0)
    y1 = max(cy - r, 0)
    x2 = min(cx + r, img_w)
    y2 = min(cy + r, img_h)

    cropped = gray[y1:y2, x1:x2]
    local_cx = cx - x1
    local_cy = cy - y1

    # Adaptive threshold: bullet holes are dark on a light background
    thresh = cv2.adaptiveThreshold(
        cropped,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        thresholdType=cv2.THRESH_BINARY_INV,
        blockSize=21,
        C=8,
    )

    # Morphological closing to fill small gaps inside holes
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    MIN_AREA = 20
    MAX_AREA = 500

    holes: List[Tuple[int, int, float]] = []

    for contour in contours:
        area = cv2.contourArea(contour)
        if not (MIN_AREA <= area <= MAX_AREA):
            continue

        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue

        circularity = 4 * math.pi * area / (perimeter * perimeter)
        if circularity < 0.4:
            continue

        M = cv2.moments(contour)
        if M["m00"] == 0:
            continue

        hx_local = int(M["m10"] / M["m00"])
        hy_local = int(M["m01"] / M["m00"])

        # Convert back to original image coordinates
        hx = hx_local + x1
        hy = hy_local + y1

        confidence = min(1.0, (circularity - 0.4) / 0.6)
        holes.append((hx, hy, confidence))

    return holes


# ── Scoring helper ────────────────────────────────────────────────────────────

def _score_from_distance(norm_dist: float) -> float:
    """Return the ISSF score for a normalised distance from target centre."""
    for threshold, score in zip(RING_RADII_FRACTIONS, RING_SCORES):
        if norm_dist <= threshold:
            return score
    return 1.0
