# apps/vision/main.py

import asyncio
import base64
import logging
from typing import List, Optional

from fastapi import FastAPI, File, Query, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from analyzer import analyze_target_image
from models import AnalysisResponse
from pipeline.target_specs import TargetType, TARGET_SPECS
from pipeline.yolo_detector import load_yolo_model
from pipeline.mask_detector import load_mask_model
import pipeline.yolo_detector as _yolo_mod
import pipeline.mask_detector as _mask_mod

app = FastAPI(
    title="Marksman Vision Engine",
    description=(
        "Analyzes target photos and live video frames, returning bullet hole positions "
        "with ISSF decimal scores. Supports all ISSF, NRA, Field Target, and Indian NR specs. "
        "Pipeline v5: 4-corner warp, CLAHE, zone-aware CV detection augmented by YOLO26-S "
        "(when model loaded) with SAHI for 50m targets. "
        "Includes live-frame HTTP endpoint and WebSocket streaming for range hardware."
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

# ── Active WebSocket connections (live range streaming) ──────────────────────
_ws_clients: List[WebSocket] = []


@app.on_event("startup")
async def startup() -> None:
    """Load neural models on startup. Warns loudly if neither is available."""
    load_yolo_model()
    load_mask_model()
    if not _yolo_mod._yolo_available:
        logger.warning(
            "No YOLO model loaded. Running Compatibility Engine with OpenCV. "
            "Accuracy on real images may be reduced. "
            "Train a model with: python scripts/train_yolo26s.py --real-images <path>"
        )
    if not _yolo_mod._yolo_available and not _mask_mod._mask_available:
        import warnings
        warnings.warn(
            "WARNING: No neural models loaded. Running Compatibility Engine with OpenCV. "
            "Accuracy will be significantly reduced for tight shot groups. "
            "Run: python scripts/train_yolo26s.py --export to generate models.",
            stacklevel=2,
        )
    logger.info(
        "Vision service ready — yolo=%s mask=%s",
        _yolo_mod._yolo_available, _mask_mod._mask_available,
    )


# ── Health & Discovery ────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    neural_loaded = _yolo_mod._yolo_available or _mask_mod._mask_available
    return {
        "status": "ok",
        "detector": "cv-v6-yolo-augmented",
        "version": "6.0.0",
        "yolo_loaded": _yolo_mod._yolo_available,
        "mask_loaded": _mask_mod._mask_available,
        "neural_models_loaded": neural_loaded,
        "accuracy_mode": "YOLO for Most Accuracy" if neural_loaded else "Compatibility Engine with OpenCV",
        "supported_targets": SUPPORTED_TARGETS,
        "live_endpoints": {
            "http_frame": "POST /live-frame",
            "websocket":  "WS  /ws",
            "mjpeg":      "GET /mjpeg (if stream server running on :8001)",
        },
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


# ── Static Image Analysis ─────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    file: UploadFile = File(...),
    baseline_file: Optional[UploadFile] = File(None, description="Empty target baseline for temporal differencing"),
    target_type: str = Query(
        "air_rifle_10m",
        description="Target type",
    ),
    camera_type: str = Query(
        "esp32",
        description="Camera type for lens distortion correction (esp32, android, or none)",
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

    baseline_bytes = None
    if baseline_file:
        if baseline_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported baseline media type '{baseline_file.content_type}'",
            )
        baseline_bytes = await baseline_file.read()

    try:
        result = analyze_target_image(
            image_bytes,
            target_type=target_type,
            debug=debug,
            baseline_bytes=baseline_bytes,
            camera_type=camera_type
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}") from exc

    return result


# ── Live Frame Analysis (HTTP) ────────────────────────────────────────────────

@app.post("/live-frame", response_model=AnalysisResponse)
async def live_frame(
    file: UploadFile = File(..., description="Single JPEG/PNG video frame"),
    target_type: str = Query("air_rifle_10m"),
    camera_type: str = Query("none", description="esp32 | android | none"),
    baseline_file: Optional[UploadFile] = File(None),
    debug: bool = Query(False),
) -> AnalysisResponse:
    """
    High-throughput single-frame analysis for live video feeds.

    Identical to /analyze but optimized for lower latency:
    - YOLO is disabled (forces CV-only) for consistent <200 ms at 1080p
    - Suitable for 5–15 FPS continuous capture loops from range hardware

    The engine (engine/vision_engine.py) calls this endpoint on each frame
    and posts shot events to the main API when new holes are detected.
    """
    allowed_types = {"image/jpeg", "image/png", "image/bmp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported media type '{file.content_type}'")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Frame exceeds 10 MB")

    baseline_bytes = None
    if baseline_file:
        baseline_bytes = await baseline_file.read()

    try:
        # Temporarily suppress YOLO to keep latency low for video frames.
        # The CV pipeline is accurate enough for temporal differencing mode.
        import pipeline.yolo_detector as _yd
        orig_flag = _yd._yolo_available
        _yd._yolo_available = False
        try:
            result = analyze_target_image(
                image_bytes,
                target_type=target_type,
                debug=debug,
                baseline_bytes=baseline_bytes,
                camera_type=camera_type,
            )
        finally:
            _yd._yolo_available = orig_flag
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Live frame analysis failed: {str(exc)}") from exc

    # Broadcast to all connected WebSocket clients (live range dashboards)
    if result.shots and _ws_clients:
        import json
        payload = json.dumps({
            "event": "shot_detected",
            "shots": [s.model_dump() for s in result.shots],
            "target_type": target_type,
        })
        dead = []
        for ws in list(_ws_clients):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            _ws_clients.remove(ws)

    return result


# ── WebSocket Streaming ───────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for live range streaming.

    Protocol:
      Client → Server: binary JPEG frame bytes
      Server → Client: JSON { event, shots[], target_type, processing_time_ms }

    The client sets target_type via query param: ws://host:8000/ws?target_type=air_rifle_10m

    Used by:
      - engine/ws_client.py (range hardware sending frames)
      - apps/web (browser receiving shot events)
    """
    await websocket.accept()
    _ws_clients.append(websocket)

    target_type = websocket.query_params.get("target_type", "air_rifle_10m")
    camera_type = websocket.query_params.get("camera_type", "none")

    logger.info("WS client connected — target=%s camera=%s total_clients=%d",
                target_type, camera_type, len(_ws_clients))

    try:
        while True:
            # Receive binary frame from hardware client
            data = await websocket.receive()

            if "bytes" in data and data["bytes"]:
                frame_bytes = data["bytes"]
            elif "text" in data and data["text"]:
                # Allow base64-encoded frames from browser clients
                try:
                    import json as _json
                    msg = _json.loads(data["text"])
                    if msg.get("type") == "frame" and msg.get("data"):
                        frame_bytes = base64.b64decode(msg["data"])
                    elif msg.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                        continue
                    else:
                        continue
                except Exception:
                    continue
            else:
                continue

            # Analyze the frame (CV-only for speed)
            try:
                import pipeline.yolo_detector as _yd
                orig = _yd._yolo_available
                _yd._yolo_available = False
                try:
                    result = analyze_target_image(
                        frame_bytes,
                        target_type=target_type,
                        debug=False,
                        camera_type=camera_type,
                    )
                finally:
                    _yd._yolo_available = orig

                if result.shots:
                    await websocket.send_json({
                        "event": "shot_detected",
                        "shots": [s.model_dump() for s in result.shots],
                        "target_type": target_type,
                        "processing_time_ms": result.processing_time_ms,
                        "target_detected": result.target_detected,
                    })
                else:
                    # Send heartbeat so client knows the frame was processed
                    await websocket.send_json({
                        "event": "frame_processed",
                        "shots": [],
                        "processing_time_ms": result.processing_time_ms,
                        "target_detected": result.target_detected,
                    })

            except Exception as exc:
                logger.warning("WS frame analysis error: %s", exc)
                await websocket.send_json({"event": "error", "detail": str(exc)})

    except WebSocketDisconnect:
        logger.info("WS client disconnected")
    finally:
        if websocket in _ws_clients:
            _ws_clients.remove(websocket)
