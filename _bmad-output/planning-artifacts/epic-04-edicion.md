# Epic 4: Experiencia de Edición de Documentos

Los usuarios pueden editar documentos en 3 modos (editor puro, visualizador, híbrido) con toolbar de asistencia, sync scroll y temas.

**FRs cubiertos:** FR2, FR3, FR4, FR5, FR6, FR7, FR8
**NFRs relevantes:** NFR1 (editor < 100ms), NFR5 (render < 200ms), NFR6 (bundle < 500KB), NFR14 (sanitización), NFR24 (usabilidad), NFR25 (navegación teclado), NFR26 (contraste 4.5:1)
**UX-DRs relevantes:** UX-DR1, UX-DR5, UX-DR6, UX-DR7, UX-DR8

---

### Story 4.1: Editor Markdown con CodeMirror 6

As a **usuario con permisos de edición**,
I want **editar documentos en un editor markdown con syntax highlighting y atajos de teclado**,
So that **pueda escribir markdown de forma eficiente con una experiencia de editor profesional**.

**Acceptance Criteria:**

**Given** abro un documento con permiso de edición
**When** se carga la página del documento
**Then** veo un editor CodeMirror 6 con el contenido del documento
**And** el editor muestra syntax highlighting de markdown (headers, bold, links, código, listas)
**And** la fuente es JetBrains Mono 14px con fondo ligeramente diferenciado

**Given** estoy escribiendo en el editor
**When** presiono Ctrl+B con texto seleccionado
**Then** el texto se envuelve con `**texto**`

**Given** estoy escribiendo en el editor
**When** presiono Ctrl+I con texto seleccionado
**Then** el texto se envuelve con `*texto*`

**Given** estoy escribiendo en el editor
**When** presiono Ctrl+Z
**Then** se deshace la última acción

**Given** estoy editando un documento
**When** el contenido cambia
**Then** se guarda automáticamente con debounce y el badge muestra "✓ Guardado"

**Given** mi grupo tiene permiso "Ver" pero no "Editar" sobre la carpeta
**When** abro el documento
**Then** el editor está en modo read-only (sin cursor, sin posibilidad de editar)

*Nota técnica: Reemplaza el textarea de Story 2.2 por CodeMirror 6. Incluye extensiones: @codemirror/lang-markdown, @codemirror/theme-one-dark, keymaps. Componente MarkdownEditor (UX-DR5). Lazy loading de CodeMirror via Next.js dynamic() para mantener bundle < 500KB (NFR6).*

---

### Story 4.2: Visualizador de Markdown Renderizado

As a **usuario**,
I want **ver documentos renderizados como HTML limpio y formateado**,
So that **pueda leer el contenido de forma cómoda sin ver la sintaxis markdown**.

**Acceptance Criteria:**

**Given** abro un documento
**When** selecciono el modo "Preview"
**Then** veo el markdown renderizado como HTML con estilos del design system
**And** el contenido está centrado con max-width 900px y márgenes amplios

**Given** el documento contiene headers (H1-H6)
**When** veo el preview
**Then** se renderizan con la escala tipográfica definida (H1: 32px bold, H2: 24px semibold, etc.)

**Given** el documento contiene bloques de código con lenguaje especificado
**When** veo el preview
**Then** se muestran con syntax highlighting por lenguaje, fondo diferenciado y fuente monospace

**Given** el documento contiene tablas
**When** veo el preview
**Then** se muestran con bordes sutiles, header con fondo y alternancia de color en filas

**Given** el documento contiene HTML inline o scripts
**When** se renderiza el preview
**Then** el contenido se sanitiza con DOMPurify y no se ejecuta ningún script (NFR14)

**Given** el documento tiene 10,000 líneas
**When** se renderiza el preview
**Then** el renderizado completa en < 200ms (NFR5)

*Nota técnica: Componente MarkdownPreview (UX-DR6) usando react-markdown + remark-gfm + rehype-highlight + DOMPurify para sanitización. Inter 16px, line-height 1.7.*

---

### Story 4.3: Modo Híbrido y Cambio entre Modos

As a **usuario**,
I want **editar en modo híbrido (editor + preview en split) y alternar entre los 3 modos libremente**,
So that **pueda elegir la forma de interacción que mejor se adapte a mi perfil y tarea**.

**Acceptance Criteria:**

**Given** estoy viendo un documento
**When** veo los tabs de modo en el header
**Then** hay 3 opciones: Editor, Híbrido, Preview

**Given** selecciono el modo "Híbrido"
**When** la vista cambia
**Then** veo el editor CodeMirror a la izquierda y el preview renderizado a la derecha
**And** la proporción por defecto es 50/50
**And** hay un resize handle de 4px entre ambos paneles

**Given** estoy en modo híbrido
**When** arrastro el resize handle
**Then** la proporción de los paneles cambia en tiempo real
**And** la proporción mínima es 30/70 o 70/30

