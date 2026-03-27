# Story 6.1: Registro y Persistencia del Historial

Status: done

## Story

As a **sistema**,
I want **registrar cada cambio con autor, timestamp y contenido para mantener un historial inmutable**,
so that **el equipo tenga trazabilidad completa de todos los cambios en cada documento**.

## Acceptance Criteria

1. **Given** un usuario está editando un documento via WebSocket
   **When** pasan 60 segundos de actividad continua
   **Then** el sistema crea un snapshot automático en `document_snapshots` con:
   - `yjs_snapshot` (BYTEA) del estado del Y.Doc
   - `content_markdown` (TEXT) con el texto en ese momento
   - `author_id` del último editor
   - `created_at` timestamp

2. **Given** un snapshot se ha creado
   **When** intento eliminar o modificar el registro
   **Then** la operación es rechazada — el historial es append-only e inmutable (NFR16)

3. **Given** un documento tiene múltiples snapshots y updates
   **When** el servidor carga el documento en memoria
   **Then** carga el último snapshot y aplica los updates posteriores para reconstruir el Y.Doc

4. **Given** el sistema genera snapshots periódicamente
   **When** se acumulan muchos updates entre snapshots
   **Then** los updates intermedios se preservan para replay granular

## Tasks / Subtasks

### Task 1: Crear módulo `history` en backend con estructura Clean Architecture (AC: #1, #2)

- [x] 1.1 Crear estructura de directorios del módulo history:
  ```
  apps/api/src/modules/history/
  ├── domain/
  │   ├── enums/
  │   │   ├── history-providers.enum.ts
  │   │   └── history-errors.codes.ts
  │   ├── interfaces/
  │   │   └── history-repository.interface.ts
  │   ├── types/
  │   │   ├── snapshot-summary.type.ts
  │   │   └── document-history.type.ts
  │   └── index.ts
  ├── application/
  │   ├── use-cases/
  │   │   ├── list-document-snapshots.use-case.ts
  │   │   ├── get-snapshot-detail.use-case.ts
  │   │   └── __tests__/
  │   │       ├── list-document-snapshots.use-case.spec.ts
  │   │       └── get-snapshot-detail.use-case.spec.ts
  │   └── index.ts
  └── infrastructure/
      ├── api/
      │   ├── list-document-snapshots.controller.ts
      │   └── get-snapshot-detail.controller.ts
      ├── dto/
      │   └── list-snapshots-query.dto.ts
      ├── persistence/
      │   └── history-orm.repository.ts
      ├── presenters/
      │   ├── snapshot-summary.presenter.ts
      │   └── snapshot-detail.presenter.ts
      ├── history.module.ts
      └── index.ts
  ```

- [x] 1.2 Crear `HistoryProvidersEnum`:
  ```typescript
  export enum HistoryProvidersEnum {
    HISTORY_REPOSITORY = 'HISTORY_REPOSITORY',
    LIST_DOCUMENT_SNAPSHOTS_USE_CASE = 'LIST_DOCUMENT_SNAPSHOTS_USE_CASE',
    GET_SNAPSHOT_DETAIL_USE_CASE = 'GET_SNAPSHOT_DETAIL_USE_CASE',
  }
  ```

- [ ] 1.3 Crear `HistoryErrorsCodes` con prefijo `HST`:
  ```typescript
  export const HistoryErrorsCodes = {
    SNAPSHOT_NOT_FOUND: {
      codeError: 'HST001',
      message: 'Snapshot not found.',
      serverMessage: 'Snapshot with id {id} not found for document {documentId}',
    },
    DOCUMENT_NO_HISTORY: {
      codeError: 'HST002',
      message: 'No history available for this document.',
      serverMessage: 'No snapshots found for document {documentId}',
    },
    FAILED_TO_QUERY_SNAPSHOTS: {
      codeError: 'HST100',
      message: 'Failed to retrieve document history.',
      serverMessage: 'Database error querying snapshots: {error}',
    },
  } as const;
  ```

