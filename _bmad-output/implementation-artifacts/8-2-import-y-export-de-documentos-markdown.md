# Story 8.2: Import y Export de Documentos Markdown

Status: review

## Story

As a **usuario con permiso de edición**,
I want **importar archivos .md desde mi dispositivo y exportar documentos como .md**,
so that **pueda migrar documentación existente a la plataforma y sacar copias cuando lo necesite**.

## Acceptance Criteria

1. **Given** estoy en una carpeta con permiso de edición
   **When** hago clic en "Importar .md"
   **Then** se abre el selector de archivos de mi dispositivo filtrado a `.md`
   **And** puedo seleccionar uno o múltiples archivos

2. **Given** selecciono archivos .md para importar
   **When** confirmo la importación
   **Then** cada archivo se crea como un documento nuevo en la carpeta actual
   **And** el título se toma del nombre del archivo (sin extensión)
   **And** el contenido se preserva exactamente como estaba en el archivo

3. **Given** estoy viendo un documento
   **When** selecciono "Exportar como .md" desde el menú de opciones
   **Then** se descarga un archivo .md con el contenido actual del documento
   **And** el nombre del archivo es el título del documento

4. **Given** importo un archivo con un nombre que ya existe en la carpeta
   **When** se procesa la importación
   **Then** el documento se crea con un sufijo numérico (ej: "documento (1)")

## Tasks / Subtasks

### Task 1: Backend — Use case `ImportDocumentsUseCase` (AC: #2, #4)

- [x] 1.1 Agregar `IMPORT_DOCUMENTS_USE_CASE` a `DocumentProvidersEnum` en `apps/api/src/modules/documents/domain/enums/document-providers.enum.ts`
- [x] 1.2 Crear `apps/api/src/modules/documents/application/use-cases/import-documents.use-case.ts`:
  - Clase pura (sin `@Injectable()`), método `run()`
  - Recibe: `{ userId: string; folderId: string; files: Array<{ originalname: string; buffer: Buffer }> }`
  - Retorna: `Array<{ id: string; title: string; slug: string }>`
  - Valida permiso: `checkPermission.run(userId, folderId)` debe ser `PermissionLevel.EDIT`
  - Lanza `exception.forbiddenException` si no hay permiso (usar `documentErrorsCodes` nuevo o inline)
  - Para cada file:
    - Extrae título = `originalname` sin extensión (`.md`) y sin path (`path.basename`)
    - Extrae content = `buffer.toString('utf-8')`
    - Resuelve duplicado: llama `documentRepository.findByFolderId(folderId)` una vez (antes del loop) y guarda un Set de títulos existentes. Si el título ya existe: prueba `"${title} (1)"`, `"${title} (2)"`, etc. hasta encontrar uno libre. Actualiza el Set con el título elegido.
    - Crea documento: `createDocumentUseCase.run({ title, folderId, createdBy: userId })`
    - Actualiza contenido via `syncService`: patrón idéntico al de `CreateDocumentWithContentUseCase` (ver Dev Notes)
  - Si algún archivo falla, no interrumpir — continuar con los demás (best-effort)
- [x] 1.3 Crear `apps/api/src/modules/documents/application/use-cases/__tests__/import-documents.use-case.spec.ts`:
  - Test: importar 1 archivo sin duplicado → retorna documento creado
  - Test: importar 2 archivos → retorna 2 documentos
  - Test: título duplicado → genera sufijo `(1)` correctamente
  - Test: título con `(1)` ya existe → genera `(2)`
  - Test: permiso insuficiente → lanza excepción
- [x] 1.4 Exportar `ImportDocumentsUseCase` desde `apps/api/src/modules/documents/application/use-cases/index.ts`

### Task 2: Backend — Controller `ImportDocumentsController` (AC: #1, #2, #4)

