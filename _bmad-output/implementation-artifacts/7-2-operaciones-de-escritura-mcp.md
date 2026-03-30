# Story 7.2: Operaciones de Escritura MCP

Status: done

## Story

As a **desarrollador (como Carlos) usando Claude Code**,
I want **crear y editar documentos directamente desde herramientas de IA vía MCP**,
so that **el contenido generado por IA se publique directamente en la plataforma y el equipo lo vea en tiempo real**.

## Acceptance Criteria

1. **Given** Carlos tiene permiso de edición sobre la carpeta "Marketing"
   **When** ejecuta `create_document` con carpeta, título y contenido markdown
   **Then** el documento se crea en la carpeta especificada
   **And** el contenido markdown se persiste correctamente

2. **Given** Carlos tiene permiso de edición sobre un documento existente
   **When** ejecuta `edit_document` con nuevo contenido markdown
   **Then** el contenido del documento se actualiza vía Y.Doc en memoria
   **And** los cambios se propagan via WebSocket a todos los usuarios conectados

3. **Given** una operación MCP de edición se completa exitosamente
   **When** verifico el historial del documento
   **Then** el cambio aparece registrado con el autor correcto y timestamp

4. **Given** la API key de Carlos solo tiene permiso "Ver" sobre la carpeta "Técnico"
   **When** intenta ejecutar `edit_document` o `create_document` en esa carpeta
   **Then** recibe error descriptivo con código AKY002 indicando que necesita permiso de edición

5. **Given** Carlos intenta editar un documento que no existe
   **When** ejecuta `edit_document` con un ID inválido
   **Then** recibe error con código AKY004 (Document not found)

## Tasks / Subtasks

### Task 1: MCP Mutation — `create_document` (AC: #1, #4)

- [x] 1.1 Crear `CreateDocumentMcpMutation` en `modules/api-keys/infrastructure/mcp/mutation/create-document.mcp-mutation.ts`:
  - Seguir el patrón exacto de `ListDocumentsMcpQuery`
  - Zod schema: `{ folder_id: z.string().uuid(), title: z.string().min(1), content: z.string().optional() }`
  - Flow:
    1. `checkPermission.run(userId, folder_id)` → si no EDIT → throw AKY002
    2. `createDocumentUseCase.run({ title, folderId: folder_id, createdBy: userId })`
    3. Si `content` fue proporcionado: cargar Y.Doc via syncService, insertar contenido en yText, persistir snapshot
    4. Retornar `{ id, title, slug, folder_id }` como JSON text

### Task 2: MCP Mutation — `edit_document` (AC: #2, #3, #4, #5)

- [x] 2.1 Crear `EditDocumentMcpMutation` en `modules/api-keys/infrastructure/mcp/mutation/edit-document.mcp-mutation.ts`:
  - Zod schema: `{ document_id: z.string().uuid(), content: z.string() }`
  - Flow:
    1. `documentRepository.findById(document_id)` → si no existe → throw AKY004
    2. `checkPermission.run(userId, document.folderId)` → si no EDIT → throw AKY002
    3. `syncService.getOrLoadDocument(document_id)` para obtener Y.Doc en memoria
    4. Reemplazar contenido del Y.Doc: `yDoc.transact(() => { yText.delete(0, yText.length); yText.insert(0, content); })`
    5. Crear update desde la transacción y persistir via `syncService.applyUpdate()`
    6. Retornar `{ id, title, updated: true }`
  - IMPORTANTE: La transacción Y.js genera automáticamente un update que se propaga via el `observe` handler a los clientes WebSocket conectados

### Task 3: Exportar `DocumentSyncService` y `CreateDocumentUseCase` (AC: #1, #2)

- [x] 3.1 En `DocumentsModule`: exportar `DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE` además de `DOCUMENT_REPOSITORY`
- [x] 3.2 En `CollaborationModule`: verificar que `DOCUMENT_SYNC_SERVICE` ya está exportado (ya lo está)
- [x] 3.3 En `ApiKeysModule`: importar `CollaborationModule` y agregar las dependencias necesarias

### Task 4: Registrar mutations MCP en `ApiKeysModule` (AC: #1-#5)

- [x] 4.1 En el factory `MCP_TOOL_REGISTRATION` de `api-keys.module.ts`:
  - Inyectar: `CreateDocumentUseCase`, `DocumentSyncServiceInterface`, `PersistSnapshotUseCase`
  - Crear instancias de `CreateDocumentMcpMutation` y `EditDocumentMcpMutation`
  - Registrar ambas con `mcpService.registerTools()`

### Task 5: Broadcast de cambios Y.Doc a WebSocket clients (AC: #2)

- [x] 5.1 Implementado via callback pattern: `DocumentSyncServiceInterface.setOnUpdateBroadcast()` + `applyExternalUpdate()` que persiste Y diferencia updates de WebSocket vs MCP para evitar double-broadcast.
- [x] 5.2 `CollaborationGateway` registra `onUpdateBroadcast` callback que codifica y envía updates a todos los clientes WebSocket conectados al documento.

### Task 6: Unit tests (AC: #1-#5)

