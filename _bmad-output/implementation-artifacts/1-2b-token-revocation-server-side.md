# Story 1.2b: Revocación de Tokens Server-Side con Redis

Status: done

## Story

As a **administrador de la plataforma**,
I want **que los tokens JWT puedan ser revocados desde el servidor cuando un usuario hace logout**,
so that **tokens robados o comprometidos no puedan ser reutilizados después de cerrar sesión**.

## Acceptance Criteria

1. **Given** un usuario autenticado hace logout
   **When** el servidor procesa el logout
   **Then** el refresh token actual se invalida en Redis
   **And** cualquier intento de usar ese refresh token para obtener nuevos tokens falla con AUT002

2. **Given** un refresh token fue revocado
   **When** alguien intenta usar ese token para refresh
   **Then** el servidor rechaza la solicitud con 401 Unauthorized
   **And** el token revocado no puede generar nuevos access tokens

3. **Given** un token revocado alcanza su TTL natural en Redis
   **When** Redis ejecuta la expiración automática
   **Then** el token se elimina automáticamente sin intervención
   **And** Redis no crece indefinidamente

## Tasks / Subtasks

### Infraestructura

- [ ] Task 1: Agregar Redis a Docker Compose (AC: #1, #2, #3)
  - [ ] Servicio `redis` en `docker-compose.yml` con `redis:7-alpine`
  - [ ] Healthcheck con `redis-cli ping`
  - [ ] Volume para persistencia (producción)
  - [ ] Actualizar `docker-compose.dev.yml` para que `api` dependa de `redis`

- [ ] Task 2: Crear módulo Redis en common/ (AC: #1)
  - [ ] Instalar `ioredis` en `apps/api` (via `make add PKG="ioredis"` + `make add-dev PKG="@types/ioredis"`)
  - [ ] Crear `common/redis/infrastructure/redis.module.ts` — RedisModule con ConfigService
  - [ ] Agregar env vars: `REDIS_HOST`, `REDIS_PORT` a configuration.module.ts + .env.example
  - [ ] Provider: `REDIS_CLIENT` con factory que crea instancia de ioredis

### Backend

- [ ] Task 3: Crear interfaz y repositorio de token revocation (AC: #1, #2)
  - [ ] `modules/auth/domain/interfaces/token-revocation-repository.interface.ts` — contrato con `revoke(tokenHash, ttlSeconds)`, `isRevoked(tokenHash)`
  - [ ] `modules/auth/domain/enums/auth-usecases.enum.ts` — agregar `TOKEN_REVOCATION_REPOSITORY`
  - [ ] `modules/auth/infrastructure/persistence/token-revocation-redis.repository.ts` — implementación con ioredis
    - `revoke()`: `SET revoked:{hash} 1 EX {ttl}` — Redis TTL auto-limpia
    - `isRevoked()`: `EXISTS revoked:{hash}` — O(1)

- [ ] Task 4: Integrar revocación en RefreshTokenUseCase (AC: #2)
  - [ ] Inyectar `tokenRevocationRepository` en constructor
  - [ ] Antes de generar nuevos tokens: `isRevoked(hash(refreshToken))` → si revocado, throw AUT002
  - [ ] Después de generar nuevos tokens: `revoke(hash(oldRefreshToken), remainingTtlSeconds)` — rotation + revocation
  - [ ] Hash con `crypto.createHash('sha256').update(token).digest('hex')`

- [ ] Task 5: Integrar revocación en LogoutController (AC: #1)
  - [ ] Extraer refresh token de cookie httpOnly
  - [ ] Hashear y revocar: `tokenRevocationRepository.revoke(hash, JWT_REFRESH_EXPIRATION_SECONDS)`
  - [ ] Limpiar cookie

- [ ] Task 6: Registrar en auth.module.ts
  - [ ] Importar RedisModule
  - [ ] Registrar token-revocation-redis.repository con useFactory
  - [ ] Actualizar RefreshTokenUseCase factory para inyectar revocation repository

### Testing

- [ ] Task 7: Unit tests (AC: #1, #2, #3)
  - [ ] `refresh-token.use-case.spec.ts` — agregar tests:
    - Test: refresh con token revocado → throw AUT002
    - Test: refresh exitoso revoca token anterior
  - [ ] `token-revocation-redis.repository.spec.ts`:
    - Test: revoke almacena con TTL
    - Test: isRevoked retorna true para token revocado
    - Test: isRevoked retorna false para token no revocado

## Dev Notes

### Qué YA existe (NO recrear)

- `RefreshTokenUseCase` — verifica JWT, busca usuario, genera tokens nuevos. Solo agregar la verificación de revocación.
- `LogoutController` — ya limpia la cookie httpOnly. Solo agregar la llamada a `revoke()`.
- `cookie.utils.ts` — `getRefreshTokenFromCookie()` ya extrae el token de la cookie.
- `AuthService.generateTokens()` — genera tokens con `typ: 'refresh'`.

### Redis approach (vs PostgreSQL)

Redis es ideal para token revocation porque:
- TTL automático: `SET key value EX ttl` — Redis auto-elimina al expirar. No necesita cleanup job.
- O(1) para SET/EXISTS — sin overhead de índices SQL.
- In-memory — latencia sub-millisecond.
- El tamaño de la blacklist es naturalmente limitado: solo tokens activos (max 7 días de vida).

### Patrón: hash del token como key

```
Key:   revoked:sha256(refreshToken)
Value: 1
TTL:   remaining seconds until token natural expiry
```

No se guarda el token en claro — solo su hash SHA-256. Si Redis se compromete, no se pueden reconstruir los tokens.

### Wire format

No hay cambios en el wire format — la revocación es transparente para el frontend. El refresh endpoint sigue devolviendo `{ data: { access_token } }` con cookie httpOnly.

### Archivos a crear

- `apps/api/src/common/redis/infrastructure/redis.module.ts`
- `apps/api/src/modules/auth/domain/interfaces/token-revocation-repository.interface.ts`
- `apps/api/src/modules/auth/infrastructure/persistence/token-revocation-redis.repository.ts`

### Archivos a modificar

- `docker-compose.yml` — servicio redis
- `docker-compose.dev.yml` — dependencia de api en redis
- `apps/api/src/common/configuration/infrastructure/configuration.module.ts` — REDIS_HOST, REDIS_PORT
- `apps/api/.env.example` + `apps/api/.env` — vars Redis
- `apps/api/src/modules/auth/domain/enums/auth-usecases.enum.ts` — TOKEN_REVOCATION_REPOSITORY
- `apps/api/src/modules/auth/infrastructure/auth.module.ts` — importar RedisModule, registrar repo
- `apps/api/src/modules/auth/application/use-cases/refresh-token.use-case.ts` — verificar/revocar
- `apps/api/src/modules/auth/infrastructure/api/logout.controller.ts` — revocar en logout

### Dependencias a instalar

```bash
make add PKG="ioredis"
make add-dev PKG="@types/ioredis"
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — JWT strategy
- [Source: _bmad-output/implementation-artifacts/1-2-login-y-gestion-de-sesion.md] — Refresh token flow + httpOnly cookies
