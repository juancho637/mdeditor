# Story 8.3: Experiencia Responsive Completa

Status: done

## Story

As a **usuario**,
I want **acceder y usar la plataforma desde tablet y móvil con una experiencia adaptada**,
so that **pueda consultar y editar documentos desde cualquier dispositivo sin limitaciones funcionales**.

## Acceptance Criteria

1. **Given** accedo desde un dispositivo móvil (< 768px)
   **When** veo la interfaz
   **Then** el sidebar es un sheet overlay que se abre con el ícono hamburguesa (☰) en el header
   **And** se cierra al seleccionar un documento o hacer swipe

2. **Given** estoy en modo híbrido en móvil
   **When** veo la interfaz
   **Then** el split view se reemplaza por tabs switcheables: [Editor] [Preview]
   **And** no hay split horizontal (pantalla demasiado pequeña)

3. **Given** estoy editando en móvil
   **When** veo el toolbar
   **Then** aparece como barra compacta en la parte inferior de la pantalla con scroll horizontal
   **And** cada botón tiene un target touch mínimo de 44x44px

4. **Given** accedo desde una tablet en landscape (≥ 1024px)
   **When** veo la interfaz
   **Then** el layout es similar a desktop con sidebar colapsado por defecto y split view disponible

5. **Given** accedo desde una tablet en portrait (768-1023px)
   **When** veo la interfaz
   **Then** el modo híbrido usa tabs en lugar de split
   **And** el sidebar es un sheet overlay

6. **Given** quiero ver el panel de actividad en móvil
   **When** hago clic en el ícono 📋
   **Then** se abre como sheet full-width desde abajo con max-height 70vh

7. **Given** estoy en el sidebar en móvil
   **When** hago long press sobre una carpeta
   **Then** se abre el menú contextual (equivalente al clic derecho en desktop)

8. **Given** estoy en la lista de documentos del sidebar en móvil
   **When** hago swipe left sobre un documento
   **Then** se revelan acciones rápidas (Eliminar, Mover)

9. **Given** estoy usando la plataforma en cualquier dispositivo
   **When** verifico la accesibilidad
   **Then** todos los elementos interactivos tienen focus rings visibles, HTML semántico, ARIA labels, y skip links funcionales

## Tasks / Subtasks

### Task 1: Instalar componentes shadcn/ui necesarios (prereq de todo)

- [ ] 1.1 Instalar Sheet component: `make add PKG="@radix-ui/react-dialog" APP=web` (Sheet usa primitivas Dialog)
  - Crear `apps/web/src/common/components/ui/sheet.tsx` (copiar de shadcn/ui — ver Dev Notes)
- [ ] 1.2 Instalar Tabs component: `make add PKG="@radix-ui/react-tabs" APP=web`
  - Crear `apps/web/src/common/components/ui/tabs.tsx` (copiar de shadcn/ui — ver Dev Notes)

### Task 2: Mobile sidebar — Sheet overlay + hamburguesa (AC: #1, #5)

- [ ] 2.1 Agregar estado `mobileSidebarOpen` (boolean, default `false`) en `apps/web/src/modules/folders/infrastructure/state/folder.state.ts` y sus acciones `openMobileSidebar` / `closeMobileSidebar`
- [ ] 2.2 Exponer `mobileSidebarOpen`, `openMobileSidebar`, `closeMobileSidebar` en `useFolderViewModel` (`apps/web/src/modules/folders/infrastructure/hooks/use-folder.viewmodel.ts`)
- [ ] 2.3 En `apps/web/src/app/dashboard/layout.tsx`:
  - Importar `Sheet`, `SheetContent`, `SheetTitle`, `SheetDescription` de shadcn/ui
  - En el header, agregar botón hamburguesa `☰` SOLO visible en `< md` (clase `md:hidden`): `<button onClick={openMobileSidebar} aria-label="Abrir navegación" className="md:hidden text-foreground-secondary hover:text-foreground">`
  - El `FolderSidebar` en desktop (≥ md) sigue igual: `<div className="hidden md:flex">`
  - Para móvil, envolver en `<Sheet open={mobileSidebarOpen} onOpenChange={...}>` con `<SheetContent side="left">`: renderiza el mismo `FolderSidebar`
  - `onOpenChange` llama `closeMobileSidebar` cuando cierra
- [ ] 2.4 En `FolderSidebar` (`apps/web/src/modules/folders/infrastructure/components/FolderSidebar.tsx`):
  - Aceptar prop opcional `onDocumentSelect?: () => void` — se llama al seleccionar cualquier carpeta/documento para cerrar el sheet
  - Pasarla a `FolderTreeItem` y llamarla en `onSelect`

