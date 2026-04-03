"""
Shot detection pipeline orchestrator.

Multi-stage local CV pipeline (v5 — CLAHE + YOLO augmentation):
  1. Quality check (blur, glare, resolution)
  2. Target detection (Hough + gradient + contour cascade)
  3. Perspective correction (4-corner card warp or ellipse → circle fallback)
  3.5 CLAHE enhancement (improve black-hole visibility on dark rings)
  4a. CV hole detection (disc-convolution zone-aware, always runs)
  4b. YOLO hole detection (YOLO26-S via ONNX Runtime, if model loaded)
  4c. NMS fusion (merge CV + YOLO candidates)
  5. ISSF decimal scoring
"""

import base64
import io as _io
import logging
import time
from typing import Optional

import cv2
import numpy as np

# Fail loudly at import time if Pillow is missing — a silent failure at
# EXIF-correction time causes all phone photos to arrive rotated, breaking
# target detection.  Install with: pip install Pillow>=10.0.0
from PIL import Image as _PILImage, ExifTags as _ExifTags

logger = logging.getLogger(__name__)

from models import AnalysisResponse, ShotResult
from pipeline.types import TargetCalibration
from pipeline.quality_check import check_quality
from pipeline.target_detector import detect_target
from pipeline.perspective import correct_perspective
from pipeline.clahe import apply_clahe, apply_clahe_to_bullseye, bullseye_radius_from_calibration
from pipeline.calibration_engine import get_mm_per_pixel, get_black_area_radius_mm
from pipeline.hole_detector import detect_holes
from pipeline.differencer import compute_difference_image
from pipeline.yolo_detector import detect_holes_yolo, _yolo_available
from pipeline.mask_detector import detect_holes_mask, _mask_available
from pipeline.nms import fuse_candidates
from pipeline.scorer import score_holes
from pipeline.target_specs import get_spec


def _scale_calibration(cal: TargetCalibration, scale: float) -> TargetCalibration:
    """Scale spatial calibration fields when the working image is resized.

    Pixel coordinates (center, radii) scale linearly with the image.
    mm_per_pixel is INVERSELY proportional to scale: after downscaling, each
    pixel covers more physical space, so mm_per_pixel increases.
    """
    return TargetCalibration(
        center=(cal.center[0] * scale, cal.center[1] * scale),
        major_radius=cal.major_radius * scale,
        minor_radius=cal.minor_radius * scale,
        rotation_deg=cal.rotation_deg,
        eccentricity=cal.eccentricity,
        ring_radii=[r * scale for r in (cal.ring_radii or [])],
        confidence=cal.confidence,
        mm_per_pixel=cal.mm_per_pixel / scale,
        card_corners_found=cal.card_corners_found,
    )


# Module-level constants (exported so main.py can confirm this version is loaded)
MAX_INPUT_DIM = 1400   # cap input resolution before detect_target
MAX_WORK_DIM  = 1000   # cap working resolution before detect_holes


