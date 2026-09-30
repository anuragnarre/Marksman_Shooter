"""Unified NMS fusion of CV and YOLO bullet-hole detections.

Strategy
--------
* For each CV hole, search for a spatially close YOLO hole.
* If found: merge into a "fused" detection (weighted centroid, boosted
  confidence).
* Unpaired CV holes kept if confidence > CV_SOLO_THRESHOLD.
* Unpaired YOLO holes kept if confidence > YOLO_SOLO_THRESHOLD.
* Final greedy NMS removes any remaining duplicates.
"""

import math
from typing import List, Tuple

from .types import FusedHole

# Confidence thresholds for solo (unmatched) detections
CV_SOLO_THRESHOLD = 0.15      # was 0.35 — keep weaker CV detections
YOLO_SOLO_THRESHOLD = 0.20    # was 0.40 — keep weaker YOLO detections
PAIRED_THRESHOLD = 0.20
PAIR_CONFIDENCE_BOOST = 0.08

# Pair if center distance < max(r1, r2) * PAIR_DISTANCE_FACTOR
PAIR_DISTANCE_FACTOR = 2.5    # was 1.5 — wider pairing window for tight groups


def fuse_candidates(
    cv_holes: List[FusedHole],
    yolo_holes: List[FusedHole],
    iou_threshold: float = 0.4,
) -> List[FusedHole]:
    """
    Merge CV and YOLO detections into a single deduplicated list.

    When yolo_holes is empty (model not loaded) this reduces to a
    NMS-only pass on cv_holes, replacing the old _deduplicate call.

    Args:
        cv_holes:  Detections from the traditional CV pipeline.
        yolo_holes: Detections from the YOLO model (empty if not loaded).
        iou_threshold: Not used in the pairing step (distance-based);
            passed through to the final nms_boxes call.

    Returns:
        Merged, deduplicated list of FusedHole objects.
    """
    if not yolo_holes:
        # CV-only path: apply NMS directly
        return nms_boxes(cv_holes, iou_threshold)

    matched_cv: set = set()
    matched_yolo: set = set()
    merged: List[FusedHole] = []

    # --- Greedy pairing: O(n*m) but n,m are small (< 20 shots per target) ---
    for i, ch in enumerate(cv_holes):
        for j, yh in enumerate(yolo_holes):
            if j in matched_yolo:
                continue
            dist = math.hypot(ch.x - yh.x, ch.y - yh.y)
            pair_dist = max(ch.radius, yh.radius) * PAIR_DISTANCE_FACTOR
            if dist <= pair_dist:
                # Weighted centroid
                w_cv = ch.confidence
                w_yolo = yh.confidence
                total_w = w_cv + w_yolo
                if total_w == 0:
                    total_w = 1.0

                merged_x = (ch.x * w_cv + yh.x * w_yolo) / total_w
                merged_y = (ch.y * w_cv + yh.y * w_yolo) / total_w
                merged_r = (ch.radius * w_cv + yh.radius * w_yolo) / total_w
                merged_conf = min(1.0, (w_cv + w_yolo) / 2 + PAIR_CONFIDENCE_BOOST)

                merged.append(FusedHole(
                    x=merged_x,
                    y=merged_y,
                    radius=merged_r,
                    confidence=merged_conf,
                    methods_agreed=2,
                    method="fused",
                ))
                matched_cv.add(i)
                matched_yolo.add(j)
                break  # each CV hole pairs with at most one YOLO hole

    # --- Unpaired CV holes ---
    for i, ch in enumerate(cv_holes):
        if i in matched_cv:
            continue
        if ch.confidence >= CV_SOLO_THRESHOLD:
            merged.append(ch)

    # --- Unpaired YOLO holes ---
    for j, yh in enumerate(yolo_holes):
        if j in matched_yolo:
            continue
        if yh.confidence >= YOLO_SOLO_THRESHOLD:
            merged.append(yh)

    # --- Final NMS to remove any remaining spatial duplicates ---
    return nms_boxes(merged, iou_threshold)


def nms_boxes(
    detections: List[FusedHole],
    iou_threshold: float = 0.5,
) -> List[FusedHole]:
    """
    Greedy NMS over a list of FusedHole detections.

    Each hole is represented as a square bounding box (side = 2*radius)
    centred at (x, y) for IoU computation. Detections sorted by confidence
    descending; lower-confidence detections overlapping a kept detection
    above iou_threshold are suppressed.

    Args:
        detections: List of FusedHole objects.
        iou_threshold: IoU above which the lower-confidence box is suppressed.

    Returns:
        Filtered list of FusedHole objects.
    """
    if not detections:
        return []

    # Sort by confidence descending
    ordered = sorted(detections, key=lambda d: d.confidence, reverse=True)

    kept: List[FusedHole] = []
    suppressed: set = set()

    for i, det in enumerate(ordered):
        if i in suppressed:
            continue
        kept.append(det)
        for j in range(i + 1, len(ordered)):
            if j in suppressed:
                continue
            if _box_iou(det, ordered[j]) > iou_threshold:
                suppressed.add(j)

    return kept


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _box_iou(a: FusedHole, b: FusedHole) -> float:
    """IoU of two holes represented as square bounding boxes."""
    ax1, ay1, ax2, ay2 = _to_box(a)
    bx1, by1, bx2, by2 = _to_box(b)

    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    iw = max(0.0, ix2 - ix1)
    ih = max(0.0, iy2 - iy1)
    intersection = iw * ih

    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - intersection

    if union <= 0:
        return 0.0
    return intersection / union


def _to_box(h: FusedHole) -> Tuple[float, float, float, float]:
    """Convert a FusedHole to (x1, y1, x2, y2) bounding box."""
    return (
        h.x - h.radius,
        h.y - h.radius,
        h.x + h.radius,
        h.y + h.radius,
    )
