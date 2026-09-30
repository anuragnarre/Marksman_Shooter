# Shooter_App Context & Code Structure

## Overview
`Shooter_App` is a full-stack Next.js and NestJS monorepo tailored for the end-users of the Marksman platform: Shooters, Coaches, and Soldiers. Its feature set revolves around individual session tracking, AI coaching, score visualisations, and personal analytics.

## Monorepo Code Structure
```text
Shooter_App/
├── apps/
│   ├── api/                      # Backend API (NestJS, Port 3001)
│   │   ├── prisma/               # Schema definitions and seed scripts
│   │   └── src/                  # Modules: ai-coach, shots, suggestions, auth
│   ├── web/                      # Frontend Application (Next.js 15, Port 3000)
│   │   ├── app/                  # Marketing pages, login, and shooter dashboards
│   │   ├── components/           # Components for AI Coach Chat, Performance Radar, etc.
│   │   └── lib/                  # Utilities for chart themes and API fetching
│   └── vision/                   # Vision Microservice (Python FastAPI, Port 8000)
│       └── pipeline/             # OpenCV algorithms for hit detection on targets
└── packages/
    └── shared-types/             # Unified TypeScript DTOs and Enums
```

## Execution & Workflow
- **Prerequisites**: Node.js 20+, Python 3.11+, and Docker.
- **Configuration**: Requires a properly configured `.env` file containing `DATABASE_URL` and `GROQ_API_KEY` for the AI Coach functionalities.
- **Database**: Launch the PostgreSQL container (`docker-compose up -d db`) and apply Prisma migrations via `npm run db:migrate`.
- **Local Dev Server**: Use `npm run dev` in the root `Shooter_App` directory to launch the API and Web concurrently. For the Vision microservice, activate the Python environment and run Uvicorn (`uvicorn main:app --port 8000`).
- **Core Operations**: Users interact with the Next.js frontend to log shots. The UI sends requests to the NestJS backend, which then coordinates with the FastAPI vision service if image-based shot scoring is required. Finally, the LLM processes session data to generate natural-language feedback.
