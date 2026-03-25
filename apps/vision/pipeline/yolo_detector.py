"""YOLOv8-S bullet-hole detector via ONNX Runtime.

At startup, call load_yolo_model() once.  If the model file is absent, the
module sets _yolo_available = False and every call to detect_holes_yolo()
returns an empty list — the pipeline falls through to CV-only mode with no
error.

SAHI — 4 overlapping quadrants
-------------------------------
The warped 1000×1000 canvas is divided into 4 overlapping 550×550 tiles
(100 px overlap on each shared edge).  Each tile is resized to 640×640 for
the YOLO model.  Detections are mapped back to full-canvas coordinates before
cross-tile NMS removes duplicates.

This guarantees that a tiny .22-cal hole near a quadrant boundary is fully
visible in at least two tiles, preventing "resolution collapse" at tile edges.

Sub-pixel centroid refinement
------------------------------
After locating a bounding box, the pixel intensity inside the box is used to
compute a moment-based centroid (cv2.moments).  For bright holes on a dark
background the weighted centroid is more accurate than the raw bounding-box
centre, giving sub-pixel localisation without needing a separate regression
head.

Inference backend
-----------------
Uses onnxruntime (CPU) at inference time — no torch required in production.
Export the trained model once:
    from models_export.export_tflite import export_yolov8s_to_tflite
"""

import logging
import os
from typing import List, Optional, Tuple

import cv2
import numpy as np

from .types import FusedHole, TargetCalibration

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------

_ort_session = None        # onnxruntime.InferenceSession when loaded
_yolo_available: bool = False

YOLO_INPUT_SIZE   = 640    # model native resolution (px)

# 4-quadrant SAHI layout on a 1000×1000 canvas
# Each tile is TILE_SIZE×TILE_SIZE; the overlap ensures boundary holes appear
# in at least two tiles.
TILE_SIZE         = 550    # px (> 500 to create 100 px overlap at each edge)
TILE_OFFSETS: List[Tuple[int, int]] = [
    (0,   0  ),   # Top-Left
    (0,   450),   # Top-Right
    (450, 0  ),   # Bottom-Left
    (450, 450),   # Bottom-Right
]
SAHI_MERGE_IOU    = 0.45   # cross-tile NMS threshold


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_yolo_model(model_path: str = "models/shot_detector.onnx") -> bool:
    """
    Load the ONNX shot-detector model.

    Silent no-op (returns False) when the file does not exist.
    Safe to call multiple times.

    Returns:
        True if the model loaded successfully, False otherwise.
    """
    global _ort_session, _yolo_available

    if not os.path.exists(model_path):
        logger.info("YOLO model not found at %s — running CV-only mode.", model_path)
        _yolo_available = False
        return False

    try:
        import onnxruntime as ort

        opts = ort.SessionOptions()
        opts.log_severity_level = 3
        _ort_session = ort.InferenceSession(
            model_path,
            sess_options=opts,
            providers=["CPUExecutionProvider"],
        )
        _yolo_available = True
        logger.info("YOLO model loaded from %s", model_path)
        return True
    except Exception as exc:
        logger.warning("Failed to load YOLO model: %s", exc)
        _yolo_available = False
        return False


def detect_holes_yolo(
    warped_gray: np.ndarray,
    calibration: TargetCalibration,
    target_type: str,
    conf_threshold: float = 0.25,
) -> List[FusedHole]:
    """
    Run YOLOv8-S inference on a warped grayscale image.

    Uses 4-quadrant SAHI to ensure tiny holes near tile boundaries are caught.
    Each detection's centroid is refined using pixel-intensity moments for
    sub-pixel accuracy.

    Args:
        warped_gray:    Grayscale image after perspective correction.
                        Expected to be 1000×1000 from perspective.OUTPUT_SIZE.
        calibration:    Target calibration (unused directly here, reserved for
                        future scale-adaptive thresholds).
        target_type:    Target type string (e.g. "nr_50m").
        conf_threshold: Minimum confidence to retain a detection.

    Returns:
        List of FusedHole objects with method="yolo".
        Empty list if model is not loaded.
    """
    if not _yolo_available or _ort_session is None:
        return []

    h, w = warped_gray.shape[:2]

    # Convert to 3-channel RGB for YOLO
    rgb = cv2.cvtColor(warped_gray, cv2.COLOR_GRAY2RGB)

    # --- 4-quadrant SAHI ---
    raw_boxes = _sahi_four_quadrant(rgb, conf_threshold)

    # --- Per-box centroid refinement on the grayscale canvas ---
    holes: List[FusedHole] = []
    for cx_640space, cy_full, bw_full, bh_full, conf in raw_boxes:
        # cx/cy are already in full 1000×1000 canvas space after _sahi_four_quadrant
        cx_refined, cy_refined = _refine_centroid(
            warped_gray, cx_640space, cy_full, bw_full, bh_full,
        )
        radius = max(bw_full, bh_full) / 2.0
        holes.append(FusedHole(
            x=cx_refined,
            y=cy_refined,
            radius=radius,
            confidence=float(conf),
            methods_agreed=1,
            method="yolo",
        ))

    return holes


