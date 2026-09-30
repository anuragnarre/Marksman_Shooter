# Marksman Platform Codebase Directory

[Please insert new description here]

## Active Directories

### 1. `Range_App/` (Web App / API)
**Type**: Full-Stack Monorepo (Next.js, NestJS, Python FastAPI)
**Description**: The primary application for Range Operators and Management. It includes the frontend web dashboard, backend REST API, and the computer vision microservice for automated target scoring. 
**Details**: See `Range_App.md` for architecture and execution context.

### 2. `Shooter_App/` (Web App / API)
**Type**: Full-Stack Monorepo (Next.js, NestJS, Python FastAPI)
**Description**: The primary application for Shooters, Coaches, and Soldiers. This focuses on individual analytics, training sessions, AI coaching insights, and performance tracking. 
**Details**: See `Shooter_App.md` for architecture and execution context.

### 3. `Version_2_Range_Ops/` (Web App / API)
**Type**: Full-Stack Monorepo
**Description**: The next-generation (Version 2) iteration of the Range Operations application. It contains enhanced models for lane management, booking schemas, membership handling, and RSO (Range Safety Officer) features.
**Details**: See `Version_2_Range_Ops.md` for architecture and execution context.

### 4. `Target_Camera_App/` (Mobile App / APK)
**Type**: React Native / Expo Mobile App
**Description**: The dedicated mobile application for target camera hardware integration. This app connects to local camera streams on the range, captures target images, and communicates with the vision engine for live scoring.
**Details**: See `Target_Camera_App.md` for architecture and execution context.

---

## Older / Archived Assets
- `Version_1_Core_App exclude from ai scans this is and old build not in use.rar`: An archived older build of the core application. Retained for historical reference but no longer actively developed.