### Task 3: Responsive SplitView — Tabs en móvil/tablet portrait (AC: #2, #5)

- [ ] 3.1 Crear hook `useIsMobile` en `apps/web/src/common/hooks/use-is-mobile.ts`:
  ```typescript
  'use client';
  import { useState, useEffect } from 'react';
  export function useIsMobile(breakpoint = 1024): boolean {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      setIsMobile(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);
    return isMobile;
  }
  ```

  - Breakpoint default `1024`: móvil + tablet portrait usan tabs; tablet landscape + desktop usan split.
- [ ] 3.2 Modificar `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx`:
  - Importar `useIsMobile` y `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
  - En el bloque `mode === EditorMode.HYBRID && !readOnly`:
    ```
    if (isMobile) → <Tabs defaultValue="editor"> con dos tabs: Editor / Preview
    else          → <SplitView> (behavior actual, sin cambios)
    ```
  - Los tabs del modo híbrido en móvil son INTERNOS al contenido — distinto de los mode-tabs del header (Editor/Híbrido/Preview)
  - En móvil con modo híbrido, los mode-tabs del header siguen visibles para cambiar a editor puro / preview puro; el split simplemente se reemplaza por tabs

### Task 4: Mobile toolbar compacto en parte inferior (AC: #3)

- [ ] 4.1 Modificar `apps/web/src/modules/documents/infrastructure/components/toolbar/MarkdownToolbar.tsx`:
  - En móvil (`< md`): el toolbar se posiciona como barra fija en la parte inferior
    - Clases mobile: `fixed bottom-0 left-0 right-0 z-30 overflow-x-auto flex-nowrap h-11 md:relative md:z-auto md:overflow-x-visible md:flex-wrap md:h-10`
    - Botones en móvil: `h-11 w-11 p-0` (44x44px mínimo WCAG 2.5.5)
    - Botones en desktop: `h-7 w-8 p-0` (comportamiento actual)
    - Agregar `pb-safe` padding o `env(safe-area-inset-bottom)` para notch de iPhone
  - La barra tiene `overflow-x-auto` en móvil — todos los grupos en una sola fila horizontal scrolleable
  - Agregar `data-testid="markdown-toolbar-mobile"` cuando está en modo compacto
- [ ] 4.2 En `DocumentEditor.tsx`, cuando toolbar está fijo en bottom en móvil, agregar `pb-11 md:pb-0` al container del contenido para que el editor no quede tapado por el toolbar

### Task 5: Long press en carpetas del sidebar (AC: #7)

- [ ] 5.1 Crear hook `useLongPress` en `apps/web/src/common/hooks/use-long-press.ts`:
  ```typescript
  import { useCallback, useRef } from 'react';
  export function useLongPress(callback: () => void, delay = 500) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onTouchStart = useCallback(() => {
      timerRef.current = setTimeout(callback, delay);
    }, [callback, delay]);
    const onTouchEnd = useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }, []);
    return { onTouchStart, onTouchEnd, onTouchMove: onTouchEnd };
  }
  ```
- [ ] 5.2 En `apps/web/src/modules/folders/infrastructure/components/FolderTreeItem.tsx`:
  - Importar `useLongPress`
  - Aplicar `{...longPressProps}` en el div del item para que long press abra el menú contextual: `useLongPress(() => setShowMenu(true))`
  - El menú contextual (`showMenu`) ya existe en este componente (clic derecho) — long press reutiliza la misma lógica

### Task 6: Swipe left en documentos para acciones rápidas (AC: #8)

- [ ] 6.1 Crear hook `useSwipeLeft` en `apps/web/src/common/hooks/use-swipe-left.ts`:
  ```typescript
  import { useCallback, useRef, useState } from 'react';
  export function useSwipeLeft(threshold = 60) {
    const startX = useRef(0);
    const [swiped, setSwiped] = useState(false);
    const onTouchStart = useCallback((e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      setSwiped(false);
    }, []);
    const onTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        const deltaX = startX.current - e.changedTouches[0].clientX;
        if (deltaX > threshold) setSwiped(true);
      },
      [threshold],
    );
    const reset = useCallback(() => setSwiped(false), []);
    return { swiped, reset, onTouchStart, onTouchEnd };
  }
  ```
- [ ] 6.2 En `apps/web/src/app/dashboard/page.tsx`, en la lista de documentos (`folderDocuments.map`):
  - Aplicar `useSwipeLeft` a cada item de documento
  - Cuando `swiped`: mostrar overlay con botones "Eliminar" y "Mover" (slide-in desde la derecha sobre el item)
  - "Eliminar" llama `deleteDocument(doc.id)` (ya existe en el viewmodel)
  - "Mover" — para MVP: mostrar un modal/dropdown simple con las carpetas disponibles (misma lógica que el menú contextual de desktop). Si mover entre carpetas no está implementado en el store, solo mostrar el botón "Eliminar" en el swipe por ahora.
  - Botones de acción en swipe: mínimo 44px de altura, fondo rojo para eliminar

### Task 7: Accesibilidad — Skip links, focus rings, ARIA labels (AC: #9)

- [ ] 7.1 Agregar skip link en `apps/web/src/app/layout.tsx` (o `dashboard/layout.tsx`):
  ```tsx
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  >
    Saltar al contenido principal
  </a>
  ```

  - El `<main>` en `dashboard/layout.tsx` necesita `id="main-content"`
- [ ] 7.2 Revisar y agregar `aria-label` faltantes en:
  - Header buttons (hamburguesa, logout, settings)
  - `FolderSidebar`: `<aside role="navigation" aria-label="Navegación de carpetas">`
  - `FolderTreeItem`: `<div role="treeitem" aria-selected={isSelected} aria-expanded={hasChildren ? isExpanded : undefined}>`
  - El Sheet del sidebar móvil: `<SheetTitle>Navegación</SheetTitle>` para cumplir a11y (puede quedar visualmente oculto con `sr-only`)
- [ ] 7.3 Verificar que todos los botones interactivos tengan `focus:ring-2 focus:ring-ring focus:ring-offset-2` o `focus-visible:ring-2` en sus clases de Tailwind. Los componentes de shadcn/ui (Button, Tooltip) ya lo tienen. Revisar botones custom en:
  - Botones inline de FolderSidebar (colapsar, nueva carpeta, búsqueda)
  - Botones de mode tabs en DocumentEditor
  - Botones del toolbar (ya usan `Button` de shadcn — OK)

## Dev Notes

### Estado actual de componentes (lo que YA existe — NO reinventar)

| Componente        | Archivo                                                          | Estado responsive actual                                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ActivityPanel`   | `modules/history/infrastructure/components/ActivityPanel.tsx`    | **YA tiene responsive**: `max-sm:w-full max-sm:top-auto max-sm:max-h-[70vh] max-sm:rounded-t-xl` y `lg:relative`. El sheet-desde-abajo en móvil está implementado con CSS. **NO tocar la lógica del ActivityPanel** — ya cumple AC #6 casi completamente. |
| `FolderSidebar`   | `modules/folders/infrastructure/components/FolderSidebar.tsx`    | Estático, 260px fijo. Necesita Sheet overlay en móvil.                                                                                                                                                                                                    |
| `DocumentEditor`  | `modules/documents/infrastructure/components/DocumentEditor.tsx` | Mode tabs en header. SplitView sin responsive.                                                                                                                                                                                                            |
| `SplitView`       | `modules/documents/infrastructure/components/SplitView.tsx`      | `ResizablePanelGroup` puro, sin lógica responsive.                                                                                                                                                                                                        |
| `MarkdownToolbar` | `toolbar/MarkdownToolbar.tsx`                                    | `h-10`, `bg-secondary`, sin responsive.                                                                                                                                                                                                                   |
| `FolderTreeItem`  | `modules/folders/infrastructure/components/FolderTreeItem.tsx`   | `onContextMenu` para clic derecho ya existe. Long press reutiliza `setShowMenu(true)`.                                                                                                                                                                    |
| `DashboardLayout` | `app/dashboard/layout.tsx`                                       | No mobile handling.                                                                                                                                                                                                                                       |

