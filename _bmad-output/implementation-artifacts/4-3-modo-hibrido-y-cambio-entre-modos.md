# Story 4.3: Modo Híbrido y Cambio entre Modos

Status: review

## Story

As a **usuario**,
I want **editar en modo híbrido (editor + preview en split) y alternar entre los 3 modos libremente**,
so that **pueda elegir la forma de interacción que mejor se adapte a mi perfil y tarea**.

## Acceptance Criteria

1. **Given** estoy viendo un documento
   **When** veo los tabs de modo en el header
   **Then** hay 3 opciones: Editor, Híbrido, Preview

2. **Given** selecciono el modo "Híbrido"
   **When** la vista cambia
   **Then** veo el editor CodeMirror a la izquierda y el preview renderizado a la derecha
   **And** la proporción por defecto es 50/50
   **And** hay un resize handle de 4px entre ambos paneles

3. **Given** estoy en modo híbrido
   **When** arrastro el resize handle
   **Then** la proporción de los paneles cambia en tiempo real
   **And** la proporción mínima es 30/70 o 70/30

4. **Given** estoy en cualquier modo
   **When** cambio a otro modo
   **Then** la posición del documento se preserva (no pierdo de vista dónde estaba)
   **And** la transición es fluida (< 300ms)

5. **Given** estoy en modo Preview
   **When** hago clic en el tab "Editor"
   **Then** veo solo el editor CodeMirror a pantalla completa

6. **Given** soy un usuario nuevo
   **When** abro un documento por primera vez
   **Then** se abre en modo Híbrido por defecto
   **And** mi preferencia de modo se recuerda para futuras sesiones

## Tasks / Subtasks

### Frontend — Dependencias

