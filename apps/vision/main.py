# apps/vision/main.py

from fastapi import FastAPI, File, Query, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from analyzer import analyze_target_image
from models import AnalysisResponse
import pose_analyzer

app = FastAPI(
    title="Shooting Target Vision Service",
    description=(
        "Analyzes target photos and returns bullet hole positions with scores. "
        "Uses a multi-stage local CV pipeline with synthetic template matching, "
        "perspective correction, difference imaging, and fused hole detection."
    ),
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to API server origin in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Health check — reports active detector pipeline."""
    return {
        "status": "ok",
        "detector": "local-cv-pipeline",
        "version": "3.0.0",
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    target_type: str = Query("air_rifle_10m", description="ISSF target type"),
    debug: bool = Query(False, description="Include annotated debug image"),
) -> AnalysisResponse:
    """
    Analyze a target photo and return detected bullet holes.

    - Accepts JPEG, PNG, TIFF, or BMP images (max 20 MB)
    - Multi-stage local CV pipeline (no cloud dependencies)
    - Returns scored shot positions in target coordinate space (-10 to +10)
    - Optional debug=true returns annotated image as base64
    """
    allowed_types = {"image/jpeg", "image/png", "image/tiff", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported media type '{file.content_type}'. "
                "Accepted: JPEG, PNG, TIFF, BMP"
            ),
        )

    image_bytes = await file.read()

    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 20 MB size limit")

    try:
        result = analyze_target_image(
            image_bytes,
            target_type=target_type,
            debug=debug,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Analysis failed: {str(exc)}"
        ) from exc

    return result


@app.post("/pose")
async def analyze_pose_endpoint(file: UploadFile = File(...)) -> dict:
    """
    Analyze shooting stance from an uploaded photo using MediaPipe Pose.

    Returns posture score, key joint angles, detected issues, and 33 landmark
    keypoints for skeleton overlay rendering.
    """
    allowed_types = {"image/jpeg", "image/png", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Accepted: JPEG, PNG, BMP",
        )

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 20 MB size limit")

    try:
        result = pose_analyzer.analyze_pose(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pose analysis failed: {str(exc)}") from exc

    return result
