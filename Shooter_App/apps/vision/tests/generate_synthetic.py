"""
Synthetic target image generator for pipeline accuracy benchmarking.

Generates labeled (image, annotation) pairs covering:
  - Single shots at each ring boundary
  - Tight groups (3 shots within 1 ring width)
  - Spread groups (5 shots, one per ring)
  - 10-shot competition series
  - Boundary shots (±0.1 mm from ring line)
  - Lighting, blur, and perspective variants

Each annotation is a list of dicts:
  { "x_mm": float, "y_mm": float, "score": float }
"""

import math
import sys
import os
from typing import Iterator, List, Tuple

import cv2
import numpy as np

# Allow running from the tests/ directory directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.target_specs import get_spec, TargetSpec


# Canvas parameters
CANVAS_SIZE = 1000
CENTER = CANVAS_SIZE // 2 - 10    # = 490, matches render_template center = radius_px


def _render_base_target(
    spec: TargetSpec,
    brightness: float = 1.0,
) -> np.ndarray:
    """Render a clean target image at the given brightness scale."""
    radius_px = CANVAS_SIZE // 2 - 10
    img = spec.render_template(radius_px)
    img = np.clip(img.astype(np.float32) * brightness, 0, 255).astype(np.uint8)
    # Convert to BGR for compositing
    return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)


def _pellet_radius_px(spec: TargetSpec) -> float:
    """Physical pellet radius in canvas pixels."""
    mm_per_px = spec.outer_radius_mm / (CANVAS_SIZE // 2 - 10)
    return (spec.pellet_diameter_mm / 2.0) / mm_per_px


def _render_hole(
    img: np.ndarray,
    cx_px: float,
    cy_px: float,
    pellet_r_px: float,
    is_black_zone: bool,
) -> np.ndarray:
    """
    Composite a bullet hole onto the target image.

    Black zone: holes appear as a bright (paper-white) disc with Gaussian falloff.
    Cream zone: holes appear as a dark disc.
    """
    result = img.copy()
    hole_r = max(2, int(pellet_r_px * 0.45))

    img_h, img_w = result.shape[:2]
    ix, iy = int(round(cx_px)), int(round(cy_px))
    for dy in range(-hole_r - 1, hole_r + 2):
        for dx in range(-hole_r - 1, hole_r + 2):
            px_x = ix + dx
            px_y = iy + dy
            if not (0 <= px_x < img_w and 0 <= px_y < img_h):
                continue
            dist = math.sqrt(dx * dx + dy * dy)
            if dist > hole_r + 1:
                continue
            # Soft edge: Gaussian falloff within the hole radius
            alpha = math.exp(-0.5 * (dist / max(hole_r * 0.6, 1)) ** 2)
            if is_black_zone:
                fill = 230  # bright hole in dark zone
            else:
                fill = 30   # dark hole in cream zone
            for c in range(3):
                orig = float(result[px_y, px_x, c])
                result[px_y, px_x, c] = int(orig * (1 - alpha) + fill * alpha)

    return result


def _shot_pixel(spec: TargetSpec, dist_mm: float, angle_deg: float) -> Tuple[float, float]:
    """Convert (dist_mm from center, angle) to canvas pixels."""
    mm_per_px = spec.outer_radius_mm / (CANVAS_SIZE // 2 - 10)
    r_px = dist_mm / mm_per_px
    rad = math.radians(angle_deg)
    return CENTER + r_px * math.cos(rad), CENTER + r_px * math.sin(rad)


def _score_from_dist(spec: TargetSpec, dist_mm: float) -> float:
    """ISSF score from distance from center (applying pellet-radius outer-edge rule)."""
    effective_dist = max(0.0, dist_mm - spec.pellet_diameter_mm / 2.0)
    raw = spec.max_score() - (effective_dist / spec.ring_width_mm)
    return round(max(0.0, min(spec.max_score(), raw)), 1)


def _is_black_zone(spec: TargetSpec, dist_mm: float) -> bool:
    # Black zone = innermost dark_center_rings rings (e.g. rings 6-10 for air rifle).
    # Their outer boundary radius = outer_radius_mm - dark_center_rings * ring_width_mm
    # (NOT dark_center_rings * ring_width_mm, which counts from the wrong end).
    black_r_mm = spec.outer_radius_mm - spec.dark_center_rings * spec.ring_width_mm
    return dist_mm < black_r_mm


def _apply_blur(img: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return img
    k = max(3, int(sigma * 6) | 1)
    return cv2.GaussianBlur(img, (k, k), sigma)


def _apply_perspective(img: np.ndarray, angle_deg: float) -> np.ndarray:
    """Apply a mild perspective tilt (horizontal rotation simulation)."""
    if abs(angle_deg) < 0.5:
        return img
    h, w = img.shape[:2]
    cos_a = math.cos(math.radians(angle_deg))
    # Simulate tilt: compress the top edge
    shrink = max(0.1, cos_a)
    pad = int(w * (1 - shrink) / 2)
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[pad, 0], [w - pad, 0], [w, h], [0, h]])
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, M, (w, h), flags=cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REPLICATE)


