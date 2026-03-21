# Epic 2: Gestión de Documentos y Carpetas

Los usuarios pueden crear, organizar y navegar documentos y carpetas en estructura jerárquica.

**FRs cubiertos:** FR1, FR16, FR17
**UX-DRs relevantes:** UX-DR13 (empty states), UX-DR18 (sidebar navigation)

---

### Story 2.1: Estructura de Carpetas y Sidebar de Navegación

As a **usuario autenticado**,
I want **crear carpetas y navegar por ellas en un sidebar jerárquico**,
So that **pueda organizar los documentos del equipo en una estructura clara**.

**Acceptance Criteria:**

**Given** estoy en el dashboard
**When** hago clic en "Crear carpeta" e ingreso un nombre
**Then** la carpeta aparece en el sidebar izquierdo (260px, colapsable)
**And** puedo crear carpetas anidadas dentro de otras carpetas

**Given** existen carpetas con documentos
**When** hago clic en una carpeta en el sidebar
**Then** la carpeta se expande mostrando sus subcarpetas y documentos
**And** la carpeta activa se resalta con background primary/10%

**Given** estoy navegando por la jerarquía de carpetas
**When** abro un documento
**Then** los breadcrumbs en el header muestran la ruta completa (Carpeta > Subcarpeta > Documento)
**And** puedo hacer clic en cualquier breadcrumb para navegar hacia arriba

**Given** una carpeta existe
**When** hago clic derecho sobre ella en el sidebar
**Then** veo un menú contextual con opciones: Renombrar, Eliminar

**Given** intento eliminar una carpeta
**When** confirmo en el dialog de confirmación
**Then** la carpeta y todos sus documentos se eliminan
**And** el sidebar se actualiza inmediatamente

**Given** una carpeta está vacía
**When** la selecciono
**Then** veo un empty state "Esta carpeta está vacía" con CTAs "Nuevo documento" e "Importar .md"

**Given** estoy en el dashboard
**When** hago clic en el botón de colapsar sidebar
**Then** el sidebar se oculta completamente y el contenido ocupa todo el ancho

*Nota técnica: Incluye entidad folders con parent_id en TypeORM y migración, CRUD endpoints REST, componentes FolderTree y FolderSidebar con Collapsible de shadcn/ui (UX-DR18), Breadcrumb component, menú contextual con DropdownMenu.*

---

### Story 2.2: Creación y Edición Básica de Documentos

As a **usuario autenticado**,
I want **crear documentos markdown dentro de una carpeta y editarlos**,
So that **pueda empezar a generar contenido para mi equipo**.

**Acceptance Criteria:**

**Given** estoy en una carpeta
**When** hago clic en "Nuevo documento" e ingreso un título
**Then** el documento se crea en la carpeta actual
**And** se abre automáticamente con un editor de texto listo para escribir
**And** el documento aparece en el sidebar bajo la carpeta correspondiente

**Given** estoy editando un documento
**When** escribo contenido markdown
**Then** el contenido se guarda automáticamente (sin botón "Guardar")
**And** el badge en el header muestra "Guardando..." → "✓ Guardado"

**Given** estoy en el sidebar
**When** hago clic en un documento
**Then** se abre en el área de contenido

**Given** un documento existe
**When** hago clic derecho sobre él en el sidebar
**Then** veo opciones: Renombrar, Eliminar

**Given** intento eliminar un documento
**When** confirmo en el dialog
**Then** el documento se elimina y el sidebar se actualiza

*Nota técnica: Incluye entidad documents (id, folder_id, title, slug, content_markdown, created_by, created_at, updated_at) en TypeORM con migración, CRUD endpoints REST, página de documento con editor de texto básico (textarea — será reemplazado por CodeMirror en Epic 4), guardado automático con debounce, badge de estado de guardado.*

---

### Story 2.3: Mover Documentos entre Carpetas

As a **usuario autenticado**,
I want **mover documentos de una carpeta a otra**,
So that **pueda reorganizar el contenido cuando la estructura evolucione**.

**Acceptance Criteria:**

**Given** tengo un documento en una carpeta
**When** selecciono "Mover" desde el menú contextual del documento
**Then** veo un selector de carpeta destino con la jerarquía completa

**Given** selecciono una carpeta destino válida
**When** confirmo el movimiento
**Then** el documento aparece en la nueva carpeta en el sidebar
**And** desaparece de la carpeta original
**And** los breadcrumbs se actualizan si estoy viendo ese documento

**Given** intento mover un documento a la misma carpeta donde ya está
**When** selecciono la carpeta actual como destino
**Then** la opción aparece deshabilitada o recibo un mensaje informativo
