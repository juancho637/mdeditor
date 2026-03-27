# ─────────────────────────────────────────────────────────────
# Makefile — shortcuts for Docker Compose commands
# If you don't have make (Windows without WSL), use the
# docker compose commands directly. See DOCKER_COMMANDS.md
# ─────────────────────────────────────────────────────────────

.PHONY: dev dev-build up down db logs test test-e2e test-e2e-grep add add-dev clean typecheck typecheck-web typecheck-api

DEV_COMPOSE = docker compose -f docker-compose.yml -f docker-compose.dev.yml

# Development: hot reload, installs deps on startup
dev:
	$(DEV_COMPOSE) up

# Development: rebuild images (only if Dockerfile or Node version changes)
dev-build:
	$(DEV_COMPOSE) up --build

# Add a package (runs inside container, updates package.json + lockfile on host)
# Usage: make add PKG="@nestjs/throttler" APP=api
add:
	$(DEV_COMPOSE) exec $(or $(APP),api) sh -c "cd /app/apps/$(or $(APP),api) && pnpm add $(PKG)"

# Add a dev dependency
# Usage: make add-dev PKG="@types/bcrypt" APP=api
add-dev:
	$(DEV_COMPOSE) exec $(or $(APP),api) sh -c "cd /app/apps/$(or $(APP),api) && pnpm add -D $(PKG)"

# Production: optimized containers
up:
	docker compose up --build -d

# Stop all services
down:
	docker compose down

# Stop all + wipe node_modules volume (fresh install on next make dev)
clean:
	$(DEV_COMPOSE) down -v

# Only database (for running apps natively)
db:
	docker compose up postgres -d

# View logs
logs:
	docker compose logs -f

# Unit tests (runs inside container)
test:
	$(DEV_COMPOSE) exec api pnpm --filter api test

# TypeScript type check (runs inside container)
# Usage: make typecheck (both), make typecheck-web, make typecheck-api
typecheck:
	$(DEV_COMPOSE) exec api sh -c "cd /app/apps/api && npx tsc --noEmit"
	$(DEV_COMPOSE) exec web sh -c "cd /app/apps/web && npx tsc --noEmit"

typecheck-web:
	$(DEV_COMPOSE) exec web sh -c "cd /app/apps/web && npx tsc --noEmit"

typecheck-api:
	$(DEV_COMPOSE) exec api sh -c "cd /app/apps/api && npx tsc --noEmit"

# E2E tests with Playwright (runs inside web container)
test-e2e:
	$(DEV_COMPOSE) exec web sh -c "cd /app && pnpm test:playwright"

# E2E tests filtered by grep pattern (runs inside web container)
# Usage: make test-e2e-grep GREP="Story 6-2"
test-e2e-grep:
	$(DEV_COMPOSE) exec web sh -c "cd /app && pnpm test:playwright --grep '$(GREP)'"
