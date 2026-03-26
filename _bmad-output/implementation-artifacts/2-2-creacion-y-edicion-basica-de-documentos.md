# Story 2.2: Creación y Edición Básica de Documentos

Status: done

## Story

As a **usuario autenticado**,
I want **crear documentos markdown dentro de una carpeta y editarlos**,
so that **pueda empezar a generar contenido para mi equipo**.

## Acceptance Criteria

1. **Given** estoy en una carpeta
   **When** hago clic en "Nuevo documento" e ingreso un título
   **Then** el documento se crea en la carpeta actual
   **And** se abre automáticamente con un editor de texto listo para escribir
   **And** el documento aparece en el sidebar bajo la carpeta correspondiente

2. **Given** estoy editando un documento
   **When** escribo contenido markdown
   **Then** el contenido se guarda automáticamente (sin botón "Guardar")
   **And** el badge en el header muestra "Guardando..." → "✓ Guardado"

3. **Given** estoy en el sidebar
   **When** hago clic en un documento
   **Then** se abre en el área de contenido

4. **Given** un documento existe
   **When** hago clic derecho sobre él en el sidebar
   **Then** veo opciones: Renombrar, Eliminar

5. **Given** intento eliminar un documento
   **When** confirmo en el dialog
   **Then** el documento se elimina y el sidebar se actualiza

## Tasks / Subtasks

### Backend — Infraestructura

