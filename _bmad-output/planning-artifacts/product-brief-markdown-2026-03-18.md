---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-03-18
author: Juan David
---

# Product Brief: markdown

## Resumen Ejecutivo

Markdown es una plataforma web colaborativa de edición de documentos en markdown, diseñada para equipos pequeños que necesitan una fuente única de verdad para su documentación. Ofrece tres modos de interacción — editor markdown puro, visualizador renderizado y modo híbrido con toolbar de asistencia — permitiendo que usuarios técnicos y no técnicos colaboren en tiempo real sobre los mismos documentos, donde todo el contenido es markdown por debajo.

El producto resuelve el problema crítico de equipos que generan documentación con herramientas de IA (como Claude Code) pero no tienen forma eficiente de compartir, editar colaborativamente y sincronizar esos documentos sin perder cambios ni versiones. La integración nativa con MCP (Model Context Protocol) permite conectar directamente los documentos con herramientas de IA, cerrando el ciclo completo de generación, colaboración y consumo de contexto.

---

## Visión Central

### Declaración del Problema

Los equipos pequeños multidisciplinarios (desarrolladores, diseñadores, marketers, operadores, fundadores) generan cada vez más documentación a través de herramientas de IA en formato markdown. Sin embargo, compartir y colaborar sobre estos documentos es un proceso fragmentado: cada persona mantiene archivos locales, los comparte por canales informales, y no existe una fuente única de verdad. Los miembros no técnicos del equipo no pueden editar markdown cómodamente, lo que crea un cuello de botella donde una sola persona (el generador) debe gestionar todos los cambios.

### Impacto del Problema

- **Pérdida de cambios**: Sin sincronización en tiempo real, las ediciones se sobreescriben o se pierden entre versiones locales
- **Versiones desactualizadas**: El equipo trabaja con documentos que no reflejan el estado actual, generando desalineación
- **Cuello de botella operativo**: Solo los miembros técnicos pueden generar y editar markdown, limitando la participación del resto del equipo
- **Flujo de IA interrumpido**: Los documentos generados con IA no pueden retroalimentarse fácilmente con las ediciones del equipo para ser reutilizados como contexto

### Por Qué las Soluciones Existentes Se Quedan Cortas

#### Editores Markdown Web (Markdown Viewer, StackEdit y similares)

Estas herramientas ofrecen una experiencia de edición individual sólida — 3 modos de vista (editor/split/preview), toolbar de asistencia, import/export, y estadísticas del documento. Sin embargo, son herramientas de **un solo usuario**: no tienen colaboración en tiempo real, historial de cambios, sistema de usuarios/permisos, ni gestión de carpetas. Resuelven la edición pero no la colaboración.

#### Otras Soluciones

- **Obsidian**: Excelente editor markdown pero diseñado para uso individual/local, sin colaboración en tiempo real
- **Google Docs/Word**: Colaboración en tiempo real perfecta, pero no son markdown-native y rompen el flujo con herramientas de IA
- **Confluence/Notion**: Colaborativos pero costosos para equipos pequeños, pesados, y sin integración directa con flujos de IA/MCP
- **HackMD y similares**: Ofrecen edición colaborativa de markdown pero con planes de pago que no justifican el costo para equipos pequeños

#### Comparativa con Editores Web Existentes

| Feature | Editores web existentes | **Markdown (nuestro producto)** |
|---------|------------------------|-------------------------------|
| 3 modos (editor/split/preview) | Si | Si |
| Toolbar de asistencia markdown | Algunos | Si |
| Colaboración en tiempo real | No | **Si** |
| Historial de cambios | No | **Si** |
| Sistema de usuarios y grupos | No | **Si** |
| Permisos por carpeta (ver/editar) | No | **Si** |
| Gestión de carpetas/documentos | No | **Si** |
| Estadísticas del documento | Algunos | Fase 2 |
| Import/Export | Si | Si |
| Sync scroll | Si | Si |
| Integración MCP | No | **Si** |

### Solución Propuesta

