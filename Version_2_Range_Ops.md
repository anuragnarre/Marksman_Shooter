# Version_2_Range_Ops Context & Code Structure

## Overview
`Version_2_Range_Ops` is the next-generation iteration of the Range Operations module. It builds upon the original architecture to provide extensive improvements in turnstile access, RSO (Range Safety Officer) management, advanced booking algorithms, environmental logging, and enhanced telemetry.

## Monorepo Code Structure
```text
Version_2_Range_Ops/
├── apps/
│   ├── api/                      # Backend API (NestJS, Port 3001)
│   │   ├── prisma/               # V2 updated schema mapping
│   │   └── src/                  # Modules: notifications, membership, equipment, range-operations
│   ├── web/                      # V2 Frontend Dashboard (Next.js 15, Port 3000)
│   │   ├── app/                  # V2 specific routing for staff and admin check-in
│   │   └── components/           # Advanced KPI dashboard and live lane monitoring UI
│   └── vision/                   # Vision Microservice (Python FastAPI)
│       └── scripts/              # Advanced YOLO integration and training scripts
├── engine/                       # Hardware edge engine scripts bridging physical range sensors
└── packages/
    └── shared-types/             # Updated DTOs reflecting V2 schema changes
```

## Execution & Workflow
- **Prerequisites**: Node.js 20+, Python 3.11+, and Docker.
- **Configuration**: Initialize environmental variables in both the `api` and `web` directories based on their `.env.example` templates.
- **Database Upgrade**: Since this represents V2, ensure Prisma migrations (`npm run db:migrate`) reflect the newer schema additions such as `RangeLane`, `OperatingHours`, and `EnvironmentLog`.
- **Startup**: Execute `start-local.ps1` or run `npm run dev` globally. The background stack will launch the Docker container for Postgres, install Node dependencies, setup the Python venv, and boot all interconnected services.
- **Core Operations**: Provides robust real-time lane assignments and RSO overrides via WebSockets. It acts as the command center for a physical shooting range, combining financial endpoints, environmental telemetry from APIs like OpenMeteo, and live scoring.
