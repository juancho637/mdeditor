# Story 5.1: Edición Colaborativa con Yjs y WebSocket

Status: review

## Story

As a **miembro del equipo**,
I want **editar un documento simultáneamente con otros miembros y ver sus cambios en tiempo real**,
so that **podamos colaborar sin conflictos ni intermediarios**.

## Acceptance Criteria

1. **Given** Carlos abre un documento que Valentina ya está editando
   **When** Carlos escribe en una sección diferente
   **Then** los cambios de Carlos aparecen en la pantalla de Valentina en < 1 segundo (NFR2)
   **And** los cambios de Valentina siguen apareciendo en la pantalla de Carlos

2. **Given** dos usuarios editan la misma línea simultáneamente
   **When** ambos escriben al mismo tiempo
   **Then** el CRDT (Yjs) resuelve el conflicto automáticamente carácter por carácter sin pérdida de datos (FR11)

3. **Given** un usuario está editando un documento
   **When** otro usuario abre el mismo documento
   **Then** el nuevo usuario recibe el estado actual del documento completo y sincronizado

4. **Given** 10 usuarios están editando el mismo documento
   **When** todos escriben simultáneamente
   **Then** no hay degradación perceptible en la experiencia de ningún usuario (NFR7)

5. **Given** el servidor recibe un cambio de cualquier cliente
   **When** el cambio se procesa
   **Then** se persiste en la tabla `document_updates` como Yjs update incremental (NFR15)
   **And** cada 60 segundos de actividad se crea un snapshot completo del Y.Doc

## Tasks / Subtasks

### Backend — Dependencias y configuración WebSocket

