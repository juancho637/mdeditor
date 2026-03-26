# Story 2.1: Estructura de Carpetas y Sidebar de Navegación

Status: done

## Story

As a **usuario autenticado**,
I want **crear carpetas y navegar por ellas en un sidebar jerárquico**,
so that **pueda organizar los documentos del equipo en una estructura clara**.

## Acceptance Criteria

1. **Given** estoy en el dashboard
   **When** hago clic en "Crear carpeta" e ingreso un nombre
   **Then** la carpeta aparece en el sidebar izquierdo (260px, colapsable)
   **And** puedo crear carpetas anidadas dentro de otras carpetas

2. **Given** existen carpetas con documentos
   **When** hago clic en una carpeta en el sidebar
   **Then** la carpeta se expande mostrando sus subcarpetas y documentos
   **And** la carpeta activa se resalta con background primary/10%

3. **Given** estoy navegando por la jerarquía de carpetas
   **When** abro un documento
   **Then** los breadcrumbs en el header muestran la ruta completa (Carpeta > Subcarpeta > Documento)
   **And** puedo hacer clic en cualquier breadcrumb para navegar hacia arriba

4. **Given** una carpeta existe
   **When** hago clic derecho sobre ella en el sidebar
   **Then** veo un menú contextual con opciones: Renombrar, Eliminar

5. **Given** intento eliminar una carpeta
   **When** confirmo en el dialog de confirmación
   **Then** la carpeta y todos sus documentos se eliminan
   **And** el sidebar se actualiza inmediatamente

6. **Given** una carpeta está vacía
   **When** la selecciono
   **Then** veo un empty state "Esta carpeta está vacía" con CTAs "Nuevo documento" e "Importar .md"

7. **Given** estoy en el dashboard
   **When** hago clic en el botón de colapsar sidebar
   **Then** el sidebar se oculta completamente y el contenido ocupa todo el ancho

## Tasks / Subtasks

### Backend — Infraestructura

