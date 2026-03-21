---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-20'
inputDocuments:
  - product-brief-markdown-2026-03-18.md
  - prd.md
  - ux-design-specification.md
  - clean-architecture-reference.md
workflowType: 'architecture'
project_name: 'markdown'
user_name: 'Juan David'
date: '2026-03-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (39 FRs en 7 categorías):**

| Categoría | FRs | Implicación Arquitectónica |
|-----------|-----|---------------------------|
| Edición de Documentos (FR1-FR8) | 3 modos de vista, toolbar, sync scroll, temas | Componente de editor complejo basado en CodeMirror 6. Patrón de modos como estrategia de UI, no como componentes separados |
| Colaboración en Tiempo Real (FR9-FR12) | Edición simultánea, presencia, reconciliación, reconexión | **Ruta crítica**: CRDTs (Yjs) + WebSocket. Requiere servidor de sincronización dedicado. Manejo de estado offline con cola de cambios |
| Historial de Cambios (FR13-FR15) | Historial completo, revert, auditoría por autor | Snapshots periódicos del documento CRDT. Storage inmutable de versiones. Diff engine para visualización |
| Gestión de Documentos y Carpetas (FR16-FR20) | CRUD carpetas, mover docs, import/export, búsqueda | Modelo jerárquico de carpetas. Full-text search index. Operaciones de archivo (upload/download .md) |
| Gestión de Usuarios (FR21-FR24) | Auth, invitaciones, grupos, asignación | Sistema de autenticación con JWT. Modelo de usuarios, grupos y membresías |
| Permisos y Control de Acceso (FR25-FR28) | Permisos por carpeta/grupo (ver/editar), restricciones | Middleware de autorización que se aplica en REST, WebSocket y MCP. Modelo de permisos: grupo × carpeta → (none/view/edit) |
| Integración MCP (FR29-FR36) | Server MCP, CRUD vía IA, API keys, herencia de permisos | Servidor MCP como servicio independiente. Autenticación por API key mapeada a usuario. Reutiliza la misma capa de permisos |

**Non-Functional Requirements (29 NFRs):**

| Categoría | NFRs Clave | Decisiones Arquitectónicas que Fuerzan |
|-----------|-----------|---------------------------------------|
| Rendimiento | Editor < 100ms, propagación < 1s, LCP < 3s, bundle < 500KB | CodeMirror 6 (ligero), code splitting, lazy loading, WebSocket optimizado |
| Seguridad | HTTPS/WSS, bcrypt, tokens revocables, API keys revocables, XSS/CSRF/SQLi, CSP | HTTPS obligatorio, sanitización de markdown renderizado (DOMPurify), helmet para headers |
| Fiabilidad | Cero pérdida de datos, historial inmutable, reconexión automática, uptime 99.5% | Persistencia confirma antes de ACK. Historial append-only. Cola de cambios offline. Health checks |
| Integración MCP | Lectura < 500ms, protocolo estándar, mismos permisos, errores descriptivos | MCP Server usa misma capa de servicios que REST API. Respuestas de error estandarizadas |
| Usabilidad | Primera edición < 2min, navegación teclado, contraste 4.5:1, responsive | Accesibilidad WCAG AA nativa vía Radix UI. Mobile-first CSS. Skip links |
| Mantenibilidad | Deploy en 5 pasos, migraciones automáticas | Docker compose para self-hosting. ORM con migraciones automáticas |

**Scale & Complexity:**

- Dominio primario: Full-stack web app colaborativa en tiempo real
- Nivel de complejidad: **Media** — real-time con CRDTs es el componente complejo, pero sin regulación, multi-tenancy, ni integraciones externas masivas
- Usuarios concurrentes objetivo: 10 simultáneos (equipo pequeño)
- Componentes arquitectónicos estimados: ~8-10 módulos (auth, users, groups, folders, documents, collaboration, history, mcp)

### Technical Constraints & Dependencies

**Restricciones definidas por el proyecto:**
- **Self-hosted**: La aplicación debe desplegarse como un paquete autosuficiente (Docker compose)
- **Un solo desarrollador + IA**: Maximizar uso de librerías probadas, minimizar complejidad custom
- **Open source futuro**: Decisiones tech deben favorecer ecosistemas con comunidad activa
- **100% markdown nativo**: Sin capas WYSIWYG — todo es markdown por debajo
- **Online obligatorio**: No hay modo offline completo (la cola de reconexión es temporal, no persistente)

**Restricciones de la referencia Clean Architecture:**
- Monorepo con `apps/` (api + backoffice) y `packages/` (configs compartidas)
- Separación estricta Domain → Application → Infrastructure
- Un archivo por responsabilidad
- DI explícita con providers/tokens
- ACL entre módulos (anti-corruption layer)
- Frontend con MVVM (ViewModels como hooks)
- No compartir tipos entre backend y frontend
- snake_case en wire format, camelCase en dominio

**Dependencias técnicas clave identificadas:**
- CRDTs: Yjs (o Automerge) — ruta crítica, validar primero
- Editor: CodeMirror 6 — integración nativa con Yjs
- WebSocket: para sincronización en tiempo real
- MCP SDK: SDK oficial de Anthropic para servidor MCP
- Design System: shadcn/ui + Tailwind CSS + Radix UI

### Cross-Cutting Concerns Identified

1. **Autenticación y Autorización**: Permea REST API, WebSocket connections, y MCP Server. Debe ser un módulo compartido con middleware reutilizable
2. **Sincronización en Tiempo Real**: Afecta documentos, presencia de usuarios, cursores, y notificación de cambios en sidebar (nuevo documento vía MCP)
3. **Modelo de Permisos**: Grupo × Carpeta → (none/view/edit). Debe validarse en cada capa de acceso de forma consistente
4. **Manejo de Errores**: Patrón dual-message (cliente vs servidor) definido en la referencia. Interceptor global + códigos por módulo
5. **Logging y Auditoría**: Historial inmutable de cambios. Request ID para trazabilidad. Registro de operaciones MCP
6. **Sanitización de Contenido**: El markdown renderizado debe sanitizarse para prevenir XSS — afecta preview web y posiblemente respuestas MCP

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web app colaborativa en tiempo real, basada en monorepo TypeScript con NestJS (backend) y Next.js (frontend).

### Starter Seleccionado: create-turbo (ya inicializado)

**Rationale:** El proyecto ya fue inicializado con `create-turbo` y la estructura actual se alinea directamente con los patrones definidos en la referencia de Clean Architecture (monorepo con `apps/` + `packages/`). No hay necesidad de cambiar de starter.

**Comando de inicialización (ya ejecutado):**

