# Story 6.2: Visualización del Historial y Panel de Actividad

Status: done

## Story

As a **usuario (como Diego)**,
I want **ver quién cambió qué y cuándo en un panel de actividad con timeline de cambios**,
so that **pueda verificar que el documento refleja el estado actual y entender su evolución**.

## Acceptance Criteria

1. **Given** estoy viendo un documento
   **When** hago clic en el ícono de actividad (📋) en el header
   **Then** se abre el panel de actividad a la derecha (280px) con animación slide-in (200ms)

2. **Given** el panel de actividad está abierto
   **When** veo la sección "Actividad en vivo"
   **Then** muestra los usuarios actualmente editando con su nombre y sección
   **And** las ediciones vía MCP muestran "🤖 Claude (vía MCP)"

3. **Given** el panel de actividad está abierto
   **When** veo la sección "Historial"
   **Then** veo una timeline de cambios con: autor, fecha/hora (relativa para reciente, absoluta para antiguo), y resumen del cambio

4. **Given** hago clic en una entrada del historial
   **When** se abre la vista de diff
   **Then** veo los cambios resaltados: verde para contenido agregado, rojo para eliminado

5. **Given** el panel de actividad está abierto
   **When** hago clic en el botón toggle de nuevo
   **Then** el panel se cierra con animación slide-out
   **And** el estado del toggle se recuerda por usuario

## Tasks / Subtasks

### Task 1: Crear módulo `history` en frontend con estructura MVVM (AC: #1, #3, #5)

- [x] 1.1 Crear estructura del módulo:
  ```
  apps/web/src/modules/history/
  ├── domain/
  │   ├── entities/
  │   │   └── snapshot.entity.ts
  │   └── repositories/
  │       └── history-repository.ts
  └── infrastructure/
      ├── repositories/
      │   └── history-v1.repository.ts
      ├── hooks/
      │   └── use-history.viewmodel.ts
      ├── components/
      │   ├── ActivityPanel.tsx
      │   ├── LiveActivitySection.tsx
      │   ├── HistoryTimeline.tsx
      │   └── DiffView.tsx
      └── state/
          └── history.state.ts
  ```

- [x] 1.2 Crear entidad `SnapshotSummary` y `SnapshotDetail` en domain:
  ```typescript
  // snapshot.entity.ts
  export interface SnapshotSummary {
    id: string;
    documentId: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }

  export interface SnapshotDetail extends SnapshotSummary {
    contentMarkdown: string;
  }

  export interface SnapshotListResponse {
    snapshots: SnapshotSummary[];
    total: number;
    page: number;
    limit: number;
  }
  ```

- [x] 1.3 Crear interfaz `HistoryRepository` en domain:
  ```typescript
  export interface HistoryRepository {
    listSnapshots(documentId: string, page: number, limit: number): Promise<SnapshotListResponse>;
    getSnapshotDetail(documentId: string, snapshotId: string): Promise<SnapshotDetail>;
  }
  ```

### Task 2: Implementar `HistoryV1Repository` — HTTP con mapping snake→camel (AC: #3, #4)

- [x] 2.1 Crear `history-v1.repository.ts`:
  - `listSnapshots(documentId, page, limit)`: `GET /api/documents/:documentId/snapshots?page=X&limit=Y`
  - `getSnapshotDetail(documentId, snapshotId)`: `GET /api/documents/:documentId/snapshots/:snapshotId`
  - Wire format (snake_case) → domain (camelCase) mapping en ambos métodos
  - Usar `apiClient` existente de `@/common/adapters/api-client`

- [x] 2.2 Wire response interfaces (private al repository):
  ```typescript
  interface SnapshotSummaryWire {
    id: string;
    document_id: string;
    author_id: string;
    author_name: string;
    created_at: string;
  }

  interface SnapshotDetailWire extends SnapshotSummaryWire {
    content_markdown: string;
  }
  ```

### Task 3: Crear Zustand store para history (AC: #1, #3, #4, #5)

