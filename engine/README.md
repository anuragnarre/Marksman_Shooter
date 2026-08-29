# Marksman Range Engine

Standalone computer vision engine that runs on **range hardware** (Raspberry Pi, laptop, dedicated PC) and streams live shot detection results to the Marksman web app.

---

## Architecture

```
Camera (USB/ESP32-CAM/RTSP)
    ↓ frames
engine/vision_engine.py
    ↓ HTTP POST /live-frame
apps/vision/ (FastAPI, port 8000)
    ↓ shot results
engine/vision_engine.py
    ↓ HTTP POST /shots/live-frame
apps/api/ (NestJS, port 3001)
    ↓ WebSocket emit shot_detected
apps/web/ (Next.js)  ← live session page shows shots in real-time
    +
engine/stream.py
    ↓ MJPEG stream
http://rangehost:8001/mjpeg  ← web app embeds this as <img>
```

---

## Quick Start

### 1. Prerequisites

```bash
# Python 3.9+
python --version

# Install dependencies
pip install -r engine/requirements.txt
```

### 2. Configure

```bash
# Copy and edit config
cp engine/config.yaml engine/my-range.yaml
# Edit: camera source, target type, range_id, api_url
```

### 3. Start the vision service (on the same machine)

```bash
cd apps/vision
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4. Run the engine

```bash
cd engine
python start.py                           # uses config.yaml
python start.py --config my-range.yaml    # custom config
python start.py --target air_rifle_10m --camera 0  # CLI overrides
python start.py --check                   # health check only
```

---

## Camera Sources

| Source | `camera.source` value | Notes |
|--------|-----------------------|-------|
| USB webcam 1 | `0` | Default |
| USB webcam 2 | `1` | |
| Linux device | `/dev/video0` | |
| ESP32-CAM | `http://192.168.1.100/video` | MJPEG HTTP stream |
| IP camera | `rtsp://user:pass@192.168.1.x/stream` | RTSP |

---

## Supported Target Types

| Type ID | Description |
|---------|-------------|
| `air_rifle_10m` | 10m Air Rifle (ISSF) |
| `air_pistol_10m` | 10m Air Pistol (ISSF) |
| `air_rifle_50m` | 50m Air Rifle Olympic (ISSF) |
| `nr_50m` | 50m Rifle (Indian NR Pattern) |
| `nr_25m` | 25m Pistol (Indian NR Pattern) |
| `issf_300m_rifle` | 300m Rifle (ISSF Full-Bore) |
| `nra_b8_25yd` | NRA B-8 25-Yard Pistol |
| `airgun_multi_bull` | 10m Multi-Bull Indoor Airgun |
| `field_target_ft` | Field Target / HFT Silhouette |

---

## Web App Integration

The engine streams to two endpoints in the Marksman web app:

1. **MJPEG Preview** — embedded as `<img src="http://rangehost:8001/mjpeg">` in the Live Session page
2. **WebSocket shots** — via `POST /shots/live-frame` to the NestJS API, which emits `shot_detected` to all connected browsers

### Live Session Page
Navigate to **Sessions → Live Session** in the web app, set your Range ID to match `engine.range_id` in `config.yaml`, and click **Start Live Session**.

---

## Hardware Notes

### Raspberry Pi 4 / 5
- Plug in USB webcam or connect Pi Camera Module
- Run the vision service + engine on the Pi itself
- Access MJPEG preview from web app on any device on the same network
- CV-only mode (no YOLO) runs well at 5 FPS on Pi 4

### ESP32-CAM
- Flash the ESP32 with its MJPEG firmware
- Set `camera.source` to the ESP32 MJPEG URL
- The engine runs on a PC/Pi and polls the ESP32 stream

### Dedicated Windows PC
- Use OBS Virtual Camera or any USB webcam as source `0`
- The full YOLO+CV pipeline runs well at 10+ FPS on a modern CPU

---

## Environment Variables (optional)

Set in `apps/api/.env` to enable engine API key auth:

```
ENGINE_API_KEY=your-secret-key-here
```

Then set `api.api_key` in `engine/config.yaml` to the same value.

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Camera not opening | Check `camera.source` value; try `0`, `1`, or device path |
| Vision service timeout | Ensure `uvicorn main:app --port 8000` is running |
| Shots not appearing in web | Check `engine.range_id` matches the Range ID in the Live Session page |
| High CPU on Pi | Increase `analyse_every_n_frames` (e.g. `5`) to reduce analysis rate |
| Double-counting shots | Increase `dedup_radius_mm` (e.g. `5.0`) |
