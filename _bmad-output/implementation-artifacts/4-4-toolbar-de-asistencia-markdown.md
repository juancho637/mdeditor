# Story 4.4: Toolbar de Asistencia Markdown

Status: review

## Story

As a **usuario no técnico (como Valentina)**,
I want **insertar sintaxis markdown usando botones visuales del toolbar sin memorizar la sintaxis**,
so that **pueda editar documentos markdown con confianza desde el primer día**.

## Acceptance Criteria

1. **Given** estoy en modo Editor o Híbrido
   **When** veo la interfaz
   **Then** el toolbar de markdown es visible debajo del header con 13 botones organizados en 4 grupos:
   - Texto: H (headers), **B** (negrita), *I* (cursiva), ~~S~~ (tachado)
   - Listas: ☰ (bullets), 1. (numerada), ☑ (checklist)
   - Insertar: 🔗 (link), 🖼 (imagen), </> (código), ⊞ (tabla)
   - Bloque: ❝ (cita), — (línea horizontal)

2. **Given** selecciono texto en el editor
   **When** hago clic en el botón "B" (negrita) del toolbar
   **Then** el texto seleccionado se envuelve con `**texto**`
   **And** en modo híbrido, el preview muestra inmediatamente el texto en **negrita**

3. **Given** no tengo texto seleccionado
   **When** hago clic en el botón "B"
   **Then** se inserta `**texto**` como placeholder con "texto" seleccionado para reemplazar

4. **Given** hago clic en el botón "H" (headers)
   **When** se abre el dropdown
   **Then** veo opciones H1 a H6 y al seleccionar una, se inserta el marcador correspondiente (ej: `## `)

5. **Given** hago clic en el botón 🔗 (link)
   **When** se abre el popover
   **Then** veo un campo para URL y al confirmar se inserta `[texto seleccionado](url)`

6. **Given** hago clic en el botón ⊞ (tabla)
   **When** se abre el dropdown
   **Then** puedo seleccionar el número de filas × columnas y se inserta el template de tabla markdown

7. **Given** estoy en modo Preview
   **When** miro la interfaz
   **Then** el toolbar no es visible (no se necesita en modo solo lectura)

## Tasks / Subtasks

### Frontend — Dependencias shadcn/ui

