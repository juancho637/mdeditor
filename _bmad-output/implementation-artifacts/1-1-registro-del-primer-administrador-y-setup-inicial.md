# Story 1.1: Registro del Primer Administrador y Setup Inicial

Status: review

## Story

As a **primer usuario (administrador)**,
I want **acceder a la plataforma recién desplegada y crear mi cuenta de administrador**,
so that **pueda comenzar a configurar el workspace e invitar a mi equipo**.

## Acceptance Criteria

1. **Given** la plataforma está desplegada por primera vez con `docker compose up`
   **When** accedo a la URL de la plataforma
   **Then** veo la pantalla de setup inicial con formulario de registro (nombre, email, contraseña)
   **And** la contraseña requiere mínimo 8 caracteres con validación inline al perder foco

2. **Given** completo el formulario de setup inicial con datos válidos
   **When** envío el formulario
   **Then** se crea mi cuenta de administrador con contraseña hasheada con bcrypt
   **And** inicio sesión automáticamente con tokens JWT (access + refresh)
   **And** soy redirigido al dashboard con empty state ("Bienvenido a markdown. Crea tu primera carpeta")

3. **Given** ya existe al menos un administrador en el sistema
   **When** accedo a la URL de la plataforma sin estar autenticado
   **Then** veo la pantalla de login en lugar del setup inicial

4. **Given** no estoy autenticado
   **When** intento acceder a cualquier ruta protegida del dashboard
   **Then** soy redirigido a la pantalla de login

## Tasks / Subtasks

### Backend — Infraestructura Base

