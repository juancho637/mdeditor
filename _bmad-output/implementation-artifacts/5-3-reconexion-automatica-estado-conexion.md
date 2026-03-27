# Story 5.3: Reconexión Automática y Estado de Conexión

Status: done

## Story

As a **usuario editando un documento**,
I want **que la plataforma se reconecte automáticamente si pierdo conexión, preservando mis cambios**,
so that **nunca pierda trabajo por problemas de red y siempre sepa el estado de la conexión**.

## Acceptance Criteria

1. **Given** estoy editando un documento y pierdo la conexión a internet
   **When** el WebSocket se desconecta
   **Then** veo un banner amarillo debajo del header: "Reconectando... tus cambios están seguros"
   **And** puedo seguir editando localmente — los cambios se acumulan en cola

2. **Given** la conexión se recupera
   **When** el WebSocket se reconecta
   **Then** los cambios locales se sincronizan automáticamente con el servidor (FR12)
   **And** el banner cambia a verde "Conectado ✓" y se auto-oculta en 3 segundos
   **And** no hay pérdida de datos ni conflictos

3. **Given** la desconexión dura más de 10 segundos
   **When** veo la interfaz
   **Then** el banner muestra "Sin conexión. Tus cambios se guardarán al reconectar"

4. **Given** la conexión es estable
   **When** veo el header
   **Then** aparece un indicador verde sutil de conexión activa

5. **Given** el servidor se reinicia mientras estoy editando
   **When** el servidor vuelve a estar disponible
   **Then** el cliente se reconecta y el Y.Doc se reconstruye desde el último snapshot + updates

## Tasks / Subtasks

### Task 1: Extender el store de collaboration con estados de conexión detallados (AC: #1, #2, #3, #4)

- [x] 1.1 Crear enum `ConnectionStatus` en `apps/web/src/modules/collaboration/domain/enums/connection-status.enum.ts`:
  ```typescript
  export enum ConnectionStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    RECONNECTING = 'reconnecting',
    OFFLINE = 'offline', // >10s sin conexión
  }
  ```
- [x] 1.2 Extender `use-collaboration.store.ts`:
  - Agregar `connectionStatus: ConnectionStatus` (inicializa en `DISCONNECTED`)
  - Agregar `disconnectedAt: number | null` (timestamp de desconexión)
  - Agregar `setConnectionStatus(status: ConnectionStatus): void`
  - Agregar `setDisconnectedAt(ts: number | null): void`
  - Incluir en `reset()`: `connectionStatus: ConnectionStatus.DISCONNECTED, disconnectedAt: null`
- [x] 1.3 Actualizar `collaboration-state.ts` si se necesita exportar la nueva interface

### Task 2: Implementar lógica de reconexión y tracking de estado en use-collaboration.viewmodel.ts (AC: #1, #2, #3, #5)

- [x] 2.1 Agregar listener de status events del WebSocketProvider para transiciones de conexión:
  - `'connected'` → `ConnectionStatus.CONNECTED`, `disconnectedAt = null`
  - `'disconnected'` → `ConnectionStatus.RECONNECTING`, `disconnectedAt = Date.now()` (solo si no había disconnectedAt ya)
- [x] 2.2 Agregar timer que transiciona de `RECONNECTING` a `OFFLINE` después de 10 segundos sin reconexión:
  - Al recibir `'disconnected'`: iniciar setTimeout de 10s
  - Si en esos 10s llega `'connected'`: cancelar el timer
  - Si expira: `setConnectionStatus(ConnectionStatus.OFFLINE)`
- [x] 2.3 Al reconectar (`'connected'`):
  - Setear `ConnectionStatus.CONNECTED`
  - Limpiar `disconnectedAt`
  - Cancelar cualquier timer pendiente de transición a OFFLINE
  - **NO hace falta código especial de sync** — y-websocket y Yjs sync protocol manejan la reconciliación automáticamente al reconectar
- [x] 2.4 Cleanup: limpiar timers en `destroyCollaboration()`
- [x] 2.5 Exponer `connectionStatus` desde el hook return

