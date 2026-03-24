# Story 1.2: Login y Gestión de Sesión

Status: done

## Story

As a **usuario registrado**,
I want **iniciar sesión con mi email y contraseña y mantener mi sesión activa de forma segura**,
so that **pueda acceder a la plataforma sin re-autenticarme constantemente**.

## Acceptance Criteria

1. **Given** soy un usuario registrado
   **When** ingreso email y contraseña correctos en la pantalla de login
   **Then** inicio sesión exitosamente y veo el dashboard
   **And** recibo un access token (15min) y un refresh token (7 días) en HTTP-only cookie

2. **Given** estoy autenticado y mi access token expira
   **When** realizo cualquier acción en la plataforma
   **Then** el sistema renueva el token automáticamente usando el refresh token sin interrumpir mi sesión

3. **Given** estoy en la pantalla de login
   **When** ingreso credenciales incorrectas
   **Then** veo un mensaje de error genérico ("Credenciales inválidas") sin revelar si el email existe
   **And** tras 5 intentos fallidos en 1 minuto, recibo un error de rate limiting

4. **Given** estoy autenticado
   **When** hago clic en logout
   **Then** mi sesión se invalida, los tokens se revocan y soy redirigido al login

## Tasks / Subtasks

### Backend

- [x] Task 1: Instalar y configurar `@nestjs/throttler` (AC: #3)
  - [x] Instalar `@nestjs/throttler` en `apps/api`
  - [x] Configurar `ThrottlerModule` en `common/throttler/infrastructure/throttler.module.ts` con default generoso (100/min)
  - [x] NO aplicar throttler global — se usa selectivamente con `@Throttle()` en controllers específicos

- [x] Task 2: Agregar `findByEmailWithPassword` al UserRepository (AC: #1)
  - [x] Agregar método `findByEmailWithPassword(email: string): Promise<UserWithPasswordType | null>` a `UserRepositoryInterface`
  - [x] Crear type `UserWithPasswordType` en `modules/users/domain/types/` (extiende UserType + passwordHash)
  - [x] Implementar en `UserOrmRepository` — retorna el entity completo incluyendo `password_hash` → `passwordHash`
  - [x] Este método es necesario porque `findByEmail` retorna `UserType` sin passwordHash (por diseño)

- [x] Task 3: SignInUseCase + Controller + DTO (AC: #1, #3)
  - [x] Crear `sign-in.dto.ts` en `modules/auth/infrastructure/dto/` — email (IsEmail) + password (IsString, MinLength(1))
  - [x] Crear `sign-in.use-case.ts` en `modules/auth/application/use-cases/`
  - [x] Crear `sign-in.controller.ts` en `modules/auth/infrastructure/api/` con @Throttle 5/min
  - [x] Agregar `SIGN_IN_USE_CASE` a `AuthUseCasesEnum`
  - [x] Registrar en `auth.module.ts` con `useFactory`

- [x] Task 4: RefreshTokenUseCase + Controller (AC: #2)
  - [x] Crear `refresh-token.use-case.ts` en `modules/auth/application/use-cases/`
  - [x] Crear `refresh-token.controller.ts` en `modules/auth/infrastructure/api/` POST `/api/auth/refresh`
  - [x] Crear `refresh-token.dto.ts` con campo `refresh_token` (IsString, IsNotEmpty)
  - [x] Agregar `REFRESH_TOKEN_USE_CASE` a `AuthUseCasesEnum`
  - [x] Registrar en `auth.module.ts` con `useFactory`

- [x] Task 5: Unit tests — SignIn y RefreshToken (AC: #1, #2, #3)
  - [x] `sign-in.use-case.spec.ts`: 3 tests (login exitoso, email no encontrado, password incorrecto)
  - [x] `refresh-token.use-case.spec.ts`: 3 tests (refresh exitoso, token inválido, usuario eliminado)

### Frontend

- [x] Task 6: Actualizar API client con refresh token interceptor (AC: #2)
  - [x] Refresh interceptor con cola de requests pendientes y flag isRefreshing
  - [x] Actualizar `auth-v1.repository.ts` con método `refreshToken()`

- [x] Task 7: Mejorar SignInForm con validación UX (AC: #1, #3)
  - [x] Validación inline al blur: email formato válido, password no vacío
  - [x] Error genérico del backend y rate limiting con mensajes claros
  - [x] Loading state en botón + formulario disabled durante submit

- [x] Task 8: Actualizar store y viewmodel para refresh flow (AC: #2, #4)
  - [x] El API client interceptor maneja refresh transparentemente (actualiza localStorage + cookies)
  - [x] Verificado que `logout()` limpia localStorage, cookies, y resetea state completo
  - [x] Viewmodel mejorado para extraer mensajes de error de Axios correctamente

### Testing

- [x] Task 9: Unit tests — use cases del backend (AC: #1, #2, #3)
  - [x] Cubierto en Task 5 — 6 tests totales pasando

## Dev Notes

### Qué YA existe (NO recrear)

**Backend:**
- `AuthService.generateTokens()` — genera accessToken + refreshToken con JwtService. Ya lee JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION de ConfigService.
- `JwtStrategy` — extrae token de Bearer header, valida firma, retorna AuthenticatedUserType.
- `JwtAuthGuard` — guard reutilizable, ya exportado desde AuthModule.
- Error codes: `AUT001` (invalid credentials), `AUT002` (unauthorized), `AUT003` (setup completed).
- `UserOrmRepository` — tiene `findByEmail()`, `findById()`, `create()`, `count()`. Pattern de try/catch con ExceptionService.
- `UserEntity` — UUID pk, name, email, password_hash, is_admin, created_at, updated_at.
- `ExceptionService` con métodos: `badRequestException()`, `unauthorizedException()`, `notFoundException()`, `internalServerErrorException()`, `forbiddenException()`.

**Frontend:**
- `SignInForm` — componente básico funcional con email + password. Ya llama `viewModel.signIn()` y redirige a /dashboard.
- `AuthV1Repository` — ya tiene `signIn()` que POST a `/api/auth/sign-in` y mapea snake_case → camelCase.
- `useAuthViewModel` — ya tiene `signIn()` que llama repository, almacena tokens, maneja loading/error.
- `authStore` (Zustand) — `setTokens()` guarda en localStorage + cookies, `logout()` limpia todo.
- `apiClient` — Axios con interceptor que pone Bearer token y unwraps `response.data.data`.
- `proxy.ts` — protección de rutas server-side, lee `access_token` cookie.

### Patrón de implementación del SignInUseCase

```typescript
// sign-in.use-case.ts — Clase PURA, sin @Injectable()
export class SignInUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly authService: AuthServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: { email: string; password: string }): Promise<SignInType> {
    const user = await this.userRepository.findByEmailWithPassword(data.email);
    if (!user) {
      throw this.exception.badRequestException({
        codeError: AuthErrorsCodes.AUT001.codeError,
        message: AuthErrorsCodes.AUT001.message,
      });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      // MISMO error que email no encontrado — no revelar si el email existe
      throw this.exception.badRequestException({
        codeError: AuthErrorsCodes.AUT001.codeError,
        message: AuthErrorsCodes.AUT001.message,
      });
    }

    return this.authService.generateTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }
}
```

### Rate Limiting — `@nestjs/throttler`

- Instalar: `pnpm add @nestjs/throttler` en `apps/api`
- Configurar en `app.module.ts`: `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])`
- En `sign-in.controller.ts`: `@Throttle({ default: { limit: 5, ttl: 60000 } })` — override estricto
- El throttler usa IP por defecto, que es suficiente para MVP
- Necesita `ThrottlerGuard` como APP_GUARD o aplicado por controller

### Refresh Token Flow — Frontend

```typescript
// api-client.ts — Patrón de refresh con cola de requests
let isRefreshing = false;
let failedQueue: Array<{ resolve, reject }> = [];

// En response interceptor para 401:
// 1. Si isRefreshing → encolar request y esperar
// 2. Si no → setear isRefreshing=true, POST /api/auth/refresh
// 3. Éxito → actualizar tokens, procesar cola, reintentar original
// 4. Fallo → logout, rechazar cola
```

### Wire Format (recordar snake_case)

```
POST /api/auth/sign-in
Request:  { "email": "...", "password": "..." }
Response: { "data": { "access_token": "...", "refresh_token": "..." } }

POST /api/auth/refresh
Request:  { "refresh_token": "..." }
Response: { "data": { "access_token": "...", "refresh_token": "..." } }
```

### Seguridad — Mensajes Genéricos

- Login fallido SIEMPRE retorna "Credenciales inválidas" (AUT001) — tanto para email inexistente como para password incorrecto.
- Rate limiting retorna 429 Too Many Requests con mensaje "Demasiados intentos. Intenta de nuevo más tarde."
- NO loguear intentos fallidos con el password (sí loguear email + IP en serverMessage para auditoría).

### Archivos a crear/modificar

**Crear:**
- `apps/api/src/modules/auth/application/use-cases/sign-in.use-case.ts`
- `apps/api/src/modules/auth/application/use-cases/__tests__/sign-in.use-case.spec.ts`
- `apps/api/src/modules/auth/application/use-cases/refresh-token.use-case.ts`
- `apps/api/src/modules/auth/application/use-cases/__tests__/refresh-token.use-case.spec.ts`
- `apps/api/src/modules/auth/infrastructure/api/sign-in.controller.ts`
- `apps/api/src/modules/auth/infrastructure/api/refresh-token.controller.ts`
- `apps/api/src/modules/auth/infrastructure/dto/sign-in.dto.ts`
- `apps/api/src/modules/auth/infrastructure/dto/refresh-token.dto.ts`
- `apps/api/src/modules/users/domain/types/user-with-password.type.ts`

**Modificar:**
- `apps/api/src/modules/auth/domain/enums/auth-usecases.enum.ts` — agregar SIGN_IN_USE_CASE, REFRESH_TOKEN_USE_CASE
- `apps/api/src/modules/auth/infrastructure/auth.module.ts` — registrar nuevos use cases, importar ThrottlerModule
- `apps/api/src/modules/users/domain/interfaces/user-repository.interface.ts` — agregar `findByEmailWithPassword()`
- `apps/api/src/modules/users/infrastructure/persistence/user-orm.repository.ts` — implementar `findByEmailWithPassword()`
- `apps/api/src/modules/users/domain/index.ts` — exportar nuevo type
- `apps/api/src/app.module.ts` — importar ThrottlerModule
- `apps/web/src/common/adapters/api-client.ts` — agregar refresh token interceptor
- `apps/web/src/modules/auth/infrastructure/repositories/auth-v1.repository.ts` — agregar `refreshToken()`
- `apps/web/src/modules/auth/domain/repositories/auth-repository.ts` — agregar contrato `refreshToken()`
- `apps/web/src/modules/auth/infrastructure/state/auth.state.ts` — agregar `refreshTokens()` action
- `apps/web/src/modules/auth/infrastructure/components/SignInForm.tsx` — mejorar validación UX

### Dependencias a instalar

```bash
# Solo backend
cd apps/api && pnpm add @nestjs/throttler
```

### Project Structure Notes

- La estructura de Clean Architecture ya está establecida en story 1-1 — seguir exactamente los mismos patrones.
- `sign-in.use-case.ts` sigue el mismo patrón que `setup.use-case.ts`: clase pura, `run()`, factory DI.
- El ThrottlerModule se configura a nivel de `app.module.ts` pero se aplica selectivamente por controller.
- NO se necesitan migraciones de DB — la tabla `users` ya tiene todo lo necesario para login.

### References

- [Source: _bmad-output/planning-artifacts/epic-01-auth-workspace.md#Story 1.2] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — JWT strategy, refresh tokens, HTTP-only cookies
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Rate limiting con @nestjs/throttler (5/min login, 100/min auth)
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Codes por Módulo] — AUT001 invalid credentials, AUT002 unauthorized
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patrones de Formularios] — Validación inline, estados de campos, feedback de errores
- [Source: _bmad-output/implementation-artifacts/1-1-registro-del-primer-administrador-y-setup-inicial.md] — Patrones establecidos, archivos existentes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ThrottlerModule moved to `common/throttler/infrastructure/` per user feedback (keep app.module.ts clean)
- bcrypt mock needed `jest.clearAllMocks()` in beforeEach to avoid test leakage

### Completion Notes List

- Backend: 4 tasks complete — ThrottlerModule (common/), UserRepository.findByEmailWithPassword, SignInUseCase + Controller, RefreshTokenUseCase + Controller
- Frontend: 3 tasks complete — API client refresh interceptor with queue, SignInForm with inline validation + rate limiting UX, viewmodel error extraction
- Tests: 6 new unit tests passing (SignIn: 3, RefreshToken: 3), 10 total unit tests, 25 E2E tests — zero regressions
- Both apps build successfully (nest build + next build)

### Change Log

- 2026-03-21: Implementation of Story 1-2 (Tasks 1-9)

### File List

**Creados:**
- apps/api/src/common/throttler/infrastructure/throttler.module.ts
- apps/api/src/modules/auth/application/use-cases/sign-in.use-case.ts
- apps/api/src/modules/auth/application/use-cases/__tests__/sign-in.use-case.spec.ts
- apps/api/src/modules/auth/application/use-cases/refresh-token.use-case.ts
- apps/api/src/modules/auth/application/use-cases/__tests__/refresh-token.use-case.spec.ts
- apps/api/src/modules/auth/infrastructure/api/sign-in.controller.ts
- apps/api/src/modules/auth/infrastructure/api/refresh-token.controller.ts
- apps/api/src/modules/auth/infrastructure/dto/sign-in.dto.ts
- apps/api/src/modules/auth/infrastructure/dto/refresh-token.dto.ts
- apps/api/src/modules/users/domain/types/user-with-password.type.ts

**Modificados:**
- apps/api/src/app.module.ts — importar ThrottlerModule desde common
- apps/api/src/modules/auth/domain/enums/auth-usecases.enum.ts — SIGN_IN_USE_CASE, REFRESH_TOKEN_USE_CASE
- apps/api/src/modules/auth/infrastructure/auth.module.ts — registrar nuevos use cases
- apps/api/src/modules/auth/application/index.ts — exportar nuevos use cases
- apps/api/src/modules/users/domain/interfaces/user-repository.interface.ts — findByEmailWithPassword
- apps/api/src/modules/users/domain/index.ts — exportar UserWithPasswordType
- apps/api/src/modules/users/infrastructure/persistence/user-orm.repository.ts — findByEmailWithPassword + toDomainWithPassword
- apps/web/src/common/adapters/api-client.ts — refresh token interceptor con cola
- apps/web/src/modules/auth/domain/repositories/auth-repository.ts — refreshToken contrato
- apps/web/src/modules/auth/infrastructure/repositories/auth-v1.repository.ts — refreshToken método
- apps/web/src/modules/auth/infrastructure/hooks/use-auth.viewmodel.ts — error extraction de Axios
- apps/web/src/modules/auth/infrastructure/components/SignInForm.tsx — validación inline + rate limiting UX
- CLAUDE.md — documentar throttler en common
