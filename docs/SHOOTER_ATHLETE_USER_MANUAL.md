# Marksman Ecosystem — Athlete & Shooter User Manual

> **Document ID:** MAN-SHT-2026-V1  
> **Classification:** Official End-User Operating Manual  
> **Target Audience:** Shooters, Competitive Athletes, Precision Marksmen, Coaches  
> **Effective Date:** October 2026  

---

## 1. Getting Started & Account Setup

Welcome to the Marksman Platform, the premier precision marksmanship and AI-driven performance coaching ecosystem.

### 1.1 Creating Your Account & Authentication
* Navigate to **[http://localhost:3000](http://localhost:3000)** on your mobile browser, desktop, or native mobile app.
* Sign in instantly using **Google One-Tap Authentication** or standard email/password registration.
* To protect your shooting telemetry and armory serial numbers, maintain strong authentication credentials.

### 1.2 Athlete Profile & Firearm Licenses (`/shooter/profile`)
To unlock competitive matchmaking and certified lane reservations, complete your athlete profile:
* **Discipline Selection:** Select your primary sports (e.g., 10m Air Rifle, 25m Rapid Fire Pistol, 50m 3-Position, PRS / Precision Rifle Series, IPSC / USPSA).
* **Firearms License & Permit Vault:** Upload and track permit numbers, issuing jurisdictions, and expiry dates. The platform alerts you 60 days prior to license renewal.
* **Profile Completeness Indicator:** Complete your profile (bio, club affiliation, equipment inventory) to reach 100% verified athlete status.

---

## 2. Facility Access & Digital Membership Card

### 2.1 Accessing Your Digital Card (`/shooter/membership`)
* From the main navigation menu, select **"My Membership"**.
* Your digital card features a high-security metallic glassmorphism design displaying:
  - Member Full Name and Unique Athlete ID.
  - Current Membership Tier (Silver, Gold, or Elite VIP).
  - Expiry Date & Active Status.
  - **Dynamic Turnstile QR Code:** A time-sensitive, cryptographically signed QR code used for automated gate turnstile check-ins at partnered shooting ranges.

### 2.2 Booking a Lane Slot (`/bookings`)
1. Browse partnered facilities via **"Discover Ranges"**.
2. Select your preferred date, caliber rating (Airgun, Pistol, High-Power Rifle), and distance (10m, 25m, 50m, 100m+).
3. Choose an available 1-hour time slot from the hourly availability matrix.
4. Confirm reservation to generate your **Booking Reference Code** and **Check-in QR Pass**.

---

## 3. Live Session Tracking & Target Camera Integration

### 3.1 Live Session Initialization (`/sessions/new`)
1. At the firing point, open **"Start Session"**.
2. Select your firearm from your armory inventory and choose the ammunition lot.
3. Configure target type (e.g., ISSF 10m Air Rifle, ISSF 25m Pistol, B-8 Bullseye, MOA Grid).
4. Select **Capture Mode**:
   - **Target Camera Live Stream (Recommended):** Real-time automated shot detection via the downrange edge camera rig.
   - **Photo Upload:** Snap high-resolution photo of the physical target backer post-string for OpenCV auto-scoring.
   - **Manual Input:** Key in decimal ring values shot-by-shot on touch dial.

### 3.2 Target Camera Edge Synchronization (`/live-analysis`)
* When using a range equipped with the **Marksman Target Camera**, the camera streams frames directly to your personal lane display over low-latency local WebSockets.
* Each bullet impact is detected within **150 milliseconds**, accompanied by:
  - Visual bullet hole render with color-coded chronological shot sequence.
  - Instant decimal ring score (e.g., 10.4, 10.8, 9.7).
  - Subtle haptic confirmation on mobile devices.

---

## 4. Performance Analytics & Metrics Guide

The Analytics Engine calculates ballistics and group dispersion metrics:

```
          ┌──────────────────────────────────────────────┐
          │              TARGET DISPERSION               │
          │                                              │
          │                   (•) #2                     │
          │            (•) #1      \                     │
          │               \       Mean Radius            │
          │                \     /                       │
          │                 (+) CENTER OF IMPACT         │
          │                /                             │
          │          (•) #3                              │
          │                                              │
          │  <─────────── EXTREME SPREAD ──────────────> │
          └──────────────────────────────────────────────┘
```

* **Group Size (Extreme Spread):** The maximum distance between the centers of the two widest bullet impacts in a string, expressed in millimeters (mm) and Minutes of Angle (MOA).
* **Mean Radius:** The average distance from every individual shot impact to the statistical Center of Impact (POI). A superior indicator of true rifle and shooter precision compared to raw group size.
* **Shot Tempo & Cadence:** Interval timings (in seconds) between trigger breaks. Helps diagnose rushing, hesitations, or cardiovascular fatigue.
* **Wind-Score Correlation:** When outdoor weather sensors are active, displays crosswind deflection angles relative to your group shift.

---

## 5. AI Coach Insights & Progressive Drills

### 5.1 Querying the AI Coach (`/ai-coach`)
* Following any session, select **"Analyze with AI Coach"**.
* Powered by advanced multimodal LLMs (Groq / Gemini models), the AI Coach ingests your:
  - Exact shot coordinates and grouping drift.
  - Cadence timeline and split times.
  - Historical personal bests and discipline benchmarks.
* **Actionable Feedback:** The coach delivers plain-language diagnostics, identifying common biomechanical faults:
  - *Heeling / Anticipating Recoil:* Systematic vertical stringing high-right.
  - *Trigger Jerk:* Clustering low-left (for right-handed shooters).
  - *Breathing Inconsistency:* Vertical dispersion along the 12 o'clock / 6 o'clock axis.

### 5.2 Structured Drill Training (`/planning`)
* Execute targeted drills curated by master coaches:
  - **Ball & Dummy Drill:** Eliminates flinch and trigger anticipation.
  - **Cadence Pyramid:** Enforces steady 1.5-second split rhythm under pressure.
  - **Cold Bore Challenge:** Single-shot accuracy assessment from a relaxed baseline.

---

## 6. Coach Connection & Squad Collaboration

### 6.1 Finding & Linking with a Coach (`/connect`)
* Browse the **Verified Coach Directory** (`/coach/directory`) to search instructors by discipline, credentials, and geographic region.
* Send a connection invitation. Once approved by the coach, your training sessions, live camera feeds, and ballistics data sync directly to their coach dashboard.

### 6.2 Squad / Team Assignments
* High-school, collegiate, military, and club teams can join unified **Squads** managed by their head coach.
* Coaches can assign custom weekly drill plans and review team-wide performance radar charts.

---

## 7. Competitive Matchmaking & ELO Ranking

### 7.1 Skill Rating (ELO) Engine (`/shooter/leaderboard`)
* Every verified athlete is assigned an internal discipline skill rating starting from baseline **1400 ELO**.
* Ratings update dynamically based on certified match scores against national handicap baselines.
* View global, national, and club rankings on the gold-accented **Leaderboard**.

### 7.2 Live TV Kiosk Scoreboard (`/competitions/:id/kiosk`)
* During sanctioned matches, spectator and lounge TV monitors render real-time ISSF finals layouts.
* Scores update live on every shot break with automated elimination warnings for lowest-ranked competitors.

---

## 8. Safety & Personal Health Guidelines for Shooters

1. **The 4 Cardinal Rules of Firearm Safety:**
   - Treat every firearm as if it is loaded at all times.
   - Never point a firearm at anything you are not willing to destroy.
   - Keep your finger off the trigger and outside the trigger guard until your sights are on target and you have decided to shoot.
   - Be sure of your target, what is in front of it, and what is beyond it.
2. **Mandatory Protective Gear:** ANSI Z87.1 rated eye protection and minimum NRR 28 hearing protection must be worn before stepping past the firing line threshold.
3. **Lead Hygiene:** Wash hands with cold water and D-Lead soap after shooting. Never handle food, phones, or beverages before washing.
