"""Image quality validation using Laplacian variance, glare detection, and dynamic range."""

import cv2
import numpy as np

from .types import QualityReport

# Thresholds
BLUR_THRESHOLD = 100.0
GLARE_PIXEL_THRESHOLD = 245
GLARE_PCT_WARN = 10.0
GLARE_PCT_REJECT = 15.0
DYNAMIC_RANGE_WARN = 40
MIN_DIMENSION = 640


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

    # Blur detection via Laplacian variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())
    if blur_score < BLUR_THRESHOLD:
        warnings.append(f"Image may be blurry (sharpness={blur_score:.1f}, threshold={BLUR_THRESHOLD})")

    # Glare detection: percentage of near-white pixels
    glare_pixels = np.count_nonzero(gray > GLARE_PIXEL_THRESHOLD)
    total_pixels = gray.size
    glare_pct = (glare_pixels / total_pixels) * 100.0
    if glare_pct > GLARE_PCT_REJECT:
        warnings.append(f"Severe glare: {glare_pct:.1f}% overexposed pixels")
        is_acceptable = False
    elif glare_pct > GLARE_PCT_WARN:
        warnings.append(f"Moderate glare: {glare_pct:.1f}% overexposed pixels")

    # Dynamic range
    dynamic_range = int(gray.max()) - int(gray.min())
    if dynamic_range < DYNAMIC_RANGE_WARN:
        warnings.append(f"Low contrast: dynamic range={dynamic_range} (threshold={DYNAMIC_RANGE_WARN})")

    return QualityReport(
        is_acceptable=is_acceptable,
        blur_score=blur_score,
        glare_pct=glare_pct,
        dynamic_range=dynamic_range,
        warnings=warnings,
    )
