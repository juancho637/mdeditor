# Deuda Técnica

## DT-001: Refactorizar CollaborationGateway — Extraer lógica de negocio a use cases

**Archivo:** `apps/api/src/modules/collaboration/infrastructure/gateway/collaboration.gateway.ts`

**Problema:** El gateway WebSocket contiene lógica de negocio que debería estar en use cases:

- Verificación de permisos (checkPermission) en el handler de conexión
- Protocolo de sincronización Y.js (sync step 1/2, incremental updates)
- Manejo del Awareness protocol (cursor presence)
- Persistencia de updates via syncService

**Debería ser:** El gateway solo debería manejar el transporte WebSocket (aceptar conexiones, decodificar/encodificar mensajes, rutear a use cases). Toda la lógica de sync, permisos y awareness debería vivir en use cases dedicados.

**Origen:** Story 5-1 (Edición Colaborativa con Y.js y WebSocket)

**Impacto:** Bajo — funciona correctamente, pero viola Clean Architecture y dificulta testing unitario de la lógica de sync.

**Detectado en:** Story 7-2 (Operaciones de Escritura MCP)
