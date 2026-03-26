# Story 3.1: Asignación de Permisos por Carpeta

Status: done

## Story

As a **administrador**,
I want **asignar permisos de visualización o edición por carpeta a cada grupo**,
so that **pueda controlar qué contenido puede ver y modificar cada equipo**.

## Acceptance Criteria

1. **Given** soy administrador y navego a Configuración → Permisos
   **When** veo la matriz de permisos
   **Then** se muestra una tabla con carpetas en filas y grupos en columnas
   **And** cada celda permite seleccionar: Sin acceso / Ver / Editar

2. **Given** cambio el permiso de un grupo sobre una carpeta de "Sin acceso" a "Editar"
   **When** selecciono la opción
   **Then** el cambio se aplica inmediatamente

3. **Given** un grupo tiene permiso "Ver" sobre una carpeta
   **When** un miembro de ese grupo abre un documento en esa carpeta
   **Then** puede ver el contenido pero no editarlo (modo solo lectura)

4. **Given** asigno permiso "Editar" a una carpeta
   **When** verifico los permisos efectivos
   **Then** el permiso "Editar" implica también "Ver" — no es necesario asignar ambos

## Tasks / Subtasks

### Backend — Infraestructura

- [ ] Task 1: Migración `CreateFolderPermissionsTable` (AC: #1)
  - [ ] Tabla `folder_permissions`: id (UUID), folder_id (UUID FK → folders ON DELETE CASCADE), group_id (UUID FK → groups ON DELETE CASCADE), permission_level (VARCHAR: 'view'|'edit'), created_at, updated_at
  - [ ] Índice compuesto en (folder_id, group_id) UNIQUE — un permiso por grupo por carpeta
  - [ ] Índices en folder_id y group_id individuales

- [ ] Task 2: Entity + domain types (AC: #1, #2)
  - [ ] `domain/types/folder-permission.type.ts` — FolderPermissionType
  - [ ] `domain/enums/permission-level.enum.ts` — PermissionLevel (VIEW, EDIT)
  - [ ] `domain/enums/permission-providers.enum.ts`
  - [ ] `domain/enums/permission-errors.codes.ts` — PRM001-PRM003
  - [ ] `domain/interfaces/permission-repository.interface.ts`
  - [ ] `infrastructure/persistence/folder-permission.entity.ts`
  - [ ] `infrastructure/persistence/permission-orm.repository.ts`

### Backend — Use Cases

- [ ] Task 3: SetPermissionUseCase (AC: #2, #4)
  - [ ] Verificar folder y group existen
  - [ ] Si permiso existe → actualizar permission_level
  - [ ] Si no existe → crear
  - [ ] Si permission_level === null/none → eliminar el registro (sin acceso)
  - [ ] Upsert pattern: simplifica la lógica de "asignar o cambiar"

- [ ] Task 4: GetPermissionMatrixUseCase (AC: #1)
  - [ ] Retornar todas las carpetas + todos los grupos + todos los permisos
  - [ ] Frontend construye la matriz desde estos datos

- [ ] Task 5: GetFolderPermissionsUseCase
  - [ ] Retornar permisos de una carpeta específica (útil para enforcement en 3-2)

### Backend — Controllers + Module

- [ ] Task 6: Controllers, DTOs y módulo (AC: #1, #2)
  - [ ] `set-permission.dto.ts` — folder_id (IsUUID), group_id (IsUUID), permission_level (IsEnum: 'view'|'edit'|null)
  - [ ] PUT `/api/permissions` — crear/actualizar permiso (@Auth + isAdmin)
  - [ ] GET `/api/permissions` — listar todos los permisos (@Auth + isAdmin)
  - [ ] DELETE `/api/permissions/:id` — eliminar permiso (@Auth + isAdmin)
  - [ ] `permissions.module.ts` con factory DI
  - [ ] Registrar en `app.module.ts`

### Frontend

- [ ] Task 7: Módulo permissions frontend (AC: #1, #2)
  - [ ] `modules/permissions/domain/types/` — FolderPermission, PermissionMatrix
  - [ ] `modules/permissions/domain/repositories/permission-repository.ts`
  - [ ] `modules/permissions/infrastructure/repositories/permission-v1.repository.ts`
  - [ ] `modules/permissions/infrastructure/state/permission.state.ts`
  - [ ] `modules/permissions/infrastructure/hooks/use-permission.viewmodel.ts`

- [ ] Task 8: PermissionMatrix component (AC: #1, #2)
  - [ ] Tabla: filas = carpetas, columnas = grupos
  - [ ] Cada celda: dropdown con "Sin acceso" / "Ver" / "Editar"
  - [ ] Cambio en dropdown → PUT inmediato al backend
  - [ ] Settings page `/dashboard/settings/permissions`
  - [ ] Agregar "Permisos" al settings layout navigation

### Testing

- [ ] Task 9: Unit tests (AC: #2, #4)
  - [ ] `set-permission.use-case.spec.ts` — crea permiso, actualiza permiso, elimina (null), falla si folder/group no existe

- [ ] Task 10: E2E tests (AC: #1, #2)
  - [ ] API: PUT/GET/DELETE permissions
  - [ ] UI: ver matrix, cambiar permiso

## Dev Notes

### Qué YA existe (NO recrear)

- `GroupRepositoryInterface.findAll()` — listar grupos para columnas de la matrix
- `FolderRepositoryInterface.findAll()` — listar carpetas para filas de la matrix
- `@Auth()` + isAdmin check — patrón de controllers admin-only
- Settings layout con nav (Usuarios, Grupos) — agregar Permisos

### Modelo de datos

```sql
CREATE TABLE folder_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  permission_level VARCHAR NOT NULL CHECK (permission_level IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (folder_id, group_id)
);
```

### Error Codes

```
PRM001 — Permission not found
PRM002 — Folder not found (reutilizar FLD001)
PRM003 — Group not found (reutilizar GRP001)
PRM100 — Failed to query permission from database
PRM101 — Failed to store permission in database
```

### Wire Format

```
PUT /api/permissions
Auth: Bearer (admin only)
Request:  { "folder_id": "uuid", "group_id": "uuid", "permission_level": "view"|"edit"|null }
Response: { "data": { "id", "folder_id", "group_id", "permission_level", "created_at" } }
(si permission_level es null, elimina el permiso y retorna { "data": { "deleted": true } })

GET /api/permissions
Auth: Bearer (admin only)
Response: { "data": [ { "id", "folder_id", "group_id", "permission_level" } ] }

DELETE /api/permissions/:id
Auth: Bearer (admin only)
Response: { "data": { "id" } }
```

### Upsert pattern

En vez de POST + PUT separados, usar un solo PUT que:
- Si no existe permiso para (folder_id, group_id) → INSERT
- Si existe → UPDATE permission_level
- Si permission_level es null → DELETE

Esto simplifica tanto el backend como el frontend (un solo endpoint para todo).

### PermissionMatrix frontend

La matrix se construye en el frontend combinando 3 queries:
1. GET /api/folders/tree → carpetas (filas)
2. GET /api/groups → grupos (columnas)
3. GET /api/permissions → permisos existentes (celdas)

Cada celda es un `<select>` con 3 opciones. Al cambiar → PUT /api/permissions.

### References

- [Source: _bmad-output/planning-artifacts/epic-03-permisos.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — folder_permissions table
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Codes] — PRM prefix

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