- [ ] 1.4 Crear `HistoryRepositoryInterface`:
  ```typescript
  export interface HistoryRepositoryInterface {
    findSnapshotsByDocumentId(
      documentId: string,
      page: number,
      limit: number,
    ): Promise<{ snapshots: SnapshotSummaryType[]; total: number }>;
    findSnapshotById(snapshotId: string): Promise<SnapshotDetailType | null>;
  }
  ```

- [ ] 1.5 Crear tipos de dominio:
  - `SnapshotSummaryType`: `{ id, documentId, authorId, authorName, contentMarkdown, createdAt }`
  - `SnapshotDetailType`: extiende `SnapshotSummaryType` con `yjsSnapshot: Uint8Array`

### Task 2: Implementar `HistoryOrmRepository` (AC: #1, #2, #4)

- [ ] 2.1 Crear `history-orm.repository.ts` que consulta `DocumentSnapshotEntity` (ya existente en módulo documents)
- [ ] 2.2 `findSnapshotsByDocumentId`: query con JOIN a users para `author_name`, order by `created_at DESC`, paginación con skip/take
- [ ] 2.3 `findSnapshotById`: query por `id` con JOIN a users para `author_name`
- [ ] 2.4 try/catch en ambos métodos → throw con `HST100` error code

**IMPORTANTE**: La entity `DocumentSnapshotEntity` ya existe en `apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts`. El repository de history CONSULTA esta misma tabla — NO crear una entity nueva. Importar `DocumentSnapshotEntity` desde el módulo documents vía TypeORM `getRepository()` o inyección del datasource.

### Task 3: Implementar use cases de consulta de historial (AC: #1, #3, #4)

- [ ] 3.1 `ListDocumentSnapshotsUseCase`:
  - `run(documentId: string, page: number, limit: number, authUser: AuthenticatedUserType)`:
  - Verificar que el documento existe (via DocumentRepository)
  - Verificar que el usuario tiene al menos permiso VIEW sobre la carpeta del documento (via CheckPermissionUseCase)
  - Consultar snapshots paginados vía HistoryRepository
  - Retornar `{ snapshots, total, page, limit }`

- [ ] 3.2 `GetSnapshotDetailUseCase`:
  - `run(snapshotId: string, authUser: AuthenticatedUserType)`:
  - Buscar snapshot por ID
  - Si no existe → throw `HST001`
  - Verificar permiso VIEW sobre la carpeta del documento
  - Retornar snapshot completo con `content_markdown`

- [ ] 3.3 Ambos use cases son clases puras sin decoradores. Se registran con `useFactory` en `history.module.ts`

### Task 4: Implementar controllers REST para consulta de historial (AC: #1)

- [ ] 4.1 `ListDocumentSnapshotsController`:
  - `GET /api/documents/:documentId/snapshots`
  - Auth: `@UseGuards(JwtAuthGuard)` + `@Auth()`
  - Query params: `page` (default 1), `limit` (default 20, max 100)
  - Response: `{ data: { snapshots: [...], total, page, limit } }`

- [ ] 4.2 `GetSnapshotDetailController`:
  - `GET /api/documents/:documentId/snapshots/:snapshotId`
  - Auth: `@UseGuards(JwtAuthGuard)` + `@Auth()`
  - Response: `{ data: { id, document_id, author_id, author_name, content_markdown, created_at } }`
  - **NO incluir `yjs_snapshot` en la respuesta REST** — es binario y solo se necesita internamente para restauración (Story 6.3)

- [ ] 4.3 Crear `ListSnapshotsQueryDto` con class-validator:
  ```typescript
  export class ListSnapshotsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
  }
  ```

- [ ] 4.4 Crear presenters:
  - `SnapshotSummaryPresenter`: mapea a snake_case (`{ id, document_id, author_id, author_name, content_markdown, created_at }`)
  - `SnapshotDetailPresenter`: igual pero para el detalle individual

### Task 5: Verificar y reforzar inmutabilidad del historial (AC: #2)

