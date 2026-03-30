# Story 7.3: Gestión de API Keys

Status: done

## Story

As a **usuario autenticado**,
I want **generar, listar y revocar API keys desde la interfaz de Configuración**,
so that **pueda controlar qué herramientas de IA tienen acceso vía MCP y revocar el acceso cuando sea necesario**.

## Acceptance Criteria

1. **Given** soy un usuario autenticado y navego a Configuración → API Keys
   **When** la página carga
   **Then** veo la lista de mis API keys con: nombre, prefijo (mk_xxxx), fecha de creación, última vez usada, y estado (activa/revocada)

2. **Given** estoy en la página de API Keys
   **When** hago clic en "Generar API Key" e ingreso un nombre descriptivo (ej: "Claude Code - MacBook")
   **Then** se genera una API key con prefijo `mk_` + UUID v4
   **And** la key se muestra UNA sola vez en un dialog con opción de copiar al portapapeles
   **And** se almacena hasheada en la base de datos (ya implementado en backend)

3. **Given** quiero revocar una API key
   **When** hago clic en "Revocar" junto a la key
   **Then** aparece un dialog de confirmación
   **And** tras confirmar, la key se invalida inmediatamente (is_active = false)
   **And** la lista se actualiza mostrando el estado "revocada"

4. **Given** tengo 3 API keys activas (máximo permitido)
   **When** intento generar una cuarta
   **Then** veo un mensaje "Has alcanzado el máximo de 3 API keys activas. Revoca una existente para generar otra."
   **And** el botón de generar está deshabilitado

5. **Given** mi API key está vinculada a mi usuario
   **When** una herramienta de IA se conecta con mi key
   **Then** hereda exactamente los permisos de mis grupos (ya implementado en 7-1, no requiere cambios)

6. **Given** soy administrador
   **When** navego a Configuración → Usuarios
   **Then** puedo ver el conteo de API keys de cada usuario (scope futuro, no en esta story)

## Tasks / Subtasks

### Task 1: Backend — Nuevos métodos en repositorio (AC: #1, #3, #4)

- [x] 1.1 Agregar a `ApiKeyRepositoryInterface` los métodos:
  - `findByUserId(userId: string): Promise<ApiKeyType[]>` — retorna TODAS las keys del usuario (activas y revocadas)
  - `countActiveByUserId(userId: string): Promise<number>` — cuenta solo las activas
  - `deactivate(id: string, userId: string): Promise<void>` — soft-delete (is_active = false), valida ownership
- [x] 1.2 Implementar los 3 métodos en `ApiKeyOrmRepository`:
  - `findByUserId`: `this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } })`
  - `countActiveByUserId`: `this.repository.count({ where: { userId, isActive: true } })`
  - `deactivate`: `this.repository.update({ id, userId }, { isActive: false })` — incluir userId en el WHERE para ownership check
- [x] 1.3 Agregar nuevos error codes en `api-key-errors.codes.ts`:
  - `AKY005`: "Has alcanzado el máximo de 3 API keys activas." / serverMessage: "Max active API keys limit reached"
  - `AKY006`: "API key no encontrada." / serverMessage: "API key not found or does not belong to user"

### Task 2: Backend — Use cases nuevos (AC: #1, #3, #4)

- [x] 2.1 Crear `ListApiKeysUseCase` en `application/use-cases/list-api-keys.use-case.ts`:
  - Recibe `{ userId: string }`
  - Llama `apiKeyRepository.findByUserId(userId)`
  - Retorna la lista de keys del usuario
- [x] 2.2 Crear `RevokeApiKeyUseCase` en `application/use-cases/revoke-api-key.use-case.ts`:
  - Recibe `{ id: string, userId: string }`
  - Llama `apiKeyRepository.deactivate(id, userId)`
  - Si el repository lanza error (key no encontrada o no pertenece al usuario) → throw AKY006