- [x] 3.1 Crear `history.state.ts`:
  ```typescript
  interface HistoryState {
    // Panel state
    isPanelOpen: boolean;
    togglePanel: () => void;

    // Snapshot list
    snapshots: SnapshotSummary[];
    total: number;
    page: number;
    loading: boolean;
    error: string | null;

    // Selected snapshot detail (for diff view)
    selectedSnapshot: SnapshotDetail | null;
    loadingDetail: boolean;

    // Actions
    fetchSnapshots: (documentId: string, page?: number) => Promise<void>;
    fetchSnapshotDetail: (documentId: string, snapshotId: string) => Promise<void>;
    clearSelection: () => void;
    reset: () => void;
  }
  ```

- [x] 3.2 El estado `isPanelOpen` persiste en localStorage con key `activity-panel-open` (AC #5: "el estado del toggle se recuerda por usuario")

- [x] 3.3 `loading` siempre en el store, nunca local en componentes (regla del proyecto)

### Task 4: Crear `useHistoryViewModel` hook (AC: #1, #3, #4)

- [x] 4.1 Crear `use-history.viewmodel.ts`:
  - Expone: `{ isPanelOpen, togglePanel, snapshots, total, page, loading, selectedSnapshot, loadingDetail, fetchSnapshots, selectSnapshot, clearSelection }`
  - `selectSnapshot(snapshotId)` → llama `fetchSnapshotDetail` del store
  - `fetchSnapshots(documentId, page)` → llama al store
  - Se consume desde `ActivityPanel` y `DocumentEditor`

### Task 5: Crear componente `ActivityPanel` (AC: #1, #2, #5)

- [x] 5.1 Panel con ancho 280px, fondo `bg-secondary`, slide-in/out animación 200ms ease
- [x] 5.2 Estructura interna:
  ```
  ┌─────────────────────┐
  │ Header: "Actividad"  │  ← con botón cerrar (X)
  ├─────────────────────┤
  │ Actividad en vivo    │  ← LiveActivitySection
  ├─────────────────────┤
  │ Historial            │  ← HistoryTimeline
  └─────────────────────┘
  ```
- [x] 5.3 Usar `Separator` de shadcn/ui entre secciones
- [x] 5.4 ScrollArea para todo el contenido del panel (overflow vertical)
- [x] 5.5 Animación slide: usar `transition-transform duration-200 ease-in-out` con `translate-x-0` (open) / `translate-x-full` (closed)

- [x] 5.6 Responsive (UX-DR11):
  - **Desktop (≥1024px)**: Panel inline a la derecha, 280px, reduce espacio del editor
  - **Tablet (768-1023px)**: Sheet overlay desde la derecha (280px) con backdrop semi-transparente
  - **Móvil (<768px)**: Sheet desde abajo, max-height 70vh, drag handle para cerrar

  Para tablet/móvil: NO instalar shadcn Sheet. Implementar con un div overlay + backdrop, reutilizando las mismas animaciones CSS. La UX spec dice usar Sheet, pero no hay Sheet instalado actualmente. Usar un overlay simple con las mismas animaciones es más pragmático que agregar @radix-ui/react-dialog como dependencia.

### Task 6: Crear componente `LiveActivitySection` (AC: #2)

- [x] 6.1 Recibir `connectedUsers` desde `usePresence` (ya existe en collaboration module)
- [x] 6.2 Mostrar cada usuario conectado con:
  - Avatar circular (24px) con inicial y color del usuario
  - Nombre del usuario
  - Estado: "Editando" si tiene cursor activo, "Viendo" si idle
  - Timestamp relativo: "ahora", "hace 2 min"
- [x] 6.3 Para usuarios IA: mostrar "🤖 Claude (vía MCP)" con fondo púrpura en avatar
- [x] 6.4 Si no hay usuarios conectados: mostrar "No hay otros usuarios conectados"
- [x] 6.5 Reutilizar `ConnectedUser` type de `@/modules/collaboration/infrastructure/hooks/use-presence.viewmodel.ts` y colores de `@/modules/collaboration/infrastructure/helpers/cursor-colors.ts`

### Task 7: Crear componente `HistoryTimeline` (AC: #3, #4)

- [x] 7.1 Mostrar lista de snapshots como timeline vertical con línea conectora
- [x] 7.2 Cada entry muestra:
  - Avatar del autor (24px, misma lógica de colores)
  - Nombre del autor
  - Fecha/hora: relativa si < 24h ("hace 5 min", "hace 2h"), absoluta si >= 24h ("15 mar 2026, 14:30")
- [x] 7.3 Click en una entry → seleccionar snapshot → mostrar `DiffView` expandido debajo
- [x] 7.4 Paginación: botón "Cargar más" al final si `total > snapshots.length`
- [x] 7.5 Estado loading: skeleton placeholders mientras carga
- [x] 7.6 Estado vacío: "No hay historial disponible" si no hay snapshots

### Task 8: Crear componente `DiffView` (AC: #4)

- [x] 8.1 Instalar librería `diff` (`npm:diff` — lightweight, ~15KB) para calcular diferencias línea a línea
  - **Comando**: `make add PKG="diff" APP=web` + `make add-dev PKG="@types/diff" APP=web`
  - La librería `diff` es la más usada para diff de texto en JS, zero dependencies
- [x] 8.2 Cuando se selecciona un snapshot:
  - Cargar detalle del snapshot seleccionado (tiene `content_markdown`)
  - Cargar detalle del snapshot anterior (el siguiente en la lista, que es más viejo cronológicamente)
  - Si es el primer snapshot (sin anterior): mostrar todo como contenido agregado (verde)
- [x] 8.3 Renderizar diff línea a línea:
  - Líneas agregadas: `bg-green-100 dark:bg-green-900/30` con `+` prefix
  - Líneas eliminadas: `bg-red-100 dark:bg-red-900/30` con `-` prefix
  - Líneas sin cambios: color normal, opacidad reducida
- [x] 8.4 Monospace font para el diff (`font-mono text-sm`)
- [x] 8.5 Botón "Cerrar diff" para volver a la vista de timeline
- [x] 8.6 Para Story 6.3 se agregará un botón "Restaurar esta versión" en esta vista — por ahora no incluirlo

### Task 9: Integrar ActivityPanel en DocumentEditor (AC: #1, #5)

- [x] 9.1 Agregar botón toggle 📋 en el header derecho del `DocumentEditor` (junto a PresenceIndicator y ConnectionIndicator)
  - Icono: usar `ClipboardList` de lucide-react
  - Estilo: ghost button, hover state
  - `data-testid="activity-panel-toggle"`

- [x] 9.2 Renderizar `ActivityPanel` condicionalmente:
  ```tsx
  <div className="flex flex-1 overflow-hidden">
    <div className="flex-1 overflow-hidden">
      {/* Editor content existente */}
    </div>
    {isPanelOpen && (
      <ActivityPanel
        documentId={document.id}
        connectedUsers={connectedUsers}
        onClose={togglePanel}
      />
    )}
  </div>
  ```

- [x] 9.3 El panel reduce el espacio del editor (flex layout), no lo overlay en desktop

- [x] 9.4 Pasar `awareness` al `ActivityPanel` para live activity
- [x] 9.5 Fetch snapshots cuando el panel se abre (lazy loading)

### Task 10: Utilidad de formateo de fechas relativas (AC: #3)

- [x] 10.1 Crear helper `format-relative-date.ts` en `apps/web/src/common/helpers/`:
  ```typescript
  export function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffHour < 24) return `hace ${diffHour}h`;

    return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
      + ', ' + date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }
  ```
- [x] 10.2 Usar esta utilidad tanto en `LiveActivitySection` como en `HistoryTimeline`

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente | Archivo | Qué reutilizar |
|---|---|---|
| `usePresence` hook | `apps/web/src/modules/collaboration/infrastructure/hooks/use-presence.viewmodel.ts` | `connectedUsers` con nombre, color, estado editing/viewing, isAI |
| `ConnectedUser` type | Mismo archivo | `{ id, name, color, colorLight, isEditing, isAI }` |
| `cursorColors` | `apps/web/src/modules/collaboration/infrastructure/helpers/cursor-colors.ts` | Colores determinísticos por userId, AI_CURSOR_COLOR |
| `PresenceIndicator` | `apps/web/src/modules/collaboration/infrastructure/components/PresenceIndicator.tsx` | Referencia para patrón de avatares (24px, iniciales, colores) |
| `apiClient` | `apps/web/src/common/adapters/api-client/api-client.ts` | Cliente Axios con auth interceptor, unwrap response |
| `Separator` | `apps/web/src/common/components/ui/separator.tsx` | shadcn/ui separator |
| `Tooltip` | `apps/web/src/common/components/ui/tooltip.tsx` | shadcn/ui tooltip para hover info |
| History REST endpoints | Backend module history | `GET /api/documents/:id/snapshots` (paginated), `GET /api/documents/:id/snapshots/:snapshotId` (detail with content_markdown) |

### API Endpoints disponibles (Story 6.1)

**List snapshots:**
```
GET /api/documents/:documentId/snapshots?page=1&limit=20
Response: { data: { snapshots: [{ id, document_id, author_id, author_name, created_at }], total, page, limit } }
```

**Get snapshot detail:**
```
GET /api/documents/:documentId/snapshots/:snapshotId
Response: { data: { id, document_id, author_id, author_name, content_markdown, created_at } }
```

Nota: `content_markdown` solo viene en el detalle, no en el listado. El summary NO incluye `content_markdown` para optimizar el payload del listado.

### Librería de diff

Usar `diff` (npm package `diff`). Es la librería estándar para diffs en JavaScript:
- `diffLines(oldText, newText)` → array de `{ value, added?, removed? }`
- ~15KB, zero dependencies
- Bien tipada con `@types/diff`

**NO usar**: `jsdiff` (mismo package, nombre antiguo), `diff-match-patch` (overkill), `diff2html` (demasiado pesado para nuestro caso).

### Decisiones de diseño

- **Panel inline en desktop**: El panel reduce el ancho del editor, no lo overlay. Esto da mejor UX porque el usuario ve ambos (editor + actividad) sin oclusión
- **Lazy loading de snapshots**: Solo se fetch cuando el panel se abre, no en mount del editor
- **Diff on-demand**: El `content_markdown` solo se carga cuando el usuario hace click en un snapshot (requiere 2 requests: snapshot seleccionado + snapshot anterior)
- **Sin Sheet component**: No hay `@radix-ui/react-dialog` instalado. Para responsive overlay (tablet/móvil), usar div con backdrop y animaciones CSS. Es más pragmático que agregar una dependencia nueva
- **isPanelOpen en localStorage**: Para recordar preferencia del usuario entre sesiones

### Anti-patrones a evitar

- **NO crear un nuevo WebSocket** para live activity — reutilizar `awareness` de Yjs que ya existe
- **NO hacer polling** para actualizar live activity — `usePresence` ya observa awareness changes reactivamente
- **NO instalar shadcn/ui Sheet** — no hay @radix-ui/react-dialog instalado, usar overlay CSS simple
- **NO poner loading state en componentes** — siempre en el Zustand store
- **NO duplicar la lógica de avatares** — reutilizar patrones de `PresenceIndicator` para consistencia visual
- **NO crear enums como strings hardcodeados** — usar enums tipados para cualquier constante
- **NO hacer SSR** — toda la app autenticada es CSR, el panel también
- **NO calcular diff en el servidor** — el diff se calcula client-side con `diffLines`

### Project Structure Notes

- Módulo nuevo: `apps/web/src/modules/history/` con estructura MVVM
- Dependencia nueva: `diff` + `@types/diff` (via `make add`)
- Componente integrado en `DocumentEditor.tsx` existente
- Helper nuevo en `apps/web/src/common/helpers/format-relative-date.ts`
- No se modifica el backend — los endpoints ya existen de Story 6.1

### References

- [Source: ux-design-specification.md#ActivityPanel] — Diseño del panel: 280px, bg secondary, toggle 📋, estructura con actividad en vivo + historial
- [Source: ux-design-specification.md#Responsive] — Desktop: inline, Tablet: sheet overlay derecha, Móvil: sheet desde abajo 70vh
- [Source: ux-design-specification.md#VersionTimeline] — Timeline visual con diff, colores verde/rojo
- [Source: architecture.md#Frontend] — MVVM pattern, Zustand stores, CSR, shadcn/ui + Tailwind
- [Source: epic-06-historial.md#Story 6.2] — ACs y nota técnica
- [Source: 6-1-registro-y-persistencia-del-historial.md] — Endpoints REST, módulo history backend, snapshot format

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- Created `history` frontend module with full MVVM structure (domain/infrastructure)
- Implemented `SnapshotSummary`, `SnapshotDetail`, `SnapshotListResponse` domain entities
- Implemented `HistoryV1Repository` with snake_case→camelCase mapping, consuming REST endpoints from Story 6.1
- Created Zustand store (`history.state.ts`) with panel toggle persistence in localStorage, paginated snapshot fetching, and diff detail loading
- Created `useHistoryViewModel` hook with lazy loading (fetch on panel open), document change reset, and load-more pagination
- Created `ActivityPanel` component: 280px sidebar, responsive (inline desktop, overlay tablet/mobile with backdrop), slide-in animations via CSS keyframes
- Created `LiveActivitySection`: shows connected users from Yjs awareness with avatar, name, editing/viewing status, AI user display
- Created `HistoryTimeline`: vertical timeline with connector line, relative/absolute dates, skeleton loading, empty state, "load more" pagination
- Created `DiffView`: client-side diff using `diffLines` from `diff` library, green/red line highlighting, monospace rendering
- Integrated panel toggle button (ClipboardList icon) in DocumentEditor header
- Integrated ActivityPanel in DocumentEditor with flex layout (panel reduces editor space on desktop)
- Created `formatRelativeDate` helper utility in common/helpers
- Added CSS keyframe animations (`slideInRight`, `slideInUp`) to globals.css
- Added `diff@8.0.4` + `@types/diff@8.0.0` as dependencies
- Added `make typecheck`, `make typecheck-web`, `make typecheck-api` targets to Makefile
- Added Docker-first rule to CLAUDE.md
- All 27 unit test suites (84 tests) passing — zero regressions
- All 145 E2E tests passing — zero regressions
- Zero new TypeScript errors (all pre-existing)

### Change Log

- 2026-03-27: Story 6.2 implementation complete — ActivityPanel with live activity, history timeline, and diff view

### File List

**New files:**
- apps/web/src/modules/history/domain/entities/snapshot.entity.ts
- apps/web/src/modules/history/domain/repositories/history-repository.ts
- apps/web/src/modules/history/infrastructure/repositories/history-v1.repository.ts
- apps/web/src/modules/history/infrastructure/state/history.state.ts
- apps/web/src/modules/history/infrastructure/hooks/use-history.viewmodel.ts
- apps/web/src/modules/history/infrastructure/components/ActivityPanel.tsx
- apps/web/src/modules/history/infrastructure/components/LiveActivitySection.tsx
- apps/web/src/modules/history/infrastructure/components/HistoryTimeline.tsx
- apps/web/src/modules/history/infrastructure/components/DiffView.tsx
- apps/web/src/common/helpers/format-relative-date.ts

**Modified files:**
- apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx (added panel toggle button, ActivityPanel integration, flex layout)
- apps/web/src/app/globals.css (added slideInRight/slideInUp keyframe animations)
- apps/web/package.json (added diff, @types/diff dependencies)
- Makefile (added typecheck, typecheck-web, typecheck-api targets)
- CLAUDE.md (added typecheck commands, Docker-first rule)
