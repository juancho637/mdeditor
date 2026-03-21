---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# markdown - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for markdown, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: El usuario puede crear nuevos documentos markdown dentro de una carpeta
- FR2: El usuario puede editar documentos en modo editor markdown puro (código en crudo)
- FR3: El usuario puede ver documentos en modo visualizador renderizado (solo lectura)
- FR4: El usuario puede editar documentos en modo híbrido (editor markdown + preview renderizado en panel dividido)
- FR5: El usuario puede alternar entre los 3 modos de visualización en cualquier momento
- FR6: El usuario puede insertar sintaxis markdown mediante un toolbar de asistencia (negritas, cursivas, headers, listas, links, tablas, código, imágenes)
- FR7: El editor mantiene sincronización de scroll entre editor y preview en modo híbrido
- FR8: El usuario puede cambiar la apariencia visual entre tema claro y tema oscuro
- FR9: Múltiples usuarios pueden editar el mismo documento simultáneamente con cambios visibles al instante
- FR10: El usuario puede ver la presencia de otros usuarios activos en el documento (cursores con nombre)
- FR11: El sistema reconcilia cambios concurrentes sin pérdida de datos ni conflictos
- FR12: El sistema reconecta automáticamente ante pérdida de conexión y sincroniza cambios pendientes
- FR13: El usuario puede ver el historial completo de cambios (quién modificó qué y cuándo)
- FR14: El usuario puede revertir un documento a una versión anterior
- FR15: El sistema registra cada cambio con autor, timestamp y contenido modificado
- FR16: El usuario puede crear, renombrar y eliminar carpetas en estructura jerárquica
- FR17: El usuario puede mover documentos entre carpetas
- FR18: El usuario puede importar archivos markdown (.md) desde su dispositivo
- FR19: El usuario puede exportar documentos como archivos markdown (.md)
- FR20: El usuario puede buscar contenido a través de todos los documentos a los que tiene acceso
- FR21: El usuario puede registrarse y autenticarse en la plataforma
- FR22: El administrador puede invitar nuevos usuarios
- FR23: El administrador puede crear, editar y eliminar grupos de usuarios
- FR24: El administrador puede asignar y remover usuarios de grupos
- FR25: El administrador puede asignar permisos por carpeta a cada grupo (puede ver / puede editar)
- FR26: El sistema restringe acceso a documentos según los permisos del grupo del usuario
- FR27: Un usuario sin permiso de edición puede ver el documento pero no modificarlo
- FR28: Un usuario sin permiso de visualización no puede ver el contenido de la carpeta ni sus documentos
- FR29: El sistema expone un servidor MCP para conexión de herramientas de IA
- FR30: Un cliente MCP puede listar carpetas y documentos disponibles según sus permisos
- FR31: Un cliente MCP puede leer el contenido completo de un documento
- FR32: Un cliente MCP puede editar el contenido de un documento existente
- FR33: Un cliente MCP puede crear nuevos documentos dentro de una carpeta
- FR34: El usuario puede generar y revocar API keys para autenticación MCP
- FR35: Las API keys heredan los permisos del usuario/grupo al que están vinculadas
- FR36: El servidor MCP retorna errores descriptivos cuando una operación es rechazada por permisos insuficientes
- FR37: El usuario puede acceder y usar la plataforma desde desktop, tablet y móvil con experiencia adaptada
- FR38: En móvil, el usuario puede navegar carpetas y documentos mediante un drawer de navegación
- FR39: En móvil, el usuario puede editar en modo editor o ver en modo visualizador (sin split)

### NonFunctional Requirements