- [x] 2.3 Actualizar `CreateApiKeyUseCase`:
  - Antes de crear, llamar `apiKeyRepository.countActiveByUserId(userId)`
  - Si count >= 3 → throw AKY005 via ExceptionService (necesita inyectar ExceptionService)
  - Esto requiere agregar `ExceptionServiceInterface` como dependencia del use case
- [x] 2.4 Unit tests para los 3 use cases:
  - `list-api-keys.use-case.spec.ts`: retorna keys del usuario
  - `revoke-api-key.use-case.spec.ts`: revoca exitosamente, lanza error si no existe
  - Actualizar `create-api-key.use-case.spec.ts`: nuevo test para límite de 3 keys

### Task 3: Backend — Controllers y presenters (AC: #1, #2, #3, #4)

- [x] 3.1 Crear `ApiKeyPresenter` en `infrastructure/presenters/api-key.presenter.ts`:
  - Mapea domain → wire: `{ id, name, prefix, is_active, last_used_at, created_at }`
  - Método estático `toHTTP(apiKey: ApiKeyType)` — patrón del proyecto
- [x] 3.2 Crear `ListApiKeysController` — `GET /api/mcp/keys`:
  - `@Auth()` decorator
  - Inyecta `LIST_API_KEYS_USE_CASE`
  - Retorna array de keys mapeadas por presenter
- [x] 3.3 Crear `RevokeApiKeyController` — `DELETE /api/mcp/keys/:id`:
  - `@Auth()` decorator
  - Inyecta `REVOKE_API_KEY_USE_CASE`
  - Param `id` (UUID)
  - Retorna `{ revoked: true }`
- [x] 3.4 Actualizar `CreateApiKeyController`:
  - Usar `ApiKeyPresenter` para el response (agregar `rawKey` como campo extra solo en create response)
- [x] 3.5 Agregar providers al enum: `LIST_API_KEYS_USE_CASE`, `REVOKE_API_KEY_USE_CASE`
- [x] 3.6 Registrar use cases y controllers en `ApiKeysModule`:
  - Agregar controllers a `controllers: []`
  - Agregar factories para los nuevos use cases
  - `CreateApiKeyUseCase` ahora necesita `ExceptionServiceInterface` — actualizar su factory

### Task 4: Frontend — Módulo api-keys (domain + infrastructure) (AC: #1, #2, #3, #4)

- [x] 4.1 Crear domain types en `modules/api-keys/domain/types/`:
  - `api-key.type.ts`: `{ id, name, prefix, isActive, lastUsedAt, createdAt }`
  - `create-api-key-response.type.ts`: `{ id, name, prefix, apiKey, createdAt }` (apiKey es la key completa, solo en create)
- [x] 4.2 Crear repository interface en `modules/api-keys/domain/repositories/api-key-repository.ts`:
  - `list(): Promise<ApiKey[]>`
  - `create(name: string): Promise<CreateApiKeyResponse>`
  - `revoke(id: string): Promise<void>`
- [x] 4.3 Crear `api-key-v1.repository.ts` en `infrastructure/repositories/`:
  - `list()`: GET `/api/mcp/keys` → mapea snake_case → camelCase
  - `create(name)`: POST `/api/mcp/keys` body `{ name }` → mapea response incluyendo `api_key` → `apiKey`
  - `revoke(id)`: DELETE `/api/mcp/keys/{id}`
  - Exportar singleton: `export const apiKeyRepository = new ApiKeyV1Repository()`
- [x] 4.4 Crear Zustand store en `infrastructure/state/api-key.state.ts`:
  - State: `apiKeys: ApiKey[]`, `isLoading: boolean`, `error: string | null`
  - Actions: `setApiKeys`, `addApiKey`, `updateApiKey`, `setLoading`, `setError`
- [x] 4.5 Crear viewmodel hook `use-api-key.viewmodel.ts` en `infrastructure/hooks/`:
  - `loadApiKeys()`: llama repository.list(), setea en store
  - `createApiKey(name)`: llama repository.create(name), retorna rawKey para mostrar en dialog
  - `revokeApiKey(id)`: llama repository.revoke(id), actualiza store (is_active = false)
  - `useEffect` para cargar al montar
  - Computed: `activeCount` para saber cuántas activas hay
  - Loading/error state en el store (NO local en componentes)

