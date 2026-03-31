# Story 8.4: Compartir Documento Público

Status: done

## Story

As a **usuario con permiso de edición**,
I want **generar un link público para compartir un documento**,
so that **personas externas (sin cuenta en la plataforma) puedan leer el documento renderizado sin necesidad de autenticarse**.

## Acceptance Criteria

1. **Given** estoy viendo un documento y tengo permiso de edición sobre su carpeta
   **When** hago clic en el botón "Compartir"
   **Then** se genera un share token único para ese documento
   **And** se muestra un panel con la URL pública lista para copiar (ej. `https://mi-instancia.com/p/{token}`)
   **And** el link puede ser copiado al portapapeles con un solo clic

2. **Given** el documento tiene un link público activo
   **When** vuelvo a abrir el panel "Compartir"
   **Then** veo el mismo link ya generado (no se crea uno nuevo)
   **And** puedo revocar el link público con un botón "Revocar acceso"

3. **Given** tengo un link público activo y hago clic en "Revocar acceso"
   **When** confirmo la revocación
   **Then** el link queda inválido inmediatamente
   **And** el panel muestra el estado "Sin link público" con opción de generar uno nuevo

4. **Given** accedo a `/p/{token}` en el navegador sin estar autenticado
   **When** el token es válido
   **Then** veo el documento renderizado en markdown (solo lectura, sin editor)
   **And** la página muestra el título del documento
   **And** no hay sidebar, toolbar de edición ni elementos del dashboard
   **And** hay un header mínimo con el nombre de la plataforma ("markdown")

5. **Given** accedo a `/p/{token}` con un token inválido o revocado
   **When** se carga la página
   **Then** veo una pantalla de "Documento no encontrado" con mensaje explicativo
   **And** la página retorna status HTTP 404

6. **Given** soy usuario con permiso de solo lectura (view) sobre la carpeta del documento
   **When** abro el documento
   **Then** el botón "Compartir" no está visible (solo usuarios con permiso edit pueden compartir)

7. **Given** el documento tiene un link público
   **When** el propietario elimina el documento
   **Then** el share token queda inválido automáticamente (cascade delete)

## Dev Notes

### Backend — Nuevo módulo `shares` dentro del módulo `documents`

**IMPORTANTE:** No crear un módulo NestJS nuevo. Extender el módulo `documents` existente en `apps/api/src/modules/documents/`.

#### Nueva migración TypeORM

Crear tabla `document_shares`:

```sql
CREATE TABLE document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_document_shares_document UNIQUE (document_id)
);
CREATE INDEX idx_document_shares_token ON document_shares (share_token);
```

**NOTA:** La restricción `UNIQUE (document_id)` garantiza que un documento solo tenga un share token activo a la vez.

El share_token debe generarse con `crypto.randomBytes(32).toString('hex')` (64 chars hex, seguro y URL-safe).

#### Archivos a crear (backend)

```
modules/documents/
├── domain/
│   ├── enums/documents-usecases.enum.ts          ← agregar: CREATE_SHARE, GET_SHARE, DELETE_SHARE, GET_DOCUMENT_BY_SHARE_TOKEN
│   └── types/document-share.type.ts              ← NUEVO
├── application/use-cases/
│   ├── create-document-share.use-case.ts         ← NUEVO
│   ├── get-document-share.use-case.ts            ← NUEVO (get share by documentId)
│   ├── delete-document-share.use-case.ts         ← NUEVO
│   └── get-document-by-share-token.use-case.ts  ← NUEVO (public, no auth)
└── infrastructure/
    ├── persistence/
    │   ├── document-share.entity.ts              ← NUEVO
    │   └── document-share-orm.repository.ts      ← NUEVO
    ├── api/
    │   ├── create-document-share.controller.ts   ← NUEVO (POST /api/documents/:id/share)
    │   ├── get-document-share.controller.ts      ← NUEVO (GET /api/documents/:id/share)
    │   ├── delete-document-share.controller.ts   ← NUEVO (DELETE /api/documents/:id/share)
    │   └── get-public-document.controller.ts     ← NUEVO (GET /api/public/documents/:token — SIN @Auth())
    └── presenters/
        ├── document-share.presenter.ts           ← NUEVO
        └── public-document.presenter.ts          ← NUEVO
```

#### Endpoints

