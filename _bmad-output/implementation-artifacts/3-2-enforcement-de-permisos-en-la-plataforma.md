# Story 3.2: Enforcement de Permisos en la Plataforma

Status: ready-for-dev

## Story

As a **usuario del equipo**,
I want **ver solo las carpetas y documentos a los que tengo acceso según mi grupo**,
so that **la información sensible esté protegida y no vea contenido que no me corresponde**.

## Acceptance Criteria

1. **Given** soy miembro de un grupo con permisos sobre ciertas carpetas
   **When** veo el sidebar
   **Then** solo aparecen las carpetas a las que mi grupo tiene acceso (Ver o Editar)
   **And** las carpetas sin ningún permiso no son visibles

2. **Given** mi grupo tiene permiso "Ver" sobre una carpeta
   **When** abro un documento en esa carpeta
   **Then** veo el contenido en modo solo lectura (textarea disabled)
   **And** no tengo acceso a opciones de edición, renombrar ni eliminar

3. **Given** mi grupo no tiene ningún permiso sobre una carpeta
   **When** intento acceder directamente por URL a un documento en esa carpeta
   **Then** el backend retorna error 403

4. **Given** soy administrador
   **When** accedo a cualquier carpeta
   **Then** tengo acceso completo (ver + editar) a todo el contenido

5. **Given** un usuario pertenece a múltiples grupos con diferentes permisos sobre la misma carpeta
   **When** el sistema evalúa sus permisos
   **Then** se aplica el permiso más alto (Ver + Editar = Editar)

## Tasks / Subtasks

### Backend