**Given** estoy en cualquier modo
**When** cambio a otro modo
**Then** la posición del documento se preserva (no pierdo de vista dónde estaba)
**And** la transición es fluida (< 300ms)

**Given** estoy en modo Preview
**When** hago clic en el tab "Editor"
**Then** veo solo el editor CodeMirror a pantalla completa

**Given** soy un usuario nuevo
**When** abro un documento por primera vez
**Then** se abre en modo Híbrido por defecto
**And** mi preferencia de modo se recuerda para futuras sesiones

*Nota técnica: Componente SplitView (UX-DR8) usando ResizablePanels de shadcn/ui. ModeSelector con Tabs de shadcn/ui. Preferencia de modo persistida en localStorage.*

---

### Story 4.4: Toolbar de Asistencia Markdown

As a **usuario no técnico (como Valentina)**,
I want **insertar sintaxis markdown usando botones visuales del toolbar sin memorizar la sintaxis**,
So that **pueda editar documentos markdown con confianza desde el primer día**.

**Acceptance Criteria:**

**Given** estoy en modo Editor o Híbrido
**When** veo la interfaz
**Then** el toolbar de markdown es visible debajo del header con 13 botones organizados en 4 grupos:
- Texto: H (headers), **B** (negrita), *I* (cursiva), ~~S~~ (tachado)
- Listas: ☰ (bullets), 1. (numerada), ☑ (checklist)
- Insertar: 🔗 (link), 🖼 (imagen), </> (código), ⊞ (tabla)
- Bloque: ❝ (cita), — (línea horizontal)

**Given** selecciono texto en el editor
**When** hago clic en el botón "B" (negrita) del toolbar
**Then** el texto seleccionado se envuelve con `**texto**`
**And** en modo híbrido, el preview muestra inmediatamente el texto en **negrita**

**Given** no tengo texto seleccionado
**When** hago clic en el botón "B"
**Then** se inserta `**texto**` como placeholder con "texto" seleccionado para reemplazar

**Given** hago clic en el botón "H" (headers)
**When** se abre el dropdown
**Then** veo opciones H1 a H6 y al seleccionar una, se inserta el marcador correspondiente (ej: `## `)

**Given** hago clic en el botón 🔗 (link)
**When** se abre el popover
**Then** veo un campo para URL y al confirmar se inserta `[texto seleccionado](url)`

**Given** hago clic en el botón ⊞ (tabla)
**When** se abre el dropdown
**Then** puedo seleccionar el número de filas × columnas y se inserta el template de tabla markdown

**Given** estoy en modo Preview
**When** miro la interfaz
**Then** el toolbar no es visible (no se necesita en modo solo lectura)

*Nota técnica: Componente MarkdownToolbar (UX-DR7). Altura 40px, botones 32x28px con tooltip. Estados: default, hover (background muted), active (background primary/10%), disabled (opacidad 40%). Atajos de teclado duplicados: Ctrl+B, Ctrl+I, Ctrl+K (link), Ctrl+E (código).*

---

### Story 4.5: Sync Scroll y Temas

As a **usuario**,
I want **que el editor y el preview se sincronicen al hacer scroll en modo híbrido, y poder cambiar entre tema claro y oscuro**,
So that **tenga una experiencia de edición fluida y adaptada a mis preferencias visuales**.

**Acceptance Criteria:**

**Given** estoy en modo híbrido
**When** hago scroll en el panel del editor
**Then** el panel de preview se sincroniza a la posición correspondiente

**Given** estoy en modo híbrido
**When** hago scroll en el panel de preview
**Then** el panel del editor se sincroniza a la posición correspondiente

**Given** la sincronización de scroll está activa
**When** edito contenido que cambia la longitud del documento
**Then** la sincronización se mantiene coherente sin saltos bruscos

**Given** estoy usando la plataforma
**When** hago clic en el toggle de tema (sol/luna) en el header
**Then** el tema cambia instantáneamente entre claro y oscuro sin recarga
**And** el editor, preview, sidebar y todos los componentes se adaptan

**Given** cambio el tema a oscuro
**When** cierro y vuelvo a abrir la plataforma
**Then** mi preferencia de tema se mantiene (persistida por usuario)

**Given** accedo a la plataforma por primera vez
**When** mi sistema operativo tiene modo oscuro activado
**Then** la plataforma respeta `prefers-color-scheme` como tema inicial

**Given** tengo el tema oscuro activado
**When** verifico los contrastes de la interfaz
**Then** todos los textos cumplen con el ratio mínimo 4.5:1 (NFR26)

*Nota técnica: Sync scroll basado en porcentaje de posición del documento. Tema claro/oscuro via CSS Variables con los tokens definidos en UX-DR1. Toggle con componente Toggle de shadcn/ui. Preferencia en localStorage + respeto de prefers-color-scheme.*
