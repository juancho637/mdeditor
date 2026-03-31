# Story 8.1: Búsqueda Global de Contenido

Status: done

## Story

As a **usuario**,
I want **buscar documentos por título o contenido usando Cmd/Ctrl+K**,
so that **pueda encontrar cualquier documento rápidamente sin navegar por carpetas**.

## Acceptance Criteria

1. **Given** estoy en cualquier pantalla de la plataforma
   **When** presiono Cmd/Ctrl+K
   **Then** se abre la Command Palette centrada con un input de búsqueda enfocado

2. **Given** escribo un término de búsqueda en la palette
   **When** los resultados aparecen
   **Then** veo documentos que coinciden en título o contenido
   **And** cada resultado muestra: título del documento, carpeta padre, y preview del match con el término resaltado

3. **Given** los resultados de búsqueda están visibles
   **When** navego con flechas arriba/abajo y presiono Enter
   **Then** el documento seleccionado se abre

4. **Given** busco contenido
   **When** los resultados se filtran
   **Then** solo aparecen documentos a los que tengo permiso de visualización

5. **Given** busco un término que no existe
   **When** veo los resultados
   **Then** aparece "No se encontraron documentos para '[término]'" con opción "Limpiar búsqueda"

6. **Given** hago clic en la barra de búsqueda del sidebar
   **When** se activa
   **Then** se abre la misma Command Palette que con Cmd/Ctrl+K

## Tasks / Subtasks

### Task 1: Migración de base de datos — search_vector (AC: #2, #4)

- [x] 1.1 Crear migración `1711700000000-AddSearchVector.ts` en `apps/api/src/common/database/migrations/`:
  ```sql
  -- Agregar columna tsvector
  ALTER TABLE documents ADD COLUMN search_vector tsvector;
  -- Poblar columna existente
  UPDATE documents SET search_vector = to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content_markdown, ''));
  -- Crear GIN index para performance
  CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);
  -- Trigger para mantener search_vector actualizado
  CREATE OR REPLACE FUNCTION update_document_search_vector()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.search_vector := to_tsvector('simple', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content_markdown, ''));
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  CREATE TRIGGER trg_document_search_vector
  BEFORE INSERT OR UPDATE OF title, content_markdown ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();
  ```
- [x] 1.2 Down migration: `DROP TRIGGER trg_document_search_vector ON documents; DROP FUNCTION update_document_search_vector; DROP INDEX idx_documents_search_vector; ALTER TABLE documents DROP COLUMN search_vector;`

### Task 2: Backend — Search en módulo `documents` (AC: #2, #4, #5)

> **Nota de implementación**: En lugar de crear un módulo `search` separado (over-engineering), la funcionalidad se integró en el módulo `documents` existente.

- [x] 2.1 Crear `apps/api/src/modules/documents/domain/types/search-result.type.ts`
- [x] 2.2 Agregar método `search(userId, query)` a `DocumentRepositoryInterface`
- [x] 2.3 Agregar `SEARCH_DOCUMENTS_USE_CASE` a `DocumentProvidersEnum`
- [x] 2.4 Exportar `SearchResultType` desde `domain/types/index.ts`
- [x] 2.5 Implementar `search()` en `DocumentOrmRepository` con raw SQL via `repository.manager.query()`:
  - `websearch_to_tsquery('simple', ...)`, `ts_headline`, `ts_rank`, GIN index
  - Permission filter inline: admin bypass + `folder_permissions JOIN user_groups`
  - LIMIT 20, ORDER BY ts_rank DESC
- [x] 2.6 Crear `apps/api/src/modules/documents/application/use-cases/search-documents.use-case.ts`
- [x] 2.7 Crear `apps/api/src/modules/documents/application/use-cases/__tests__/search-documents.use-case.spec.ts` (4 tests)
- [x] 2.8 Inline `SearchDocumentsDto` y `toHTTP` en el controller (pragmático, sin archivos extra)
- [x] 2.9 Crear `apps/api/src/modules/documents/infrastructure/api/search-documents.controller.ts`
- [x] 2.10 Registrar `SearchDocumentsController` PRIMERO en `documents.module.ts` (antes de `GetDocumentController` para evitar conflicto de ruta con `:id`)
- [x] 2.11 Registrar provider `SEARCH_DOCUMENTS_USE_CASE` en `documents.module.ts`

