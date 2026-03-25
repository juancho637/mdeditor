# Story 1.4: Gestión de Grupos de Usuarios

Status: done

## Story

As a **administrador**,
I want **crear grupos, asignar usuarios a ellos y gestionar las membresías**,
so that **pueda organizar al equipo por roles para luego asignar permisos por carpeta**.

## Acceptance Criteria

1. **Given** soy administrador y navego a Configuración → Grupos
   **When** hago clic en "Crear grupo" e ingreso un nombre (ej: "Marketing")
   **Then** el grupo aparece en la lista con 0 miembros

2. **Given** existe un grupo y usuarios registrados
   **When** selecciono usuarios desde la lista y los asigno al grupo
   **Then** los usuarios aparecen como miembros del grupo
   **And** un usuario puede pertenecer a múltiples grupos

3. **Given** un usuario pertenece a un grupo
   **When** lo remuevo del grupo
   **Then** el usuario desaparece de la lista de miembros del grupo

4. **Given** soy administrador
   **When** edito el nombre de un grupo existente
   **Then** el nuevo nombre se refleja en toda la interfaz

5. **Given** un grupo existe
   **When** intento eliminarlo
   **Then** aparece un dialog de confirmación con botón destructivo ("Eliminar grupo")
   **And** tras confirmar, el grupo se elimina y sus permisos asociados se revocan

6. **Given** intento crear un grupo con un nombre que ya existe
   **When** envío el formulario
   **Then** veo un error "Ya existe un grupo con este nombre"

## Tasks / Subtasks

### Backend — Infraestructura

