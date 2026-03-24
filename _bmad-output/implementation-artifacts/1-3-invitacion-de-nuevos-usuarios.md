# Story 1.3: Invitación de Nuevos Usuarios

Status: done

## Story

As a **administrador**,
I want **invitar nuevos usuarios al workspace generando un link de registro**,
so that **mi equipo pueda crear sus cuentas y acceder a la plataforma**.

## Acceptance Criteria

1. **Given** soy administrador y navego a Configuración → Usuarios
   **When** ingreso un email válido y hago clic en "Invitar"
   **Then** se genera un link de invitación único vinculado a ese email
   **And** veo un toast de confirmación "Invitación creada"
   **And** el link aparece copiable en la interfaz para compartirlo manualmente

2. **Given** recibo un link de invitación válido
   **When** lo abro en el navegador
   **Then** veo un formulario de registro con mi email pre-rellenado (solo nombre y contraseña editables)
   **And** al completarlo se crea mi cuenta y accedo al dashboard

3. **Given** soy administrador
   **When** intento invitar un email que ya tiene cuenta activa
   **Then** veo un error inline "Este usuario ya tiene una cuenta"

4. **Given** un link de invitación ya fue utilizado
   **When** intento acceder a él de nuevo
   **Then** veo un mensaje "Esta invitación ya fue utilizada" con link al login

## Tasks / Subtasks

### Backend — Infraestructura

