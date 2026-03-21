# CLAUDE.md — Proyecto markdown

Plataforma colaborativa de documentos markdown en tiempo real. Self-hosted, open source.

## Comandos

```bash
make dev        # Levantar todo en Docker con hot reload
make up         # Levantar en modo producción
make down       # Apagar todo
make db         # Solo PostgreSQL (para desarrollo nativo)
make logs       # Ver logs
make test       # Unit tests (API)
make test-e2e   # E2E tests con Playwright (requiere make dev corriendo)
```

## Estructura del proyecto

```
apps/
├── api/                    # NestJS 11 — Backend REST API
│   ├── src/
│   │   ├── common/         # Infraestructura transversal
│   │   │   ├── configuration/infrastructure/   # @nestjs/config + Joi
│   │   │   ├── database/infrastructure/        # TypeORM + migraciones
│   │   │   ├── exception/domain/               # ExceptionServiceInterface
│   │   │   ├── exception/infrastructure/       # ExceptionService + filters
│   │   │   ├── throttler/infrastructure/       # @nestjs/throttler (rate limiting)
│   │   │   └── helpers/                        # decorators, interceptors, middleware, types compartidos
│   │   └── modules/        # Módulos de negocio (auth, users, ...)
│   ├── test/               # E2E tests (Jest + Supertest)
│   ├── .env.example        # Variables de entorno del backend
│   └── Dockerfile
│
├── web/                    # Next.js 16 — Frontend
│   ├── src/
│   │   ├── app/            # Pages (App Router)
│   │   ├── common/         # API client, componentes UI, utilidades
│   │   ├── modules/        # Módulos de negocio (auth, ...)
│   │   └── proxy.ts        # Protección de rutas (antes middleware.ts)
│   ├── .env.example        # Variables de entorno del frontend
│   └── Dockerfile
│
e2e/                        # Tests E2E con Playwright
packages/                   # Configs compartidos (typescript, eslint, jest)
```

## Arquitectura — Backend

Cada módulo sigue Clean Architecture: `domain/` → `application/` → `infrastructure/`.

### Módulo de negocio

```
modules/{feature}/
├── domain/
│   ├── enums/              # {feature}-usecases.enum.ts, {feature}-errors.codes.ts
│   ├── interfaces/         # Contratos (repository, services)
│   ├── types/              # Un type por archivo
│   └── index.ts
├── application/
│   ├── use-cases/          # Clases puras, método run(), factory DI
│   │   └── __tests__/
│   └── index.ts
└── infrastructure/
    ├── api/                # Controllers — @Inject(ProvidersEnum), método run()
    ├── dto/                # class-validator, snake_case
    ├── persistence/        # Entity + ORM repository
    ├── presenters/         # domain → wire format
    ├── services/           # Servicios de infraestructura
    ├── {feature}.module.ts # Factory DI explícita con useFactory
    └── index.ts
```

### Reglas de código (backend)

- **Use cases son clases puras** — sin `@Injectable()` ni `@Inject()`. Se registran con `useFactory` en el module.
- **`run()`** como método público del use case, nunca `execute()`.
- **Controllers** usan `@Inject(ProvidersEnum.USE_CASE)` y método `run()`.
- **ExceptionService** retorna el error, el **use case hace `throw`**: `throw this.exception.notFoundException({...})`.
- **Repository** es el único lugar con `try/catch` — convierte errores de DB a códigos del módulo.
- **Error codes** con dual-message: `{ codeError, message, serverMessage }`. El `serverMessage` solo se loguea, nunca se envía al cliente.
- **NUNCA** `synchronize: true` en TypeORM — solo migraciones.
- **NUNCA** importar de infrastructure en domain o application.
- **snake_case** en wire format (DTOs, API responses), **camelCase** en dominio.
- **Path aliases**: `@common/`, `@modules/` — nunca rutas relativas profundas.
- **Response wrapper**: `{ data, path, request_id, duration, method }`.
- **Error response**: `{ code_error, message, path, request_id, method }`.

### common/ — Qué abstraer

Solo abstraer lo que la capa de aplicación consume:
- `exception/` → tiene `domain/` (interface) + `infrastructure/` (implementación) porque los use cases dependen de ExceptionServiceInterface.
- `configuration/`, `database/`, `throttler/` → solo `infrastructure/` (ningún use case las consume directamente). Toda configuración de infraestructura nueva va aquí como módulo wrapper.
- `helpers/` → decorators, interceptors, middleware, types compartidos.
- **NO wrappear** bcrypt, Logger nativo de NestJS, ni @nestjs/jwt. Uso directo.

## Arquitectura — Frontend

Patrón MVVM. Componentes consumen datos solo desde ViewModels (hooks).

```
modules/{feature}/
├── domain/
│   ├── entities/           # Interfaces
│   └── repositories/       # Contratos
└── infrastructure/
    ├── repositories/       # {feature}-v1.repository.ts (HTTP, snake→camel mapping)
    ├── hooks/              # use-{feature}.viewmodel.ts
    ├── components/         # React components (PascalCase)
    └── state/              # Zustand store
```

### Reglas de código (frontend)