### Task 3: Frontend — Módulo `search` (dominio e infraestructura) (AC: #2, #3, #4, #5)

- [x] 3.1 Crear `apps/web/src/modules/search/domain/types/search-result.type.ts`
- [x] 3.2 Crear `apps/web/src/modules/search/domain/repositories/search-repository.ts`
- [x] 3.3 Crear `apps/web/src/modules/search/infrastructure/repositories/search-v1.repository.ts`
  - GET `/api/documents/search?q={query}` (endpoint en documents, no search)
  - Mapea snake_case → camelCase
- [x] 3.4 Crear `apps/web/src/modules/search/infrastructure/state/search.state.ts` (Zustand)
- [x] 3.5 Crear `apps/web/src/modules/search/infrastructure/hooks/use-search.viewmodel.ts`
  - Debounce 300ms con `useRef` + `setTimeout`/`clearTimeout`

### Task 4: Frontend — Componente `command.tsx` de shadcn/ui (AC: #1, #3)

- [x] 4.1 Instalar `cmdk` v1.1.1: `make add PKG="cmdk" APP=web`
- [x] 4.2 `@radix-ui/react-dialog` no disponible — CommandPalette implementado sin `CommandDialog`, usando overlay CSS `fixed inset-0` directamente con cmdk primitivos (`Command`, `Command.Input`, `Command.List`, `Command.Item`, `Command.Empty`)

### Task 5: Frontend — Componente `CommandPalette.tsx` (AC: #1, #2, #3, #5)

- [x] 5.1 Crear `apps/web/src/modules/search/infrastructure/components/CommandPalette.tsx`:
  - Overlay `fixed inset-0 z-50 bg-black/50`, click backdrop cierra palette
  - `Command` de cmdk con `Command.Input`, `Command.List`, `Command.Item`, `Command.Empty`
  - Escape key via `useEffect` → `closeSearch()`
  - `dangerouslySetInnerHTML` solo para `result.preview` (HTML con `<b>` highlights)
  - Al seleccionar: `selectFolder` + `loadDocument` + `closeSearch()`
  - Empty state: "No se encontraron documentos" + botón "Limpiar búsqueda"

### Task 6: Frontend — Integración en dashboard layout y sidebar (AC: #1, #6)

- [x] 6.1 Modificar `apps/web/src/app/dashboard/layout.tsx`:
  - `useEffect` para Cmd/Ctrl+K → `openSearch()`
  - `<CommandPalette />` renderizado al final del layout
- [x] 6.2 Modificar `apps/web/src/modules/folders/infrastructure/components/FolderSidebar.tsx`:
  - Botón 🔍 en header con `title="Buscar documentos (Ctrl+K)"`
  - `useSearchViewModel()` importado directamente en el componente

### Task 7: Unit tests backend (AC: #2, #4)