- [ ] Task 1: Migración `CreateInvitationsTable` (AC: #1, #2, #4)
  - [ ] Tabla `invitations`: id (UUID), email (VARCHAR), token (VARCHAR UNIQUE), status (ENUM: 'pending'|'accepted'), invited_by (UUID FK → users.id), created_at (TIMESTAMP), accepted_at (TIMESTAMP nullable)
  - [ ] Índice en `token` para búsqueda rápida
  - [ ] Índice en `email` para validación de duplicados

- [ ] Task 2: Invitation entity + domain types (AC: #1, #2)
  - [ ] `modules/invitations/domain/types/invitation.type.ts` — InvitationType
  - [ ] `modules/invitations/domain/types/create-invitation.type.ts` — CreateInvitationType
  - [ ] `modules/invitations/domain/enums/invitation-status.enum.ts` — InvitationStatus (PENDING, ACCEPTED)
  - [ ] `modules/invitations/domain/enums/invitation-providers.enum.ts` — DI tokens
  - [ ] `modules/invitations/domain/enums/invitation-errors.codes.ts` — INV001-INV004
  - [ ] `modules/invitations/domain/interfaces/invitation-repository.interface.ts` — contrato
  - [ ] `modules/invitations/infrastructure/persistence/invitation.entity.ts` — entidad TypeORM
  - [ ] `modules/invitations/infrastructure/persistence/invitation-orm.repository.ts` — implementación
  - [ ] `modules/invitations/infrastructure/presenters/invitation.presenter.ts` — domain → wire

### Backend — Use Cases

- [ ] Task 3: CreateInvitationUseCase (AC: #1, #3)
  - [ ] Verificar que el usuario autenticado es admin (`authUser.isAdmin`)
  - [ ] Verificar que no existe usuario con ese email (`userRepository.findByEmail`)
  - [ ] Verificar que no existe invitación pendiente para ese email
  - [ ] Generar token UUID v4
  - [ ] Crear invitación con status 'pending'
  - [ ] Retornar la invitación con el link construido: `{FRONTEND_URL}/invite/{token}`

- [ ] Task 4: AcceptInvitationUseCase (AC: #2, #4)
  - [ ] Buscar invitación por token
  - [ ] Si no existe → throw INV001 (invitation not found)
  - [ ] Si status === 'accepted' → throw INV002 (already used)
  - [ ] Crear usuario con `CreateUserUseCase` (isAdmin: false)
  - [ ] Marcar invitación como 'accepted' con accepted_at
  - [ ] Generar tokens JWT (como en sign-in) y setear cookie httpOnly
  - [ ] Retornar access_token

- [ ] Task 5: GetInvitationByTokenUseCase (AC: #2, #4)
  - [ ] Buscar invitación por token
  - [ ] Si no existe → throw INV001
  - [ ] Retornar invitación (para que el frontend sepa el email y status)

- [ ] Task 6: ListInvitationsUseCase (AC: #1)
  - [ ] Retornar todas las invitaciones (para la UI de admin)
  - [ ] Solo accesible por admin

### Backend — Controllers + DTOs

- [ ] Task 7: Controllers y DTOs (AC: #1, #2, #3, #4)
  - [ ] `create-invitation.dto.ts` — email (IsEmail, IsNotEmpty)
  - [ ] `accept-invitation.dto.ts` — name (IsString, IsNotEmpty), password (IsString, MinLength(8))
  - [ ] `create-invitation.controller.ts` — POST `/api/invitations` (requiere @Auth + isAdmin)
  - [ ] `accept-invitation.controller.ts` — POST `/api/invitations/:token/accept` (público)
  - [ ] `get-invitation.controller.ts` — GET `/api/invitations/:token` (público, para verificar status)
  - [ ] `list-invitations.controller.ts` — GET `/api/invitations` (requiere @Auth + isAdmin)

- [ ] Task 8: Registrar módulo (AC: #1, #2)
  - [ ] `invitations.module.ts` con factory DI para todos los use cases
  - [ ] Importar UsersModule (para CreateUserUseCase + UserRepository)
  - [ ] Importar en `app.module.ts`

### Frontend

- [ ] Task 9: Página de Configuración → Usuarios (AC: #1, #3)
  - [ ] Ruta `/dashboard/settings/users`
  - [ ] Componente `InviteUserForm` — input email + botón "Invitar"
  - [ ] Validación inline al blur (email formato)
  - [ ] Error backend inline ("Este usuario ya tiene una cuenta")
  - [ ] Toast "Invitación creada" al éxito
  - [ ] Link copiable con botón "Copiar" (navigator.clipboard)
  - [ ] Lista de invitaciones pendientes

- [ ] Task 10: Página de aceptar invitación (AC: #2, #4)
  - [ ] Ruta `/invite/[token]`
  - [ ] GET `/api/invitations/:token` para verificar status
  - [ ] Si 'pending' → mostrar RegisterForm con email pre-rellenado y deshabilitado
  - [ ] Si 'accepted' → mostrar mensaje "Esta invitación ya fue utilizada" + link a /sign-in
  - [ ] Si no existe → mostrar error "Invitación no válida"
  - [ ] Al completar registro → POST `/api/invitations/:token/accept` → redirect a /dashboard

- [ ] Task 11: Módulo invitations frontend (AC: #1, #2)
  - [ ] `modules/invitations/domain/types/` — InvitationType, CreateInvitationRequest, etc.
  - [ ] `modules/invitations/domain/repositories/invitation-repository.ts` — contrato
  - [ ] `modules/invitations/infrastructure/repositories/invitation-v1.repository.ts` — HTTP
  - [ ] `modules/invitations/infrastructure/state/invitation.state.ts` — Zustand store
  - [ ] `modules/invitations/infrastructure/hooks/use-invitation.viewmodel.ts`

- [ ] Task 12: Navegación a Settings (AC: #1)
  - [ ] Agregar link "Configuración" en dashboard sidebar/header (solo para admin)
  - [ ] Layout de settings con tabs o sidebar (Usuarios, Grupos — grupos es story 1-4)

### Testing

- [ ] Task 13: Unit tests (AC: #1, #2, #3, #4)
  - [ ] `create-invitation.use-case.spec.ts` — crea invitación, falla si email existe, falla si invitación pendiente
  - [ ] `accept-invitation.use-case.spec.ts` — acepta invitación, falla si ya usada, falla si no existe
  - [ ] `get-invitation-by-token.use-case.spec.ts` — retorna invitación, falla si no existe

## Dev Notes

### Qué YA existe (NO recrear)

**Backend:**
- `CreateUserUseCase` — crea usuario con bcrypt hash. Reutilizar para crear el usuario invitado.
- `AuthService.generateTokens()` — genera access + refresh tokens.
- `setRefreshTokenCookie()` — setea cookie httpOnly para refresh token.
- `@Auth()` decorator — guarda ruta con JWT guard.
- `@AuthUser()` decorator — extrae `AuthenticatedUserType` del request.
- `ExceptionService` — para lanzar errores de negocio.
- `UserRepository.findByEmail()` — verificar si email ya existe.

**Frontend:**
- `RegisterForm` — ya existe con name + email + password + validación. Reutilizar/adaptar para invitación (email pre-rellenado + deshabilitado).
- `apiClient` — con interceptors, withCredentials, token refresh.
- `useAuthViewModel` — ya tiene `setup()` que almacena token. Patrón a seguir para `acceptInvitation()`.

### Error Codes

```
INV001 — Invitation not found
INV002 — Invitation already accepted
INV003 — Email already has an active account
INV004 — Pending invitation already exists for this email
```

### Wire Format

```
POST /api/invitations
Auth: Bearer {access_token} (admin only)
Request:  { "email": "nuevo@equipo.com" }
Response: { "data": { "id": "uuid", "email": "...", "token": "uuid", "status": "pending", "invitation_link": "http://...", "created_at": "..." } }

GET /api/invitations/:token
Response: { "data": { "email": "...", "status": "pending"|"accepted" } }

POST /api/invitations/:token/accept
Request:  { "name": "Nombre", "password": "password123" }
Response: { "data": { "access_token": "..." } }
Set-Cookie: refresh_token (httpOnly)

GET /api/invitations
Auth: Bearer {access_token} (admin only)
Response: { "data": [ { "id", "email", "status", "created_at", "accepted_at" } ] }
```

### Proxy/Routing

- `/invite/[token]` debe ser ruta PÚBLICA (no requiere auth)
- Agregar esta ruta a `proxy.ts` como excepción del check de auth
- `/dashboard/settings/*` requiere auth + verificación de isAdmin en frontend

### Modelo de datos

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  token VARCHAR NOT NULL UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
```

### Archivos a crear

**Backend:**
- `apps/api/src/common/database/migrations/{timestamp}-CreateInvitationsTable.ts`
- `apps/api/src/modules/invitations/domain/types/invitation.type.ts`
- `apps/api/src/modules/invitations/domain/types/create-invitation.type.ts`
- `apps/api/src/modules/invitations/domain/enums/invitation-status.enum.ts`
- `apps/api/src/modules/invitations/domain/enums/invitation-providers.enum.ts`
- `apps/api/src/modules/invitations/domain/enums/invitation-errors.codes.ts`
- `apps/api/src/modules/invitations/domain/interfaces/invitation-repository.interface.ts`
- `apps/api/src/modules/invitations/domain/index.ts`
- `apps/api/src/modules/invitations/application/use-cases/create-invitation.use-case.ts`
- `apps/api/src/modules/invitations/application/use-cases/accept-invitation.use-case.ts`
- `apps/api/src/modules/invitations/application/use-cases/get-invitation-by-token.use-case.ts`
- `apps/api/src/modules/invitations/application/use-cases/list-invitations.use-case.ts`
- `apps/api/src/modules/invitations/application/index.ts`
- `apps/api/src/modules/invitations/infrastructure/persistence/invitation.entity.ts`
- `apps/api/src/modules/invitations/infrastructure/persistence/invitation-orm.repository.ts`
- `apps/api/src/modules/invitations/infrastructure/presenters/invitation.presenter.ts`
- `apps/api/src/modules/invitations/infrastructure/api/create-invitation.controller.ts`
- `apps/api/src/modules/invitations/infrastructure/api/accept-invitation.controller.ts`
- `apps/api/src/modules/invitations/infrastructure/api/get-invitation.controller.ts`
- `apps/api/src/modules/invitations/infrastructure/api/list-invitations.controller.ts`
- `apps/api/src/modules/invitations/infrastructure/dto/create-invitation.dto.ts`
- `apps/api/src/modules/invitations/infrastructure/dto/accept-invitation.dto.ts`
- `apps/api/src/modules/invitations/infrastructure/invitations.module.ts`
- `apps/api/src/modules/invitations/infrastructure/index.ts`

**Frontend:**
- `apps/web/src/modules/invitations/domain/types/*.ts`
- `apps/web/src/modules/invitations/domain/repositories/invitation-repository.ts`
- `apps/web/src/modules/invitations/infrastructure/repositories/invitation-v1.repository.ts`
- `apps/web/src/modules/invitations/infrastructure/state/invitation.state.ts`
- `apps/web/src/modules/invitations/infrastructure/hooks/use-invitation.viewmodel.ts`
- `apps/web/src/modules/invitations/infrastructure/components/InviteUserForm.tsx`
- `apps/web/src/modules/invitations/infrastructure/components/InvitationList.tsx`
- `apps/web/src/app/dashboard/settings/users/page.tsx`
- `apps/web/src/app/dashboard/settings/layout.tsx`
- `apps/web/src/app/invite/[token]/page.tsx`

**Tests:**
- `apps/api/src/modules/invitations/application/use-cases/__tests__/create-invitation.use-case.spec.ts`
- `apps/api/src/modules/invitations/application/use-cases/__tests__/accept-invitation.use-case.spec.ts`
- `apps/api/src/modules/invitations/application/use-cases/__tests__/get-invitation-by-token.use-case.spec.ts`
- `e2e/auth-invitations.spec.ts`

### Archivos a modificar

- `apps/api/src/app.module.ts` — importar InvitationsModule
- `apps/web/src/proxy.ts` — agregar `/invite` como ruta pública
- `apps/web/src/app/dashboard/layout.tsx` — agregar link a settings (admin only)

### Dependencias

No se necesitan dependencias nuevas. Se usa `crypto.randomUUID()` para generar tokens.

### Seguridad

- `POST /api/invitations` requiere JWT + isAdmin check en controller
- `GET /api/invitations` requiere JWT + isAdmin check
- `GET /api/invitations/:token` es público (para que el invitado pueda ver el formulario)
- `POST /api/invitations/:token/accept` es público (crea usuario + genera tokens)
- El token de invitación es UUID v4 — suficientemente entrópico para ser inaddivible

### Previous Story Learnings (1-2)

- Usar `setRefreshTokenCookie()` en el accept-invitation controller para setear cookie httpOnly
- Email debe normalizarse a lowercase antes de cualquier búsqueda
- Respuestas API en snake_case, dominio en camelCase
- Tests E2E: usar `extractCookies()` helper para verificar cookies httpOnly
- Frontend: 1 tipo por archivo, 1 responsabilidad por archivo
- Todos los logs en JSON estructurado con requestId

### References

- [Source: _bmad-output/planning-artifacts/epic-01-auth-workspace.md#Story 1.3] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#API Boundaries] — /api/users (invitations)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Settings] — UI de admin con tabs
- [Source: _bmad-output/implementation-artifacts/1-2-login-y-gestion-de-sesion.md] — Patrones HTTP-only cookies, auth flow

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