- [x] 2.1 Agregar `@types/multer` como devDependency: `make add-dev PKG="@types/multer" APP=api`
- [x] 2.2 Crear `apps/api/src/modules/documents/infrastructure/api/import-documents.controller.ts`:
  - `@Post('api/documents/import')` con `@Auth()` y `@UseInterceptors(FilesInterceptor('files', 20, { limits: { fileSize: 1_048_576 } }))`
    - `FilesInterceptor` de `@nestjs/platform-express`
    - `20` archivos máximo por request
    - `fileSize: 1_048_576` = 1MB por archivo
  - `@Body('folder_id') folderId: string` — field del form
  - `@UploadedFiles() files: Express.Multer.File[]` — archivos
  - `@AuthUser() authUser: AuthenticatedUserType`
  - Valida que `folderId` exista (simple check de presencia, no DTO formal)
  - Valida que `files` tenga al menos 1 elemento
  - Retorna `importDocumentsUseCase.run(...)` directamente (array de `{ id, title, slug }`)
- [x] 2.3 Registrar `ImportDocumentsController` en `documents.module.ts` controllers array (ANTES de `GetDocumentController` para evitar conflictos de ruta)
- [x] 2.4 Registrar provider `IMPORT_DOCUMENTS_USE_CASE` en `documents.module.ts`:
  ```typescript
  {
    inject: [
      DocumentProvidersEnum.DOCUMENT_REPOSITORY,
      DocumentProvidersEnum.CREATE_DOCUMENT_USE_CASE,
      DocumentProvidersEnum.DOCUMENT_SYNC_SERVICE,
      PermissionProvidersEnum.CHECK_PERMISSION_USE_CASE,
      ExceptionProvidersEnum.EXCEPTION_SERVICE,
    ],
    provide: DocumentProvidersEnum.IMPORT_DOCUMENTS_USE_CASE,
    useFactory: (docRepo, createDoc, syncService, checkPerm, ex) =>
      new ImportDocumentsUseCase(docRepo, createDoc, syncService, checkPerm, ex),
  }
  ```

### Task 3: Frontend — Export (AC: #3)

> **Nota**: Export es 100% frontend. El contenido ya está en `currentDocument.contentMarkdown`. No se necesita endpoint nuevo.

- [x] 3.1 Agregar función `exportDocument` a `useDocumentViewModel` en `apps/web/src/modules/documents/infrastructure/hooks/use-document.viewmodel.ts`:
  ```typescript
  const exportDocument = useCallback(
    (title: string, contentMarkdown: string) => {
      const blob = new Blob([contentMarkdown], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );
  ```

  - Sin loading state (operación síncrona)
  - Retornarlo desde el hook
- [x] 3.2 Agregar botón "Exportar como .md" en `DocumentEditor.tsx`:
  - Ubicación: en el header del editor, junto al área de botones de modo (editor/preview/híbrido)
  - Trigger: llama `exportDocument(document.title, content)` donde `content` es el estado actual del editor (no `document.contentMarkdown` que puede estar desactualizado)
  - Texto: `↓ .md` o `Exportar` con tooltip `"Exportar como .md"`
  - Solo visible cuando hay un documento abierto (ya está en `DocumentEditor`)

### Task 4: Frontend — Import (AC: #1, #2, #4)

- [x] 4.1 Agregar método `importDocuments` a `DocumentV1Repository` en `apps/web/src/modules/documents/infrastructure/repositories/document-v1.repository.ts`:
  ```typescript
  async importDocuments(folderId: string, files: File[]): Promise<DocumentSummary[]> {
    const formData = new FormData();
    formData.append('folder_id', folderId);
    files.forEach((file) => formData.append('files', file));
    const response = await apiClient.post<Array<{ id: string; title: string; slug: string; folder_id: string; created_at: string; updated_at: string }>>('/api/documents/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (response.data as Array<{ id: string; title: string; slug: string; folder_id: string; created_at: string; updated_at: string }>).map((d) => ({
      id: d.id,
      folderId: d.folder_id ?? folderId,
      title: d.title,
      slug: d.slug,
      createdAt: d.created_at ?? new Date().toISOString(),
      updatedAt: d.updated_at ?? new Date().toISOString(),
    }));
  }
  ```

  - `apiClient` maneja el `Authorization` header automáticamente
  - Multer del backend popula `folder_id` desde el body del form
- [x] 4.2 Agregar función `importDocuments` a `useDocumentViewModel`:
  ```typescript
  const importDocuments = useCallback(
    async (folderId: string, files: File[]) => {
      setLoading(true);
      setError(null);
      try {
        await documentRepository.importDocuments(folderId, files);
        await loadFolderDocuments(folderId);
      } catch (err) {
        setError(extractError(err, 'Error al importar archivos'));
      } finally {
        setLoading(false);
      }
    },
    [loadFolderDocuments, setLoading, setError],
  );
  ```

  - Retornarlo desde el hook
