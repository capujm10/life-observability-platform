# Life Observability Platform

> Observe your life like a system. Improve it like a product.

Alternative taglines:
- Turn daily activity into measurable progress.
- Build feedback loops for focus, consistency, and delivery.

## Project Overview

Life Observability Platform (LOP) is a full-stack personal productivity and analytics application built around observability-inspired feedback loops. It combines tasks, habits, journaling, projects, metrics, weekly insights, and GitHub activity into a single operating surface so individual execution can be measured, reviewed, and improved over time.

The repository is structured as a production-minded MVP: a Next.js frontend, a FastAPI backend, PostgreSQL persistence, containerized local development, JWT-based authentication, GitHub Actions workflows, automated GHCR image publishing, and initial k3s deployment manifests.

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
- GitHub Actions CI and container publishing
- Initial k3s manifests under `deploy/k8s`

## Key Features

- Dashboard for tasks, habits, projects, journal prompts, and execution health
- Task, habit, journal, and project CRUD workflows
- Observability-style metrics dashboard backed by events and snapshots
- Weekly summary and weekly insights analytics
- GitHub activity sync integration for repository and commit events
- JWT-based authentication with protected API routes
- Dockerized local development, CI validation, and container image publishing

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

- The backend Dockerfile supports both local dev and publish flows through `INSTALL_DEV`
- `docker-compose.yml` sets `INSTALL_DEV=true` and keeps local reload behavior
- The frontend Docker image is production-oriented by default
- `docker-compose.yml` still overrides runtime commands so local development uses the Next.js dev server and FastAPI reload mode

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

GitHub Actions workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/publish-images.yml`

The CI workflow includes:

- Backend dependency install, pytest, and `compileall`
- Frontend `npm ci`, lint, TypeScript check, and production build
- Docker Compose configuration validation with temporary env files

The image publishing workflow:

- runs on `push` to `main`
- builds separate backend and frontend production images
- publishes to GitHub Container Registry
- tags each image with `latest` and the full Git SHA

## Published Images

Default image names:

- `ghcr.io/capujm10/life-observability-platform-backend`
- `ghcr.io/capujm10/life-observability-platform-frontend`

Example tags:

- `ghcr.io/capujm10/life-observability-platform-backend:latest`
- `ghcr.io/capujm10/life-observability-platform-backend:<git-sha>`
- `ghcr.io/capujm10/life-observability-platform-frontend:latest`
- `ghcr.io/capujm10/life-observability-platform-frontend:<git-sha>`

GitHub requirements for publishing:

- the workflow uses the built-in `GITHUB_TOKEN`
- workflow permissions must allow `contents: read` and `packages: write`
- for organization-owned repositories, GitHub Actions must be allowed to create and publish GHCR packages

No custom registry secret is required for the workflow itself when publishing to GHCR.

## k3s Deployment Summary

Initial manifests live under `deploy/k8s`:

- `namespace.yaml`
- `secret.example.yaml`
- `postgres-pvc.yaml`
- `postgres.yaml`
- `backend.yaml`
- `frontend.yaml`
- `ingress.yaml`

The backend and frontend deployment manifests are already aligned with the published image names:

- `ghcr.io/capujm10/life-observability-platform-backend:latest`
- `ghcr.io/capujm10/life-observability-platform-frontend:latest`

Suggested apply order:

1. Create the namespace.
2. Copy `secret.example.yaml`, replace placeholder values, and apply the real secret.
3. Customize the ingress host, real secrets, and optionally pin an exact SHA tag instead of `latest`.
4. Apply the PVC, Postgres, backend, frontend, and ingress manifests.

If the GHCR packages remain private, create an image pull secret in the cluster and uncomment the `imagePullSecrets` block in `deploy/k8s/backend.yaml` and `deploy/k8s/frontend.yaml` before rollout.

The current manifests target a lightweight ingress-based k3s setup with:

- `lop-postgres`
- `lop-backend`
- `lop-frontend`

### k3s Production Notes

- Backend, frontend, and Postgres all include baseline readiness and liveness probes.
- Backend and frontend ship with lightweight CPU and memory requests and limits, and Postgres now has a conservative starter resource budget as well.
- Use `latest` only for simple MVP rollouts; pin a Git SHA tag for more predictable deployments.
- Uncomment `imagePullSecrets` only if the GHCR packages are private.
- Before deployment, you still need to set real secrets, a real ingress host, and any cluster-specific TLS or pull-secret configuration.

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
5. Add automated environment deployment on top of the published container images.
6. Harden secret management, ingress TLS, backups, and environment promotion workflows.
