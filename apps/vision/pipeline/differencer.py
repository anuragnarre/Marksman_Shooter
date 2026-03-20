"""
Difference imaging: subtract synthetic template from real image to isolate bullet holes.

Replaces inpainter.py. Instead of trying to mask/inpaint ring features (lossy),
we render a synthetic target at the exact detected parameters and subtract it.
Ring lines, numbers, and background cancel out — only anomalies (holes) remain.
"""

import cv2
import numpy as np

from .types import TargetCalibration
from .target_specs import get_spec, TargetSpec


def compute_difference_image(
    gray: np.ndarray,
    calibration: TargetCalibration,
    target_type: str = "air_rifle_10m",
    blur_score: float = 0.0,
) -> np.ndarray:
    """
    Compute a difference image that isolates bullet holes.

    1. Render synthetic template at exact detected parameters
    2. Match blur level to the real image
    3. Normalize and subtract
    4. Return difference image where holes are bright on dark background

    Parameters
    ----------
    gray : Grayscale image (perspective-corrected).
    calibration : Target geometry with center and radius.
    target_type : ISSF target type key.
    blur_score : Laplacian variance from quality check (for blur matching).

    Returns
    -------
    Difference image (uint8, 0-255) where bright = anomaly (holes).
    """
    h, w = gray.shape[:2]
    cx, cy = calibration.center
    radius = calibration.major_radius
    spec = get_spec(target_type)

    if radius < 10:
        return np.zeros_like(gray)

    # Step 1: Render synthetic template at detected scale
    radius_px = int(round(radius))
    template_square = spec.render_template(radius_px)
    ts = template_square.shape[0]  # 2*radius_px + 1

    # Step 2: Place template on a full-size canvas at detected center
    synthetic = np.full((h, w), 200, dtype=np.uint8)  # neutral gray background

    # Compute paste region (handle edges)
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

    # Step 3: Match blur — estimate PSF sigma from blur_score
    # blur_score is Laplacian variance: higher = sharper
    # A sharp image (blur_score ~500+) needs minimal blur on template
    # A blurry image (blur_score ~50) needs more blur
    if blur_score > 0:
        sigma = max(0.5, 3.0 / (1.0 + blur_score / 100.0))
    else:
        sigma = 1.5  # Default moderate blur

    ksize = int(sigma * 6) | 1  # Ensure odd
    ksize = max(3, ksize)
    synthetic = cv2.GaussianBlur(synthetic, (ksize, ksize), sigma)

    # Step 4: Apply bilateral filter to real image to suppress JPEG artifacts
    real_smooth = cv2.bilateralFilter(gray, d=5, sigmaColor=30, sigmaSpace=30)

    # Step 5: Normalize both to [0, 1] and compute difference
    real_f = real_smooth.astype(np.float32) / 255.0
    synth_f = synthetic.astype(np.float32) / 255.0

    # Local histogram matching: adjust synthetic brightness/contrast to match real
    # within the target region
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

    # Mask outside target region (no holes expected there)
    outside_mask = ~mask
    diff[outside_mask] = 0.0

    # Convert back to uint8
    diff_uint8 = (diff * 255.0).astype(np.uint8)

    # Enhance contrast of difference image
    diff_uint8 = cv2.normalize(diff_uint8, None, 0, 255, cv2.NORM_MINMAX)

    return diff_uint8


def _target_mask(
    h: int, w: int, cx: float, cy: float, radius: float
) -> np.ndarray:
    """Create a boolean mask for pixels within the target boundary."""
    ys = np.arange(h)
    xs = np.arange(w)
    yy, xx = np.meshgrid(ys, xs, indexing='ij')
    dist_sq = (xx - cx) ** 2 + (yy - cy) ** 2
    return dist_sq <= (radius * 1.05) ** 2
