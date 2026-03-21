---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: [product-brief-markdown-2026-03-18.md]
workflowType: 'prd'
date: 2026-03-19
author: Juan David
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - Markdown

**Author:** Juan David
**Date:** 2026-03-19

## Resumen Ejecutivo

Markdown es una plataforma web colaborativa de edición de documentos markdown, self-hosted y open source, diseñada para equipos pequeños (5-15 personas) que generan documentación con herramientas de IA y necesitan una fuente única de verdad para colaborar sobre ella. Ofrece tres modos de interacción — editor markdown puro, visualizador renderizado y modo híbrido con toolbar de asistencia — permitiendo que desarrolladores, marketers, fundadores y perfiles no técnicos trabajen simultáneamente sobre los mismos documentos en tiempo real.

**El problema:** Los equipos generan documentación con IA en formato markdown, pero compartirla y colaborar sobre ella es un proceso fragmentado de archivos locales, mensajes informales y versiones desactualizadas. El generador (típicamente el desarrollador) se convierte en cuello de botella porque es el único que puede crear, distribuir y consolidar cambios.

### Lo Que Hace Especial a Este Producto

El diferenciador clave es el ciclo completo **IA ↔ Equipo ↔ IA** habilitado por integración nativa con MCP (Model Context Protocol):

1. **Generación con IA**: Documentos creados desde Claude Code, OpenAI o cualquier herramienta de IA se publican directamente en la plataforma vía MCP
2. **Colaboración humana**: El equipo completo edita, revisa y refina en tiempo real sin importar su nivel técnico
3. **Consumo por IA**: Las herramientas de IA leen las ediciones del equipo de vuelta vía MCP para validar, profundizar o iterar

La plataforma se convierte en la fuente de verdad accesible tanto para humanos como para máquinas — eliminando el "descárgate el documento y léelo por favor" por conexiones directas e instantáneas.

**Diferenciadores adicionales:** Gratuito y self-hosted (control total de datos), 100% markdown nativo (sin capas WYSIWYG), y ligero — sin la complejidad de un wiki enterprise.

## Clasificación del Proyecto

- **Tipo:** Web App (SPA colaborativa en tiempo real)
- **Dominio:** General / Productividad y Colaboración
- **Complejidad:** Baja (sin requisitos regulatorios ni de compliance)
- **Contexto:** Greenfield — producto nuevo desde cero

## Criterios de Éxito

### Éxito del Usuario

- **Adopción completa del equipo**: Las 10 personas leen y editan documentos activamente en la plataforma dentro de las primeras 2 semanas — sin recurrir a canales informales (chat, email) para compartir docs
- **Intuitividad tipo Google Docs**: Cualquier miembro del equipo puede abrir, leer y editar un documento sin instrucción previa. El modo híbrido con toolbar debe sentirse tan natural como un editor WYSIWYG
- **Eliminación del cuello de botella**: Los miembros no técnicos editan documentos por su cuenta sin depender del desarrollador como intermediario
- **Cero conflictos de versiones**: No se reportan documentos desactualizados ni cambios perdidos
- **Flujo IA cerrado**: Operaciones CRUD completas vía MCP desde Claude Code, con cambios visibles al instante para el equipo

### Éxito de Negocio

Proyecto open source community-driven sin monetización:

- **Validación interna**: El equipo lo usa de forma estable como fuente única de verdad — señal de que está listo para open source
- **Adopción orgánica** (post-lanzamiento OS): Otros equipos descubren, instalan y usan la herramienta por cuenta propia
- **Comunidad activa**: GitHub stars en crecimiento sostenido, al menos 1 PR externo por mes en los primeros 6 meses
- **Ecosistema**: La comunidad contribuye integraciones y mejoras

### Éxito Técnico