def analyze_target_image(
    image_bytes: bytes,
    target_type: str = "air_rifle_10m",
    debug: bool = False,
) -> AnalysisResponse:
    """Full analysis pipeline."""
    start = time.perf_counter()
    logger.debug("analyze_target_image: target_type=%s image_bytes=%d", target_type, len(image_bytes))

    # Decode image
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image. Ensure it is a valid JPEG/PNG/BMP.")

    # EXIF orientation fix — must run before any shape reads.
    # WhatsApp/phone photos commonly arrive at orientation 6 (90° CW),
    # causing the target to appear sideways and detection to fail entirely.
    # Primary path: Pillow (fast, handles all EXIF types).
    # Fallback: piexif (lighter, works when Pillow PIL EXIF API changes).
    _exif_orientation = 1  # default: no rotation
    try:
        _pil = _PILImage.open(_io.BytesIO(image_bytes))
        _exif = _pil._getexif()
        if _exif:
            _ori_key = next(
                (k for k, v in _ExifTags.TAGS.items() if v == 'Orientation'), None
            )
            if _ori_key and _ori_key in _exif:
                _exif_orientation = _exif[_ori_key]
    except Exception:
        # Pillow path failed (malformed EXIF, non-JPEG, etc.) — try piexif fallback
        try:
            import piexif
            _exif_dict = piexif.load(image_bytes)
            _exif_orientation = _exif_dict.get("0th", {}).get(piexif.ImageIFD.Orientation, 1)
        except Exception:
            pass  # Both parsers failed — keep orientation=1 (no rotation)

    if _exif_orientation == 3:
        img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_180)
    elif _exif_orientation == 6:
        img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE)
    elif _exif_orientation == 8:
        img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif _exif_orientation == 2:
        img_bgr = cv2.flip(img_bgr, 1)
    elif _exif_orientation == 4:
        img_bgr = cv2.flip(img_bgr, 0)
    elif _exif_orientation == 5:
        img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE)
        img_bgr = cv2.flip(img_bgr, 1)
    elif _exif_orientation == 7:
        img_bgr = cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
        img_bgr = cv2.flip(img_bgr, 1)

    img_h, img_w = img_bgr.shape[:2]

    # Pre-input resize: cap cost of target detection + perspective correction
    # on high-resolution originals (phone photos at 4032×3024+ take 6-28s without this).
    pre_input_scale = 1.0
    if max(img_h, img_w) > MAX_INPUT_DIM:
        pre_input_scale = MAX_INPUT_DIM / max(img_h, img_w)
        img_bgr = cv2.resize(img_bgr, None, fx=pre_input_scale, fy=pre_input_scale,
                             interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Stage 1: Quality check
    quality = check_quality(gray)
    logger.debug("Stage 1 quality: blur=%.1f glare=%.1f%% dr=%d is_acceptable=%s warnings=%s",
                 quality.blur_score, quality.glare_pct, quality.dynamic_range,
                 quality.is_acceptable, quality.warnings)

    # Pre-detection CLAHE: enhance ring lines before target detection so Hough
    # and gradient methods work reliably under low-contrast / dark conditions.
    # clipLimit is adaptive: darker / lower-DR images get stronger enhancement.
    dr = int(gray.max()) - int(gray.min())
    pre_clip = 2.0 if dr >= 80 else (3.5 if dr >= 50 else 5.0)
    gray_for_detect = apply_clahe(gray, clip_limit=pre_clip)

    # Stage 2: Target detection
    # detect_target internally resizes to ~600px for its circle cascade,
    # so passing the pre-resized gray is sufficient — no further resize here.
    calibration = detect_target(gray_for_detect, target_type)
    logger.debug("Stage 2 target: confidence=%.3f card_corners=%s eccentricity=%.3f",
                 calibration.confidence, calibration.card_corners_found, calibration.eccentricity)

    # Early exit when target detection failed entirely (confidence == 0).
    # Scoring against the image-centre fallback produces wrong results for every
    # shot, so it is better to return cleanly with target_detected=False.
    if calibration.confidence == 0.0:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return AnalysisResponse(
            shots=[],
            target_detected=False,
            image_width=img_w,
            image_height=img_h,
            processing_time_ms=round(elapsed_ms, 2),
            warp_center_x=500.0,
            warp_center_y=500.0,
            warp_width=1000,
            warp_height=1000,
            warp_mm_per_pixel=0.17,
        )

    # Stage 3: Perspective correction
    # 4-corner warp is attempted first (sets calibration.card_corners_found=True
    # on success); ellipse warp is used as fallback for non-square angles.
    # The eccentricity gate is bypassed when card corners were found.
    # Gate raised from 0.05 to 0.08: eccentricity < 0.08 is <0.3% oval —
    # negligible distortion that doesn't warrant correction.
    if calibration.card_corners_found or (0.08 < calibration.eccentricity < 0.45):
        img_bgr, gray, calibration = correct_perspective(img_bgr, gray, calibration)

    # Stage 3.1: Resize to cap hole-detection cost on high-resolution originals.
    # Card-warped images are already 1000×1000 (fast). For non-warped images
    # (phone photos at 4032×3024 etc.) the disc filter is O(W×H×k²) and can
    # take 50+ seconds. Downscale to MAX_WORK_DIM and adjust calibration.
    # MAX_WORK_DIM < MAX_INPUT_DIM (1400) so this always fires for non-warped
    # images that were resized to 1400px at the input stage.
    work_scale = 1.0
    if not calibration.card_corners_found:
        h_w, w_w = img_bgr.shape[:2]
        if max(h_w, w_w) > MAX_WORK_DIM:
            work_scale = MAX_WORK_DIM / max(h_w, w_w)
            img_bgr = cv2.resize(img_bgr, None, fx=work_scale, fy=work_scale,
                                 interpolation=cv2.INTER_AREA)
            gray = cv2.resize(gray, None, fx=work_scale, fy=work_scale,
                              interpolation=cv2.INTER_AREA)
            calibration = _scale_calibration(calibration, work_scale)

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

    # Stage 3.5c: Difference image (synthetic template subtraction)
    diff_img = compute_difference_image(
        gray, calibration,
        target_type=target_type,
        blur_score=quality.blur_score,
    )

    # Stage 4a: CV hole detection (always runs)
    spec = get_spec(target_type)
    cv_holes = detect_holes(gray, calibration, spec.pellet_diameter_mm,
                            dark_center_rings=spec.dark_center_rings,
                            target_type=target_type,
                            diff_img=diff_img)

    # Stage 4b: YOLO26-S hole detection (runs only when model is loaded)
    yolo_holes = detect_holes_yolo(gray, calibration, target_type) if _yolo_available else []

    # Stage 4c: Mask R-CNN pixel-precise detection / refinement
    # Runs on same working image — provides sub-pixel centroid from mask moments.
    mask_holes = detect_holes_mask(gray, calibration, target_type) if _mask_available else []

    # Stage 4d: Fuse CV + YOLO + Mask R-CNN with NMS
    # Treat mask detections as a third "yolo-equivalent" source so existing
    # fuse_candidates logic applies: mask holes with high confidence win ties.
    all_neural = yolo_holes + [
        h.__class__(x=h.x, y=h.y, radius=h.radius,
                    confidence=min(1.0, h.confidence + 0.05),  # small boost for mask precision
                    methods_agreed=h.methods_agreed, method="mask")
        for h in mask_holes
    ]
    holes = fuse_candidates(cv_holes, all_neural)
    logger.info("Stage 4 holes: cv=%d yolo=%d mask=%d fused=%d  cal=card:%s mm_per_px=%.4f major_r=%.1f",
                len(cv_holes), len(yolo_holes), len(mask_holes), len(holes),
                calibration.card_corners_found, calibration.mm_per_pixel, calibration.major_radius)

    # Stage 5: ISSF decimal scoring
    shots_data = score_holes(holes, calibration, target_type)
    logger.info("Stage 5 scorer: %d holes -> %d shots  (filtered=%d)",
                len(holes), len(shots_data), len(holes) - len(shots_data))

    # Build response
    shot_results = [
        ShotResult(
            shot_number=s["shot_number"],
            score=s["score"],
            x=s["x"],
            y=s["y"],
            # pixel_x/y stay in warped 0–1000 canvas space — that is what
            # ShotOverlayCanvas and calculateDecimalScore() both expect.
            pixel_x=s["pixel_x"],
            pixel_y=s["pixel_y"],
            confidence=s["confidence"],
            is_inner_ten=s.get("is_inner_ten", False),
            dist_mm=s.get("dist_mm", 0.0),
        )
        for s in shots_data
    ]

    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info("analyze done: shots=%d target_detected=%s elapsed_ms=%.1f",
                len(shot_results), calibration.confidence > 0.2, elapsed_ms)

    response = AnalysisResponse(
        shots=shot_results,
        target_detected=calibration.confidence > 0.2,
        image_width=img_w,
        image_height=img_h,
        processing_time_ms=round(elapsed_ms, 2),
        warp_center_x=float(calibration.center[0]),
        warp_center_y=float(calibration.center[1]),
        warp_width=int(img_bgr.shape[1]),
        warp_height=int(img_bgr.shape[0]),
        warp_mm_per_pixel=float(calibration.mm_per_pixel),
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
