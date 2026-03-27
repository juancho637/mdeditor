# Story 6.3: Restauración de Versiones Anteriores

Status: done

## Story

As a **usuario con permiso de edición**,
I want **restaurar un documento a una versión anterior del historial**,
so that **pueda revertir cambios no deseados con confianza**.

## Acceptance Criteria

1. **Given** estoy viendo el diff de una versión anterior en el panel de actividad
   **When** hago clic en "Restaurar esta versión"
   **Then** aparece un dialog de confirmación: "¿Restaurar documento a la versión de [fecha]? Se creará una nueva entrada en el historial."

2. **Given** confirmo la restauración
   **When** el sistema procesa la operación
   **Then** el contenido del documento se reemplaza por el de la versión seleccionada
   **And** se crea una nueva entrada en el historial: "Restaurado a versión de [fecha] por [usuario]"
   **And** todos los usuarios conectados ven el cambio en tiempo real

3. **Given** restauro una versión
   **When** miro el historial después
   **Then** la restauración no elimina el historial previo — es una nueva entrada que apunta a la versión restaurada

4. **Given** no tengo permiso de edición sobre la carpeta del documento
   **When** intento restaurar una versión
   **Then** el botón "Restaurar" no está disponible

## Tasks / Subtasks

### Task 1: Backend — Crear RestoreSnapshotUseCase (AC: #2, #3)

- [x] 1.1 Agregar error code `HST003` en `history-errors.codes.ts`: "Cannot restore snapshot" / "Failed to restore snapshot to document"
- [x] 1.2 Agregar `RESTORE_SNAPSHOT` en `history-usecases.enum.ts`
- [x] 1.3 Agregar `RESTORE_SNAPSHOT` en `history-providers.enum.ts`
- [x] 1.4 Crear type `RestoreSnapshotResultType` en `domain/types/`:
  ```typescript
  export type RestoreSnapshotResultType = {
    documentId: string;
    restoredFromSnapshotId: string;
    newSnapshotId: string;
    contentMarkdown: string;
  };
  ```
- [x] 1.5 Agregar método `saveSnapshot` al `HistoryRepositoryInterface`:
  ```typescript
  saveSnapshot(
    documentId: string,
    contentMarkdown: string,
    authorId: string
  ): Promise<string>; // returns new snapshot ID
  ```
- [x] 1.6 Implementar `saveSnapshot` en `HistoryOrmRepository`:
  - Crear nuevo `DocumentSnapshotEntity` sin `yjs_snapshot` (null) — es un snapshot de restauración, no tiene estado Yjs asociado
  - Retornar el ID del nuevo snapshot
- [x] 1.7 Crear `RestoreSnapshotUseCase` en `application/use-cases/restore-snapshot.use-case.ts`:
  ```
  Input: documentId, snapshotId, authUser
  Flow:
    1. Get snapshot detail via historyRepository.findSnapshotById(snapshotId)
       → Si no existe: throw HST001
    2. Verify snapshot belongs to document (snapshot.documentId === documentId)
       → Si no: throw HST001
    3. Get document via documentRepository.findById(documentId)
       → Si no existe: throw DOC001
    4. Check EDIT permission via checkPermission.run(authUser.id, document.folderId)
       → Si null o VIEW: throw PRM002
    5. Update document content:
       documentRepository.update(documentId, {
         contentMarkdown: snapshot.contentMarkdown,
         yjsState: null  // Force Y.Doc re-creation from markdown on next load
       })
    6. Create restoration snapshot:
       historyRepository.saveSnapshot(documentId, snapshot.contentMarkdown, authUser.id)
    7. Notify WebSocket: syncService.forceDocumentReload(documentId, snapshot.contentMarkdown)
    8. Return RestoreSnapshotResultType
  ```
  - Dependencias: historyRepository, documentRepository, checkPermission, exceptionService, syncService

### Task 2: Backend — Agregar forceDocumentReload al DocumentSyncService (AC: #2)

