# Epic 8: Búsqueda, Import/Export y Experiencia Responsive

Los usuarios pueden buscar contenido, importar/exportar archivos .md, y acceder desde cualquier dispositivo con experiencia adaptada.

**FRs cubiertos:** FR18, FR19, FR20, FR37, FR38, FR39
**NFRs relevantes:** NFR25 (navegación teclado), NFR26 (contraste), NFR27 (breakpoints responsive)
**UX-DRs relevantes:** UX-DR19, UX-DR20, UX-DR21, UX-DR23

---

### Story 8.1: Búsqueda Global de Contenido

As a **usuario**,
I want **buscar documentos por título o contenido usando Cmd/Ctrl+K**,
So that **pueda encontrar cualquier documento rápidamente sin navegar por carpetas**.

**Acceptance Criteria:**

**Given** estoy en cualquier pantalla de la plataforma
**When** presiono Cmd/Ctrl+K
**Then** se abre la Command Palette centrada con un input de búsqueda enfocado

**Given** escribo un término de búsqueda en la palette
**When** los resultados aparecen
**Then** veo documentos que coinciden en título o contenido
**And** cada resultado muestra: título del documento, carpeta padre, y preview del match con el término resaltado

**Given** los resultados de búsqueda están visibles
**When** navego con flechas arriba/abajo y presiono Enter
**Then** el documento seleccionado se abre

**Given** busco contenido
**When** los resultados se filtran
**Then** solo aparecen documentos a los que tengo permiso de visualización

**Given** busco un término que no existe
**When** veo los resultados
**Then** aparece "No se encontraron documentos para '[término]'" con opción "Limpiar búsqueda"

**Given** hago clic en la barra de búsqueda del sidebar
**When** se activa
**Then** se abre la misma Command Palette que con Cmd/Ctrl+K

*Nota técnica: Full-text search en PostgreSQL usando tsvector/tsquery sobre content_markdown de la tabla documents. Componente CommandPalette usando Command de shadcn/ui (UX-DR19). Endpoint REST de búsqueda con filtrado por permisos.*

---

### Story 8.2: Import y Export de Documentos Markdown

As a **usuario con permiso de edición**,
I want **importar archivos .md desde mi dispositivo y exportar documentos como .md**,
So that **pueda migrar documentación existente a la plataforma y sacar copias cuando lo necesite**.

**Acceptance Criteria:**

**Given** estoy en una carpeta con permiso de edición
**When** hago clic en "Importar .md"
**Then** se abre el selector de archivos de mi dispositivo filtrado a `.md`
**And** puedo seleccionar uno o múltiples archivos

**Given** selecciono archivos .md para importar
**When** confirmo la importación
**Then** cada archivo se crea como un documento nuevo en la carpeta actual
**And** el título se toma del nombre del archivo (sin extensión)
**And** el contenido se preserva exactamente como estaba en el archivo

**Given** estoy viendo un documento
**When** selecciono "Exportar como .md" desde el menú de opciones
**Then** se descarga un archivo .md con el contenido actual del documento
**And** el nombre del archivo es el título del documento

**Given** importo un archivo con un nombre que ya existe en la carpeta
**When** se procesa la importación
**Then** el documento se crea con un sufijo numérico (ej: "documento (1)")

---

### Story 8.3: Experiencia Responsive Completa

As a **usuario**,
I want **acceder y usar la plataforma desde tablet y móvil con una experiencia adaptada**,
So that **pueda consultar y editar documentos desde cualquier dispositivo sin limitaciones funcionales**.

**Acceptance Criteria:**

**Given** accedo desde un dispositivo móvil (< 768px)
**When** veo la interfaz
**Then** el sidebar es un sheet overlay que se abre con el ícono hamburguesa (☰) en el header
**And** se cierra al seleccionar un documento o hacer swipe

**Given** estoy en modo híbrido en móvil
**When** veo la interfaz
**Then** el split view se reemplaza por tabs switcheables: [Editor] [Preview]
**And** no hay split horizontal (pantalla demasiado pequeña)

**Given** estoy editando en móvil
**When** veo el toolbar
**Then** aparece como barra compacta en la parte inferior de la pantalla con scroll horizontal
**And** cada botón tiene un target touch mínimo de 44x44px

**Given** accedo desde una tablet en landscape (≥ 1024px)
**When** veo la interfaz
**Then** el layout es similar a desktop con sidebar colapsado por defecto y split view disponible

**Given** accedo desde una tablet en portrait (768-1023px)
**When** veo la interfaz
**Then** el modo híbrido usa tabs en lugar de split
**And** el sidebar es un sheet overlay

**Given** quiero ver el panel de actividad en móvil
**When** hago clic en el ícono 📋
**Then** se abre como sheet full-width desde abajo con max-height 70vh

**Given** estoy en el sidebar en móvil
**When** hago long press sobre un documento o carpeta
**Then** se abre el menú contextual (equivalente al clic derecho en desktop)

**Given** estoy en la lista de documentos del sidebar en móvil
**When** hago swipe left sobre un documento
**Then** se revelan acciones rápidas (Eliminar, Mover)

**Given** estoy usando la plataforma en cualquier dispositivo
**When** verifico la accesibilidad
**Then** todos los elementos interactivos tienen focus rings visibles, HTML semántico, ARIA labels, y skip links funcionales (UX-DR21)

*Nota técnica: Mobile-first CSS con Tailwind breakpoints (base → md: → lg:). Sheet de shadcn/ui para sidebar y panel actividad en móvil. Tabs de shadcn/ui para modo híbrido en móvil/tablet portrait. Touch interactions (UX-DR23). Accesibilidad WCAG 2.1 AA (UX-DR21) como cross-cutting en todos los componentes. Container queries donde sea posible.*