### Task 5: Frontend — Componentes UI (AC: #1, #2, #3, #4)

- [x] 5.1 Crear `ApiKeyList.tsx` en `infrastructure/components/`:
  - Tabla/lista con columnas: Nombre, Prefijo, Creado, Último uso, Estado, Acciones
  - Badge de estado: "Activa" (verde) / "Revocada" (gris)
  - Botón "Revocar" por cada key activa
  - Empty state si no hay keys: "No tienes API keys. Genera una para conectar herramientas de IA."
- [x] 5.2 Crear `CreateApiKeyDialog.tsx`:
  - Dialog/modal con input para nombre de la key
  - Validación: nombre requerido, max 100 chars
  - Al crear exitosamente: mostrar la key completa con botón "Copiar" (navigator.clipboard.writeText)
  - Advertencia: "Esta key solo se mostrará una vez. Cópiala ahora."
  - Botón "Cerrar" solo después de que el usuario haya tenido oportunidad de copiar
- [x] 5.3 Crear `RevokeApiKeyDialog.tsx`:
  - Dialog de confirmación: "¿Revocar API key '{name}'? Las herramientas que usen esta key dejarán de funcionar inmediatamente."
  - Botones: "Cancelar" / "Revocar" (destructivo)
- [x] 5.4 Deshabilitar botón "Generar API Key" cuando `activeCount >= 3`
  - Mostrar tooltip o texto: "Máximo 3 API keys activas"

### Task 6: Frontend — Página de settings y navegación (AC: #1)

- [x] 6.1 Crear página `app/dashboard/settings/api-keys/page.tsx`:
  - Usa `useApiKeyViewModel()` hook
  - Renderiza `ApiKeyList`, `CreateApiKeyDialog`, `RevokeApiKeyDialog`
  - Título de sección: "API Keys"
  - Subtítulo: "Genera API keys para conectar herramientas de IA como Claude Code vía MCP."
- [x] 6.2 Agregar link "API Keys" en `settings/layout.tsx`:
  - Agregar a `settingsLinks`: `{ href: '/dashboard/settings/api-keys', label: 'API Keys' }`

### Task 7: Unit tests backend (AC: #1-#4)

- [x] 7.1 `list-api-keys.use-case.spec.ts`:
  - Retorna lista de keys del usuario
  - Retorna array vacío si no tiene keys
- [x] 7.2 `revoke-api-key.use-case.spec.ts`:
  - Revoca key exitosamente
  - Lanza AKY006 si la key no existe o no pertenece al usuario
- [x] 7.3 Actualizar `create-api-key.use-case.spec.ts`:
  - Crea key exitosamente cuando tiene < 3 activas
  - Lanza AKY005 cuando tiene 3 activas

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente               | Archivo                                                                 | Qué reutilizar                                       |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `CreateApiKeyUseCase`    | `modules/api-keys/application/use-cases/create-api-key.use-case.ts`     | Lógica de generación mk\_ + hash SHA-256             |
| `ValidateApiKeyUseCase`  | `modules/api-keys/application/use-cases/validate-api-key.use-case.ts`   | Referencia de patrón con ExceptionService            |
| `ApiKeyOrmRepository`    | `modules/api-keys/infrastructure/persistence/api-key-orm.repository.ts` | Extender con nuevos métodos                          |
| `ApiKeyEntity`           | `modules/api-keys/infrastructure/persistence/api-key.entity.ts`         | Entidad completa con todas las columnas              |
| `CreateApiKeyController` | `modules/api-keys/infrastructure/api/create-api-key.controller.ts`      | Patrón de controller con @Auth()                     |
| `CreateApiKeyDto`        | `modules/api-keys/infrastructure/dto/create-api-key.dto.ts`             | Ya existe, reutilizar para POST                      |
| `apiKeyErrorsCodes`      | `modules/api-keys/domain/enums/api-key-errors.codes.ts`                 | AKY001-AKY004, agregar AKY005-AKY006                 |
| `ApiKeyProvidersEnum`    | `modules/api-keys/domain/enums/api-key-providers.enum.ts`               | Agregar nuevos providers                             |
| Settings layout          | `app/dashboard/settings/layout.tsx`                                     | Agregar link de API Keys                             |
| Groups module (frontend) | `modules/groups/`                                                       | **Patrón de referencia completo** para CRUD frontend |
| Auth viewmodel           | `modules/auth/infrastructure/hooks/use-auth.viewmodel.ts`               | Patrón de viewmodel hook                             |
| Zustand store            | `modules/auth/infrastructure/state/auth.state.ts`                       | Patrón de store                                      |
| UI components            | `common/components/ui/`                                                 | button, input, card, label, dialog (shadcn/ui)       |
| API client               | `common/adapters/api-client/api-client.ts`                              | Axios instance con interceptors                      |