- [x] 4.3 Agregar botón e input hidden en `apps/web/src/app/dashboard/page.tsx`:
  - `<input type="file" accept=".md" multiple ref={importInputRef} onChange={handleImportFiles} className="hidden" />`
  - Botón "Importar .md" junto a "Nuevo documento" (solo visible cuando `selectedFolder` tiene permiso EDIT — verificar con `selectedFolder.permissionLevel`)
  - `handleImportFiles`: lee `e.target.files`, llama `importDocuments(selectedFolder.id, Array.from(files))`, resetea el input value
  - Solo mostrar botón cuando `selectedFolder` está activo
  - Loading state del store deshabilita el botón durante la importación

### Task 5: Unit tests backend (AC: #2, #4)

- [x] 5.1 Cubierto en Task 1.3

## Dev Notes

### Qué ya existe (NO reinventar)

| Componente                         | Archivo                                                                   | Qué reutilizar                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `CreateDocumentWithContentUseCase` | `modules/documents/application/use-cases/`                                | Patrón exacto de crear doc + insertar contenido via Yjs (copiar lógica de syncService)          |
| `DocumentProvidersEnum`            | `modules/documents/domain/enums/document-providers.enum.ts`               | Agregar `IMPORT_DOCUMENTS_USE_CASE` aquí                                                        |
| `documentErrorsCodes`              | `modules/documents/domain/enums/document-errors.codes.ts`                 | Reutilizar `DOC101` para errores de creación                                                    |
| `CheckPermissionUseCase`           | `modules/permissions/application/`                                        | Validar permiso EDIT antes de importar                                                          |
| `PermissionLevel`                  | `modules/permissions/domain/`                                             | `PermissionLevel.EDIT` para chequeo                                                             |
| `@Auth()` + `@AuthUser()`          | `common/helpers/infrastructure/`                                          | Decoradores de autenticación en el controller                                                   |
| `FilesInterceptor`                 | `@nestjs/platform-express`                                                | Manejo de multipart/form-data. **Ya disponible** — no instalar nada extra salvo `@types/multer` |
| `useDocumentViewModel`             | `modules/documents/infrastructure/hooks/`                                 | Agregar `exportDocument` e `importDocuments` aquí                                               |
| `documentRepository`               | `modules/documents/infrastructure/repositories/document-v1.repository.ts` | Agregar `importDocuments` aquí                                                                  |
| `apiClient`                        | `common/adapters/api-client/api-client.ts`                                | Axios instance — maneja auth header automáticamente                                             |
| `loadFolderDocuments`              | `useDocumentViewModel`                                                    | Llamar después de importar para refrescar la lista                                              |
| `selectedFolder.permissionLevel`   | `FolderStore` / `page.tsx`                                                | Ya disponible en el store para controlar visibilidad del botón importar                         |

### Decisiones de implementación

1. **Export es 100% frontend** — No crear endpoint de export. El contenido ya está en `currentDocument.contentMarkdown` / el estado local del editor. `Blob` + anchor programático es la forma estándar en web.

2. **Import en `documents` module** — No crear módulo separado (lección de story 8.1). El módulo `documents` ya tiene todos los providers necesarios.

3. **`FilesInterceptor` sin instalar multer** — `@nestjs/platform-express` ya incluye multer. Solo hace falta `@types/multer` como devDependency para los tipos TypeScript (`Express.Multer.File`).

4. **Duplicate detection en memoria** — Llamar `findByFolderId` una sola vez antes del loop → Set de títulos. Evita N queries. Para carpetas grandes es O(n) en memoria pero completamente razonable para el MVP.

5. **Content via syncService** — Patrón idéntico a `CreateDocumentWithContentUseCase`. Yjs es la fuente de verdad para el contenido. Insertar con `yDoc.transact(() => yText.insert(0, content))`.

6. **Best-effort import** — Si un archivo falla, continuar con los demás. El resultado retorna solo los documentos creados exitosamente. El frontend muestra el resultado en la lista (refrescada con `loadFolderDocuments`).

