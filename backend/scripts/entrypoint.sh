#!/bin/sh
set -e

alembic upgrade head

if [ "${AUTO_SEED_DEMO_DATA}" = "true" ]; then
  python scripts/seed.py
fi

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

