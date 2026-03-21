# Epic 5: Colaboración en Tiempo Real

Múltiples usuarios pueden editar el mismo documento simultáneamente con cursores visibles, presencia y reconexión automática.

**FRs cubiertos:** FR9, FR10, FR11, FR12
**NFRs relevantes:** NFR2 (propagación < 1s), NFR7 (10 usuarios simultáneos), NFR15 (cero pérdida datos), NFR17 (reconexión)
**UX-DRs relevantes:** UX-DR2, UX-DR9, UX-DR10, UX-DR12, UX-DR22

---

### Story 5.1: Edición Colaborativa con Yjs y WebSocket

As a **miembro del equipo**,
I want **editar un documento simultáneamente con otros miembros y ver sus cambios en tiempo real**,
So that **podamos colaborar sin conflictos ni intermediarios**.

**Acceptance Criteria:**

**Given** Carlos abre un documento que Valentina ya está editando
**When** Carlos escribe en una sección diferente
**Then** los cambios de Carlos aparecen en la pantalla de Valentina en < 1 segundo (NFR2)
**And** los cambios de Valentina siguen apareciendo en la pantalla de Carlos

**Given** dos usuarios editan la misma línea simultáneamente
**When** ambos escriben al mismo tiempo
**Then** el CRDT (Yjs) resuelve el conflicto automáticamente carácter por carácter sin pérdida de datos (FR11)

**Given** un usuario está editando un documento
**When** otro usuario abre el mismo documento
**Then** el nuevo usuario recibe el estado actual del documento completo y sincronizado

**Given** 10 usuarios están editando el mismo documento
**When** todos escriben simultáneamente
**Then** no hay degradación perceptible en la experiencia de ningún usuario (NFR7)

**Given** el servidor recibe un cambio de cualquier cliente
**When** el cambio se procesa
**Then** se persiste en la tabla document_updates como Yjs update incremental (NFR15)
**And** cada 60 segundos de actividad se crea un snapshot completo del Y.Doc

*Nota técnica: Integración de Yjs con CodeMirror via y-codemirror.next. WebSocket gateway en NestJS. DocumentSyncService: getOrLoadDocument (carga último snapshot + aplica updates posteriores), manejo del Y.Doc en memoria, persistencia de updates incrementales. Entidades document_updates y document_snapshots en TypeORM con migraciones. El guardado automático de Story 2.2/4.1 se reemplaza por la sincronización Yjs — content_markdown se actualiza desde el estado del Y.Doc al crear snapshots.*

---

### Story 5.2: Cursores Colaborativos y Presencia de Usuarios

As a **miembro del equipo editando un documento**,
I want **ver los cursores y nombres de otros usuarios que están editando, y que vean el mío**,
So that **sepa quién está trabajando en qué sección y la colaboración se sienta natural**.

**Acceptance Criteria:**

**Given** dos usuarios están editando el mismo documento
**When** Carlos posiciona su cursor en el texto
**Then** Valentina ve un cursor de color (ej: azul) con un flag que dice "Carlos" encima

**Given** múltiples usuarios están conectados a un documento
**When** miro el header
**Then** veo avatares circulares (24px) de los usuarios conectados, máximo 4 visibles + "+N"
**And** al hacer hover sobre un avatar veo tooltip con nombre y estado ("Editando" o "Viendo")

**Given** un usuario selecciona texto
**When** otros ven el documento
**Then** la selección remota aparece como highlight semitransparente (20% opacidad) del color del usuario

**Given** un usuario no edita durante más de 30 segundos
**When** otros ven su cursor
**Then** el flag con nombre se oculta y el cursor queda con 50% de opacidad

**Given** una herramienta de IA edita vía MCP (futuro Epic 7)
**When** los usuarios conectados ven el documento
**Then** aparece un cursor púrpura (#9333EA) con flag "🤖 Claude" diferenciado de los cursores humanos

**Given** un usuario se desconecta
**When** otros ven el header
**Then** su avatar desaparece sin notificación intrusiva

*Nota técnica: Yjs Awareness protocol para cursores y presencia. Componente CollaborativeCursor (UX-DR9) con paleta de 8 colores (UX-DR2). Componente PresenceIndicator (UX-DR10) con Avatar de shadcn/ui. Variante de cursor IA preparada para UX-DR22.*

---

### Story 5.3: Reconexión Automática y Estado de Conexión

As a **usuario editando un documento**,
I want **que la plataforma se reconecte automáticamente si pierdo conexión, preservando mis cambios**,
So that **nunca pierda trabajo por problemas de red y siempre sepa el estado de la conexión**.

**Acceptance Criteria:**

**Given** estoy editando un documento y pierdo la conexión a internet
**When** el WebSocket se desconecta
**Then** veo un banner amarillo debajo del header: "Reconectando... tus cambios están seguros"
**And** puedo seguir editando localmente — los cambios se acumulan en cola

**Given** la conexión se recupera
**When** el WebSocket se reconecta
**Then** los cambios locales se sincronizan automáticamente con el servidor (FR12)
**And** el banner cambia a verde "Conectado ✓" y se auto-oculta en 3 segundos
**And** no hay pérdida de datos ni conflictos

**Given** la desconexión dura más de 10 segundos
**When** veo la interfaz
**Then** el banner muestra "Sin conexión. Tus cambios se guardarán al reconectar"

**Given** la conexión es estable
**When** veo el header
**Then** aparece un indicador verde sutil de conexión activa

**Given** el servidor se reinicia mientras estoy editando
**When** el servidor vuelve a estar disponible
**Then** el cliente se reconecta y el Y.Doc se reconstruye desde el último snapshot + updates

*Nota técnica: Componente ConnectionStatus (UX-DR12). Reconexión automática con backoff exponencial. Cola de Yjs updates locales durante desconexión. Al reconectar, Yjs sync protocol reconcilia automáticamente. aria-live="polite" para cambios de estado de conexión.*
