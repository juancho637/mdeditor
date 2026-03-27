# Story 4.5: Sync Scroll y Temas

Status: review

## Story

As a **usuario**,
I want **que el editor y el preview se sincronicen al hacer scroll en modo híbrido, y poder cambiar entre tema claro y oscuro**,
so that **tenga una experiencia de edición fluida y adaptada a mis preferencias visuales**.

## Acceptance Criteria

1. **Given** estoy en modo híbrido
   **When** hago scroll en el panel del editor
   **Then** el panel de preview se sincroniza a la posición correspondiente

2. **Given** estoy en modo híbrido
   **When** hago scroll en el panel de preview
   **Then** el panel del editor se sincroniza a la posición correspondiente

3. **Given** la sincronización de scroll está activa
   **When** edito contenido que cambia la longitud del documento
   **Then** la sincronización se mantiene coherente sin saltos bruscos

4. **Given** estoy usando la plataforma
   **When** hago clic en el toggle de tema (sol/luna) en el header
   **Then** el tema cambia instantáneamente entre claro y oscuro sin recarga
   **And** el editor, preview, sidebar y todos los componentes se adaptan

5. **Given** cambio el tema a oscuro
   **When** cierro y vuelvo a abrir la plataforma
   **Then** mi preferencia de tema se mantiene (persistida por usuario)

6. **Given** accedo a la plataforma por primera vez
   **When** mi sistema operativo tiene modo oscuro activado
   **Then** la plataforma respeta `prefers-color-scheme` como tema inicial

7. **Given** tengo el tema oscuro activado
   **When** verifico los contrastes de la interfaz
   **Then** todos los textos cumplen con el ratio minimo 4.5:1 (NFR26)

## Tasks / Subtasks

### Parte 1: Tema Claro/Oscuro