- [x] 2.1 Agregar método `forceDocumentReload` al `DocumentSyncServiceInterface`:
  ```typescript
  forceDocumentReload(documentId: string, newContent: string): void;
  ```
- [x] 2.2 Implementar en `InMemoryDocumentSyncService`:
  ```
  1. Get entry from documents Map
  2. If entry exists (document loaded in memory):
     a. Create new Y.Doc
     b. yDoc.getText('content').insert(0, newContent)
     c. Replace entry.doc with new Y.Doc
     d. Encode full state: Y.encodeStateAsUpdate(newDoc)
     e. Broadcast update to all connected clients via gateway callback
  3. If entry doesn't exist: no-op (no active connections, next load will pick up DB state)
  ```
- [x] 2.3 Agregar callback de broadcast en el gateway:
  - Al inicializar syncService, registrar callback para broadcast
  - El callback recibe (documentId, update) y envía a todos los clients del documento
  - Usar el mismo patrón de encoding que ya usa el gateway para Yjs sync updates

### Task 3: Backend — Crear controller y DTO (AC: #2)

- [x] 3.1 Crear `RestoreSnapshotController` en `infrastructure/api/restore-snapshot.controller.ts`:
  ```
  POST /api/documents/:documentId/snapshots/:snapshotId/restore
  @Auth() decorator
  Params: documentId (UUID), snapshotId (UUID)
  Response: RestoreSnapshotPresenter
  ```
- [x] 3.2 Crear `RestoreSnapshotParamsDto` en `infrastructure/dto/`:
  ```typescript
  export class RestoreSnapshotParamsDto {
    @IsUUID() document_id: string;
    @IsUUID() snapshot_id: string;
  }
  ```
- [x] 3.3 Crear `RestoreSnapshotPresenter` en `infrastructure/presenters/`:
  ```typescript
  {
    document_id: string;
    restored_from_snapshot_id: string;
    new_snapshot_id: string;
    message: string; // "Document restored to version of [date]"
  }
  ```
- [x] 3.4 Registrar use case y controller en `history.module.ts`
- [x] 3.5 Importar `CollaborationModule` en `HistoryModule` para acceder al `DocumentSyncService`

### Task 4: Backend — Unit test para RestoreSnapshotUseCase (AC: #2, #3, #4)

- [x] 4.1 Crear `restore-snapshot.use-case.spec.ts` en `application/use-cases/__tests__/`:
  - Test: restaura exitosamente y crea nuevo snapshot
  - Test: snapshot no encontrado → HST001
  - Test: snapshot no pertenece al documento → HST001
  - Test: documento no encontrado → DOC001
  - Test: sin permiso EDIT → PRM002
  - Test: permiso VIEW → PRM002

### Task 5: Frontend — Agregar método `restoreSnapshot` al repository y store (AC: #2)

- [x] 5.1 Agregar al `HistoryRepository` interface:
  ```typescript
  restoreSnapshot(documentId: string, snapshotId: string): Promise<RestoreResult>;
  ```
- [x] 5.2 Agregar type `RestoreResult` a entities:
  ```typescript
  export interface RestoreResult {
    documentId: string;
    restoredFromSnapshotId: string;
    newSnapshotId: string;
    message: string;
  }
  ```
- [x] 5.3 Implementar en `HistoryV1Repository`:
  ```typescript
  async restoreSnapshot(documentId: string, snapshotId: string): Promise<RestoreResult> {
    const response = await apiClient.post(`/api/documents/${documentId}/snapshots/${snapshotId}/restore`);
    return {
      documentId: response.document_id,
      restoredFromSnapshotId: response.restored_from_snapshot_id,
      newSnapshotId: response.new_snapshot_id,
      message: response.message,
    };
  }
  ```
- [x] 5.4 Agregar al Zustand store:
  ```typescript
  restoring: boolean;
  restoreSnapshot: (documentId: string, snapshotId: string) => Promise<boolean>;
  ```
  - Implementar: set restoring=true, call repository, on success reset snapshots + refetch page 1, clearSelection, set restoring=false, return true
  - On error: set restoring=false, set error, return false

