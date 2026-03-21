# Epic 7: Integración MCP para Herramientas de IA

Carlos puede conectar Claude Code u otras herramientas de IA vía MCP para crear, leer y editar documentos, con API keys y herencia de permisos.

**FRs cubiertos:** FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36
**NFRs relevantes:** NFR11 (API keys revocables), NFR20 (lectura < 500ms), NFR21 (protocolo estándar), NFR22 (mismos permisos), NFR23 (errores descriptivos)
**UX-DRs relevantes:** UX-DR22 (cursor IA)

---

### Story 7.1: Servidor MCP con Operaciones de Lectura

As a **desarrollador (como Carlos) usando Claude Code**,
I want **conectarme al servidor MCP de la plataforma y listar/leer documentos**,
So that **las herramientas de IA puedan consumir el contenido actualizado del equipo como contexto**.

**Acceptance Criteria:**

**Given** Carlos configura la conexión MCP en Claude Code con una API key válida
**When** ejecuta `list_folders`
**Then** recibe la lista de carpetas a las que tiene acceso según los permisos de su grupo

**Given** Carlos tiene acceso a una carpeta
**When** ejecuta `list_documents` con el nombre o ID de la carpeta
**Then** recibe la lista de documentos con título, fecha de actualización y autor

**Given** Carlos tiene permiso de visualización sobre un documento
**When** ejecuta `read_document` con el ID o slug del documento
**Then** recibe el contenido markdown completo del documento
**And** la respuesta llega en < 500ms (NFR20)

**Given** la API key de Carlos está vinculada al grupo "Desarrollo" sin acceso a carpeta "Operaciones"
**When** ejecuta `list_documents` sobre "Operaciones"
**Then** recibe un error descriptivo: "No tienes permiso de visualización sobre la carpeta 'Operaciones'" (FR36)
**And** el error incluye `error: "PERMISSION_DENIED"`, `required_permission: "view"`, `current_permission: "none"`

**Given** Carlos usa una API key revocada o inválida
**When** intenta cualquier operación MCP
**Then** recibe un error de autenticación claro con código `MCP001`

*Nota técnica: MCP Server adapter con @modelcontextprotocol/sdk integrado en NestJS (FR29). Autenticación por API key con ApiKeyAuthGuard que resuelve usuario y permisos. Reutiliza el mismo CheckPermissionGuard del backend. Operaciones: list_folders, list_documents, read_document. Generación básica de API keys (el CRUD completo viene en Story 7.3). Entidad api_keys (id, user_id, key_hash, prefix mk_, name, is_active, created_at, last_used_at) en TypeORM con migración.*

---

### Story 7.2: Operaciones de Escritura MCP

As a **desarrollador (como Carlos) usando Claude Code**,
I want **crear y editar documentos directamente desde herramientas de IA vía MCP**,
So that **el contenido generado por IA se publique directamente en la plataforma y el equipo lo vea en tiempo real**.

**Acceptance Criteria:**

**Given** Carlos tiene permiso de edición sobre la carpeta "Marketing"
**When** ejecuta `create_document` con carpeta, título y contenido markdown
**Then** el documento se crea en la carpeta especificada
**And** los usuarios conectados ven el nuevo documento aparecer en su sidebar

**Given** Carlos tiene permiso de edición sobre un documento existente
**When** ejecuta `edit_document` con nuevo contenido markdown
**Then** el contenido del documento se actualiza modificando el Y.Doc directamente en memoria
**And** los cambios se propagan via WebSocket a todos los usuarios conectados en < 1 segundo

**Given** un usuario está viendo un documento que Carlos edita vía MCP
**When** Claude modifica el contenido
**Then** el usuario ve un cursor púrpura con flag "🤖 Claude" editando en tiempo real (UX-DR22)
**And** el panel de actividad muestra "🤖 Claude — editando vía MCP"

**Given** la API key de Carlos solo tiene permiso "Ver" sobre la carpeta "Técnico"
**When** intenta ejecutar `edit_document` o `create_document` en esa carpeta
**Then** recibe error descriptivo: "No tienes permiso de edición sobre la carpeta 'Técnico'. Tu grupo tiene acceso de solo lectura." (FR36, NFR22)

**Given** una operación MCP de edición se completa exitosamente
**When** verifico el historial del documento
**Then** el cambio aparece registrado como "Claude (vía Carlos)" con timestamp

*Nota técnica: Operaciones create_document y edit_document en el MCP Server. edit_document modifica el Y.Doc via DocumentSyncService — el mismo servicio que usa el WebSocket gateway. Esto garantiza que los cambios MCP se propaguen automáticamente a todos los browsers conectados. El cursor de IA usa el Awareness protocol con isAI: true.*

---

### Story 7.3: Gestión de API Keys

As a **usuario**,
I want **generar y revocar API keys para conectar herramientas de IA vía MCP**,
So that **pueda controlar qué herramientas tienen acceso y revocar el acceso cuando sea necesario**.

**Acceptance Criteria:**

**Given** soy un usuario autenticado y navego a Configuración → API Keys
**When** hago clic en "Generar API Key" e ingreso un nombre descriptivo (ej: "Claude Code - MacBook")
**Then** se genera una API key con prefijo `mk_` + UUID v4
**And** la key se muestra UNA sola vez en la interfaz con opción de copiar
**And** se almacena hasheada en la base de datos (nunca en texto plano)

**Given** tengo API keys generadas
**When** veo la lista de mis API keys
**Then** veo: nombre, prefijo (mk_xxxx), fecha de creación, última vez usada, y estado (activa/revocada)

**Given** quiero revocar una API key
**When** hago clic en "Revocar" junto a la key
**Then** aparece un dialog de confirmación
**And** tras confirmar, la key se invalida inmediatamente (NFR11)
**And** cualquier conexión MCP usando esa key es rechazada a partir de ese momento

**Given** tengo 3 API keys activas (máximo permitido)
**When** intento generar una cuarta
**Then** veo un mensaje "Has alcanzado el máximo de 3 API keys. Revoca una existente para generar otra"

**Given** mi API key está vinculada a mi usuario
**When** una herramienta de IA se conecta con mi key
**Then** hereda exactamente los permisos de mis grupos — sin excepciones (FR35, NFR22)

**Given** soy administrador
**When** navego a la gestión de usuarios
**Then** puedo ver y revocar API keys de cualquier usuario

*Nota técnica: Componente ApiKeyManager en módulo admin del frontend. Endpoints REST para CRUD de API keys. La key completa solo se retorna en la respuesta de creación — después solo el prefijo es visible.*
