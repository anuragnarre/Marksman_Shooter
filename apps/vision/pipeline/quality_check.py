"""Image quality validation using Laplacian variance, Tenengrad, and localized checks.

Improvements over v1
--------------------
- Blur check uses both Laplacian (full image) and Tenengrad (central 60% ROI).
  An image is acceptable if EITHER metric passes — prevents rejecting images
  that have a sharp target but a blurry background.
- Glare check is ROI-focused: background reflections outside the central area
  no longer cause rejection.
- Dynamic range measured in the central ROI where the target is expected.
"""

import cv2
import numpy as np

from .types import QualityReport

# Thresholds
BLUR_THRESHOLD        = 40.0    # Laplacian variance (lowered for WhatsApp JPEG compression)
TENENGRAD_THRESHOLD   = 200.0   # Mean squared Sobel gradient in central ROI
GLARE_PIXEL_THRESHOLD = 245
GLARE_PCT_WARN        = 10.0
GLARE_PCT_REJECT      = 15.0
DYNAMIC_RANGE_WARN    = 40
MIN_DIMENSION         = 640


def _tenengrad(gray: np.ndarray) -> float:
    """Tenengrad sharpness: mean squared Sobel gradient magnitude in central 60% ROI.

    More sensitive than Laplacian variance and ignores blurry background regions
    outside the target area.
    """
    h, w = gray.shape[:2]
    roi = gray[h // 5 : 4 * h // 5, w // 5 : 4 * w // 5]
    gx = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
    return float(np.mean(gx ** 2 + gy ** 2))


def check_quality(gray: np.ndarray) -> QualityReport:
    """
    Assess image quality for target analysis.

    Returns a QualityReport. Sets is_acceptable=False only for severe issues;
    milder problems are reported as warnings.
    """
    h, w = gray.shape[:2]
    warnings = []
    is_acceptable = True

    # Resolution check
    if h < MIN_DIMENSION or w < MIN_DIMENSION:
        warnings.append(f"Low resolution: {w}x{h} (min {MIN_DIMENSION}x{MIN_DIMENSION})")

    # --- Central ROI for local quality metrics (60% of image where target lives) ---
    roi = gray[h // 5 : 4 * h // 5, w // 5 : 4 * w // 5]

    # Blur detection: passes if EITHER Laplacian (global) OR Tenengrad (local) is sharp.
    # This prevents rejecting images with sharp targets but blurry backgrounds.
    laplacian    = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score   = float(laplacian.var())
    tg_score     = _tenengrad(gray)

    if blur_score < BLUR_THRESHOLD and tg_score < TENENGRAD_THRESHOLD:
        warnings.append(
            f"Image may be blurry "
            f"(laplacian={blur_score:.1f}, tenengrad={tg_score:.0f})"
        )

    # Glare detection: only reject if overexposed pixels are in the central ROI
    # (background glare / window reflections should not disqualify a good shot photo).
    roi_total      = int(roi.size)
    roi_glare_px   = int(np.count_nonzero(roi > GLARE_PIXEL_THRESHOLD))
    glare_pct_roi  = (roi_glare_px / max(roi_total, 1)) * 100.0

    # Keep reporting the global figure so callers see the full picture.
    global_glare_px = int(np.count_nonzero(gray > GLARE_PIXEL_THRESHOLD))
    glare_pct_global = (global_glare_px / gray.size) * 100.0

    if glare_pct_roi > GLARE_PCT_REJECT:
        warnings.append(
            f"Severe glare in target area: {glare_pct_roi:.1f}% overexposed pixels"
        )
        is_acceptable = False
    elif glare_pct_roi > GLARE_PCT_WARN:
        warnings.append(
            f"Moderate glare in target area: {glare_pct_roi:.1f}% overexposed pixels"
        )

    # Dynamic range: measured in central ROI to avoid bright/dark borders skewing it
    dynamic_range = int(roi.max()) - int(roi.min())
    if dynamic_range < DYNAMIC_RANGE_WARN:
        warnings.append(
            f"Low contrast: dynamic range={dynamic_range} (threshold={DYNAMIC_RANGE_WARN})"
        )

    return QualityReport(
        is_acceptable=is_acceptable,
        blur_score=blur_score,
        glare_pct=glare_pct_global,   # global value for backward-compatible logging
        dynamic_range=dynamic_range,
        warnings=warnings,
    )
