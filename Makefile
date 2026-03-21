.PHONY: dev dev-build up down db logs test test-e2e

# Development: hot reload inside Docker
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Development: rebuild images (run after changing Dockerfile or package.json)
dev-build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production: optimized containers
up:
	docker compose up --build -d

# Stop all services
down:
	docker compose down

# Only database (for running apps natively)
db:
	docker compose up postgres -d

# View logs
logs:
	docker compose logs -f

# Unit tests (no DB required)
test:
	pnpm --filter api test

# E2E tests with Playwright (requires make dev running)
test-e2e:
	pnpm test:playwright
