# Marksman Ecosystem — Target Camera Hardware & Edge Deployment Guide

> **Document ID:** ENG-CAM-2026-V1  
> **Classification:** Edge Hardware Engineering & Installation Guide  
> **Target Audience:** Range Hardware Technicians, Range Operators, Systems Integrators  
> **Effective Date:** October 2026  

---

## 1. System Architecture Overview

The Marksman Target Camera subsystem provides automated, real-time bullet hole detection and scoring downrange:

```
┌─────────────────────────────────┐           ┌───────────────────────────────┐
│       DOWNRANGE TARGET LINE     │           │       FIRING LINE & SERVER    │
│                                 │           │                               │
│   ┌─────────────────────────┐   │  Wi-Fi/   │   ┌───────────────────────┐   │
│   │ [Physical Paper Target] │   │  LAN WS   │   │ Marksman Vision API   │   │
│   └────────────▲────────────┘   │ ─────────►│   │ (FastAPI / OpenCV /   │   │
│                │                │           │   │ YOLO Models on :8000) │   │
│   ┌────────────┴────────────┐   │           │   └───────────┬───────────┘   │
│   │   Target Camera Device  │   │           │               │ WebSocket     │
│   │ (Android Edge APK/Expo) │   │           │   ┌───────────▼───────────┐   │
│   │  Armored AR500 Enclosure│   │           │   │ Lane Display / Tablet │   │
│   └─────────────────────────┘   │           │   │ (Shooter App Web :3000)│  │
└─────────────────────────────────┘           └───────────────────────────────┘
```

1. **Edge Camera Unit:** Android mobile phone or dedicated camera module running the standalone release APK (`Target_Camera_App`).
2. **Vision Microservice:** Python FastAPI (`:8000`) utilizing OpenCV edge detection, contour analysis, and circular Hough transforms to identify bullet perforations.
3. **Telemetry & Gateway:** Real-time bi-directional WebSockets (`events.gateway.ts`) transmitting sub-second impact telemetry to athlete monitors.

---

## 2. Ballistic Armor Shielding & Physical Enclosure

Downrange equipment is subject to severe muzzle blast, projectile fragmentation, and potential stray bullet strikes. Proper physical fortification is mandatory:

### 2.1 Armor Plate Specifications
* **Frontal Deflector Plate:** Minimum **3/8-inch (9.5mm) AR500 Ballistic Armor Steel** rated to withstand direct impacts from centerfire handgun cartridges and fragment deflections.
* **Deflector Angle:** The armor face must be mounted at a **45-degree downward angle** to safely deflect errant bullet impacts into the range floor/berm, preventing bullet back-splatter toward the firing line.
* **Optical Aperture:** Cut a 35mm optical viewing slot in the armor plate protected by a replaceable **1/2-inch scratch-resistant Polycarbonate (Lexan) sacrificial lens**. Never expose camera optics directly without a sacrificial shield.

### 2.2 Stand-off Distances & Rig Placement
* **Ground Placement (Recommended for 10m–25m):** Position camera rig 3 to 4 feet forward and 1.5 feet below the target center, pointing upward at a calibrated angle.
* **Ceiling / Overhead Mount (Recommended for 50m–100m):** Suspend behind steel overhead baffles pointing downward at the target backer to eliminate floor-level debris interference.

---

## 3. Optical Setup & Illumination Requirements

To achieve consistent sub-millimeter bullet detection without false positives:

* **Illumination (Lux Levels):**
  - Ambient illumination at the target face must measure **1,000 to 1,500 lux**.
  - **Flicker-Free Direct Current (DC) LED Lighting:** AC-powered lighting with 50/60Hz ripple causes rolling-shutter banding artifacts on digital camera sensors. Use high-CRI, regulated DC constant-voltage LED floodlights.
* **Camera Focus & Exposure Lock:**
  - In the Target Camera App settings, disable auto-focus and continuous auto-exposure.
  - Set **Fixed Manual Focus** on the target face center ring.
  - Lock exposure time to **1/250s or faster** to prevent blur from ambient vibrations.

---

## 4. Local LAN & Standalone Network Architecture

Target Camera telemetry must function with absolute reliability, even during complete broadband internet outages:

* **Dedicated Range Wi-Fi SSID:**
  - Create an isolated 5GHz Wi-Fi network (e.g., `Marksman-Telemetry-5G`) dedicated solely to downrange cameras and firing line lane tablets.
  - Prohibit public customer smartphones on this SSID to guarantee zero packet collision and jitter.