# ---------------------------------------------------------------------------
# 4-quadrant SAHI
# ---------------------------------------------------------------------------

def _sahi_four_quadrant(
    rgb_full: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """
    Run YOLO on each of the 4 overlapping 550×550 tiles of the 1000×1000 canvas.

    Tiles (row_start, col_start) with TILE_SIZE = 550:
        TL = (0,   0)    covers rows   0–549, cols   0–549
        TR = (0,   450)  covers rows   0–549, cols 450–999
        BL = (450, 0)    covers rows 450–999, cols   0–549
        BR = (450, 450)  covers rows 450–999, cols 450–999

    The 100 px overlap ensures a hole at the canvas centre (500, 500) is
    fully visible in all four tiles, not clipped to a 1-pixel edge.

    Returns:
        List of (cx, cy, bw, bh, conf) in full 1000×1000 canvas coordinates.
    """
    all_boxes: List[Tuple[float, float, float, float, float]] = []

    for row_off, col_off in TILE_OFFSETS:
        row_end = min(row_off + TILE_SIZE, rgb_full.shape[0])
        col_end = min(col_off + TILE_SIZE, rgb_full.shape[1])
        tile    = rgb_full[row_off:row_end, col_off:col_end]

        actual_h = tile.shape[0]
        actual_w = tile.shape[1]

        tile_boxes = _run_inference(tile, conf_threshold)

        # Map tile-space (640 model output) → full canvas space
        for cx_t, cy_t, bw_t, bh_t, conf in tile_boxes:
            # tile_space coords are in the range [0, YOLO_INPUT_SIZE]
            # First map back to tile pixel space, then to full canvas
            cx_full = (cx_t / YOLO_INPUT_SIZE) * actual_w + col_off
            cy_full = (cy_t / YOLO_INPUT_SIZE) * actual_h + row_off
            bw_full = (bw_t / YOLO_INPUT_SIZE) * actual_w
            bh_full = (bh_t / YOLO_INPUT_SIZE) * actual_h
            all_boxes.append((cx_full, cy_full, bw_full, bh_full, conf))

    return _nms_raw(all_boxes, SAHI_MERGE_IOU)


# ---------------------------------------------------------------------------
# Sub-pixel centroid refinement
# ---------------------------------------------------------------------------

def _refine_centroid(
    gray: np.ndarray,
    cx: float,
    cy: float,
    bw: float,
    bh: float,
) -> Tuple[float, float]:
    """
    Refine the bounding-box centre to a sub-pixel centroid using image moments.

    The YOLO bounding box gives an approximate centre.  By computing the
    intensity-weighted centroid (cv2.moments) of the pixels inside the box,
    we get sub-pixel accuracy — critical for decimal scoring where 1 px error
    at 10m (0.17 mm) changes the score by ~0.02 points.

    For dark holes on light backgrounds the box is inverted before moment
    computation so the hole pixel cluster has the highest weight.

    Args:
        gray: Full warped grayscale image.
        cx, cy: Bounding box centre in full canvas coordinates.
        bw, bh: Bounding box width and height in full canvas pixels.

    Returns:
        (refined_cx, refined_cy) — falls back to (cx, cy) on failure.
    """
    h, w = gray.shape[:2]
    half_w = max(bw / 2.0, 3.0)
    half_h = max(bh / 2.0, 3.0)

    x1 = max(0, int(cx - half_w))
    y1 = max(0, int(cy - half_h))
    x2 = min(w, int(cx + half_w + 1))
    y2 = min(h, int(cy + half_h + 1))

    if x2 <= x1 or y2 <= y1:
        return cx, cy

    roi = gray[y1:y2, x1:x2].astype(np.float32)

    # Holes on dark background: bright torn-paper effect → use roi directly.
    # Holes on light background: dark ink marks → invert so hole = bright.
    mean_val = float(roi.mean())
    if mean_val > 160:           # light region → dark hole → invert
        roi = 255.0 - roi

    # Threshold to suppress background pixels below the hole signal
    thresh = float(roi.max()) * 0.4
    roi_thresh = np.where(roi > thresh, roi, 0.0)

    M = cv2.moments(roi_thresh)
    if M["m00"] < 1e-6:
        return cx, cy   # degenerate — fall back to bounding-box centre

    refined_cx = M["m10"] / M["m00"] + x1
    refined_cy = M["m01"] / M["m00"] + y1
    return float(refined_cx), float(refined_cy)


# ---------------------------------------------------------------------------
# ONNX inference
# ---------------------------------------------------------------------------

def _run_inference(
    img_uint8: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """
    Single forward pass through the ONNX model.

    Args:
        img_uint8:      uint8 RGB image (any size — resized to 640×640).
        conf_threshold: Minimum confidence to keep.

    Returns:
        List of (cx, cy, w, h, conf) in resized 640×640 coordinate space.
    """
    inp = cv2.resize(img_uint8, (YOLO_INPUT_SIZE, YOLO_INPUT_SIZE),
                     interpolation=cv2.INTER_LINEAR)
    inp_f = inp.astype(np.float32) / 255.0
    inp_chw = np.expand_dims(inp_f.transpose(2, 0, 1), axis=0)  # (1,3,640,640)

    outputs = _ort_session.run(None, {"images": inp_chw})
    return _parse_yolov8_output(outputs[0], conf_threshold)


def _parse_yolov8_output(
    raw: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """
    Parse YOLOv8 ONNX output → (cx, cy, w, h, conf) list.

    Handles both transposed formats:
        Format A: (1, num_anchors, 4+num_classes)
        Format B: (1, 4+num_classes, num_anchors)  [ultralytics default export]
    """
    pred = raw[0]
    if pred.ndim == 2:
        anchors = pred if pred.shape[1] >= 5 else pred.T
    else:
        return []

    boxes: List[Tuple[float, float, float, float, float]] = []
    for row in anchors:
        cx, cy, bw, bh = float(row[0]), float(row[1]), float(row[2]), float(row[3])
        conf = float(row[4:].max())
        if conf >= conf_threshold:
            boxes.append((cx, cy, bw, bh, conf))
    return boxes


# ---------------------------------------------------------------------------
# NMS utilities
# ---------------------------------------------------------------------------

def _nms_raw(
    boxes: List[Tuple[float, float, float, float, float]],
    iou_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """Greedy NMS on raw (cx, cy, w, h, conf) boxes."""
    if not boxes:
        return []
    ordered    = sorted(boxes, key=lambda b: b[4], reverse=True)
    kept: List = []
    suppressed: set = set()
    for i, bi in enumerate(ordered):
        if i in suppressed:
            continue
        kept.append(bi)
        for j in range(i + 1, len(ordered)):
            if j not in suppressed and _raw_iou(bi, ordered[j]) > iou_threshold:
                suppressed.add(j)
    return kept


def _raw_iou(
    a: Tuple[float, float, float, float, float],
    b: Tuple[float, float, float, float, float],
) -> float:
    ax1, ay1 = a[0] - a[2] / 2, a[1] - a[3] / 2
    ax2, ay2 = a[0] + a[2] / 2, a[1] + a[3] / 2
    bx1, by1 = b[0] - b[2] / 2, b[1] - b[3] / 2
    bx2, by2 = b[0] + b[2] / 2, b[1] + b[3] / 2
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    iw = max(0.0, ix2 - ix1)
    ih = max(0.0, iy2 - iy1)
    inter = iw * ih
    union = (ax2-ax1)*(ay2-ay1) + (bx2-bx1)*(by2-by1) - inter
    return inter / union if union > 0 else 0.0
