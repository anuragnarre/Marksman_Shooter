# apps/vision/main.py

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, File, Query, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from analyzer import analyze_target_image
from models import AnalysisResponse
from pipeline.target_specs import TargetType, TARGET_SPECS
from pipeline.yolo_detector import load_yolo_model, _yolo_available
from pipeline.mask_detector import load_mask_model, _mask_available

app = FastAPI(
    title="Shooting Target Vision Service",
    description=(
        "Analyzes target photos and returns bullet hole positions with scores. "
        "Pipeline v6: 4-corner warp, CLAHE enhancement, zone-aware CV detection "
        "augmented by YOLOv11-L (speed/accuracy) and Mask R-CNN (pixel precision)."
    ),
    version="6.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

SUPPORTED_TARGETS = {t.value: TARGET_SPECS[t].name for t in TargetType}


@app.on_event("startup")
async def startup() -> None:
    """Load neural models on startup. Silent no-op if model files absent."""
    load_yolo_model()
    load_mask_model()
    logger.info(
        "Vision service ready — yolo_loaded=%s mask_loaded=%s",
        _yolo_available,
        _mask_available,
    )


@app.get("/health")
def health() -> dict:
    from analyzer import MAX_INPUT_DIM, MAX_WORK_DIM
    return {
        "status": "ok",
        "detector": "cv-v6-yolo11-maskrcnn",
        "version": "6.1.0",
        "yolo_loaded": _yolo_available,
        "mask_loaded": _mask_available,
        "supported_targets": SUPPORTED_TARGETS,
        # These fields confirm the resize-fix code is loaded.
        # Old builds (<v6.1) will 500 or omit these fields.
        "max_input_dim": MAX_INPUT_DIM,
        "max_work_dim": MAX_WORK_DIM,
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
