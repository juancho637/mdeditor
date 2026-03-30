# Story 7.1: Servidor MCP con Operaciones de Lectura

Status: done

## Story

As a **desarrollador (como Carlos) usando Claude Code**,
I want **conectarme al servidor MCP de la plataforma y listar/leer documentos**,
so that **las herramientas de IA puedan consumir el contenido actualizado del equipo como contexto**.

## Acceptance Criteria

1. **Given** Carlos configura la conexión MCP en Claude Code con una API key válida
   **When** ejecuta `list_folders`
   **Then** recibe la lista de carpetas a las que tiene acceso según los permisos de su grupo

2. **Given** Carlos tiene acceso a una carpeta
   **When** ejecuta `list_documents` con el nombre o ID de la carpeta
   **Then** recibe la lista de documentos con título, fecha de actualización y autor

3. **Given** Carlos tiene permiso de visualización sobre un documento
   **When** ejecuta `read_document` con el ID o slug del documento
   **Then** recibe el contenido markdown completo del documento
   **And** la respuesta llega en < 500ms (NFR20)

4. **Given** la API key de Carlos está vinculada al grupo "Desarrollo" sin acceso a carpeta "Operaciones"
   **When** ejecuta `list_documents` sobre "Operaciones"
   **Then** recibe un error descriptivo: "No tienes permiso de visualización sobre la carpeta 'Operaciones'" (FR36)
   **And** el error incluye `error: "PERMISSION_DENIED"`, `required_permission: "view"`, `current_permission: "none"`

5. **Given** Carlos usa una API key revocada o inválida
   **When** intenta cualquier operación MCP
   **Then** recibe un error de autenticación claro con código `MCP001`

## Tasks / Subtasks

### Task 1: Migración — Crear tabla `api_keys` (AC: #5)

- [x] 1.1 Crear migración `1711600000000-CreateApiKeysTable.ts` en `apps/api/src/common/database/migrations/`:
  ```sql
  CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    prefix VARCHAR(10) NOT NULL,  -- "mk_xxxx" (primeros 7 chars)
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
  );
  CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
  CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
  ```
- [x] 1.2 Crear `ApiKeyEntity` en `apps/api/src/modules/mcp/infrastructure/persistence/api-key.entity.ts`:
  - Campos: id, userId, keyHash, prefix, name, isActive, lastUsedAt, createdAt, updatedAt
  - `@ManyToOne(() => UserEntity)` para relación con usuario

### Task 2: Módulo MCP — Domain layer (AC: #1-#5)

- [x] 2.1 Crear enum `McpErrorsCodes` en `domain/enums/mcp-errors.codes.ts`:
  ```typescript
  MCP001 = { codeError: 'MCP001', message: 'Invalid or revoked API key.', serverMessage: '...' }
  MCP002 = { codeError: 'MCP002', message: 'Permission denied.', serverMessage: '...' }
  MCP003 = { codeError: 'MCP003', message: 'Folder not found.', serverMessage: '...' }
  MCP004 = { codeError: 'MCP004', message: 'Document not found.', serverMessage: '...' }
  ```
- [x] 2.2 Crear enum `McpProvidersEnum` en `domain/enums/mcp-providers.enum.ts`:
  ```typescript
  API_KEY_REPOSITORY, VALIDATE_API_KEY_USE_CASE, LIST_FOLDERS_USE_CASE,
  LIST_DOCUMENTS_USE_CASE, READ_DOCUMENT_USE_CASE, CREATE_API_KEY_USE_CASE
  ```
- [x] 2.3 Crear enum `McpUsecasesEnum` en `domain/enums/mcp-usecases.enum.ts`
- [x] 2.4 Crear `ApiKeyRepositoryInterface` en `domain/interfaces/`:
  ```typescript
  findByKeyHash(keyHash: string): Promise<ApiKeyType | null>;
  create(data: CreateApiKeyType): Promise<ApiKeyType>;
  updateLastUsed(id: string): Promise<void>;
  ```
- [x] 2.5 Crear types en `domain/types/`:
  - `api-key.type.ts`: { id, userId, keyHash, prefix, name, isActive, lastUsedAt, createdAt }
  - `create-api-key.type.ts`: { userId, keyHash, prefix, name }

### Task 3: Use cases de autenticación y API key (AC: #5)

