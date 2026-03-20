# apps/vision/models.py
from pydantic import BaseModel, Field
from typing import List, Optional


class ShotResult(BaseModel):
    """A single detected bullet hole mapped to target coordinates."""
    shot_number: int = Field(..., description="1-based shot index")
    score: float = Field(..., ge=0, le=10.9, description="Score based on ring distance")
    x: float = Field(..., description="Target X coordinate (-10 to +10)")
    y: float = Field(..., description="Target Y coordinate (-10 to +10)")
    pixel_x: int = Field(..., description="Raw pixel X in original image")
    pixel_y: int = Field(..., description="Raw pixel Y in original image")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence (0–1)")


class AnalysisResponse(BaseModel):
    """Full response returned by POST /analyze."""
    shots: List[ShotResult]
    target_detected: bool = Field(..., description="Whether the outer target ring was found")
    image_width: int
    image_height: int
    processing_time_ms: float
    debug_image: Optional[str] = Field(None, description="Base64-encoded annotated debug image (only when debug=true)")
