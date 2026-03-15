up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

backend-seed:
	docker compose exec backend python scripts/seed.py

backend-test:
	docker compose exec backend pytest

frontend-lint:
	docker compose exec frontend npm run lint

