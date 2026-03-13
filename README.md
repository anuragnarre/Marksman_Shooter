# MARKSMAN — Shooting Analytics Platform

> Precision training analytics for competitive shooters, coaches, and military/tactical units.

A full-stack monorepo application for recording, visualising, and analysing shooting performance. Built with Next.js 15, NestJS, Prisma, PostgreSQL, and a Python/OpenCV vision microservice.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Design System](#design-system)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Seed Credentials](#seed-credentials)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Analytics Formulas](#analytics-formulas)
- [Coaching Suggestion Rules](#coaching-suggestion-rules)
- [File Import Formats](#file-import-formats)
- [Roles & Permissions](#roles--permissions)

---

## Features

### Core
- **Session management** — Create, view, and delete training sessions with discipline, weapon, distance, and training mode metadata
- **Shot entry** — Four input methods per session:
  - **Click Target** — Interactive 10-ring canvas; drag-and-drop shot placement with score preview
  - **Manual Entry** — Form-based shot entry with coordinate input
  - **Photo / Camera** — Upload or capture a target photo; OpenCV vision pipeline extracts shot coordinates automatically
  - **File Import** — Bulk import via CSV, JSON, or PDF
- **Live target canvas** — Zoomable, pannable, exportable PNG; shot dots colour-coded by score ring; MPI crosshair overlay; coordinate direction indicators
- **Real-time updates** — Socket.IO WebSocket pushes `session.updated` and `feedback.added` events to all connected clients

### Analytics
- **Session metrics** — Average score, best shot, std deviation, group radius, MPI (x/y centroid), series averages
- **Overview dashboard** — Cross-session trends, ring distribution, performance radar, group radius history, session history table
- **Score trend chart** — AreaChart filterable by weapon type
- **Performance radar** — 6-axis profile (Avg Score, Best Avg, X-Ring %, 10+ %, Consistency, 9+ %)

### AI Coach
- **Session analysis** — Sends shot data to Groq LLM (llama-3.3-70b-versatile) for natural language coaching insights
- **Structured output** — Returns overall assessment, top 3 strengths, top 3 improvements, one drill recommendation
- **Free tier** — Groq API: 14,400 req/day, no billing required

### Roles
| Role | Description |
|---|---|
| **SHOOTER** | Records sessions, adds shots, views own analytics, connects to a coach |
| **COACH** | Views connected shooters' sessions, posts feedback |
| **SOLDIER** | Combined access — sessions + analytics + AI Coach (tactical/military use) |

### Mobile-First UI
- Fixed bottom navigation bar on mobile (< 1024px); sidebar on desktop
- Touch-friendly targets (min 44px), safe-area inset support (iOS notch)
- Responsive layouts — single-column stacking on mobile, multi-column on desktop
- Progressive column hiding in shot table on small screens

### PWA & Branding
- SVG favicon + multi-size PNG icons (16, 32, 48, 128, 180, 192, 512px)
- `manifest.webmanifest` for installable PWA (standalone mode, amber theme)
- Apple touch icon, mask-icon for Safari pinned tabs

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser / Client                           │
│              Next.js 15 App Router  :3000                        │
│  ┌──────────────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │  TargetCanvas    │  │  Recharts     │  │  AI Coach Chat    │ │
│  │  (10-ring SVG,   │  │  (area, bar,  │  │  (Groq streaming) │ │
│  │   drag & drop)   │  │   radar)      │  │                   │ │
│  └──────────────────┘  └───────────────┘  └───────────────────┘ │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP REST  +  Socket.IO
┌──────────────────────────────▼───────────────────────────────────┐
│                      NestJS API  :3001                            │
│                                                                   │
│  AuthModule     SessionsModule    ShotsModule    AnalyticsModule  │
│  CoachModule    SuggestionsModule AiCoachModule  GatewayModule    │
└──────────┬────────────────────────────────────┬──────────────────┘
           │ Prisma ORM                          │ HTTP fetch /analyze
           ▼                                     ▼
┌──────────────────┐                  ┌──────────────────────────┐
│   PostgreSQL     │                  │  FastAPI Vision  :8000   │
│  shooting_       │                  │  OpenCV pipeline         │
│  platform (DB)   │                  │  → shot coordinates      │
└──────────────────┘                  └──────────────────────────┘
                                                 │ Groq API
                                      ┌──────────▼───────────────┐
                                      │  Groq Cloud (LLM)        │
                                      │  llama-3.3-70b-versatile │
                                      └──────────────────────────┘
```

---

## Monorepo Structure

```
/
├── apps/
│   ├── api/                      NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma     Database schema
│   │   │   ├── seed.ts           Demo data seed
│   │   │   └── migrations/       SQL migration history
│   │   └── src/
│   │       ├── auth/             JWT auth, guards, bcrypt
│   │       ├── sessions/         CRUD + soft-delete
│   │       ├── shots/            Manual / import / photo entry + parser
│   │       ├── analytics/        Session + cross-session overview metrics
│   │       ├── suggestions/      Rules-engine coaching hints
│   │       ├── ai-coach/         Groq LLM integration
│   │       ├── coach/            Coach connections + feedback
│   │       ├── gateway/          Socket.IO WebSocket gateway
│   │       └── prisma/           PrismaService singleton
│   │
│   ├── web/                      Next.js 15 (App Router) frontend
│   │   ├── app/
│   │   │   ├── layout.tsx        Root layout + metadata + PWA icons
│   │   │   ├── manifest.ts       PWA web manifest
│   │   │   ├── dashboard/        Overview KPIs
│   │   │   ├── sessions/         Session list + detail (7-tab canvas view)
│   │   │   ├── analytics/        Cross-session analytics dashboard
│   │   │   ├── ai-coach/         AI coaching chat interface
│   │   │   ├── coach/            Coach portal (shooters list + feedback)
│   │   │   ├── connect/          Shooter → coach connection flow
│   │   │   ├── soldier/          Soldier-role pages (weapons, field analytics)
│   │   │   └── auth/             Login + register pages
│   │   ├── components/
│   │   │   ├── AppShell.tsx      Auth guard + sidebar/topbar chrome
│   │   │   ├── Sidebar.tsx       Desktop navigation (hidden on mobile)
│   │   │   ├── TopBar.tsx        Page header bar
│   │   │   ├── BottomNav.tsx     Mobile bottom navigation (lg:hidden)
│   │   │   ├── TargetCanvas.tsx  Interactive shot canvas (zoom, pan, export)
│   │   │   ├── AnalyticsCharts.tsx  Score over time + distribution charts
│   │   │   └── ui/               ShotTable, MetricCard, SuggestionItem, ...
│   │   ├── contexts/
│   │   │   └── auth-context.tsx  JWT auth state + isLoading guard
│   │   ├── lib/
│   │   │   ├── api.ts            apiFetch() with Bearer token + 401 handler
│   │   │   ├── auth.ts           login() / register() helpers
│   │   │   └── use-mobile.ts     useIsMobile() responsive hook
│   │   └── public/               Favicon, PNG icons, logo SVG
│   │
│   └── vision/                   Python FastAPI microservice
│       ├── main.py               /analyze and /health endpoints
│       └── requirements.txt      fastapi, uvicorn, opencv-python, numpy
│
├── packages/
│   └── shared-types/
│       └── index.ts              Shared TS interfaces (Session, Shot, Analytics...)
│
├── .env.example                  Environment variable template
└── package.json                  npm workspaces root + scripts
```

---

## Design System

**Dark Luxury Precision** — built for high-contrast readability in low-light environments.

| Token | Value | Usage |
|---|---|---|
| `--bg-void` | `#080A0F` | Page background |
| `--bg-surface` | `#0E1118` | Cards, sidebar |
| `--bg-elevated` | `#161B26` | Hover states, inputs |
| `--accent-primary` | `#F5A623` | Amber — CTAs, active states, logo |
| `--data-blue` | `#4FC3F7` | Data values, 10-ring shots |
| `--signal-red` | `#FF4D6D` | Errors, low scores |
| `--success` | `#00E5A0` | Emerald — positive trends, 9-ring shots |

**Fonts:** Rajdhani (display headings) · DM Sans (body) · JetBrains Mono (data/numbers)

**Shot ring colours:**
- Score ≥ 10.5 (X-ring) → Amber `#F5A623`
- Score ≥ 10.0 → Blue `#4FC3F7`
- Score ≥ 9.0 → Emerald `#00E5A0`
- Score < 9.0 → Red `#FF4D6D`

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | |
| npm | 10+ | Workspaces support |
| PostgreSQL | 15+ | Docker recommended |
| Python | 3.11+ | Vision service only |
| pip | latest | Vision service only |

**Recommended: run PostgreSQL via Docker**

```bash
docker run -d \
  --name shooting-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=shooting_platform \
  -p 5433:5432 \
  postgres:16
```

---

## Setup

### 1. Install dependencies

```bash
# Node packages (all workspaces — api, web, shared-types)
npm install

# Python vision service
cd apps/vision && pip install -r requirements.txt && cd ../..
```

### 2. Configure environment

```bash
cp .env.example apps/api/.env
# Edit apps/api/.env with your DATABASE_URL, JWT_SECRET, GROQ_API_KEY
```

For the web app, defaults work with no `.env.local` (Next.js reads `NEXT_PUBLIC_*` from the API `.env`). To override:

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > apps/web/.env.local
echo 'NEXT_PUBLIC_WS_URL=http://localhost:3001' >> apps/web/.env.local
```

### 3. Set up the database

```bash
# Generate the Prisma client
npm run db:generate

# Apply migrations to your database
npm run db:migrate

# Seed with demo users, sessions, and shots
npm run db:seed
```

> **WSL / cross-platform note:** If `db:seed` fails due to a native `bcrypt` binary mismatch (Windows .node file loaded in Linux), seed via the included Python helper:
> ```bash
> python3 scripts/seed.py
> ```
> Python's `bcrypt` package produces fully compatible hashes.

---

## Running the Application

Open three terminals from the project root:

```bash
# Terminal 1 — API (NestJS)
npm run dev:api
# → http://localhost:3001

# Terminal 2 — Web (Next.js)
npm run dev:web
# → http://localhost:3000

# Terminal 3 — Vision microservice (FastAPI)
npm run dev:vision
# → http://localhost:8000
```

All three run concurrently via:

```bash
npm run dev
```

---

## Seed Credentials

All seed accounts use the password **`Password123!`**

| Email | Role | Access |
|---|---|---|
| `shooter@example.com` | SHOOTER | Sessions, shots, analytics, AI coach, connect |
| `coach@example.com` | COACH | Shooters list, session review, post feedback |
| `soldier@example.com` | SOLDIER | Sessions, shots, analytics, AI coach |

Seed data includes: 3 sessions, 30 shots (improving trend across sessions), 1 coach connection, 1 coach feedback comment.

---

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | Prisma PostgreSQL connection string | `postgresql://postgres:password@127.0.0.1:5433/shooting_platform` |
| `JWT_SECRET` | Yes | Secret for signing JWTs (32+ chars) | `9f3c7b1a8d6e4f2c9b0a7d3e5f6c8a1b` |
| `JWT_EXPIRES_IN` | Yes | Token expiry | `7d` |
| `PORT` | No | API server port (default 3001) | `3001` |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins | `http://localhost:3000` |
| `GROQ_API_KEY` | Yes | Groq API key for AI Coach — free at console.groq.com | `gsk_...` |
| `VISION_SERVICE_URL` | No | FastAPI vision service base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | Yes | API URL used by Next.js (public) | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket URL for real-time updates | `http://localhost:3001` |

---

## API Reference

All authenticated routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user (SHOOTER or COACH) |
| POST | `/auth/login` | — | Login, returns `{ access_token, user }` |

### Sessions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/sessions` | JWT + SHOOTER/SOLDIER | Create session |
| GET | `/sessions` | JWT + SHOOTER/SOLDIER | List own sessions |
| GET | `/sessions/:id` | JWT + SHOOTER/SOLDIER/COACH | Get session with shots and feedback |
| DELETE | `/sessions/:id` | JWT + SHOOTER/SOLDIER | Soft-delete session |

### Shots

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/shots/manual` | JWT + SHOOTER/SOLDIER | Add shots via JSON body |
| POST | `/shots/import` | JWT + SHOOTER/SOLDIER | Upload CSV, JSON, or PDF file |
| POST | `/shots/photo` | JWT + SHOOTER/SOLDIER | Upload target image → vision pipeline |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/session/:id` | JWT | Compute session metrics (avg, MPI, std dev, group radius, series) |
| GET | `/analytics/overview` | JWT + SHOOTER/SOLDIER | Cross-session overview (KPIs, trend, ring distribution) |

### Suggestions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/suggestions/session/:id` | JWT | Rules-based coaching suggestions for a session |

### AI Coach

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai-coach/analyze` | JWT | Send session shots to Groq LLM, returns structured coaching analysis |

### Coach

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/coach/connect` | JWT + SHOOTER | Request connection with a coach |
| PATCH | `/coach/connect/:id/approve` | JWT + COACH | Approve a connection request |
| PATCH | `/coach/connect/:id/reject` | JWT + COACH | Reject a connection request |
| GET | `/coach/shooters` | JWT + COACH | List all connected shooters |
| GET | `/coach/shooters/:shooterId/sessions` | JWT + COACH | View a shooter's sessions |
| POST | `/coach/feedback` | JWT + COACH | Post feedback on a session |

### Vision Service (FastAPI :8000)

| Method | Path | Description |
|---|---|---|
| POST | `/analyze` | Analyse target image, return detected shot coordinates and scores |
| GET | `/health` | Health check |

---

## WebSocket Events

Connect to `ws://localhost:3001` using Socket.IO. Rooms are keyed by `sessionId`.

**Client → Server**

| Event | Payload | Description |
|---|---|---|
| `joinSession` | `sessionId: string` | Subscribe to live updates for a session |
| `leaveSession` | `sessionId: string` | Unsubscribe from a session room |

**Server → Client**

| Event | Payload | Description |
|---|---|---|
| `session.updated` | `{ sessionId, newShotCount }` | Fired whenever shots are added to a session |
| `feedback.added` | `{ sessionId, feedback }` | Fired when a coach posts feedback |

---

## Analytics Formulas

```
Average Score    =  Σ(scores) / n

MPI (x, y)       =  ( Σ(xi) / n ,  Σ(yi) / n )
                    — mean point of impact; centroid of all shots

Group Radius     =  max over all pairs √( (x₁−x₂)² + (y₁−y₂)² )
                    — largest spread between any two shots

Std Deviation    =  √( Σ(score − avg)² / n )
                    — shot-to-shot consistency

Series Averages  =  chunk(shots, 10) → avg per chunk
                    — reveals endurance drift across a session

Consistency      =  10 − stdDev × 2   (cross-session, clamped 0–10)
                    — used in overview KPI and performance radar
```

---

## Coaching Suggestion Rules

Evaluated per session by the rules engine (`apps/api/src/suggestions/rules.engine.ts`):

| Rule | Trigger Condition | Suggestion |
|---|---|---|
| Sight drift left | MPI x < −0.5 | "Adjust sight right — shots consistently pulling left" |
| Sight drift right | MPI x > +0.5 | "Adjust sight left — shots consistently pulling right" |
| Grouping / trigger | Group radius > 5 | "Focus on trigger control and follow-through" |
| Endurance drop | Last series avg < first series avg − 0.5 | "Incorporate endurance and mental focus training" |
| Inconsistency | Std deviation > 1.0 | "Work on repeatable technique and stable position" |

---

## File Import Formats

`POST /shots/import?sessionId=<id>` — supports multipart `file` field.

**CSV** (`shotNumber,score,x,y`):
```csv
shotNumber,score,x,y
1,9.5,-1.2,0.8
2,10.1,0.1,-0.2
3,9.8,0.4,0.5
```

**JSON** (array of shot objects):
```json
[
  { "shotNumber": 1, "score": 9.5, "x": -1.2, "y": 0.8 },
  { "shotNumber": 2, "score": 10.1, "x": 0.1, "y": -0.2 }
]
```

**PDF** (one shot per line — `shotNumber,score[,x,y]`):
```
1,9.5,-1.2,0.8
2,10.1,0.1,-0.2
```

---

## Roles & Permissions

| Feature | SHOOTER | COACH | SOLDIER |
|---|---|---|---|
| Create session | Yes | — | Yes |
| Add shots | Yes | — | Yes |
| View own sessions | Yes | — | Yes |
| View analytics | Yes | — | Yes |
| AI Coach | Yes | — | Yes |
| Coach connection | Yes (initiate) | Yes (approve) | — |
| View shooter sessions | — | Yes (connected) | — |
| Post feedback | — | Yes | — |
| Weapons management | — | — | Yes |
| Field analytics | — | — | Yes |
