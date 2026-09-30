# Real Firearm Live Session Tracking & Hardware Integration Plan

> **STATUS: ON HOLD**
> *This plan is saved for future reference. There are currently no plans to implement these features as the current focus is strictly on airgun ranges.*

## 1. Recoil & Cycle Dynamics (Heavy-Duty IMU)
- **Concept:** Track the violent recoil impulse and the shooter's ability to control the weapon and return it to zero.
- **Hardware:** High-G rated weapon-mounted accelerometer and gyroscope (BLE enabled), designed to withstand live fire.
- **Implementation & Metrics:**
  - **Muzzle Rise:** Measures maximum vertical displacement during recoil.
  - **Return to Zero (RTZ):** Calculates the time taken to bring the sights back onto the target plane.
  - **Split Times:** Derives highly accurate shot-to-shot timing based on recoil spikes.

## 2. Bluetooth Shot Timer Integration
- **Concept:** Seamlessly ingest timing data for dynamic shooting sports (IPSC, USPSA, IDPA, 3-Gun).
- **Hardware:** Integration with existing smart Bluetooth shot timers (e.g., Kestrel KST1000, AMG Commander, Shooters Global).
- **Implementation & Metrics:**
  - App listens for BLE broadcasts from the timer.
  - Automatically logs draw times (first shot), split times, and transition times between arrays without requiring manual data entry.

## 3. Doppler Radar / Chronograph Integration
- **Concept:** Log the exact muzzle velocity of every single shot fired in a string.
- **Hardware:** Personal radar units (Garmin Xero C1 Pro, LabRadar) with Bluetooth output.
- **Implementation & Metrics:**
  - Velocity data is automatically paired with the shot number on the target.
  - Helps diagnose vertical stringing issues (e.g., determining if a low hit was due to shooter error or a slow round).

## 4. Smart Steel Targets (Acoustic / Impact)
- **Concept:** Instant digital hit/miss logging for steel target shooting.
- **Hardware:** Impact sensors (piezoelectric) bolted to the back of AR500 steel plates, transmitting via LoRa or long-range RF to a receiver at the firing line.
- **Implementation & Metrics:**
  - Generates a digital "ding" on the app and logs the hit with a timestamp relative to the shot timer's beep.

## 5. Smart Optics & Rangefinder Sync
- **Concept:** For precision rifle (PRS) and long-range shooting analytics.
- **Hardware:** Bluetooth-enabled scopes (e.g., Sig Sauer BDX, ATN) and Laser Rangefinders.
- **Implementation & Metrics:**
  - Logs the exact distance ranged by the shooter.
  - Logs the holdover/dialing solution applied to the optic for that specific shot, allowing coaches to verify if the shooter dialed correctly for the distance and wind.

## 6. Environmental & Ballistic Weather Sync
- **Concept:** Log exact atmospheric conditions for long-range data books.
- **Hardware:** Kestrel Weather Meters (BLE).
- **Implementation & Metrics:**
  - Logs Density Altitude (DA), wind speed, wind direction, temperature, and barometric pressure at the exact time of the firing string.
  - Links environmental data to ballistic performance over time.