- [ ] 5.1 Verificar que NO existen endpoints DELETE ni PUT para snapshots — la inmutabilidad se garantiza por diseño (no hay endpoints que permitan modificar/eliminar snapshots individuales)
- [ ] 5.2 El `PersistSnapshotUseCase` existente (en collaboration) limpia updates OLD vía `deleteBeforeDate`, pero NUNCA borra snapshots — verificar que `DocumentSnapshotOrmRepository.deleteBeforeDate` no existe o solo aplica a updates
- [ ] 5.3 Documentar en el código que `document_snapshots` es append-only por diseño (comentario en entity)

### Task 6: Verificar lógica de snapshot periódico existente (AC: #1, #3)

- [ ] 6.1 Verificar que `InMemoryDocumentSyncService` ya tiene `SNAPSHOT_INTERVAL_MS = 60_000` y funciona correctamente
- [ ] 6.2 Verificar que `PersistSnapshotUseCase` ya captura `author_id` del último editor — si no lo hace, agregar tracking del último `author_id` en `InMemoryDocumentSyncService`
- [ ] 6.3 Verificar que al flush snapshot se guarda el `author_id` correcto en `document_snapshots`
- [ ] 6.4 Si `author_id` no se está trackeando en snapshots, agregar un map `lastAuthorByDocument: Map<string, string>` en `InMemoryDocumentSyncService` que se actualiza en cada `applyUpdate(documentId, update, authorId)`

### Task 7: Registrar módulo history y conectar dependencias (AC: #1)

- [ ] 7.1 Crear `history.module.ts` con providers factory:
  ```typescript
  @Module({
    imports: [DocumentsModule, PermissionsModule, AuthModule, TypeOrmModule.forFeature([DocumentSnapshotEntity])],
    controllers: [ListDocumentSnapshotsController, GetSnapshotDetailController],
    providers: [
      { provide: HistoryProvidersEnum.HISTORY_REPOSITORY, useClass: HistoryOrmRepository },
      {
        provide: HistoryProvidersEnum.LIST_DOCUMENT_SNAPSHOTS_USE_CASE,
        useFactory: (historyRepo, docRepo, checkPermission, exception) =>
          new ListDocumentSnapshotsUseCase(historyRepo, docRepo, checkPermission, exception),
        inject: [HistoryProvidersEnum.HISTORY_REPOSITORY, DocumentProvidersEnum.DOCUMENT_REPOSITORY, PermissionsProvidersEnum.CHECK_PERMISSION_USE_CASE, ExceptionProvidersEnum.EXCEPTION_SERVICE],
      },
      // Similar for GET_SNAPSHOT_DETAIL_USE_CASE
    ],
  })
  export class HistoryModule {}
  ```

- [ ] 7.2 Importar `HistoryModule` en `app.module.ts`
- [ ] 7.3 Asegurar que `DocumentsModule` exporta `DocumentProvidersEnum.DOCUMENT_REPOSITORY` (ya lo hace)

### Task 8: Unit tests para use cases (AC: #1, #2, #3)

- [ ] 8.1 `list-document-snapshots.use-case.spec.ts`:
  - Test: retorna snapshots paginados correctamente
  - Test: lanza error si documento no existe
  - Test: lanza error si usuario sin permiso VIEW
  - Test: retorna lista vacía si no hay snapshots (con total 0)

- [ ] 8.2 `get-snapshot-detail.use-case.spec.ts`:
  - Test: retorna snapshot completo por ID
  - Test: lanza HST001 si snapshot no existe
  - Test: lanza error si usuario sin permiso VIEW sobre la carpeta del documento

## Dev Notes

### Qué ya existe (NO reinventar)

La infraestructura de snapshots ya fue implementada en Story 5.1. Lo que ya funciona:

| Componente | Archivo | Qué hace |
|---|---|---|
| `DocumentSnapshotEntity` | `apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts` | Entity ORM para tabla `document_snapshots` |
| `DocumentSnapshotOrmRepository` | `apps/api/src/modules/collaboration/infrastructure/persistence/document-snapshot-orm.repository.ts` | `saveSnapshot()` y `getLatestSnapshot()` |
| `PersistSnapshotUseCase` | `apps/api/src/modules/collaboration/application/use-cases/persist-snapshot.use-case.ts` | Crea snapshot, actualiza document, limpia updates viejos |
| `InMemoryDocumentSyncService` | `apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts` | Timer de 60s para flush snapshot, manejo de lifecycle |
| `DocumentUpdateEntity` | `apps/api/src/modules/documents/infrastructure/persistence/document-update.entity.ts` | Entity para `document_updates` (incrementales) |

