"""
Difference imaging: optional confirmation signal for hole detection.

Renders a synthetic target at detected parameters and subtracts from the real
image. The resulting diff highlights anomalies (holes). This is used as a
secondary confirmation method, not the primary detection path.
"""

import cv2
import numpy as np

from .types import TargetCalibration
from .target_specs import get_spec


def compute_difference_image(
    gray: np.ndarray,
    calibration: TargetCalibration,
    target_type: str = "air_rifle_10m",
    blur_score: float = 0.0,
) -> np.ndarray:
    """
    Compute a difference image that highlights anomalies (bullet holes).

    Parameters
    ----------
    gray : Grayscale image (perspective-corrected).
    calibration : Target geometry with center and radius.
    target_type : ISSF target type key.
    blur_score : Laplacian variance from quality check.

    Returns
    -------
    Difference image (uint8, 0-255) where bright = anomaly.
    """
    h, w = gray.shape[:2]
    cx, cy = calibration.center
    radius = calibration.major_radius
    spec = get_spec(target_type)

    if radius < 10:
        return np.zeros_like(gray)

    # Render synthetic template at detected scale
    radius_px = int(round(radius))
    template_square = spec.render_template(radius_px)
    ts = template_square.shape[0]

    # Place template on full-size canvas
    synthetic = np.full((h, w), 200, dtype=np.uint8)
    half = ts // 2
    src_y_start = max(0, -int(cy - half))
    src_x_start = max(0, -int(cx - half))
    dst_y_start = max(0, int(cy - half))
    dst_x_start = max(0, int(cx - half))
    src_y_end = min(ts, ts - max(0, int(cy + half + 1) - h))
    src_x_end = min(ts, ts - max(0, int(cx + half + 1) - w))
    dst_y_end = dst_y_start + (src_y_end - src_y_start)
    dst_x_end = dst_x_start + (src_x_end - src_x_start)

    if dst_y_end > dst_y_start and dst_x_end > dst_x_start:
        synthetic[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
            template_square[src_y_start:src_y_end, src_x_start:src_x_end]

    # Match blur level
    if blur_score > 0:
        sigma = max(0.5, 3.0 / (1.0 + blur_score / 100.0))
    else:
        sigma = 1.5
    ksize = max(3, int(sigma * 6) | 1)
    synthetic = cv2.GaussianBlur(synthetic, (ksize, ksize), sigma)

    # Smooth real image to suppress JPEG artifacts
    real_smooth = cv2.bilateralFilter(gray, d=5, sigmaColor=30, sigmaSpace=30)

    # Normalize both to [0, 1]
    real_f = real_smooth.astype(np.float32) / 255.0
    synth_f = synthetic.astype(np.float32) / 255.0

    # Local histogram matching within target region
    mask = _target_mask(h, w, cx, cy, radius)
    if np.any(mask):
        real_mean = float(np.mean(real_f[mask]))
        real_std = float(np.std(real_f[mask]))
        synth_mean = float(np.mean(synth_f[mask]))
        synth_std = float(np.std(synth_f[mask]))

        if synth_std > 0.01:
            synth_f = (synth_f - synth_mean) * (real_std / synth_std) + real_mean
            synth_f = np.clip(synth_f, 0.0, 1.0)

    # Absolute difference
    diff = np.abs(real_f - synth_f)
    diff[~mask] = 0.0

    diff_uint8 = (diff * 255.0).astype(np.uint8)
    diff_uint8 = cv2.normalize(diff_uint8, None, 0, 255, cv2.NORM_MINMAX)

    return diff_uint8


def _target_mask(h: int, w: int, cx: float, cy: float, radius: float) -> np.ndarray:
    """Boolean mask for pixels within the target boundary."""
    yy, xx = np.ogrid[:h, :w]
    dist_sq = (xx - cx) ** 2 + (yy - cy) ** 2
    return dist_sq <= (radius * 1.05) ** 2
