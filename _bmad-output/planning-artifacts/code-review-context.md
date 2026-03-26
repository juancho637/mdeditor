# Code Review Context — Decisiones Aceptadas

Este documento se pasa a los agentes de code review para evitar falsos positivos recurrentes. Solo flaggear findings que NO estén en esta lista.

## Decisiones de Arquitectura (no flaggear)

### Seguridad
- **UUID v4 para tokens** — `crypto.randomUUID()` usa CSPRNG. Es criptográficamente seguro. No sugerir `crypto.randomBytes()`.
- **HTTP-only cookies** — El refresh token se almacena como cookie httpOnly. El access token va en localStorage para el Bearer header. Esto es by design.
- **CSRF** — Los endpoints POST públicos (`/accept`, `/sign-in`) no usan cookies de sesión para autenticación. No hay riesgo CSRF. Los endpoints protegidos usan Bearer token (no cookie). No flaggear CSRF.
- **JWT stateless** — Los JWT no se invalidan individualmente excepto refresh tokens vía Redis. Access tokens expiran por TTL (15min). Esto es by design para MVP.
- **Token revocation con Redis** — El refresh token se revoca en Redis con TTL automático al hacer logout o rotation. No se necesita blacklist en PostgreSQL.
- **bcrypt directo** — Se usa bcrypt sin wrapper. CLAUDE.md dice "NO wrappear bcrypt". No sugerir abstracción.
- **JwtService directo en use cases** — CLAUDE.md dice "NO wrappear @nestjs/jwt. Uso directo." No flaggear como violación de Clean Architecture.

### NestJS
- **POST retorna 201 por defecto** — NestJS retorna 201 para `@Post()`. No flaggear como "missing @HttpCode(201)".
- **ValidationPipe global** — `whitelist: true, forbidNonWhitelisted: true` configurado en main.ts. Los DTOs no necesitan sanitización adicional.
- **Filter order** — NestJS `useGlobalFilters(filter1, filter2)`: filter2 ejecuta primero para excepciones que matchea. El orden actual es correcto.
- **@Auth() decorator** — Es un wrapper de `AuthGuard('jwt')`. La verificación de `isAdmin` se hace en el controller, no en el guard.
- **ExceptionService retorna, use case hace throw** — Pattern: `throw this.exception.badRequestException({...})`. No sugerir try/catch en use cases.
- **Repository es el único lugar con try/catch** — No flaggear "missing error handling" en controllers o use cases.

### Frontend
- **localStorage para access_token** — El access token necesita estar accesible a JavaScript para el Bearer header. Solo el refresh token es httpOnly cookie.
- **withCredentials: true** — Necesario para que el browser envíe cookies httpOnly cross-origin (localhost:3000 ↔ 3001).
- **token-refresh.service usa axios.post raw** — Intencional: no usa apiClient para evitar dependencia circular (apiClient → interceptor → repository → apiClient).
- **1 tipo por archivo** — Decisión explícita del proyecto. Un enum = un archivo, un type = un archivo.
- **Zustand sin hydration** — El store no se hidrata desde localStorage al cargar la app. El apiClient lee tokens directamente de localStorage. By design para CSR.

### Ownership / Permisos
- **Sin ownership check en endpoints de folders/documents** — Todos los usuarios autenticados pueden operar sobre todas las carpetas y documentos. Los permisos por carpeta/grupo (quién puede ver/editar qué) se implementan en Epic 3. No flaggear "missing authorization" o "missing ownership check" en stories de Epic 1-2.

### Scope MVP (no flaggear como missing)
- **Sin pagination** — Las listas (invitaciones, usuarios) no tienen pagination. Aceptable para equipos pequeños (self-hosted).
- **Sin email service** — Las invitaciones generan un link copiable. No se envían emails. By design.
- **Sin invitation expiration** — Las invitaciones no expiran. Feature futura.
- **Sin i18n** — Error messages en inglés (backend) y español (frontend). No flaggear inconsistencia de idioma.
- **Sin rate limiting en todos los endpoints** — Solo sign-in tiene throttle estricto. Los demás usan el default (100/min). Suficiente para MVP.
- **Status como VARCHAR** — En vez de PostgreSQL ENUM. TypeORM maneja esto con defaults y validación en aplicación.

### Patrones de testing
- **E2E tests comparten DB** — Los tests usan `resetUsers()` / `resetInvitations()` vía docker exec para limpiar entre tests. `workers: 1` evita race conditions.
- **Sin unit tests para pass-through use cases** — Use cases que solo llaman al repository sin lógica adicional (ej: ListInvitationsUseCase) no necesitan unit tests.
- **SignInDto @MinLength(1)** — Login acepta cualquier password no vacío. La política de 8 chars se enforce solo en registro. No flaggear como "too permissive".