- [ ] Task 1: Migración `CreateFoldersTable` (AC: #1)
  - [ ] Tabla `folders`: id (UUID), parent_id (UUID nullable FK self-ref), name (VARCHAR 255), slug (VARCHAR 255), created_by (UUID FK → users), created_at, updated_at
  - [ ] Índice en `parent_id` para queries jerárquicas
  - [ ] ON DELETE CASCADE en parent_id (eliminar padre → eliminar hijos)

- [ ] Task 2: Entity + domain types (AC: #1, #2)
  - [ ] `domain/types/folder.type.ts` — FolderType (id, parentId, name, slug, createdBy, createdAt, updatedAt)
  - [ ] `domain/types/folder-tree-node.type.ts` — FolderTreeNodeType (extends FolderType + children: FolderTreeNodeType[])
  - [ ] `domain/enums/folder-providers.enum.ts`
  - [ ] `domain/enums/folder-errors.codes.ts` — FLD001-FLD003, FLD100-FLD101
  - [ ] `domain/interfaces/folder-repository.interface.ts`
  - [ ] `infrastructure/persistence/folder.entity.ts`
  - [ ] `infrastructure/persistence/folder-orm.repository.ts`
  - [ ] `infrastructure/presenters/folder.presenter.ts`

### Backend — Use Cases

- [ ] Task 3: CreateFolderUseCase (AC: #1)
  - [ ] Recibir name + parentId (optional) + createdBy (del authUser)
  - [ ] Si parentId, verificar que existe (FLD001 si no)
  - [ ] Generar slug desde name (lowercase, replace spaces with hyphens)
  - [ ] Crear folder

- [ ] Task 4: GetFolderTreeUseCase (AC: #2)
  - [ ] Retornar toda la jerarquía de carpetas como árbol
  - [ ] Cada nodo tiene children[] recursivamente
  - [ ] Ordenar por name ASC en cada nivel

- [ ] Task 5: GetFolderByIdUseCase (AC: #2, #3, #6)
  - [ ] Retornar folder por id con su path (ancestors para breadcrumbs)
  - [ ] FLD001 si no existe

- [ ] Task 6: UpdateFolderUseCase — Renombrar (AC: #4)
  - [ ] Verificar existe, actualizar name + regenerar slug

- [ ] Task 7: DeleteFolderUseCase (AC: #5)
  - [ ] Verificar existe, eliminar (CASCADE elimina hijos + documentos futuros)

### Backend — Controllers + Module

- [ ] Task 8: Controllers, DTOs y módulo (AC: #1-7)
  - [ ] `create-folder.dto.ts` — name (IsString, IsNotEmpty), parent_id (IsUUID, IsOptional)
  - [ ] `update-folder.dto.ts` — name (IsString, IsNotEmpty)
  - [ ] POST `/api/folders` — crear carpeta (@Auth)
  - [ ] GET `/api/folders/tree` — árbol completo (@Auth)
  - [ ] GET `/api/folders/:id` — detalle + path (@Auth)
  - [ ] PUT `/api/folders/:id` — renombrar (@Auth)
  - [ ] DELETE `/api/folders/:id` — eliminar (@Auth)
  - [ ] `folders.module.ts` con factory DI
  - [ ] Registrar en `app.module.ts`

### Frontend

- [ ] Task 9: Módulo folders frontend (AC: #1-7)
  - [ ] `modules/folders/domain/types/` — Folder, FolderTreeNode, CreateFolderRequest
  - [ ] `modules/folders/domain/repositories/folder-repository.ts`
  - [ ] `modules/folders/infrastructure/repositories/folder-v1.repository.ts`
  - [ ] `modules/folders/infrastructure/state/folder.state.ts` — folders tree, selectedFolderId, expandedIds, sidebarCollapsed
  - [ ] `modules/folders/infrastructure/hooks/use-folder.viewmodel.ts`

- [ ] Task 10: Sidebar con FolderTree (AC: #1, #2, #7)
  - [ ] `FolderSidebar.tsx` — contenedor 260px con toggle de colapsar
  - [ ] `FolderTreeItem.tsx` — componente recursivo para cada nodo (chevron expand/collapse, active state)
  - [ ] Crear carpeta: input inline al presionar "Nueva carpeta"
  - [ ] Active state: `bg-primary/10` en carpeta seleccionada
  - [ ] Collapse: botón en header, toggle completo del sidebar

- [ ] Task 11: Context Menu + Delete Dialog (AC: #4, #5)
  - [ ] Instalar shadcn DropdownMenu si no existe
  - [ ] Right-click o botón "..." → DropdownMenu con Renombrar y Eliminar
  - [ ] Renombrar: input inline en el sidebar
  - [ ] Eliminar: Dialog de confirmación con botón destructivo

- [ ] Task 12: Breadcrumbs (AC: #3)
  - [ ] Componente Breadcrumb en el header del dashboard
  - [ ] Muestra path: Dashboard > Carpeta > Subcarpeta
  - [ ] Cada item clickeable navega a esa carpeta

- [ ] Task 13: Empty State de carpeta (AC: #6)
  - [ ] Agregar variante 'folder' al EmptyState component
  - [ ] Icono carpeta, mensaje "Esta carpeta está vacía"
  - [ ] CTA "Nuevo documento" (disabled por ahora — story 2.2)

- [ ] Task 14: Actualizar Dashboard Layout (AC: #1, #7)
  - [ ] Reestructurar layout: sidebar + main content area
  - [ ] Sidebar a la izquierda, main content flex-1
  - [ ] Si no hay carpeta seleccionada → EmptyState workspace
  - [ ] Si hay carpeta seleccionada → EmptyState folder o contenido

### Testing

- [ ] Task 15: Unit tests (AC: #1, #4, #5, #6)
  - [ ] `create-folder.use-case.spec.ts` — crea folder root, crea subfolder, falla parent no existe
  - [ ] `update-folder.use-case.spec.ts` — renombra folder
  - [ ] `delete-folder.use-case.spec.ts` — elimina folder, falla si no existe

- [ ] Task 16: E2E tests (AC: #1-7)
  - [ ] API: CRUD folders + tree endpoint
  - [ ] UI: crear carpeta, expandir, renombrar, eliminar con confirmación, sidebar collapse

## Dev Notes

### Qué YA existe (NO recrear)

- `@Auth()` decorator — protege rutas con JWT guard
- `@AuthUser()` decorator — extrae usuario autenticado
- `ExceptionService` — para errores de negocio
- Dashboard layout con header 48px + link a settings + logout
- `EmptyState` component (variante 'workspace')
- `Button`, `Input`, `Label`, `Card` de shadcn/ui
- Response wrapper + exception filters + logging interceptor

### Nota: no es admin-only

A diferencia de invitations y groups, los endpoints de folders son para **todos los usuarios autenticados** (no solo admin). Solo se necesita `@Auth()`, NO verificar `isAdmin`.

Los permisos por carpeta (quién puede ver/editar qué) son de la story 3.1. En esta story, todos los usuarios autenticados ven todas las carpetas.

### Slug generation

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

### Folder Tree — query strategy

Cargar todos los folders en una query (`find()`) y construir el árbol en JS:

```typescript
function buildTree(folders: FolderType[]): FolderTreeNodeType[] {
  const map = new Map<string, FolderTreeNodeType>();
  const roots: FolderTreeNodeType[] = [];

  folders.forEach(f => map.set(f.id, { ...f, children: [] }));
  folders.forEach(f => {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
```

### Breadcrumbs — path resolution

El endpoint `GET /api/folders/:id` retorna el folder + su path (array de ancestors). El repository construye el path recorriendo parent_id hasta llegar a null:

```typescript
async function getPath(folderId: string): Promise<FolderType[]> {
  const path: FolderType[] = [];
  let current = await this.findById(folderId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? await this.findById(current.parentId) : null;
  }
  return path;
}
```

### Error Codes

```
FLD001 — Folder not found
FLD002 — A folder with this name already exists in this location
FLD003 — Cannot delete: folder has children (if we want to prevent, otherwise CASCADE)
FLD100 — Failed to query folder from database
FLD101 — Failed to store folder in database
```

### Wire Format

```
POST /api/folders
Auth: Bearer {access_token}
Request:  { "name": "Marketing", "parent_id": "uuid" | null }
Response: { "data": { "id", "name", "slug", "parent_id", "created_by", "created_at", "updated_at" } }

GET /api/folders/tree
Auth: Bearer {access_token}
Response: { "data": [ { "id", "name", "slug", "parent_id", "children": [...recursive] } ] }

GET /api/folders/:id
Auth: Bearer {access_token}
Response: { "data": { "id", "name", "slug", "parent_id", "created_by", "created_at", "updated_at", "path": [{ "id", "name" }] } }

PUT /api/folders/:id
Auth: Bearer {access_token}
Request:  { "name": "New Name" }
Response: { "data": { "id", "name", "slug", "parent_id", "created_at", "updated_at" } }

DELETE /api/folders/:id
Auth: Bearer {access_token}
Response: { "data": { "id" } }
```

### Componentes shadcn/ui a instalar

Para esta story se necesitan componentes nuevos de shadcn:
- `DropdownMenu` — menú contextual (right-click)
- `Dialog` — confirmación de eliminación
- `Separator` — divisores visuales

Instalar dentro del container: `make add PKG="@radix-ui/react-dropdown-menu @radix-ui/react-dialog @radix-ui/react-separator" APP=web`
O usar shadcn CLI dentro del container.

### References

- [Source: _bmad-output/planning-artifacts/epic-02-documentos-carpetas.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — folders table
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Sidebar] — 260px, colapsable, UX-DR18
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty States] — folder vacío variant

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