- [x] 3.1 Crear `ValidateApiKeyUseCase` en `application/use-cases/`:
  ```
  Input: rawKey (string)
  Flow:
    1. Hash rawKey con SHA-256
    2. apiKeyRepository.findByKeyHash(hash)
    3. Si no existe o !isActive → throw MCP001
    4. apiKeyRepository.updateLastUsed(apiKey.id)
    5. Return { userId: apiKey.userId, apiKeyId: apiKey.id }
  ```
- [x] 3.2 Crear `CreateApiKeyUseCase` en `application/use-cases/`:
  ```
  Input: userId, name
  Flow:
    1. Generar rawKey = "mk_" + UUID v4
    2. Hash con SHA-256
    3. prefix = rawKey.substring(0, 7) → "mk_xxxx"
    4. apiKeyRepository.create({ userId, keyHash, prefix, name })
    5. Return { apiKey, rawKey } ← rawKey solo se retorna UNA vez
  ```
  Nota: El CRUD completo de API keys (listar, revocar, límite de 3) viene en Story 7.3. Aquí solo crear la generación básica para testing.

### Task 4: Use cases de lectura MCP (AC: #1, #2, #3, #4)

- [x] 4.1 Crear `ListFoldersUseCase` en `application/use-cases/`:
  ```
  Input: userId
  Flow:
    1. folderRepository.findAll()
    2. Para cada carpeta: checkPermission.run(userId, folder.id)
    3. Filtrar solo carpetas con permission !== null
    4. Return carpetas accesibles con { id, name, slug, parentId }
  ```
- [x] 4.2 Crear `ListDocumentsUseCase` en `application/use-cases/`:
  ```
  Input: userId, folderId
  Flow:
    1. folderRepository.findById(folderId)
       → Si no existe: throw MCP003
    2. checkPermission.run(userId, folderId)
       → Si null: throw MCP002 con detalles { folder: name, required: 'view', current: 'none' }
    3. documentRepository.findByFolderId(folderId)
    4. Return documentos con { id, title, slug, updatedAt, createdBy }
  ```
- [x] 4.3 Crear `ReadDocumentUseCase` en `application/use-cases/`:
  ```
  Input: userId, documentId
  Flow:
    1. documentRepository.findById(documentId)
       → Si no existe: throw MCP004
    2. checkPermission.run(userId, document.folderId)
       → Si null: throw MCP002
    3. Return { id, title, slug, contentMarkdown, folderId, updatedAt }
  ```

### Task 5: Infraestructura — ApiKeyOrmRepository (AC: #5)

- [x] 5.1 Crear `ApiKeyOrmRepository` en `infrastructure/persistence/`:
  - Implementar `findByKeyHash`: query by keyHash where isActive = true
  - Implementar `create`: insert y retornar entity mapeada a domain type
  - Implementar `updateLastUsed`: update lastUsedAt = new Date()
  - Try/catch → ExceptionService para errores de DB

### Task 6: MCP Server — Integración con @modelcontextprotocol/sdk (AC: #1-#4)

- [x] 6.1 Agregar dependencia: `@modelcontextprotocol/sdk` al workspace api via Makefile
- [x] 6.2 Crear `McpServerService` en `infrastructure/services/mcp-server.service.ts`:
  - Implements `OnModuleInit`
  - Inicializa `Server` de @modelcontextprotocol/sdk con Streamable HTTP transport
  - Registra 3 tools: `list_folders`, `list_documents`, `read_document`
  - Cada tool handler: extraer userId del contexto auth → llamar use case → formatear respuesta
- [x] 6.3 Crear `McpController` en `infrastructure/api/mcp.controller.ts`:
  - Endpoint: `POST /api/mcp` — handler principal del protocolo MCP
  - Endpoint: `GET /api/mcp` — SSE para server-initiated messages
  - Endpoint: `DELETE /api/mcp` — cleanup de sesiones
  - Middleware/Guard: Extraer API key del header `Authorization: Bearer mk_...`, validar via ValidateApiKeyUseCase, inyectar userId en request
- [x] 6.4 Crear `ApiKeyAuthGuard` en `infrastructure/guards/api-key-auth.guard.ts`:
  - Implementar `CanActivate` de NestJS
  - Extraer Bearer token del header Authorization
  - Validar via ValidateApiKeyUseCase
  - Inyectar `{ id: userId, isAdmin: false }` en `request.user` (mismo formato que JWT)
  - Si falla: throw UnauthorizedException con MCP001

