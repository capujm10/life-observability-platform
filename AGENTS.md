# AGENTS.md

## Repo Layout

- `frontend/`: Next.js App Router UI with TypeScript and Tailwind
- `backend/`: FastAPI API, SQLAlchemy models, Alembic migrations, tests
- `deploy/k8s/`: initial k3s manifests
- `.github/workflows/`: CI automation

## Run Commands

- Backend: `cd backend && pip install -e .[dev] && python -m pytest tests -q`
- Backend compile check: `cd backend && python -m compileall app tests`
- Frontend: `cd frontend && npm install && npm run dev`
- Frontend validation: `cd frontend && npm run lint && npx tsc --noEmit && npm run build`
- Docker Compose: `Copy-Item .env.example .env`, `Copy-Item backend/.env.example backend/.env`, `Copy-Item frontend/.env.example frontend/.env`, then `docker compose up --build`

## Constraints

- Preserve the current route structure and service-layer split unless a change is clearly auth, deployment, or bug-fix related.
- Do not casually rename environment variables, database identifiers, or API paths.
- Keep branding as `Life Observability Platform`.
- Prefer additive changes over refactors.

## Done Means

- Backend tests pass.
- Frontend lint, type check, and production build pass.
- Docker Compose config remains valid.
- Docs are updated when behavior or deployment setup changes.