### Componentes shadcn/ui a instalar

**Sheet** — NO existe en `apps/web/src/common/components/ui/`. Instalar con:

```bash
make add PKG="@radix-ui/react-dialog" APP=web
```

Luego crear `apps/web/src/common/components/ui/sheet.tsx` con el código de shadcn. Estructura mínima del archivo:

```tsx
// sheet.tsx — copiar de https://ui.shadcn.com/docs/components/sheet
// Usa @radix-ui/react-dialog internamente + variate side="left"|"right"|"top"|"bottom"
import * as SheetPrimitive from '@radix-ui/react-dialog';
// exports: Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetOverlay
```

El Sheet de la sidebar usa `side="left"`. El Activity Panel en móvil ya está implementado sin Sheet (CSS), no cambiar.

**Tabs** — NO existe en `apps/web/src/common/components/ui/`. Instalar con:

```bash
make add PKG="@radix-ui/react-tabs" APP=web
```

Luego crear `apps/web/src/common/components/ui/tabs.tsx`. Estructura:

```tsx
// exports: Tabs, TabsList, TabsTrigger, TabsContent
```

> **Nota**: Los demás componentes `@radix-ui/react-dialog` puede que ya estén disponibles como dependencia transitiva de shadcn. Verificar primero antes de instalar.

