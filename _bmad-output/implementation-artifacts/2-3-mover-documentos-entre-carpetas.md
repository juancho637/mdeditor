# Story 2.3: Mover Documentos entre Carpetas

Status: done

## Story

As a **usuario autenticado**,
I want **mover documentos de una carpeta a otra**,
so that **pueda reorganizar el contenido cuando la estructura evolucione**.

## Acceptance Criteria

1. **Given** tengo un documento en una carpeta
   **When** selecciono "Mover" desde el menú contextual del documento
   **Then** veo un selector de carpeta destino con la jerarquía completa

2. **Given** selecciono una carpeta destino válida
   **When** confirmo el movimiento
   **Then** el documento aparece en la nueva carpeta en el sidebar
   **And** desaparece de la carpeta original
   **And** los breadcrumbs se actualizan si estoy viendo ese documento

3. **Given** intento mover un documento a la misma carpeta donde ya está
   **When** selecciono la carpeta actual como destino
   **Then** la opción aparece deshabilitada o recibo un mensaje informativo

## Tasks / Subtasks

### Backend

- [ ] Task 1: MoveDocumentUseCase (AC: #2, #3)
  - [ ] Verificar documento existe (DOC001)
  - [ ] Verificar carpeta destino existe (FLD001)
  - [ ] Si folder_id destino === folder_id actual → throw DOC003 (same folder)
  - [ ] Actualizar document.folder_id

- [ ] Task 2: Controller + DTO (AC: #1, #2)
  - [ ] `move-document.dto.ts` — folder_id (IsUUID, IsNotEmpty)
  - [ ] `move-document.controller.ts` — PATCH `/api/documents/:id/move` (@Auth)
  - [ ] Registrar en documents.module.ts

### Frontend

- [ ] Task 3: FolderSelector component (AC: #1, #3)
  - [ ] Modal/dialog que muestra el tree de carpetas completo
  - [ ] Carpeta actual deshabilitada (AC #3)
  - [ ] Click en carpeta → selecciona como destino
  - [ ] Botón "Mover" para confirmar

- [ ] Task 4: Integrar "Mover" en context menu de documentos (AC: #1)
  - [ ] Agregar opción "Mover" al menú contextual de documentos en el sidebar
  - [ ] Abrir FolderSelector al click
  - [ ] Al confirmar: PATCH /api/documents/:id/move → recargar tree + documents

- [ ] Task 5: Actualizar viewmodel (AC: #2)
  - [ ] `moveDocument(docId, targetFolderId)` en useDocumentViewModel
  - [ ] Refresh folder documents + tree después del move

### Testing

- [ ] Task 6: Unit tests (AC: #2, #3)
  - [ ] `move-document.use-case.spec.ts` — mueve doc, falla si doc no existe, falla si folder no existe, falla si same folder

- [ ] Task 7: E2E tests (AC: #1, #2, #3)
  - [ ] API: PATCH move document
  - [ ] UI: mover documento vía selector

## Dev Notes

### Qué YA existe

- `DocumentRepositoryInterface.update()` — puede actualizar folder_id
- `FolderRepositoryInterface.findById()` — verificar carpeta destino
- Folder tree en frontend (useFolderViewModel) — reutilizar para selector
- Context menu en sidebar — agregar opción "Mover"

### Error Codes (nuevo)

```
DOC003 — Document is already in this folder
```

### Wire Format

```
PATCH /api/documents/:id/move
Auth: Bearer {access_token}
Request:  { "folder_id": "target-uuid" }
Response: { "data": { "id", "title", "slug", "folder_id": "new-uuid", ... } }
```

### References

- [Source: _bmad-output/planning-artifacts/epic-02-documentos-carpetas.md#Story 2.3]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
