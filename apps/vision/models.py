# apps/vision/models.py
from pydantic import BaseModel, Field
from typing import List, Optional


class ShotResult(BaseModel):
    """A single detected bullet hole mapped to target coordinates."""
    shot_number: int = Field(..., description="1-based shot index")
    score: float = Field(..., ge=0, le=10.9, description="ISSF decimal score (0.0–10.9)")
    x: float = Field(..., description="Target X coordinate (-10 to +10)")
    y: float = Field(..., description="Target Y coordinate (-10 to +10)")
    pixel_x: int = Field(..., description="Raw pixel X in original image")
    pixel_y: int = Field(..., description="Raw pixel Y in original image")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence (0–1)")
    is_inner_ten: bool = Field(False, description="True when shot is inside the X-ring (inner 10)")
    dist_mm: float = Field(0.0, description="Physical distance from target centre in mm")


class AnalysisResponse(BaseModel):
    """Full response returned by POST /analyze."""
    shots: List[ShotResult]
    target_detected: bool = Field(..., description="Whether the outer target ring was found")
    image_width: int
    image_height: int
    processing_time_ms: float
    debug_image: Optional[str] = Field(None, description="Base64-encoded annotated debug image (only when debug=true)")
    # Warp-space metadata — tells the frontend exactly which coordinate system
    # pixel_x/pixel_y live in so it can render shots at the correct position.
    warp_center_x: float = Field(500.0, description="Target centre X in warped image space")
    warp_center_y: float = Field(500.0, description="Target centre Y in warped image space")
    warp_width: int = Field(1000, description="Width of warped working image in pixels")
    warp_height: int = Field(1000, description="Height of warped working image in pixels")
    warp_mm_per_pixel: float = Field(0.17, description="mm per pixel in warped image space")
