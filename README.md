# Life Observability Platform

> Observe your life like a system. Improve it like a product.

Alternative taglines:
- Turn daily activity into measurable progress.
- Build feedback loops for focus, consistency, and delivery.

## Project Overview

Life Observability Platform (LOP) is a full-stack productivity platform that applies observability-inspired thinking to personal execution. It brings together tasks, habits, journaling, project tracking, weekly insights, and GitHub activity into a single operating surface so you can monitor behavior, identify patterns, and improve with signal instead of guesswork.

The product is designed as a portfolio-ready MVP with a clean separation between frontend, API, analytics services, and persistence. It supports day-to-day execution while also surfacing higher-level personal analytics such as throughput, consistency, reflection cadence, delivery momentum, and weekly trend summaries.

## Features

- Unified dashboard for tasks, habits, journaling, projects, and metrics
- Observability-style metrics system built on event and snapshot data
- Task, habit, journal, and project CRUD workflows
- Weekly summary and weekly insights analytics
- GitHub activity sync integration for repository and commit events
- Settings and theme preferences
- Demo authentication flow for local evaluation
- PostgreSQL-backed data model with Alembic migrations
- Docker-based local development for frontend, backend, and database services

## Architecture

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Typed API client layer and reusable UI components

### Backend

- FastAPI REST API
- SQLAlchemy ORM models and service layer
- Pydantic schemas
- Alembic migrations

### Data and Analytics

- PostgreSQL persistence
- Event-based metrics for actions such as completions, journal activity, project updates, and GitHub syncs
- Snapshot-based personal analytics for focus time and related trends
- Weekly aggregation services for summaries and insights

### Infrastructure

- Docker and Docker Compose for local orchestration
- Separate frontend, backend, and database containers
- Environment-based configuration for local and containerized development

## Tech Stack

- Frontend: Next.js 16.1.6, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic Settings, Alembic, Uvicorn
- Database: PostgreSQL
- Tooling: Docker, Docker Compose, pytest, ESLint

## Local Setup

Create local environment files from the bundled examples:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .[dev]
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

When the seed script has been run, use the prefilled demo credentials on the login screen to inspect the platform state.

## Docker Setup

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

Available services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/api/v1/docs`
- PostgreSQL: `localhost:5432`

Helpful shortcuts:

```bash
make up
make down
make logs
make backend-seed
make backend-test
```

## API Overview

Key REST endpoints under `/api/v1`:

- `GET /health`
- `POST /auth/login`
- `GET /auth/me`
- `GET /dashboard/overview`
- `GET|POST|PUT|DELETE /tasks`
- `GET|POST|PUT|DELETE /habits`
- `POST /habits/{habit_id}/logs`
- `GET|POST|PUT|DELETE /journal-entries`
- `GET|POST|PUT|DELETE /projects`
- `POST /projects/{project_id}/updates`
- `GET /metrics/overview`
- `GET /weekly-summary/current`
- `GET /weekly-insights`
- `POST /integrations/github/sync`
- `GET|PUT /settings`

## Future Improvements / Roadmap

1. Replace demo authentication with production-grade auth and session management.
2. Add richer analytics visualizations, anomaly detection, and longitudinal reporting.
3. Introduce background jobs for sync ingestion, summary generation, and scheduled analytics.
4. Expand integrations beyond GitHub to calendar, notes, and knowledge systems.
5. Add CI for backend tests, frontend lint/typecheck/build, and container validation.
6. Harden deployment targets with environment-specific infrastructure and release workflows.
