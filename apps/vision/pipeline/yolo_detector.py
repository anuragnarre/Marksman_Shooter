"""YOLOv11-L bullet-hole detector.

Supports two inference backends (auto-selected at load time):
  A. Ultralytics native (.pt)  — full Python SDK, best accuracy, requires torch
  B. ONNX Runtime (.onnx)      — production, CPU-only, no torch required

Model priority at startup:
  1. models/shot_detector_yolo11l.pt   (Ultralytics, if ultralytics installed)
  2. models/shot_detector_yolo11l.onnx (ONNX Runtime)
  3. models/shot_detector.onnx         (legacy YOLOv8/11 ONNX)

SAHI — 4 overlapping quadrants
-------------------------------
The working canvas (up to 1400×1400) is divided into 4 overlapping tiles.
Each tile is resized to 640×640 for inference.  Detections are mapped back
to full-canvas coordinates before cross-tile NMS removes duplicates.

Sub-pixel centroid refinement
------------------------------
After locating a bounding box, pixel-intensity moments inside the box give
sub-pixel accuracy — critical for decimal scoring.
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

_ort_session     = None   # onnxruntime.InferenceSession when loaded (backend B)
_ultralytics_model = None # ultralytics.YOLO when loaded (backend A)
_yolo_available: bool = False
_backend: str = "none"    # "ultralytics" | "onnx" | "none"

YOLO_INPUT_SIZE = 640
SAHI_MERGE_IOU  = 0.45

# 4-quadrant SAHI layout (tile covers 55 % of longest axis, 10 % overlap)
_TILE_FRAC   = 0.55   # fraction of canvas covered by each tile
_TILE_OVERLAP = 0.10  # overlap fraction


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_yolo_model(
    model_path: Optional[str] = None,
) -> bool:
    """
    Load the YOLOv11-L shot-detector model.

    Tries paths in priority order:
      1. Explicit model_path argument (if given)
      2. models/shot_detector_yolo11l.pt  (Ultralytics native)
      3. models/shot_detector_yolo11l.onnx
      4. models/shot_detector.onnx         (legacy)

    Returns True on success, False if no model file found.
    """
    global _ort_session, _ultralytics_model, _yolo_available, _backend

    candidates = []
    if model_path:
        candidates.append(model_path)
    candidates += [
        "models/shot_detector_yolo11l.pt",
        "models/shot_detector_yolo11l.onnx",
        "models/shot_detector.onnx",
    ]

    for path in candidates:
        if not os.path.exists(path):
            continue

        if path.endswith(".pt"):
            if _try_load_ultralytics(path):
                return True
        elif path.endswith(".onnx"):
            if _try_load_onnx(path):
                return True

    logger.info("No YOLO model found — running CV-only mode.")
    _yolo_available = False
    return False


def detect_holes_yolo(
    gray: np.ndarray,
    calibration: TargetCalibration,
    target_type: str,
    conf_threshold: float = 0.25,
) -> List[FusedHole]:
    """
    Run YOLOv11-L inference on a grayscale image.

    Uses adaptive SAHI tiling (4 overlapping tiles) then sub-pixel centroid
    refinement via image moments.

    Args:
        gray:           Grayscale working image (any size up to 1400×1400).
        calibration:    Target calibration (used for tile sizing).
        target_type:    "air_rifle_10m" | "air_pistol_10m" | …
        conf_threshold: Minimum confidence to retain.

    Returns:
        List of FusedHole (method="yolo").  Empty list when no model loaded.
    """
    if not _yolo_available:
        return []

    h, w = gray.shape[:2]
    rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

    raw_boxes = _sahi_adaptive(rgb, conf_threshold, h, w)

    holes: List[FusedHole] = []
    for cx_f, cy_f, bw_f, bh_f, conf in raw_boxes:
        cx_ref, cy_ref = _refine_centroid(gray, cx_f, cy_f, bw_f, bh_f)
        radius = max(bw_f, bh_f) / 2.0
        holes.append(FusedHole(
            x=cx_ref, y=cy_ref,
            radius=radius,
            confidence=float(conf),
            methods_agreed=1,
            method="yolo",
        ))

    return holes


# ---------------------------------------------------------------------------
# Model loading helpers
# ---------------------------------------------------------------------------

def _try_load_ultralytics(path: str) -> bool:
    global _ultralytics_model, _yolo_available, _backend
    try:
        from ultralytics import YOLO
        _ultralytics_model = YOLO(path)
        _yolo_available = True
        _backend = "ultralytics"
        logger.info("YOLOv11-L loaded via Ultralytics from %s", path)
        return True
    except Exception as exc:
        logger.debug("Ultralytics load failed for %s: %s", path, exc)
        return False


def _try_load_onnx(path: str) -> bool:
    global _ort_session, _yolo_available, _backend
    try:
        import onnxruntime as ort
        opts = ort.SessionOptions()
        opts.log_severity_level = 3
        _ort_session = ort.InferenceSession(
            path, sess_options=opts,
            providers=["CPUExecutionProvider"],
        )
        _yolo_available = True
        _backend = "onnx"
        logger.info("YOLOv11-L loaded via ONNX Runtime from %s", path)
        return True
    except Exception as exc:
        logger.debug("ONNX load failed for %s: %s", path, exc)
        return False


# ---------------------------------------------------------------------------
# Adaptive SAHI
# ---------------------------------------------------------------------------

def _sahi_adaptive(
    rgb: np.ndarray,
    conf_threshold: float,
    h: int,
    w: int,
) -> List[Tuple[float, float, float, float, float]]:
    """4-quadrant SAHI with tile size adapated to image dimensions."""
    tile_h = int(h * _TILE_FRAC)
    tile_w = int(w * _TILE_FRAC)
    step_h = int(h * (1 - _TILE_OVERLAP) / 2)
    step_w = int(w * (1 - _TILE_OVERLAP) / 2)

    offsets: List[Tuple[int, int]] = [
        (0,      0     ),
        (0,      step_w),
        (step_h, 0     ),
        (step_h, step_w),
    ]

    all_boxes: List[Tuple[float, float, float, float, float]] = []
    for row_off, col_off in offsets:
        row_end = min(row_off + tile_h, h)
        col_end = min(col_off + tile_w, w)
        tile = rgb[row_off:row_end, col_off:col_end]
        actual_h = tile.shape[0]
        actual_w = tile.shape[1]

        for cx_t, cy_t, bw_t, bh_t, conf in _run_inference(tile, conf_threshold):
            cx_f = (cx_t / YOLO_INPUT_SIZE) * actual_w + col_off
            cy_f = (cy_t / YOLO_INPUT_SIZE) * actual_h + row_off
            bw_f = (bw_t / YOLO_INPUT_SIZE) * actual_w
            bh_f = (bh_t / YOLO_INPUT_SIZE) * actual_h
            all_boxes.append((cx_f, cy_f, bw_f, bh_f, conf))

    return _nms_raw(all_boxes, SAHI_MERGE_IOU)


# ---------------------------------------------------------------------------
# Inference dispatch
# ---------------------------------------------------------------------------

def _run_inference(
    img_uint8: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """Single forward pass — dispatches to Ultralytics or ONNX backend."""
    if _backend == "ultralytics":
        return _run_ultralytics(img_uint8, conf_threshold)
    elif _backend == "onnx":
        return _run_onnx(img_uint8, conf_threshold)
    return []


def _run_ultralytics(
    img_uint8: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """Ultralytics YOLOv11 inference path."""
    resized = cv2.resize(img_uint8, (YOLO_INPUT_SIZE, YOLO_INPUT_SIZE))
    results = _ultralytics_model.predict(
        resized, conf=conf_threshold, verbose=False, imgsz=YOLO_INPUT_SIZE,
    )
    boxes: List[Tuple[float, float, float, float, float]] = []
    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            bw = x2 - x1
            bh = y2 - y1
            boxes.append((cx, cy, bw, bh, conf))
    return boxes


def _run_onnx(
    img_uint8: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """ONNX Runtime inference path (YOLOv8/v11 same output format)."""
    inp = cv2.resize(img_uint8, (YOLO_INPUT_SIZE, YOLO_INPUT_SIZE),
                     interpolation=cv2.INTER_LINEAR)
    inp_f = inp.astype(np.float32) / 255.0
    inp_chw = np.expand_dims(inp_f.transpose(2, 0, 1), axis=0)

    outputs = _ort_session.run(None, {"images": inp_chw})
    return _parse_yolo_output(outputs[0], conf_threshold)


def _parse_yolo_output(
    raw: np.ndarray,
    conf_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    """
    Parse YOLOv8/v11 ONNX output → (cx, cy, w, h, conf) list.

    Handles both transposed formats:
        Format A: (1, num_anchors, 4+num_classes)   [standard]
        Format B: (1, 4+num_classes, num_anchors)   [ultralytics default export]
    """
    pred = raw[0]
    if pred.ndim != 2:
        return []

    # Detect format: if columns >= rows, predictions are rows
    anchors = pred if pred.shape[1] >= 5 else pred.T

    boxes: List[Tuple[float, float, float, float, float]] = []
    for row in anchors:
        cx, cy, bw, bh = float(row[0]), float(row[1]), float(row[2]), float(row[3])
        conf = float(row[4:].max())
        if conf >= conf_threshold:
            boxes.append((cx, cy, bw, bh, conf))
    return boxes


# ---------------------------------------------------------------------------
# Sub-pixel centroid refinement
# ---------------------------------------------------------------------------

def _refine_centroid(
    gray: np.ndarray,
    cx: float, cy: float,
    bw: float, bh: float,
) -> Tuple[float, float]:
    """
    Intensity-moment centroid refinement within a bounding box.

    Gives sub-pixel accuracy — critical for decimal scoring where 1 px at
    typical scale (0.05 mm/px) changes the score by ~0.02 points.
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
    if float(roi.mean()) > 160:   # cream zone: dark hole → invert
        roi = 255.0 - roi

    thresh = float(roi.max()) * 0.4
    roi_thresh = np.where(roi > thresh, roi, 0.0)

    M = cv2.moments(roi_thresh)
    if M["m00"] < 1e-6:
        return cx, cy

    return float(M["m10"] / M["m00"]) + x1, float(M["m01"] / M["m00"]) + y1


# ---------------------------------------------------------------------------
# NMS utilities
# ---------------------------------------------------------------------------

def _nms_raw(
    boxes: List[Tuple[float, float, float, float, float]],
    iou_threshold: float,
) -> List[Tuple[float, float, float, float, float]]:
    if not boxes:
        return []
    ordered = sorted(boxes, key=lambda b: b[4], reverse=True)
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
    union = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - inter
    return inter / union if union > 0 else 0.0