Criterios de rendimiento, fiabilidad y seguridad definidos en detalle en la sección de [Requerimientos No Funcionales](#requerimientos-no-funcionales). Resumen ejecutivo:

- Sincronización < 1 segundo, editor < 100ms, carga < 3 segundos
- 10 usuarios simultáneos sin degradación
- Cero pérdida de datos, historial inmutable
- Uptime 99.5%+

### Resultados Medibles

| Métrica | Objetivo | Plazo |
|---------|----------|-------|
| Usuarios activos (lectura + edición) | 10/10 del equipo | 2 semanas post-deploy |
| Ediciones sin intermediario | Usuarios no técnicos editan solos | 1 semana post-onboarding |
| Documentos migrados | 100% de docs del equipo en la plataforma | 1 mes |
| Incidentes de versiones perdidas | 0 | Continuo |
| Operaciones MCP exitosas | Uso diario desde Claude Code | 2 semanas post-deploy |
| GitHub stars (post OS) | Crecimiento mensual sostenido | Fase 2+ |

## User Journeys

### Journey 1: Carlos — El Ciclo Completo IA ↔ Equipo

**Persona:** Carlos, desarrollador full-stack y usuario avanzado de Claude Code. Genera la mayoría de documentación del equipo con IA. Está cansado de ser el intermediario de todos los cambios.

**Escena inicial:** Carlos terminó una sesión con Claude Code donde generó un brief de marketing. Antes, habría subido el archivo a Slack con un "revísenlo y me dicen". Ahora abre su terminal.

**Acción:** Desde Claude Code, ejecuta un comando MCP que lista las carpetas de la plataforma. Navega hasta `/marketing/campañas/` y crea el documento directamente ahí. El brief aparece en la plataforma al instante.

**Clímax:** Dos horas después, lee el documento vía MCP y descubre que Valentina ya corrigió la sección de audiencia y Diego agregó una nota sobre presupuesto. Claude Code tiene el contexto actualizado sin que Carlos haya pedido nada a nadie. Itera sobre el documento con la IA incorporando las ediciones del equipo.

**Resolución:** El documento vivió su ciclo completo — generado por IA, editado por humanos, consumido de vuelta por IA — sin un solo mensaje de Slack pidiendo revisiones.

---

### Journey 2: Valentina — La Primera Edición Sin Miedo

**Persona:** Valentina, profesional de marketing y producción audiovisual. No sabe markdown. La última vez que le enviaron un archivo `.md` lo abrió en el bloc de notas y vio símbolos que no entendió.

**Escena inicial:** Valentina recibe un email de invitación, crea su cuenta, y llega al dashboard. Ve una estructura de carpetas familiar — como Google Drive. Abre "Marketing" y ve el brief que Carlos generó.

**Acción:** El documento se abre en modo visualizador — limpio, con títulos y listas formateadas. Detecta un error: dice "profesionales de 25-35" pero debería ser "18-28". Hace clic en "Editar" y la interfaz cambia a modo híbrido: editor markdown a la izquierda, preview renderizado a la derecha, toolbar con botones familiares arriba.

**Clímax:** Cambia "25-35" por "18-28" y ve el cambio reflejarse en el preview. Luego hace clic en "H2" del toolbar para agregar un subtítulo — ve el markdown generarse automáticamente. Entiende que puede editar sin miedo.

**Resolución:** No tuvo que pedirle a Carlos que hiciera el cambio. No tuvo que aprender markdown. Sabe exactamente cómo hacerlo la próxima vez.

---

### Journey 3: Diego — Alineación en Tiempo Real

**Persona:** Diego, fundador y product owner. Su dolor principal es trabajar con documentos desactualizados.

**Escena inicial:** Tiene una reunión en 30 minutos y necesita revisar la propuesta técnica. Antes, habría buscado en Slack el último archivo compartido sin saber si era la versión final.

**Acción:** Abre la plataforma, navega a `/proyectos/cliente-x/propuesta.md` y lee en modo visualizador. Los plazos del timeline no están alineados con lo acordado ayer.

**Clímax:** Cambia a modo híbrido, ajusta las fechas, y ve que un cursor con el nombre "Carlos" aparece — está editando la sección de arquitectura simultáneamente. Diego ve los cambios en tiempo real. Abre el historial y confirma que Valentina editó el alcance esa mañana.

**Resolución:** Entra a la reunión con la certeza de que el documento refleja el estado actual. Sus correcciones ya son visibles para todos.

---

### Journey 4: Carlos como Admin — Configuración Inicial

**Persona:** Carlos en su rol de administrador del sistema.

**Escena inicial:** Acaba de desplegar la plataforma. Accede como administrador y ve un dashboard limpio.

**Acción:** Crea carpetas: `/general/`, `/marketing/`, `/producto/`, `/técnico/`, `/proyectos/`. Crea tres grupos: "Desarrollo" (Carlos + 2 devs), "Marketing" (Valentina + 3 personas), "Liderazgo" (Diego + 1 cofundador). Asigna permisos: Desarrollo ve y edita todo; Marketing ve todo pero solo edita `/marketing/` y `/general/`; Liderazgo ve y edita todo.

**Clímax:** Envía invitaciones. En 15 minutos, 6 de 10 ya crearon cuenta. Sube documentos — algunos importados desde `.md` locales, otros creados vía MCP desde Claude Code. La plataforma pasa de vacía a funcional en menos de una hora.

**Resolución:** Cada persona ve solo lo que debe y edita solo donde tiene permiso. API key de MCP configurada. Setup completo.

---

### Journey 5: Conexión MCP Externa — Permisos y Límites

**Persona:** Un script con OpenAI que se conecta vía MCP usando la API key de Valentina (grupo Marketing).

**Escena inicial:** El script se conecta al servidor MCP de la plataforma.

**Acción:** Lista carpetas disponibles — ve todas (visibles para Marketing). Lee exitosamente `/marketing/campañas/brief-q2.md`. Intenta editar `/técnico/arquitectura.md`.

**Clímax:** La plataforma rechaza la edición con error de permisos claro: Marketing tiene solo lectura en `/técnico/`. El script recibe un mensaje descriptivo indicando qué permiso falta.

**Resolución:** La integración MCP respeta los mismos permisos que la interfaz web. Una API key hereda exactamente los permisos del usuario/grupo — sin excepciones.

---

### Resumen de Requerimientos por Journey

| Journey | Capacidades Reveladas |
|---------|----------------------|
| **Carlos — Ciclo IA** | Servidor MCP (CRUD docs), sincronización en tiempo real, estructura de carpetas |
| **Valentina — Primera edición** | Modo híbrido, toolbar markdown, visualizador, onboarding intuitivo, permisos por carpeta |
| **Diego — Alineación** | Visualizador, modo híbrido, cursores en tiempo real, historial de cambios, presencia de usuarios |
| **Carlos Admin — Setup** | Gestión de carpetas, grupos, permisos, invitaciones, import de archivos, API keys MCP |
| **MCP Externo — Permisos** | Autenticación API key, herencia de permisos, errores descriptivos, operaciones CRUD con control de acceso |

## Innovación y Patrones Novedosos

### Áreas de Innovación Detectadas

**MCP como ciudadano de primera clase en un editor colaborativo.** Mientras Notion ofrece APIs y conectores MCP comunitarios como capa adicional, Markdown integra MCP desde el diseño. Esto habilita un patrón nuevo: la plataforma de documentación como fuente de verdad bidireccional para humanos y máquinas.

**Ciclo cerrado IA ↔ Equipo ↔ IA.** Generar con IA, colaborar como equipo, consumir de vuelta con IA — no existe hoy en un solo producto gratuito y self-hosted. Los editores colaborativos no tienen MCP; las herramientas con MCP no tienen colaboración en tiempo real.

**Markdown puro con accesibilidad para no técnicos.** 100% markdown nativo con modo híbrido y toolbar que lo hace accesible sin sacrificar la pureza del formato.

### Contexto de Mercado

| Alternativa | Limitación vs Markdown |
|-------------|----------------------|
| **Notion** | De pago, cerrado, no markdown-nativo. MCP es capa comunitaria, no integración core |
| **HackMD/CodiMD** | Sin integración MCP ni enfoque en ciclo con IA |
| **Obsidian** | Editor local sin colaboración en tiempo real ni MCP server |
| **Google Docs** | Desconectado del ecosistema markdown/IA |

Ninguna alternativa combina: markdown nativo + colaboración en tiempo real + MCP server + self-hosted + gratuito.

### Validación e Iteración

- **Validación por uso real**: Ciclo completo MCP durante 2 semanas como prueba de concepto
- **Validación de adopción**: Equipo completo usa la plataforma como fuente única de verdad
- **Iteración empírica**: El uso continuo revela si la solución es acertada o necesita ajustes

### Mitigación de Riesgos de Innovación

- **MCP tarda en madurar**: La plataforma sigue siendo valiosa como editor markdown colaborativo. MCP es diferenciador, no único valor
- **Adopción de MCP baja en el equipo**: El flujo web es el camino principal. MCP es acelerador para usuarios técnicos
- **Dependencia de protocolo**: MCP es protocolo abierto respaldado por Anthropic — riesgo de lock-in bajo. Arquitectura de API keys y permisos es adaptable

## Requerimientos Específicos de Web App

### Arquitectura Técnica

**Tipo de aplicación:** SPA (Single Page Application)
- Navegación client-side con routing dinámico
- Estado en tiempo real gestionado via WebSocket
- Renderizado client-side con hidratación de datos desde el servidor

**Comunicación en tiempo real:**
- WebSocket como canal principal para sincronización colaborativa (cambios de documento, presencia de usuarios, cursores)
- REST API para operaciones CRUD estándar (gestión de carpetas, usuarios, grupos, permisos)
- Reconexión automática ante pérdida de conexión con reconciliación de cambios pendientes

**Servidor MCP:**
- Endpoint MCP independiente del frontend, expuesto como servicio
- Autenticación por API key con mapeo a usuario/grupo
- Operaciones: listar carpetas/documentos, leer, editar, crear documento
- Mismo modelo de permisos que la interfaz web

### Matriz de Navegadores

| Navegador | Versión Mínima | Soporte |
|-----------|---------------|---------|
| Chrome | Últimas 2 versiones | Completo |
| Firefox | Últimas 2 versiones | Completo |
| Safari | Últimas 2 versiones | Completo |
| Edge | Últimas 2 versiones | Completo |
| IE / navegadores legacy | — | No soportado |

### Diseño Responsive

| Dispositivo | Breakpoint | Experiencia |
|-------------|-----------|-------------|
| **Desktop** (>1024px) | Primario | Experiencia completa: 3 modos, split view, toolbar, sidebar de carpetas |
| **Tablet** (768-1024px) | Secundario | Modos editor y visualizador completos. Híbrido con split vertical. Sidebar colapsable |
| **Móvil** (<768px) | Terciario | Editor y visualizador por separado (sin split). Toolbar simplificado. Carpetas en drawer |

### Consideraciones de Implementación

**SEO:** No es prioridad — aplicación autenticada sin contenido público indexable.

**PWA:** No incluido en MVP. Se evaluará en fases futuras.

## Scoping del Proyecto y Desarrollo por Fases

### Estrategia y Filosofía del MVP

**Enfoque:** MVP de experiencia — tiene que sentirse intuitivo, fácil de usar y al grano. La adopción depende de que la experiencia sea tan natural como Google Docs en el ecosistema markdown/IA.

**Principio guía:** Cada feature debe soportar al menos uno de estos objetivos: (1) que el equipo colabore sin fricción, o (2) que la IA se integre directamente al flujo de trabajo.

**Recursos:** Un solo desarrollador (Juan David) con Claude como asistente tiempo completo. Implica:
- Maximizar uso de librerías probadas (especialmente para colaboración en tiempo real y editor markdown)
- Priorizar decisiones tecnológicas que reduzcan complejidad de mantenimiento
- Desarrollo iterativo — funcional primero, pulido después

### Feature Set del MVP (Fase 1)

**Todos los journeys soportados desde el MVP:**
- Carlos — Ciclo IA completo (MCP + colaboración)
- Valentina — Primera edición sin miedo (modo híbrido + toolbar)
- Diego — Alineación en tiempo real (visualizador + historial)
- Carlos Admin — Setup inicial (carpetas + grupos + permisos)
- MCP Externo — Permisos y límites (API keys + control de acceso)

**Capacidades imprescindibles:**

| Capacidad | Justificación | Complejidad |
|-----------|--------------|-------------|
| Editor markdown con 3 modos | Core del producto | Media |
| Toolbar de asistencia markdown | Habilita usuarios no técnicos | Baja |
| Colaboración en tiempo real simultánea | Imprescindible desde día 1 | **Alta** |
| Historial de cambios con revert | Confianza del equipo, prevención de pérdida de datos | Media |
| Gestión de carpetas y documentos | Estructura organizativa básica | Baja |
| Sistema de usuarios con autenticación | Prerequisito para permisos y colaboración | Media |
| Grupos y permisos por carpeta (ver/editar) | Control de acceso del equipo | Media |
| Servidor MCP (CRUD + API keys) | Diferenciador principal — ciclo IA ↔ Equipo | Media |
| Import/Export markdown | Migración de documentos existentes | Baja |
| Búsqueda de contenido | Navegabilidad a escala | Baja |
| Sync scroll (modo híbrido) | Experiencia de edición fluida | Baja |
| Temas (dark/light mode) | Expectativa estándar | Baja |
| Diseño responsive (tablet + móvil) | Acceso desde cualquier dispositivo | Media |

**Ruta crítica técnica:** Colaboración en tiempo real es el componente de mayor riesgo. Abordarla primero usando CRDTs (Yjs, Automerge, o similar) para validar viabilidad temprano.

### Fase 2 — Crecimiento (Post-MVP)

- Estadísticas del documento (conteo de palabras, tiempo de lectura)
- Sistema de comentarios y anotaciones en línea
- Notificaciones de cambios (email, in-app)
- API pública REST para integraciones más allá del MCP
- WCAG AA completo (screen readers, ARIA roles)
- PWA para experiencia instalable en móvil

### Fase 3 — Expansión y Comunidad

- Lanzamiento open source en GitHub
- Documentación para instalación y contribución
- Ecosistema de plugins comunitarios
- Extensiones (templates, exportación a PDF, diagramas mermaid)
- Soporte offline básico

### Estrategia de Mitigación de Riesgos

**Riesgos técnicos:**
- **Colaboración en tiempo real (ALTO):** CRDTs via librería probada. Prototipo funcional como primera tarea de desarrollo
- **Editor markdown (MEDIO):** Editor existente como base (CodeMirror 6 o Monaco). Rendering con librería probada (marked, remark)
- **Servidor MCP (MEDIO):** Protocolo con SDK oficial — implementación relativamente directa

**Riesgos de mercado:**
- **Adopción del equipo:** Mitigado por diseño intuitivo. Feedback directo permite iterar rápido
- **Competencia:** El diferenciador MCP-nativo + self-hosted + gratuito es difícil de replicar por productos comerciales

**Riesgos de recursos:**
- **Desarrollador solo:** Mitigado por Claude como asistente, librerías probadas, y scope controlado
- **Features recortables de emergencia:** Búsqueda, import/export, temas — el MVP funciona sin ellos con experiencia reducida

## Requerimientos Funcionales

### Edición de Documentos

- **FR1:** El usuario puede crear nuevos documentos markdown dentro de una carpeta
- **FR2:** El usuario puede editar documentos en modo editor markdown puro (código en crudo)
- **FR3:** El usuario puede ver documentos en modo visualizador renderizado (solo lectura)
- **FR4:** El usuario puede editar documentos en modo híbrido (editor markdown + preview renderizado en panel dividido)
- **FR5:** El usuario puede alternar entre los 3 modos de visualización en cualquier momento
- **FR6:** El usuario puede insertar sintaxis markdown mediante un toolbar de asistencia (negritas, cursivas, headers, listas, links, tablas, código, imágenes)
- **FR7:** El editor mantiene sincronización de scroll entre editor y preview en modo híbrido
- **FR8:** El usuario puede cambiar la apariencia visual entre tema claro y tema oscuro

### Colaboración en Tiempo Real

- **FR9:** Múltiples usuarios pueden editar el mismo documento simultáneamente con cambios visibles al instante
- **FR10:** El usuario puede ver la presencia de otros usuarios activos en el documento (cursores con nombre)
- **FR11:** El sistema reconcilia cambios concurrentes sin pérdida de datos ni conflictos
- **FR12:** El sistema reconecta automáticamente ante pérdida de conexión y sincroniza cambios pendientes

### Historial de Cambios

- **FR13:** El usuario puede ver el historial completo de cambios (quién modificó qué y cuándo)
- **FR14:** El usuario puede revertir un documento a una versión anterior
- **FR15:** El sistema registra cada cambio con autor, timestamp y contenido modificado

### Gestión de Documentos y Carpetas

- **FR16:** El usuario puede crear, renombrar y eliminar carpetas en estructura jerárquica
- **FR17:** El usuario puede mover documentos entre carpetas
- **FR18:** El usuario puede importar archivos markdown (.md) desde su dispositivo
- **FR19:** El usuario puede exportar documentos como archivos markdown (.md)
- **FR20:** El usuario puede buscar contenido a través de todos los documentos a los que tiene acceso

### Gestión de Usuarios

- **FR21:** El usuario puede registrarse y autenticarse en la plataforma
- **FR22:** El administrador puede invitar nuevos usuarios
- **FR23:** El administrador puede crear, editar y eliminar grupos de usuarios
- **FR24:** El administrador puede asignar y remover usuarios de grupos

### Permisos y Control de Acceso

- **FR25:** El administrador puede asignar permisos por carpeta a cada grupo (puede ver / puede editar)
- **FR26:** El sistema restringe acceso a documentos según los permisos del grupo del usuario
- **FR27:** Un usuario sin permiso de edición puede ver el documento pero no modificarlo
- **FR28:** Un usuario sin permiso de visualización no puede ver el contenido de la carpeta ni sus documentos

### Integración MCP (Model Context Protocol)

- **FR29:** El sistema expone un servidor MCP para conexión de herramientas de IA
- **FR30:** Un cliente MCP puede listar carpetas y documentos disponibles según sus permisos
- **FR31:** Un cliente MCP puede leer el contenido completo de un documento
- **FR32:** Un cliente MCP puede editar el contenido de un documento existente
- **FR33:** Un cliente MCP puede crear nuevos documentos dentro de una carpeta
- **FR34:** El usuario puede generar y revocar API keys para autenticación MCP
- **FR35:** Las API keys heredan los permisos del usuario/grupo al que están vinculadas
- **FR36:** El servidor MCP retorna errores descriptivos cuando una operación es rechazada por permisos insuficientes

### Experiencia Responsive

- **FR37:** El usuario puede acceder y usar la plataforma desde desktop, tablet y móvil con experiencia adaptada
- **FR38:** En móvil, el usuario puede navegar carpetas y documentos mediante un drawer de navegación
- **FR39:** En móvil, el usuario puede editar en modo editor o ver en modo visualizador (sin split)

## Requerimientos No Funcionales

### Rendimiento

- **NFR1:** Pulsaciones de teclado en el editor reflejadas en pantalla en < 100ms
- **NFR2:** Cambios propagados a todos los participantes del documento en < 1 segundo
- **NFR3:** Carga inicial de la aplicación (LCP) en < 3 segundos
- **NFR4:** Documento listo para editar (Time to Interactive) en < 4 segundos
- **NFR5:** Renderizado markdown a HTML en < 200ms para documentos de hasta 10,000 líneas
- **NFR6:** Bundle inicial < 500KB gzipped
- **NFR7:** 10 usuarios editando simultáneamente el mismo documento sin degradación perceptible

### Seguridad

- **NFR8:** Todas las comunicaciones via HTTPS/WSS (TLS 1.2+)
- **NFR9:** Contraseñas almacenadas con bcrypt o equivalente
- **NFR10:** Tokens de sesión con expiración configurable y revocables
- **NFR11:** API keys de MCP revocables inmediatamente por usuario o administrador
- **NFR12:** Protección contra XSS, CSRF, e inyección SQL
- **NFR13:** Headers de seguridad HTTP configurados (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
- **NFR14:** Contenido markdown renderizado sanitizado para prevenir ejecución de scripts

### Fiabilidad y Datos

- **NFR15:** Cero pérdida de datos — todo cambio confirmado por el servidor debe persistirse
- **NFR16:** Historial de cambios inmutable — ninguna operación puede eliminar el registro histórico
- **NFR17:** Ante desconexión, cambios locales preservados y sincronizados automáticamente al reconectar
- **NFR18:** Uptime 99.5%+ en entorno self-hosted (excluyendo mantenimiento planificado)
- **NFR19:** Base de datos con soporte para backups periódicos sin interrupción del servicio

### Integración (MCP)

- **NFR20:** Operaciones de lectura MCP en < 500ms
- **NFR21:** Protocolo MCP estándar vigente con compatibilidad hacia atrás en versiones menores
- **NFR22:** Operaciones MCP respetan idénticamente el modelo de permisos de la interfaz web — sin excepciones
- **NFR23:** Errores MCP con mensajes descriptivos y códigos de error estándar del protocolo

### Usabilidad

- **NFR24:** Usuario no técnico edita su primer documento en modo híbrido sin instrucción previa en < 2 minutos
- **NFR25:** Navegación por teclado en todas las funciones interactivas del editor (Tab, Enter, Escape)
- **NFR26:** Contraste visual mínimo 4.5:1 en ambos temas (claro y oscuro)
- **NFR27:** Interfaz adaptada a breakpoints definidos (desktop >1024px, tablet 768-1024px, móvil <768px) sin pérdida de funcionalidad core

### Mantenibilidad

- **NFR28:** Despliegue en entorno self-hosted mediante proceso documentado de máximo 5 pasos
- **NFR29:** Actualizaciones sin migración manual de datos — migraciones automáticas