| Método   | Ruta                           | Auth               | Descripción                     |
| -------- | ------------------------------ | ------------------ | ------------------------------- |
| `POST`   | `/api/documents/:id/share`     | JWT + permiso edit | Crear share token               |
| `GET`    | `/api/documents/:id/share`     | JWT + permiso edit | Obtener share activo            |
| `DELETE` | `/api/documents/:id/share`     | JWT + permiso edit | Revocar share token             |
| `GET`    | `/api/public/documents/:token` | ❌ Sin auth        | Obtener doc por token (público) |

#### Tipos de dominio

```typescript
// domain/types/document-share.type.ts
export type DocumentShareType = {
  id: string;
  documentId: string;
  shareToken: string;
  createdBy: string;
  createdAt: Date;
};

// domain/types/public-document.type.ts
export type PublicDocumentType = {
  title: string;
  contentMarkdown: string;
  updatedAt: Date;
};
```

#### Patrones de use cases (sin @Injectable, método run())

```typescript
// create-document-share.use-case.ts
export class CreateDocumentShareUseCase {
  constructor(
    private readonly documentShareRepository: DocumentShareRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(documentId: string, createdBy: string): Promise<DocumentShareType> {
    // Verificar que el documento existe
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) throw this.exception.notFoundException({ ... });

    // Si ya existe un share, retornarlo (idempotente)
    const existing = await this.documentShareRepository.findByDocumentId(documentId);
    if (existing) return existing;

    // Generar token seguro
    const shareToken = crypto.randomBytes(32).toString('hex');
    return await this.documentShareRepository.create({ documentId, shareToken, createdBy });
  }
}
```

#### Controlador público (sin @Auth())

```typescript
// get-public-document.controller.ts
@Controller()
export class GetPublicDocumentController {
  @Get('api/public/documents/:token')
  // NO @Auth() — endpoint público
  async run(@Param('token') token: string) {
    const result = await this.getDocumentByShareToken.run(token);
    return PublicDocumentPresenter.toResponse(result);
  }
}
```

#### DocumentShareRepositoryInterface

```typescript
interface DocumentShareRepositoryInterface {
  create(data: {
    documentId: string;
    shareToken: string;
    createdBy: string;
  }): Promise<DocumentShareType>;
  findByDocumentId(documentId: string): Promise<DocumentShareType | null>;
  findByToken(token: string): Promise<DocumentShareType | null>;
  deleteByDocumentId(documentId: string): Promise<void>;
}
```

#### Wire format (snake_case)

```json
// POST/GET /api/documents/:id/share → 200
{ "share_token": "abc123...", "document_id": "uuid", "created_at": "...", "share_url": "/p/abc123..." }

// GET /api/public/documents/:token → 200
{ "title": "Mi documento", "content_markdown": "# Hola mundo\n...", "updated_at": "..." }

// 404 si el documento no existe o el share fue revocado
{ "code_error": "DOC004", "message": "Documento no encontrado" }
```

### Frontend — Extensiones

#### Nuevos archivos en módulo `documents`

```
modules/documents/
├── domain/
│   └── types/document-share.type.ts      ← NUEVO
└── infrastructure/
    ├── repositories/
    │   └── document-v1.repository.ts     ← AGREGAR métodos de share
    ├── hooks/
    │   └── use-document.viewmodel.ts     ← AGREGAR: createShare, getShare, revokeShare
    └── components/
        └── SharePanel.tsx                ← NUEVO — panel de compartir
```

#### Nuevas rutas Next.js

```
app/
└── p/
    └── [token]/
        └── page.tsx    ← NUEVO — página pública del documento
```

#### proxy.ts — agregar prefijo público

```typescript
// En apps/web/src/proxy.ts
const PUBLIC_PREFIXES = ['/invite', '/p'];
```

#### SharePanel Component

Panel que se muestra como popover/sheet dentro del documento abierto:

- Estado "sin share": botón "Generar link público"
- Estado "con share activo": input readonly con la URL + botón "Copiar" + botón "Revocar"
- Confirmación de revocación inline (sin modal separado — un segundo clic en "Revocar" confirma)
- Loading state mientras se genera/revoca

```typescript
// Lógica de copia al portapapeles
await navigator.clipboard.writeText(shareUrl);
// Mostrar feedback visual: botón cambia a "¡Copiado!" por 2 segundos
```

#### Página pública `/p/[token]`

- CSR (Client Side Rendering) — `'use client'`
- Llama directamente a `GET /api/public/documents/:token` sin auth header (apiClient sin token)
- Renderiza el markdown con el mismo `MarkdownRenderer` que usa el dashboard
- No importa nada del módulo de documentos del dashboard (sin Zustand store)
- Layout mínimo: header con "markdown" + contenido + no footer
- Si 404 → mostrar estado de error sin redirigir