Una aplicación web self-hosted con tres modos de interacción, donde todo el contenido es markdown por debajo:
1. **Editor markdown puro** — Código markdown en crudo para usuarios técnicos que dominan la sintaxis
2. **Visualizador puro** — Documento renderizado en solo lectura para consultar contenido
3. **Modo híbrido** — Panel dividido con editor markdown + preview renderizado, e incluye un toolbar de herramientas que facilita insertar sintaxis markdown (negritas, headers, listas, links, etc.) sin necesidad de memorizarla

Complementado con:
4. **Colaboración en tiempo real** donde múltiples usuarios pueden editar simultáneamente y ver los cambios al instante
5. **Historial de cambios** completo para rastrear quién modificó qué y cuándo, con capacidad de revertir
6. **Sistema de grupos y permisos** simple por carpeta (puede ver / puede editar)
7. **Integración MCP** que permite a herramientas como Claude Code conectarse directamente a los documentos para leer, editar y crear contenido

### Diferenciadores Clave

- **Gratuito y self-hosted**: Sin costos de suscripción, el equipo mantiene control total de sus datos
- **Puente IA-Equipo**: Diseñado específicamente para cerrar el ciclo entre generación de contenido con IA y colaboración humana
- **100% markdown nativo**: Sin capas de abstracción WYSIWYG — todo es markdown por debajo, con herramientas de asistencia para quienes no dominan la sintaxis
- **MCP-native**: Integración directa con herramientas de IA a través del Model Context Protocol, algo que ninguna alternativa actual ofrece
- **Ligero y enfocado**: Sin la complejidad de un wiki enterprise — solo edición colaborativa de markdown, simple y efectiva

---

## Usuarios Objetivo

### Usuarios Primarios

#### Persona 1: Carlos — El Desarrollador / Generador de Contenido IA
- **Rol**: Desarrollador con acceso a herramientas de IA (Claude Code)
- **Contexto**: Es quien genera la mayoría de documentos usando IA — desde specs técnicas hasta briefs de marketing. Actualmente es el cuello de botella porque solo él puede crear y distribuir los documentos al equipo
- **Problema actual**: Genera documentos con Claude Code, los pasa manualmente al equipo, pero no tiene forma eficiente de recibir las ediciones de vuelta. Termina siendo intermediario de todos los cambios
- **Motivación**: Dejar de ser el intermediario. Que el equipo pueda ver, editar y colaborar sin depender de él
- **Modo de uso preferido**: Editor markdown puro y MCP desde Claude Code — trabaja directamente con la sintaxis o conecta desde sus herramientas de IA
- **Momento "aha!"**: Cuando desde Claude Code lista los documentos de una carpeta, edita uno directamente vía MCP, y el equipo ve los cambios al instante en la plataforma

#### Persona 2: Valentina — La Marketer / Producción Audiovisual
- **Rol**: Profesional no técnica de marketing o producción audiovisual
- **Contexto**: Necesita revisar y corregir documentos que desarrollo genera con IA (briefs de marketing, guiones, estrategias). No sabe markdown ni quiere aprenderlo
- **Problema actual**: Recibe archivos markdown que no puede editar cómodamente. Hace comentarios por chat o email, y alguien más los aplica
- **Motivación**: Poder ver los documentos de forma clara y editarlos sin tener que memorizar sintaxis markdown
- **Modo de uso preferido**: Modo híbrido — escribe en el editor apoyándose en el panel de herramientas (toolbar) para insertar sintaxis markdown, mientras ve el resultado renderizado en tiempo real en el panel de preview
- **Momento "aha!"**: Cuando usa el toolbar para poner un título o negrita, ve el markdown generarse automáticamente a un lado y el resultado visual al otro, y entiende que puede editar sin miedo

#### Persona 3: Diego — El Fundador / Product Owner
- **Rol**: Fundador o líder de producto que define dirección estratégica
- **Contexto**: Necesita escribir y refinar documentación de producto, validar propuestas del equipo, y asegurar que todos estén alineados
- **Problema actual**: Revisa documentos desactualizados porque no tiene acceso a la última versión. Sus correcciones se pierden o llegan tarde
- **Motivación**: Tener una fuente única de verdad donde pueda ver el estado actual de cualquier documento y hacer sus aportes
- **Modo de uso preferido**: Visualizador puro para consultar, modo híbrido cuando necesita editar
- **Momento "aha!"**: Cuando ve que los cambios que hace aparecen en tiempo real para todo el equipo y quedan registrados en el historial

