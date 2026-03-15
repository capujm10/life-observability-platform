# Life Observability Platform

> Observe your life like a system. Improve it like a product.

Alternative taglines:
- Turn daily activity into measurable progress.
- Build feedback loops for focus, consistency, and delivery.

## Project Overview

Life Observability Platform (LOP) is a full-stack personal productivity and analytics application built around observability-inspired feedback loops. It combines tasks, habits, journaling, projects, metrics, weekly insights, and GitHub activity into a single operating surface so individual execution can be measured, reviewed, and improved over time.

The repository is structured as a production-minded MVP: a Next.js frontend, a FastAPI backend, PostgreSQL persistence, containerized local development, JWT-based authentication, a CI pipeline, and initial k3s deployment manifests. The architecture stays intentionally simple while still being organized for extension.

## Architecture Summary

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Typed API layer and client-side auth/session handling

### Backend

- FastAPI REST API
- SQLAlchemy ORM
- Pydantic schemas and settings
- Alembic migrations
- Service layer for analytics, summaries, and event processing

### Data and Platform

- PostgreSQL for application data
- Event-based metrics and snapshot analytics
- Docker Compose for local orchestration
- GitHub Actions CI
- Initial k3s manifests under `deploy/k8s`

## Key Features

- Dashboard for tasks, habits, projects, journal prompts, and execution health
- Task, habit, journal, and project CRUD workflows
- Observability-style metrics dashboard backed by events and snapshots
- Weekly summary and weekly insights analytics
- GitHub activity sync integration for repository and commit events
- JWT-based authentication with protected API routes
- Dockerized local development and portfolio-ready CI validation

## Authentication Notes

- `POST /api/v1/auth/login` returns a bearer JWT access token
- `GET /api/v1/auth/me` returns the authenticated user profile
- Protected API routes use the shared FastAPI bearer-token dependency
- Passwords are stored as PBKDF2 hashes
- Local development still supports a seeded demo user for evaluation

Relevant backend auth settings:

- `SECRET_KEY`
- `ACCESS_TOKEN_TTL_HOURS`
- `JWT_ALGORITHM`
- `JWT_ISSUER`

## Local Development

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

Backend validation:

```bash
python -m pytest tests -q
python -m compileall app tests
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend validation:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

For local evaluation, the seeded demo user remains available and the login form is prefilled in the current MVP.

## Docker Instructions

Run the full local stack with Docker Compose:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/api/v1/docs`
- PostgreSQL: `localhost:5432`

Notes:

- The frontend Docker image is production-oriented by default
- `docker-compose.yml` overrides runtime commands so local development still uses the Next.js dev server and FastAPI reload mode

Helpful shortcuts:

```bash
make up
make down
make logs
make backend-seed
make backend-test
make frontend-lint
```

## CI Summary

GitHub Actions workflow: `.github/workflows/ci.yml`

The pipeline includes:

- Backend dependency install, pytest, and `compileall`
- Frontend `npm ci`, lint, TypeScript check, and production build
- Docker Compose configuration validation with temporary env files

## k3s Deployment Summary

Initial manifests live under `deploy/k8s`:

- `namespace.yaml`
- `secret.example.yaml`
- `postgres-pvc.yaml`
- `postgres.yaml`
- `backend.yaml`
- `frontend.yaml`
- `ingress.yaml`

Suggested apply order:

1. Create the namespace.
2. Copy `secret.example.yaml`, replace placeholder values, and apply the real secret.
3. Build and push backend and frontend images, then replace the placeholder image references in the manifests.
4. Apply the PVC, Postgres, backend, frontend, and ingress manifests.

The current manifests target a lightweight ingress-based k3s setup with:

- `lop-postgres`
- `lop-backend`
- `lop-frontend`

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

## Roadmap / Future Improvements

1. Add refresh tokens, session rotation, and revocation support if the product moves beyond single-user MVP usage.
2. Expand analytics with richer trend views, anomaly detection, and longer-range reporting.
3. Move sync and summary workloads into background jobs.
4. Add more integrations such as calendar, notes, and personal knowledge systems.
5. Add image publishing and deployment automation for k3s or other target platforms.
6. Harden secret management, ingress TLS, backups, and environment promotion workflows.
