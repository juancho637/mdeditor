# Story 4.2: Visualizador de Markdown Renderizado

Status: done

## Story

As a **usuario**,
I want **ver documentos renderizados como HTML limpio y formateado**,
so that **pueda leer el contenido de forma cómoda sin ver la sintaxis markdown**.

## Acceptance Criteria

1. **Given** abro un documento
   **When** selecciono el modo "Preview"
   **Then** veo el markdown renderizado como HTML con estilos del design system
   **And** el contenido está centrado con max-width 900px y márgenes amplios

2. **Given** el documento contiene headers (H1-H6)
   **When** veo el preview
   **Then** se renderizan con la escala tipográfica definida (H1: 32px bold, H2: 24px semibold, etc.)

3. **Given** el documento contiene bloques de código con lenguaje especificado
   **When** veo el preview
   **Then** se muestran con syntax highlighting por lenguaje, fondo diferenciado y fuente monospace

4. **Given** el documento contiene tablas
   **When** veo el preview
   **Then** se muestran con bordes sutiles, header con fondo y alternancia de color en filas

5. **Given** el documento contiene HTML inline o scripts
   **When** se renderiza el preview
   **Then** el contenido se sanitiza con DOMPurify y no se ejecuta ningún script

## Tasks / Subtasks

### Frontend

- [ ] Task 1: Instalar dependencias
  - [ ] `react-markdown` — renderizar markdown a React
  - [ ] `remark-gfm` — soporte para tablas, strikethrough, task lists
  - [ ] `rehype-highlight` — syntax highlighting en bloques de código
  - [ ] `dompurify` + `@types/dompurify` — sanitización XSS
  - [ ] Instalar: `make add PKG="react-markdown remark-gfm rehype-highlight dompurify" APP=web` + `make add-dev PKG="@types/dompurify" APP=web`

- [ ] Task 2: Crear componente MarkdownPreview (AC: #1, #2, #3, #4, #5)
  - [ ] Componente que recibe `content: string` y renderiza HTML
  - [ ] react-markdown con plugins remark-gfm + rehype-highlight
  - [ ] Sanitización con DOMPurify antes de renderizar
  - [ ] Estilos prose: max-width 900px, Inter 16px, line-height 1.7
  - [ ] Headers con escala tipográfica (H1: 32px, H2: 24px, H3: 20px)
  - [ ] Bloques de código con fondo diferenciado + JetBrains Mono
  - [ ] Tablas con bordes, header con fondo, alternancia de color
  - [ ] Lazy load con next/dynamic

- [ ] Task 3: Agregar modo Preview al DocumentEditor (AC: #1)
  - [ ] Tabs: Editor | Preview (toggle en el header del editor)
  - [ ] Estado local para el modo activo
  - [ ] Editor mode: muestra CodeMirror
  - [ ] Preview mode: muestra MarkdownPreview con el contenido actual

### Testing

- [ ] Task 4: E2E tests (AC: #1)
  - [ ] UI: abrir documento → cambiar a Preview → ver HTML renderizado

## Dev Notes

### Qué YA existe

- `DocumentEditor.tsx` — header con título + CodeMirror
- Autosave con debounce
- Read-only mode

### MarkdownPreview — prose styles

```css
.prose h1 { font-size: 32px; font-weight: 700; margin-top: 32px; margin-bottom: 16px; }
.prose h2 { font-size: 24px; font-weight: 600; margin-top: 28px; margin-bottom: 12px; }
.prose h3 { font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
.prose p { font-size: 16px; line-height: 1.7; margin-bottom: 16px; }
.prose code { font-family: var(--font-jetbrains-mono); font-size: 14px; }
.prose pre { background: var(--background-secondary); padding: 16px; border-radius: 8px; }
.prose table { border-collapse: collapse; width: 100%; }
.prose th { background: var(--muted); padding: 8px 12px; border: 1px solid var(--border); }
.prose td { padding: 8px 12px; border: 1px solid var(--border); }
.prose tr:nth-child(even) { background: var(--muted); }
```

### Sanitización con DOMPurify

```typescript
import DOMPurify from 'dompurify';

// Sanitizar contenido antes de renderizar
const sanitizedContent = DOMPurify.sanitize(htmlContent);
```

Con react-markdown, la sanitización es implícita (no ejecuta scripts), pero DOMPurify agrega una capa extra de seguridad para HTML inline dentro del markdown.

### References

- [Source: _bmad-output/planning-artifacts/epic-04-edicion.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR6] — Preview specification

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