* **Static IP / mDNS Assignment:**
  - Assign static IP reservations or local mDNS hostnames (`target-cam-lane01.local`, `target-cam-lane02.local`).
* **Zero-Cloud Resiliency:**
  - All scoring, frame processing, and lane synchronization execute entirely on the local range server. Internet access is only required for external cloud sync (e.g., global ELO leaderboards or remote athlete profile backups).

---

## 5. Target Homography & Calibration Procedure

Before a session begins, the camera must map its perspective angle to true Cartesian target coordinates:

1. **Target Framing:** Ensure all 4 outer corner registration marks of the target backer are visible within the camera frame viewfinder.
2. **Homography Calibration:**
   - Tap **"Calibrate Target"** in the Target Camera app.
   - The engine automatically detects the 4 corner alignment markers or prompts the technician to tap them manually.
   - The system computes a **3x3 Perspective Transform Matrix (Homography)** to flatten the angled perspective into a perpendicular, distortion-free 2D plane.
3. **Scale Factor Determination:**
   - The system calculates the exact pixel-to-millimeter ratio (e.g., `4.82 pixels = 1.0 mm`), enabling precise ISSF decimal ring scoring down to a fraction of a millimeter.

---

## 6. Daily Technician Checklist & Diagnostics

- [ ] Inspect sacrificial polycarbonate lens for carbon buildup or pitting; clean with optical microfiber and anti-static solution.
- [ ] Verify battery charging level or constant USB-C power delivery (minimum 5V/2.4A).
- [ ] Confirm camera device temperature is within operating limits (<45°C) inside the armor housing.
- [ ] Conduct test shot on calibration lane to verify sub-200ms latency on the Range Operator console.

---

## 7. High-Speed Wireless Video Optimization & Custom Stream Tuning SOP

### 7.1 Bandwidth Engineering Matrix
Video bitrate must match the physical transmission medium:

| Profile Preset | Resolution | Target FPS | Bitrate Cap | Jitter Buffer | Network Target | Recommended Deployment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTO_ADAPTIVE** | Dynamic 480p–1080p | 15–45 FPS | 900–3500 kbps | 60ms | Any Wi-Fi / LTE | **Default for all lanes**; auto-senses packet drops & throttles dynamically |
| **LAN_ULTRA_LOW_LAT** | 1080p (1920×1080) | 60 FPS | 6000 kbps | 0ms | Gigabit LAN / 5GHz Wi-Fi 6 | Olympic Finals, ISSF rapid fire, zero-latency downrange feedback |
| **BALANCED_WIRELESS** | 720p (1280×720) | 30 FPS | 2500 kbps | 50ms | Standard 5GHz Wi-Fi | Standard indoor range training bays with high visual fidelity |
| **BANDWIDTH_SAVER** | 480p (854×480) | 15 FPS | 800 kbps | 100ms | Constrained / ~5-6 Mbps links | Cellular hotspots, outdoor ranges, or multiple lanes on a ~5.9 Mbps link |
| **ECO_BATTERY** | 360p (640×360) | 10 FPS | 400 kbps | 150ms | Solar / Battery stand | Hot outdoor bays (>38°C) to prevent lithium battery thermal throttling |
| **CUSTOM** | User-configured | 10–60 FPS | 250–8000 kbps | 0–300ms | Custom | Operator fine-tuned for specialized industrial IP cameras / RTSP rigs |

### 7.2 Custom Operator & Athlete Stream Tuner Controls
Both the **Range Management RSO Console** (`/live-analysis` and `/lanes/config`) and the **Shooter Athlete App** (`/live-analysis`) feature an interactive **Stream Tuner Modal**:
1. **Resolution Override:** Select between 1080p, 720p, 480p, 360p, or custom width x height.
2. **Frame Rate Slider:** 10 to 60 FPS with immediate broadcast to camera hardware over WebSockets (`update_stream_config`).
3. **Drop-Late Concurrency Protection:** Camera hardware discards frames that cannot be processed immediately rather than buffering them, ensuring live video never accumulates latency or lags behind physical firing.
4. **Hardware Acceleration Backend:**
   - **WebGL 2.0 GPU Blit:** Renders video frames via GPU texture shaders with near-zero CPU consumption.
   - **OffscreenCanvas Worker:** Offloads frame unpacking from the main browser thread to eliminate UI stutter during rapid strings of fire.
5. **Sensor Thermal Safety Cutoff:** When ambient temperature inside the downrange steel armor box climbs above the configured threshold (default 42°C), the sensor automatically drops to 5 FPS and turns off auxiliary lighting to preserve hardware longevity.