- [ ] Task 1: Migraciones (AC: #1, #2, #5)
  - [ ] `CreateGroupsTable`: id (UUID), name (VARCHAR UNIQUE), created_at (TIMESTAMP)
  - [ ] `CreateUserGroupsTable`: user_id (UUID FK), group_id (UUID FK), composite PK, ON DELETE CASCADE en ambas FKs

- [ ] Task 2: Entities + domain types (AC: #1, #2)
  - [ ] `domain/types/group.type.ts` — GroupType (id, name, memberCount, createdAt)
  - [ ] `domain/types/group-with-members.type.ts` — GroupWithMembersType (extends GroupType + members: UserType[])
  - [ ] `domain/enums/group-providers.enum.ts` — DI tokens
  - [ ] `domain/enums/group-errors.codes.ts` — GRP001-GRP005
  - [ ] `domain/interfaces/group-repository.interface.ts` — contrato CRUD + members
  - [ ] `infrastructure/persistence/group.entity.ts`
  - [ ] `infrastructure/persistence/user-group.entity.ts`
  - [ ] `infrastructure/persistence/group-orm.repository.ts`
  - [ ] `infrastructure/presenters/group.presenter.ts`

### Backend — Use Cases

- [ ] Task 3: CreateGroupUseCase (AC: #1, #6)
  - [ ] Verificar nombre no duplicado (case-insensitive)
  - [ ] Crear grupo, retornar con memberCount: 0

- [ ] Task 4: ListGroupsUseCase (AC: #1)
  - [ ] Retornar todos los grupos con member_count

- [ ] Task 5: GetGroupByIdUseCase (AC: #2, #3)
  - [ ] Retornar grupo con lista de miembros (id, name, email)

- [ ] Task 6: UpdateGroupUseCase (AC: #4, #6)
  - [ ] Verificar grupo existe, verificar nombre no duplicado, actualizar

- [ ] Task 7: DeleteGroupUseCase (AC: #5)
  - [ ] Verificar grupo existe, eliminar (CASCADE elimina user_groups)

- [ ] Task 8: AddUserToGroupUseCase (AC: #2)
  - [ ] Verificar grupo y usuario existen, verificar no duplicado, agregar

- [ ] Task 9: RemoveUserFromGroupUseCase (AC: #3)
  - [ ] Verificar membership existe, eliminar

### Backend — Controllers + DTOs + Module

- [ ] Task 10: Controllers, DTOs y módulo (AC: #1-6)
  - [ ] `create-group.dto.ts` — name (IsString, IsNotEmpty, MaxLength(100))
  - [ ] `update-group.dto.ts` — name (IsString, IsNotEmpty, MaxLength(100))
  - [ ] `add-user-to-group.dto.ts` — user_id (IsUUID)
  - [ ] POST `/api/groups` — crear grupo (@Auth + isAdmin)
  - [ ] GET `/api/groups` — listar grupos (@Auth + isAdmin)
  - [ ] GET `/api/groups/:id` — detalle con miembros (@Auth + isAdmin)
  - [ ] PUT `/api/groups/:id` — actualizar nombre (@Auth + isAdmin)
  - [ ] DELETE `/api/groups/:id` — eliminar grupo (@Auth + isAdmin)
  - [ ] POST `/api/groups/:id/users` — agregar usuario (@Auth + isAdmin)
  - [ ] DELETE `/api/groups/:id/users/:userId` — remover usuario (@Auth + isAdmin)
  - [ ] `groups.module.ts` con factory DI
  - [ ] Importar en `app.module.ts`

### Frontend

- [ ] Task 11: Módulo groups frontend (AC: #1-6)
  - [ ] `modules/groups/domain/types/` — Group, GroupWithMembers, CreateGroupRequest, etc.
  - [ ] `modules/groups/domain/repositories/group-repository.ts`
  - [ ] `modules/groups/infrastructure/repositories/group-v1.repository.ts`
  - [ ] `modules/groups/infrastructure/state/group.state.ts`
  - [ ] `modules/groups/infrastructure/hooks/use-group.viewmodel.ts`

- [ ] Task 12: Componentes y página de settings (AC: #1-6)
  - [ ] `GroupList.tsx` — lista de grupos con member_count + botones editar/eliminar
  - [ ] `GroupForm.tsx` — crear/editar grupo (input name + validación)
  - [ ] `GroupMembers.tsx` — lista de miembros + agregar/remover usuarios
  - [ ] `ConfirmDeleteDialog.tsx` — dialog de confirmación con botón destructivo
  - [ ] `/dashboard/settings/groups/page.tsx`
  - [ ] Agregar "Grupos" al settings layout navigation

### Testing

- [ ] Task 13: Unit tests (AC: #1-6)
  - [ ] `create-group.use-case.spec.ts` — crea grupo, falla nombre duplicado
  - [ ] `update-group.use-case.spec.ts` — actualiza nombre, falla duplicado
  - [ ] `delete-group.use-case.spec.ts` — elimina grupo, falla si no existe
  - [ ] `add-user-to-group.use-case.spec.ts` — agrega usuario, falla duplicado
  - [ ] `remove-user-from-group.use-case.spec.ts` — remueve usuario, falla si no existe

- [ ] Task 14: E2E tests (AC: #1-6)
  - [ ] API: CRUD groups + membership operations
  - [ ] UI: create group, add user, remove user, edit name, delete with confirmation

## Dev Notes

### Qué YA existe (NO recrear)

- `UserRepository.findById()` — para verificar que el usuario existe al agregar a grupo
- `@Auth()` decorator + `isAdmin` check pattern (de invitations controllers)
- `ExceptionService` + `ForbiddenException` con `AUT004`
- Settings layout con navigation (agregar "Grupos" link)
- Invitations module como referencia de patrón completo

### Error Codes

```
GRP001 — Group not found
GRP002 — A group with this name already exists
GRP003 — User is already a member of this group
GRP004 — User is not a member of this group
GRP005 — User not found
GRP100 — Failed to query group from database
GRP101 — Failed to store group in database
```

### Wire Format

```
POST /api/groups                    → { "data": { "id", "name", "member_count": 0, "created_at" } }
GET  /api/groups                    → { "data": [ { "id", "name", "member_count", "created_at" } ] }
GET  /api/groups/:id                → { "data": { "id", "name", "created_at", "members": [{ "id", "name", "email" }] } }
PUT  /api/groups/:id                → { "data": { "id", "name", "created_at" } }
DELETE /api/groups/:id              → { "data": { "id" } }
POST /api/groups/:id/users          → { "data": { "id", "name", "email" } }
DELETE /api/groups/:id/users/:userId → { "data": { "id" } }
```

### Modelo de datos

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_groups (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);
```

### Repository — un solo repositorio para groups + user_groups

Un solo `GroupRepositoryInterface` maneja ambas tablas. Métodos:
- `create(name)`, `findById(id)`, `findByName(name)`, `findAll()`, `update(id, name)`, `delete(id)`
- `addUser(groupId, userId)`, `removeUser(groupId, userId)`, `findMembers(groupId)`, `isUserInGroup(groupId, userId)`

Esto simplifica el DI (1 repository en vez de 2) y mantiene la cohesión.

### Nombre case-insensitive

Para evitar duplicados como "Marketing" vs "marketing", la búsqueda de nombre duplicado debe ser case-insensitive. Usar `LOWER(name)` en el query o `ILike` de TypeORM.

### Cascade delete

`user_groups` tiene `ON DELETE CASCADE` en ambas FKs:
- Si se elimina un grupo → se eliminan todas las membresías
- Si se elimina un usuario → se eliminan todas sus membresías

`folder_permissions` (story 3.1) también tendrá CASCADE desde groups. Por ahora, delete group solo elimina membresías.

### Archivos a crear

**Backend (nuevo módulo completo):**
- 2 migraciones
- ~8 domain files (types, enums, interfaces)
- 7 use cases + tests
- 7 controllers + 3 DTOs
- 2 entities + 1 repository + 1 presenter
- 1 module + 1 index

**Frontend (nuevo módulo):**
- ~5 domain types
- 1 repository contract + 1 implementation
- 1 state + 1 viewmodel
- 4 components + 1 page

**Modificar:**
- `apps/api/src/app.module.ts` — importar GroupsModule
- `apps/web/src/app/dashboard/settings/layout.tsx` — agregar link Grupos
- `apps/api/src/modules/users/infrastructure/users.module.ts` — exportar USER_REPOSITORY si no lo está

### References

- [Source: _bmad-output/planning-artifacts/epic-01-auth-workspace.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — groups, user_groups tables
- [Source: _bmad-output/implementation-artifacts/1-3-invitacion-de-nuevos-usuarios.md] — patrón módulo completo

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