### Usuarios Secundarios

- **Administrador del sistema (inicialmente Carlos)**: Gestiona grupos, permisos de carpetas (ver/editar), e invita nuevos miembros al equipo
- **Lectores ocasionales**: Miembros que solo necesitan consultar documentos sin editarlos, con acceso de solo lectura a ciertas carpetas

### Journey del Usuario

1. **Descubrimiento**: Carlos (el desarrollador) presenta la herramienta al equipo directamente
2. **Onboarding**: Carlos configura la plataforma, crea los grupos y asigna permisos por carpeta (ver/editar). Invita a los miembros del equipo
3. **Uso principal**:
   - Carlos genera documentos con Claude Code y los publica directamente en la plataforma vía MCP
   - Valentina abre el modo híbrido: usa el toolbar para editar y ve el preview en tiempo real
   - Diego consulta en modo visualizador y cambia a híbrido cuando necesita editar
   - Carlos trabaja en modo editor markdown puro o directamente desde Claude Code vía MCP
   - Todos ven las ediciones de los demás en tiempo real
4. **Momento de valor**: Cuando el primer documento es editado colaborativamente sin que nadie tenga que pedirle a Carlos que haga los cambios por ellos
5. **Uso a largo plazo**: La plataforma se convierte en la fuente única de verdad del equipo. El historial de cambios genera confianza. La integración MCP cierra el ciclo completo entre generación con IA y colaboración humana

### Tres Modos de Interacción

| Modo | Descripción | Usuario típico |
|------|------------|----------------|
| **Editor markdown puro** | Solo el código markdown en crudo | Desarrolladores y usuarios técnicos |
| **Visualizador puro** | Documento renderizado, solo lectura | Cualquier miembro consultando documentos |
| **Híbrido** | Panel dividido: editor markdown + preview renderizado. Incluye toolbar de herramientas para insertar sintaxis markdown sin memorizarla | Usuarios no técnicos que necesitan editar |

---

## Métricas de Éxito

### Éxito del Usuario (Equipo Interno - Fase 1)

- **Adopción del equipo**: Las 10 personas del equipo usan activamente la plataforma en las primeras 2 semanas
- **Eliminación del cuello de botella**: Carlos deja de ser intermediario — los miembros no técnicos editan documentos por su cuenta
- **Fuente única de verdad**: El equipo deja de compartir archivos por chat/email y consulta todo en la plataforma
- **Colaboración activa**: Al menos 3 personas editan un mismo documento de forma colaborativa en una semana típica
- **Reducción de conflictos de versiones**: No se reportan incidentes de documentos desactualizados o cambios perdidos

### Éxito de Comunidad (Open Source - Fase 2)

- **Adopción orgánica**: Otros equipos descubren, instalan y usan la herramienta por cuenta propia
- **Contribuciones de la comunidad**: Desarrolladores externos envían PRs, reportan bugs, y proponen features
- **Comunidad activa**: Formación de una comunidad alrededor del proyecto (GitHub stars, discussions, forks activos)
- **Ecosistema de integraciones**: La comunidad contribuye integraciones (plugins, extensiones) que enriquecen la plataforma

### Objetivos de Negocio

Este no es un producto comercial. Es un proyecto **open source community-driven** cuyo valor está en:
- **Conectar equipos**: Facilitar la colaboración en documentación generada con IA de forma gratuita
- **Construir comunidad**: Crear un ecosistema de colaboradores y usuarios que alimenten el crecimiento del proyecto
- **Democratizar herramientas de IA**: Que equipos pequeños sin presupuesto tengan acceso a herramientas de documentación colaborativa que hoy solo existen en productos pagos
- **No se busca monetización**: El proyecto se sostiene por la comunidad, no por ingresos

### Indicadores Clave de Rendimiento (KPIs)

