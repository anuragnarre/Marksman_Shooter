# apps/vision/main.py

import logging

from fastapi import FastAPI, File, Query, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

logger = logging.getLogger(__name__)

from analyzer import analyze_target_image
from models import AnalysisResponse
from pipeline.target_specs import TargetType, TARGET_SPECS
from pipeline.yolo_detector import load_yolo_model
from pipeline.mask_detector import load_mask_model
import pipeline.yolo_detector as _yolo_mod
import pipeline.mask_detector as _mask_mod

app = FastAPI(
    title="Shooting Target Vision Service",
    description=(
        "Analyzes target photos and returns bullet hole positions with scores. "
        "Pipeline v5: 4-corner warp, CLAHE enhancement, zone-aware CV detection "
        "augmented by YOLO26-S (when model loaded) with SAHI for 50m targets."
    ),
    version="5.0.0",
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
    """Load neural models on startup. Warns loudly if neither is available."""
    load_yolo_model()
    load_mask_model()
    if not _yolo_mod._yolo_available:
        logger.warning(
            "No YOLO model loaded. Running CV-only mode. "
            "Accuracy on real images may be reduced. "
            "Train a model with: python scripts/train_yolo26s.py --real-images <path>"
        )
    if not _yolo_mod._yolo_available and not _mask_mod._mask_available:
        import warnings
        warnings.warn(
            "WARNING: No neural models loaded. Running CV-only mode. "
            "Accuracy will be significantly reduced for tight shot groups. "
            "Run: python scripts/train_yolo26s.py --export to generate models.",
            stacklevel=2,
        )
    logger.info(
        "Vision service ready — yolo=%s mask=%s",
        _yolo_mod._yolo_available, _mask_mod._mask_available,
    )


@app.get("/health")
def health() -> dict:
    neural_loaded = _yolo_mod._yolo_available or _mask_mod._mask_available
    return {
        "status": "ok",
        "detector": "cv-v5-yolo-augmented",
        "version": "5.0.0",
        "yolo_loaded": _yolo_mod._yolo_available,
        "mask_loaded": _mask_mod._mask_available,
        "neural_models_loaded": neural_loaded,
        "accuracy_mode": "full" if neural_loaded else "cv_only_reduced_accuracy",
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