- [x] Task 1: Instalar componente ResizablePanels de shadcn/ui (AC: #2, #3)
  - [x] Ejecutar: `make add PKG="react-resizable-panels" APP=web`
  - [x] Crear `apps/web/src/common/components/ui/resizable.tsx` como wrapper
  - [x] El componente usa `react-resizable-panels` v4.7.6 (API: Group, Panel, Separator)

### Frontend — Enum y Persistencia de Modo

- [x] Task 2: Actualizar EditorMode enum y persistir preferencia (AC: #1, #6)
  - [x] Agregar `HYBRID = 'hybrid'` al enum `EditorMode` en `DocumentEditor.tsx`
  - [x] Crear helper `getStoredMode()`/`storeMode()` para localStorage con key `editor-mode-preference`
  - [x] Al montar DocumentEditor: leer preferencia de localStorage. Si no existe → `HYBRID` por defecto. Si `readOnly` → `PREVIEW`
  - [x] Al cambiar de modo → guardar preferencia en localStorage

### Frontend — Componente SplitView

- [x] Task 3: Crear componente SplitView (AC: #2, #3)
  - [x] Archivo: `apps/web/src/modules/documents/infrastructure/components/SplitView.tsx`
  - [x] Props: `editorContent: ReactNode`, `previewContent: ReactNode`
  - [x] Usa `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` de shadcn/ui wrapper
  - [x] Layout horizontal (`direction="horizontal"`)
  - [x] Proporción default 50/50 (`defaultSize={50}`)
  - [x] Proporción mínima 30% por panel (`minSize={30}`)
  - [x] Resize handle: 4px de ancho, color `--border`, cursor `col-resize`, hover resalta `--primary`
  - [x] Ambos paneles con overflow independiente

### Frontend — Actualizar DocumentEditor

- [x] Task 4: Integrar los 3 modos en DocumentEditor (AC: #1, #2, #4, #5, #6)
  - [x] Agregar botón "Híbrido" al toggle group entre "Editor" y "Preview"
  - [x] En modo `readOnly`: solo mostrar "Preview" (como ahora)
  - [x] En modo editable: mostrar "Editor | Híbrido | Preview"
  - [x] Renderizado condicional: EDITOR → CodeMirror, PREVIEW → MarkdownPreview, HYBRID → SplitView
  - [x] En modo híbrido, el preview se actualiza en tiempo real
  - [x] Transición fluida con `transition-opacity duration-200`

### Frontend — Persistencia de posición al cambiar modo

- [x] Task 5: Preservar posición del documento al cambiar de modo (AC: #4)
  - [x] Guardar scrollTop de preview en ref antes del cambio de modo
  - [x] Restaurar scrollTop con requestAnimationFrame después del cambio

### Testing

- [x] Task 6: E2E tests en `e2e/hybrid-mode.spec.ts`
  - [x] UI: Verificar que los 3 tabs aparecen al abrir documento con permiso de edición
  - [x] UI: Cambiar a modo Híbrido → verificar que editor y preview son visibles side-by-side
  - [x] UI: En modo Híbrido, escribir texto → verificar que preview se actualiza
  - [x] UI: Cambiar entre los 3 modos sin perder contenido
  - [x] UI: Editor mode shows only CodeMirror (no preview visible)
  - [x] UI: Verificar que la preferencia de modo se persiste (cambiar modo → recargar → mismo modo)
  - [x] UI: Verificar que modo por defecto es Híbrido para usuario nuevo

## Dev Notes

### Qué YA existe (NO recrear)

- `DocumentEditor.tsx` — componente principal con header, toggle Editor/Preview, autosave 500ms, readOnly mode
- `CodeMirrorEditor.tsx` — wrapper de CodeMirror 6 con dynamic import, syntax highlighting, keymaps Ctrl+B/I
- `MarkdownPreview.tsx` — react-markdown + remark-gfm + rehype-highlight, prose styles en globals.css
- `EditorMode` enum con EDITOR y PREVIEW — **extender, no recrear**
- Toggle buttons ya estilizados en el header — **agregar tercer botón, no rediseñar**
- Dynamic imports ya configurados para CodeMirror y MarkdownPreview

### Patrón de componentes shadcn/ui en este proyecto

Los componentes shadcn/ui se instalan en `apps/web/src/common/components/ui/`. Ya existen: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`. El nuevo `resizable.tsx` va en el mismo directorio.

### ResizablePanels de shadcn/ui — API esperada

```tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/common/components/ui/resizable';

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={50} minSize={30}>
    {/* Editor */}
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50} minSize={30}>
    {/* Preview */}
  </ResizablePanel>
</ResizablePanelGroup>
```

**Nota:** shadcn/ui `resizable` usa `react-resizable-panels` por debajo. El handle se estiliza via CSS.

### Responsive — Decisión clave

- **≥768px (md+):** Split horizontal con resize handle
- **<768px:** Tabs Editor ↔ Preview (sin split). El modo "Híbrido" en móvil se comporta como tabs, no como split
- Implementar con media query CSS o hook `useMediaQuery`

### localStorage key

- Key: `editor-mode-preference`
- Valores posibles: `'editor'`, `'hybrid'`, `'preview'`
- Solo se lee al montar el componente. Si `readOnly` → siempre PREVIEW independiente de la preferencia guardada

### Importaciones — Path aliases

```typescript
// Componentes UI compartidos
import { ... } from '@/common/components/ui/resizable';

// Componentes del módulo documents
import { CodeMirrorEditor } from './CodeMirrorEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { SplitView } from './SplitView';
```

**Nota:** `@/` está configurado como alias a `apps/web/src/` en este proyecto.

### Estilos del resize handle

```css
/* Handle del resizable: 4px, color --border, hover --primary */
[data-panel-resize-handle-id] {
  width: 4px;
  background: var(--border);
  transition: background 150ms;
}
[data-panel-resize-handle-id]:hover,
[data-panel-resize-handle-id][data-resize-handle-active] {
  background: var(--primary);
}
```

Agregar estos estilos en `globals.css` o como parte del componente SplitView.

### Preservar posición — Enfoque pragmático

No es necesario sincronizar scroll entre modos. Solo evitar que el usuario pierda su lugar:
- CodeMirror mantiene su scroll state internamente si no se desmonta
- Para el preview: si se desmonta y remonta, scrollTop se pierde. Opción simple: guardar scrollTop en un ref antes del cambio de modo y restaurar con `useEffect` después

### Project Structure Notes

- Nuevo archivo: `apps/web/src/modules/documents/infrastructure/components/SplitView.tsx`
- Nuevo archivo: `apps/web/src/common/components/ui/resizable.tsx` (generado por shadcn CLI)
- Archivos modificados: `DocumentEditor.tsx` (agregar HYBRID mode + tercer botón + SplitView)
- Archivo modificado: `apps/web/src/app/globals.css` (estilos del resize handle, si no se manejan inline)

### Referencias

- [Source: _bmad-output/planning-artifacts/epic-04-edicion.md#Story 4.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SplitView] — Componente ResizablePanels spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modo Híbrido (SplitView)] — Responsive behavior

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- react-resizable-panels v4.7.6 API changed: exports are `Group`, `Panel`, `Separator` (not `PanelGroup`, `Panel`, `PanelResizeHandle`). Wrapper in resizable.tsx maps old names to new API.
- `orientation` prop instead of `direction` in v4.7.6. Wrapper accepts `direction` and maps to `orientation`.

### Completion Notes List

- Installed `react-resizable-panels@4.7.6` and created shadcn/ui-style wrapper
- Extended EditorMode enum with HYBRID, added localStorage persistence
- Created SplitView component with ResizablePanelGroup (50/50 default, 30% min)
- Updated DocumentEditor with 3-mode tabs, SplitView integration, scroll preservation
- Default mode is HYBRID for new users, PREVIEW for read-only
- 7 new E2E tests covering all ACs
- All 112 E2E tests + 68 unit tests pass (0 regressions)

### File List

- `apps/web/src/common/components/ui/resizable.tsx` (new)
- `apps/web/src/modules/documents/infrastructure/components/SplitView.tsx` (new)
- `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` (modified)
- `apps/web/package.json` (modified — added react-resizable-panels)
- `e2e/hybrid-mode.spec.ts` (new)