| KPI | Fase 1 (Interno) | Fase 2 (Open Source) |
|-----|-------------------|----------------------|
| **Usuarios activos** | 10/10 del equipo | Crecimiento orgánico de instalaciones |
| **Documentos en plataforma** | Migración completa de docs del equipo | N/A — depende de cada equipo |
| **Ediciones colaborativas** | Al menos 1 sesión colaborativa por semana | N/A |
| **Tiempo sin intermediario** | Miembros no técnicos editan sin ayuda en < 1 semana | Onboarding de nuevos usuarios < 10 min |
| **Uso de MCP** | Carlos usa MCP activamente desde Claude Code | Documentación MCP permite adopción externa |
| **GitHub stars** | N/A | Crecimiento sostenido mensual |
| **Contribuciones externas** | N/A | Al menos 1 PR externo por mes en los primeros 6 meses |
| **Issues/Discussions** | Feedback interno del equipo | Comunidad activa respondiendo y proponiendo |

---

## Alcance del MVP

### Funcionalidades Core

**Editor y Visualización:**
- 3 modos de interacción: editor markdown puro, visualizador renderizado (solo lectura), y modo híbrido (split con editor + preview)
- Toolbar de asistencia markdown en modo editor e híbrido para insertar sintaxis sin memorizarla (negritas, headers, listas, links, tablas, código, imágenes, etc.)
- Sync scroll entre editor y preview en modo híbrido
- Temas visual (dark mode / light mode)

**Colaboración:**
- Edición colaborativa en tiempo real — múltiples usuarios editando simultáneamente con cambios visibles al instante
- Historial de cambios completo: quién modificó qué, cuándo, con capacidad de revertir a versiones anteriores

**Gestión de Documentos:**
- Gestión de carpetas y documentos con estructura jerárquica
- Import/Export de archivos markdown
- Búsqueda de contenido a través de todos los documentos de la plataforma

**Usuarios y Permisos:**
- Sistema de usuarios con autenticación
- Grupos de usuarios gestionados por el administrador
- Permisos simples por carpeta: puede ver / puede editar
- Administrador puede invitar personas y asignarlas a grupos

**Integración MCP (Model Context Protocol):**
- Servidor MCP que permite a herramientas de IA (Claude Code, etc.) conectarse a la plataforma
- Operaciones soportadas: listar documentos de una carpeta, leer documento, editar documento, crear documento nuevo en una carpeta
- Autenticación por API key vinculada al usuario, heredando los mismos permisos de grupo del usuario (ver/editar por carpeta)
- Funciona como un explorador de archivos remoto desde las herramientas de IA

### Fuera del Alcance del MVP

- Estadísticas del documento (conteo de palabras, tiempo de lectura, caracteres)
- Comentarios o anotaciones dentro de los documentos (tipo Google Docs)
- Notificaciones cuando alguien edita un documento
- API pública REST para integraciones externas (más allá del MCP)
- Aplicación móvil nativa

### Criterios de Éxito del MVP

El MVP se considerará exitoso cuando:
1. **Adopción completa del equipo**: Las 10 personas del equipo usan la plataforma activamente como fuente única de verdad
2. **Autonomía de usuarios no técnicos**: Los miembros no técnicos editan documentos por su cuenta usando el modo híbrido con toolbar, sin necesitar intermediario
3. **Cero conflictos de versiones**: No se reportan documentos desactualizados ni cambios perdidos gracias a la colaboración en tiempo real y el historial
4. **Confianza en el historial**: El equipo usa activamente el historial de cambios para rastrear y revertir ediciones
5. **Flujo IA integrado**: Carlos puede desde Claude Code listar, leer, editar y crear documentos en la plataforma vía MCP, cerrando el ciclo completo de generación y colaboración
6. **Señal para open source**: El equipo lo usa sin problemas de forma estable, validando que está listo para abrirlo a la comunidad

### Visión a Futuro

**Fase 2 — Mejoras Post-MVP:**
- Estadísticas del documento (conteo de palabras, tiempo de lectura)
- Sistema de comentarios y anotaciones en línea
- Notificaciones de cambios (email, in-app)
- API pública REST para integraciones más allá del MCP

**Fase 3 — Comunidad y Ecosistema:**
- Lanzamiento open source en GitHub
- Documentación para instalación y contribución
- Ecosistema de plugins contribuidos por la comunidad
- Posibles extensiones comunitarias (templates, exportación a PDF, diagramas mermaid renderizados, etc.)