### Tailwind breakpoints en este proyecto

| Tailwind prefix | Breakpoint | Dispositivo destino        |
| --------------- | ---------- | -------------------------- |
| (base/none)     | 0px+       | Móvil (< 640px)            |
| `sm:`           | 640px+     | Móvil grande               |
| `md:`           | 768px+     | Tablet portrait+           |
| `lg:`           | 1024px+    | Tablet landscape / Desktop |

**Para esta story**:

- Mobile behavior (sheet sidebar, tabs hybrid, bottom toolbar): clases sin prefix (base) y `max-md:`
- Tablet portrait (768-1023px): mismo que mobile → las clases base ya cubren esto
- Tablet landscape + Desktop (≥ 1024px): `lg:` prefix
- Patrón a seguir: `className="[mobile-classes] md:hidden lg:flex"` etc.

### Decisión arquitectónica: `useIsMobile` vs CSS-only

El `SplitView` vs `Tabs` REQUIERE lógica en JS (no se puede hacer con CSS puro porque son componentes completamente distintos). Por eso se usa `useIsMobile` hook con `window.matchMedia`. El hook tiene `useEffect` para evitar hidration mismatch: empieza en `false` (SSR-safe) y se actualiza en el cliente.

Breakpoint `1024px` para el hook: móvil + tablet portrait (ambos usan tabs) vs tablet landscape + desktop (split view).

### Estado del sidebar en móvil

Usar **store Zustand** (no local state) para `mobileSidebarOpen` porque:

1. El botón hamburguesa está en `DashboardLayout`
2. La acción de cerrar puede venir desde `FolderSidebar` (al seleccionar un item)
3. Zustand evita prop drilling

Agregar al `FolderStore` en `folder.state.ts`:

```typescript
mobileSidebarOpen: boolean;
openMobileSidebar: () => void;
closeMobileSidebar: () => void;
```

### Toolbar móvil — posicionamiento

El toolbar fijo en bottom (`fixed bottom-0`) solo aplica en móvil. En desktop/tablet landscape el toolbar sigue siendo `relative` dentro del flujo normal.

El container del editor necesita `padding-bottom` en móvil para que el último contenido no quede tapado por el toolbar fijo:

- En `DocumentEditor.tsx`: el div de contenido que contiene `CodeMirrorEditor` / `MarkdownPreview` / `SplitView` necesita `pb-11 md:pb-0`.

Safe area inset para iPhone (notch/home bar):

```css
padding-bottom: calc(44px + env(safe-area-inset-bottom));
```

En Tailwind: no hay utility nativa. Usar `style={{ paddingBottom: 'calc(2.75rem + env(safe-area-inset-bottom))' }}` o agregar clase custom.

### Swipe left — alcance MVP

Para el MVP de esta story, implementar swipe left solo en la **lista de documentos** de `dashboard/page.tsx`. NO implementar en carpetas (ya tienen long press para el menú). Las acciones del swipe:

- "Eliminar": usa `deleteDocument` (ya existe en `useDocumentViewModel`)
- "Mover": **si la función de mover entre carpetas no está disponible en el viewmodel, omitir este botón en el swipe**. No implementar mover carpetas si no existe. Solo mostrar "Eliminar".

### ActivityPanel — ya responsive (no tocar)

El `ActivityPanel` existente YA tiene el comportamiento de sheet-desde-abajo en móvil implementado con CSS Tailwind:

```
max-sm:w-full max-sm:top-auto max-sm:max-h-[70vh] max-sm:rounded-t-xl
${isOpen ? 'translate-x-0 max-sm:translate-y-0' : 'translate-x-full max-sm:translate-x-0 max-sm:translate-y-full'}
```

El AC #6 ("panel de actividad como sheet full-width desde abajo, max-height 70vh") YA ESTÁ IMPLEMENTADO. Verificar que funciona correctamente en móvil pero NO refactorizar.

