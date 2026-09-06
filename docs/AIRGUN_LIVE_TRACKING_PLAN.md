# Airgun Live Session Tracking & Hardware Integration Plan

> **Focus:** Enhancing live tracking, analytics, and coaching capabilities specifically for ISSF and Airgun disciplines.

## 1. Weapon-Mounted Kinematic Sensors (IMU)
- **Concept:** Track the micro-movements of the rifle or pistol before, during, and immediately after the shot.
- **Hardware:** A lightweight BLE (Bluetooth Low Energy) sensor pod (e.g., incorporating an MPU6050 or similar 6-axis Gyro/Accelerometer) mounted on the air cylinder or accessory rail.
- **Implementation & Metrics:**
  - **Hold Stability:** Measures tremor frequency and amplitude during the final aiming phase.
  - **Trace Route / Aiming Path:** Plots the path the muzzle takes as it settles into the bullseye.
  - **Trigger Squeeze Disturbance:** Detects micro-jerks or snatching in the milliseconds before the shot breaks.
  - **Follow-through:** Quantifies muzzle movement immediately post-shot to ensure the shooter isn't dropping the gun too early.

## 2. Electronic Target Systems (EST) Direct Integration
- **Concept:** Direct data ingestion from professional electronic targets (like SIUS, Meyton, Megalink, or SCATT).
- **Hardware/Network:** Wi-Fi module or local network bridge connecting the target system's output to the mobile app or tablet.
- **Implementation & Metrics:**
  - Intercept or API-fetch the decimal hit coordinates (e.g., 10.4, 10.8) and exact timestamps in real-time.
  - Syncs the target's precise hit data with the mobile app's other sensor data (like heart rate or IMU trace).

## 3. Computer Vision / Camera-Based Target Reading
- **Concept:** For ranges using traditional paper targets, provide instant digital scoring.
- **Hardware:** An ESP32-CAM or a smartphone camera mounted on a spotting scope stand, focused directly on the paper target.
- **Implementation & Metrics:**
  - Real-time OpenCV edge detection and contour mapping to identify pellet holes.
  - Streams the calculated XY coordinates over WebSockets to the Marksman app, overlaying hits on a digital target canvas.

## 4. Smart Trigger Pressure Sensors
- **Concept:** Map the exact pressure applied to the trigger shoe to ensure a smooth, consistent squeeze.
- **Hardware:** A micro-pressure pad (Force-Sensitive Resistor / FSR) adhered to the trigger shoe, wired to the weapon-mounted BLE pod.
- **Implementation & Metrics:**
  - Graphs trigger pressure over time.
  - Highlights if the shooter "slapped" the trigger (sharp spike) rather than smoothly increasing pressure (gradual curve).

## 5. Biometric & Physiological Sync
- **Concept:** Correlate the shooter's physiological state with their shooting performance.
- **Hardware:** Bluetooth Heart Rate straps (Polar, Garmin) and respiratory expansion bands.
- **Implementation & Metrics:**
  - Syncs heart rate to the exact millisecond the shot breaks (e.g., Did they shoot between beats?).
  - Uses respiratory bands to track the breathing cycle, ensuring the shot breaks during the natural respiratory pause.

## 6. Acoustic Action Sensors for Split Timing
- **Concept:** Track timing and rhythm without needing complex visual systems, highly useful for rapid-fire air pistol.
- **Hardware:** A small piezo microphone or acoustic sensor attached to the stock or action.
- **Implementation & Metrics:**
  - Detects the mechanical "click" of a dry fire or the "pop" of the pneumatic air release.
  - Tracks exact split times between shots in rapid-fire series.