### Task 7: Módulo NestJS — Wiring (AC: #1-#5)

- [x] 7.1 Crear `mcp.module.ts`:
  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forFeature([ApiKeyEntity]),
      FoldersModule,      // FolderRepository
      DocumentsModule,    // DocumentRepository
      PermissionsModule,  // CheckPermissionUseCase
    ],
    controllers: [McpController],
    providers: [
      // ApiKeyOrmRepository factory
      // ValidateApiKeyUseCase factory
      // CreateApiKeyUseCase factory
      // ListFoldersUseCase factory
      // ListDocumentsUseCase factory
      // ReadDocumentUseCase factory
      // McpServerService
      // ApiKeyAuthGuard
    ],
    exports: [McpProvidersEnum.CREATE_API_KEY_USE_CASE], // Para Story 7.3
  })
  ```
- [x] 7.2 Importar `McpModule` en `AppModule`

### Task 8: Seed de API key para testing (AC: #1-#5)

- [x] 8.1 Crear endpoint temporal (o seed script) para generar una API key de prueba:
  - `POST /api/mcp/keys` protegido con `@Auth()` (JWT admin)
  - Body: `{ name: "Test Key" }`
  - Response: `{ api_key: "mk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", prefix: "mk_xxxx", name: "Test Key" }`
  - Este endpoint se expande en Story 7.3 con el CRUD completo

### Task 9: Unit tests (AC: #1-#5)

- [x] 9.1 `validate-api-key.use-case.spec.ts`:
  - Key válida → retorna userId
  - Key no encontrada → MCP001
  - Key revocada (isActive: false) → MCP001
  - Actualiza lastUsedAt en éxito
- [x] 9.2 `list-folders.use-case.spec.ts`:
  - Retorna solo carpetas con permiso
  - Filtra carpetas sin acceso
  - Admin ve todas las carpetas
- [x] 9.3 `list-documents.use-case.spec.ts`:
  - Carpeta con permiso → lista documentos
  - Carpeta no encontrada → MCP003
  - Sin permiso → MCP002
- [x] 9.4 `read-document.use-case.spec.ts`:
  - Documento con permiso → retorna contenido
  - Documento no encontrado → MCP004
  - Sin permiso → MCP002

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente | Archivo | Qué reutilizar |
|---|---|---|
| `CheckPermissionUseCase` | `modules/permissions/application/use-cases/check-permission.use-case.ts` | Verificar permisos VIEW/EDIT |
| `FolderRepository` | `modules/folders/domain/interfaces/folder-repository.interface.ts` | `findAll()`, `findById()` |
| `DocumentRepository` | `modules/documents/domain/interfaces/documents-repository.interface.ts` | `findById()`, `findByFolderId()` |
| `ExceptionService` | `common/exception/infrastructure/exception.service.ts` | Crear excepciones tipadas |
| `@Auth()` decorator | `common/helpers/infrastructure/decorators/auth.decorator.ts` | Para endpoint de crear API key |
| `@AuthUser()` decorator | `common/helpers/infrastructure/decorators/auth-user.decorator.ts` | Extraer user autenticado |
| `UserEntity` | `modules/users/infrastructure/persistence/user.entity.ts` | Relación FK en ApiKeyEntity |
| `JwtAuthGuard` pattern | `modules/auth/infrastructure/guards/jwt-auth.guard.ts` | Referencia para crear ApiKeyAuthGuard |

### Protocolo MCP — Streamable HTTP Transport

MCP (Model Context Protocol) usa Streamable HTTP como transport estándar. La integración con NestJS requiere:

1. **Server instance**: `new Server({ name: "markdown-mcp", version: "1.0.0" })` de `@modelcontextprotocol/sdk/server`
2. **Transport**: `StreamableHTTPServerTransport` de `@modelcontextprotocol/sdk/server/streamableHttp`
3. **Tools**: Se registran con `server.tool(name, schema, handler)` — el SDK maneja JSON-RPC
4. **Endpoints NestJS**:
   - POST `/api/mcp` → recibe requests JSON-RPC, responde via transport
   - GET `/api/mcp` → SSE stream para server-initiated messages
   - DELETE `/api/mcp` → cleanup de sesiones MCP
5. **Autenticación**: El SDK NO maneja auth — nosotros validamos el Bearer token ANTES de pasar al transport

### Hashing de API keys

Usar `crypto.createHash('sha256')` de Node.js nativo (NO bcrypt — bcrypt es lento por diseño, para passwords. SHA-256 es apropiado para API keys que ya tienen alta entropía).

```typescript
import { createHash } from 'crypto';
const hash = createHash('sha256').update(rawKey).digest('hex');
```

### Error codes del módulo MCP

| Code | Message | Server Message |
|---|---|---|
| MCP001 | Invalid or revoked API key. | API key hash {hash} not found or inactive |
| MCP002 | Permission denied. | User {userId} lacks permission on folder {folderId} |
| MCP003 | Folder not found. | Folder {folderId} does not exist |
| MCP004 | Document not found. | Document {documentId} does not exist |

### Anti-patrones a evitar

- **NO usar bcrypt para API keys** — usar SHA-256 (las keys ya tienen alta entropía)
- **NO crear un gateway WebSocket** para MCP — usar Streamable HTTP transport (estándar MCP)
- **NO duplicar la lógica de permisos** — reutilizar `CheckPermissionUseCase` existente
- **NO hardcodear strings** — enums para error codes, providers, use cases
- **NO crear DTOs para las herramientas MCP** — el SDK maneja la validación via Zod schemas
- **NO instalar express ni otro framework** — usar NestJS platform-express que ya está
- **NO crear middleware custom para auth** — usar el patrón Guard de NestJS (`CanActivate`)
- **NO exponer el raw API key** después de la creación — solo el prefix es visible post-creación

### Performance (NFR20: < 500ms)

- `list_folders`: Una query para todas las carpetas + N queries de permisos. Con < 50 carpetas es aceptable. Si escala, optimizar con query JOIN.
- `list_documents`: Una query por folderId (indexado).
- `read_document`: Una query por documentId (PK lookup).
- El bottleneck potencial es `list_folders` con muchas carpetas. Aceptable para MVP.

### Configuración MCP en Claude Code (para el usuario final)

```json
{
  "mcpServers": {
    "markdown": {
      "type": "streamable-http",
      "url": "http://localhost:3001/api/mcp",
      "headers": {
        "Authorization": "Bearer mk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

### Project Structure Notes

Archivos nuevos:
```
apps/api/src/modules/mcp/
├── domain/
│   ├── enums/
│   │   ├── mcp-errors.codes.ts
│   │   ├── mcp-providers.enum.ts
│   │   └── mcp-usecases.enum.ts
│   ├── interfaces/
│   │   └── api-key-repository.interface.ts
│   ├── types/
│   │   ├── api-key.type.ts
│   │   └── create-api-key.type.ts
│   └── index.ts
├── application/
│   ├── use-cases/
│   │   ├── validate-api-key.use-case.ts
│   │   ├── create-api-key.use-case.ts
│   │   ├── list-folders.use-case.ts
│   │   ├── list-documents.use-case.ts
│   │   ├── read-document.use-case.ts
│   │   └── __tests__/
│   │       ├── validate-api-key.use-case.spec.ts
│   │       ├── list-folders.use-case.spec.ts
│   │       ├── list-documents.use-case.spec.ts
│   │       └── read-document.use-case.spec.ts
│   └── index.ts
└── infrastructure/
    ├── api/
    │   └── mcp.controller.ts
    ├── guards/
    │   └── api-key-auth.guard.ts
    ├── persistence/
    │   └── api-key.entity.ts
    │   └── api-key-orm.repository.ts
    ├── services/
    │   └── mcp-server.service.ts
    ├── mcp.module.ts
    └── index.ts

apps/api/src/common/database/migrations/
└── 1711600000000-CreateApiKeysTable.ts
```

### References

- [Source: epic-07-mcp.md#Story 7.1] — ACs y user story
- [Source: 6-3-restauracion-de-versiones-anteriores.md] — Patrón de módulo, use case, repository, guard
- [Source: architecture.md#Backend] — Clean Architecture, factory DI, error codes
- [Source: CLAUDE.md] — Makefile commands, project structure, coding rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Created `api_keys` table migration with UUID PK, key_hash index, user_id FK with CASCADE
- Created MCP domain layer: error codes (MCP001-MCP004), providers enum, use cases enum, ApiKeyRepositoryInterface, types
- Created ValidateApiKeyUseCase with SHA-256 hashing and lastUsedAt tracking
- Created CreateApiKeyUseCase generating `mk_` prefixed keys with SHA-256 hash storage
- Created ListFoldersUseCase filtering by CheckPermissionUseCase per folder
- Created ListDocumentsUseCase with folder existence and permission validation
- Created ReadDocumentUseCase with document existence and permission validation
- Created ApiKeyOrmRepository with findByKeyHash (isActive filter), create, updateLastUsed
- Created ApiKeyAuthGuard implementing CanActivate, extracting Bearer mk_ tokens
- Created McpServerService with per-session McpServer instances and session-to-userId mapping
- Registered 3 MCP tools: list_folders, list_documents, read_document with Zod schemas
- Created McpController handling POST/GET/DELETE /api/mcp with StreamableHTTPServerTransport
- Created CreateApiKeyController: POST /api/mcp/keys (JWT protected) for API key generation
- Created McpModule with full factory DI wiring, imports FoldersModule, DocumentsModule, PermissionsModule
- Added McpModule to AppModule
- Installed @modelcontextprotocol/sdk@1.28.0 and zod@4.3.6
- 4 unit test suites (13 tests): validate-api-key, list-folders, list-documents, read-document
- 32 unit test suites (103 tests) total — zero regressions
- 161 E2E tests passing — zero regressions (2 transient ECONNREFUSED from hot-reload, confirmed passing on re-run)

### Change Log

- 2026-03-29: Story 7.1 implementation complete — MCP server with read operations, API key auth, and Streamable HTTP transport

### File List

**New files:**
- apps/api/src/common/database/migrations/1711600000000-CreateApiKeysTable.ts
- apps/api/src/modules/mcp/domain/enums/mcp-errors.codes.ts
- apps/api/src/modules/mcp/domain/enums/mcp-providers.enum.ts
- apps/api/src/modules/mcp/domain/enums/mcp-usecases.enum.ts
- apps/api/src/modules/mcp/domain/interfaces/api-key-repository.interface.ts
- apps/api/src/modules/mcp/domain/types/api-key.type.ts
- apps/api/src/modules/mcp/domain/types/create-api-key.type.ts
- apps/api/src/modules/mcp/domain/index.ts
- apps/api/src/modules/mcp/application/use-cases/validate-api-key.use-case.ts
- apps/api/src/modules/mcp/application/use-cases/create-api-key.use-case.ts
- apps/api/src/modules/mcp/application/use-cases/list-folders.use-case.ts
- apps/api/src/modules/mcp/application/use-cases/list-documents.use-case.ts
- apps/api/src/modules/mcp/application/use-cases/read-document.use-case.ts
- apps/api/src/modules/mcp/application/use-cases/__tests__/validate-api-key.use-case.spec.ts
- apps/api/src/modules/mcp/application/use-cases/__tests__/list-folders.use-case.spec.ts
- apps/api/src/modules/mcp/application/use-cases/__tests__/list-documents.use-case.spec.ts
- apps/api/src/modules/mcp/application/use-cases/__tests__/read-document.use-case.spec.ts
- apps/api/src/modules/mcp/application/index.ts
- apps/api/src/modules/mcp/infrastructure/persistence/api-key.entity.ts
- apps/api/src/modules/mcp/infrastructure/persistence/api-key-orm.repository.ts
- apps/api/src/modules/mcp/infrastructure/guards/api-key-auth.guard.ts
- apps/api/src/modules/mcp/infrastructure/services/mcp-server.service.ts
- apps/api/src/modules/mcp/infrastructure/api/mcp.controller.ts
- apps/api/src/modules/mcp/infrastructure/api/create-api-key.controller.ts
- apps/api/src/modules/mcp/infrastructure/dto/create-api-key.dto.ts
- apps/api/src/modules/mcp/infrastructure/mcp.module.ts
- apps/api/src/modules/mcp/infrastructure/index.ts

**Modified files:**
- apps/api/src/app.module.ts (+McpModule import)
- apps/api/package.json (+@modelcontextprotocol/sdk, +zod)