**IMPORTANTE sobre y-websocket:** La librería `y-websocket` (`WebsocketProvider`) ya implementa reconexión automática con backoff. Al crear el provider con `connect: true`, si pierde conexión intenta reconectar automáticamente. Los Yjs updates se acumulan en el Y.Doc local y al reconectar el sync protocol reconcilia todo. No hay que implementar cola manual ni backoff custom.

### Task 3: Crear componente ConnectionStatusBanner (AC: #1, #2, #3)

- [x] 3.1 Crear `apps/web/src/modules/collaboration/infrastructure/components/ConnectionStatusBanner.tsx`
- [x] 3.2 Props: `connectionStatus: ConnectionStatus`
- [x] 3.3 Comportamiento visual según estado:

  | Estado | Visual | Posición |
  |--------|--------|----------|
  | `CONNECTED` (recién reconectado) | Banner verde "Conectado ✓" → auto-dismiss en 3s | Debajo del header, full-width |
  | `RECONNECTING` | Banner amarillo "Reconectando... tus cambios están seguros" | Debajo del header, full-width |
  | `OFFLINE` | Banner amarillo "Sin conexión. Tus cambios se guardarán al reconectar" | Debajo del header, full-width |
  | `CONNECTED` (estable) | No renderiza banner (indicador está en el header) | — |

- [x] 3.4 Lógica de auto-dismiss del banner verde:
  - Usar `useRef` + `useState` para trackear `showReconnectedBanner`
  - Cuando transiciona de `RECONNECTING/OFFLINE` → `CONNECTED`: mostrar banner verde por 3s, luego ocultar
  - Usar `useEffect` con dependency en `connectionStatus`
- [x] 3.5 Estilos: usar colores del design system (`--warning` para amarillo, `--success` o verde para conectado)
- [x] 3.6 Accesibilidad: `role="status"` y `aria-live="polite"` en el banner para screen readers
- [x] 3.7 Animación sutil: transición de entrada/salida con opacity (no blocker)

### Task 4: Crear componente ConnectionIndicator para el header (AC: #4)

- [x] 4.1 Crear `apps/web/src/modules/collaboration/infrastructure/components/ConnectionIndicator.tsx`
- [x] 4.2 Props: `connectionStatus: ConnectionStatus`
- [x] 4.3 Visual:
  - `CONNECTED`: dot verde (8px) — sutil, junto al save status
  - `RECONNECTING`: dot amarillo pulsante
  - `OFFLINE`: dot rojo
  - `DISCONNECTED` (sin colaboración): no renderiza
- [x] 4.4 Tooltip con texto descriptivo: "Conectado", "Reconectando...", "Sin conexión"
- [x] 4.5 Usar `Tooltip` de shadcn/ui (ya importado en PresenceIndicator)

### Task 5: Integrar ConnectionStatusBanner y ConnectionIndicator en DocumentEditor (AC: #1, #2, #3, #4)

- [x] 5.1 Importar `ConnectionStatusBanner` y `ConnectionIndicator`
- [x] 5.2 Leer `connectionStatus` desde `useCollaborationViewModel()`
- [x] 5.3 Renderizar `ConnectionIndicator` en el header (junto a PresenceIndicator y save status), solo cuando `isCollaborative`
- [x] 5.4 Renderizar `ConnectionStatusBanner` entre el header y el área de edición, solo cuando `isCollaborative`
- [x] 5.5 El banner no debe desplazar el editor — debe ser absolute/fixed o un overlay sutil sobre el contenido (posición sticky debajo del header)

### Task 6: Unit tests (AC: #1-#4)

- [x] 6.1 Test para `ConnectionStatus` enum: verificar que todos los valores existen
- [x] 6.2 Test para lógica de transición de estados (si se extrae a utility):
  - `disconnected` → `RECONNECTING` → `OFFLINE` (>10s)
  - `disconnected` → `RECONNECTING` → `CONNECTED` (<10s)
  - `connected` estable → `CONNECTED`

## Dev Notes

### Cómo funciona y-websocket internamente (reconexión)

