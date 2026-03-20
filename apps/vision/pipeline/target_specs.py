"""ISSF target dimension specifications and synthetic template rendering."""

from dataclasses import dataclass
from enum import Enum
from typing import Dict

import cv2
import numpy as np


@dataclass(frozen=True)
class TargetSpec:
    """Physical dimensions of an ISSF target type."""
    name: str
    outer_ring1_diameter_mm: float  # Diameter of outermost ring (ring 1)
    ring_width_mm: float            # Width of each scoring ring
    pellet_diameter_mm: float       # Projectile diameter (outer edge scores)
    num_rings: int = 10
    inner_ten_diameter_mm: float = 0.5  # Inner ten (X ring) diameter

    @property
    def outer_radius_mm(self) -> float:
        return self.outer_ring1_diameter_mm / 2.0

    def ring_radius_mm(self, ring_number: int) -> float:
        """Radius of the outer edge of given ring number (1=outermost, 10=innermost)."""
        if ring_number < 1 or ring_number > self.num_rings:
            raise ValueError(f"Ring number must be 1-{self.num_rings}")
        rings_from_center = ring_number - 1
        return self.outer_radius_mm - rings_from_center * self.ring_width_mm

    def max_score(self) -> float:
        """Maximum decimal score (center hit)."""
        return float(self.num_rings) + 0.9

    def render_template(self, radius_pixels: int) -> np.ndarray:
        """
        Render a clean grayscale ISSF target at the specified outer-ring pixel radius.

        Returns a grayscale uint8 image (2*radius_pixels+1 square) with:
        - Alternating black/white rings matching ISSF ring width ratios
        - Black bullseye center
        - Cardinal axis scoring lines
        - Ring numbers at approximate positions
        """
        size = 2 * radius_pixels + 1
        img = np.full((size, size), 255, dtype=np.uint8)
        center = (radius_pixels, radius_pixels)
        mm_per_px = self.outer_radius_mm / radius_pixels

        # Draw rings from outside in. ISSF: rings 1-4 are black on white,
        # rings 5-10 are white on black (inner zone). The boundary lines
        # are always present.
        # For template matching we draw the ring *boundaries* as lines
        # and fill zones with the correct shade.

        # Fill inner zone (rings 7-10 on rifle, but simplify: center half is black)
        inner_zone_radius_mm = self.ring_width_mm * (self.num_rings // 2)
        inner_zone_px = int(inner_zone_radius_mm / mm_per_px)
        cv2.circle(img, center, inner_zone_px, 0, -1)

        # Bullseye (inner ten)
        inner_ten_px = max(1, int((self.inner_ten_diameter_mm / 2.0) / mm_per_px))
        cv2.circle(img, center, inner_ten_px, 0, -1)

        # Draw ring boundary lines
        ring_line_width = max(1, int(0.3 / mm_per_px))  # ~0.3mm line width
        for ring_num in range(1, self.num_rings + 1):
            r_mm = self.ring_radius_mm(ring_num)
            r_px = int(r_mm / mm_per_px)
            if r_px < 1:
                continue
            # Ring boundaries in the white zone are black, in the black zone are white
            color = 255 if r_px < inner_zone_px else 0
            cv2.circle(img, center, r_px, color, ring_line_width)

        # Outer boundary
        cv2.circle(img, center, radius_pixels, 0, max(1, int(0.5 / mm_per_px)))

        # Cardinal axis scoring lines (thin lines through center)
        line_thickness = max(1, int(0.2 / mm_per_px))
        # Horizontal
        cv2.line(img, (0, radius_pixels), (size - 1, radius_pixels), 128, line_thickness)
        # Vertical
        cv2.line(img, (radius_pixels, 0), (radius_pixels, size - 1), 128, line_thickness)

        # Ring numbers (small text near each ring boundary on the right side)
        font_scale = max(0.25, radius_pixels / 600.0)
        font_thickness = max(1, int(radius_pixels / 400))
        for ring_num in range(1, self.num_rings + 1):
            r_mm = self.ring_radius_mm(ring_num)
            r_px = int(r_mm / mm_per_px)
            text_x = center[0] + r_px + 2
            text_y = center[1] + int(font_scale * 10)
            if text_x < size - 20:
                color = 255 if r_px < inner_zone_px else 0
                cv2.putText(
                    img, str(ring_num),
                    (text_x, text_y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, color, font_thickness,
                )

        return img


class TargetType(str, Enum):
    AIR_RIFLE_10M = "air_rifle_10m"
    AIR_PISTOL_10M = "air_pistol_10m"


TARGET_SPECS: Dict[TargetType, TargetSpec] = {
    TargetType.AIR_RIFLE_10M: TargetSpec(
        name="10m Air Rifle",
        outer_ring1_diameter_mm=45.5,
        ring_width_mm=2.5,
        pellet_diameter_mm=4.5,
        inner_ten_diameter_mm=0.5,
    ),
    TargetType.AIR_PISTOL_10M: TargetSpec(
        name="10m Air Pistol",
        outer_ring1_diameter_mm=170.0,
        ring_width_mm=8.0,
        pellet_diameter_mm=4.5,
        inner_ten_diameter_mm=5.0,
    ),
}


def get_spec(target_type: str) -> TargetSpec:
    """Look up target spec by string key, defaulting to air rifle."""
    try:
        return TARGET_SPECS[TargetType(target_type)]
    except (ValueError, KeyError):
        return TARGET_SPECS[TargetType.AIR_RIFLE_10M]