- [ ] Task 1: CheckPermissionUseCase (AC: #1, #3, #4, #5)
  - [ ] `modules/permissions/application/use-cases/check-permission.use-case.ts`
  - [ ] `run(userId, folderId)`: retorna PermissionLevel | null
  - [ ] Si usuario es admin → retorna EDIT (full access)
  - [ ] Buscar grupos del usuario (via user_groups)
  - [ ] Buscar permisos de esos grupos sobre la carpeta
  - [ ] Retornar el nivel más alto (EDIT > VIEW > null)

- [ ] Task 2: GetUserPermissionsUseCase (AC: #1)
  - [ ] `run(userId)`: retorna Map<folderId, PermissionLevel>
  - [ ] Si admin → retorna EDIT para todas las carpetas
  - [ ] Para cada grupo del usuario → buscar folder_permissions → merge con highest

- [ ] Task 3: Endpoint GET /api/permissions/me (AC: #1)
  - [ ] Retorna los permisos efectivos del usuario autenticado
  - [ ] Frontend usa esto para filtrar el sidebar

- [ ] Task 4: Aplicar permisos en endpoints de documentos (AC: #2, #3)
  - [ ] GET /api/documents/:id → verificar permiso VIEW sobre el folder del doc
  - [ ] PUT /api/documents/:id → verificar permiso EDIT
  - [ ] DELETE /api/documents/:id → verificar permiso EDIT
  - [ ] POST /api/documents → verificar permiso EDIT sobre folder_id
  - [ ] PATCH /api/documents/:id/move → verificar EDIT en folder origen y destino

- [ ] Task 5: Aplicar permisos en endpoints de carpetas (AC: #1, #3)
  - [ ] GET /api/folders/tree → filtrar por carpetas accesibles
  - [ ] POST /api/folders → verificar EDIT sobre parent (si tiene parent)
  - [ ] PUT /api/folders/:id → verificar EDIT
  - [ ] DELETE /api/folders/:id → verificar EDIT

- [ ] Task 6: Registrar nuevos use cases en modules

### Frontend

- [ ] Task 7: Cargar permisos del usuario y filtrar sidebar (AC: #1)
  - [ ] Llamar GET /api/permissions/me al cargar dashboard
  - [ ] Filtrar el tree de carpetas según permisos
  - [ ] Guardar permisos en store (o en folder store)

- [ ] Task 8: Modo solo lectura en DocumentEditor (AC: #2)
  - [ ] Si permiso es VIEW → textarea disabled, ocultar rename/delete
  - [ ] Si permiso es EDIT → comportamiento actual
  - [ ] Admin → siempre EDIT

- [ ] Task 9: Ocultar acciones según permiso (AC: #2)
  - [ ] Context menu en sidebar: ocultar Renombrar/Eliminar si VIEW
  - [ ] Ocultar "Nuevo documento" si VIEW
  - [ ] Ocultar "Crear carpeta" si no tiene EDIT en parent

### Testing

- [ ] Task 10: Unit tests (AC: #1-5)
  - [ ] `check-permission.use-case.spec.ts` — admin full access, user view, user edit, user no access, multiple groups highest wins

- [ ] Task 11: E2E tests (AC: #1-5)
  - [ ] API: 403 en documento sin permiso, 200 con permiso
  - [ ] API: admin bypasses permisos
  - [ ] UI: sidebar filtrado por permisos

## Dev Notes

### Qué YA existe

- `PermissionRepositoryInterface` — con `findByFolderId()`, `findAll()`
- `GroupRepositoryInterface` — con `isUserInGroup()`, `findMembers()`
- `UserGroupEntity` — tabla user_groups para saber en qué grupos está un usuario
- `FolderPermissionEntity` — permisos asignados
- `@Auth()` y `@AuthUser()` — decorators para extraer usuario

### Strategy: Use case de permisos, no guard

En vez de un Guard de NestJS (que es difícil de parametrizar por folder), usar un **use case de permisos** que los controllers llaman antes de ejecutar la acción:

```typescript
// En el controller de documentos:
const permission = await this.checkPermission.run(authUser.id, document.folderId);
if (!permission || permission === PermissionLevel.VIEW) {
  throw new ForbiddenException({ code_error: 'PRM001', message: 'Insufficient permissions.' });
}
```

Esto es más explícito que un guard y permite diferentes niveles de acceso por endpoint (VIEW para GET, EDIT para PUT/DELETE).

### Resolución de permisos (AC #5)

```typescript
// Si usuario está en grupo A (view) y grupo B (edit) para misma carpeta:
// EDIT > VIEW → resultado = EDIT
function resolveHighest(levels: PermissionLevel[]): PermissionLevel | null {
  if (levels.includes(PermissionLevel.EDIT)) return PermissionLevel.EDIT;
  if (levels.includes(PermissionLevel.VIEW)) return PermissionLevel.VIEW;
  return null;
}
```

### Admin bypass (AC #4)

Admin siempre tiene EDIT en todas las carpetas. Se verifica con `authUser.isAdmin` al inicio del check.

### Wire Format

```
GET /api/permissions/me
Auth: Bearer {access_token}
Response: { "data": { "folder-uuid-1": "edit", "folder-uuid-2": "view" } }
(Map de folderId → permissionLevel para el usuario autenticado)
```

### Archivos a crear

- `apps/api/src/modules/permissions/application/use-cases/check-permission.use-case.ts`
- `apps/api/src/modules/permissions/application/use-cases/get-user-permissions.use-case.ts`
- `apps/api/src/modules/permissions/infrastructure/api/get-my-permissions.controller.ts`

### Archivos a modificar

- Todos los controllers de documents (agregar permission check)
- `get-folder-tree.controller.ts` o su use case (filtrar por permisos)
- `create-folder.controller.ts` (verificar EDIT en parent)
- `update-folder.controller.ts`, `delete-folder.controller.ts` (verificar EDIT)
- Frontend: dashboard page, folder sidebar, document editor

### Necesita acceso a user_groups

El CheckPermissionUseCase necesita saber en qué grupos está un usuario. La `GroupRepositoryInterface` ya tiene esto. Hay que importar GroupsModule en PermissionsModule (o crear un query directo a user_groups).

### References

- [Source: _bmad-output/planning-artifacts/epic-03-permisos.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication Pattern] — validar permisos en controller
- [Source: _bmad-output/implementation-artifacts/3-1-asignacion-de-permisos-por-carpeta.md] — permission module existente

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
