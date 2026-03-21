# markdown

Plataforma colaborativa de documentos markdown en tiempo real. Self-hosted, open source.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) >= 18 (solo para desarrollo nativo)
- [pnpm](https://pnpm.io/) 8.15.5 (solo para desarrollo nativo)

## Quick Start

```bash
# Clonar el repositorio
git clone <repo-url> && cd markdown

# Copiar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Levantar todo con Docker (hot reload)
make dev
```

Accede a `http://localhost:3001` y crea tu cuenta de administrador.

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `make dev` | Levantar en desarrollo con hot reload |
| `make dev-build` | Rebuild de imagenes (tras cambiar Dockerfile o dependencias) |
| `make up` | Levantar en modo produccion |
| `make down` | Apagar todos los servicios |
| `make db` | Solo PostgreSQL (para desarrollo nativo) |
| `make logs` | Ver logs de todos los servicios |
| `make test` | Unit tests (API) |
| `make test-e2e` | E2E tests con Playwright (requiere `make dev` corriendo) |

## Desarrollo nativo (sin Docker para apps)

Si prefieres correr las apps fuera de Docker para un debug mas directo:

```bash
# Solo la base de datos en Docker
make db

# Terminal 1: API
cd apps/api && npx nest start --watch

# Terminal 2: Web
cd apps/web && npx next dev --turbopack --port 3001
```

## Tech Stack

| Capa | Tecnologia |
|------|------------|
| **Backend** | NestJS 11, TypeORM 0.3, PostgreSQL 16 |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Zustand |
| **Auth** | JWT (access + refresh tokens), bcrypt, Passport |
| **Testing** | Jest, Supertest, Playwright |
| **Infra** | Docker, Docker Compose, Turborepo |

## Arquitectura

El proyecto sigue Clean Architecture con separacion estricta de capas:

```
apps/
├── api/                     # NestJS — REST API
│   └── src/
│       ├── common/          # Exception service, helpers, config, database
│       └── modules/         # Modulos de negocio (auth, users, ...)
│           └── {feature}/
│               ├── domain/          # Types, interfaces, error codes
│               ├── application/     # Use cases (logica de negocio pura)
│               └── infrastructure/  # Controllers, repositories, DTOs
│
├── web/                     # Next.js — Frontend
│   └── src/
│       ├── common/          # API client, componentes UI
│       └── modules/         # Modulos con patron MVVM
│           └── {feature}/
│               ├── domain/          # Entities, repository interfaces
│               └── infrastructure/  # Repositories, hooks, components, state
│
e2e/                         # Tests E2E con Playwright
```

Para mas detalle sobre patrones y convenciones, ver [CLAUDE.md](CLAUDE.md).

## Variables de entorno

### Backend (`apps/api/.env`)

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | Host de PostgreSQL | `localhost` |
| `DATABASE_PORT` | Puerto de PostgreSQL | `5432` |
| `DATABASE_USERNAME` | Usuario de PostgreSQL | `markdown` |
| `DATABASE_PASSWORD` | Password de PostgreSQL | `markdown_secret` |
| `DATABASE_NAME` | Nombre de la base de datos | `markdown` |
| `JWT_SECRET` | Secret para access tokens | (requerido) |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | (requerido) |
| `JWT_EXPIRATION` | Expiracion del access token | `15m` |
| `JWT_REFRESH_EXPIRATION` | Expiracion del refresh token | `7d` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3001` |
| `API_PORT` | Puerto del API | `3000` |

### Frontend (`apps/web/.env`)

| Variable | Descripcion | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del API (browser) | `http://localhost:3000` |
| `API_INTERNAL_URL` | URL interna del API (server-side proxy) | `http://localhost:3000` |

## Testing

```bash
# Unit tests
make test

# E2E tests (con la app corriendo)
make dev          # en una terminal
make test-e2e     # en otra terminal
```

## Licencia

[MIT](LICENSE)