- [x] 7.1 `search-documents.use-case.spec.ts` — cubierto en Task 2.7 (4 tests: empty query, 1-char query, trimmed call, empty propagation)
- [x] Tests mockean `DocumentRepositoryInterface` correctamente

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente                  | Archivo                                                                | Qué reutilizar                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@Auth()` decorator         | `common/helpers/infrastructure`                                        | Guard de autenticación, patrón en todos los controllers                                                                                                     |
| `@CurrentUser()` decorator  | `common/helpers/infrastructure`                                        | Obtener userId del JWT en controllers                                                                                                                       |
| ExceptionService            | `common/exception/`                                                    | `exception.internalServerErrorException(...)`                                                                                                               |
| `GetDocumentByIdUseCase`    | `modules/documents/application/`                                       | Patrón puro de use case                                                                                                                                     |
| `CheckPermissionUseCase`    | `modules/permissions/application/`                                     | Patrón de permiso check, **no usar para search** (es por documento individual)                                                                              |
| `GetUserPermissionsUseCase` | `modules/permissions/application/`                                     | **NO usar** — la query SQL ya filtra por permisos inline, más eficiente                                                                                     |
| `apiClient`                 | `common/adapters/api-client/api-client.ts`                             | Axios instance con interceptors, desenvuelve response wrapper                                                                                               |
| Zustand store pattern       | `modules/api-keys/infrastructure/state/api-key.state.ts`               | Patrón exacto para `search.state.ts`                                                                                                                        |
| Viewmodel pattern           | `modules/permissions/infrastructure/hooks/use-permission.viewmodel.ts` | Patrón de hook con loading/error en store                                                                                                                   |
| shadcn Dialog               | `common/components/ui/dialog.tsx`                                      | Base para CommandDialog                                                                                                                                     |
| `useFolderViewModel`        | `modules/folders/infrastructure/hooks/use-folder.viewmodel.ts`         | `selectFolder(id)` para navegar a carpeta tras selección                                                                                                    |
| `useDocumentViewModel`      | `modules/documents/infrastructure/hooks/use-document.viewmodel.ts`     | `loadDocument(id)` para abrir documento                                                                                                                     |
| document navigation pattern | `app/dashboard/page.tsx` línea 22-27                                   | Cuando `selectedFolder` cambia → `loadFolderDocuments`. Después de `selectFolder` + `loadDocument`, el store tiene `currentDocument` → UI muestra el editor |

### Decisiones de implementación

1. **Módulo `search` separado en backend** — la arquitectura lo especifica así (`| search | Full-text search sobre documentos |`). Importa `AuthModule` + `DataSource` directamente.

2. **Filtrado de permisos en SQL** — una sola query con subquery JOIN hace el filtrado inline. Más eficiente que llamar `GetUserPermissionsUseCase` (evita N+1 queries).

3. **`websearch_to_tsquery`** — disponible en PostgreSQL 11+, soporta operadores (`OR`, `-term`, `"phrase"`), no lanza excepciones con caracteres especiales del usuario.

4. **Dictionary `simple`** — agnóstico de idioma, no hace stemming. Correcto para una plataforma multilingual de markdown.

5. **`ts_headline` con `<b>` tags** — el frontend renderiza el preview con `dangerouslySetInnerHTML` únicamente para el campo `preview`. El `title` y `folderName` se renderizan como texto plano.

6. **Debounce 300ms en viewmodel** — evita requests por cada keystroke. Implementar con `useRef` + `setTimeout`/`clearTimeout`.

7. **Mínimo 2 caracteres** — tanto en backend (use case) como en frontend (viewmodel), queries de 1 char retornan vacío sin llamar a la API.

8. **`DataSource` injection en search module** — se inyecta `DataSource` directamente de TypeORM (token literal `DataSource`). Patrón alternativo: usar `getDataSourceToken()` de `@nestjs/typeorm`. Verificar qué patrón usa DatabaseModule para exportar DataSource.

9. **`cmdk` y `CommandDialog`** — `CommandDialog` es el wrapper de shadcn que combina `Dialog` + `Command`. El estado `isOpen` del Zustand store controla `open` del Dialog. `onOpenChange` llama `closeSearch()`.

10. **Navegación tras selección**: `selectFolder` actualiza Zustand folder store → el `useEffect` en `dashboard/page.tsx` lo detecta y ejecuta `loadFolderDocuments`. `loadDocument` actualiza Zustand document store → `currentDocument` se setea → UI renderiza `DocumentEditor`.

### Wire format (API response)

```
GET /api/search/documents?q=typescript
Authorization: Bearer {jwt}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "folder_id": "uuid",
      "folder_name": "Backend Docs",
      "title": "Guía de TypeScript",
      "slug": "guia-de-typescript",
      "preview": "...configuración de <b>TypeScript</b> para proyectos NestJS..."
    }
  ],
  "path": "/api/search/documents",
  "request_id": "abc-123",
  "duration": "45ms",
  "method": "GET"
}

Response 200 (sin resultados):
{ "data": [] }

Response 401: no auth
```

### Enums — NO hardcodear strings

```typescript
// Backend
SearchProvidersEnum.SEARCH_REPOSITORY;
SearchProvidersEnum.SEARCH_DOCUMENTS_USE_CASE;