```typescript
// Estructura de la página pública
export default function PublicDocumentPage() {
  const params = useParams();
  const token = params.token as string;
  const [state, setState] = useState<'loading' | 'loaded' | 'not-found'>(
    'loading',
  );
  const [doc, setDoc] = useState<{
    title: string;
    contentMarkdown: string;
  } | null>(null);

  useEffect(() => {
    // fetch sin auth — endpoint público
    fetch(`/api/public/documents/${token}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setDoc({ title: data.title, contentMarkdown: data.content_markdown });
        setState('loaded');
      })
      .catch((status) => setState(status === 404 ? 'not-found' : 'not-found'));
  }, [token]);
  // ...
}
```

**IMPORTANTE:** La página `/p/[token]` debe usar fetch directo al API (no el `apiClient` que agrega auth token), porque es acceso público sin autenticación.

#### Botón "Compartir" en el documento

Agregar a `apps/web/src/app/dashboard/page.tsx` (o al componente de header del documento):

- Visible solo cuando `document.permissionLevel === 'edit'`
- Al hacer clic, llama a `getShare(documentId)` para ver si ya existe share, luego muestra `SharePanel`

### Migración TypeORM

```
apps/api/src/common/database/infrastructure/migrations/
└── {timestamp}-create-document-shares.ts
```

Usar el patrón de migraciones existente. Revisar cualquier migración reciente como ejemplo de la estructura exacta del archivo.

### Tests E2E esperados

Archivo: `e2e/share.spec.ts`

1. **Happy path:** login → abrir documento con permiso edit → clic Compartir → copiar link → logout → acceder al link → ver documento renderizado
2. **Revocación:** generar share → revocar → intentar acceder al link → ver 404
3. **Vista sin permiso:** login como usuario con permiso view → abrir documento → verificar que botón "Compartir" no aparece
4. **Token inválido:** acceder a `/p/token-que-no-existe` → ver pantalla de error

### Puntos clave a no olvidar

- La restricción `UNIQUE (document_id)` en la tabla `document_shares` garantiza idempotencia: si el usuario hace clic dos veces en "Compartir", siempre obtiene el mismo token
- El endpoint `GET /api/public/documents/:token` NO lleva `@Auth()` — verificar que no esté envuelto en un guard global
- En `proxy.ts` agregar `/p` a `PUBLIC_PREFIXES` o la ruta será redirigida a sign-in para usuarios no autenticados
- El cascade delete (`ON DELETE CASCADE` en la FK) maneja automáticamente el AC#7 (share inválido al eliminar documento)
- El `PublicDocumentPresenter` solo expone `title`, `content_markdown`, `updated_at` — NO exponer `id`, `folder_id`, `created_by` ni `yjs_state`
- Usar `crypto` del módulo nativo de Node.js para generar el token — no instalar librerías adicionales

## Tasks

- [ ] 1. Crear migración TypeORM `create-document-shares` con la tabla y sus constraints
- [ ] 2. Crear `DocumentShareEntity` + `DocumentShareOrmRepository` (implementa `findByDocumentId`, `findByToken`, `create`, `deleteByDocumentId`)
- [ ] 3. Crear domain types: `DocumentShareType`, `PublicDocumentType`
- [ ] 4. Crear 4 use cases: `CreateDocumentShareUseCase`, `GetDocumentShareUseCase`, `DeleteDocumentShareUseCase`, `GetDocumentByShareTokenUseCase`
- [ ] 5. Crear 4 controllers: `CreateDocumentShareController`, `GetDocumentShareController`, `DeleteDocumentShareController`, `GetPublicDocumentController` (sin @Auth)
- [ ] 6. Crear presenters: `DocumentSharePresenter`, `PublicDocumentPresenter`
- [ ] 7. Registrar todo en `DocumentsModule` con useFactory (sin crear módulo nuevo)
- [ ] 8. Frontend: agregar métodos de share al repository y viewmodel de documentos
- [ ] 9. Frontend: crear componente `SharePanel`
- [ ] 10. Frontend: agregar botón "Compartir" en la vista del documento (solo para permiso edit)
- [ ] 11. Frontend: crear página `/p/[token]/page.tsx` con layout mínimo y fetch público
- [ ] 12. Frontend: agregar `/p` a `PUBLIC_PREFIXES` en `proxy.ts`
- [ ] 13. Escribir tests E2E en `e2e/share.spec.ts`
