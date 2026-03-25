# Marksman — Shooting Performance Platform

## Architecture

Monorepo with npm workspaces:

| App | Path | Stack |
|-----|------|-------|
| Web | `apps/web` | Next.js 15 App Router, TypeScript, Tailwind CSS |
| API | `apps/api` | NestJS, Prisma, PostgreSQL, JWT |
| Vision | `apps/vision` | Python FastAPI, OpenCV |
| Shared Types | `packages/shared-types` | TypeScript types shared across apps |

## Quick Start

```bash
# Install all dependencies
npm install

# Run dev servers
npm run dev:api      # NestJS API on :3001
npm run dev:web      # Next.js web on :3000
npm run dev:vision   # Python vision service on :8000

# Database
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed with demo data
npm run db:studio    # Open Prisma Studio
```

## Seed Credentials

```
Shooter:  shooter@example.com  /  Password123!
Coach:    coach@example.com    /  Password123!
```

## Design System

**Dark Luxury Precision** theme. Colors, fonts, and utilities defined in:
- `apps/web/app/globals.css` — CSS variables and component classes
- `apps/web/tailwind.config.ts` — Design tokens

**Fonts:**
- `font-display` → Rajdhani (headings, labels)
- `font-body` → DM Sans (body text)
- `font-data` → JetBrains Mono (numeric data)

**Key colours:**
- Void: `#080A0F` / Surface: `#0E1118` / Elevated: `#161B26`
- Accent amber: `#F5A623`
- Data blue: `#4FC3F7`
- Signal red: `#FF4D6D`
- Success: `#00E5A0`

**Shot score colours:** ≥10.5 gold → ≥10.0 blue → ≥9.0 emerald → <9.0 red

**Theme:** Dark by default. Light theme applied via `.light` class on `<html>`. Toggle stored in `localStorage` key `theme`.

## Auth

- JWT stored in `localStorage` (`accessToken` key)
- `apiFetch()` in `apps/web/lib/api.ts` auto-attaches `Bearer` header
- Google Sign-In: GSI ID token flow on web; `@codetrix-studio/capacitor-google-auth` on native
- Roles: `SHOOTER` | `COACH`
- bcryptjs (pure JS) used instead of native `bcrypt` for cross-platform compatibility

## Environment Variables

**API (`apps/api/.env`):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=956705763664-jd9dqcqf3tdknjaflb2gc0iknnf9hmen.apps.googleusercontent.com
```

**Web (`apps/web/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=956705763664-jd9dqcqf3tdknjaflb2gc0iknnf9hmen.apps.googleusercontent.com
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Database schema (User, Session, Shot, CoachConnection, etc.) |
| `apps/api/src/auth/auth.service.ts` | JWT + Google auth logic |
| `apps/api/src/analytics/analytics.service.ts` | Shot analytics (avg, MPI, groupRadius, stdDev, series) |
| `apps/api/src/suggestions/rules.engine.ts` | 5-rule coaching suggestions engine |
| `apps/web/components/AppShell.tsx` | Auth redirect guard, sidebar layout |
| `apps/web/components/TargetCanvas.tsx` | Canvas shot visualisation with zoom + PNG export |
| `apps/web/contexts/auth-context.tsx` | Global auth state |
| `apps/web/contexts/theme-context.tsx` | Dark/light theme toggle |
| `apps/web/lib/api.ts` | Fetch wrapper with JWT injection |

## Mobile (Capacitor)

- Config: `apps/web/capacitor.config.ts`
- Server URL: `www.marksmanspro.com`
- Android SHA1: registered in Google Cloud project 956705763664
- Android OAuth client: `956705763664-es9vuikvlk1ut93b2n2msc2652imllkt.apps.googleusercontent.com`
- After any native config change: `npx cap sync android`

## WebSocket

- Gateway in `GatewayModule`, imported by `ShotsModule` and `CoachModule`
- Events: `session.updated`, `feedback.added`
- Rooms keyed by `sessionId`

## Conventions

- API base URL: `NEXT_PUBLIC_API_URL` (never hardcoded)
- No emojis in UI unless user-facing content specifically calls for them
- Prefer CSS variables over hardcoded colours in new components
- All page components: `'use client'` at the top
- Prefer `bcryptjs` over `bcrypt` everywhere (native module fails in Linux containers)