**Esta story NO modifica la lógica de creación de snapshots.** Solo agrega la capa de consulta REST para el historial.

### Qué agrega esta story

1. **Módulo `history`**: nuevo módulo backend con use cases y controllers para CONSULTAR el historial
2. **Endpoints REST**: `GET /api/documents/:documentId/snapshots` (listado paginado) y `GET /api/documents/:documentId/snapshots/:snapshotId` (detalle)
3. **Verificación de `author_id`**: asegurar que los snapshots guardan correctamente quién fue el último editor
4. **Verificación de inmutabilidad**: confirmar que no hay forma de borrar/modificar snapshots

### Decisiones de diseño

- **Módulo separado**: `history` es un módulo nuevo que CONSULTA datos de `document_snapshots`. La ESCRITURA de snapshots sigue en el módulo `collaboration` (separación de responsabilidades)
- **Paginación**: el historial puede crecer mucho (un snapshot cada 60s). Paginación obligatoria con default 20, max 100
- **Sin `yjs_snapshot` en REST**: el blob binario de Yjs no se expone en la API REST. Solo se necesita para restauración (Story 6.3). El endpoint devuelve `content_markdown` que es legible
- **Permisos**: VIEW es suficiente para consultar historial. No se requiere EDIT
- **Anidamiento de URL**: `GET /api/documents/:documentId/snapshots` — el historial es un sub-recurso del documento

### Tracking de author_id en snapshots

Revisar `InMemoryDocumentSyncService.applyUpdate()` y `PersistSnapshotUseCase.run()`:
- Si `applyUpdate(documentId, update, authorId)` ya recibe y trackea el `authorId` → verificar que `flushSnapshot()` lo pasa a `PersistSnapshotUseCase`
- Si NO se trackea → agregar un `Map<string, string>` (`lastAuthorByDocument`) que se actualiza en cada `applyUpdate` y se lee en `flushSnapshot`

### Anti-patrones a evitar

- **NO crear una nueva entity para snapshots** — `DocumentSnapshotEntity` ya existe, reutilizarla
- **NO crear endpoints DELETE/PUT para snapshots** — historial es inmutable
- **NO modificar la lógica de creación de snapshots en collaboration** — esta story es solo LECTURA
- **NO exponer `yjs_snapshot` en la API REST** — es binario, innecesario para el cliente
- **NO duplicar la verificación de permisos** — reutilizar `CheckPermissionUseCase` del módulo permissions
- **NO usar `@Injectable()` en use cases** — clases puras con `useFactory`

### Project Structure Notes

- Módulo nuevo: `apps/api/src/modules/history/` con estructura Clean Architecture completa
- Entity reutilizada: `DocumentSnapshotEntity` del módulo documents
- Import en `app.module.ts`: agregar `HistoryModule`
- No se crean archivos frontend en esta story — eso es Story 6.2

### References