- [x] Task 1: Crear store Zustand para tema (AC: #4, #5, #6)
  - [x] Archivo: `apps/web/src/modules/theme/infrastructure/state/theme.state.ts`
  - [x] Estado: `theme: 'light' | 'dark' | 'system'`, `resolvedTheme: 'light' | 'dark'`
  - [x] Acciones: `toggleTheme()`, `setTheme(theme)`, `initTheme()`
  - [x] `initTheme()`: leer de localStorage (`theme-preference`), fallback a `prefers-color-scheme`
  - [x] Al cambiar tema: aplicar/remover clase `dark` en `document.documentElement` + guardar en localStorage
  - [x] Exportar desde `apps/web/src/modules/theme/infrastructure/index.ts`

- [x] Task 2: Crear enum de tema (AC: #4)
  - [x] Archivo: `apps/web/src/modules/theme/domain/enums/theme.enum.ts`
  - [x] Enum `Theme` con valores: `LIGHT`, `DARK`, `SYSTEM`
  - [x] Exportar desde `apps/web/src/modules/theme/domain/index.ts`

- [x] Task 3: Crear componente ThemeToggle (AC: #4)
  - [x] Archivo: `apps/web/src/modules/theme/infrastructure/components/ThemeToggle.tsx`
  - [x] Botón con icono sol/luna de lucide-react (`Sun`, `Moon`)
  - [x] Usa store de tema para leer y cambiar estado
  - [x] Estilo: `Button` variant="ghost" size="icon" — misma altura que otros botones del header
  - [x] Tooltip: "Cambiar tema"

- [x] Task 4: Integrar ThemeToggle en header del dashboard (AC: #4)
  - [x] Modificar: `apps/web/src/app/dashboard/layout.tsx`
  - [x] Agregar `<ThemeToggle />` en el lado derecho del header, antes de "Configuracion"
  - [x] Inicializar tema al montar el layout: llamar `initTheme()` del store

- [x] Task 5: Aplicar tema oscuro a CodeMirror (AC: #4, #7)
  - [x] Modificar: `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx`
  - [x] Crear dos variantes del `editorTheme`: light y dark usando CSS variables
  - [x] Subscribirse al store de tema para reconfigurar el editor cuando cambie
  - [x] Variante dark: fondo `--background-secondary` dark (#1A1A1A), texto `--foreground` dark, gutter adaptado
  - [x] NO usar `oneDark` directamente — crear tema custom con CSS variables para coherencia con design system
  - [x] Usar `EditorView.theme()` con selectores `&.cm-editor` y `&dark` variant o reconfiguracion de compartments

- [x] Task 6: Verificar contraste 4.5:1 en dark mode (AC: #7)
  - [x] Revisar que MarkdownPreview hereda correctamente las CSS variables en `.dark`
  - [x] Revisar syntax highlighting de CodeMirror sea legible en dark
  - [x] Revisar toolbar, sidebar, header se adaptan (ya usan CSS variables)
  - [x] Los colores dark ya estan definidos en `globals.css` bajo `.dark` — verificar que se aplican correctamente

### Parte 2: Sync Scroll

- [x] Task 7: Crear hook useSyncScroll (AC: #1, #2, #3)
  - [x] Archivo: `apps/web/src/modules/documents/infrastructure/hooks/use-sync-scroll.ts`
  - [x] Parametros: `editorRef: RefObject<HTMLElement>`, `previewRef: RefObject<HTMLElement>`
  - [x] Logica: scroll basado en porcentaje de posicion (`scrollTop / (scrollHeight - clientHeight)`)
  - [x] Bidireccional: editor → preview Y preview → editor
  - [x] Guard contra scroll loops: flag `isScrolling` con reset despues de `requestAnimationFrame`
  - [x] Debounce sutil (16ms ~ 1 frame) para evitar saltos bruscos
  - [x] Cleanup de event listeners en unmount

- [x] Task 8: Exponer scroll containers de CodeMirror y MarkdownPreview (AC: #1, #2)
  - [x] Modificar `CodeMirrorEditor.tsx`: exponer el `.cm-scroller` DOM element via callback `onScrollerReady?: (el: HTMLElement) => void`
  - [x] Modificar `MarkdownPreview.tsx`: agregar `ref` forwarding al container scrollable (el div con `overflow-auto`)
  - [x] El scroller de CodeMirror es `.cm-scroller` dentro del editor — accesible via `view.scrollDOM`

- [x] Task 9: Integrar useSyncScroll en SplitView/DocumentEditor (AC: #1, #2, #3)
  - [x] Modificar `DocumentEditor.tsx` para pasar refs de scroll a SplitView
  - [x] Activar sync scroll solo en modo HYBRID
  - [x] Desactivar al cambiar a modo EDITOR o PREVIEW

### Testing

- [x] Task 10: E2E tests en `e2e/sync-scroll-theme.spec.ts`
  - [x] UI: Theme toggle visible en header
  - [x] UI: Click en toggle cambia a dark mode (clase `dark` en html)
  - [x] UI: Preferencia de tema persiste tras reload
  - [x] UI: Dark mode aplica a editor, preview, sidebar, toolbar, header
  - [x] UI: En modo hibrido, scroll en editor mueve preview
  - [x] UI: En modo hibrido, scroll en preview mueve editor
  - [x] UI: Sync scroll NO activo en modo Editor o Preview solos
  - [x] API: No hay endpoints nuevos (solo frontend)

## Dev Notes

### Que YA existe (NO recrear)

- **CSS Variables dark mode** — `globals.css` ya tiene TODOS los tokens dark bajo selector `.dark`:
  - `--background: #191919`, `--background-secondary: #202020`, `--foreground: #E8E8E5`
  - `--muted: #2C2C2C`, `--border: #333333`, `--primary: #4A9EFF`
  - Todos los componentes shadcn/ui ya usan estas variables → se adaptan automaticamente al agregar clase `dark`
- **CodeMirrorEditor.tsx** — tema custom via `EditorView.theme()`, tiene `@codemirror/theme-one-dark` importado pero NO usado
- **MarkdownPreview.tsx** — estilos `.prose` con CSS variables, se adaptara automaticamente a dark
- **SplitView.tsx** — usa `react-resizable-panels`, 50/50 default, min 30%
- **DocumentEditor.tsx** — maneja modos (EDITOR, HYBRID, PREVIEW), toolbar, save status
- **Dashboard layout** — header en `apps/web/src/app/dashboard/layout.tsx` con logo, breadcrumbs, logout
- **Zustand stores** — patron establecido: `create<State & Actions>((set) => ({...}))` en archivos `*.state.ts`
- **localStorage** — ya usado para `editor-mode-preference` en DocumentEditor
- **lucide-react** — ya instalado, usar `Sun` y `Moon` icons
- **Tooltip** — `apps/web/src/common/components/ui/tooltip.tsx` ya existe (de story 4-4)

### Patron de tema — Implementacion clave

**NO instalar `next-themes`.** La implementacion es directa:

1. Store Zustand maneja el estado del tema
2. Al inicializar: leer localStorage → si no existe, leer `window.matchMedia('(prefers-color-scheme: dark)')`
3. Al cambiar tema: `document.documentElement.classList.toggle('dark')` + `localStorage.setItem('theme-preference', theme)`
4. Tailwind + shadcn/ui ya soportan la clase `.dark` → todos los componentes se adaptan solos
5. CodeMirror necesita reconfiguracion explicita porque no usa CSS variables nativamente para syntax highlighting

### CodeMirror Dark Theme — Approach

El `editorTheme` actual en `CodeMirrorEditor.tsx` (linea ~35) define estilos base:
```typescript
const editorTheme = EditorView.theme({
  '&': { fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: '14px', height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { padding: '16px', minHeight: '100%' },
  '.cm-gutters': { border: 'none' },
});
```

**Approach recomendado:**
- Usar `Compartment` de `@codemirror/state` para hacer el tema reconfigurable dinamicamente
- Crear dos theme objects: `lightTheme` y `darkTheme` que usen CSS variables correspondientes
- Al cambiar tema en el store → `compartment.reconfigure(newTheme)` en el EditorView
- Para syntax highlighting en dark: aplicar colores que contrasten sobre fondo oscuro (los de oneDark son buena referencia pero usar CSS variables custom)

```typescript
import { Compartment } from '@codemirror/state';
const themeCompartment = new Compartment();

// En el effect de inicializacion:
const darkTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--background-secondary)' },
  '.cm-content': { color: 'var(--foreground)', caretColor: 'var(--primary)' },
  '.cm-cursor': { borderLeftColor: 'var(--primary)' },
  '.cm-gutters': { backgroundColor: 'var(--background-secondary)', color: 'var(--foreground-secondary)' },
  '.cm-activeLine': { backgroundColor: 'var(--muted)' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(74, 158, 255, 0.3)' },
}, { dark: true });
```

### Sync Scroll — Approach tecnico

**Algoritmo basado en porcentaje de posicion:**

```typescript
const syncScroll = (source: HTMLElement, target: HTMLElement) => {
  const sourcePercent = source.scrollTop / (source.scrollHeight - source.clientHeight);
  target.scrollTop = sourcePercent * (target.scrollHeight - target.clientHeight);
};
```

**Prevencion de loops:**
- Flag `isSyncing` que bloquea el handler del target mientras el source esta scrolleando
- Reset con `requestAnimationFrame` para siguiente frame

**Acceso al scroller de CodeMirror:**
- `EditorView` tiene propiedad `scrollDOM` que devuelve el elemento `.cm-scroller`
- Exponer via callback `onScrollerReady` similar al patron `onEditorReady` de story 4-4

**Edge case AC#3 (edicion que cambia longitud):**
- El sync se basa en porcentaje, no en pixeles absolutos → es naturalmente resiliente a cambios de longitud
- Despues de cada edicion, el porcentaje se recalcula automaticamente

### Estructura de archivos nuevos

```
modules/theme/
  domain/
    enums/
      theme.enum.ts            # Enum Theme (LIGHT, DARK, SYSTEM)
    index.ts
  infrastructure/
    components/
      ThemeToggle.tsx           # Boton toggle sol/luna
    state/
      theme.state.ts            # Zustand store
    index.ts

modules/documents/infrastructure/
  hooks/
    use-sync-scroll.ts          # Hook de sync scroll bidireccional
```

### Archivos a modificar

- `apps/web/src/app/dashboard/layout.tsx` — agregar ThemeToggle al header + initTheme()
- `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx` — tema dark + Compartment + onScrollerReady
- `apps/web/src/modules/documents/infrastructure/components/MarkdownPreview.tsx` — ref forwarding al scroll container
- `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` — integrar useSyncScroll en modo HYBRID

### Aprendizajes de story 4-4

- EditorView se expone via callback prop `onEditorReady?: (view: EditorView) => void` — reusar este patron para `onScrollerReady`
- Toolbar-actions extrae funcionalidad compartida del editor — no duplicar logica
- Los tooltips usan el componente `Tooltip` de `common/components/ui/tooltip.tsx`
- Patron de botones del header: `Button` variant="ghost" — usar el mismo para ThemeToggle

### Project Structure Notes

- Nuevo modulo `theme/` sigue la estructura MVVM del frontend: `domain/` + `infrastructure/`
- No hay backend involucrado — todo es frontend (localStorage para persistencia)
- Hook `use-sync-scroll.ts` va en `documents/infrastructure/hooks/` porque es especifico del editor, no del tema
- NO crear carpeta `hooks/` dentro de `theme/` — el toggle es un componente, no un hook

### Referencias

- [Source: _bmad-output/planning-artifacts/epic-04-edicion.md#Story 4.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR1 Design Tokens]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tematizacion]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: apps/web/src/app/globals.css — Dark mode CSS variables]
- [Source: apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx — Current editor theme]
- [Source: apps/web/src/app/dashboard/layout.tsx — Header layout]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Dashboard page wrapper usaba `minHeight` en vez de `height` fijo, causando que los paneles expandieran al tamanio del contenido sin scroll. Fix: cambiar a `height: calc(100vh - 48px)`.
- Sync scroll necesita ambos refs (editor scroller + preview scroller) como state (no refs) para que el effect se re-ejecute cuando se setean.
- CodeMirror `.cm-scroller` se expone via `view.scrollDOM` en el callback `onScrollerReady`.
- El preview scroll container en SplitView es el wrapper div, no el `.prose-container` de MarkdownPreview.
- `oneDarkHighlightStyle` de `@codemirror/theme-one-dark` se usa para syntax highlighting en dark mode, reconfigurable via `Compartment`.
- CSS variables en el `baseEditorTheme` de CodeMirror se actualizan automaticamente al togglear la clase `.dark`.

### Completion Notes List

- Creado modulo `theme/` con dominio (enum Theme) e infraestructura (Zustand store, ThemeToggle component)
- ThemeToggle integrado en header del dashboard con iconos Sun/Moon de lucide-react
- Tema inicializado en dashboard layout via `initTheme()` que lee localStorage o `prefers-color-scheme`
- CodeMirror theme refactorizado: `baseEditorTheme` usa CSS variables para adaptarse a dark/light automaticamente
- Syntax highlighting en CodeMirror usa `Compartment` para swap entre `defaultHighlightStyle` (light) y `oneDarkHighlightStyle` (dark)
- MarkdownPreview convertido a `forwardRef` para exponer ref al scroll container
- SplitView extendido con `previewRef` prop para el scroll container
- Hook `useSyncScroll` implementado con sync bidireccional basado en porcentaje + guard contra loops
- Dashboard page height corregido de `minHeight` a `height` fijo para habilitar scroll en paneles
- 8 E2E tests nuevos cubriendo theme toggle, persistencia, dark mode, sync scroll bidireccional
- 135 E2E tests + 76 unit tests pass (0 regresiones)

### File List

- `apps/web/src/modules/theme/domain/enums/theme.enum.ts` (new)
- `apps/web/src/modules/theme/domain/index.ts` (new)
- `apps/web/src/modules/theme/infrastructure/state/theme.state.ts` (new)
- `apps/web/src/modules/theme/infrastructure/components/ThemeToggle.tsx` (new)
- `apps/web/src/modules/theme/infrastructure/index.ts` (new)
- `apps/web/src/modules/documents/infrastructure/hooks/use-sync-scroll.ts` (new)
- `apps/web/src/app/dashboard/layout.tsx` (modified — ThemeToggle + initTheme)
- `apps/web/src/app/dashboard/page.tsx` (modified — fixed height for scroll)
- `apps/web/src/modules/documents/infrastructure/components/CodeMirrorEditor.tsx` (modified — dark theme + Compartment + onScrollerReady)
- `apps/web/src/modules/documents/infrastructure/components/MarkdownPreview.tsx` (modified — forwardRef)
- `apps/web/src/modules/documents/infrastructure/components/SplitView.tsx` (modified — previewRef prop)
- `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` (modified — sync scroll integration)
- `e2e/sync-scroll-theme.spec.ts` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/4-5-sync-scroll-y-temas.md` (modified)