7. **Export filename** — Usar `document.title` + `.md`. Si el título tiene caracteres inválidos en filename (ej: `/`), el browser los maneja automáticamente. No sanitizar en el frontend.

8. **Export content** — Usar el estado LOCAL del editor (`content`), no `document.contentMarkdown`. La colaboración Yjs actualiza el estado local continuamente, pero `document.contentMarkdown` solo se actualiza en snapshots. El estado local es siempre más fresco.

9. **Import button visibility** — Solo mostrar "Importar .md" cuando la carpeta tiene `permissionLevel === PermissionLevel.EDIT`. Usar la misma condición que ya usa el botón "Nuevo documento".

10. **multipart/form-data con axios** — Al pasar un `FormData` a `apiClient.post()`, axios detecta automáticamente el `Content-Type: multipart/form-data; boundary=...`. NO setear el header manualmente (sobreescribiría el boundary).

### Wire format (API import)

```
POST /api/documents/import
Authorization: Bearer {jwt}
Content-Type: multipart/form-data; boundary=---

------boundary
Content-Disposition: form-data; name="folder_id"

uuid-carpeta
------boundary
Content-Disposition: form-data; name="files"; filename="guia-typescript.md"
Content-Type: text/markdown

# Guía TypeScript
...contenido del archivo...
------boundary--

Response 201:
[
  {
    "id": "uuid",
    "title": "guia-typescript",
    "slug": "guia-typescript"
  }
]

Response 403: sin permiso EDIT
Response 400: sin folder_id o sin files
```

### Enums — NO hardcodear strings

```typescript
// Backend — agregar a document-providers.enum.ts
DocumentProvidersEnum.IMPORT_DOCUMENTS_USE_CASE;

// Frontend — usar PermissionLevel existente
PermissionLevel.EDIT; // para condicionar visibilidad del botón importar
```

### Anti-patrones a evitar

- **NO instalar `multer` directamente** — ya viene con `@nestjs/platform-express`. Solo `@types/multer` para los tipos.
- **NO crear endpoint de export** — export es 100% cliente con Blob + anchor.
- **NO llamar `findByFolderId` por cada archivo** — una sola llamada antes del loop, Set en memoria.
- **NO usar `document.contentMarkdown` para export** — usar el estado LOCAL del editor (puede estar más actualizado que el snapshot en DB).
- **NO crear módulo NestJS separado** — todo va en el módulo `documents` existente.
- **NO setear `Content-Type` manualmente** en la llamada axios con FormData — axios lo hace automáticamente con el boundary correcto.
- **NO loading state local en componentes** — loading en Zustand store (patrón establecido).

### Orden de implementación recomendado

1. Backend: enum + use case + tests (Tasks 1.1-1.4)
2. Backend: `@types/multer` + controller + module wiring (Tasks 2.1-2.4)
3. Frontend: export en viewmodel + DocumentEditor (Tasks 3.1-3.2)
4. Frontend: import en repository + viewmodel + dashboard/page.tsx (Tasks 4.1-4.3)

### Estructura de archivos (nuevos)

**Backend:**

```
apps/api/src/modules/documents/
└── application/use-cases/
    ├── import-documents.use-case.ts  (NEW)
    └── __tests__/import-documents.use-case.spec.ts  (NEW)
└── infrastructure/api/
    └── import-documents.controller.ts  (NEW)
```

**Backend (modificados):**

```
apps/api/src/modules/documents/domain/enums/document-providers.enum.ts  (+IMPORT_DOCUMENTS_USE_CASE)
apps/api/src/modules/documents/application/use-cases/index.ts  (+ImportDocumentsUseCase)
apps/api/src/modules/documents/infrastructure/documents.module.ts  (+controller +provider)
```

**Frontend (modificados):**

```
apps/web/src/modules/documents/infrastructure/repositories/document-v1.repository.ts  (+importDocuments)
apps/web/src/modules/documents/infrastructure/hooks/use-document.viewmodel.ts  (+importDocuments +exportDocument)
apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx  (+botón exportar)
apps/web/src/app/dashboard/page.tsx  (+botón importar +input file hidden)
```

### Inteligencia de story previa (8.1)