### Anti-patrones a evitar

- **NO usar `resize` de ResizablePanelGroup en móvil** — en pantallas < 1024px el split view se reemplaza completamente por Tabs. No intentar hacer el ResizablePanelGroup responsive.
- **NO duplicar el FolderSidebar** — reutilizar el mismo componente tanto en la versión desktop como en el Sheet de móvil. Solo cambiar el container (aside fijo vs Sheet overlay).
- **NO instalar `@radix-ui/react-sheet`** — no existe. Sheet en shadcn/ui usa `@radix-ui/react-dialog`.
- **NO usar `window.innerWidth` directamente** — usar el hook `useIsMobile` con `window.matchMedia` que reactiva correctamente en resize.
- **NO loading state local** — si alguna acción del swipe o long press necesita loading, usar el store Zustand.
- **NO strings hardcodeados** — si se agregan nuevos enums (ej: para acciones de swipe), crearlos en archivos de enums del módulo correspondiente.
- **NO usar `px-safe` de Tailwind** — no está configurado en este proyecto. Usar `env(safe-area-inset-*)` directamente con `style={}`.

### Estructura de archivos (nuevos)

```
apps/web/src/
├── common/
│   ├── components/ui/
│   │   ├── sheet.tsx          (NEW — shadcn/ui Sheet)
│   │   └── tabs.tsx           (NEW — shadcn/ui Tabs)
│   └── hooks/
│       ├── use-is-mobile.ts   (NEW)
│       ├── use-long-press.ts  (NEW)
│       └── use-swipe-left.ts  (NEW)
```

### Archivos modificados

```
apps/web/src/
├── app/
│   ├── layout.tsx                                      (skip link)
│   └── dashboard/
│       ├── layout.tsx                                  (hamburguesa, Sheet sidebar móvil)
│       └── page.tsx                                    (swipe left en documentos)
├── modules/
│   ├── folders/
│   │   ├── infrastructure/
│   │   │   ├── state/folder.state.ts                  (mobileSidebarOpen)
│   │   │   ├── hooks/use-folder.viewmodel.ts          (exponer mobile sidebar actions)
│   │   │   └── components/
│   │   │       ├── FolderSidebar.tsx                  (prop onDocumentSelect)
│   │   │       └── FolderTreeItem.tsx                 (long press)
│   └── documents/
│       └── infrastructure/
│           └── components/
│               ├── DocumentEditor.tsx                  (useIsMobile, tabs en híbrido, pb-11)
│               └── toolbar/MarkdownToolbar.tsx         (fixed bottom móvil, 44px buttons)
```

### Lecciones de stories anteriores relevantes

- **8.1 / 8.2**: NO crear módulos NestJS separados — esta story es 100% frontend, no hay backend.
- **Route conflicts**: No aplica aquí (no hay endpoints nuevos).
- **Loading state en store**: Toda acción async (importar, eliminar) ya usa loading del store — el swipe debe seguir este patrón.
- **cmdk ya instalado** (story 8.1 — `CommandPalette`). Sheet y Tabs son nuevos.

### References

- [Source: epic-08-busqueda-responsive.md#Story 8.3] — ACs originales
- [Source: ux-design-specification.md] — Tabla de adaptación por dispositivo, principios responsive
- [Source: architecture.md] — `FR37-FR39 (Responsive): Tailwind breakpoints + shadcn/ui`, `Sheet for mobile sidebar`
- [Source: 8-2-import-y-export-de-documentos-markdown.md] — Lecciones previas
- [Source: apps/web/src/modules/history/infrastructure/components/ActivityPanel.tsx] — ActivityPanel ya responsive (NO modificar lógica)
- [Source: apps/web/src/app/dashboard/layout.tsx] — DashboardLayout actual
- [Source: apps/web/src/modules/folders/infrastructure/components/FolderSidebar.tsx] — FolderSidebar actual
- [Source: apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx] — DocumentEditor actual
- [Source: apps/web/src/modules/documents/infrastructure/components/SplitView.tsx] — SplitView actual
- [Source: apps/web/src/modules/documents/infrastructure/components/toolbar/MarkdownToolbar.tsx] — MarkdownToolbar actual
- [Source: CLAUDE.md] — Arquitectura, convenciones, reglas de código

## Dev Agent Record

### Agent Model Used

_pending_

### Completion Notes List

_pending_

### File List

_pending_

### Change Log

- 2026-03-31: Story 8.3 creada — experiencia responsive completa
