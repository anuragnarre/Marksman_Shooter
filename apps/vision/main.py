# apps/vision/main.py

from fastapi import FastAPI, File, Query, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from analyzer import analyze_target_image
from models import AnalysisResponse
from pipeline.target_specs import TargetType, TARGET_SPECS

app = FastAPI(
    title="Shooting Target Vision Service",
    description=(
        "Analyzes target photos and returns bullet hole positions with scores. "
        "Zone-aware detection pipeline: finds bright holes in black zone, "
        "dark holes in cream zone. ISSF decimal scoring."
    ),
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

SUPPORTED_TARGETS = {t.value: TARGET_SPECS[t].name for t in TargetType}


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "detector": "zone-aware-cv-v4",
        "version": "4.0.0",
        "supported_targets": SUPPORTED_TARGETS,
    }


@app.get("/targets")
def list_targets() -> List[dict]:
    result = []
    for tt, spec in TARGET_SPECS.items():
        result.append({
            "type": tt.value,
            "name": spec.name,
            "outer_diameter_mm": spec.outer_ring1_diameter_mm,
            "ring_width_mm": spec.ring_width_mm,
            "pellet_diameter_mm": spec.pellet_diameter_mm,
            "num_rings": spec.num_rings,
        })
    return result


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    target_type: str = Query(
        "air_rifle_10m",
        description="Target type",
    ),
    debug: bool = Query(False, description="Include annotated debug image"),
) -> AnalysisResponse:
    """Analyze a target photo and return detected bullet holes with scores."""
    allowed_types = {"image/jpeg", "image/png", "image/tiff", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. Accepted: JPEG, PNG, TIFF, BMP",
        )

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 20 MB size limit")

    try:
        result = analyze_target_image(image_bytes, target_type=target_type, debug=debug)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}") from exc

    return result