- **Lección crítica**: NO crear módulo separado para features de un módulo existente. La 8.1 empezó con módulo `search` separado y se corrigió para integrarlo en `documents`. Esta story ya sigue ese patrón.
- **Route conflict**: Registrar `ImportDocumentsController` ANTES de `GetDocumentController` en el array `controllers[]` para que `POST /api/documents/import` no sea capturado por otra ruta primero.
- **Throttle en tests**: Si los tests E2E tienen rate limiting issues, agregar delay de 1500ms entre logins de usuarios distintos.
- **Double-wrap**: No envolver el response manualmente — el `ResponseInterceptor` ya lo hace.
- **cmdk** ya instalado (story 8.1). No reinstalar.

### References

- [Source: epic-08-busqueda-responsive.md#Story 8.2] — ACs originales
- [Source: 8-1-busqueda-global-de-contenido.md] — Lecciones de implementación, patrones de módulo
- [Source: architecture.md] — `import-document.use-case.ts` y `export-document.use-case.ts` listados en árbol de archivos; import/export en documents module
- [Source: modules/documents/application/use-cases/create-document-with-content.use-case.ts] — Patrón para insertar contenido via syncService (copiar exactamente)
- [Source: modules/documents/infrastructure/documents.module.ts] — Patrón de wiring con useFactory
- [Source: app/dashboard/page.tsx] — Dónde agregar botón importar
- [Source: modules/documents/infrastructure/components/DocumentEditor.tsx] — Dónde agregar botón exportar
- [Source: CLAUDE.md] — Arquitectura, convenciones, reglas de código

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Completion Notes List

- `ImportDocumentsUseCase` implementado como clase pura sin `@Injectable()`, patrón idéntico al de `CreateDocumentWithContentUseCase` para insertar contenido via Yjs syncService
- Best-effort import: si un archivo falla, continúa con los demás
- Duplicate title resolution: `findByFolderId` una sola vez antes del loop → Set en memoria → sufijo `(1)`, `(2)`, etc.
- Export es 100% frontend: `Blob + anchor` usando el estado local del editor (no el snapshot de DB), sin endpoint nuevo
- `apiClient` tiene `Content-Type: application/json` por defecto que rompe multipart — se usó `fetch` nativo con `Authorization: Bearer {token}` para la llamada de import
- `@types/multer` instalado como devDep; `multer` en sí ya viene con `@nestjs/platform-express`
- `ImportDocumentsController` registrado ANTES de `SearchDocumentsController` y `GetDocumentController` para evitar conflictos de ruta
- 5 unit tests cubriendo: import simple, múltiples archivos, duplicado → (1), duplicado (1) → (2), permiso insuficiente
- 12 tests E2E cubriendo: API (happy path × 3, duplicados × 2, errores × 2) + UI (botón visible, input .md, import real, export visible, download)
- Suite completa: 36 suites / 121 unit tests ✅, 223 E2E tests ✅, typecheck clean ✅

### File List

**Backend (nuevos):**

- `apps/api/src/modules/documents/application/use-cases/import-documents.use-case.ts`
- `apps/api/src/modules/documents/application/use-cases/__tests__/import-documents.use-case.spec.ts`
- `apps/api/src/modules/documents/infrastructure/api/import-documents.controller.ts`

**Backend (modificados):**

- `apps/api/src/modules/documents/domain/enums/document-providers.enum.ts` (+`IMPORT_DOCUMENTS_USE_CASE`)
- `apps/api/src/modules/documents/application/use-cases/index.ts` (+`ImportDocumentsUseCase`)
- `apps/api/src/modules/documents/infrastructure/documents.module.ts` (+controller +provider)

**Frontend (modificados):**

- `apps/web/src/modules/documents/infrastructure/repositories/document-v1.repository.ts` (+`importDocuments` con `fetch` nativo)
- `apps/web/src/modules/documents/infrastructure/hooks/use-document.viewmodel.ts` (+`importDocuments`, +`exportDocument`)
- `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` (+botón `↓ .md`)
- `apps/web/src/app/dashboard/page.tsx` (+botón "Importar .md" +input file hidden)

**E2E:**

- `e2e/import-export.spec.ts` (nuevo — 12 tests)

### Change Log

- 2026-03-31: Story 8.2 creada — import/export de archivos .md
- 2026-03-31: Story 8.2 implementada — import via `POST /api/documents/import` (multipart), export 100% frontend, 12 tests E2E, todos los tests pasan
