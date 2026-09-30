"""
engine/stream.py — MJPEG Preview Stream Server

Runs on a configurable port (default 8001) alongside the main capture loop.
The Marksman web app subscribes via:
  <img src="http://<rangehost>:8001/mjpeg" />

Thread-safe: the capture loop writes frames to a shared buffer; this server
reads from it and streams as multipart/x-mixed-replace MJPEG.
"""

import io
import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Shared frame buffer ───────────────────────────────────────────────────────
_frame_lock = threading.Lock()
_latest_frame: Optional[bytes] = None     # JPEG-encoded bytes
_frame_event = threading.Event()

# ── Shot overlay state ─────────────────────────────────────────────────────────
_overlay_shots: list = []
_overlay_lock = threading.Lock()


def update_frame(frame_bgr: np.ndarray, draw_shots: bool = True, quality: int = 70) -> None:
    """
    Called by the capture loop to push a new frame into the stream buffer.
    Optionally draws detected shot circles as overlay.
    """
    global _latest_frame

    if draw_shots:
        with _overlay_lock:
            shots_copy = list(_overlay_shots)
        if shots_copy:
            frame_bgr = frame_bgr.copy()
            h, w = frame_bgr.shape[:2]
            for shot in shots_copy:
                # pixel_x/y are in 0-1000 warp space; scale to frame size
                px = int(shot.get("pixel_x", 500) * w / 1000)
                py = int(shot.get("pixel_y", 500) * h / 1000)
                score = shot.get("score", 0)

                # Colour by score ring
                if score >= 10.0:
                    color = (0, 215, 255)   # Gold (X/10)
                elif score >= 9.0:
                    color = (0, 229, 160)   # Emerald (9)
                else:
                    color = (77, 77, 255)   # Red (low)

                cv2.circle(frame_bgr, (px, py), 12, color, 2)
                cv2.putText(frame_bgr, f"{score:.1f}", (px + 14, py + 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    # Encode to JPEG
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    ok, buf = cv2.imencode(".jpg", frame_bgr, encode_params)
    if ok:
        with _frame_lock:
            _latest_frame = buf.tobytes()
        _frame_event.set()


def add_shot_overlay(shot: dict) -> None:
    """Add a detected shot to the MJPEG overlay."""
    with _overlay_lock:
        _overlay_shots.append(shot)
        if len(_overlay_shots) > 60:   # cap at 60 shots per session
            _overlay_shots.pop(0)


def clear_overlay() -> None:
    """Clear all shot overlays (call between sessions)."""
    with _overlay_lock:
        _overlay_shots.clear()


def generate_mjpeg():
    """Generator yielding MJPEG frames as multipart/x-mixed-replace parts."""
    boundary = b"--marksman_frame\r\n"
    while True:
        _frame_event.wait(timeout=2.0)
        _frame_event.clear()

        with _frame_lock:
            frame = _latest_frame

        if frame is None:
            # Send a blank placeholder while waiting for first frame
            blank = np.zeros((360, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "Waiting for camera...", (160, 180),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 100), 1)
            _, buf = cv2.imencode(".jpg", blank)
            frame = buf.tobytes()

        yield (
            boundary
            + b"Content-Type: image/jpeg\r\n"
            + f"Content-Length: {len(frame)}\r\n\r\n".encode()
            + frame
            + b"\r\n"
        )


def run_stream_server(host: str = "0.0.0.0", port: int = 8001) -> None:
    """
    Start the MJPEG HTTP server in the current thread.
    Call from a daemon thread to run alongside the capture loop.
    """
    from fastapi import FastAPI
    from fastapi.responses import StreamingResponse, HTMLResponse
    import uvicorn

    stream_app = FastAPI(title="Marksman MJPEG Stream")

    @stream_app.get("/mjpeg")
    def mjpeg():
        """Live MJPEG stream — embed as <img src='http://host:8001/mjpeg'>."""
        return StreamingResponse(
            generate_mjpeg(),
            media_type="multipart/x-mixed-replace; boundary=marksman_frame",
        )

    @stream_app.get("/snapshot")
    def snapshot():
        """Single JPEG snapshot of the current frame."""
        with _frame_lock:
            frame = _latest_frame
        if frame is None:
            return StreamingResponse(io.BytesIO(b""), media_type="image/jpeg")
        return StreamingResponse(io.BytesIO(frame), media_type="image/jpeg")

    @stream_app.get("/", response_class=HTMLResponse)
    def viewer():
        """Simple browser viewer for the live stream."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <title>Marksman Live Feed — Range Engine</title>
          <style>
            body {{ background: #080A0F; color: #F0F2F5; font-family: monospace; text-align: center; }}
            img {{ max-width: 100%; border: 1px solid rgba(245,166,35,0.3); border-radius: 8px; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <h2>Marksman Range Engine — Live Feed</h2>
          <p>Stream URL: <code>http://{host}:{port}/mjpeg</code></p>
          <img src="/mjpeg" alt="Live camera feed" />
        </body>
        </html>
        """

    logger.info("MJPEG stream server starting on http://%s:%d/mjpeg", host, port)
    uvicorn.run(stream_app, host=host, port=port, log_level="warning")