- [x] 6.1 `create-document.mcp-mutation.spec.ts`:
  - Con permiso EDIT → crea documento exitosamente
  - Con permiso VIEW → throw AKY002
  - Sin permiso (null) → throw AKY002
  - Con contenido → crea documento y establece contenido markdown
  - Sin contenido → crea documento vacío
- [x] 6.2 `edit-document.mcp-mutation.spec.ts`:
  - Documento existente con permiso EDIT → actualiza contenido
  - Documento no encontrado → throw AKY004
  - Sin permiso EDIT → throw AKY002
  - Contenido se reemplaza completamente (no append)

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente                    | Archivo                                                                            | Qué reutilizar                                    |
| ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `CreateDocumentUseCase`       | `modules/documents/application/use-cases/create-document.use-case.ts`              | Crear documentos (valida folder, genera slug)     |
| `InMemoryDocumentSyncService` | `modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts` | `getOrLoadDocument()`, `applyUpdate()` para Y.Doc |
| `PersistSnapshotUseCase`      | `modules/collaboration/application/use-cases/persist-snapshot.use-case.ts`         | Persistir estado Y.Doc tras cambios               |
| `CheckPermissionUseCase`      | `modules/permissions/application/use-cases/check-permission.use-case.ts`           | Verificar permiso EDIT                            |
| `DocumentRepository`          | `modules/documents/domain/interfaces/document-repository.interface.ts`             | `findById()`                                      |
| `ListDocumentsMcpQuery`       | `modules/api-keys/infrastructure/mcp/query/list-documents.mcp-query.ts`            | **Patrón de referencia** para crear mutations     |
| `PermissionLevel.EDIT`        | `modules/permissions/domain/enums/permission-level.enum.ts`                        | Comparar permiso requerido                        |
| `apiKeyErrorsCodes`           | `modules/api-keys/domain/enums/api-key-errors.codes.ts`                            | AKY001-AKY004 ya definidos                        |
| `CollaborationGateway`        | `modules/collaboration/infrastructure/gateway/collaboration.gateway.ts`            | Broadcast de updates WebSocket                    |

### Integración Y.js para edit_document

El flujo de edición MCP debe modificar el Y.Doc en memoria para que los cambios se propaguen a los clientes WebSocket:

```typescript
import * as Y from 'yjs';

// 1. Obtener el Y.Doc del documento
const yDoc = await syncService.getOrLoadDocument(documentId);

// 2. Capturar el update de la transacción
let capturedUpdate: Uint8Array | null = null;
const observer = (update: Uint8Array) => {
  capturedUpdate = update;
};
yDoc.on('update', observer);

// 3. Modificar el contenido en una transacción
yDoc.transact(() => {
  const yText = yDoc.getText('content');
  yText.delete(0, yText.length);
  yText.insert(0, newContent);
});

yDoc.off('update', observer);

// 4. Persistir el update
if (capturedUpdate) {
  await syncService.applyUpdate(documentId, capturedUpdate, userId);
}
```

NOTA: `syncService.applyUpdate()` NO aplica `Y.applyUpdate()` — solo persiste y agenda snapshot. El `Y.applyUpdate` ya ocurrió en el `transact()`.

### Broadcast a clientes WebSocket

El `CollaborationGateway` actual solo reenvía updates que recibe via WebSocket. Para que los cambios MCP se propaguen, hay que agregar un mecanismo de broadcast. La opción más limpia:

1. Hacer que `InMemoryDocumentSyncService` acepte un callback `onUpdate(documentId, update)` similar al existente `onDocumentInvalidated`
2. El `CollaborationGateway` registra ese callback en `onModuleInit` para broadcast a clientes conectados
3. Las mutations MCP llaman `syncService.applyUpdate()` que ya dispara el callback

**Alternativa más simple**: Exponer un método `broadcastUpdate(documentId: string, update: Uint8Array)` en el gateway, e inyectar el gateway en las mutations. Pero esto acopla MCP con el gateway.

**Decisión recomendada**: Usar el callback pattern ya establecido (`setOnDocumentInvalidated`). Agregar `setOnUpdateBroadcast(callback)` al `DocumentSyncServiceInterface` y que el gateway lo registre.

### Error codes del módulo API Keys (ya existentes)

| Code   | Message                     | Uso en esta story                   |
| ------ | --------------------------- | ----------------------------------- |
| AKY001 | Invalid or revoked API key. | Auth fallida                        |
| AKY002 | Permission denied.          | Sin permiso EDIT en carpeta         |
| AKY003 | Folder not found.           | Carpeta no existe (create_document) |
| AKY004 | Document not found.         | Documento no existe (edit_document) |

### Anti-patrones a evitar

- **NO hacer update directo a la BD** para editar contenido — siempre via Y.Doc para mantener consistencia con la colaboración en tiempo real
- **NO crear un nuevo Y.Doc** — usar `syncService.getOrLoadDocument()` que maneja el ciclo de vida
- **NO duplicar la lógica de permisos** — reutilizar `CheckPermissionUseCase`
- **NO crear use cases nuevos en el módulo MCP** — las mutations son clases simples en `api-keys/infrastructure/mcp/mutation/`
- **NO olvidar persistir el snapshot** después de editar via MCP — el `applyUpdate` del syncService agenda snapshot automáticamente
- **NO hardcodear strings** — usar `apiKeyErrorsCodes` existentes