- [x] Task 1: Instalar componentes shadcn/ui necesarios para toolbar (AC: #4, #5, #6)
  - [x] Instalar `@radix-ui/react-dropdown-menu` y crear `apps/web/src/common/components/ui/dropdown-menu.tsx`
  - [x] Instalar `@radix-ui/react-popover` y crear `apps/web/src/common/components/ui/popover.tsx`
  - [x] Instalar `@radix-ui/react-tooltip` y crear `apps/web/src/common/components/ui/tooltip.tsx`
  - [x] Instalar `@radix-ui/react-separator` y crear `apps/web/src/common/components/ui/separator.tsx`
  - [x] Cada componente sigue el patrón shadcn/ui existente en `common/components/ui/`
  - [x] Usar `make add PKG="@radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-separator" APP=web`

### Frontend — Enums de Toolbar

- [x] Task 2: Crear enums para acciones del toolbar (AC: #1)
  - [x] Archivo: `apps/web/src/modules/documents/domain/enums/toolbar-actions.enum.ts`
  - [x] Enum `ToolbarAction` con valores: `HEADING_1` ... `HEADING_6`, `BOLD`, `ITALIC`, `STRIKETHROUGH`, `BULLET_LIST`, `NUMBERED_LIST`, `CHECKLIST`, `LINK`, `IMAGE`, `CODE`, `TABLE`, `BLOCKQUOTE`, `HORIZONTAL_RULE`
  - [x] Enum `ToolbarGroup` con valores: `TEXT`, `LISTS`, `INSERT`, `BLOCK`
  - [x] Exportar desde `apps/web/src/modules/documents/domain/index.ts`

### Frontend — Utilidad de inserción markdown

- [x] Task 3: Crear utilidad para ejecutar acciones del toolbar en CodeMirror (AC: #2, #3, #4, #5, #6)
  - [x] Archivo: `apps/web/src/modules/documents/infrastructure/components/toolbar/toolbar-actions.ts`
  - [x] Función `executeToolbarAction(view: EditorView, action: ToolbarAction, params?: Record<string, string>): void`
  - [x] Reutilizar la lógica de `wrapSelection` que ya existe en `CodeMirrorEditor.tsx` — extraerla a un util compartido
  - [x] Acciones wrap (bold, italic, strikethrough, code): envolver selección o insertar placeholder
  - [x] Acciones prefix (headers, bullet, numbered, checklist, blockquote): insertar al inicio de línea
  - [x] Acciones block (horizontal rule, table, image): insertar bloque completo en posición del cursor
  - [x] Acción link: recibe `url` en params → inserta `[selección](url)` o `[texto](url)` si no hay selección
  - [x] Acción tabla: recibe `rows` y `cols` en params → genera template markdown de tabla
  - [x] Después de cada acción, hacer `view.focus()` para devolver el foco al editor

### Frontend — Componente MarkdownToolbar

- [x] Task 4: Crear componente MarkdownToolbar (AC: #1, #2, #3, #7)
  - [x] Archivo: `apps/web/src/modules/documents/infrastructure/components/toolbar/MarkdownToolbar.tsx`
  - [x] Props: `editorView: EditorView | null`
  - [x] Altura 40px, fondo `bg-secondary`, posición fija arriba del editor
  - [x] 13 botones organizados en 4 grupos con separadores verticales de 1px entre grupos
  - [x] Cada botón: 32x28px, con ícono de lucide-react + Tooltip con nombre y atajo si aplica
  - [x] Estados de botón: default (`text-muted-foreground`), hover (`bg-muted text-foreground`), active (`bg-primary/10 text-primary`), disabled (`opacity-40`)
  - [x] Botones simples (bold, italic, strikethrough, bullets, numbered, checklist, blockquote, hr, code): al hacer clic → `executeToolbarAction(view, action)`
  - [x] Usar componente Button variant="ghost" size="sm" como base

### Frontend — Dropdown de Headers

- [x] Task 5: Crear dropdown de headers en toolbar (AC: #4)
  - [x] Dentro de `MarkdownToolbar.tsx` o como subcomponente `HeaderDropdown.tsx` en carpeta `toolbar/`
  - [x] Usar `DropdownMenu` de shadcn/ui (Radix)
  - [x] Trigger: botón "H" del toolbar
  - [x] Items: H1 a H6, cada uno muestra el nivel (ej: "Heading 1", "Heading 2"...)
  - [x] Al seleccionar → `executeToolbarAction(view, ToolbarAction.HEADING_X)`

### Frontend — Popover de Link

- [x] Task 6: Crear popover de link en toolbar (AC: #5)
  - [x] Dentro de `MarkdownToolbar.tsx` o como subcomponente `LinkPopover.tsx` en carpeta `toolbar/`
  - [x] Usar `Popover` de shadcn/ui (Radix)
  - [x] Trigger: botón 🔗 del toolbar
  - [x] Contenido: campo Input para URL + botón "Insertar"
  - [x] Al confirmar → `executeToolbarAction(view, ToolbarAction.LINK, { url })`
  - [x] Cerrar popover después de insertar

### Frontend — Dropdown de Tabla

- [x] Task 7: Crear dropdown de tabla en toolbar (AC: #6)
  - [x] Dentro de `MarkdownToolbar.tsx` o como subcomponente `TableDropdown.tsx` en carpeta `toolbar/`
  - [x] Usar `DropdownMenu` o `Popover` de shadcn/ui
  - [x] Trigger: botón ⊞ del toolbar
  - [x] Grid visual para seleccionar filas × columnas (max 6×6 es suficiente)
  - [x] Al seleccionar → `executeToolbarAction(view, ToolbarAction.TABLE, { rows: '3', cols: '3' })`
  - [x] Generar template: header row + separator row + data rows

### Frontend — Integración con DocumentEditor

- [x] Task 8: Integrar MarkdownToolbar en DocumentEditor (AC: #1, #7)
  - [x] Modificar `DocumentEditor.tsx` para incluir `<MarkdownToolbar>` entre el header y el área de editor
  - [x] Pasar `editorView` ref al toolbar (necesita exponer ref desde `CodeMirrorEditor`)
  - [x] Visible solo en modos EDITOR e HYBRID, oculto en PREVIEW
  - [x] Exponer `EditorView` ref desde `CodeMirrorEditor` via `useImperativeHandle` o callback ref

### Frontend — Atajos de teclado adicionales

- [x] Task 9: Agregar atajos de teclado faltantes en CodeMirror (AC: #2)
  - [x] Agregar al `markdownKeymap` en `CodeMirrorEditor.tsx`:
    - `Mod-k` → link (inserta `[texto](url)`)
    - `Mod-e` → inline code (envuelve con backticks)
    - `Mod-Shift-s` → strikethrough (envuelve con `~~`)
  - [x] Los tooltips del toolbar deben mostrar estos atajos

### Testing

- [x] Task 10: E2E tests en `e2e/toolbar.spec.ts`
  - [x] UI: Toolbar visible en modo Editor con 4 grupos de botones
  - [x] UI: Toolbar visible en modo Hybrid
  - [x] UI: Toolbar oculto en modo Preview
  - [x] UI: Clic en Bold con texto seleccionado → envuelve con `**`
  - [x] UI: Clic en Bold sin selección → inserta placeholder `**texto**`
  - [x] UI: Header dropdown muestra H1-H6, seleccionar H2 → inserta `## `
  - [x] UI: Link popover → ingresar URL → inserta `[texto](url)`
  - [x] UI: Table dropdown → seleccionar tamaño → inserta template de tabla
  - [x] UI: Atajos de teclado Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+E funcionan
  - [x] API: No hay endpoints nuevos (solo frontend)

## Dev Notes

### Qué YA existe (NO recrear)

- `CodeMirrorEditor.tsx` — editor con `wrapSelection()` utility para bold/italic. **Extraer** esta utilidad para compartirla con el toolbar
- `DocumentEditor.tsx` — layout con header, mode tabs, autosave. **Insertar** toolbar entre tabs y editor
- `MarkdownPreview.tsx` — preview que se actualiza automáticamente cuando cambia el contenido
- `SplitView.tsx` — split panel para modo híbrido
- Componentes shadcn/ui en `common/components/ui/`: button, card, input, label, resizable
- CSS Variables definidas: `--background-secondary`, `--muted`, `--primary`, `--foreground`, `--foreground-secondary`, `--border`
- `EditorMode` enum con EDITOR, HYBRID, PREVIEW

### Patrón `wrapSelection` existente

En `CodeMirrorEditor.tsx` ya existe:
```typescript
const wrapSelection = (view: EditorView, before: string, after: string) => {
  const { from, to } = view.state.selection.main;
  // Si hay selección → wrap, si no → inserta placeholder
};
```
**Extraer** a archivo compartido `toolbar/toolbar-actions.ts` y reutilizar tanto desde keymaps como desde toolbar buttons.

### Cómo exponer EditorView al toolbar

`CodeMirrorEditor` actualmente usa un ref interno para el EditorView. Para que el toolbar pueda ejecutar acciones:
- Opción recomendada: agregar callback prop `onEditorReady?: (view: EditorView) => void` a CodeMirrorEditor
- DocumentEditor guarda el view en un `useRef<EditorView | null>` y lo pasa a MarkdownToolbar

### Íconos — lucide-react

El proyecto ya usa `lucide-react` (viene con shadcn/ui). Íconos relevantes para toolbar:
- Heading: `Heading1`...`Heading6` para dropdown, `Heading` para botón
- Bold: `Bold`
- Italic: `Italic`
- Strikethrough: `Strikethrough`
- List: `List`
- ListOrdered: `ListOrdered`
- ListChecks: `ListChecks` (o `CheckSquare`)
- Link: `Link`
- Image: `Image`
- Code: `Code`
- Table: `Table`
- Quote: `Quote`
- Minus: `Minus` (horizontal rule)

### Estructura de archivos del toolbar

```
modules/documents/infrastructure/components/toolbar/
├── MarkdownToolbar.tsx        # Componente principal
├── HeaderDropdown.tsx         # Dropdown H1-H6
├── LinkPopover.tsx            # Popover para URL
├── TableDropdown.tsx          # Selector de filas×columnas
└── toolbar-actions.ts         # Utilidades de ejecución de acciones
```

### Generación de tabla markdown

Template para tabla 3×3:
```markdown
| Header 1 | Header 2 | Header 3 |
| --- | --- | --- |
| Cell | Cell | Cell |
| Cell | Cell | Cell |
```

### Responsive (NO implementar en esta story)

UX-DR7 menciona toolbar compacto en móvil (bottom, scroll horizontal). Esto se implementará en Epic 8 (responsive). En esta story: toolbar fijo arriba del editor, sin adaptación móvil.

### Keyboard shortcuts — Tooltips

Los tooltips de los botones deben incluir el atajo si existe:
- Bold: "Negrita (Ctrl+B)"
- Italic: "Cursiva (Ctrl+I)"
- Link: "Enlace (Ctrl+K)"
- Code: "Código (Ctrl+E)"
- Strikethrough: "Tachado (Ctrl+Shift+S)"

### CSS — Estilos del toolbar

```css
/* Altura fija 40px, borde inferior sutil */
.markdown-toolbar {
  height: 40px;
  background: var(--secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-2);
  gap: var(--space-1);
}
```

O usar clases Tailwind directamente: `h-10 bg-secondary border-b flex items-center px-2 gap-1`

### Project Structure Notes

- Nuevos archivos:
  - `apps/web/src/modules/documents/infrastructure/components/toolbar/MarkdownToolbar.tsx`
  - `apps/web/src/modules/documents/infrastructure/components/toolbar/HeaderDropdown.tsx`
  - `apps/web/src/modules/documents/infrastructure/components/toolbar/LinkPopover.tsx`
  - `apps/web/src/modules/documents/infrastructure/components/toolbar/TableDropdown.tsx`
  - `apps/web/src/modules/documents/infrastructure/components/toolbar/toolbar-actions.ts`
  - `apps/web/src/modules/documents/domain/enums/toolbar-actions.enum.ts`
  - `apps/web/src/common/components/ui/dropdown-menu.tsx`
  - `apps/web/src/common/components/ui/popover.tsx`
  - `apps/web/src/common/components/ui/tooltip.tsx`
  - `apps/web/src/common/components/ui/separator.tsx`
  - `e2e/toolbar.spec.ts`
- Archivos modificados:
  - `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx` (exponer view ref + extraer wrapSelection + nuevos keymaps)
  - `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` (integrar toolbar)
  - `apps/web/src/modules/documents/domain/index.ts` (exportar nuevos enums)

### Referencias

- [Source: _bmad-output/planning-artifacts/epic-04-edicion.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MarkdownToolbar (UX-DR7)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MarkdownEditor (UX-DR5)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Documents Module Components]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Keyboard shortcut tests needed `Meta` modifier on macOS instead of `Control` — CodeMirror's `Mod` maps to `Meta` on macOS
- Extracted `wrapSelection` from CodeMirrorEditor to shared `toolbar-actions.ts` utility
- EditorView exposed to toolbar via `onEditorReady` callback prop pattern (not useImperativeHandle)

### Completion Notes List

- Installed 4 Radix UI packages: dropdown-menu, popover, tooltip, separator
- Created 4 shadcn/ui wrapper components in `common/components/ui/`
- Created `ToolbarAction` and `ToolbarGroup` enums in domain layer
- Created `toolbar-actions.ts` with `executeToolbarAction` supporting all 18 action types
- Created `MarkdownToolbar` component with 13 buttons in 4 groups + separators
- Created `HeaderDropdown` (H1-H6), `LinkPopover` (URL input), `TableDropdown` (grid selector) subcomponents
- Integrated toolbar in `DocumentEditor` — visible in Editor/Hybrid modes, hidden in Preview
- Exposed `EditorView` from `CodeMirrorEditor` via `onEditorReady` callback
- Added 3 new keyboard shortcuts: `Mod-k` (link), `Mod-e` (code), `Mod-Shift-s` (strikethrough)
- 9 new E2E tests covering all ACs (toolbar visibility, actions, shortcuts)
- All 121 E2E tests + 68 unit tests pass (0 regressions)

### File List

- `apps/web/src/common/components/ui/dropdown-menu.tsx` (new)
- `apps/web/src/common/components/ui/popover.tsx` (new)
- `apps/web/src/common/components/ui/tooltip.tsx` (new)
- `apps/web/src/common/components/ui/separator.tsx` (new)
- `apps/web/src/modules/documents/domain/enums/toolbar-actions.enum.ts` (new)
- `apps/web/src/modules/documents/domain/index.ts` (modified)
- `apps/web/src/modules/documents/infrastructure/components/toolbar/toolbar-actions.ts` (new)
- `apps/web/src/modules/documents/infrastructure/components/toolbar/MarkdownToolbar.tsx` (new)
- `apps/web/src/modules/documents/infrastructure/components/toolbar/HeaderDropdown.tsx` (new)
- `apps/web/src/modules/documents/infrastructure/components/toolbar/LinkPopover.tsx` (new)
- `apps/web/src/modules/documents/infrastructure/components/toolbar/TableDropdown.tsx` (new)
- `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx` (modified)
- `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` (modified)
- `apps/web/package.json` (modified)
- `e2e/toolbar.spec.ts` (new)