- NFR1: Pulsaciones de teclado en el editor reflejadas en pantalla en < 100ms
- NFR2: Cambios propagados a todos los participantes del documento en < 1 segundo
- NFR3: Carga inicial de la aplicación (LCP) en < 3 segundos
- NFR4: Documento listo para editar (Time to Interactive) en < 4 segundos
- NFR5: Renderizado markdown a HTML en < 200ms para documentos de hasta 10,000 líneas
- NFR6: Bundle inicial < 500KB gzipped
- NFR7: 10 usuarios editando simultáneamente el mismo documento sin degradación perceptible
- NFR8: Todas las comunicaciones via HTTPS/WSS (TLS 1.2+)
- NFR9: Contraseñas almacenadas con bcrypt o equivalente
- NFR10: Tokens de sesión con expiración configurable y revocables
- NFR11: API keys de MCP revocables inmediatamente por usuario o administrador
- NFR12: Protección contra XSS, CSRF, e inyección SQL
- NFR13: Headers de seguridad HTTP configurados (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
- NFR14: Contenido markdown renderizado sanitizado para prevenir ejecución de scripts
- NFR15: Cero pérdida de datos — todo cambio confirmado por el servidor debe persistirse
- NFR16: Historial de cambios inmutable — ninguna operación puede eliminar el registro histórico
- NFR17: Ante desconexión, cambios locales preservados y sincronizados automáticamente al reconectar
- NFR18: Uptime 99.5%+ en entorno self-hosted (excluyendo mantenimiento planificado)
- NFR19: Base de datos con soporte para backups periódicos sin interrupción del servicio
- NFR20: Operaciones de lectura MCP en < 500ms
- NFR21: Protocolo MCP estándar vigente con compatibilidad hacia atrás en versiones menores
- NFR22: Operaciones MCP respetan idénticamente el modelo de permisos de la interfaz web — sin excepciones
- NFR23: Errores MCP con mensajes descriptivos y códigos de error estándar del protocolo
- NFR24: Usuario no técnico edita su primer documento en modo híbrido sin instrucción previa en < 2 minutos
- NFR25: Navegación por teclado en todas las funciones interactivas del editor (Tab, Enter, Escape)
- NFR26: Contraste visual mínimo 4.5:1 en ambos temas (claro y oscuro)
- NFR27: Interfaz adaptada a breakpoints definidos (desktop >1024px, tablet 768-1024px, móvil <768px) sin pérdida de funcionalidad core
- NFR28: Despliegue en entorno self-hosted mediante proceso documentado de máximo 5 pasos
- NFR29: Actualizaciones sin migración manual de datos — migraciones automáticas

### Additional Requirements

- El proyecto utiliza un starter template `create-turbo` ya inicializado con monorepo TypeScript (NestJS backend + Next.js frontend)
- Infraestructura de despliegue con Docker + Docker Compose para api + web + postgres
- Configuración de entorno con `@nestjs/config` + `.env` + validación al arrancar (fail fast)
- Base de datos PostgreSQL 16 con TypeORM 0.3.28 y migraciones automáticas (nunca `synchronize: true`)
- Persistencia de documentos con binary snapshot (Y.Doc) + markdown texto para búsqueda full-text
- Historial con snapshots periódicos + Yjs updates log para cero pérdida de datos
- Arquitectura WebSocket only (sin WebRTC) para sincronización Yjs — el servidor mantiene Y.Doc en memoria
- MCP modifica Y.Doc directamente en memoria del servidor, propagando cambios via WebSocket a todos los browsers
- DocumentSyncService como abstracción central compartida entre WebSocket gateway y MCP module
- Autenticación JWT con access token (15-30min) + refresh token (7-30 días) en HTTP-only cookie
- API Keys MCP con prefijo `mk_` + UUID v4, hash almacenado en DB, máximo 3 por usuario
- Rate Limiting con `@nestjs/throttler` — estricto en login (5/min), generoso en API auth (100/min)
- Documentación API con `@nestjs/swagger` generación automática desde DTOs
- Validación de entrada con `class-validator` + `ValidationPipe` global
- Clean Architecture: domain → application → infrastructure, un archivo por responsabilidad
- Módulos backend: auth, users, groups, folders, permissions, documents, collaboration, history, mcp, search, common
- Módulos frontend: auth, documents, collaboration, folders, history, admin, search, common
- Frontend con MVVM (ViewModels como custom hooks), Zustand stores por módulo, Inversify DI
- CI/CD con GitHub Actions — lint, test, build en cada PR
- Health check endpoint `GET /api/health` verificando PostgreSQL + WebSocket server
- Error handling: interceptor global + códigos por módulo (AUT, USR, GRP, FLD, DOC, PRM, COL, MCP, HST)
- Response wrapper: `{ data, path, duration, requestId, method }`
- snake_case en wire format (DTOs, API responses), camelCase en dominio

### UX Design Requirements

- UX-DR1: Implementar sistema de design tokens con CSS Variables para colores, espaciado, tipografía — paleta light mode (fondo #FFFFFF, foreground #1A1A1A, primary #2F81F7) y dark mode (fondo #191919, foreground #E8E8E5, primary #4A9EFF) con cambio instantáneo sin recarga
- UX-DR2: Implementar paleta de 8 colores para cursores colaborativos con suficiente contraste en ambos temas, más color único #9333EA para cursor de IA (MCP)
- UX-DR3: Implementar sistema tipográfico con Inter (UI), JetBrains Mono (editor), escala tipográfica base 16px (h1: 32px, h2: 24px, h3: 20px, body: 16px/1.7, code: 14px/1.6)
- UX-DR4: Implementar sistema de espaciado base 4px (space-1 a space-16) y layout principal con sidebar 260px colapsable + área de contenido centrada (max-width 900px para preview)
- UX-DR5: Construir componente MarkdownEditor basado en CodeMirror 6 con syntax highlighting, JetBrains Mono 14px, fondo diferenciado, soporte para cursores remotos (humanos y de IA), estados read-only y desconectado
- UX-DR6: Construir componente MarkdownPreview con react-markdown + rehype-highlight, Inter 16px, max-width 900px centrado, code blocks con syntax highlighting, tablas con bordes y alternancia de filas, sync scroll con editor
- UX-DR7: Construir componente MarkdownToolbar con 13 botones organizados en 4 grupos (Texto, Listas, Insertar, Bloque), altura 40px, estados default/hover/active/disabled, soporte responsive (desktop: fila completa, móvil: bottom con scroll horizontal)
- UX-DR8: Construir componente SplitView con ResizablePanels de shadcn/ui, proporción default 50/50, mínima 30/70, resize handle de 4px, adaptación a tabs en móvil/tablet portrait
- UX-DR9: Construir componente CollaborativeCursor con línea de 2px en color del usuario, flag con nombre (10px, border-radius 3px), variante IA (púrpura + ícono bot "Claude"), inactividad (flag se oculta a >30s), indicador fuera de viewport
- UX-DR10: Construir componente PresenceIndicator con avatares circulares de 24px en header, máximo 4 visibles + "+N", overlap -6px, tooltip en hover con nombre y estado, variante IA con ícono bot
- UX-DR11: Construir componente ActivityPanel togglable (280px) con actividad en vivo arriba + historial abajo, animación slide-in 200ms, adaptación responsive (desktop: inline, tablet: sheet overlay, móvil: sheet full-width desde abajo)
- UX-DR12: Construir componente ConnectionStatus con estados: Conectado (badge verde), Guardando (spinner), Guardado (badge verde ✓), Reconectando (banner amarillo debajo del header), Desconectado (banner amarillo), Reconectado (banner verde auto-dismiss 3s)
- UX-DR13: Construir componente EmptyState con 4 variantes: workspace vacío, carpeta vacía, sin resultados de búsqueda, sin permisos — cada uno con ícono, mensaje y CTA apropiado
- UX-DR14: Implementar layout header compacto (48px) con: logo + breadcrumbs + badge guardado + mode tabs + avatares presencia + toggle actividad + toggle tema
- UX-DR15: Implementar jerarquía de 5 niveles de botones (primario, secundario, ghost, destructivo, link) con reglas de uso: máximo 1 primario por contexto, destructivos solo en dialogs de confirmación
- UX-DR16: Implementar sistema de feedback con toasts (éxito 3s, info 4s, advertencia manual dismiss, error manual dismiss), máximo 2 visibles simultáneamente, posición esquina inferior derecha en desktop
- UX-DR17: Implementar patrones de formularios con validación en dos capas (inline en frontend al perder foco + backend al enviar), estados de campos (default, focus, filled, error, disabled), y error messages específicos por campo
- UX-DR18: Implementar navegación en sidebar con: documento activo resaltado (background primary/10%), carpeta activa auto-expandida, breadcrumbs siempre visibles, hover con background muted, menú contextual con clic derecho, colapsable completo
- UX-DR19: Implementar búsqueda global con Cmd/Ctrl+K usando Command palette de shadcn/ui, buscando en títulos y contenido de documentos, con resultados mostrando título + carpeta padre + preview de match
- UX-DR20: Implementar diseño responsive mobile-first con adaptación por breakpoint: sidebar → sheet en móvil, split → tabs en móvil/tablet portrait, toolbar → bottom en móvil, panel actividad → sheet en móvil/tablet
- UX-DR21: Implementar accesibilidad WCAG 2.1 AA: contraste mínimo 4.5:1, navegación por teclado completa, skip links, focus rings visibles (2px), targets touch mínimo 44x44px, HTML semántico, ARIA labels en todos los componentes interactivos
- UX-DR22: Implementar dirección de diseño "Collaborative First" con presencia de usuarios como elemento central, panel de actividad en vivo, cursor de IA visible con ícono bot púrpura cuando MCP está editando
- UX-DR23: Implementar patrones de interacción táctil en móvil: long press para menú contextual, swipe left para acciones rápidas en sidebar, swipe right para cerrar sheets, pull to refresh para sincronización
- UX-DR24: Implementar border-radius consistente: botones 6px, cards/contenedores 8px, avatares 50%, inputs 6px, modales 12px, tooltips 6px

### FR Coverage Map

- FR1: Epic 2 — Crear documentos markdown dentro de una carpeta
- FR2: Epic 4 — Modo editor markdown puro
- FR3: Epic 4 — Modo visualizador renderizado
- FR4: Epic 4 — Modo híbrido (editor + preview en split)
- FR5: Epic 4 — Alternar entre los 3 modos
- FR6: Epic 4 — Toolbar de asistencia markdown
- FR7: Epic 4 — Sync scroll en modo híbrido
- FR8: Epic 4 — Temas claro/oscuro
- FR9: Epic 5 — Edición simultánea en tiempo real
- FR10: Epic 5 — Presencia de usuarios y cursores con nombre
- FR11: Epic 5 — Reconciliación de conflictos (CRDTs)
- FR12: Epic 5 — Reconexión automática y sincronización
- FR13: Epic 6 — Ver historial completo de cambios
- FR14: Epic 6 — Revertir a versión anterior
- FR15: Epic 6 — Registro de cambios por autor/timestamp
- FR16: Epic 2 — CRUD carpetas en estructura jerárquica
- FR17: Epic 2 — Mover documentos entre carpetas
- FR18: Epic 8 — Importar archivos .md
- FR19: Epic 8 — Exportar documentos como .md
- FR20: Epic 8 — Búsqueda de contenido global
- FR21: Epic 1 — Registro y autenticación
- FR22: Epic 1 — Invitar nuevos usuarios
- FR23: Epic 1 — Gestión de grupos de usuarios
- FR24: Epic 1 — Asignar/remover usuarios de grupos
- FR25: Epic 3 — Permisos por carpeta a cada grupo
- FR26: Epic 3 — Restricción de acceso según permisos
- FR27: Epic 3 — Vista sin edición (solo lectura)
- FR28: Epic 3 — Bloqueo de visualización sin permiso
- FR29: Epic 7 — Servidor MCP expuesto
- FR30: Epic 7 — Listar carpetas/documentos vía MCP
- FR31: Epic 7 — Leer documentos vía MCP
- FR32: Epic 7 — Editar documentos vía MCP
- FR33: Epic 7 — Crear documentos vía MCP
- FR34: Epic 7 — Generar/revocar API keys
- FR35: Epic 7 — Herencia de permisos en API keys
- FR36: Epic 7 — Errores descriptivos MCP
- FR37: Epic 8 — Experiencia responsive adaptada
- FR38: Epic 8 — Drawer de navegación en móvil
- FR39: Epic 8 — Modos adaptados en móvil (sin split)

## Epic List

### Epic 1: Autenticación y Configuración del Workspace
Los usuarios pueden registrarse, autenticarse e invitar a su equipo. El administrador puede configurar grupos y la estructura inicial del workspace.
**FRs cubiertos:** FR21, FR22, FR23, FR24

### Epic 2: Gestión de Documentos y Carpetas
Los usuarios pueden crear, organizar y navegar documentos y carpetas en estructura jerárquica.
**FRs cubiertos:** FR1, FR16, FR17

### Epic 3: Control de Acceso y Permisos
El administrador puede asignar permisos por carpeta a cada grupo, controlando quién puede ver y editar.
**FRs cubiertos:** FR25, FR26, FR27, FR28

### Epic 4: Experiencia de Edición de Documentos
Los usuarios pueden editar documentos en 3 modos (editor puro, visualizador, híbrido) con toolbar de asistencia, sync scroll y temas.
**FRs cubiertos:** FR2, FR3, FR4, FR5, FR6, FR7, FR8

### Epic 5: Colaboración en Tiempo Real
Múltiples usuarios pueden editar el mismo documento simultáneamente con cursores visibles, presencia y reconexión automática.
**FRs cubiertos:** FR9, FR10, FR11, FR12

### Epic 6: Historial de Cambios y Restauración
Los usuarios pueden ver el historial completo de cambios, consultar quién modificó qué, y restaurar versiones anteriores.
**FRs cubiertos:** FR13, FR14, FR15

### Epic 7: Integración MCP para Herramientas de IA
Carlos puede conectar Claude Code u otras herramientas de IA vía MCP para crear, leer y editar documentos, con API keys y herencia de permisos.
**FRs cubiertos:** FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36

### Epic 8: Búsqueda, Import/Export y Experiencia Responsive
Los usuarios pueden buscar contenido, importar/exportar archivos .md, y acceder desde cualquier dispositivo con experiencia adaptada.
**FRs cubiertos:** FR18, FR19, FR20, FR37, FR38, FR39

## Epic Files

Las historias detalladas de cada épica están en archivos individuales:

- [epic-01-auth-workspace.md](epic-01-auth-workspace.md) — Stories 1.1-1.4 (4 stories)
- [epic-02-documentos-carpetas.md](epic-02-documentos-carpetas.md) — Stories 2.1-2.3 (3 stories)
- [epic-03-permisos.md](epic-03-permisos.md) — Stories 3.1-3.2 (2 stories)
- [epic-04-edicion.md](epic-04-edicion.md) — Stories 4.1-4.5 (5 stories)
- [epic-05-colaboracion.md](epic-05-colaboracion.md) — Stories 5.1-5.3 (3 stories)
- [epic-06-historial.md](epic-06-historial.md) — Stories 6.1-6.3 (3 stories)
- [epic-07-mcp.md](epic-07-mcp.md) — Stories 7.1-7.3 (3 stories)
- [epic-08-busqueda-responsive.md](epic-08-busqueda-responsive.md) — Stories 8.1-8.3 (3 stories)

**Total: 8 épicas, 26 historias**
