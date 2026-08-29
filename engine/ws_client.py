"""
engine/ws_client.py — WebSocket Client to Marksman API

Maintains a persistent Socket.io connection to the main NestJS API.
Joins the live_range:{range_id} room and emits shot_detected events
when the capture loop detects new bullet holes.

This allows the Marksman web app to receive real-time shot events
even when it cannot directly reach the vision engine.
"""

import asyncio
import json
import logging
import time
from typing import Optional, Callable

logger = logging.getLogger(__name__)


class ApiWsClient:
    """
    Thin wrapper around a websockets connection to the NestJS Socket.io server.

    Socket.io uses a specific framing protocol over WebSocket:
      - Connect handshake via HTTP polling first, then upgrade
      - We use the raw WS connection with the Socket.io packet format

    For simplicity we use python-socketio (async) which handles all this.
    """

    def __init__(
        self,
        ws_url: str,
        range_id: str,
        api_key: str = "",
        on_command: Optional[Callable] = None,
    ):
        self.ws_url = ws_url
        self.range_id = range_id
        self.api_key = api_key
        self.on_command = on_command    # callback for commands from the app
        self._sio = None
        self._connected = False
        self._reconnect_delay = 2.0

    async def connect(self) -> None:
        """Connect to the API Socket.io server and join the live range room."""
        try:
            import socketio
        except ImportError:
            raise ImportError(
                "python-socketio is required for WebSocket client. "
                "Install with: pip install 'python-socketio[asyncio_client]'"
            )

        self._sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=0,        # infinite retries
            reconnection_delay=2,
            reconnection_delay_max=30,
            logger=False,
            engineio_logger=False,
        )

        @self._sio.event
        async def connect():
            self._connected = True
            logger.info("Connected to API WebSocket — joining live_range:%s", self.range_id)
            await self._sio.emit("joinLiveRange", self.range_id)

        @self._sio.event
        async def disconnect():
            self._connected = False
            logger.warning("Disconnected from API WebSocket")

        @self._sio.event
        async def joinedLiveRange(data):
            logger.info("Joined live range room: %s", data)

        @self._sio.on("engine_command")
        async def on_engine_command(data):
            """Handle commands sent from the web app to the engine."""
            logger.info("Received engine command: %s", data)
            if self.on_command:
                await self.on_command(data)

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        while True:
            try:
                await self._sio.connect(self.ws_url, headers=headers)
                await self._sio.wait()
            except Exception as exc:
                logger.warning("WS connection failed: %s — retrying in %.1fs", exc, self._reconnect_delay)
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 1.5, 30.0)

    async def emit_shot(self, shot_payload: dict) -> None:
        """Emit a shot_detected event to all clients watching this range."""
        if not self._sio or not self._connected:
            logger.debug("WS not connected — shot event dropped")
            return
        try:
            await self._sio.emit("shot_detected_from_engine", {
                "range_id": self.range_id,
                "shots": shot_payload.get("shots", []),
                "target_type": shot_payload.get("target_type", "air_rifle_10m"),
                "processing_time_ms": shot_payload.get("processing_time_ms", 0),
                "timestamp": shot_payload.get("timestamp", time.time()),
            })
        except Exception as exc:
            logger.warning("Failed to emit shot event: %s", exc)

    async def disconnect(self) -> None:
        if self._sio:
            await self._sio.disconnect()