### Task 6: Frontend — Agregar botón "Restaurar esta versión" en DiffView (AC: #1, #4)

- [x] 6.1 Agregar prop `canEdit: boolean` al DiffView
  - Se determina desde el `DocumentEditor` basado en `permissionLevel` del usuario
  - Pasar down: `DocumentEditor → ActivityPanel → DiffView`
- [x] 6.2 Agregar prop `onRestore: (snapshotId: string) => void` al DiffView
- [x] 6.3 Agregar prop `restoring: boolean` al DiffView
- [x] 6.4 Renderizar botón "Restaurar esta versión" debajo del diff:
  - Solo visible si `canEdit === true` (AC #4)
  - Disabled si `restoring === true`
  - Estilo: Button variant destructive o warning (naranja), icono `RotateCcw` de lucide-react
  - `data-testid="restore-version-button"`
- [x] 6.5 Click en el botón → llama `onRestore(selected.id)`

### Task 7: Frontend — Dialog de confirmación (AC: #1)

- [x] 7.1 Crear componente `RestoreConfirmDialog` en `history/infrastructure/components/`:
  - Props: `isOpen`, `onConfirm`, `onCancel`, `snapshotDate: string`, `restoring: boolean`
  - Usar `AlertDialog` de shadcn/ui (ya instalado como parte de ui primitives)
  - Si AlertDialog no está instalado: usar un div overlay modal simple con backdrop, mismo patrón que ActivityPanel responsive
  - Texto: "¿Restaurar documento a la versión de [fecha formateada]? Se creará una nueva entrada en el historial."
  - Botón confirmar: "Restaurar" (variant destructive), disabled si restoring
  - Botón cancelar: "Cancelar"
  - `data-testid="restore-confirm-dialog"`
  - `data-testid="restore-confirm-button"`
  - `data-testid="restore-cancel-button"`
- [x] 7.2 Integrar en ActivityPanel:
  - Estado local `restoreTargetSnapshot` para controlar qué snapshot se quiere restaurar
  - Al click "Restaurar esta versión" → set restoreTargetSnapshot
  - Al confirmar dialog → call store.restoreSnapshot(), toast de éxito
  - Al cancelar → clear restoreTargetSnapshot

### Task 8: Frontend — Obtener permissionLevel del usuario para el documento (AC: #4)

- [x] 8.1 El `permissionLevel` ya se determina en el backend durante la conexión WebSocket (collaboration gateway verifica EDIT/VIEW)
- [x] 8.2 Opción pragmática: El usuario que puede editar ya tiene el editor editable. Usar el estado `isEditable` que ya maneja el `DocumentEditor` o determinar si el usuario es admin/tiene edit permission
  - Revisar cómo `DocumentEditor` ya sabe si el usuario puede editar
  - Pasar ese booleano como `canEdit` al ActivityPanel → DiffView
- [x] 8.3 Si no hay un flag explícito: agregar al collaboration viewmodel un `canEdit` boolean basado en el permission check existente

### Task 9: Frontend — Integrar flujo completo en ActivityPanel (AC: #1, #2, #3)

- [x] 9.1 Conectar el botón restore del DiffView con el RestoreConfirmDialog
- [x] 9.2 Al confirmar restauración:
  1. Llamar `store.restoreSnapshot(documentId, snapshotId)`
  2. Si éxito: mostrar toast "Documento restaurado exitosamente"
  3. Refrescar la lista de snapshots (ya lo hace el store)
  4. Cerrar la selección de diff
- [x] 9.3 El cambio real-time (AC #2: "todos los usuarios conectados ven el cambio") lo maneja el backend via WebSocket broadcast (Task 2)

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente | Archivo | Qué reutilizar |
|---|---|---|
| `HistoryRepositoryInterface` | `apps/api/src/modules/history/domain/interfaces/history-repository.interface.ts` | Agregar `saveSnapshot` método |
| `HistoryOrmRepository` | `apps/api/src/modules/history/infrastructure/persistence/history-orm.repository.ts` | Implementar `saveSnapshot` |
| `CheckPermissionUseCase` | `apps/api/src/modules/permissions/application/use-cases/check-permission.use-case.ts` | Verificar EDIT permission |
| `DocumentRepository` | `apps/api/src/modules/documents/domain/interfaces/documents-repository.interface.ts` | `update()` para cambiar contenido |
| `DocumentSyncServiceInterface` | `apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts` | Agregar `forceDocumentReload` |
| `InMemoryDocumentSyncService` | `apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts` | Implementar reload |
| `CollaborationGateway` | `apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts` | Broadcast pattern para updates |
| `DiffView` | `apps/web/src/modules/history/infrastructure/components/DiffView.tsx` | Agregar botón restaurar |
| `ActivityPanel` | `apps/web/src/modules/history/infrastructure/components/ActivityPanel.tsx` | Integrar dialog y flujo |
| `history.state.ts` | `apps/web/src/modules/history/infrastructure/state/history.state.ts` | Agregar restoreSnapshot action |
| `history-v1.repository.ts` | `apps/web/src/modules/history/infrastructure/repositories/history-v1.repository.ts` | Agregar POST restore |
| `formatRelativeDate` | `apps/web/src/common/helpers/format-relative-date.ts` | Formatear fecha del snapshot en el dialog |
| `DocumentSnapshotEntity` | `apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts` | Entity para crear nuevo snapshot |
| `apiClient` | `apps/web/src/common/adapters/api-client/api-client.ts` | POST request |

### Patrón de restauración

La restauración es **no destructiva**: se crea un nuevo snapshot con el contenido de la versión seleccionada. El historial previo se preserva intacto. El flujo es:

1. Usuario selecciona snapshot en DiffView → click "Restaurar esta versión"
2. Dialog de confirmación con fecha formateada
3. POST al backend → backend actualiza `documents.content_markdown` y `documents.yjs_state` (null)
4. Backend crea nuevo snapshot en `document_snapshots` (sin `yjs_snapshot`, solo `content_markdown`)
5. Backend notifica via WebSocket a todos los clientes conectados
6. Clientes reconectan/resincronizan automáticamente con el nuevo estado
7. Frontend refresca lista de snapshots → nuevo entry "Restaurado a versión de [fecha]"

### Broadcast de restauración a clientes WebSocket

El punto más complejo es cómo los clientes conectados ven el cambio en tiempo real:

**Approach**: El `InMemoryDocumentSyncService` tiene acceso al Y.Doc en memoria. Al restaurar:
1. Recrear el Y.Doc con el nuevo contenido
2. Calcular el diff/update entre el estado actual y el nuevo
3. Broadcast ese update a todos los clientes conectados como un Yjs update normal
4. Los clientes procesan el update como cualquier otra edición colaborativa

**Alternativa más simple**: Si el documento no tiene clientes activos, solo actualizar la DB. Si tiene clientes activos, forzar un disconnect+reconnect que recargue el estado desde DB. Evaluar cuál es más pragmático.

### Error codes del módulo history

| Code | Message | Server Message |
|---|---|---|
| HST001 | Snapshot not found | Snapshot {id} not found for document {documentId} |
| HST002 | No history available | No snapshots found for document {documentId} |
| HST003 | Cannot restore snapshot | Failed to restore snapshot {snapshotId} to document {documentId} |

### Verificar antes de implementar

- Verificar si `AlertDialog` de shadcn/ui está instalado (`apps/web/src/common/components/ui/alert-dialog.tsx`). Si no, usar overlay modal simple
- Verificar cómo `DocumentEditor` determina si el usuario puede editar (buscar `isEditable`, `canEdit`, `permissionLevel` en el componente)
- Verificar si el `DocumentRepository.update()` acepta `yjsState: null` para resetear el estado Yjs

### Anti-patrones a evitar

- **NO eliminar snapshots previos** al restaurar — el historial es inmutable (NFR16)
- **NO crear un endpoint DELETE** para snapshots — va contra la arquitectura append-only
- **NO hacer la restauración solo client-side** — debe persistir en DB y notificar a todos los clientes
- **NO bloquear el editor** mientras se procesa — mostrar loading state en el botón, el editor sigue funcional
- **NO hardcodear strings** — usar enums para error codes, mensajes en constantes o directamente en los componentes (no crear un i18n layer innecesario)
- **NO instalar librerías nuevas** — todo lo necesario ya está (shadcn/ui, lucide-react, diff, Yjs)
- **NO duplicar la lógica de permission check** — reutilizar `CheckPermissionUseCase` existente

### Project Structure Notes

Archivos nuevos:
```
apps/api/src/modules/history/
├── domain/
│   └── types/
│       └── restore-snapshot-result.type.ts
├── application/
│   └── use-cases/
│       ├── restore-snapshot.use-case.ts
│       └── __tests__/
│           └── restore-snapshot.use-case.spec.ts
└── infrastructure/
    ├── api/
    │   └── restore-snapshot.controller.ts
    ├── dto/
    │   └── restore-snapshot-params.dto.ts
    └── presenters/
        └── restore-snapshot.presenter.ts

apps/web/src/modules/history/infrastructure/
└── components/
    └── RestoreConfirmDialog.tsx
```

Archivos modificados:
```
apps/api/src/modules/history/domain/enums/history-errors.codes.ts          (+HST003)
apps/api/src/modules/history/domain/enums/history-usecases.enum.ts         (+RESTORE_SNAPSHOT)
apps/api/src/modules/history/domain/enums/history-providers.enum.ts        (+RESTORE_SNAPSHOT)
apps/api/src/modules/history/domain/interfaces/history-repository.interface.ts (+saveSnapshot)
apps/api/src/modules/history/infrastructure/persistence/history-orm.repository.ts (+saveSnapshot impl)
apps/api/src/modules/history/infrastructure/history.module.ts              (+controller, use case, collaboration import)
apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts (+forceDocumentReload)
apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts (+forceDocumentReload impl)
apps/web/src/modules/history/domain/entities/snapshot.entity.ts            (+RestoreResult)
apps/web/src/modules/history/domain/repositories/history-repository.ts     (+restoreSnapshot)
apps/web/src/modules/history/infrastructure/repositories/history-v1.repository.ts (+restoreSnapshot impl)
apps/web/src/modules/history/infrastructure/state/history.state.ts         (+restoring, restoreSnapshot)
apps/web/src/modules/history/infrastructure/hooks/use-history.viewmodel.ts (+restoreSnapshot, restoring)
apps/web/src/modules/history/infrastructure/components/DiffView.tsx        (+restore button, canEdit prop)
apps/web/src/modules/history/infrastructure/components/ActivityPanel.tsx   (+dialog integration, canEdit prop)
```

### References

- [Source: epic-06-historial.md#Story 6.3] — ACs y user story
- [Source: 6-2-visualizacion-del-historial-y-panel-de-actividad.md] — DiffView, ActivityPanel, store, ViewModel patterns
- [Source: architecture.md#Backend] — Clean Architecture, use case pattern, factory DI
- [Source: architecture.md#Frontend] — MVVM, Zustand, CSR
- [Source: ux-design-specification.md#ActivityPanel] — Panel layout reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Added HST003 error code and RESTORE_SNAPSHOT_USE_CASE provider enum
- Created RestoreSnapshotResultType domain type
- Added `saveSnapshot` method to HistoryRepositoryInterface and HistoryOrmRepository
- Added `forceDocumentReload` and `setOnDocumentInvalidated` to DocumentSyncServiceInterface
- Implemented force reload in InMemoryDocumentSyncService: destroys in-memory Y.Doc and triggers callback
- CollaborationGateway registers callback to disconnect all document clients on restore (code 4010), clients auto-reconnect with fresh state
- Created RestoreSnapshotUseCase: validates permissions (EDIT required), creates new Yjs state from snapshot markdown, updates document, creates new snapshot entry, force-reloads connected clients
- Created RestoreSnapshotController: POST /api/documents/:documentId/snapshots/:snapshotId/restore
- Created RestoreSnapshotParamsDto and RestoreSnapshotPresenter
- 6 unit tests for RestoreSnapshotUseCase (success, HST001 not found, HST001 wrong doc, DOC001, PRM002 null, PRM002 view)
- Added RestoreResult entity type to frontend
- Added restoreSnapshot to frontend repository, store, and viewmodel
- Updated DiffView with "Restaurar esta versión" button (orange, RotateCcw icon, only visible with canEdit)
- Created RestoreConfirmDialog with confirmation message showing formatted date
- Updated ActivityPanel with restore flow integration and canEdit prop
- Updated DocumentEditor to pass canEdit={!readOnly} to ActivityPanel
- 28 unit test suites (90 tests) passing — zero regressions
- 154 E2E tests passing — zero regressions

### Change Log

- 2026-03-27: Story 6.3 implementation complete — version restoration with confirmation dialog, permission enforcement, and real-time broadcast

### File List

**New files:**
- apps/api/src/modules/history/domain/types/restore-snapshot-result.type.ts
- apps/api/src/modules/history/application/use-cases/restore-snapshot.use-case.ts
- apps/api/src/modules/history/application/use-cases/__tests__/restore-snapshot.use-case.spec.ts
- apps/api/src/modules/history/infrastructure/api/restore-snapshot.controller.ts
- apps/api/src/modules/history/infrastructure/dto/restore-snapshot-params.dto.ts
- apps/api/src/modules/history/infrastructure/presenters/restore-snapshot.presenter.ts
- apps/web/src/modules/history/infrastructure/components/RestoreConfirmDialog.tsx

**Modified files:**
- apps/api/src/modules/history/domain/enums/history-errors.codes.ts (+HST003)
- apps/api/src/modules/history/domain/enums/history-providers.enum.ts (+RESTORE_SNAPSHOT_USE_CASE)
- apps/api/src/modules/history/domain/interfaces/history-repository.interface.ts (+saveSnapshot)
- apps/api/src/modules/history/domain/index.ts (+restore-snapshot-result export)
- apps/api/src/modules/history/application/index.ts (+RestoreSnapshotUseCase export)
- apps/api/src/modules/history/infrastructure/persistence/history-orm.repository.ts (+saveSnapshot impl)
- apps/api/src/modules/history/infrastructure/history.module.ts (+CollaborationModule import, RestoreSnapshotController, RestoreSnapshotUseCase factory)
- apps/api/src/modules/collaboration/domain/interfaces/document-sync-service.interface.ts (+forceDocumentReload, setOnDocumentInvalidated, DocumentInvalidatedCallback)
- apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts (+forceDocumentReload, setOnDocumentInvalidated)
- apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts (+disconnectDocumentClients, callback registration)
- apps/web/src/modules/history/domain/entities/snapshot.entity.ts (+RestoreResult)
- apps/web/src/modules/history/domain/repositories/history-repository.ts (+restoreSnapshot)
- apps/web/src/modules/history/infrastructure/repositories/history-v1.repository.ts (+restoreSnapshot impl)
- apps/web/src/modules/history/infrastructure/state/history.state.ts (+restoring, restoreSnapshot)
- apps/web/src/modules/history/infrastructure/hooks/use-history.viewmodel.ts (+restoring, restoreSnapshot)
- apps/web/src/modules/history/infrastructure/components/DiffView.tsx (+restore button, canEdit/restoring/onRestore props)
- apps/web/src/modules/history/infrastructure/components/ActivityPanel.tsx (+canEdit prop, RestoreConfirmDialog integration, restore flow)
- apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx (+canEdit prop to ActivityPanel)