### Módulos que necesitan exportar providers adicionales

- `DocumentsModule`: Agregar `CREATE_DOCUMENT_USE_CASE` a exports (actualmente solo exporta `DOCUMENT_REPOSITORY`)
- `CollaborationModule`: Ya exporta `DOCUMENT_SYNC_SERVICE` — suficiente

### Sobre el cursor IA y awareness (AC#3 del epic original)

El AC original menciona cursor púrpura con "🤖 Claude". Sin embargo, las mutations MCP son operaciones atómicas (no typing en tiempo real), por lo que **no aplica** el awareness protocol aquí. El cursor IA sería relevante si se implementara streaming de edición, pero eso está fuera de alcance. Los cambios MCP simplemente aparecen como un "salto" en el contenido del documento — el historial registra quién lo hizo.

### Project Structure Notes

Archivos nuevos:

```
apps/api/src/modules/api-keys/infrastructure/mcp/mutation/
├── create-document.mcp-mutation.ts
└── edit-document.mcp-mutation.ts

apps/api/src/modules/api-keys/infrastructure/mcp/mutation/__tests__/
├── create-document.mcp-mutation.spec.ts
└── edit-document.mcp-mutation.spec.ts
```

Archivos modificados:

```
apps/api/src/modules/api-keys/infrastructure/api-keys.module.ts  (+imports, +factory deps, +mutation registration)
apps/api/src/modules/documents/infrastructure/documents.module.ts  (+export CREATE_DOCUMENT_USE_CASE)
apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts  (+setOnUpdateBroadcast callback)
apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts  (+onUpdateBroadcast callback, invoke in applyUpdate)
apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts  (+register onUpdateBroadcast for WebSocket broadcast)
```

### References

- [Source: epic-07-mcp.md#Story 7.2] — ACs y user story
- [Source: 7-1-servidor-mcp-con-operaciones-de-lectura.md] — Patrón de MCP query, module wiring, error codes
- [Source: modules/api-keys/infrastructure/mcp/query/list-documents.mcp-query.ts] — Patrón de referencia para mutations
- [Source: modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts] — DocumentSyncService API
- [Source: modules/collaboration/infrastructure/gateway/collaboration.gateway.ts] — WebSocket broadcast pattern
- [Source: CLAUDE.md] — Makefile commands, project structure, coding rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Created `CreateDocumentMcpMutation` — MCP tool `create_document` with folder permission check, Y.Doc content initialization, and release
- Created `EditDocumentMcpMutation` — MCP tool `edit_document` with document lookup, EDIT permission check, Y.Doc content replacement via transact
- Added `applyExternalUpdate()` to `DocumentSyncServiceInterface` — differentiates MCP-originated updates (need broadcast) from WebSocket-originated updates (already broadcasted by gateway)
- Added `setOnUpdateBroadcast()` callback pattern to `DocumentSyncServiceInterface` — same pattern as existing `setOnDocumentInvalidated`
- `CollaborationGateway` registers broadcast callback to send MCP updates to connected WebSocket clients
- Exported `CREATE_DOCUMENT_USE_CASE` from `DocumentsModule` for DI in `ApiKeysModule`
- Imported `CollaborationModule` in `ApiKeysModule` for `DOCUMENT_SYNC_SERVICE` access
- 2 new test suites (10 tests): create-document.mcp-mutation, edit-document.mcp-mutation
- 31 unit test suites (105 tests) total — zero regressions
- 173 E2E tests passing — zero regressions

### Change Log

- 2026-03-29: Story 7.2 implementation complete — MCP write operations (create_document, edit_document) with Y.js collaboration sync and WebSocket broadcast

### File List

**New files:**

- apps/api/src/modules/api-keys/infrastructure/mcp/mutation/create-document.mcp-mutation.ts
- apps/api/src/modules/api-keys/infrastructure/mcp/mutation/edit-document.mcp-mutation.ts
- apps/api/src/modules/api-keys/infrastructure/mcp/mutation/**tests**/create-document.mcp-mutation.spec.ts
- apps/api/src/modules/api-keys/infrastructure/mcp/mutation/**tests**/edit-document.mcp-mutation.spec.ts

**Modified files:**

- apps/api/src/modules/api-keys/infrastructure/api-keys.module.ts (+CollaborationModule import, +CreateDocumentUseCase, +DocumentSyncService DI, +mutation registration)
- apps/api/src/modules/documents/infrastructure/documents.module.ts (+export CREATE_DOCUMENT_USE_CASE)
- apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts (+DocumentUpdateBroadcastCallback type, +applyExternalUpdate, +setOnUpdateBroadcast)
- apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts (+applyExternalUpdate, +onUpdateBroadcast callback, +setOnUpdateBroadcast)
- apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts (+broadcastUpdate method, +register onUpdateBroadcast callback)