- [ ] Task 1: Migración `CreateDocumentsTable` (AC: #1)
  - [ ] Tabla `documents`: id (UUID), folder_id (UUID FK → folders ON DELETE CASCADE), title (VARCHAR 255), slug (VARCHAR 255), content_markdown (TEXT default ''), created_by (UUID FK → users), created_at, updated_at
  - [ ] Índice en `folder_id`

- [ ] Task 2: Entity + domain types (AC: #1, #2)
  - [ ] `domain/types/document.type.ts` — DocumentType
  - [ ] `domain/enums/document-providers.enum.ts`
  - [ ] `domain/enums/document-errors.codes.ts` — DOC001, DOC100-101
  - [ ] `domain/interfaces/document-repository.interface.ts`
  - [ ] `infrastructure/persistence/document.entity.ts`
  - [ ] `infrastructure/persistence/document-orm.repository.ts`
  - [ ] `infrastructure/presenters/document.presenter.ts`

### Backend — Use Cases

- [ ] Task 3: CreateDocumentUseCase (AC: #1)
  - [ ] Verificar folder existe (FLD001)
  - [ ] Generar slug desde title
  - [ ] Crear con content_markdown vacío

- [ ] Task 4: GetDocumentByIdUseCase (AC: #3)
  - [ ] Retornar documento completo incluyendo content_markdown

- [ ] Task 5: UpdateDocumentUseCase (AC: #2, #4)
  - [ ] Actualizar content_markdown y/o title
  - [ ] Regenerar slug si title cambia

- [ ] Task 6: DeleteDocumentUseCase (AC: #5)
  - [ ] Verificar existe, eliminar

- [ ] Task 7: ListDocumentsByFolderUseCase (AC: #1, #3)
  - [ ] Retornar documentos de un folder (sin content_markdown para performance)

### Backend — Controllers + Module

- [ ] Task 8: Controllers, DTOs y módulo (AC: #1-5)
  - [ ] `create-document.dto.ts` — title (IsString, IsNotEmpty), folder_id (IsUUID)
  - [ ] `update-document.dto.ts` — title (IsString, IsOptional), content_markdown (IsString, IsOptional)
  - [ ] POST `/api/documents` — crear (@Auth)
  - [ ] GET `/api/documents/:id` — detalle con contenido (@Auth)
  - [ ] PUT `/api/documents/:id` — actualizar título y/o contenido (@Auth)
  - [ ] DELETE `/api/documents/:id` — eliminar (@Auth)
  - [ ] GET `/api/folders/:folderId/documents` — listar por carpeta (@Auth)
  - [ ] `documents.module.ts` con factory DI
  - [ ] Registrar en `app.module.ts`

### Frontend

- [ ] Task 9: Módulo documents frontend (AC: #1-5)
  - [ ] `modules/documents/domain/types/` — Document, DocumentSummary
  - [ ] `modules/documents/domain/repositories/document-repository.ts`
  - [ ] `modules/documents/infrastructure/repositories/document-v1.repository.ts`
  - [ ] `modules/documents/infrastructure/state/document.state.ts`
  - [ ] `modules/documents/infrastructure/hooks/use-document.viewmodel.ts`

- [ ] Task 10: Documentos en el sidebar (AC: #1, #3, #4, #5)
  - [ ] Modificar FolderTreeItem para mostrar documentos bajo cada carpeta
  - [ ] Icono 📄 para documentos
  - [ ] Click → abre documento en área de contenido
  - [ ] Context menu: Renombrar, Eliminar (mismo patrón que carpetas)
  - [ ] Actualizar folder tree endpoint para incluir documentos por carpeta (o query separada)

- [ ] Task 11: Editor de documento (AC: #2)
  - [ ] Página/componente `DocumentEditor.tsx` — textarea con contenido markdown
  - [ ] Autosave con debounce (500ms) al escribir
  - [ ] Badge de estado: "Guardando..." → "✓ Guardado"
  - [ ] Breadcrumbs actualizado: Carpeta > Subcarpeta > Documento

- [ ] Task 12: Crear documento desde carpeta (AC: #1)
  - [ ] Botón "Nuevo documento" en el empty state de carpeta o en el context menu
  - [ ] Input inline para título → POST → redirige al editor

### Testing

- [ ] Task 13: Unit tests (AC: #1, #2, #5)
  - [ ] `create-document.use-case.spec.ts` — crea doc, falla si folder no existe
  - [ ] `update-document.use-case.spec.ts` — actualiza contenido, actualiza título
  - [ ] `delete-document.use-case.spec.ts` — elimina doc, falla si no existe

- [ ] Task 14: E2E tests (AC: #1-5)
  - [ ] API: CRUD documents
  - [ ] UI: crear doc, abrir, editar con autosave, eliminar

## Dev Notes

### Qué YA existe (NO recrear)

- Folders module completo (backend + frontend) — los documentos se anidan dentro de folders
- FolderSidebar + FolderTreeItem — agregar documentos al sidebar existente
- FolderBreadcrumbs — agregar el nombre del documento al path
- Dashboard layout con sidebar + content area
- `@Auth()` decorator, ExceptionService, response wrapper

### Nota: editor básico (textarea)

En esta story el editor es un `<textarea>` simple. El editor CodeMirror se implementa en Epic 4 (Story 4.1). NO instalar CodeMirror aquí.

### Autosave pattern

```typescript
// En el componente DocumentEditor
const [content, setContent] = useState(document.contentMarkdown);
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

// Debounce: guardar 500ms después del último cambio
useEffect(() => {
  if (content === document.contentMarkdown) return;
  setSaveStatus('saving');
  const timer = setTimeout(async () => {
    await updateDocument(document.id, { contentMarkdown: content });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, 500);
  return () => clearTimeout(timer);
}, [content]);
```

### Documentos en el sidebar

Opción A: Modificar el tree endpoint para incluir documentos en cada nodo.
Opción B: Query separada `GET /api/folders/:id/documents` cuando se expande un folder.

Vamos con **Opción B** — más limpio, lazy loading, no sobrecarga el tree.

### Error Codes

```
DOC001 — Document not found
DOC002 — A document with this title already exists in this folder
DOC100 — Failed to query document from database
DOC101 — Failed to store document in database
```

### Wire Format

```
POST /api/documents
{ "title": "Brief", "folder_id": "uuid" }
→ { "data": { "id", "title", "slug", "folder_id", "content_markdown": "", "created_by", "created_at", "updated_at" } }

GET /api/documents/:id
→ { "data": { "id", "title", "slug", "folder_id", "content_markdown", "created_by", "created_at", "updated_at" } }

PUT /api/documents/:id
{ "title": "New Title", "content_markdown": "# Hello" }  (ambos opcionales)
→ { "data": { "id", "title", "slug", ... } }

DELETE /api/documents/:id
→ { "data": { "id" } }

GET /api/folders/:folderId/documents
→ { "data": [ { "id", "title", "slug", "folder_id", "created_at", "updated_at" } ] }  (sin content_markdown)
```

### Modelo de datos

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_folder_id ON documents(folder_id);
```

### References

- [Source: _bmad-output/planning-artifacts/epic-02-documentos-carpetas.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — documents table
- [Source: _bmad-output/implementation-artifacts/2-1-estructura-de-carpetas-y-sidebar-de-navegacion.md] — folder module patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
