# Story 4.1: Editor Markdown con CodeMirror 6

Status: ready-for-dev

## Story

As a **usuario con permisos de edición**,
I want **editar documentos en un editor markdown con syntax highlighting y atajos de teclado**,
so that **pueda escribir markdown de forma eficiente con una experiencia de editor profesional**.

## Acceptance Criteria

1. **Given** abro un documento con permiso de edición
   **When** se carga la página del documento
   **Then** veo un editor CodeMirror 6 con el contenido del documento
   **And** el editor muestra syntax highlighting de markdown (headers, bold, links, código, listas)
   **And** la fuente es JetBrains Mono 14px con fondo ligeramente diferenciado

2. **Given** estoy escribiendo en el editor
   **When** presiono Ctrl+B con texto seleccionado
   **Then** el texto se envuelve con `**texto**`

3. **Given** estoy escribiendo en el editor
   **When** presiono Ctrl+I con texto seleccionado
   **Then** el texto se envuelve con `*texto*`

4. **Given** estoy escribiendo en el editor
   **When** presiono Ctrl+Z
   **Then** se deshace la última acción

5. **Given** estoy editando un documento
   **When** el contenido cambia
   **Then** se guarda automáticamente con debounce y el badge muestra "✓ Guardado"

6. **Given** mi grupo tiene permiso "Ver" pero no "Editar"
   **When** abro el documento
   **Then** el editor está en modo read-only (sin cursor, sin posibilidad de editar)

## Tasks / Subtasks

### Frontend

- [ ] Task 1: Instalar dependencias de CodeMirror 6
  - [ ] `@codemirror/view`, `@codemirror/state`, `@codemirror/commands`
  - [ ] `@codemirror/lang-markdown`, `@codemirror/language-data`
  - [ ] `@codemirror/theme-one-dark` (tema oscuro)
  - [ ] Instalar via container: `make add PKG="@codemirror/view @codemirror/state @codemirror/commands @codemirror/lang-markdown @codemirror/language-data @codemirror/theme-one-dark" APP=web`

- [ ] Task 2: Crear componente CodeMirrorEditor (AC: #1, #6)
  - [ ] Componente React que wrappea CodeMirror 6
  - [ ] Props: content, readOnly, onChange
  - [ ] Extensions: markdown language, syntax highlighting, dark theme (condicional)
  - [ ] Fuente JetBrains Mono 14px via EditorView.theme
  - [ ] readOnly via EditorState.readOnly
  - [ ] Lazy load con `next/dynamic` para mantener bundle < 500KB

- [ ] Task 3: Keyboard shortcuts (AC: #2, #3, #4)
  - [ ] Ctrl+B: wrap selección con `**...**`
  - [ ] Ctrl+I: wrap selección con `*...*`
  - [ ] Ctrl+Z: undo (built-in en CodeMirror)
  - [ ] Custom keymap extension para bold/italic

- [ ] Task 4: Reemplazar textarea en DocumentEditor (AC: #1, #5)
  - [ ] Cambiar `<textarea>` por `<CodeMirrorEditor>`
  - [ ] Mantener autosave con debounce 500ms
  - [ ] Mantener badge de estado "Guardando.../✓ Guardado"
  - [ ] Pasar readOnly basado en permission_level del documento

- [ ] Task 5: Integrar permiso read-only (AC: #6)
  - [ ] Dashboard page pasa permission_level al DocumentEditor
  - [ ] Si VIEW → editor readOnly, ocultar save status

### Testing

- [ ] Task 6: E2E tests (AC: #1, #5, #6)
  - [ ] UI: abrir documento → ver CodeMirror (no textarea)
  - [ ] UI: escribir → autosave → badge "✓ Guardado"

## Dev Notes

### Qué YA existe (NO recrear)

- `DocumentEditor.tsx` — tiene el autosave con debounce 500ms, badge de estado, flush on document switch. Solo reemplazar el `<textarea>` por CodeMirror.
- `useDocumentViewModel` — `saveContent(id, contentMarkdown)` funciona igual.
- `document.state.ts` — `saveStatus: 'idle' | 'saving' | 'saved'` ya implementado.

### CodeMirror 6 setup mínimo

```typescript
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';

const state = EditorState.create({
  doc: content,
  extensions: [
    basicSetup,
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    oneDark, // condicional según tema
    EditorState.readOnly.of(readOnly),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
    keymap.of([
      { key: 'Mod-b', run: wrapBold },
      { key: 'Mod-i', run: wrapItalic },
    ]),
  ],
});

const view = new EditorView({ state, parent: containerRef.current });
```

### Lazy loading

```typescript
import dynamic from 'next/dynamic';

const CodeMirrorEditor = dynamic(
  () => import('./CodeMirrorEditor').then((m) => m.CodeMirrorEditor),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted h-full" /> },
);
```

### Custom keymaps para bold/italic

```typescript
function wrapSelection(view: EditorView, before: string, after: string): boolean {
  const { from, to } = view.state.selection.main;
  if (from === to) {
    // No selection — insert placeholder
    const placeholder = `${before}text${after}`;
    view.dispatch({
      changes: { from, insert: placeholder },
      selection: { anchor: from + before.length, head: from + before.length + 4 },
    });
  } else {
    // Wrap selection
    view.dispatch({
      changes: [
        { from, insert: before },
        { from: to, insert: after },
      ],
      selection: { anchor: from + before.length, head: to + before.length },
    });
  }
  return true;
}

const wrapBold = (view: EditorView) => wrapSelection(view, '**', '**');
const wrapItalic = (view: EditorView) => wrapSelection(view, '*', '*');
```

### Theme — JetBrains Mono + fondo diferenciado

```typescript
const editorTheme = EditorView.theme({
  '&': {
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: '14px',
    backgroundColor: 'var(--background-secondary)',
  },
  '.cm-content': {
    padding: '16px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--background-secondary)',
    border: 'none',
  },
});
```

### Dependencias a instalar

```bash
make add PKG="codemirror @codemirror/view @codemirror/state @codemirror/commands @codemirror/lang-markdown @codemirror/language-data @codemirror/theme-one-dark" APP=web
```

### References

- [Source: _bmad-output/planning-artifacts/epic-04-edicion.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md] — CodeMirror 6 + bundle < 500KB
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR5] — Editor specification

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
