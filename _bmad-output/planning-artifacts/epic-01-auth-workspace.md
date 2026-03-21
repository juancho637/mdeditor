# Epic 1: Autenticación y Configuración del Workspace

Los usuarios pueden registrarse, autenticarse e invitar a su equipo. El administrador puede configurar grupos y la estructura inicial del workspace.

**FRs cubiertos:** FR21, FR22, FR23, FR24
**NFRs relevantes:** NFR8 (HTTPS), NFR9 (bcrypt), NFR10 (tokens revocables), NFR12 (XSS/CSRF/SQLi), NFR13 (headers seguridad), NFR28 (deploy 5 pasos), NFR29 (migraciones automáticas)
**UX-DRs relevantes:** UX-DR1, UX-DR3, UX-DR4, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR17, UX-DR24

---

### Story 1.1: Registro del Primer Administrador y Setup Inicial

As a **primer usuario (administrador)**,
I want **acceder a la plataforma recién desplegada y crear mi cuenta de administrador**,
So that **pueda comenzar a configurar el workspace e invitar a mi equipo**.

**Acceptance Criteria:**

**Given** la plataforma está desplegada por primera vez con `docker compose up`
**When** accedo a la URL de la plataforma
**Then** veo la pantalla de setup inicial con formulario de registro (nombre, email, contraseña)
**And** la contraseña requiere mínimo 8 caracteres con validación inline al perder foco

**Given** completo el formulario de setup inicial con datos válidos
**When** envío el formulario
**Then** se crea mi cuenta de administrador con contraseña hasheada con bcrypt
**And** inicio sesión automáticamente con tokens JWT (access + refresh)
**And** soy redirigido al dashboard con empty state ("Bienvenido a markdown. Crea tu primera carpeta")

**Given** ya existe al menos un administrador en el sistema
**When** accedo a la URL de la plataforma sin estar autenticado
**Then** veo la pantalla de login en lugar del setup inicial

**Given** no estoy autenticado
**When** intento acceder a cualquier ruta protegida del dashboard
**Then** soy redirigido a la pantalla de login

*Nota técnica: Esta historia incluye la infraestructura fundacional — Docker Compose (api + web + postgres), configuración de entorno con validación (.env), módulo common de NestJS (interceptors, exception service, response wrapper, request-id middleware, logging interceptor), módulo auth (JWT + bcrypt + guards), módulo users con entidad user en TypeORM y migración, frontend Next.js con shadcn/ui + design tokens CSS Variables (UX-DR1), sistema tipográfico Inter + JetBrains Mono (UX-DR3), sistema de espaciado base 4px (UX-DR4), layout base con header 48px (UX-DR14), jerarquía de botones (UX-DR15), sistema de toasts (UX-DR16), patrones de formularios con validación (UX-DR17), border-radius consistente (UX-DR24), empty state del dashboard (UX-DR13), health check endpoint, Helmet para headers de seguridad (NFR13).*

---

### Story 1.2: Login y Gestión de Sesión

As a **usuario registrado**,
I want **iniciar sesión con mi email y contraseña y mantener mi sesión activa de forma segura**,
So that **pueda acceder a la plataforma sin re-autenticarme constantemente**.

**Acceptance Criteria:**

**Given** soy un usuario registrado
**When** ingreso email y contraseña correctos en la pantalla de login
**Then** inicio sesión exitosamente y veo el dashboard
**And** recibo un access token (15-30min) y un refresh token (7-30 días) en HTTP-only cookie

**Given** estoy autenticado y mi access token expira
**When** realizo cualquier acción en la plataforma
**Then** el sistema renueva el token automáticamente usando el refresh token sin interrumpir mi sesión

**Given** estoy en la pantalla de login
**When** ingreso credenciales incorrectas
**Then** veo un mensaje de error genérico ("Credenciales inválidas") sin revelar si el email existe
**And** tras 5 intentos fallidos en 1 minuto, recibo un error de rate limiting

**Given** estoy autenticado
**When** hago clic en logout
**Then** mi sesión se invalida, los tokens se revocan y soy redirigido al login

---

### Story 1.3: Invitación de Nuevos Usuarios

As a **administrador**,
I want **invitar nuevos usuarios al workspace enviándoles un link de registro**,
So that **mi equipo pueda crear sus cuentas y acceder a la plataforma**.

**Acceptance Criteria:**

**Given** soy administrador y navego a Configuración → Usuarios
**When** ingreso un email válido y hago clic en "Invitar"
**Then** se genera un link de invitación único vinculado a ese email
**And** veo un toast de confirmación "Invitación creada"
**And** el link aparece copiable en la interfaz para compartirlo manualmente

**Given** recibo un link de invitación válido
**When** lo abro en el navegador
**Then** veo un formulario de registro con mi email pre-rellenado (solo nombre y contraseña editables)
**And** al completarlo se crea mi cuenta y accedo al dashboard

**Given** soy administrador
**When** intento invitar un email que ya tiene cuenta activa
**Then** veo un error inline "Este usuario ya tiene una cuenta"

**Given** un link de invitación ya fue utilizado
**When** intento acceder a él de nuevo
**Then** veo un mensaje "Esta invitación ya fue utilizada" con link al login

---

### Story 1.4: Gestión de Grupos de Usuarios

As a **administrador**,
I want **crear grupos, asignar usuarios a ellos y gestionar las membresías**,
So that **pueda organizar al equipo por roles para luego asignar permisos por carpeta**.

**Acceptance Criteria:**

**Given** soy administrador y navego a Configuración → Grupos
**When** hago clic en "Crear grupo" e ingreso un nombre (ej: "Marketing")
**Then** el grupo aparece en la lista con 0 miembros

**Given** existe un grupo y usuarios registrados
**When** selecciono usuarios desde la lista y los asigno al grupo
**Then** los usuarios aparecen como miembros del grupo
**And** un usuario puede pertenecer a múltiples grupos

**Given** un usuario pertenece a un grupo
**When** lo remuevo del grupo
**Then** el usuario desaparece de la lista de miembros del grupo

**Given** soy administrador
**When** edito el nombre de un grupo existente
**Then** el nuevo nombre se refleja en toda la interfaz

**Given** un grupo existe
**When** intento eliminarlo
**Then** aparece un dialog de confirmación con botón destructivo ("Eliminar grupo")
**And** tras confirmar, el grupo se elimina y sus permisos asociados se revocan

**Given** intento crear un grupo con un nombre que ya existe
**When** envío el formulario
**Then** veo un error "Ya existe un grupo con este nombre"

*Nota técnica: Incluye entidades groups y user_groups en TypeORM con migraciones, CRUD endpoints REST, componentes GroupManager y lista de usuarios en frontend.*