- [x] Task 1: Docker Compose + PostgreSQL + Environment Config (AC: #1)
  - [x] Crear `docker-compose.yml` con servicios: `api`, `web`, `postgres` (PostgreSQL 16)
  - [x] Crear `docker-compose.dev.yml` override para desarrollo (solo `postgres`)
  - [x] Crear `Dockerfile.api` y `Dockerfile.web` multi-stage
  - [x] Crear `.env.example` con todas las variables requeridas
  - [x] Instalar `@nestjs/config` + `joi` en `apps/api`
  - [x] Crear `apps/api/src/common/configuration/infrastructure/configuration.module.ts` con validación Joi
  - [x] Crear `apps/api/src/common/database/infrastructure/database.module.ts` con TypeORM config
  - [x] Variables requeridas: todas configuradas

- [x] Task 2: TypeORM Setup + User Entity + Migración (AC: #2)
  - [x] Instalar `typeorm@0.3.28`, `pg`, `@nestjs/typeorm`
  - [x] Configurar TypeORM en DatabaseModule con `synchronize: false`
  - [x] Crear entity `user.entity.ts` con todas las columnas
  - [x] Crear primera migración `CreateUsersTable`
  - [x] Configurar scripts de migraciones en `package.json`

- [x] Task 3: Common Module (AC: #1, #2, #3, #4)
  - [x] Crear `common/exception/` con domain (ExceptionServiceInterface) + infrastructure (ExceptionService, ExceptionFilter, ExceptionModule)
  - [x] Crear `common/helpers/infrastructure/interceptors/response.interceptor.ts`
  - [x] Crear `common/helpers/infrastructure/interceptors/logging.interceptor.ts`
  - [x] Crear `common/helpers/infrastructure/middleware/request-id.middleware.ts`
  - [x] Crear `common/helpers/infrastructure/decorators/` (request-id, auth-user, auth)
  - [x] Configurar `ValidationPipe` global en main.ts

- [x] Task 4: Auth Module — JWT + bcrypt + Guards (AC: #2, #3, #4)
  - [x] Instalar todas las dependencias de auth
  - [x] Crear domain types, interfaces, enums en `modules/auth/domain/`
  - [x] Crear `AuthenticatedUserType` en `common/helpers/domain/types/`
  - [x] Crear JWT strategy, guard, auth decorator
  - [x] Crear `auth.module.ts` con factory DI

- [x] Task 5: Users Module — Repository + Create User Use Case (AC: #2)
  - [x] Crear domain types, interfaces, enums en `modules/users/domain/`
  - [x] Crear `user-orm.repository.ts` con ExceptionService para errores
  - [x] Crear `user.presenter.ts`
  - [x] Crear `create-user.use-case.ts` (clase pura, bcrypt directo)
  - [x] Crear `users.module.ts` con factory DI

- [x] Task 6: Setup Inicial Endpoint — POST /api/auth/setup (AC: #1, #2, #3)
  - [x] Crear `setup.dto.ts` con class-validator
  - [x] Crear `setup.use-case.ts` (verifica no existan usuarios, crea admin, genera tokens)
  - [x] Crear `setup.controller.ts` — POST /api/auth/setup
  - [x] Crear `status.controller.ts` — GET /api/auth/status

- [x] Task 7: Health Check (AC: #1)
  - [x] Crear `health.controller.ts` — GET /api/health
  - [x] Configurar Helmet en main.ts

### Frontend — Setup y Auth UI

- [x] Task 8: Next.js Base + Tailwind + shadcn/ui + Design Tokens (AC: #1)
  - [x] Instalar y configurar Tailwind CSS v4 con PostCSS
  - [x] Crear componentes shadcn/ui: Button, Input, Label, Card
  - [x] Configurar design tokens (light + dark) en globals.css
  - [x] Configurar fuentes Inter + JetBrains Mono via next/font
  - [x] Configurar escala tipográfica, spacing, border-radius

- [x] Task 9: Frontend Auth Module — Estructura + API Client (AC: #1, #2, #3, #4)
  - [x] Crear API client con Axios + interceptors
  - [x] Crear auth module: domain (entities, repositories), infrastructure (repository, state, hooks, components)
  - [x] Zustand store con user, isAuthenticated, isSetupCompleted, loading

- [x] Task 10: Pantalla de Setup Inicial (AC: #1, #2)
  - [x] Crear ruta /setup con RegisterForm
  - [x] Validación inline al blur + password strength indicator
  - [x] POST /api/auth/setup → store tokens → redirect dashboard

- [x] Task 11: Pantalla de Login Básica (AC: #3)
  - [x] Crear ruta /sign-in con SignInForm (UI básica)

- [x] Task 12: Dashboard con Empty State (AC: #2)
  - [x] Dashboard layout con header 48px
  - [x] EmptyState component con mensaje "Bienvenido a markdown"

- [x] Task 13: Protección de Rutas + Routing Logic (AC: #3, #4)
  - [x] Next.js middleware con lógica de setup/auth/redirect
  - [x] Token storage en localStorage + cookies

### Testing

- [x] Task 14: Unit Tests — Use Cases (AC: #1, #2, #3)
  - [x] Test `setup.use-case.spec.ts` — crea admin cuando no hay usuarios, falla si ya existe admin (2 tests)
  - [x] Test `create-user.use-case.spec.ts` — crea usuario con hash, valida email único (2 tests)

- [ ] Task 15: E2E Test — Setup Flow (AC: #1, #2, #3, #4)
  - [ ] Test `auth.e2e-spec.ts` — requiere PostgreSQL corriendo, se ejecutará en CI/CD

## Dev Notes

### Infraestructura Fundacional

Esta es la **primera story** del proyecto. El starter `create-turbo` ya está inicializado con NestJS 11 + Next.js 16 + Turborepo. Las apps `api` y `web` existen con código boilerplate mínimo. El objetivo es establecer TODA la infraestructura fundacional sobre la que se construyen las demás stories.

### Patrón Clean Architecture — OBLIGATORIO

Seguir estrictamente la estructura de carpetas definida en la arquitectura:

```
apps/api/src/modules/{feature}/
├── domain/           # Types, interfaces, enums, error codes
│   ├── interfaces/   # Contratos (un archivo por interfaz)
│   ├── types/        # Un type por archivo
│   ├── {feature}-providers.enum.ts
│   ├── {feature}-errors.codes.ts
│   └── index.ts
├── application/
│   └── use-cases/    # Un use case por archivo
│       └── __tests__/ # Tests co-located
└── infrastructure/
    ├── api/           # Controllers (un controller por acción)
    ├── dto/           # DTOs con class-validator
    ├── persistence/   # Entities + ORM repositories
    ├── presenters/    # Domain → wire format
    ├── guards/
    ├── strategies/
    └── {feature}.module.ts
```

### Reglas de Código Críticas

- **NUNCA** `synchronize: true` en TypeORM — solo migraciones
- **NUNCA** try/catch en controllers o use cases — solo en repositories
- **NUNCA** importar de infrastructure en domain o application
- Use cases reciben `authUser` ya validado, **NUNCA** validan permisos
- snake_case en wire format (DTOs, API responses), camelCase en dominio
- Un archivo = una responsabilidad
- DI explícita con providers/tokens (providers.enum.ts)
- Response wrapper obligatorio: `{ data, path, duration, requestId, method }`
- Error format: `{ code_error, message, path, request_id, method }` — `serverMessage` solo se loguea, NUNCA se envía al cliente

### Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas DB | snake_case plural | `users` |
| Columnas DB | snake_case | `password_hash`, `is_admin`, `created_at` |
| Endpoints REST | `/api/{recurso_plural}` | `/api/auth/setup` |
| Use cases | `{action}-{feature}.use-case.ts` | `setup.use-case.ts` |
| Controllers | `{action}-{feature}.controller.ts` | `setup.controller.ts` |
| Entities | `{feature}.entity.ts` | `user.entity.ts` |
| DTOs | `{action}-{feature}.dto.ts` | `setup.dto.ts` |
| Error codes | 3-letra + número | `AUT001`, `USR001` |

### Frontend — MVVM Pattern

```
apps/web/src/modules/{feature}/
├── domain/
│   ├── entities/       # Interfaces
│   ├── repositories/   # Contratos
│   └── types/
├── application/
│   └── use-cases/
└── infrastructure/
    ├── repositories/   # {feature}-v1.repository.ts
    ├── hooks/          # use-{feature}.viewmodel.ts (ViewModels)
    ├── components/     # React components (PascalCase)
    ├── state/          # Zustand store
    └── {feature}.module.ts
```

- Componentes React consumen datos SOLO desde ViewModels (hooks)
- Loading state SIEMPRE en el store, nunca local en componentes
- CSR para toda la app autenticada (sin SSR/Server Components)

### Design Tokens Exactos (UX-DR1)

Los design tokens deben implementarse como CSS Variables en `globals.css`, mappeados a las clases de Tailwind. Valores exactos especificados en Task 8. El cambio de tema debe ser instantáneo sin recarga.

### Validación de Formularios (UX-DR17)

Dos capas de validación:
1. **Frontend inline** al perder foco (blur) — feedback inmediato por campo
2. **Backend** al enviar — validación con `class-validator`

Estados de campos: default → focus → filled → error → disabled. Error messages específicos por campo, no genéricos.

### Jerarquía de Botones (UX-DR15)

5 niveles: primario, secundario, ghost, destructivo, link. Regla: máximo 1 botón primario por contexto visible. Destructivos solo en dialogs de confirmación.

### Tokens JWT

- Access token: 15-30min, enviado en header Authorization o cookie
- Refresh token: 7-30 días, HTTP-only cookie
- En esta story solo se implementa la generación en el setup; el refresh flow completo es Story 1.2

### Dependencias a Instalar (Backend)

```
# apps/api
pnpm add @nestjs/config joi @nestjs/typeorm typeorm@0.3.28 pg
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
pnpm add class-validator class-transformer
pnpm add helmet uuid
pnpm add -D @types/bcrypt @types/passport-jwt @types/uuid
```

### Dependencias a Instalar (Frontend)

```
# apps/web
pnpm add zustand axios
# shadcn/ui via CLI: npx shadcn@latest init
# Luego agregar componentes: npx shadcn@latest add button input label form toast
```

### Project Structure Notes

- El monorepo ya tiene `apps/api` y `apps/web` con boilerplate de `create-turbo`
- Se debe limpiar el boilerplate (app.controller, app.service existentes) y reemplazar con la estructura de módulos
- `packages/ui` existe para componentes compartidos pero en esta story se configura shadcn/ui directamente en `apps/web`
- El `tsconfig.json` base y `turbo.json` ya existen — no modificar a menos que sea necesario

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Modelo de datos `users`
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — JWT strategy, bcrypt, Helmet
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Clean Architecture structure, naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Docker Compose, @nestjs/config
- [Source: _bmad-output/planning-artifacts/epic-01-auth-workspace.md#Story 1.1] — Acceptance criteria, technical note
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation] — shadcn/ui, Tailwind, Radix UI
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — Color palette, typography, spacing, border-radius
- [Source: _bmad-output/planning-artifacts/epics.md#Additional Requirements] — TypeORM 0.3.28, class-validator, Helmet, response wrapper format

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Backend restructured 3x to align with clean-architecture-reference.md patterns
- Adopted pragmatic approach: ExceptionService abstracted (consumed by use cases), bcrypt/Logger/JWT used directly
- Path aliases (@common/, @modules/) configured for clean imports

### Completion Notes List

- Backend: 7 tasks complete — Docker, TypeORM, Common (exception/helpers), Auth module, Users module, Setup endpoint, Health check
- Frontend: 6 tasks complete — Tailwind + design tokens, Auth module (MVVM), Setup screen, Login screen, Dashboard empty state, Route protection middleware
- Tests: 4 unit tests passing (SetupUseCase: 2, CreateUserUseCase: 2)
- E2E tests pending (Task 15) — require PostgreSQL, suitable for CI/CD
- Both apps build successfully (nest build + next build)

### Change Log

- 2026-03-20: Initial implementation of Story 1-1 (Tasks 1-14)

### File List

**Root:**
- .env.example
- docker-compose.yml
- docker-compose.dev.yml
- Dockerfile.api
- Dockerfile.web

**Backend (apps/api/src/):**
- app.module.ts, main.ts
- common/configuration/infrastructure/configuration.module.ts
- common/database/infrastructure/database.module.ts
- common/database/migrations/1710900000000-CreateUsersTable.ts
- common/exception/domain/ (5 files: interfaces, providers enum, index)
- common/exception/infrastructure/ (4 files: service, filter, module, index)
- common/helpers/domain/types/authenticated-user.type.ts
- common/helpers/infrastructure/decorators/ (auth, auth-user, request-id)
- common/helpers/infrastructure/interceptors/ (response, logging)
- common/helpers/infrastructure/middleware/request-id.middleware.ts
- modules/auth/domain/enums/ (auth-usecases.enum, auth-errors.codes)
- modules/auth/domain/types/ (token-payload, sign-in)
- modules/auth/domain/interfaces/auth-service.interface.ts
- modules/auth/application/use-cases/setup.use-case.ts (+spec)
- modules/auth/infrastructure/api/ (setup, status, health controllers)
- modules/auth/infrastructure/dto/setup.dto.ts
- modules/auth/infrastructure/guards/jwt-auth.guard.ts
- modules/auth/infrastructure/strategies/jwt.strategy.ts
- modules/auth/infrastructure/services/auth.service.ts
- modules/auth/infrastructure/auth.module.ts
- modules/users/domain/enums/ (users-providers.enum, users-errors.codes)
- modules/users/domain/types/ (user, create-user)
- modules/users/domain/interfaces/user-repository.interface.ts
- modules/users/application/use-cases/create-user.use-case.ts (+spec)
- modules/users/infrastructure/persistence/ (user.entity, user-orm.repository)
- modules/users/infrastructure/presenters/user.presenter.ts
- modules/users/infrastructure/users.module.ts

**Frontend (apps/web/src/):**
- middleware.ts
- app/layout.tsx, app/globals.css
- app/(auth)/setup/page.tsx
- app/(auth)/sign-in/page.tsx
- app/dashboard/layout.tsx, app/dashboard/page.tsx
- common/adapters/api-client.ts
- common/components/EmptyState.tsx
- common/components/ui/ (button, input, label, card)
- common/lib/utils.ts
- modules/auth/domain/entities/auth.ts
- modules/auth/domain/repositories/auth-repository.ts
- modules/auth/infrastructure/repositories/auth-v1.repository.ts
- modules/auth/infrastructure/state/auth.state.ts
- modules/auth/infrastructure/hooks/use-auth.viewmodel.ts
- modules/auth/infrastructure/components/ (RegisterForm, SignInForm)
