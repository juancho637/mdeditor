# Epic 6: Historial de Cambios y Restauración

Los usuarios pueden ver el historial completo de cambios, consultar quién modificó qué, y restaurar versiones anteriores.

**FRs cubiertos:** FR13, FR14, FR15
**NFRs relevantes:** NFR15 (cero pérdida datos), NFR16 (historial inmutable)
**UX-DRs relevantes:** UX-DR11 (ActivityPanel), UX-DR22 (collaborative first)

---

### Story 6.1: Registro y Persistencia del Historial

As a **sistema**,
I want **registrar cada cambio con autor, timestamp y contenido para mantener un historial inmutable**,
So that **el equipo tenga trazabilidad completa de todos los cambios en cada documento**.

**Acceptance Criteria:**

**Given** un usuario está editando un documento via WebSocket
**When** pasan 60 segundos de actividad continua
**Then** el sistema crea un snapshot automático en document_snapshots con:
- yjs_snapshot (BYTEA) del estado del Y.Doc
- content_markdown (TEXT) con el texto en ese momento
- author_id del último editor
- created_at timestamp

**Given** un snapshot se ha creado
**When** intento eliminar o modificar el registro
**Then** la operación es rechazada — el historial es append-only e inmutable (NFR16)

**Given** un documento tiene múltiples snapshots y updates
**When** el servidor carga el documento en memoria
**Then** carga el último snapshot y aplica los updates posteriores para reconstruir el Y.Doc

**Given** el sistema genera snapshots periódicamente
**When** se acumulan muchos updates entre snapshots
**Then** los updates intermedios se preservan para replay granular

*Nota técnica: Lógica de snapshot periódico en DocumentSyncService (cada 60s de actividad). Los document_updates ya se persisten en Story 5.1. Esta historia agrega la lógica de snapshots periódicos y el endpoint REST para consultar historial. Historial inmutable garantizado por diseño (no hay endpoints de DELETE/UPDATE en snapshots).*

---

### Story 6.2: Visualización del Historial y Panel de Actividad

As a **usuario (como Diego)**,
I want **ver quién cambió qué y cuándo en un panel de actividad con timeline de cambios**,
So that **pueda verificar que el documento refleja el estado actual y entender su evolución**.

**Acceptance Criteria:**

**Given** estoy viendo un documento
**When** hago clic en el ícono de actividad (📋) en el header
**Then** se abre el panel de actividad a la derecha (280px) con animación slide-in (200ms)

**Given** el panel de actividad está abierto
**When** veo la sección "Actividad en vivo"
**Then** muestra los usuarios actualmente editando con su nombre y sección
**And** las ediciones vía MCP muestran "🤖 Claude (vía MCP)"

**Given** el panel de actividad está abierto
**When** veo la sección "Historial"
**Then** veo una timeline de cambios con: autor, fecha/hora (relativa para reciente, absoluta para antiguo), y resumen del cambio

**Given** hago clic en una entrada del historial
**When** se abre la vista de diff
**Then** veo los cambios resaltados: verde para contenido agregado, rojo para eliminado

**Given** el panel de actividad está abierto
**When** hago clic en el botón toggle de nuevo
**Then** el panel se cierra con animación slide-out
**And** el estado del toggle se recuerda por usuario

*Nota técnica: Componente ActivityPanel (UX-DR11) con dos secciones: actividad en vivo (desde Yjs Awareness) + historial (desde endpoint REST de snapshots). Componente VersionTimeline. Vista diff usando library de diff de texto. Responsive: desktop=inline, tablet=sheet overlay, móvil=sheet desde abajo.*

---

### Story 6.3: Restauración de Versiones Anteriores

As a **usuario con permiso de edición**,
I want **restaurar un documento a una versión anterior del historial**,
So that **pueda revertir cambios no deseados con confianza**.

**Acceptance Criteria:**

**Given** estoy viendo el diff de una versión anterior en el panel de actividad
**When** hago clic en "Restaurar esta versión"
**Then** aparece un dialog de confirmación: "¿Restaurar documento a la versión de [fecha]? Se creará una nueva entrada en el historial."

**Given** confirmo la restauración
**When** el sistema procesa la operación
**Then** el contenido del documento se reemplaza por el de la versión seleccionada
**And** se crea una nueva entrada en el historial: "Restaurado a versión de [fecha] por [usuario]"
**And** todos los usuarios conectados ven el cambio en tiempo real

**Given** restauro una versión
**When** miro el historial después
**Then** la restauración no elimina el historial previo — es una nueva entrada que apunta a la versión restaurada

**Given** no tengo permiso de edición sobre la carpeta del documento
**When** intento restaurar una versión
**Then** el botón "Restaurar" no está disponible
