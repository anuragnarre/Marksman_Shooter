# Marksman Platform Ecosystem

## Ecosystem Overview
The Marksman Platform is a comprehensive suite of interconnected applications and microservices designed to modernize physical shooting ranges. The ecosystem seamlessly bridges the gap between range operations, hardware target cameras, and individual shooter analytics. 

By combining real-time hardware telemetry (target cameras), computer vision (OpenCV/YOLO target scoring), and AI-driven coaching (LLMs), the Marksman ecosystem provides an end-to-end operational and analytical platform for Range Operators, Range Safety Officers (RSOs), Coaches, and Shooters.

---

## 1. Range App (Range Operations & Management)
**Status:** 🟢 100% Working & Deployable
**Tech Stack:** Next.js 15, NestJS, Python FastAPI, PostgreSQL (Prisma)

The `Range_App` is the core management dashboard for Range Operators and Staff. It acts as the central command for physical range logistics.

**Implemented & Deployable Features:**
- **Lane Management:** Live monitoring of physical range lanes and real-time status tracking via WebSockets.
- **Bookings & Sessions:** Full booking system for shooters, including session initialization.
- **Membership Management:** Database integrations for member tracking and administration.
- **Live Target Telemetry:** Integration with the Vision Microservice to receive automated, real-time target scoring updates.
- **Environmental Data:** Basic environmental logging for range conditions.

---

## 2. Shooter App (Analytics & AI Coaching)
**Status:** 🟢 100% Working & Deployable
**Tech Stack:** Next.js 15, NestJS, Python FastAPI, PostgreSQL (Prisma)

The `Shooter_App` is the dedicated portal for end-users: Shooters, Coaches, and Soldiers. It focuses on individual performance tracking and AI-generated insights.

**Implemented & Deployable Features:**
- **Session Tracking & Logging:** Shooters can log individual shots, sessions, and track long-term performance.
- **AI Coach Integration:** LLM-powered natural language feedback (via Groq API) that analyzes session data and provides actionable coaching insights.
- **Performance Visualizations:** Advanced charting (Performance Radar, Score Visualizations) for deep analytics.
- **Automated Hit Detection:** Integration with the FastAPI Vision service to automatically score uploaded or live target images using OpenCV algorithms.

---

## 3. Target Camera App (Hardware Interface)
**Status:** 🟢 100% Working & Deployable
**Tech Stack:** React Native, Expo

The `Target_Camera_App` is the edge hardware interface deployed at the target line on the physical range. 

**Implemented & Deployable Features:**
- **Live Hardware Interface:** Utilizes mobile device camera hardware to capture physical targets.
- **Real-time Frame Streaming:** Captures and transmits high-resolution target images and live video streams directly to the backend vision engine (`/shots/live-frame` endpoints).
- **Cross-Platform:** Deployable as an APK for Android edge devices (phones, tablets, custom camera rigs).

---

## 4. Version 2 Range Ops (Next-Gen Infrastructure)
**Status:** 🟡 Work In Progress (WIP)
**Tech Stack:** Next.js 15, NestJS, Python FastAPI, Hardware Edge Scripts

`Version_2_Range_Ops` is the upcoming, highly-advanced iteration of the Range Operations module. It is currently under active development to introduce physical automation and deep hardware integrations.

**Work In Progress Features:**
- **Advanced RSO Overrides:** Real-time, websocket-driven lane assignments and emergency overrides for Range Safety Officers.
- **Turnstile & Hardware Access:** Bridging physical range access (turnstiles, doors) with software logic.
- **YOLO Vision Integration:** Transitioning from basic OpenCV scoring to advanced YOLO machine learning models for superior hit detection, including training scripts.
- **Advanced Telemetry:** Deep environmental logging via OpenMeteo APIs combined with hardware edge engine scripts (sensors).
- **Dynamic KPI Dashboards:** Enhanced Next.js 15 UI for live administrative range monitoring and physical hardware status.

---

## 5. Official Standards, Legal Compliance & Operational Manuals

The platform includes an enterprise-grade regulatory, compliance, and training documentation suite:

* **[Legal, Regulatory & Compliance Standards](docs/LEGAL_COMPLIANCE_AND_STANDARDS.md):** OSHA 29 CFR 1910.1025 lead air standards (50–75 fpm laminar flow, negative pressure, HEPA), OSHA 1910.95 acoustic protection (140 dB ceiling, NRR 28+), ATF 27 CFR Part 478 serialized armory custody, GDPR/CCPA target camera privacy, and Form 101 liability waiver framework.
* **[Range Operator & RSO Manual (SOP)](docs/RANGE_OPERATOR_AND_RSO_MANUAL.md):** Standard line commands ("Range is Active", "CEASE FIRE!", "Unload and Show Clear"), stoppage clearance (squibs, hangfires), TCCC MARCH trauma protocol for traumatic wounds, and 100-point RSO certification rubric.
* **[Athlete & Shooter User Manual](docs/SHOOTER_ATHLETE_USER_MANUAL.md):** Profile verification, digital turnstile membership card usage, real-time target camera pairing, group dispersion metrics (Extreme Spread, Mean Radius), AI Coach integration, and competitive ELO matchmaking.
* **[Target Camera Hardware & Edge Guide](docs/HARDWARE_AND_TARGET_CAMERA_GUIDE.md):** 3/8" AR500 steel deflector armor mounting (45-degree angle), 1000–1500 Lux DC constant-voltage LED flicker-free illumination, sacrificial polycarbonate lenses, and homography matrix calibration.
* **In-App Training Portals:**
  - Range Operator & RSO Training Portal: `http://localhost:3002/docs`
  - Athlete User Manual & Guides: `http://localhost:3000/docs`