- [Source: architecture.md#Data Architecture] — Modelo `document_snapshots` con campos y propósito
- [Source: architecture.md#Error Codes] — Prefijo `HST` para módulo history: HST001, HST100
- [Source: architecture.md#Yjs Lifecycle Pattern] — Flujo de carga snapshot → apply updates
- [Source: architecture.md#Módulos Backend] — `history` como módulo separado para snapshots, restore, diff
- [Source: epic-06-historial.md#Story 6.1] — ACs y nota técnica
- [Source: 5-1-edicion-colaborativa-yjs-websocket.md] — Story base que creó la infraestructura de collaboration
- [Source: 5-3-reconexion-automatica-estado-conexion.md] — Última story completada, patrón de componentes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Created `history` module with full Clean Architecture structure (domain/application/infrastructure)
- Implemented `HistoryProvidersEnum` (HST prefix) and `historyErrorsCodes` (HST001, HST002, HST100)
- Implemented `HistoryRepositoryInterface` with `findSnapshotsByDocumentId` (paginated) and `findSnapshotById`
- Created `HistoryOrmRepository` querying existing `DocumentSnapshotEntity` with LEFT JOIN to users for author_name
- Created `ListDocumentSnapshotsUseCase` — validates document exists + user VIEW permission + paginated query
- Created `GetSnapshotDetailUseCase` — validates snapshot exists + user VIEW permission on document's folder
- Created REST endpoints: `GET /api/documents/:documentId/snapshots` (paginated list) and `GET /api/documents/:documentId/snapshots/:snapshotId` (detail)
- Created `ListSnapshotsQueryDto` with class-validator (page/limit with defaults and max constraints)
- Created `SnapshotSummaryPresenter` and `SnapshotDetailPresenter` (snake_case wire format)
- Fixed `author_id` tracking: added `lastAuthorId` field to `DocumentEntry` in `InMemoryDocumentSyncService`, updated `PersistSnapshotUseCase.run()` to accept and pass `authorId` to `saveSnapshot()`
- Verified immutability: no DELETE/PUT endpoints for snapshots exist, added append-only comment to entity
- Verified snapshot interval: `SNAPSHOT_INTERVAL_MS = 60_000` already correct
- Registered `HistoryModule` in `app.module.ts`
- 7 new unit tests (4 for list, 3 for get-detail), updated 2 existing persist-snapshot tests
- All 27 unit suites (83 tests) passing — zero regressions
- All 145 E2E tests passing — zero regressions

### Change Log

- 2026-03-27: Story 6.1 implementation complete — history module with REST endpoints for snapshot consultation + author_id tracking fix

### File List

**New files:**
- apps/api/src/modules/history/domain/enums/history-providers.enum.ts
- apps/api/src/modules/history/domain/enums/history-errors.codes.ts
- apps/api/src/modules/history/domain/enums/index.ts
- apps/api/src/modules/history/domain/interfaces/history-repository.interface.ts
- apps/api/src/modules/history/domain/types/snapshot-summary.type.ts
- apps/api/src/modules/history/domain/types/snapshot-detail.type.ts
- apps/api/src/modules/history/domain/index.ts
- apps/api/src/modules/history/application/use-cases/list-document-snapshots.use-case.ts
- apps/api/src/modules/history/application/use-cases/get-snapshot-detail.use-case.ts
- apps/api/src/modules/history/application/use-cases/__tests__/list-document-snapshots.use-case.spec.ts
- apps/api/src/modules/history/application/use-cases/__tests__/get-snapshot-detail.use-case.spec.ts
- apps/api/src/modules/history/application/index.ts
- apps/api/src/modules/history/infrastructure/api/list-document-snapshots.controller.ts
- apps/api/src/modules/history/infrastructure/api/get-snapshot-detail.controller.ts
- apps/api/src/modules/history/infrastructure/dto/list-snapshots-query.dto.ts
- apps/api/src/modules/history/infrastructure/persistence/history-orm.repository.ts
- apps/api/src/modules/history/infrastructure/presenters/snapshot-summary.presenter.ts
- apps/api/src/modules/history/infrastructure/presenters/snapshot-detail.presenter.ts
- apps/api/src/modules/history/infrastructure/history.module.ts
- apps/api/src/modules/history/infrastructure/index.ts

**Modified files:**
- apps/api/src/app.module.ts (added HistoryModule import)
- apps/api/src/modules/collaboration/infrastructure/services/in-memory-document-sync.service.ts (added lastAuthorId tracking, pass to persistSnapshotUseCase)
- apps/api/src/modules/collaboration/application/use-cases/persist-snapshot.use-case.ts (added authorId parameter, pass to saveSnapshot)
- apps/api/src/modules/collaboration/application/use-cases/__tests__/persist-snapshot.use-case.spec.ts (updated assertions for authorId)
- apps/api/src/modules/documents/infrastructure/persistence/document-snapshot.entity.ts (added append-only comment)