- **Loading state siempre en el store**, nunca local en componentes.
- **CSR** para toda la app autenticada (sin SSR/Server Components).
- **`proxy.ts`** para protección de rutas (no `middleware.ts` — deprecated en Next.js 16).
- API client desenvuelve el response wrapper del backend automáticamente.

## Commits

Seguir **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

```
feat: add user registration endpoint
fix: resolve token cookie not being set on setup
refactor: move exception service to common module
test: add playwright e2e tests for auth flow
chore: update docker compose for dev hot reload
```

**NO** agregar `Co-Authored-By` en los commits.

## Variables de entorno

**Backend** (`apps/api/.env`):
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- `CORS_ORIGIN`, `API_PORT`

**Frontend** (`apps/web/.env`):
- `NEXT_PUBLIC_API_URL` — URL del API para el browser
- `API_INTERNAL_URL` — URL interna para el proxy server-side (en Docker: `http://api:3000`)

## Docker

- `make dev` → hot reload, volume mounts de `src/`, target `dev` del Dockerfile
- `make up` → producción, imágenes buildeadas, target `runner` del Dockerfile
- Los Dockerfiles están en cada app (`apps/api/Dockerfile`, `apps/web/Dockerfile`)
- `docker-compose.dev.yml` overridea `docker-compose.yml` para desarrollo

## Testing

- **Unit tests**: Jest, co-located en `__tests__/` dentro de cada use case
- **API E2E**: Jest + Supertest en `apps/api/test/` (requiere PostgreSQL)
- **Playwright E2E**: `e2e/` en la raíz (requiere `make dev` corriendo)

### Flujo de testing en cada story

```
1. Pre-check  → make test + make test-e2e    (verificar codebase sano)
2. Desarrollar story
3. Post-check → make test + make test-e2e    (verificar cero regresiones)
4. QA         → generar nuevos tests en e2e/ (happy + fail path, API + UI)
5. Run all    → make test + make test-e2e    (suite completa)
```

Los tests Playwright deben cubrir:
- **Happy path**: flujo completo del usuario
- **Fail path**: validaciones, errores de API mostrados en UI, rutas protegidas
- **API directo**: status codes, validación de DTOs, error codes

## Flujo de desarrollo de stories

Cada historia de usuario (HU) sigue este ciclo completo. **Todos los pasos son obligatorios.**

### Requisito previo

`make dev` debe estar corriendo (Docker con PostgreSQL + API + Web).

### Ciclo de ejecución

```
 1. Pre-check       → make test + make test-e2e
                       Verificar que el codebase está sano ANTES de empezar.
                       Si fallan, NO empezar — corregir primero.

 2. Create Story    → /bmad-create-story
                       Crear story spec desde la épica con contexto completo.

 3. Validate Story  → Validar ACs, tasks, dev notes contra checklist.

 4. Git             → git checkout -b feat/{story-key} develop

 5. Dev Story       → /bmad-dev-story
                       Implementar código siguiendo tasks de la story.

 6. Post-check      → make test + make test-e2e
                       Verificar cero regresiones tras implementar.
                       Si fallan, corregir antes de continuar.

 7. QA              → Generar nuevos tests Playwright en e2e/ para la story.
                       - Happy path: flujo completo del usuario
                       - Fail path: validaciones, errores de API en UI, rutas protegidas
                       - API directo: status codes, DTOs, error codes
                       Correr suite completa: make test + make test-e2e

 8. Code Review     → /bmad-code-review
                       Revisar código adversarialmente.
                       Corregir patches encontrados.

 9. Commits         → Conventional Commits en la rama feat/.
                       feat:, fix:, test:, docs:, chore:
                       SIN Co-Authored-By.

10. Reportar        → Resumen de lo implementado + resultado de tests.
```

### Reglas del ciclo

- **No saltar pasos.** Pre-check y post-check son obligatorios.
- **No desarrollar sobre código roto.** Si pre-check falla, arreglar primero.
- **Tests cubren happy + fail path.** No solo el camino feliz.
- **Una rama por story.** `feat/{story-key}` desde develop.
- **Sin intervención.** El ciclo se ejecuta completo sin pausas ni confirmaciones. Solo se detiene ante un blocker técnico real.

### Ejemplo

```bash
# El desarrollador dice "siguiente story" y Claude ejecuta:

# 1. Pre-check
make test && make test-e2e

# 2-3. Create + Validate story
# (automático via BMad skills)

# 4. Rama
git checkout -b feat/1-2-login-gestion-sesion develop

# 5. Implementar
# (automático via /bmad-dev-story)

# 6. Post-check
make test && make test-e2e

# 7. QA — nuevos tests + suite completa
# (genera tests en e2e/ + corre make test-e2e)

# 8. Code review
# (automático via /bmad-code-review)

# 9. Commits
git add ... && git commit -m "feat: add login and session management"
```

## BMad (opcional)

Si usas Claude Code con BMad para gestión de stories:

```bash
npx bmad install
```

Esto genera `_bmad/` y `.claude/skills/bmad-*/`. Los artefactos de planning están en `_bmad-output/`.
