"""Shared dataclasses for the shot detection pipeline."""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple


@dataclass
class QualityReport:
    """Image quality assessment results."""
    is_acceptable: bool
    blur_score: float
    glare_pct: float
    dynamic_range: int
    warnings: List[str] = field(default_factory=list)


@dataclass
class TargetCalibration:
    """Detected target geometry from ellipse fitting / multi-ring calibration."""
    center: Tuple[float, float]
    major_radius: float
    minor_radius: float
    rotation_deg: float
    eccentricity: float
    ring_radii: List[float] = field(default_factory=list)
    confidence: float = 0.0
    mm_per_pixel: float = 0.0
    card_corners_found: bool = False  # True when 4-corner warp succeeded


@dataclass
class HoleCandidate:
    """A single candidate bullet hole before fusion/filtering."""
    x: float
    y: float
    radius: float
    confidence: float
    method: str
    contrast_ratio: float = 0.0


@dataclass
class FusedHole:
    """A bullet hole after multi-method fusion."""
    x: float
    y: float
    radius: float
    confidence: float
    methods_agreed: int = 1
    method: str = "cv"  # "cv" | "yolo" | "fused"
