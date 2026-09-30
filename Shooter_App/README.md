# MARKSMAN — Shooting Analytics Platform

> Precision training analytics for competitive shooters, coaches, and military/tactical units.

A full-stack monorepo for recording, visualising, and analysing shooting performance.
Built with **Next.js 15**, **NestJS**, **Prisma**, **PostgreSQL**, and a **Python/OpenCV** vision microservice.

🌐 **Live:** [marksmanspro.com](https://www.marksmanspro.com) &nbsp;|&nbsp; 📱 **Mobile:** Capacitor (iOS + Android)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Design System](#design-system)
- [Known Homepage Issues](#known-homepage-issues)
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
|------|-------------|
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
│  AuthModule  SessionsModule  ShotsModule  AnalyticsModule         │
│  CoachModule  SuggestionsModule  AiCoachModule  GatewayModule     │
└──────────┬──────────────────────────────────┬────────────────────┘
           │ Prisma ORM                        │ HTTP fetch /analyze
           ▼                                   ▼
┌──────────────────┐               ┌──────────────────────────┐
│   PostgreSQL     │               │  FastAPI Vision  :8000   │
│  shooting_       │               │  OpenCV pipeline         │
│  platform (DB)   │               │  → shot coordinates      │
└──────────────────┘               └──────────────────────────┘
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
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/
│   │       ├── sessions/
│   │       ├── shots/
│   │       ├── analytics/
│   │       ├── suggestions/
│   │       ├── ai-coach/
│   │       ├── coach/
│   │       ├── gateway/
│   │       └── prisma/
│   │
│   ├── web/                      Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          ← Marketing homepage
│   │   │   ├── manifest.ts
│   │   │   ├── dashboard/
│   │   │   ├── sessions/
│   │   │   ├── analytics/
│   │   │   ├── ai-coach/
│   │   │   ├── coach/
│   │   │   ├── connect/
│   │   │   ├── soldier/
│   │   │   └── auth/
│   │   ├── components/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── TargetCanvas.tsx
│   │   │   ├── AnalyticsCharts.tsx
│   │   │   ├── LoadingScreen.tsx  ← Marketing loading animation
│   │   │   ├── MarketingNav.tsx   ← Sticky nav with mobile drawer
│   │   │   ├── MiniTargetCanvas.tsx ← Hero shot map preview
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   └── useCountUp.ts      ← IntersectionObserver counter
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── chart-theme.ts     ← Recharts custom theme
│   │   │   └── use-mobile.ts
│   │   └── public/
│   │       ├── og-image.png       ← 1200×630 OG image for social
│   │       └── favicon.ico
│   │
│   └── vision/                   Python FastAPI microservice
│       ├── main.py
│       └── requirements.txt
│
├── packages/
│   └── shared-types/
│       └── index.ts
│
├── CLAUDE.md                     ← Claude Code design system guide
├── DESIGN.md                     ← Homepage audit & fix specs
├── .env.example
└── package.json
```

---

## Design System

**Aesthetic: Dark Luxury Precision** — high-contrast readability in low-light environments.
Built for serious athletes, not casual consumers.

> For full design system documentation used with Claude Code, see [`CLAUDE.md`](./CLAUDE.md).
> For the homepage-specific audit and fix specs, see [`DESIGN.md`](./DESIGN.md).

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-void` | `#080A0F` | Page background |
| `--bg-surface` | `#0E1118` | Cards, sidebar |
| `--bg-elevated` | `#161B26` | Hover states, inputs |
| `--bg-overlay` | `#1E2535` | Modals, tooltips |
| `--accent-primary` | `#F5A623` | Amber — CTAs, active states, logo |
| `--data-blue` | `#4FC3F7` | Data values, 10-ring shots |
| `--signal-red` | `#FF4D6D` | Errors, low scores |
| `--success` | `#00E5A0` | Emerald — positive trends, 9-ring shots |

### Shot Ring Colors

| Score | Color | Hex |
|-------|-------|-----|
| ≥ 10.5 (X-ring) | Amber | `#F5A623` |
| ≥ 10.0 | Blue | `#4FC3F7` |
| ≥ 9.0 | Emerald | `#00E5A0` |
| < 9.0 | Red | `#FF4D6D` |

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headings | Rajdhani | 600–700 | All `<h1>` – `<h3>` |
| Body | DM Sans | 400–500 | Paragraphs, labels, nav |
| Data | JetBrains Mono | 400–700 | Scores, coordinates, KPIs |

---

## Known Homepage Issues

> These issues have been identified and documented. Fix specs are in [`DESIGN.md`](./DESIGN.md).

| Priority | Issue | Status |
|----------|-------|--------|
| 🔴 Critical | Stats counters show `0` — IntersectionObserver missing | Open |
| 🔴 Critical | 10-second loading screen with no progress feedback | Open |
| 🔴 Critical | "Pricing" nav link 404s — no route exists | Open |
| 🔴 Critical | Nav anchor links (`#features`, `#how-it-works`) don't scroll | Open |
| 🟠 High | Hero has no visual target/ring graphic | Open |
| 🟠 High | No mobile navigation menu on marketing page | Open |
| 🟠 High | Hero session card missing shot map visualization | Open |
| 🟠 High | No OG/meta image for social sharing | Open |
| 🟡 Polish | Testimonials — no disclaimer for beta/representative quotes | Open |
| 🟡 Polish | Feature card tier badges are inconsistent | Open |
| 🟡 Polish | Country ticker doesn't pause on hover | Open |
| 🟡 Polish | Footer status link is decorative, not functional | Open |

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | |
| npm | 10+ | Workspaces support |
| PostgreSQL | 15+ | Docker recommended |
| Python | 3.11+ | Vision service only |
| pip | latest | Vision service only |

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
# Node packages (all workspaces)
npm install

# Python vision service
cd apps/vision && pip install -r requirements.txt && cd ../..
```

### 2. Configure environment

```bash
cp .env.example apps/api/.env
# Edit apps/api/.env with your DATABASE_URL, JWT_SECRET, GROQ_API_KEY
```

```bash
# Web app — defaults work without this file
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > apps/web/.env.local
echo 'NEXT_PUBLIC_WS_URL=http://localhost:3001' >> apps/web/.env.local
```

### 3. Set up the database

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Apply migrations
npm run db:seed       # Seed demo data
```

> **WSL note:** If `db:seed` fails due to native `bcrypt` mismatch, seed via Python:
> ```bash
> python3 scripts/seed.py
> ```

---

## Running the Application

```bash
# All three services concurrently
npm run dev

# Or individually:
npm run dev:api      # NestJS → http://localhost:3001
npm run dev:web      # Next.js → http://localhost:3000
npm run dev:vision   # FastAPI → http://localhost:8000
```

---

## Seed Credentials

All seed accounts use password **`Password123!`**

| Email | Role | Access |
|-------|------|--------|
| `shooter@example.com` | SHOOTER | Sessions, shots, analytics, AI coach |
| `coach@example.com` | COACH | Shooters list, session review, feedback |
| `soldier@example.com` | SOLDIER | Sessions, shots, analytics, AI coach |

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Prisma PostgreSQL connection string | `postgresql://postgres:password@127.0.0.1:5433/shooting_platform` |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) | `9f3c7b1a8d6e4f2c9b0a7d3e5f6c8a1b` |
| `JWT_EXPIRES_IN` | Yes | Token expiry | `7d` |
| `PORT` | No | API port (default 3001) | `3001` |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins | `http://localhost:3000` |
| `GROQ_API_KEY` | Yes | Free at [console.groq.com](https://console.groq.com) | `gsk_...` |
| `VISION_SERVICE_URL` | No | FastAPI base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | Yes | API URL for Next.js | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket URL | `http://localhost:3001` |

---

## API Reference

All authenticated routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register (SHOOTER or COACH) |
| POST | `/auth/login` | — | Login → `{ access_token, user }` |

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sessions` | JWT + SHOOTER/SOLDIER | Create session |
| GET | `/sessions` | JWT + SHOOTER/SOLDIER | List own sessions |
| GET | `/sessions/:id` | JWT + SHOOTER/SOLDIER/COACH | Get session with shots and feedback |
| DELETE | `/sessions/:id` | JWT + SHOOTER/SOLDIER | Soft-delete session |

### Shots

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/shots/manual` | JWT + SHOOTER/SOLDIER | Add shots via JSON body |
| POST | `/shots/import` | JWT + SHOOTER/SOLDIER | Upload CSV, JSON, or PDF |
| POST | `/shots/photo` | JWT + SHOOTER/SOLDIER | Upload target image → vision pipeline |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/session/:id` | JWT | Session metrics |
| GET | `/analytics/overview` | JWT + SHOOTER/SOLDIER | Cross-session overview |

### AI Coach

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai-coach/analyze` | JWT | Groq LLM session analysis |

### Coach

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/coach/connect` | JWT + SHOOTER | Request connection |
| PATCH | `/coach/connect/:id/approve` | JWT + COACH | Approve connection |
| GET | `/coach/shooters` | JWT + COACH | List connected shooters |
| POST | `/coach/feedback` | JWT + COACH | Post session feedback |

### Vision Service (FastAPI :8000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Analyse target image → shot coordinates |
| GET | `/health` | Health check |

---

## WebSocket Events

Connect to `ws://localhost:3001` using Socket.IO.

**Client → Server**

| Event | Payload | Description |
|-------|---------|-------------|
| `joinSession` | `sessionId: string` | Subscribe to live session updates |
| `leaveSession` | `sessionId: string` | Unsubscribe |

**Server → Client**

| Event | Payload | Description |
|-------|---------|-------------|
| `session.updated` | `{ sessionId, newShotCount }` | New shots added |
| `feedback.added` | `{ sessionId, feedback }` | Coach posted feedback |

---

## Analytics Formulas

```
Average Score    =  Σ(scores) / n

MPI (x, y)       =  ( Σ(xi) / n ,  Σ(yi) / n )
                    — centroid of all shots

Group Radius     =  max over all pairs √( (x₁−x₂)² + (y₁−y₂)² )
                    — largest spread between any two shots

Std Deviation    =  √( Σ(score − avg)² / n )

Series Averages  =  chunk(shots, 10) → avg per chunk

Consistency      =  10 − stdDev × 2   (clamped 0–10)
```

---

## Coaching Suggestion Rules

| Rule | Trigger | Suggestion |
|------|---------|------------|
| Sight drift left | MPI x < −0.5 | Adjust sight right |
| Sight drift right | MPI x > +0.5 | Adjust sight left |
| Grouping | Group radius > 5 | Focus on trigger control |
| Endurance drop | Last series avg < first − 0.5 | Add endurance training |
| Inconsistency | Std deviation > 1.0 | Work on repeatable technique |

---

## File Import Formats

`POST /shots/import?sessionId=<id>`

**CSV** (`shotNumber,score,x,y`):
```
1,9.5,-1.2,0.8
2,10.1,0.1,-0.2
```

**JSON:**
```json
[{ "shotNumber": 1, "score": 9.5, "x": -1.2, "y": 0.8 }]
```

**PDF:** One shot per line — `shotNumber,score[,x,y]`

---

## Roles & Permissions

| Feature | SHOOTER | COACH | SOLDIER |
|---------|---------|-------|---------|
| Create session | ✓ | — | ✓ |
| Add shots | ✓ | — | ✓ |
| View own sessions | ✓ | — | ✓ |
| View analytics | ✓ | — | ✓ |
| AI Coach | ✓ | — | ✓ |
| Coach connection | ✓ (initiate) | ✓ (approve) | — |
| View shooter sessions | — | ✓ | — |
| Post feedback | — | ✓ | — |
| Weapons management | — | — | ✓ |
| Field analytics | — | — | ✓ |

---

## Contributing

1. Fork and clone the repo
2. Follow the [Design System](./CLAUDE.md) and [Homepage Specs](./DESIGN.md)
3. Run `npm run dev` to start all services
4. Open a PR against `main`

---

*Built for precision. © 2026 Marksman.*
