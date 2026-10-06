# Range_App Context & Code Structure

## Overview
`Range_App` is a full-stack Next.js and NestJS monorepo specifically geared towards Range Operators, Staff, and Administrators. It manages physical range operations, lane bookings, memberships, environmental data, and real-time range monitoring.

## Monorepo Code Structure
```text
Range_App/
├── apps/
│   ├── api/                      # Backend API (NestJS, Port 3001)
│   │   ├── prisma/               # PostgreSQL schema and migrations
│   │   └── src/                  # Modules: ranges, sessions, analytics, bookings
│   ├── web/                      # Frontend Dashboard (Next.js 15, Port 3000)
│   │   ├── app/                  # App Router pages (dashboards, sessions, config)
│   │   ├── components/           # React Components (UI, target canvas, charts)
│   │   └── hooks/                # Custom React hooks
│   └── vision/                   # Vision Microservice (Python FastAPI, Port 8000)
│       └── main.py               # OpenCV target scoring engine
└── packages/
    └── shared-types/             # TypeScript interfaces shared between frontend & backend
```

## Execution & Workflow
- **Prerequisites**: Node.js 20+, Python 3.11+, and Docker (for PostgreSQL).
- **Environment Setup**: Copy `.env.example` to `.env` in `apps/api/` and `apps/web/`. Configure DB strings and API keys (Groq, etc).
- **Database Initialization**: Run `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` in the `apps/api/` directory.
- **Starting the Stack**: You can run all services concurrently using the provided `start-local.ps1` PowerShell script at the root of this folder, or use `npm run dev` to start the Node services while running the Python vision service in a virtual environment (`apps/vision/venv`).
- **Core Operations**: The API connects to a PostgreSQL database using Prisma. The Next.js frontend fetches data from this API and uses WebSockets (`Socket.IO`) to receive live telemetry and session updates from the vision engine.
