# Epic 3: Control de Acceso y Permisos

El administrador puede asignar permisos por carpeta a cada grupo, controlando quién puede ver y editar.

**FRs cubiertos:** FR25, FR26, FR27, FR28
**UX-DRs relevantes:** UX-DR13 (empty state sin permisos)

---

### Story 3.1: Asignación de Permisos por Carpeta

As a **administrador**,
I want **asignar permisos de visualización o edición por carpeta a cada grupo**,
So that **pueda controlar qué contenido puede ver y modificar cada equipo**.

**Acceptance Criteria:**

**Given** soy administrador y navego a Configuración → Permisos
**When** veo la matriz de permisos
**Then** se muestra una tabla con carpetas en filas y grupos en columnas
**And** cada celda permite seleccionar: Sin acceso / Ver / Editar

**Given** cambio el permiso de un grupo sobre una carpeta de "Sin acceso" a "Editar"
**When** selecciono la opción
**Then** el cambio se aplica inmediatamente
**And** los miembros de ese grupo pueden ver y editar documentos en esa carpeta

**Given** un grupo tiene permiso "Ver" sobre una carpeta
**When** un miembro de ese grupo abre un documento en esa carpeta
**Then** puede ver el contenido pero no editarlo (modo solo lectura)

**Given** asigno permiso "Editar" a una carpeta
**When** verifico los permisos efectivos
**Then** el permiso "Editar" implica también "Ver" — no es necesario asignar ambos

*Nota técnica: Incluye entidad folder_permissions (folder_id, group_id, permission_level ENUM 'view'|'edit') en TypeORM con migración, endpoints REST para CRUD de permisos, componente PermissionMatrix con Table de shadcn/ui.*

---

### Story 3.2: Enforcement de Permisos en la Plataforma

As a **usuario del equipo**,
I want **ver solo las carpetas y documentos a los que tengo acceso según mi grupo**,
So that **la información sensible esté protegida y no vea contenido que no me corresponde**.

**Acceptance Criteria:**

**Given** soy miembro del grupo "Marketing" con permiso "Ver" en carpeta "Marketing" y "Editar" en "General"
**When** veo el sidebar
**Then** solo aparecen las carpetas a las que mi grupo tiene acceso (Ver o Editar)
**And** las carpetas sin ningún permiso no son visibles

**Given** mi grupo tiene permiso "Ver" sobre una carpeta
**When** abro un documento en esa carpeta
**Then** veo el contenido en modo solo lectura
**And** no tengo acceso a opciones de edición, renombrar ni eliminar

**Given** mi grupo no tiene ningún permiso sobre una carpeta
**When** intento acceder directamente por URL a un documento en esa carpeta
**Then** veo un empty state "No tienes acceso a este contenido"
**And** el backend retorna error 403

**Given** soy administrador
**When** accedo a cualquier carpeta
**Then** tengo acceso completo (ver + editar) a todo el contenido independientemente de los permisos de grupo

**Given** un usuario pertenece a múltiples grupos con diferentes permisos sobre la misma carpeta
**When** el sistema evalúa sus permisos
**Then** se aplica el permiso más alto (si un grupo da "Ver" y otro "Editar", el usuario tiene "Editar")

*Nota técnica: Incluye middleware/guard de permisos reutilizable en backend (CheckPermissionGuard) que se aplica en REST controllers y será reutilizado en WebSocket gateway y MCP. Componente PermissionGate en frontend para ocultar/deshabilitar elementos según permisos. Filtrado de carpetas en sidebar basado en permisos del usuario autenticado.*
