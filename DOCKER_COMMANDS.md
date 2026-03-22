# Docker Commands Reference

Commands for users without `make` (Windows without WSL). These are the raw `docker compose` equivalents.

All commands run from the project root.

## Development

```bash
# Start all services (hot reload, installs deps on startup)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild images (only needed if Dockerfile or Node version changes)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Package Management

```bash
# Add a package to the API
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api pnpm add <package>

# Add a package to the Web
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec web pnpm add <package>

# Add a dev dependency
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api pnpm add -D <package>
```

## Testing

```bash
# Unit tests (runs inside container)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec api pnpm --filter api test

# E2E tests with Playwright (runs on host, requires dev running)
pnpm test:playwright
```

## Production

```bash
# Start in production mode
docker-compose up --build -d
```

## Stop & Cleanup

```bash
# Stop all services
docker-compose down

# Stop all + delete node_modules volume (fresh install on next start)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

## Other

```bash
# Only database (for native development)
docker-compose up postgres -d

# View logs
docker-compose logs -f
```