```bash
npx create-turbo@latest markdown
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.5.4 (backend) / 5.8.2 (frontend)
- Node.js ≥ 18
- ESM modules en frontend (`"type": "module"`)

**Framework Stack:**
- Backend: NestJS 11.1.11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- Frontend: Next.js 16.2.0 con React 19.1.0, Turbopack habilitado
- Monorepo: Turborepo 2.8.19 con pnpm workspaces

**Shared Packages:**
- `@repo/ui` — Componentes compartidos (base para shadcn/ui)
- `@repo/eslint-config` — Configuración ESLint compartida
- `@repo/jest-config` — Configuración Jest compartida
- `@repo/typescript-config` — TSConfig compartida
- `@repo/api` — Contratos/tipos de API compartidos

**Testing:**
- Jest 30 con ts-jest para unit tests
- Supertest para integration/E2E tests del API

**Development Experience:**
- `turbo run dev` — desarrollo paralelo de todas las apps
- Turbopack para hot reload rápido en Next.js
- NestJS `--watch` mode para hot reload del API
- Prettier para formateo consistente

### Technologies to Add

| Categoría | Paquete | Versión | App/Package |
|-----------|---------|---------|-------------|
| **Database** | `typeorm`, `pg` | 0.3.28 | `apps/api` |
| **Colaboración** | `yjs` | 13.6.30 | `apps/api` + `apps/web` |
| **Editor** | `@codemirror/*`, `y-codemirror.next` | Latest, 0.3.5 | `apps/web` |
| **Design System** | `shadcn/ui`, `tailwindcss`, `radix-ui` | CLI v4 | `apps/web` + `packages/ui` |
| **State** | `zustand` | Latest | `apps/web` |
| **DI Frontend** | `inversify`, `reflect-metadata` | Latest | `apps/web` |
| **MCP** | `@modelcontextprotocol/sdk` | Latest | `apps/api` |
| **Auth** | `@nestjs/jwt`, `bcrypt`, `passport` | Latest | `apps/api` |
| **WebSocket** | `@nestjs/websockets`, `y-websocket` | Latest | `apps/api` |
| **Infra** | Docker, Docker Compose | — | Root |

### Real-Time Architecture Decision: WebSocket Only (sin WebRTC)

**Decisión:** Usar exclusivamente WebSocket vía `y-websocket` como transporte para Yjs. No se incluye WebRTC (`y-webrtc`).

**Rationale:**

1. **MCP necesita al servidor como participante activo** — Cuando Claude edita vía MCP, el servidor modifica el Y.Doc directamente y lo propaga a todos los clientes. Con WebSocket esto es natural. Con WebRTC el servidor no es un peer y requeriría un puente complejo.
2. **Persistencia obligatoria en servidor** — Los NFRs exigen cero pérdida de datos e historial inmutable. El servidor recibe cada cambio vía WebSocket y puede persistir a PostgreSQL directamente.
3. **Escala de 10 usuarios** — WebRTC brilla con cientos de usuarios. Con 10 concurrentes, WebSocket maneja la carga sin problema.
4. **Self-hosted = control del servidor** — No se necesita P2P para reducir costos.
5. **Simplicidad** — Una sola capa de transporte simplifica debug, monitoreo y mantenimiento.

**Flujo de sincronización:**

```
                     ┌─────────────────────────┐
                     │     PostgreSQL           │
                     │  (documentos + historial)│
                     └──────────┬──────────────┘
                                │ persiste
                     ┌──────────▼──────────────┐
                     │   NestJS API Server      │
                     │                          │
                     │  ┌────────────────────┐  │
  MCP Client ───────►│  │  Yjs Y.Doc (memory) │  │◄──── REST API
  (Claude Code)      │  │  por documento      │  │     (CRUD carpetas,
                     │  └────────┬───────────┘  │      usuarios, etc.)
                     │           │               │
                     │  ┌────────▼───────────┐  │
                     │  │  WebSocket Gateway  │  │
                     │  │  (y-websocket)      │  │
                     │  │  + Awareness        │  │
                     │  └────────┬───────────┘  │
                     └───────────┼──────────────┘
                        WSS      │
              ┌──────────┬───────┴────────┐
              ▼          ▼                ▼
         Browser 1   Browser 2       Browser 3
         (Carlos)    (Valentina)      (Diego)
         CodeMirror  CodeMirror       Preview
         + Yjs       + Yjs           + Yjs
         + Awareness + Awareness     + Awareness
```

- Cada browser conecta vía WebSocket al servidor
- Yjs sincroniza cambios entre todos los clientes a través del servidor
- El servidor mantiene el Y.Doc en memoria y persiste snapshots a PostgreSQL
- Cuando MCP edita, modifica el Y.Doc en el servidor → se propaga a todos los browsers
- Awareness protocol (cursores, presencia) viaja por el mismo WebSocket

**Note:** La inicialización del proyecto ya fue ejecutada. La primera story de implementación debe enfocarse en configurar las tecnologías adicionales sobre esta base.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Persistencia de documentos Yjs: Binary snapshot + markdown texto
- Historial: Snapshots + Yjs updates log (cero pérdida de datos)
- Auth: Access + Refresh tokens con HTTP-only cookies
- Real-time sync: WebSocket only via y-websocket
- MCP modifica Y.Doc directamente en memoria

**Important Decisions (Shape Architecture):**
- Single server MVP, interfaces preparadas para Redis pub/sub
- PostgreSQL para todo el storage en MVP
- react-markdown + rehype-highlight para preview
- Swagger/OpenAPI automático desde DTOs
- GitHub Actions para CI básico

**Deferred Decisions (Post-MVP):**
- Redis pub/sub para multi-servidor (Fase 2)
- Object storage (MinIO/S3) para blobs de Yjs (Fase 2 si escala lo requiere)
- Winston/Pino para logging avanzado (Fase 2)
- Prometheus/Grafana para monitoring (Fase 2)

### Data Architecture

| Decisión | Elección | Versión | Rationale |
|----------|---------|---------|-----------|
| Base de datos | PostgreSQL | 16 | Robusta, full-text search nativo, soporte Yjs blobs como bytea |
| ORM | TypeORM | 0.3.28 | Alineado con referencia Clean Architecture, migraciones automáticas |
| Persistencia docs | Binary snapshot + markdown texto | — | Búsqueda sobre markdown en DB + restauración CRDT desde blobs |
| Historial | Snapshots periódicos + Yjs updates log | — | Cero pérdida de datos. Replay granular desde último snapshot + updates |
| Storage | PostgreSQL para todo (MVP) | — | Simplicidad. Migración a object storage para blobs en Fase 2 |
| Cache | Y.Docs en memoria del proceso | — | Suficiente para 10 usuarios. Redis en Fase 2 con multi-servidor |
| Multi-servidor | Single instance MVP, interfaces para Redis pub/sub | — | DocumentSyncServiceInterface abstrae el transporte. Cambio transparente |

**Modelo de datos principal:**

```
documents
  ├── id, folder_id, title, slug
  ├── content_markdown (TEXT) ← para búsqueda full-text
  ├── yjs_snapshot (BYTEA) ← último snapshot del Y.Doc
  ├── created_by, created_at, updated_at

document_updates
  ├── id, document_id
  ├── yjs_update (BYTEA) ← update incremental de Yjs
  ├── author_id, created_at

document_snapshots (historial)
  ├── id, document_id
  ├── yjs_snapshot (BYTEA)
  ├── content_markdown (TEXT) ← snapshot del texto en ese momento
  ├── author_id, created_at

folders
  ├── id, parent_id, name, slug, created_at

users
  ├── id, name, email, password_hash, is_admin, created_at

groups
  ├── id, name, created_at

user_groups
  ├── user_id, group_id

folder_permissions
  ├── id, folder_id, group_id
  ├── permission_level (ENUM: 'view' | 'edit')

api_keys
  ├── id, user_id, key_hash, prefix (mk_xxxx)
  ├── name, is_active, created_at, last_used_at
```

### Authentication & Security

| Decisión | Elección | Rationale |
|----------|---------|-----------|
| Estrategia JWT | Access token (15-30min) + Refresh token (7-30 días) | Seguridad estándar. Access expira rápido, refresh renueva sin re-login |
| Storage tokens | HTTP-only cookie para refresh token. Access token en cookie normal o memoria para decodificar permisos en frontend | Protección contra XSS para el refresh token |
| Auth WebSocket | Token JWT en query param del handshake | Patrón estándar con Yjs. Guard de NestJS valida antes de aceptar conexión |
| Password hashing | bcrypt | NFR9 lo requiere |
| API Keys MCP | `mk_` + UUID v4, hash almacenado en DB. Máximo 3 por usuario | Revocación inmediata. Herencia de permisos del usuario |
| CORS | Configurable via `CORS_ORIGIN` env var. `*` en dev, dominio específico en prod | Self-hosted = admin controla el dominio |
| Headers seguridad | Helmet (CSP, X-Frame-Options, X-Content-Type-Options, HSTS) | NFR13 |
| Sanitización | DOMPurify server-side para markdown renderizado | NFR14 — prevenir XSS en contenido markdown |

### API & Communication Patterns

| Decisión | Elección | Rationale |
|----------|---------|-----------|
| API Design | REST para CRUD. WebSocket para real-time. MCP para IA | Cada canal optimizado para su propósito |
| Rate Limiting | `@nestjs/throttler` — por usuario + IP. Estricto en login (5/min), generoso en API auth (100/min) | Protección brute force sin afectar UX |
| Documentación API | `@nestjs/swagger` — generación automática desde DTOs y decoradores | Bajo esfuerzo, alto valor para open source |
| Validación entrada | `class-validator` + `ValidationPipe` global | Definido por referencia Clean Architecture |
| Serialización | Presenters (dominio → wire format snake_case) | Definido por referencia |
| Error handling | Interceptor global + códigos dual-message por módulo | Definido por referencia |
| Response wrapper | `{ data, path, duration, requestId, method }` | Definido por referencia |
| MCP ↔ Yjs | MCP modifica Y.Doc directamente via DocumentSyncService | Acceso directo en memoria. Yjs propaga a browsers. Eficiente y consistente |

### Frontend Architecture

| Decisión | Elección | Versión | Rationale |
|----------|---------|---------|-----------|
| Markdown rendering | react-markdown + remark-gfm + rehype | Latest | Componentes React nativos, extensible, sanitización integrada |
| Syntax highlighting | rehype-highlight (highlight.js) | Latest | Ligero, suficiente para documentación. Migrable a Shiki en Fase 2 |
| Code splitting | Next.js automático por ruta + `dynamic()` para CodeMirror | — | Bundle < 500KB. Visualizador carga sin CodeMirror |
| SSR vs CSR | CSR para app autenticada. Middleware Next.js para protección de rutas | — | Sin SEO necesario. Server Components no aportan valor aquí |
| Editor | CodeMirror 6 + y-codemirror.next | Latest, 0.3.5 | Integración nativa con Yjs. Ligero y extensible |
| State | Zustand (stores por módulo) + Inversify (DI) | Latest | Definido por referencia Clean Architecture frontend |
| Design System | shadcn/ui CLI v4 + Tailwind CSS + Radix UI | Marzo 2026 | Definido por UX spec |
| Patrón UI | MVVM — ViewModels como custom hooks | — | Definido por referencia |

### Infrastructure & Deployment

| Decisión | Elección | Rationale |
|----------|---------|-----------|
| Containerización | Docker + Docker Compose | Self-hosted en 5 pasos (NFR28) |
| Services | `api` (NestJS + WS + MCP), `web` (Next.js), `postgres` (PostgreSQL 16) | MCP dentro de NestJS — acceso directo a Y.Docs |
| Environment | `@nestjs/config` + `.env` + validación al arrancar | Fail fast si falta configuración |
| Logging | NestJS Logger nativo + LoggingInterceptor | Suficiente para MVP. stdout + Docker logs |
| CI/CD | GitHub Actions — lint, test, build en cada PR | Estándar open source. Deploy manual con Docker |
| Health checks | `GET /api/health` — verifica PostgreSQL + WebSocket server | Base para uptime 99.5% |
| Restart policy | `unless-stopped` en Docker Compose | Recuperación automática ante crashes |
| Monitoring | Docker logs + health endpoint (MVP). Prometheus/Grafana en Fase 2 | Proporcional a la escala |

### Decision Impact Analysis

**Implementation Sequence:**

1. Docker Compose + PostgreSQL + environment config
2. NestJS base: auth module (JWT + bcrypt + guards), users, groups
3. Folders + permissions module
4. Documents module + TypeORM entities + migraciones
5. Yjs integration: DocumentSyncService + WebSocket gateway + persistence
6. MCP Server module (reutiliza DocumentSyncService + auth por API key)
7. Frontend: Next.js + shadcn/ui + routing + auth middleware
8. Editor: CodeMirror 6 + Yjs client + awareness (cursores/presencia)
9. Preview: react-markdown + rehype-highlight
10. Toolbar markdown + sync scroll + mode switching
11. Historial de cambios UI + versión restore
12. Admin: gestión de carpetas, grupos, permisos, invitaciones
13. Búsqueda full-text + import/export
14. Swagger docs + GitHub Actions CI

**Cross-Component Dependencies:**

```
Auth Module ──────► guards compartidos por REST, WebSocket, y MCP
                    │
Permissions Module ─► validación en controllers, WS gateway, y MCP handlers
                    │
DocumentSyncService ► compartido entre WebSocket gateway y MCP module
                    │
Yjs (Y.Doc) ───────► persistence (TypeORM), WebSocket (propagación), MCP (edición directa)
                    │
Design Tokens ─────► shadcn/ui, MarkdownPreview, MarkdownEditor, todos los componentes
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming:**

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas | snake_case, plural | `documents`, `folder_permissions`, `api_keys` |
| Columnas | snake_case | `created_at`, `folder_id`, `content_markdown` |
| Foreign keys | `{tabla_singular}_id` | `user_id`, `document_id`, `group_id` |
| Índices | `idx_{tabla}_{columnas}` | `idx_documents_folder_id`, `idx_users_email` |
| Enums en DB | lowercase valores | `'view'`, `'edit'` |
| Timestamps | `created_at`, `updated_at` siempre presentes | — |

**API Naming:**

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Endpoints REST | `/api/{recurso_plural}` | `/api/documents`, `/api/folders`, `/api/groups` |
| Parámetro de ruta | `:id` | `/api/documents/:id` |
| Query params | snake_case | `?folder_id=5&page=1&size=10` |
| Request/Response body | snake_case | `{ "folder_id": 5, "title": "Brief" }` |
| Headers custom | `X-Request-Id` | — |
| MCP operations | snake_case, verbo_recurso | `list_documents`, `read_document`, `edit_document`, `create_document`, `list_folders` |
| WebSocket events | dot.notation | `document.updated`, `presence.joined`, `presence.left` |

**Code Naming:**

| Contexto | Convención | Ejemplo |
|----------|-----------|---------|
| **Backend** | | |
| Types/Interfaces | PascalCase | `DocumentType`, `DocumentRepositoryInterface` |
| Enums | PascalCase + Enum suffix | `DocumentStatusEnum`, `FolderProvidersEnum` |
| Use Cases | PascalCase, acción-recurso | `CreateDocumentUseCase`, `FindAllDocumentsUseCase` |
| Controllers | PascalCase, acción-recurso | `CreateDocumentController` |
| DTOs | PascalCase, acción-recurso | `CreateDocumentDto` |
| Error codes | UPPERCASE 3-letra + número | `DOC001`, `FLD100`, `USR002` |
| Archivos | kebab-case con sufijo | `create-document.use-case.ts`, `document-orm.repository.ts` |
| **Frontend** | | |
| Componentes React | PascalCase archivo y export | `DocumentEditor.tsx`, `FolderTree.tsx` |
| Hooks/ViewModels | camelCase con `use` prefix | `useDocumentsViewModel`, `useAuthStore` |
| Stores Zustand | camelCase con `use` y `Store` | `useDocumentsStore`, `useAuthStore` |
| Archivos generales | kebab-case | `document-v1.repository.ts` |
| DI Providers (frontend) | UPPER_SNAKE_CASE symbols | `DOCUMENT_PROVIDERS.DocumentRepository` |
| Domain entities | PascalCase, sin suffix | `Document`, `Folder`, `User` |

### Structure Patterns

**Backend Module Structure:**

```
apps/api/src/modules/{feature}/
├── domain/
│   ├── enums/              # Un enum por archivo
│   ├── interfaces/         # Un contrato por archivo
│   ├── types/              # Un type por archivo
│   ├── services/           # Servicios de dominio (validación)
│   ├── {feature}-providers.enum.ts
│   ├── {feature}-errors.codes.ts
│   └── index.ts
├── application/
│   └── use-cases/
│       ├── {action}-{feature}.use-case.ts
│       └── __tests__/      # Tests co-located con use cases
└── infrastructure/
    ├── api/
    │   └── {action}-{feature}.controller.ts
    ├── dto/
    ├── persistence/
    │   ├── {feature}.entity.ts
    │   └── {feature}-orm.repository.ts
    ├── presenters/
    ├── services/           # ACL services
    └── {feature}.module.ts
```

**Frontend Module Structure:**

```
apps/web/src/modules/{feature}/
├── domain/
│   ├── entities/           # Interface de la entidad
│   ├── repositories/       # Interface (contrato)
│   └── types/              # Providers, permissions
├── application/
│   └── use-cases/
└── infrastructure/
    ├── repositories/       # {feature}-v1.repository.ts
    ├── hooks/              # ViewModels (use-{feature}.viewmodel.ts)
    ├── components/         # React components (PascalCase)
    ├── state/              # Zustand store
    └── {feature}.module.ts # Registro DI
```

**Módulos Backend:**

| Módulo | Responsabilidad |
|--------|----------------|
| `auth` | JWT, bcrypt, guards, refresh tokens |
| `users` | CRUD usuarios, invitaciones |
| `groups` | CRUD grupos, membresías |
| `folders` | CRUD carpetas, jerarquía |
| `permissions` | Permisos grupo × carpeta |
| `documents` | CRUD documentos, markdown texto |
| `collaboration` | Yjs Y.Docs, WebSocket gateway, awareness, persistence de updates |
| `history` | Snapshots, restore, diff |
| `mcp` | MCP Server, API keys, operaciones CRUD vía MCP |
| `search` | Full-text search sobre documentos |
| `common` | Exception service, logger, guards, interceptors, helpers |

**Módulos Frontend:**

| Módulo | Responsabilidad |
|--------|----------------|
| `auth` | Login, registro, JWT store, middleware |
| `documents` | Editor, preview, toolbar, mode switching |
| `collaboration` | Yjs client, awareness, cursores remotos, presencia |
| `folders` | Sidebar, tree navigation, CRUD carpetas |
| `history` | Activity panel, version timeline, diff view |
| `admin` | Gestión grupos, permisos, invitaciones, API keys |
| `search` | Command palette (Cmd/Ctrl+K), búsqueda global |
| `common` | API client, base store, DI container, shared components |

**Tests:**

| Tipo | Ubicación | Naming |
|------|-----------|--------|
| Unit tests (use cases) | `application/use-cases/__tests__/` | `{action}-{feature}.use-case.spec.ts` |
| E2E tests (API) | `apps/api/test/` | `{feature}.e2e-spec.ts` |

### Format Patterns

**API Response Format:**

```typescript
// Éxito
{
  "data": { ... },
  "path": "/api/documents",
  "request_id": "abc-123",
  "duration": "45ms",
  "method": "POST"
}

// Error
{
  "code_error": "DOC001",
  "message": "Document not found.",        // Para el cliente
  "path": "/api/documents/99",
  "request_id": "abc-123",
  "method": "GET"
}
// serverMessage se loguea en servidor, NUNCA se envía al cliente
```

**MCP Response Format:**

```typescript
// MCP éxito - list_documents
{
  "documents": [
    { "id": 1, "title": "Brief", "folder": "Marketing", "updated_at": "2026-03-20T..." }
  ]
}

// MCP éxito - read_document
{
  "id": 1,
  "title": "Brief",
  "content": "# Brief\n\nContenido markdown...",
  "updated_at": "2026-03-20T..."
}

// MCP error - permisos
{
  "error": "PERMISSION_DENIED",
  "message": "You don't have edit permission on folder 'Técnico'. Your group 'Marketing' has view-only access.",
  "required_permission": "edit",
  "current_permission": "view"
}
```

**WebSocket Events Format:**

```typescript
// Yjs sync — protocolo y-websocket nativo (binary)
// No definimos formato custom — usamos el protocolo estándar de Yjs

// Awareness (cursores, presencia) — protocolo estándar de Yjs
{
  user: { id: 1, name: "Carlos", color: "#2F81F7" },
  cursor: { anchor: 150, head: 150 },
  isAI: false
}

// Awareness MCP (cursor de IA)
{
  user: { id: 0, name: "Claude", color: "#9333EA" },
  cursor: { anchor: 150, head: 200 },
  isAI: true
}
```

**Date Formats:**

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| API responses | ISO 8601 string | `"2026-03-20T14:32:00.000Z"` |
| Base de datos | `timestamp with time zone` | — |
| UI display | Relativo para reciente, absoluto para antiguo | "hace 2 min" / "19 mar 2026, 14:32" |

### Communication Patterns

**Error Codes por Módulo:**

| Módulo | Prefijo | Negocio (001-099) | Infraestructura (100+) |
|--------|---------|-------------------|----------------------|
| Auth | `AUT` | `AUT001` invalid credentials | `AUT100` failed to query user |
| Users | `USR` | `USR001` user not found | `USR100` failed to store user |
| Groups | `GRP` | `GRP001` group not found | `GRP100` failed to query group |
| Folders | `FLD` | `FLD001` folder not found | `FLD100` failed to query folder |
| Documents | `DOC` | `DOC001` document not found | `DOC100` failed to query document |
| Permissions | `PRM` | `PRM001` insufficient permissions | `PRM100` failed to query permissions |
| Collaboration | `COL` | `COL001` document not available | `COL100` sync failed |
| MCP | `MCP` | `MCP001` invalid API key | `MCP100` failed to process operation |
| History | `HST` | `HST001` snapshot not found | `HST100` failed to store snapshot |

**State Management:**

```typescript
// Zustand store por módulo — siempre heredar de createBaseStore (loading, error incluidos)
export const useDocumentsStore = createBaseStore<DocumentsState>((set) => ({
  documents: [],
  currentDocument: null,
  // SIEMPRE inmutable — nunca mutar estado directamente
  addDocument: (doc) => set((s) => ({ documents: [...s.documents, doc] })),
  updateDocument: (doc) => set((s) => ({
    documents: s.documents.map((d) => (d.id === doc.id ? doc : d))
  })),
}));
```

### Process Patterns

**Error Handling por Capa:**

| Capa | try/catch | Responsabilidad |
|------|-----------|----------------|
| Controller | NO | Parsear request, llamar use case, retornar presenter |
| Use Case | NO (lanza excepciones de negocio) | Validar, orquestar, lanzar `exception.notFoundException()` etc. |
| Repository | SÍ (captura errores de DB) | Convertir error de DB a código de módulo (`DOC100`) |
| Interceptor Global | SÍ (captura todo lo demás) | Unhandled → 500 |

**Loading States:**

```typescript
// Frontend: loading siempre en el store via createBaseStore
// El ViewModel gestiona setLoading(true/false)
// El componente solo consume: if (loading) return <Skeleton />
// NUNCA loading state local en componentes — siempre en el store
```

**Autenticación Pattern:**

```typescript
// Backend: Guard reutilizable para las 3 capas
// REST: @Auth({ permissions: [FolderPermissions.EDIT] }) en controller
// WebSocket: WsAuthGuard valida token del handshake
// MCP: ApiKeyAuthGuard valida API key, resuelve usuario y permisos
// SIEMPRE: validar permisos en controller/gateway, NUNCA en use case
// Los use cases reciben authUser ya validado
```

**Yjs Lifecycle Pattern:**

```typescript
// 1. Browser abre documento → conecta WebSocket con JWT
// 2. Server: WsAuthGuard valida → verifica permiso sobre folder del documento
// 3. Server: DocumentSyncService.getOrLoadDocument(id)
//    - Si Y.Doc en memoria → retornar
//    - Si no → cargar último snapshot + aplicar updates posteriores → retornar
// 4. Yjs sync protocol maneja la sincronización bidireccional
// 5. Cada update del cliente → persistir en document_updates
// 6. Periódicamente (cada 60s de actividad) → crear snapshot en document_snapshots
// 7. Al desconectar último cliente → flush final, liberar Y.Doc de memoria después de timeout (5min)
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Seguir la estructura de módulos de Clean Architecture exactamente — domain/application/infrastructure
2. Un archivo = una responsabilidad (un type, un use case, un controller, un componente)
3. Usar los sufijos de naming correctos (`.use-case.ts`, `.controller.ts`, `.dto.ts`, `.entity.ts`, etc.)
4. NUNCA importar de infrastructure en domain o application
5. NUNCA usar try/catch en controllers ni use cases — solo en repositories
6. NUNCA compartir tipos entre `apps/api` y `apps/web` — cada app define sus propios tipos
7. Usar snake_case en wire format (DTOs, API responses) y camelCase en dominio
8. Usar el ExceptionService para lanzar errores de negocio en use cases
9. Registrar cada módulo con DI explícita (providers con factory en backend, module.register() en frontend)
10. Todos los componentes React consumen datos exclusivamente desde ViewModels (hooks), nunca llamando use cases directamente

**Pattern Verification:**
- ESLint rules para import boundaries (domain no importa infrastructure)
- TypeScript strict mode habilitado
- CI ejecuta lint + tests en cada PR

## Project Structure & Boundaries

### Complete Project Directory Structure

```
markdown/
├── .github/
│   └── workflows/
│       └── ci.yml                          # Lint + test + build en cada PR
├── apps/
│   ├── api/                                # NestJS Backend (API + WebSocket + MCP)
│   │   ├── src/
│   │   │   ├── main.ts                     # Bootstrap NestJS + WebSocket
│   │   │   ├── app.module.ts               # Root module
│   │   │   ├── config/
│   │   │   │   ├── app.config.ts           # @nestjs/config validation (Joi)
│   │   │   │   └── database.config.ts      # TypeORM datasource config
│   │   │   ├── database/
│   │   │   │   ├── migrations/             # TypeORM migrations
│   │   │   │   └── seeds/                  # Data seeds (admin user inicial)
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── interfaces/
│   │   │   │   │   │   │   └── auth-service.interface.ts
│   │   │   │   │   │   ├── types/
│   │   │   │   │   │   │   ├── authenticated-user.type.ts
│   │   │   │   │   │   │   ├── sign-in.type.ts
│   │   │   │   │   │   │   └── token-payload.type.ts
│   │   │   │   │   │   ├── auth-providers.enum.ts
│   │   │   │   │   │   ├── auth-errors.codes.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── sign-in.use-case.ts
│   │   │   │   │   │       ├── refresh-token.use-case.ts
│   │   │   │   │   │       └── __tests__/
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── api/
│   │   │   │   │       │   ├── sign-in.controller.ts
│   │   │   │   │       │   └── refresh-token.controller.ts
│   │   │   │   │       ├── dto/
│   │   │   │   │       │   └── sign-in.dto.ts
│   │   │   │   │       ├── guards/
│   │   │   │   │       │   ├── jwt-auth.guard.ts
│   │   │   │   │       │   ├── ws-auth.guard.ts
│   │   │   │   │       │   └── api-key-auth.guard.ts
│   │   │   │   │       ├── strategies/
│   │   │   │   │       │   └── jwt.strategy.ts
│   │   │   │   │       └── auth.module.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── interfaces/
│   │   │   │   │   │   │   └── user-repository.interface.ts
│   │   │   │   │   │   ├── types/
│   │   │   │   │   │   │   ├── user.type.ts
│   │   │   │   │   │   │   ├── create-user.type.ts
│   │   │   │   │   │   │   └── update-user.type.ts
│   │   │   │   │   │   ├── users-providers.enum.ts
│   │   │   │   │   │   ├── users-errors.codes.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── create-user.use-case.ts
│   │   │   │   │   │       ├── find-all-users.use-case.ts
│   │   │   │   │   │       ├── invite-user.use-case.ts
│   │   │   │   │   │       └── __tests__/
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── api/
│   │   │   │   │       ├── dto/
│   │   │   │   │       ├── persistence/
│   │   │   │   │       │   ├── user.entity.ts
│   │   │   │   │       │   └── user-orm.repository.ts
│   │   │   │   │       ├── presenters/
│   │   │   │   │       │   └── user.presenter.ts
│   │   │   │   │       └── users.module.ts
│   │   │   │   ├── groups/
│   │   │   │   │   ├── domain/
│   │   │   │   │   ├── application/
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       └── groups.module.ts
│   │   │   │   ├── folders/
│   │   │   │   │   ├── domain/
│   │   │   │   │   ├── application/
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       └── folders.module.ts
│   │   │   │   ├── permissions/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── interfaces/
│   │   │   │   │   │   │   └── permission-repository.interface.ts
│   │   │   │   │   │   ├── types/
│   │   │   │   │   │   │   ├── folder-permission.type.ts
│   │   │   │   │   │   │   └── permission-level.enum.ts
│   │   │   │   │   │   └── permissions-errors.codes.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── check-permission.use-case.ts
│   │   │   │   │   │       └── assign-permission.use-case.ts
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       └── permissions.module.ts
│   │   │   │   ├── documents/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── interfaces/
│   │   │   │   │   │   │   └── document-repository.interface.ts
│   │   │   │   │   │   ├── types/
│   │   │   │   │   │   │   ├── document.type.ts
│   │   │   │   │   │   │   ├── create-document.type.ts
│   │   │   │   │   │   │   └── update-document.type.ts
│   │   │   │   │   │   ├── documents-providers.enum.ts
│   │   │   │   │   │   └── documents-errors.codes.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── create-document.use-case.ts
│   │   │   │   │   │       ├── find-document.use-case.ts
│   │   │   │   │   │       ├── update-document.use-case.ts
│   │   │   │   │   │       ├── delete-document.use-case.ts
│   │   │   │   │   │       ├── import-document.use-case.ts
│   │   │   │   │   │       ├── export-document.use-case.ts
│   │   │   │   │   │       └── __tests__/
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── persistence/
│   │   │   │   │       │   ├── document.entity.ts
│   │   │   │   │       │   ├── document-update.entity.ts
│   │   │   │   │       │   ├── document-snapshot.entity.ts
│   │   │   │   │       │   └── document-orm.repository.ts
│   │   │   │   │       └── documents.module.ts
│   │   │   │   ├── collaboration/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── interfaces/
│   │   │   │   │   │   │   └── document-sync-service.interface.ts
│   │   │   │   │   │   ├── types/
│   │   │   │   │   │   │   └── awareness-state.type.ts
│   │   │   │   │   │   ├── collaboration-providers.enum.ts
│   │   │   │   │   │   └── collaboration-errors.codes.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── load-document.use-case.ts
│   │   │   │   │   │       ├── apply-update.use-case.ts
│   │   │   │   │   │       ├── persist-snapshot.use-case.ts
│   │   │   │   │   │       └── __tests__/
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── gateway/
│   │   │   │   │       │   └── collaboration.gateway.ts
│   │   │   │   │       ├── services/
│   │   │   │   │       │   └── in-memory-document-sync.service.ts
│   │   │   │   │       └── collaboration.module.ts
│   │   │   │   ├── history/
│   │   │   │   │   ├── domain/
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── get-document-history.use-case.ts
│   │   │   │   │   │       └── restore-version.use-case.ts
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       └── history.module.ts
│   │   │   │   ├── mcp/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── interfaces/
│   │   │   │   │   │   │   └── api-key-repository.interface.ts
│   │   │   │   │   │   ├── types/
│   │   │   │   │   │   │   └── api-key.type.ts
│   │   │   │   │   │   ├── mcp-providers.enum.ts
│   │   │   │   │   │   └── mcp-errors.codes.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   └── use-cases/
│   │   │   │   │   │       ├── list-documents-mcp.use-case.ts
│   │   │   │   │   │       ├── read-document-mcp.use-case.ts
│   │   │   │   │   │       ├── edit-document-mcp.use-case.ts
│   │   │   │   │   │       ├── create-document-mcp.use-case.ts
│   │   │   │   │   │       └── list-folders-mcp.use-case.ts
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── persistence/
│   │   │   │   │       │   ├── api-key.entity.ts
│   │   │   │   │       │   └── api-key-orm.repository.ts
│   │   │   │   │       ├── server/
│   │   │   │   │       │   └── mcp-server.adapter.ts
│   │   │   │   │       └── mcp.module.ts
│   │   │   │   └── search/
│   │   │   │       ├── domain/
│   │   │   │       ├── application/
│   │   │   │       │   └── use-cases/
│   │   │   │       │       └── search-documents.use-case.ts
│   │   │   │       └── infrastructure/
│   │   │   │           └── search.module.ts
│   │   │   └── common/
│   │   │       ├── decorators/
│   │   │       │   ├── auth.decorator.ts
│   │   │       │   ├── auth-user.decorator.ts
│   │   │       │   ├── request-id.decorator.ts
│   │   │       │   ├── pagination-params.decorator.ts
│   │   │       │   ├── sorting-params.decorator.ts
│   │   │       │   └── filtering-params.decorator.ts
│   │   │       ├── exceptions/
│   │   │       │   └── exception.service.ts
│   │   │       ├── helpers/
│   │   │       │   └── case-conversion.helper.ts
│   │   │       ├── interceptors/
│   │   │       │   ├── response.interceptor.ts
│   │   │       │   ├── exception.interceptor.ts
│   │   │       │   └── logging.interceptor.ts
│   │   │       ├── middleware/
│   │   │       │   └── request-id.middleware.ts
│   │   │       ├── pipes/
│   │   │       │   └── validation.pipe.ts
│   │   │       ├── types/
│   │   │       │   ├── paginated-resource.type.ts
│   │   │       │   ├── find-all-fields.type.ts
│   │   │       │   └── find-one-by-fields.type.ts
│   │   │       └── common.module.ts
│   │   ├── test/
│   │   │   ├── jest-e2e.json
│   │   │   ├── auth.e2e-spec.ts
│   │   │   ├── documents.e2e-spec.ts
│   │   │   └── mcp.e2e-spec.ts
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── package.json
│   │
│   └── web/                                # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx              # Root layout + ClientInitializer (DI)
│       │   │   ├── (auth)/
│       │   │   │   ├── sign-in/page.tsx
│       │   │   │   └── register/page.tsx
│       │   │   └── dashboard/
│       │   │       ├── layout.tsx          # Sidebar + Navbar + protección
│       │   │       ├── page.tsx            # Dashboard home
│       │   │       └── [folderId]/
│       │   │           └── [documentId]/
│       │   │               └── page.tsx    # Vista de documento
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── domain/
│       │   │   │   │   ├── entities/
│       │   │   │   │   │   └── auth.ts
│       │   │   │   │   ├── repositories/
│       │   │   │   │   │   └── auth-repository.ts
│       │   │   │   │   └── types/
│       │   │   │   │       └── auth-providers.type.ts
│       │   │   │   ├── application/
│       │   │   │   │   └── use-cases/
│       │   │   │   │       ├── sign-in.use-case.ts
│       │   │   │   │       └── sign-out.use-case.ts
│       │   │   │   └── infrastructure/
│       │   │   │       ├── repositories/
│       │   │   │       │   └── auth-v1.repository.ts
│       │   │   │       ├── hooks/
│       │   │   │       │   └── use-auth.viewmodel.ts
│       │   │   │       ├── components/
│       │   │   │       │   ├── SignInForm.tsx
│       │   │   │       │   └── RegisterForm.tsx
│       │   │   │       ├── state/
│       │   │   │       │   └── auth.state.ts
│       │   │   │       └── auth.module.ts
│       │   │   ├── documents/
│       │   │   │   ├── domain/
│       │   │   │   ├── application/
│       │   │   │   └── infrastructure/
│       │   │   │       ├── hooks/
│       │   │   │       │   ├── use-document.viewmodel.ts
│       │   │   │       │   └── use-create-document.viewmodel.ts
│       │   │   │       ├── components/
│       │   │   │       │   ├── MarkdownEditor.tsx
│       │   │   │       │   ├── MarkdownPreview.tsx
│       │   │   │       │   ├── MarkdownToolbar.tsx
│       │   │   │       │   ├── SplitView.tsx
│       │   │   │       │   └── ModeSelector.tsx
│       │   │   │       ├── state/
│       │   │   │       │   └── documents.state.ts
│       │   │   │       └── documents.module.ts
│       │   │   ├── collaboration/
│       │   │   │   ├── domain/
│       │   │   │   └── infrastructure/
│       │   │   │       ├── hooks/
│       │   │   │       │   └── use-collaboration.viewmodel.ts
│       │   │   │       ├── components/
│       │   │   │       │   ├── CollaborativeCursor.tsx
│       │   │   │       │   ├── PresenceIndicator.tsx
│       │   │   │       │   └── ConnectionStatus.tsx
│       │   │   │       └── collaboration.module.ts
│       │   │   ├── folders/
│       │   │   │   └── infrastructure/
│       │   │   │       ├── hooks/
│       │   │   │       │   └── use-folders.viewmodel.ts
│       │   │   │       ├── components/
│       │   │   │       │   ├── FolderTree.tsx
│       │   │   │       │   └── FolderSidebar.tsx
│       │   │   │       └── folders.module.ts
│       │   │   ├── history/
│       │   │   │   └── infrastructure/
│       │   │   │       ├── components/
│       │   │   │       │   ├── ActivityPanel.tsx
│       │   │   │       │   └── VersionTimeline.tsx
│       │   │   │       └── history.module.ts
│       │   │   ├── admin/
│       │   │   │   └── infrastructure/
│       │   │   │       ├── components/
│       │   │   │       │   ├── GroupManager.tsx
│       │   │   │       │   ├── PermissionMatrix.tsx
│       │   │   │       │   ├── UserInvite.tsx
│       │   │   │       │   └── ApiKeyManager.tsx
│       │   │   │       └── admin.module.ts
│       │   │   ├── search/
│       │   │   │   └── infrastructure/
│       │   │   │       ├── components/
│       │   │   │       │   └── CommandPalette.tsx
│       │   │   │       └── search.module.ts
│       │   │   └── app-registry.module.ts  # Central DI registration
│       │   ├── common/
│       │   │   ├── adapters/
│       │   │   │   └── api-client.ts       # Axios + interceptors
│       │   │   ├── components/
│       │   │   │   ├── LoadingSpinner.tsx
│       │   │   │   ├── EmptyState.tsx
│       │   │   │   └── PermissionGate.tsx
│       │   │   ├── store/
│       │   │   │   └── base.store.ts       # createBaseStore
│       │   │   ├── container/
│       │   │   │   └── app-container.ts    # Inversify container
│       │   │   └── helpers/
│       │   │       └── date-format.helper.ts
│       │   ├── components/
│       │   │   └── ui/                     # shadcn/ui components
│       │   └── middleware.ts               # Next.js auth middleware
│       ├── public/
│       │   └── fonts/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── ui/                                 # shadcn/ui shared components
│   ├── eslint-config/
│   ├── jest-config/
│   ├── typescript-config/
│   └── api/
│
├── docker-compose.yml                      # api + web + postgres (production)
├── docker-compose.dev.yml                  # Override for development
├── Dockerfile.api
├── Dockerfile.web
├── .env.example
├── .gitignore
├── .prettierrc.mjs
├── .eslintrc.mjs
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── package.json
```

### Architectural Boundaries

**API Boundaries:**

```
REST API (/api/*)
├── /api/auth          → Auth module (sign-in, refresh, register)
├── /api/users         → Users module (CRUD, invitations)
├── /api/groups        → Groups module (CRUD, memberships)
├── /api/folders       → Folders module (CRUD, hierarchy)
├── /api/permissions   → Permissions module (assign, check)
├── /api/documents     → Documents module (CRUD, import/export)
├── /api/history       → History module (list, diff, restore)
├── /api/search        → Search module (full-text query)
├── /api/api-keys      → MCP module (generate, revoke API keys)
└── /api/health        → Health check

WebSocket (WSS)
└── /collaboration     → Collaboration module (Yjs sync, awareness)

MCP Server
└── MCP module         → list_folders, list_documents, read_document, edit_document, create_document
```

**Module Dependency Boundaries (Backend):**

```
common ◄─── todos los módulos (exception, logger, guards, interceptors)
auth   ◄─── todos los módulos autenticados (guards, JWT validation)
permissions ◄─── documents, collaboration, mcp, folders (check access)
documents ◄─── collaboration (acceso a document entities)
collaboration ◄─── mcp (DocumentSyncService para edición directa)
```

Regla: Los módulos solo se comunican vía ACL services (interfaces de dominio), NUNCA importando directamente de otro módulo.

**Data Boundaries:**

```
PostgreSQL
├── Auth boundary:     users, user_groups (solo auth/users module)
├── Access boundary:   groups, folder_permissions (solo permissions module)
├── Content boundary:  folders, documents (documents/folders module)
├── Collab boundary:   document_updates (collaboration module)
├── History boundary:  document_snapshots (history module)
└── MCP boundary:      api_keys (mcp module)

In-Memory (Y.Doc)
└── Collaboration module es el ÚNICO que gestiona Y.Docs en memoria
    ├── WebSocket gateway lee/escribe via DocumentSyncService
    └── MCP module lee/escribe via DocumentSyncService
```

### Requirements to Structure Mapping

| FR Category | Backend Module | Frontend Module | Key Files |
|-------------|---------------|----------------|-----------|
| FR1-FR8 (Edición) | `documents` | `documents` | `MarkdownEditor.tsx`, `MarkdownPreview.tsx`, `SplitView.tsx`, `MarkdownToolbar.tsx` |
| FR9-FR12 (Colaboración) | `collaboration` | `collaboration` | `collaboration.gateway.ts`, `CollaborativeCursor.tsx`, `PresenceIndicator.tsx` |
| FR13-FR15 (Historial) | `history` | `history` | `get-document-history.use-case.ts`, `ActivityPanel.tsx`, `VersionTimeline.tsx` |
| FR16-FR20 (Carpetas/Docs) | `documents` + `folders` | `folders` + `documents` | `FolderTree.tsx`, `FolderSidebar.tsx` |
| FR21-FR24 (Usuarios) | `auth` + `users` | `auth` + `admin` | `SignInForm.tsx`, `UserInvite.tsx` |
| FR25-FR28 (Permisos) | `permissions` | `admin` | `PermissionMatrix.tsx`, `PermissionGate.tsx` |
| FR29-FR36 (MCP) | `mcp` | `admin` (API keys UI) | `mcp-server.adapter.ts`, `ApiKeyManager.tsx` |
| FR37-FR39 (Responsive) | — | All frontend modules | Tailwind breakpoints, `Sheet` for mobile sidebar |

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ Zustand   │◄──│  ViewModel   │◄──│  Use Case      │  │
│  │ Store     │   │  (hook)      │   │  (class)       │  │
│  └────┬─────┘   └──────────────┘   └───────┬────────┘  │
│       │                                      │          │
│       ▼                                      ▼          │
│  Component                            Repository        │
│  (React)                              (HTTP/WS)         │
└───────────────────────┬─────────────────────────────────┘
                        │ REST (HTTPS) + WebSocket (WSS)
┌───────────────────────▼─────────────────────────────────┐
│                    NestJS API                            │
│                                                         │
│  Controller/Gateway → Use Case → Repository → TypeORM   │
│         │                              │                │
│         ▼                              ▼                │
│  Presenter (response)           PostgreSQL               │
│                                                         │
│  DocumentSyncService (Y.Doc in memory)                  │
│         ▲                    ▲                           │
│         │                    │                           │
│  WebSocket Gateway     MCP Server Adapter               │
└─────────────────────────────────────────────────────────┘
```

### Development Workflow

| Comando | Qué hace |
|---------|---------|
| `pnpm install` | Instala dependencias de todo el monorepo |
| `turbo run dev` | Arranca api (NestJS :3000) + web (Next.js :3001) en paralelo |
| `turbo run build` | Build de producción de ambas apps |
| `turbo run test` | Ejecuta unit tests de todas las apps/packages |
| `turbo run test:e2e` | Ejecuta E2E tests del API |
| `turbo run lint` | Lint de todo el monorepo |
| `docker compose up` | Levanta api + web + postgres para producción |
| `docker compose -f docker-compose.dev.yml up postgres` | Solo PostgreSQL para desarrollo local |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Sin conflictos detectados.

| Combinación | Estado |
|------------|--------|
| NestJS 11 + TypeORM 0.3.28 | ✅ Compatible |
| Next.js 16.2 + React 19 | ✅ Compatible |
| Yjs 13.6 + CodeMirror 6 + y-codemirror.next | ✅ Integración oficial |
| Yjs + y-websocket + NestJS WebSocket | ✅ Compatible |
| shadcn/ui CLI v4 + Tailwind CSS + Radix UI unificado | ✅ Compatible |
| Zustand + Inversify + React 19 | ✅ Compatible |
| JWT (access + refresh) + HTTP-only cookies + WS auth via query param | ✅ Complementarios |
| MCP SDK + DocumentSyncService + Yjs | ✅ MCP accede al Y.Doc vía misma interfaz que WebSocket |

**Pattern Consistency:** ✅ Naming, error handling, module structure, y DI son consistentes en todas las capas.

**Structure Alignment:** ✅ Monorepo, módulos Clean Architecture, y MVVM frontend alineados con la referencia.

### Requirements Coverage Validation ✅

**Functional Requirements: 39/39 cubiertos**

| FR Range | Cobertura | Módulos |
|----------|-----------|---------|
| FR1-FR8 (Edición) | ✅ | documents |
| FR9-FR12 (Colaboración) | ✅ | collaboration |
| FR13-FR15 (Historial) | ✅ | history |
| FR16-FR20 (Carpetas/Docs) | ✅ | folders + documents + search |
| FR21-FR24 (Usuarios) | ✅ | auth + users |
| FR25-FR28 (Permisos) | ✅ | permissions |
| FR29-FR36 (MCP) | ✅ | mcp |
| FR37-FR39 (Responsive) | ✅ | Tailwind breakpoints + shadcn/ui |

**Non-Functional Requirements: 29/29 cubiertos**

| NFR Range | Cobertura | Decisión que lo soporta |
|-----------|-----------|------------------------|
| NFR1-NFR7 (Rendimiento) | ✅ | CodeMirror 6, code splitting, lazy load, Yjs propagación < 1s |
| NFR8-NFR14 (Seguridad) | ✅ | HTTPS/WSS, bcrypt, JWT revocable, API keys, Helmet, DOMPurify |
| NFR15-NFR19 (Fiabilidad) | ✅ | Yjs updates log, historial inmutable, reconexión Yjs, Docker restart |
| NFR20-NFR23 (MCP) | ✅ | MCP acceso directo a Y.Doc, mismos permisos, errores descriptivos |
| NFR24-NFR27 (Usabilidad) | ✅ | WCAG AA vía Radix UI, navegación teclado, contraste, responsive |
| NFR28-NFR29 (Mantenibilidad) | ✅ | Docker Compose, TypeORM migraciones automáticas |

### Implementation Readiness Validation ✅

- **Decision Completeness:** Todas las tecnologías con versión verificada. Patrones con ejemplos de código.
- **Structure Completeness:** Árbol de proyecto con ~100+ archivos. Boundaries documentados.
- **Pattern Completeness:** Naming, formats, process patterns — todos con ejemplos concretos.

### Gap Analysis Results

**Critical Gaps:** Ninguno ✅

**Important Gaps (no bloquean):**

1. **Migraciones TypeORM:** Usar migraciones desde el inicio, nunca `synchronize: true`.
2. **Testing WebSocket/Yjs:** Implementar tests de integración que simulen múltiples clientes Yjs.
3. **Cleanup Y.Docs en memoria:** Al reiniciar servidor, Y.Docs se reconstruyen bajo demanda cuando un cliente reconecta.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION ✅

**Confidence Level:** Alta

**Key Strengths:**
- Clean Architecture Reference proporciona patrones probados y detallados
- DocumentSyncService como abstracción central simplifica integración MCP + WebSocket + futuro Redis
- Yjs ecosystem resuelve complejidad de CRDTs con librerías probadas
- shadcn/ui + Tailwind proporcionan componentes accesibles out-of-the-box
- Modelo de permisos simple (grupo × carpeta → view/edit) fácil de implementar

**Areas for Future Enhancement:**
- Redis pub/sub para multi-servidor (Fase 2)
- Object storage para blobs de Yjs (Fase 2)
- Logging avanzado con Winston/Pino (Fase 2)
- Monitoring con Prometheus/Grafana (Fase 2)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document AND the Clean Architecture Reference for all questions

**Implementation Sequence:**
1. Docker Compose + PostgreSQL + environment config
2. NestJS base: common module (interceptors, guards, exception service)
3. Auth module (JWT + bcrypt + guards)
4. Users + Groups + Permissions modules
5. Folders + Documents modules + TypeORM migrations
6. Collaboration module (Yjs + WebSocket + persistence)
7. MCP Server module
8. Frontend: Next.js + shadcn/ui + auth + routing
9. Editor: CodeMirror 6 + Yjs client + awareness
10. Preview + Toolbar + mode switching
11. Sidebar + folders navigation
12. History UI + Admin UI
13. Search + Import/Export
14. CI/CD + Swagger