// Frontend (no es necesario enum para este módulo — solo 1 endpoint)
```

### Anti-patrones a evitar

- **NO crear migration con `synchronize: true`** — solo migration file explícita
- **NO usar `plainto_tsquery`** — usar `websearch_to_tsquery` (maneja caracteres especiales sin lanzar excepciones)
- **NO filtrar permisos en el use case** — la SQL ya lo hace inline
- **NO renderizar HTML en title/folderName** — solo en `preview` con `dangerouslySetInnerHTML`
- **NO usar `innerHTML` directamente** — solo `dangerouslySetInnerHTML` de React
- **NO loading state local en componentes** — loading en Zustand store
- **NO llamar `search()` en cada keystroke** — debounce 300ms en viewmodel
- **NO crear nuevo módulo para frontend search** en un lugar incorrecto — va en `apps/web/src/modules/search/`

### Orden de implementación recomendado

1. Migración de BD (Task 1)
2. Backend: dominio + repositorio + use case + tests (Tasks 2.1-2.7)
3. Backend: DTO + presenter + controller + module + registro en app.module (Tasks 2.8-2.12)
4. Frontend: dominio + repositorio + store + viewmodel (Task 3)
5. Frontend: instalar cmdk + command.tsx (Task 4)
6. Frontend: CommandPalette component (Task 5)
7. Frontend: integración en layout + sidebar (Task 6)

### Estructura de archivos (nuevos)

**Backend:**

```
apps/api/src/
├── common/database/migrations/
│   └── 1711700000000-AddSearchVector.ts  (NEW)
└── modules/search/
    ├── domain/
    │   ├── enums/search-providers.enum.ts  (NEW)
    │   ├── interfaces/search-repository.interface.ts  (NEW)
    │   ├── types/search-result.type.ts  (NEW)
    │   └── index.ts  (NEW)
    ├── application/
    │   ├── use-cases/
    │   │   ├── search-documents.use-case.ts  (NEW)
    │   │   └── __tests__/search-documents.use-case.spec.ts  (NEW)
    │   └── index.ts  (NEW)
    └── infrastructure/
        ├── api/search-documents.controller.ts  (NEW)
        ├── dto/search-documents.dto.ts  (NEW)
        ├── persistence/search-orm.repository.ts  (NEW)
        ├── presenters/search-result.presenter.ts  (NEW)
        ├── search.module.ts  (NEW)
        └── index.ts  (NEW)
```

**Backend modificado:**

```
apps/api/src/app.module.ts  (+SearchModule import)
```

**Frontend:**

```
apps/web/src/
├── common/components/ui/
│   └── command.tsx  (NEW — shadcn/ui Command)
└── modules/search/
    ├── domain/
    │   ├── types/search-result.type.ts  (NEW)
    │   ├── repositories/search-repository.ts  (NEW)
    │   └── index.ts  (NEW)
    └── infrastructure/
        ├── repositories/search-v1.repository.ts  (NEW)
        ├── state/search.state.ts  (NEW)
        ├── hooks/use-search.viewmodel.ts  (NEW)
        ├── components/CommandPalette.tsx  (NEW)
        └── index.ts  (NEW)