### Decisiones de implementación

1. **NO se necesita migración de BD** — la tabla `api_keys` ya existe con todas las columnas necesarias (is_active, last_used_at, etc.)
2. **Soft delete para revocación** — `is_active = false`, NO borrar el registro. Las keys revocadas se muestran en la lista con estado "Revocada"
3. **Límite de 3 keys** se valida en `CreateApiKeyUseCase` (backend) Y se refleja en UI (frontend deshabilita botón). La validación real es la del backend
4. **Admin revoke (AC#6)** se marca como scope futuro — no implementar en esta story. El epic lo menciona pero la complejidad de listar keys de otros usuarios + UI admin es una story separada
5. **La key completa solo se muestra una vez** — el backend ya solo retorna `rawKey` en el POST de creación. El GET retorna solo `prefix`
6. **Presenter** — crear `ApiKeyPresenter` para consistencia con el resto del proyecto (otros módulos usan presenters)

### Wire format (API responses)

**GET /api/mcp/keys** (lista):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Claude Code - MacBook",
      "prefix": "mk_1a2b",
      "is_active": true,
      "last_used_at": "2026-03-30T10:00:00Z",
      "created_at": "2026-03-28T15:30:00Z"
    }
  ]
}
```

**POST /api/mcp/keys** (crear):

```json
{
  "data": {
    "id": "uuid",
    "name": "Claude Code - MacBook",
    "prefix": "mk_1a2b",
    "api_key": "mk_550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-03-30T10:00:00Z"
  }
}
```

**DELETE /api/mcp/keys/:id** (revocar):

```json
{
  "data": { "revoked": true }
}
```

### Error codes del módulo

| Code   | Message                                        | Uso                                       |
| ------ | ---------------------------------------------- | ----------------------------------------- |
| AKY001 | Invalid or revoked API key.                    | Auth MCP (ya existe)                      |
| AKY002 | Permission denied.                             | Permisos MCP (ya existe)                  |
| AKY003 | Folder not found.                              | MCP ops (ya existe)                       |
| AKY004 | Document not found.                            | MCP ops (ya existe)                       |
| AKY005 | Has alcanzado el máximo de 3 API keys activas. | **NUEVO** — crear en esta story           |
| AKY006 | API key no encontrada.                         | **NUEVO** — revocar key inexistente/ajena |

### Anti-patrones a evitar

- **NO crear nueva migración** — la tabla ya tiene todo lo necesario
- **NO hard-delete keys** — soft delete con is_active = false para mantener historial
- **NO almacenar la key raw en el frontend store** — solo guardarla temporalmente en el dialog de creación, limpiar al cerrar
- **NO mostrar el hash en el frontend** — solo el prefix (mk_xxxx)
- **NO duplicar validación de límite** solo en frontend — el backend DEBE ser la fuente de verdad
- **NO crear un módulo "admin" separado** para API keys de otros usuarios — eso es scope de otra story
- **NO usar loading state local en componentes** — siempre en el Zustand store
- **NO hardcodear strings** — usar constantes/enums tanto en front como en back

### Orden de implementación recomendado

1. Backend: error codes + repository methods + unit tests
2. Backend: use cases + unit tests
3. Backend: presenter + controllers + module wiring
4. Frontend: domain types + repository + store
5. Frontend: viewmodel hook
6. Frontend: componentes UI + página settings
7. Verificar integración end-to-end

### Project Structure Notes

**Archivos nuevos (backend):**

```
apps/api/src/modules/api-keys/
├── application/use-cases/
│   ├── list-api-keys.use-case.ts
│   ├── revoke-api-key.use-case.ts
│   └── __tests__/
│       ├── list-api-keys.use-case.spec.ts
│       └── revoke-api-key.use-case.spec.ts
├── infrastructure/
│   ├── api/
│   │   ├── list-api-keys.controller.ts
│   │   └── revoke-api-key.controller.ts
│   └── presenters/
│       └── api-key.presenter.ts
```

**Archivos modificados (backend):**

```
apps/api/src/modules/api-keys/
├── domain/
│   ├── enums/api-key-errors.codes.ts          (+AKY005, +AKY006)
│   ├── enums/api-key-providers.enum.ts        (+LIST, +REVOKE providers)
│   ├── interfaces/api-key-repository.interface.ts (+findByUserId, +countActiveByUserId, +deactivate)
│   └── index.ts                               (+exports)
├── application/
│   ├── use-cases/create-api-key.use-case.ts   (+limit check, +ExceptionService dep)
│   ├── use-cases/__tests__/create-api-key.use-case.spec.ts (+limit test)
│   └── index.ts                               (+exports)
├── infrastructure/
│   ├── persistence/api-key-orm.repository.ts  (+3 nuevos métodos)
│   ├── api/create-api-key.controller.ts       (+presenter usage)
│   └── api-keys.module.ts                     (+controllers, +factories)
```

**Archivos nuevos (frontend):**

```
apps/web/src/modules/api-keys/
├── domain/
│   ├── types/
│   │   ├── api-key.type.ts
│   │   └── create-api-key-response.type.ts
│   ├── repositories/
│   │   └── api-key-repository.ts
│   └── index.ts
├── infrastructure/
│   ├── repositories/
│   │   └── api-key-v1.repository.ts
│   ├── hooks/
│   │   └── use-api-key.viewmodel.ts
│   ├── state/
│   │   └── api-key.state.ts
│   ├── components/
│   │   ├── ApiKeyList.tsx
│   │   ├── CreateApiKeyDialog.tsx
│   │   └── RevokeApiKeyDialog.tsx
│   └── index.ts
apps/web/src/app/dashboard/settings/api-keys/
└── page.tsx
```

**Archivos modificados (frontend):**

```
apps/web/src/app/dashboard/settings/layout.tsx (+link API Keys)
```

### References

- [Source: epic-07-mcp.md#Story 7.3] — ACs originales y user story
- [Source: 7-2-operaciones-de-escritura-mcp.md] — Patrón de MCP mutations, error codes, module wiring
- [Source: modules/api-keys/] — Código backend existente (entity, repository, use cases, controller)
- [Source: modules/groups/] — Patrón CRUD frontend completo (repository, viewmodel, store, components)
- [Source: app/dashboard/settings/layout.tsx] — Settings navigation layout
- [Source: CLAUDE.md] — Arquitectura, convenciones, reglas de código

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Backend: Added `findByUserId`, `countActiveByUserId`, `deactivate` to ApiKeyRepositoryInterface + ORM implementation
- Backend: Added error codes AKY005 (max keys limit) and AKY006 (key not found)
- Backend: Created `ListApiKeysUseCase` and `RevokeApiKeyUseCase`
- Backend: Updated `CreateApiKeyUseCase` with max 3 active keys limit via ExceptionService
- Backend: Created `ApiKeyPresenter` with `toResponse` and `toCreateResponse` methods
- Backend: Created `ListApiKeysController` (GET /api/mcp/keys) and `RevokeApiKeyController` (DELETE /api/mcp/keys/:id)
- Backend: Updated `CreateApiKeyController` to use presenter
- Backend: Wired all new providers, controllers, and factories in `ApiKeysModule`
- Frontend: Created full api-keys module (domain types, repository interface, V1 repository with snake→camel mapping)
- Frontend: Created Zustand store and viewmodel hook with activeCount computed
- Frontend: Created `ApiKeyList`, `CreateApiKeyDialog`, `RevokeApiKeyDialog` components
- Frontend: Created settings page at `/dashboard/settings/api-keys` with full CRUD flow
- Frontend: Added "API Keys" link in settings navigation layout
- 3 new test suites (create, list, revoke) + updated validate test mock — 34 suites, 112 tests total
- 182 E2E tests passing — zero regressions
- TypeScript typecheck passing for both api and web

### Change Log

- 2026-03-30: Story 7.3 implementation complete — API key management (list, create, revoke) with backend endpoints and frontend UI in settings

### File List

**New files (backend):**

- apps/api/src/modules/api-keys/application/use-cases/list-api-keys.use-case.ts
- apps/api/src/modules/api-keys/application/use-cases/revoke-api-key.use-case.ts
- apps/api/src/modules/api-keys/application/use-cases/**tests**/create-api-key.use-case.spec.ts
- apps/api/src/modules/api-keys/application/use-cases/**tests**/list-api-keys.use-case.spec.ts
- apps/api/src/modules/api-keys/application/use-cases/**tests**/revoke-api-key.use-case.spec.ts
- apps/api/src/modules/api-keys/infrastructure/presenters/api-key.presenter.ts
- apps/api/src/modules/api-keys/infrastructure/api/list-api-keys.controller.ts
- apps/api/src/modules/api-keys/infrastructure/api/revoke-api-key.controller.ts

**Modified files (backend):**

- apps/api/src/modules/api-keys/domain/enums/api-key-errors.codes.ts (+AKY005, +AKY006)
- apps/api/src/modules/api-keys/domain/enums/api-key-providers.enum.ts (+LIST, +REVOKE)
- apps/api/src/modules/api-keys/domain/interfaces/api-key-repository.interface.ts (+3 methods)
- apps/api/src/modules/api-keys/application/index.ts (+exports)
- apps/api/src/modules/api-keys/application/use-cases/create-api-key.use-case.ts (+limit check, +ExceptionService)
- apps/api/src/modules/api-keys/application/use-cases/**tests**/validate-api-key.use-case.spec.ts (+mock methods)
- apps/api/src/modules/api-keys/infrastructure/persistence/api-key-orm.repository.ts (+3 methods)
- apps/api/src/modules/api-keys/infrastructure/api/create-api-key.controller.ts (+presenter)
- apps/api/src/modules/api-keys/infrastructure/api-keys.module.ts (+controllers, +factories)

**New files (frontend):**

- apps/web/src/modules/api-keys/domain/types/api-key.type.ts
- apps/web/src/modules/api-keys/domain/types/create-api-key-response.type.ts
- apps/web/src/modules/api-keys/domain/types/index.ts
- apps/web/src/modules/api-keys/domain/repositories/api-key-repository.ts
- apps/web/src/modules/api-keys/domain/index.ts
- apps/web/src/modules/api-keys/infrastructure/repositories/api-key-v1.repository.ts
- apps/web/src/modules/api-keys/infrastructure/state/api-key.state.ts
- apps/web/src/modules/api-keys/infrastructure/hooks/use-api-key.viewmodel.ts
- apps/web/src/modules/api-keys/infrastructure/components/ApiKeyList.tsx
- apps/web/src/modules/api-keys/infrastructure/components/CreateApiKeyDialog.tsx
- apps/web/src/modules/api-keys/infrastructure/components/RevokeApiKeyDialog.tsx
- apps/web/src/modules/api-keys/infrastructure/index.ts
- apps/web/src/app/dashboard/settings/api-keys/page.tsx

**Modified files (frontend):**

- apps/web/src/app/dashboard/settings/layout.tsx (+API Keys link)
