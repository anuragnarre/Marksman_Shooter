"""
engine/vision_engine.py — Main Capture & Analysis Loop

Captures frames from a camera, sends them to the vision service for analysis,
deduplicates detected shots, and reports new shots to the Marksman API
via both HTTP and WebSocket.

This module is the core of the standalone range engine.
Run via: python start.py  (which calls VisionEngine.run())
"""

import asyncio
import base64
import logging
import time
from typing import Optional, List, Set, Tuple

import cv2
import httpx
import numpy as np

logger = logging.getLogger(__name__)


class Shot:
    """Detected shot record for deduplication."""
    def __init__(self, x: float, y: float, score: float, pixel_x: int, pixel_y: int):
        self.x = x          # mm from centre (ISSF coords)
        self.y = y
        self.score = score
        self.pixel_x = pixel_x
        self.pixel_y = pixel_y
        self.detected_at = time.time()

    def distance_to(self, other: "Shot") -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5


class VisionEngine:
    """
    Main engine: camera capture → vision API → dedup → notify.
    Instantiated by start.py with config loaded from config.yaml.
    """

    def __init__(self, config: dict):
        self.config = config
        self.engine_cfg   = config.get("engine", {})
        self.camera_cfg   = config.get("camera", {})
        self.target_cfg   = config.get("target", {})
        self.detection_cfg= config.get("detection", {})
        self.api_cfg      = config.get("api", {})
        self.vision_cfg   = config.get("vision_service", {})
        self.stream_cfg   = config.get("stream", {})

        self.range_id     = self.engine_cfg.get("range_id", "range-01")
        self.target_type  = self.target_cfg.get("type", "air_rifle_10m")
        self.camera_type  = self.camera_cfg.get("camera_type", "none")
        self.vision_url   = self.vision_cfg.get("url", "http://localhost:8000")
        self.api_url      = self.api_cfg.get("url", "http://localhost:3001")
        self.session_id   = self.api_cfg.get("session_id", "")

        self.dedup_radius = self.detection_cfg.get("dedup_radius_mm", 3.0)
        self.min_conf     = self.detection_cfg.get("min_shot_confidence", 0.4)
        self.post_pause   = self.detection_cfg.get("post_shot_pause_seconds", 1.5)
        self.analyse_every= self.detection_cfg.get("analyse_every_n_frames", 2)

        self._known_shots: List[Shot] = []
        self._cap: Optional[cv2.VideoCapture] = None
        self._baseline_bytes: Optional[bytes] = None
        self._ws_client = None
        self._last_shot_time = 0.0
        self._frame_count = 0
        self._running = False

    # ── Camera ────────────────────────────────────────────────────────────────

    def _open_camera(self) -> cv2.VideoCapture:
        source = self.camera_cfg.get("source", 0)
        # Convert to int if it's a digit string (e.g. "0")
        if isinstance(source, str) and source.isdigit():
            source = int(source)

        cap = cv2.VideoCapture(source)
        w = self.camera_cfg.get("width", 1280)
        h = self.camera_cfg.get("height", 720)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, w)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, h)
        cap.set(cv2.CAP_PROP_FPS, self.camera_cfg.get("fps", 10))

        if not cap.isOpened():
            raise RuntimeError(f"Cannot open camera source: {source}")

        logger.info("Camera opened: source=%s  %dx%d @ %dfps",
                    source, w, h, self.camera_cfg.get("fps", 10))
        return cap

    def _capture_baseline(self, cap: cv2.VideoCapture) -> None:
        """Capture a clean baseline (empty target) frame for temporal differencing."""
        delay = self.target_cfg.get("baseline_delay_seconds", 3)
        logger.info("Capturing baseline in %ds — ensure target is clear of shots...", delay)
        time.sleep(delay)

        for _ in range(5):   # grab a few frames to let camera auto-adjust
            cap.grab()

        ret, frame = cap.read()
        if not ret:
            logger.warning("Failed to capture baseline frame")
            return

        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if ok:
            self._baseline_bytes = buf.tobytes()
            logger.info("Baseline captured (%d bytes)", len(self._baseline_bytes))

    # ── Vision ────────────────────────────────────────────────────────────────

    def _encode_frame(self, frame: np.ndarray) -> bytes:
        ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if not ok:
            raise ValueError("Failed to encode frame as JPEG")
        return buf.tobytes()

    def _call_vision(self, frame_bytes: bytes) -> Optional[dict]:
        """Send a frame to the vision service /live-frame endpoint."""
        files: dict = {"file": ("frame.jpg", frame_bytes, "image/jpeg")}
        params = {
            "target_type": self.target_type,
            "camera_type": self.camera_type,
        }

        if self._baseline_bytes:
            files["baseline_file"] = ("baseline.jpg", self._baseline_bytes, "image/jpeg")

        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.post(
                    f"{self.vision_url}/live-frame",
                    files=files,
                    params=params,
                )
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException:
            logger.debug("Vision service timeout on frame")
        except Exception as exc:
            logger.warning("Vision API error: %s", exc)
        return None

    # ── Shot deduplication ────────────────────────────────────────────────────

    def _is_new_shot(self, x: float, y: float) -> bool:
        """Return True if this (x,y) position is not already a known shot."""
        for known in self._known_shots:
            dist = ((known.x - x) ** 2 + (known.y - y) ** 2) ** 0.5
            if dist < self.dedup_radius:
                return False
        return True

    def _register_shot(self, shot_data: dict) -> Shot:
        s = Shot(
            x=shot_data.get("x", 0.0),
            y=shot_data.get("y", 0.0),
            score=shot_data.get("score", 0.0),
            pixel_x=shot_data.get("pixel_x", 500),
            pixel_y=shot_data.get("pixel_y", 500),
        )
        self._known_shots.append(s)
        return s

    # ── Reporting ─────────────────────────────────────────────────────────────

    def _post_shot_to_api(self, shot: Shot) -> None:
        """POST new shot to the Marksman API (stores in DB, emits WS event)."""
        if not self.session_id:
            logger.debug("No session_id configured — shot not saved to DB")
            return

        payload = {
            "range_id": self.range_id,
            "session_id": self.session_id,
            "x": shot.x,
            "y": shot.y,
            "score": shot.score,
            "pixel_x": shot.pixel_x,
            "pixel_y": shot.pixel_y,
            "target_type": self.target_type,
        }

        headers = {}
        api_key = self.api_cfg.get("api_key", "")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            with httpx.Client(timeout=3.0) as client:
                client.post(
                    f"{self.api_url}/shots/live-frame",
                    json=payload,
                    headers=headers,
                )
        except Exception as exc:
            logger.warning("Failed to post shot to API: %s", exc)

    # ── Main Loop ─────────────────────────────────────────────────────────────

    def run(self) -> None:
        """
        Main synchronous run loop.
        Starts the MJPEG stream server in a background thread, then captures
        and analyses frames continuously.
        """
        import threading
        from stream import run_stream_server, update_frame, add_shot_overlay

        self._running = True

        # Start MJPEG stream server in background
        stream_cfg = self.stream_cfg
        if stream_cfg.get("enabled", True):
            t = threading.Thread(
                target=run_stream_server,
                kwargs={
                    "host": stream_cfg.get("host", "0.0.0.0"),
                    "port": stream_cfg.get("port", 8001),
                },
                daemon=True,
            )
            t.start()
            logger.info("MJPEG stream server thread started")

        # Open camera
        try:
            cap = self._open_camera()
        except RuntimeError as exc:
            logger.error("Camera error: %s", exc)
            return

        # Optionally capture baseline
        if self.target_cfg.get("capture_baseline_on_start", True):
            self._capture_baseline(cap)

        draw_shots = stream_cfg.get("draw_detections", True)

        logger.info("Engine running — target=%s  range=%s  dedup_r=%.1fmm",
                    self.target_type, self.range_id, self.dedup_radius)

        try:
            while self._running:
                ret, frame = cap.read()
                if not ret:
                    logger.warning("Camera read failed — retrying...")
                    time.sleep(0.5)
                    continue

                self._frame_count += 1

                # Push every frame to MJPEG stream
                update_frame(frame, draw_shots=draw_shots)

                # Throttle analysis
                if self._frame_count % self.analyse_every != 0:
                    continue

                # Post-shot pause
                if time.time() - self._last_shot_time < self.post_pause:
                    continue

                # Send to vision
                try:
                    frame_bytes = self._encode_frame(frame)
                except ValueError:
                    continue

                result = self._call_vision(frame_bytes)
                if result is None:
                    continue

                shots = result.get("shots", [])
                new_shots = []

                for s in shots:
                    if s.get("confidence", 0) < self.min_conf:
                        continue
                    if self._is_new_shot(s.get("x", 0), s.get("y", 0)):
                        shot = self._register_shot(s)
                        new_shots.append(shot)
                        add_shot_overlay(s)

                if new_shots:
                    self._last_shot_time = time.time()
                    for shot in new_shots:
                        logger.info("NEW SHOT: score=%.1f  x=%.1f  y=%.1f",
                                    shot.score, shot.x, shot.y)
                        self._post_shot_to_api(shot)

        except KeyboardInterrupt:
            logger.info("Engine stopped by user")
        finally:
            cap.release()
            self._running = False
            logger.info("Camera released. Total shots detected: %d", len(self._known_shots))

    def stop(self) -> None:
        self._running = False