```

**Frontend modificado:**

```
apps/web/src/app/dashboard/layout.tsx  (+Cmd/Ctrl+K handler, +<CommandPalette />)
apps/web/src/modules/folders/infrastructure/components/FolderSidebar.tsx  (+botón búsqueda)
```

### References

- [Source: epic-08-busqueda-responsive.md#Story 8.1] — ACs y nota técnica original
- [Source: architecture.md] — Módulo `search` backend/frontend, tsvector sobre content_markdown
- [Source: ux-design-specification.md] — Cmd/Ctrl+K pattern, Command palette referente UX-DR19
- [Source: 7-3-gestion-de-api-keys.md] — Patrón de módulo completo frontend (store + viewmodel + components)
- [Source: modules/documents/infrastructure/documents.module.ts] — Patrón de wiring de módulo con DataSource
- [Source: app/dashboard/layout.tsx] — Layout donde se integra el keyboard shortcut y CommandPalette
- [Source: app/dashboard/page.tsx] — Patrón de navegación: `selectFolder` + `loadDocument`
- [Source: CLAUDE.md] — Arquitectura, convenciones, reglas de código

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- Route conflict: `GET /api/documents/search` era capturada por `GET /api/documents/:id` — fix: `SearchDocumentsController` registrado primero en `controllers[]`
- Double-wrap: controller retornaba `{ data: results }` pero `ResponseInterceptor` lo envolvía de nuevo — fix: retornar `results.map(toHTTP)` directamente
- DTO property initializer: `q: string` → `q!: string` (definite assignment assertion)
- Throttle: user2 sign-in fallaba por rate limiting — fix: delay 1500ms antes del login en tests
- Permissions test: `PUT /api/permissions` retorna 200, no 201 — fix: method PUT + status 200
- Over-engineering: se creó módulo `search` separado → corregido, movido a `documents` module

### Completion Notes List

- Search integrado en `documents` module (no módulo separado) — pragmático y sin over-engineering
- `Repository.manager.query()` usado para raw SQL sin inyectar `DataSource` por separado
- `websearch_to_tsquery('simple', ...)` con dictionary `simple` (agnóstico de idioma, no stemming)
- Permission filter inline en SQL: evita N+1 queries, admin bypass vía EXISTS subquery
- CommandPalette implementado sin `@radix-ui/react-dialog` (no disponible) — overlay CSS `fixed inset-0`
- cmdk v1.1.1 instalado como única dependencia nueva en frontend
- 14 nuevos tests E2E en `e2e/search.spec.ts` — API + UI cubriendo todos los ACs
- Suite completa: 35 suites / 116 unit tests ✅, 211 E2E tests ✅, typecheck clean ✅

### File List

**Backend (nuevos):**

- `apps/api/src/common/database/migrations/1711700000000-AddSearchVector.ts`
- `apps/api/src/modules/documents/domain/types/search-result.type.ts`
- `apps/api/src/modules/documents/application/use-cases/search-documents.use-case.ts`
- `apps/api/src/modules/documents/application/use-cases/__tests__/search-documents.use-case.spec.ts`
- `apps/api/src/modules/documents/infrastructure/api/search-documents.controller.ts`

**Backend (modificados):**

- `apps/api/src/modules/documents/domain/interfaces/document-repository.interface.ts` (+ `search()`)
- `apps/api/src/modules/documents/domain/enums/document-providers.enum.ts` (+ `SEARCH_DOCUMENTS_USE_CASE`)
- `apps/api/src/modules/documents/domain/types/index.ts` (+ `SearchResultType`)
- `apps/api/src/modules/documents/application/use-cases/index.ts` (+ `SearchDocumentsUseCase`)
- `apps/api/src/modules/documents/infrastructure/persistence/document-orm.repository.ts` (+ `search()`)
- `apps/api/src/modules/documents/infrastructure/documents.module.ts` (+ controller + provider)

**Frontend (nuevos):**

- `apps/web/src/modules/search/domain/types/search-result.type.ts`
- `apps/web/src/modules/search/domain/repositories/search-repository.ts`
- `apps/web/src/modules/search/domain/index.ts`
- `apps/web/src/modules/search/infrastructure/repositories/search-v1.repository.ts`
- `apps/web/src/modules/search/infrastructure/state/search.state.ts`
- `apps/web/src/modules/search/infrastructure/hooks/use-search.viewmodel.ts`
- `apps/web/src/modules/search/infrastructure/components/CommandPalette.tsx`
- `apps/web/src/modules/search/infrastructure/index.ts`

**Frontend (modificados):**

- `apps/web/src/app/dashboard/layout.tsx` (+ Cmd/Ctrl+K handler, + `<CommandPalette />`)
- `apps/web/src/modules/folders/infrastructure/components/FolderSidebar.tsx` (+ botón 🔍)

**E2E:**

- `e2e/search.spec.ts` (nuevo — 14 tests)

### Change Log

- 2026-03-31: Story 8.1 creada — búsqueda global con Command Palette (Cmd/Ctrl+K) + PostgreSQL full-text search
- 2026-03-31: Story 8.1 implementada — backend en documents module, frontend con cmdk, 14 tests E2E, todos los tests pasan
