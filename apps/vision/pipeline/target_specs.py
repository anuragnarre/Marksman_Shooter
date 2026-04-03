"""ISSF and Indian-standard target dimension specifications."""

from dataclasses import dataclass
from enum import Enum
from typing import Dict

import cv2
import numpy as np


@dataclass(frozen=True)
class TargetSpec:
    """Physical dimensions of a target type."""
    name: str
    outer_ring1_diameter_mm: float  # Diameter of outermost ring (ring 1)
    ring_width_mm: float            # Width of each scoring ring
    pellet_diameter_mm: float       # Projectile diameter (outer edge scores)
    num_rings: int = 10
    inner_ten_diameter_mm: float = 0.5  # Inner ten (X ring) diameter
    dark_center_rings: int = 5      # Number of rings in the dark (black) zone

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
        return float(self.num_rings) + 0.9

    def render_template(self, radius_pixels: int) -> np.ndarray:
        """Render a clean grayscale ISSF target at the specified outer-ring pixel radius."""
        size = 2 * radius_pixels + 1
        img = np.full((size, size), 255, dtype=np.uint8)
        center = (radius_pixels, radius_pixels)
        mm_per_px = self.outer_radius_mm / radius_pixels

        inner_zone_radius_mm = self.ring_width_mm * self.dark_center_rings
        inner_zone_px = int(inner_zone_radius_mm / mm_per_px)
        cv2.circle(img, center, inner_zone_px, 0, -1)

        inner_ten_px = max(1, int((self.inner_ten_diameter_mm / 2.0) / mm_per_px))
        cv2.circle(img, center, inner_ten_px, 0, -1)

        ring_line_width = max(1, int(0.3 / mm_per_px))
        for ring_num in range(1, self.num_rings + 1):
            r_mm = self.ring_radius_mm(ring_num)
            r_px = int(r_mm / mm_per_px)
            if r_px < 1:
                continue
            color = 255 if r_px < inner_zone_px else 0
            cv2.circle(img, center, r_px, color, ring_line_width)

        cv2.circle(img, center, radius_pixels, 0, max(1, int(0.5 / mm_per_px)))

        line_thickness = max(1, int(0.2 / mm_per_px))
        cv2.line(img, (0, radius_pixels), (size - 1, radius_pixels), 128, line_thickness)
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
    # Indian standard targets
    NR_50M = "nr_50m"           # 50m Rifle (NR pattern)
    NR_25M_PISTOL = "nr_25m"   # 25m Pistol


TARGET_SPECS: Dict[TargetType, TargetSpec] = {
    TargetType.AIR_RIFLE_10M: TargetSpec(
        name="10m Air Rifle",
        outer_ring1_diameter_mm=45.5,
        ring_width_mm=2.5,
        pellet_diameter_mm=4.5,
        inner_ten_diameter_mm=0.5,
        dark_center_rings=5,
    ),
    TargetType.AIR_PISTOL_10M: TargetSpec(
        name="10m Air Pistol",
        outer_ring1_diameter_mm=170.0,
        ring_width_mm=8.0,
        pellet_diameter_mm=4.5,
        inner_ten_diameter_mm=5.0,
        dark_center_rings=4,
    ),
    TargetType.NR_50M: TargetSpec(
        name="50m Rifle",
        outer_ring1_diameter_mm=154.4,
        ring_width_mm=8.0,
        pellet_diameter_mm=5.6,
        inner_ten_diameter_mm=5.0,
        dark_center_rings=5,
    ),
    TargetType.NR_25M_PISTOL: TargetSpec(
        name="25m Pistol",
        outer_ring1_diameter_mm=500.0,
        ring_width_mm=25.0,
        pellet_diameter_mm=9.65,
        inner_ten_diameter_mm=50.0,   # 10-ring outer diameter: outer_radius(250) - 9×ring_width(25) = 25mm radius = 50mm diameter
        dark_center_rings=4,
    ),
}


def get_spec(target_type: str) -> TargetSpec:
    """Look up target spec by string key, defaulting to air rifle."""
    try:
        return TARGET_SPECS[TargetType(target_type)]
    except (ValueError, KeyError):
        return TARGET_SPECS[TargetType.AIR_RIFLE_10M]