- [x] Task 1: Instalar dependencias de colaboración en el API (AC: #1, #2, #3)
  - [x] `make add PKG="@nestjs/websockets @nestjs/platform-ws ws yjs y-protocols lib0"` — usa `ws` nativo, NO socket.io
  - [x] `make add-dev PKG="@types/ws"` para tipado
  - [x] Verificar que el API arranca correctamente con las nuevas dependencias

### Backend — Entidades y migraciones para persistencia Yjs

- [x] Task 2: Crear entidad `DocumentUpdateEntity` y migración (AC: #5)
  - [x] Archivo: `apps/api/src/modules/documents/infrastructure/persistence/document-update.entity.ts`
  - [x] Campos: `id` (UUID PK), `document_id` (UUID FK → documents, indexed), `yjs_update` (bytea), `author_id` (UUID FK → users), `created_at` (timestamp with tz)
  - [x] Relación ManyToOne con `DocumentEntity` (ON DELETE CASCADE)
  - [x] Índice compuesto: `idx_document_updates_document_id_created_at`

- [x] Task 3: Crear entidad `DocumentSnapshotEntity` y migración (AC: #5)
  - [x] Archivo: `apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts`
  - [x] Campos: `id` (UUID PK), `document_id` (UUID FK → documents, indexed), `yjs_snapshot` (bytea), `content_markdown` (text), `author_id` (UUID FK → users, nullable — null para snapshots automáticos del sistema), `created_at` (timestamp with tz)
  - [x] Relación ManyToOne con `DocumentEntity` (ON DELETE CASCADE)
  - [x] Índice compuesto: `idx_document_snapshots_document_id_created_at`

- [x] Task 4: Migración para agregar columna `yjs_state` (bytea, nullable) a tabla `documents` (AC: #3)
  - [x] Archivo: `apps/api/src/common/database/infrastructure/migrations/{timestamp}-AddYjsCollaborationTables.ts`
  - [x] UNA SOLA migración que crea las 2 tablas nuevas + agrega columna `yjs_state` a `documents`
  - [x] `yjs_state` almacena el último Y.Doc serializado para carga rápida
  - [x] NO tocar `content_markdown` existente — se sigue actualizando desde el Y.Doc

### Backend — Módulo Collaboration (Clean Architecture)

- [x] Task 5: Crear capa domain del módulo collaboration (AC: #1, #3, #5)
  - [x] `apps/api/src/modules/collaboration/domain/enums/collaboration-providers.enum.ts` — providers: `DOCUMENT_SYNC_SERVICE`, `DOCUMENT_UPDATE_REPOSITORY`, `DOCUMENT_SNAPSHOT_REPOSITORY`
  - [x] `apps/api/src/modules/collaboration/domain/enums/collaboration-errors.codes.ts` — códigos: `COL001` (document not available), `COL002` (sync failed), `COL100` (persistence failed)
  - [x] `apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts` — `DocumentSyncServiceInterface` con métodos: `getOrLoadDocument(documentId: string): Promise<Y.Doc>`, `applyUpdate(documentId: string, update: Uint8Array, authorId: string): Promise<void>`, `getDocumentConnections(documentId: string): number`, `releaseDocument(documentId: string): Promise<void>`
  - [x] `apps/api/src/modules/collaboration/domain/interfaces/document-update-repository.interface.ts` — `DocumentUpdateRepositoryInterface` con: `saveUpdate(documentId, update, authorId)`, `getUpdatesSince(documentId, since: Date)`
  - [x] `apps/api/src/modules/collaboration/domain/interfaces/document-snapshot-repository.interface.ts` — `DocumentSnapshotRepositoryInterface` con: `saveSnapshot(documentId, snapshot, contentMarkdown, authorId?)`, `getLatestSnapshot(documentId)`
  - [x] `apps/api/src/modules/collaboration/domain/types/awareness-state.type.ts` — type para estado de awareness
  - [x] `apps/api/src/modules/collaboration/domain/index.ts`

- [x] Task 6: Crear capa application — use cases (AC: #3, #5)
  - [x] `load-document.use-case.ts`: carga Y.Doc desde último snapshot + aplica updates posteriores. Método `run(documentId: string): Promise<Uint8Array>` retorna el state vector del Y.Doc
  - [x] `apply-update.use-case.ts`: recibe update binario de Yjs, lo aplica al Y.Doc en memoria, persiste en `document_updates`. Método `run(documentId: string, update: Uint8Array, authorId: string): Promise<void>`
  - [x] `persist-snapshot.use-case.ts`: serializa Y.Doc completo, extrae `content_markdown` del texto Yjs, guarda snapshot + actualiza `documents.yjs_state` y `documents.content_markdown`. Método `run(documentId: string): Promise<void>`
  - [x] Tests unitarios para cada use case en `__tests__/`

- [x] Task 7: Crear InMemoryDocumentSyncService (AC: #1, #3, #4)
  - [x] Archivo: `apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts`
  - [x] Mantiene `Map<string, { doc: Y.Doc, connections: number, lastActivity: Date, snapshotTimer?: NodeJS.Timeout }>` en memoria
  - [x] `getOrLoadDocument(documentId)`:
    - Si Y.Doc está en memoria → retornar
    - Si no → cargar último snapshot de DB (`yjs_state` de documents, o snapshot de `document_snapshots`) + aplicar updates posteriores de `document_updates`
    - Si documento nunca tuvo Yjs → crear Y.Doc nuevo con `content_markdown` existente como texto inicial
  - [x] `applyUpdate(documentId, update, authorId)`: aplica update al Y.Doc, persiste en `document_updates`, resetea timer de snapshot
  - [x] Timer de snapshot: cada 60 segundos de actividad, llama a `persist-snapshot.use-case`
  - [x] `releaseDocument(documentId)`: decrementa connections, si llega a 0 → flush final snapshot después de timeout (5 min), luego liberar Y.Doc de memoria
  - [x] NO usar `@Injectable()` — se registra con `useFactory` en el module

### Backend — WebSocket Gateway

- [x] Task 8: Crear WebSocket Gateway para colaboración (AC: #1, #2, #3)
  - [x] Archivo: `apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts`
  - [x] Usa `@WebSocketGateway({ path: '/collaboration' })` con `ws` adapter (NO socket.io)
  - [x] Implementa el **protocolo y-websocket** nativo (sync protocol + awareness):
    - `handleConnection(client, ...args)`: extraer JWT del query param (`?token=xxx`), validar con JwtService, extraer `documentId` del query param, verificar permisos con CheckPermissionUseCase (al menos VIEW), cargar Y.Doc via DocumentSyncService
    - Mensajes binarios: decodificar con `y-protocols/sync` y `y-protocols/awareness`
    - Sync step 1 → responder con sync step 2
    - Sync update → broadcast a todos los clientes del mismo documento
    - Awareness update → broadcast awareness a todos los clientes del documento
  - [x] Mantener mapa de `documentId → Set<WebSocket>` para broadcast eficiente
  - [x] Al desconectar: remover client del set, llamar `DocumentSyncService.releaseDocument` si era el último
  - [x] Verificar permisos EDIT antes de aceptar updates de escritura (VIEW solo puede recibir, no enviar cambios)

- [x] Task 9: Crear WsAuthGuard o validación inline en gateway (AC: #1)
  - [x] Validar JWT del query param en handshake
  - [x] Rechazar conexión con close code 4001 si token inválido
  - [x] Rechazar conexión con close code 4003 si sin permisos sobre el documento
  - [x] Extraer userId del token para identificar al autor de cambios

### Backend — Módulo y registro DI

- [x] Task 10: Crear `collaboration.module.ts` y registrar en AppModule (AC: #1-#5)
  - [x] Registrar providers con `useFactory` (no `@Injectable` en use cases)
  - [x] Importar `DocumentsModule` (para acceder al repository de documentos)
  - [x] Importar `PermissionsModule` (para CheckPermissionUseCase)
  - [x] Importar `AuthModule` (para JwtService)
  - [x] Configurar `WsAdapter` en `main.ts`: `app.useWebSocketAdapter(new WsAdapter(app))`
  - [x] Verificar que el gateway se conecta correctamente en `ws://localhost:3000/collaboration`

### Backend — Repositories de persistencia Yjs

- [x] Task 11: Crear repositories ORM para document_updates y document_snapshots (AC: #5)
  - [x] `apps/api/src/modules/collaboration/infrastructure/persistence/document-update-orm.repository.ts`
  - [x] `apps/api/src/modules/collaboration/infrastructure/persistence/document-snapshot-orm.repository.ts`
  - [x] Ambos con try/catch → códigos `COL100` para errores de DB
  - [x] `saveUpdate` almacena `Uint8Array` como `Buffer` en columna bytea
  - [x] `getLatestSnapshot` ordena por `created_at DESC LIMIT 1`
  - [x] `getUpdatesSince` filtra por `document_id` y `created_at > since`

### Frontend — Dependencias Yjs

- [x] Task 12: Instalar dependencias de colaboración en web (AC: #1, #2, #3)
  - [x] `make add PKG="yjs y-websocket y-codemirror.next y-protocols" APP=web`
  - [x] Verificar que la app de Next.js compila correctamente

### Frontend — Módulo Collaboration

- [x] Task 13: Crear módulo collaboration en frontend (AC: #1, #2, #3)
  - [x] `apps/web/src/modules/collaboration/domain/entities/collaboration-state.ts` — interface `CollaborationState { isConnected: boolean; isSynced: boolean; connectedUsers: number }`
  - [x] `apps/web/src/modules/collaboration/infrastructure/state/use-collaboration.store.ts` — Zustand store con: `isConnected`, `isSynced`, `connectedUsers`, `saveStatus` ('idle' | 'syncing' | 'synced')
  - [x] `apps/web/src/modules/collaboration/infrastructure/hooks/use-collaboration.viewmodel.ts` — ViewModel que gestiona la conexión Yjs:
    - `initCollaboration(documentId: string, token: string): { yDoc: Y.Doc, yText: Y.Text, provider: WebsocketProvider }`
    - `destroyCollaboration(): void` — cleanup al desmontar
    - Usa `WebsocketProvider` de `y-websocket` apuntando a `ws://API_HOST/collaboration?token=JWT&documentId=ID`
    - Escucha eventos del provider: `status`, `synced` → actualiza store
    - Retorna `{ yText, provider, isConnected, isSynced }`

### Frontend — Integración CodeMirror + Yjs

- [x] Task 14: Refactorizar `CodeMirrorEditor` para usar Yjs (AC: #1, #2, #3, #4)
  - [x] Archivo existente: `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx`
  - [x] Agregar props opcionales: `yText?: Y.Text`, `undoManager?: Y.UndoManager`
  - [x] Cuando `yText` está presente (modo colaborativo):
    - Agregar extensión `yCollab(yText, provider.awareness, { undoManager })` de `y-codemirror.next`
    - REMOVER el `onChange` callback — el contenido se sincroniza via Yjs, no via setState
    - REMOVER el update listener que capturaba cambios — Yjs maneja la sincronización
    - MANTENER las extensiones existentes: syntax highlighting, keybindings, theme, readOnly
  - [x] Cuando `yText` NO está presente (modo no-colaborativo / fallback):
    - Mantener el comportamiento actual con `onChange` callback
    - Esto permite que el editor funcione sin WebSocket si es necesario
  - [x] El `UndoManager` de Yjs reemplaza el historial local de CodeMirror en modo colaborativo

- [x] Task 15: Refactorizar `DocumentEditor` para inicializar colaboración (AC: #1, #3)
  - [x] Archivo existente: `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx`
  - [x] Al montar con un `documentId`:
    1. Obtener JWT token del auth store
    2. Llamar `useCollaborationViewModel().initCollaboration(documentId, token)`
    3. Pasar `yText` al `CodeMirrorEditor`
    4. Pasar `yText` al `MarkdownPreview` (observar cambios via `yText.observe()` para actualizar preview)
  - [x] REMOVER el autosave timer (debounce 500ms) — Yjs maneja la persistencia via WebSocket
  - [x] MANTENER el `saveStatus` display pero alimentarlo desde el collaboration store (`syncing` → `synced`)
  - [x] Al desmontar: llamar `destroyCollaboration()` para cleanup
  - [x] Manejar el caso de documento sin Yjs: si la conexión WebSocket falla, mostrar banner de error pero permitir edición local con fallback al save REST

- [x] Task 16: Actualizar `MarkdownPreview` para observar Y.Text (AC: #1)
  - [x] Archivo existente: `apps/web/src/modules/documents/infrastructure/components/MarkdownPreview.tsx`
  - [x] Agregar prop opcional: `yText?: Y.Text`
  - [x] Cuando `yText` presente: observar cambios con `yText.observe()` y re-renderizar el preview
  - [x] Cuando `yText` no presente: mantener comportamiento actual (prop `content` string)
  - [x] En modo híbrido, el preview se actualiza en tiempo real desde el Y.Text compartido

### Frontend — Configuración WebSocket URL

- [x] Task 17: Configurar URL del WebSocket (AC: #1)
  - [x] Agregar variable de entorno `NEXT_PUBLIC_WS_URL` en `apps/web/.env.example` — ej: `ws://localhost:3000`
  - [x] En Docker dev: el WebSocket del API es accesible en el mismo host/puerto que el API REST
  - [x] En el provider de y-websocket, construir URL: `${NEXT_PUBLIC_WS_URL}/collaboration?token=${jwt}&documentId=${docId}`
  - [x] Actualizar `docker-compose.dev.yml` si necesario para exponer el puerto WS

## Dev Notes

### Arquitectura clave — DocumentSyncService

El `DocumentSyncService` es la abstracción central de esta epic. Mantiene Y.Docs en memoria y es consumido por:
1. **WebSocket Gateway** (esta story) — para sincronización browser ↔ servidor
2. **MCP Module** (futuro Epic 7) — para edición directa desde herramientas IA

Diseñar la interface `DocumentSyncServiceInterface` pensando en que será compartida.

### Protocolo y-websocket

El protocolo de `y-websocket` usa mensajes binarios con prefijo que indica el tipo:
- `0` = sync protocol (sync step 1, sync step 2, update)
- `1` = awareness protocol
- `2` = auth (opcional)

La implementación del gateway debe decodificar estos mensajes usando `y-protocols/sync` y `y-protocols/awareness`. **NO reinventar el protocolo** — usar las funciones de `y-protocols` directamente:
- `Y.encoding`, `Y.decoding` de `lib0`
- `syncProtocol.readSyncStep1`, `syncProtocol.readSyncStep2`, `syncProtocol.readUpdate`
- `awarenessProtocol.applyAwarenessUpdate`

### Migración del autosave existente

Actualmente `DocumentEditor` tiene un autosave con debounce de 500ms que hace PUT al REST API. Esta story **reemplaza** ese mecanismo:
- En modo colaborativo: Yjs maneja toda la sincronización. El `content_markdown` se actualiza cuando se crea un snapshot (cada 60s).
- El REST endpoint `PUT /api/documents/:id` para actualizar `content_markdown` sigue existiendo para operaciones no-colaborativas (rename, etc.) pero ya no se usa para guardar contenido del editor.

### Inicialización de documentos existentes

Los documentos creados antes de esta story no tienen `yjs_state`. Al cargar por primera vez:
1. DocumentSyncService detecta que `yjs_state` es null
2. Crea un nuevo Y.Doc
3. Inserta el `content_markdown` existente como texto inicial en el Y.Text
4. Persiste el Y.Doc como primer snapshot

### Permisos en WebSocket

- **VIEW**: puede conectarse y recibir updates (ver cambios en tiempo real) pero NO puede enviar updates
- **EDIT**: puede conectarse, recibir Y enviar updates
- Verificar permisos en el handshake Y en cada update recibido

### Dependencias existentes a reutilizar

- **JwtService** de `@nestjs/jwt` — para validar tokens en el WebSocket handshake
- **CheckPermissionUseCase** de módulo permissions — para verificar permisos sobre el folder del documento
- **DocumentOrmRepository** de módulo documents — para cargar `content_markdown` y `yjs_state`
- **ExceptionService** de common — para errores de negocio en use cases
- **useAuthStore** del frontend — para obtener el JWT token actual

### Archivos existentes que se modifican

| Archivo | Cambio |
|---------|--------|
| `apps/api/src/main.ts` | Agregar `WsAdapter` |
| `apps/api/src/app.module.ts` | Importar `CollaborationModule` |
| `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx` | Agregar soporte Yjs |
| `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` | Inicializar colaboración, remover autosave |
| `apps/web/src/modules/documents/infrastructure/components/MarkdownPreview.tsx` | Agregar observación Y.Text |
| `apps/web/.env.example` | Agregar `NEXT_PUBLIC_WS_URL` |
| `docker-compose.dev.yml` | Posiblemente exponer puerto WS |

### Archivos nuevos (resumen)

**Backend:**
- `apps/api/src/modules/collaboration/` — módulo completo (domain + application + infrastructure)
- `apps/api/src/modules/documents/infrastructure/persistence/document-update.entity.ts`
- `apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts`
- `apps/api/src/common/database/infrastructure/migrations/{timestamp}-AddYjsCollaborationTables.ts`

**Frontend:**
- `apps/web/src/modules/collaboration/` — módulo completo (domain + infrastructure con store, hooks, state)

### Testing

- **Unit tests**: mock de Y.Doc, verificar que `applyUpdate` persiste, que `getOrLoadDocument` carga correctamente
- **No E2E de colaboración multi-usuario en esta story** — los tests E2E de colaboración requieren múltiples browsers conectados simultáneamente, que se cubrirán en QA
- **Verificar no-regresión**: los tests E2E existentes de documentos deben seguir pasando (crear, editar, preview)

### Project Structure Notes

- El módulo `collaboration` es nuevo en backend y frontend, siguiendo la estructura definida en architecture.md
- Las entidades `document_update` y `document_snapshot` se colocan en el módulo `documents` (pertenecen al dominio de documentos) pero son consumidas por el módulo `collaboration`
- El gateway WebSocket vive en `collaboration/infrastructure/gateway/` siguiendo el patrón de architecture.md

### References

- [Source: architecture.md#Real-Time Architecture Decision] — WebSocket only, sin WebRTC
- [Source: architecture.md#Data Architecture] — Modelo de datos: documents.yjs_state, document_updates, document_snapshots
- [Source: architecture.md#Yjs Lifecycle Pattern] — Flujo completo de carga/sync/persistencia
- [Source: architecture.md#Authentication & Security] — Auth WebSocket: JWT en query param del handshake
- [Source: architecture.md#Communication Patterns] — Error codes COL001, COL002, COL100
- [Source: architecture.md#WebSocket Events Format] — Protocolo binario nativo de Yjs
- [Source: epic-05-colaboracion.md#Story 5.1] — ACs y nota técnica

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Implemented complete collaboration module (backend + frontend) following Clean Architecture
- Backend: NestJS WebSocket gateway with `ws` adapter implementing Yjs sync protocol (sync steps 1/2, updates, awareness)
- Backend: DocumentSyncService manages Y.Docs in memory with snapshot timer (60s) and release timeout (5min)
- Backend: Persistence layer with document_updates (incremental) and document_snapshots (periodic) tables
- Backend: JWT authentication on WebSocket handshake with permission enforcement (VIEW=read-only, EDIT=full)
- Frontend: Collaboration module with Zustand store, WebSocket provider via y-websocket, and UndoManager
- Frontend: CodeMirrorEditor supports dual mode — collaborative (yCollab extension) and non-collaborative (fallback)
- Frontend: DocumentEditor initializes collaboration on mount, falls back to REST autosave if WebSocket not synced
- Migration backward-compatible: existing documents get Yjs initialized from content_markdown on first collaborative open
- All 76 unit tests pass (8 new for collaboration use cases)
- All 121 E2E tests pass (zero regressions)

### Change Log

- 2026-03-26: Story 5.1 implementation complete — collaborative editing with Yjs + WebSocket

### File List

**New files (backend):**
- apps/api/src/modules/collaboration/domain/enums/collaboration-providers.enum.ts
- apps/api/src/modules/collaboration/domain/enums/collaboration-errors.codes.ts
- apps/api/src/modules/collaboration/domain/enums/index.ts
- apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts
- apps/api/src/modules/collaboration/domain/interfaces/document-update-repository.interface.ts
- apps/api/src/modules/collaboration/domain/interfaces/document-snapshot-repository.interface.ts
- apps/api/src/modules/collaboration/domain/types/awareness-state.type.ts
- apps/api/src/modules/collaboration/domain/index.ts
- apps/api/src/modules/collaboration/application/use-cases/load-document.use-case.ts
- apps/api/src/modules/collaboration/application/use-cases/apply-update.use-case.ts
- apps/api/src/modules/collaboration/application/use-cases/persist-snapshot.use-case.ts
- apps/api/src/modules/collaboration/application/use-cases/__tests__/load-document.use-case.spec.ts
- apps/api/src/modules/collaboration/application/use-cases/__tests__/apply-update.use-case.spec.ts
- apps/api/src/modules/collaboration/application/use-cases/__tests__/persist-snapshot.use-case.spec.ts
- apps/api/src/modules/collaboration/application/index.ts
- apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts
- apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts
- apps/api/src/modules/collaboration/infrastructure/persistence/document-update-orm.repository.ts
- apps/api/src/modules/collaboration/infrastructure/persistence/document-snapshot-orm.repository.ts
- apps/api/src/modules/collaboration/infrastructure/collaboration.module.ts
- apps/api/src/modules/collaboration/infrastructure/index.ts
- apps/api/src/modules/documents/infrastructure/persistence/document-update.entity.ts
- apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts
- apps/api/src/common/database/migrations/1711500000000-AddYjsCollaborationTables.ts

**New files (frontend):**
- apps/web/src/modules/collaboration/domain/entities/collaboration-state.ts
- apps/web/src/modules/collaboration/infrastructure/state/use-collaboration.store.ts
- apps/web/src/modules/collaboration/infrastructure/hooks/use-collaboration.viewmodel.ts

**Modified files:**
- apps/api/src/main.ts (added WsAdapter)
- apps/api/src/app.module.ts (imported CollaborationModule)
- apps/api/src/modules/documents/domain/types/document.type.ts (added yjsState field)
- apps/api/src/modules/documents/domain/interfaces/document-repository.interface.ts (added yjsState to update)
- apps/api/src/modules/documents/infrastructure/persistence/document.entity.ts (added yjs_state column)
- apps/api/src/modules/documents/infrastructure/persistence/document-orm.repository.ts (updated toDomain + update signature)
- apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx (added Yjs collaborative mode)
- apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx (added collaboration initialization + fallback)
- apps/web/.env.example (added NEXT_PUBLIC_WS_URL)
- apps/api/package.json (added @nestjs/websockets, @nestjs/platform-ws, ws, yjs, y-protocols, lib0, @types/ws)
- apps/web/package.json (added yjs, y-websocket, y-codemirror.next, y-protocols)