def _make_annotation(
    spec: TargetSpec,
    shots_mm: List[Tuple[float, float]],  # list of (dist_mm, angle_deg)
) -> List[dict]:
    annotations = []
    for dist_mm, angle_deg in shots_mm:
        rad = math.radians(angle_deg)
        x_mm = dist_mm * math.cos(rad)
        y_mm = dist_mm * math.sin(rad)
        score = _score_from_dist(spec, dist_mm)
        if score >= 1.0:
            annotations.append({"x_mm": round(x_mm, 3), "y_mm": round(y_mm, 3),
                                 "score": score})
    return annotations


def _build_image(
    spec: TargetSpec,
    shots_mm: List[Tuple[float, float]],
    brightness: float = 1.0,
    blur_sigma: float = 0.0,
    perspective_deg: float = 0.0,
) -> Tuple[np.ndarray, List[dict]]:
    """Build a synthetic target image with the given shots."""
    img = _render_base_target(spec, brightness)
    pellet_r = _pellet_radius_px(spec)

    for dist_mm, angle_deg in shots_mm:
        cx_px, cy_px = _shot_pixel(spec, dist_mm, angle_deg)
        black = _is_black_zone(spec, dist_mm)
        img = _render_hole(img, cx_px, cy_px, pellet_r, black)

    img = _apply_blur(img, blur_sigma)
    img = _apply_perspective(img, perspective_deg)

    annotations = _make_annotation(spec, shots_mm)
    return img, annotations


def generate_test_cases(
    target_type: str = "air_rifle_10m",
) -> Iterator[Tuple[np.ndarray, List[dict], str]]:
    """
    Yield (image, annotations, description) for each synthetic test case.

    Covers single shots at each ring boundary, tight groups, spread groups,
    competition series, and boundary shots — with lighting / blur / perspective
    variants.
    """
    spec = get_spec(target_type)

    # ── Single shots at each ring boundary ────────────────────────────────────
    for ring_num in range(1, spec.num_rings + 1):
        r_mm = spec.ring_radius_mm(ring_num)
        mid_mm = r_mm - spec.ring_width_mm / 2.0  # midpoint of the ring band
        for angle in [0, 45, 90, 135]:
            shots = [(mid_mm, angle)]
            for brightness in [0.7, 1.0, 1.3]:
                for blur in [0.0, 1.5]:
                    img, ann = _build_image(spec, shots, brightness, blur)
                    desc = f"ring{ring_num}_a{angle}_b{brightness}_blur{blur}"
                    yield img, ann, desc

    # ── Tight 3-shot groups (within 1 ring width) ─────────────────────────────
    for center_dist in [5.0, 15.0, 30.0]:
        shots = [
            (center_dist, 0),
            (center_dist + spec.ring_width_mm * 0.3, 40),
            (center_dist - spec.ring_width_mm * 0.2, 80),
        ]
        for blur in [0.0, 1.0, 2.0]:
            img, ann = _build_image(spec, shots, blur_sigma=blur)
            desc = f"tight3_r{center_dist}_blur{blur}"
            yield img, ann, desc

    # ── Spread 5-shot groups (one per ring) ────────────────────────────────────
    shots_5 = [
        (spec.ring_radius_mm(n) - spec.ring_width_mm / 2.0, n * 72)
        for n in range(1, 6)
    ]
    for brightness in [0.8, 1.0, 1.2]:
        img, ann = _build_image(spec, shots_5, brightness)
        desc = f"spread5_b{brightness}"
        yield img, ann, desc

    # ── 10-shot competition series ─────────────────────────────────────────────
    shots_10 = [
        (spec.ring_radius_mm(1) - spec.ring_width_mm * 0.5, i * 36)
        for i in range(10)
    ]
    for blur in [0.0, 1.0]:
        img, ann = _build_image(spec, shots_10, blur_sigma=blur)
        desc = f"competition10_blur{blur}"
        yield img, ann, desc

    # ── Ring boundary shots (±0.1 mm from boundary) ───────────────────────────
    for ring_num in range(2, spec.num_rings):
        boundary_mm = spec.ring_radius_mm(ring_num)
        for offset_mm, label in [(-0.05, "inside"), (+0.05, "outside")]:
            shots = [(boundary_mm + offset_mm, 0)]
            img, ann = _build_image(spec, shots)
            desc = f"boundary_ring{ring_num}_{label}"
            yield img, ann, desc

    # ── Perspective variants ───────────────────────────────────────────────────
    shots_center = [(5.0, 0)]
    for tilt in [0.0, 8.0, 15.0]:
        img, ann = _build_image(spec, shots_center, perspective_deg=tilt)
        desc = f"perspective_tilt{tilt}"
        yield img, ann, desc

    # ── Clean target (no shots) — for false positive testing ──────────────────
    img = _render_base_target(spec)
    yield img, [], "clean_no_shots"


if __name__ == "__main__":
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "synthetic")
    os.makedirs(out_dir, exist_ok=True)

    for i, (img, ann, desc) in enumerate(generate_test_cases()):
        path = os.path.join(out_dir, f"{i:04d}_{desc}.png")
        cv2.imwrite(path, img)
        print(f"[{i:04d}] {desc} — {len(ann)} shots")

    print(f"\nGenerated images in {out_dir}")