`WebsocketProvider` de `y-websocket` ya implementa:
- **Reconexión automática** con backoff: al perder conexión, intenta reconectar con delay creciente
- **Eventos de status**: emite `{ status: 'connected' | 'disconnected' }` que ya estamos escuchando en `use-collaboration.viewmodel.ts`
- **Sync al reconectar**: al restablecer la conexión, ejecuta el Yjs sync protocol automáticamente (step 1 → step 2), reconciliando el Y.Doc local con el servidor
- **Cola implícita**: los updates que el usuario hace mientras está desconectado se aplican al Y.Doc local. Al reconectar, el sync protocol los envía al servidor

**Lo que NO necesitamos implementar:**
- Cola manual de updates offline — Yjs Y.Doc ya es la "cola"
- Backoff exponencial custom — y-websocket ya lo tiene
- Lógica de reconciliación post-reconexión — Yjs sync protocol lo hace
- Persistencia local (IndexedDB/localStorage) — no requerido, la restricción del proyecto es "online obligatorio, cola temporal"

### Comportamiento esperado por escenario

**Desconexión breve (<10s):**
1. WebSocket se cierra → status event `'disconnected'`
2. Store: `connectionStatus = RECONNECTING`, `disconnectedAt = now`
3. UI: banner amarillo "Reconectando..."
4. y-websocket intenta reconectar (backoff automático)
5. Reconecta → status event `'connected'`
6. Store: `connectionStatus = CONNECTED`, `disconnectedAt = null`
7. UI: banner verde "Conectado ✓" → auto-dismiss 3s
8. Yjs sync protocol reconcilia cambios automáticamente

**Desconexión larga (>10s):**
1-3. Igual que arriba
4. Timer de 10s expira → `connectionStatus = OFFLINE`
5. UI: banner cambia a "Sin conexión. Tus cambios se guardarán al reconectar"
6. y-websocket sigue intentando reconectar
7-8. Igual que arriba cuando finalmente reconecta

**Server restart:**
1. Server se cae → WebSocket cierra → mismo flujo de desconexión
2. Server levanta → y-websocket reconecta
3. Backend: `getOrLoadDocument()` reconstruye Y.Doc desde último snapshot + updates
4. Sync protocol reconcilia el Y.Doc del cliente con el reconstruido del server
5. Cero pérdida de datos

### Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/modules/collaboration/domain/enums/connection-status.enum.ts` | Enum ConnectionStatus |
| `apps/web/src/modules/collaboration/infrastructure/components/ConnectionStatusBanner.tsx` | Banner de reconexión/offline |
| `apps/web/src/modules/collaboration/infrastructure/components/ConnectionIndicator.tsx` | Dot indicador en header |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/modules/collaboration/infrastructure/state/use-collaboration.store.ts` | Agregar connectionStatus, disconnectedAt |
| `apps/web/src/modules/collaboration/infrastructure/hooks/use-collaboration.viewmodel.ts` | Lógica de transiciones de estado, timer 10s, exponer connectionStatus |
| `apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx` | Integrar ConnectionStatusBanner + ConnectionIndicator |

### Backend — NO requiere cambios

El backend ya maneja correctamente:
- Reconexión de clientes (handleConnection se re-ejecuta con nuevo WebSocket)
- Y.Doc persiste en memoria o se reconstruye desde DB (getOrLoadDocument)
- Awareness cleanup al desconectar (handleDisconnect)
- Sync steps 1 y 2 se envían proactivamente al conectar

No se necesitan cambios en `collaboration.gateway.ts` ni en ningún otro archivo del backend.

### Dependencias existentes a reutilizar

- **y-websocket WebsocketProvider** — ya configurado con reconexión automática
- **useCollaborationStore** — Zustand store existente, se extiende
- **useCollaborationViewModel** — ya escucha status events, se extiende
- **Tooltip de shadcn/ui** — para tooltip del ConnectionIndicator
- **CSS variables del design system** — `--warning`, colores de estado

### Anti-patrones a evitar

- **NO implementar reconexión manual** — y-websocket ya la tiene. Solo necesitamos trackear el estado para la UI
- **NO crear cola de updates custom** — el Y.Doc local ES la cola implícita
- **NO persistir en localStorage/IndexedDB** — restricción del proyecto: "online obligatorio, cola temporal"
- **NO crear WebSocket pings/heartbeats custom** — y-websocket maneja esto internamente
- **NO bloquear la UI al desconectar** — el usuario debe poder seguir editando localmente
- **NO usar modal para notificar desconexión** — UX spec dice banner no intrusivo

### Project Structure Notes

- Nuevos componentes van en `apps/web/src/modules/collaboration/infrastructure/components/` (ya existe el directorio)
- Enum va en `apps/web/src/modules/collaboration/domain/enums/` (crear directorio)
- No se crean hooks nuevos — la lógica de reconexión vive en `use-collaboration.viewmodel.ts`
- No se modifica el barrel export `collaboration/domain/index.ts` si existe

### References

- [Source: ux-design-specification.md#ConnectionStatus] — UX-DR12: diseño del ConnectionStatus (tabla de estados visuales)
- [Source: ux-design-specification.md#Emotional Design] — Tranquilidad ante errores, mensajes calmados
- [Source: ux-design-specification.md#Anti-Patterns] — No interrumpir edición con banners intrusivos
- [Source: architecture.md#Real-Time Architecture Decision] — WebSocket only, y-websocket como transporte
- [Source: architecture.md#Technical Constraints] — Online obligatorio, cola de reconexión temporal
- [Source: architecture.md#Yjs Lifecycle Pattern] — Flujo de carga/reconexión del Y.Doc
- [Source: epic-05-colaboracion.md#Story 5.3] — ACs y nota técnica
- [Source: 5-2-cursores-colaborativos-presencia.md] — Story previa: awareness, PresenceIndicator, collaboration store
- [Source: 5-1-edicion-colaborativa-yjs-websocket.md] — Story base: WebsocketProvider, gateway, sync service

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Created `ConnectionStatus` enum with 4 states: CONNECTED, DISCONNECTED, RECONNECTING, OFFLINE
- Extended collaboration Zustand store with `connectionStatus` and `disconnectedAt` fields
- Updated `use-collaboration.viewmodel.ts` with connection state transitions: disconnected → RECONNECTING → OFFLINE (>10s), and reconnect → CONNECTED with timer cleanup
- Created `ConnectionStatusBanner` component: yellow banner for reconnecting/offline, green auto-dismiss banner for reconnected, with `role="status"` and `aria-live="polite"` for accessibility
- Created `ConnectionIndicator` component: 8px colored dot (green/yellow pulsing/red) with tooltip via shadcn/ui
- Integrated both components in `DocumentEditor.tsx`: indicator in header, banner between toolbar and editor area
- Fixed: banner/indicator use `isCollaborationActive` (not `isCollaborative`) so they remain visible during disconnection (when `isSynced` is false)
- No backend changes required — y-websocket handles reconnection with exponential backoff, Yjs sync protocol reconciles automatically
- Created 6 E2E tests covering: indicator visibility, green color, reconnection banner flow, offline banner (>10s), ARIA accessibility, stable state (no banners)
- All 76 backend unit tests pass — zero regressions
- All 145 E2E tests pass (139 existing + 6 new) — zero regressions

### Change Log

- 2026-03-27: Story 5.3 implementation complete — automatic reconnection UI and connection status indicators

### File List

**New files:**
- apps/web/src/modules/collaboration/domain/enums/connection-status.enum.ts
- apps/web/src/modules/collaboration/domain/enums/__tests__/connection-status.enum.spec.ts
- apps/web/src/modules/collaboration/infrastructure/components/ConnectionStatusBanner.tsx
- apps/web/src/modules/collaboration/infrastructure/components/ConnectionIndicator.tsx

**Modified files:**
- apps/web/src/modules/collaboration/infrastructure/state/use-collaboration.store.ts (added connectionStatus, disconnectedAt)
- apps/web/src/modules/collaboration/infrastructure/hooks/use-collaboration.viewmodel.ts (connection state transitions, offline timer)
- apps/web/src/modules/documents/infrastructure/components/DocumentEditor.tsx (integrated ConnectionStatusBanner + ConnectionIndicator, isCollaborationActive guard)

**New E2E tests:**
- e2e/connection-status.spec.ts (6 tests: indicator visibility, green color, reconnection flow, offline banner, ARIA accessibility, stable state)
