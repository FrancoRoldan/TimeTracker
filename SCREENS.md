# TimeTracker — Catálogo de Pantallas

> Referencia visual screen-by-screen para recrear el frontend en Flutter u otro framework.
> Ver también: `DESIGN_SYSTEM.md` (tokens, colores, tipografía) y `NAVIGATION.md` (rutas y flujos).

---

## AUTH — Pantallas públicas

### Login `/auth/login`

```
┌──────────────────────────────────────┐
│                                      │
│         Iniciar sesión               │  ← H2, center
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 👤  Email de usuario         │    │  ← text input, required
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🔒  Contraseña          👁   │    │  ← password + toggle visibility
│  └──────────────────────────────┘    │
│                                      │
│  [ ⏳ spinner | [  ingresar  ] ]     │  ← spinner OR full-width raised btn
│                                      │
└──────────────────────────────────────┘
```

- Fondo: layout auth con tema activo
- Botón deshabilitado si form inválido
- Spinner reemplaza botón durante login
- Error: snackbar rojo si credenciales incorrectas

---

### Register `/auth/register`

```
┌──────────────────────────────────────┐
│                                      │
│           Regístrate                 │  ← H2, center
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 👤  Nombre completo          │    │  required
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ ✉   Correo electrónico       │    │  required, email
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🔒  Contraseña          👁   │    │  required
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🔒  Confirmar contraseña 👁  │    │  required, debe coincidir
│  └──────────────────────────────┘    │
│                                      │
│  [ ⏳ spinner | [    aceptar    ] ]  │  ← full-width raised btn
│                                      │
└──────────────────────────────────────┘
```

---

## DASHBOARD `/dashboard`

```
┌─────────────────────────────────────────────────────────┐
│  Bienvenido a Time Tracker                              │  ← H1
│  ¡Hola, {nombre de usuario}!                            │  ← subtitle, muted
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ business  │ │  folder   │ │assignment │             │  ← icon 48px
│  │ Empresas  │ │ Proyectos │ │Incidencias│             │
│  │           │ │           │ │           │             │
│  │ "Ver y    │ │ "Crea y   │ │"Ver incid │             │
│  │  gestionar│ │  gestiona"│ │ seguir... │             │
│  │  empresas"│ │           │ │           │             │
│  │           │ │           │ │[Ver todas]│             │
│  │[Ir a Emp.]│ │[Ir a Proy]│ │[Mis incid]│             │  ← btns
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │   timer   │ │assessment │ │view_kanban│             │
│  │ Registro  │ │ Informes  │ │  Tablero  │             │
│  │ de tiempo │ │           │ │  Kanban   │             │
│  │           │ │           │ │           │             │
│  │"Inicia    │ │"Genera    │ │"Arrastra  │             │
│  │ temp..."  │ │ informes" │ │  y suelta"│             │
│  │           │ │           │ │           │             │
│  │[Registrar]│ │[Ver info.]│ │[Abrir tab]│             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 💡  Guía de inicio rápido   [tertiary-container]│   │
│  │     1. Selecciona una empresa                   │   │
│  │     2. Crea un proyecto                         │   │
│  │     3. ...                                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Grid:** `auto-fill, minmax(320px, 1fr)`, gap 16px  
**Cards:** hover lift `translateY(-4px)` + shadow  
**Guía card:** background `tertiary-container`

---

## COMPANIES — Módulo de empresas

### Lista de Empresas `/companies`

```
┌─────────────────────────────────────────────────┐
│  Empresas                    [+ Crear empresa]  │  ← header
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────┐  ┌───────────────────┐   │
│  │ Nombre empresa    │  │ Nombre empresa    │   │  grid auto-fill 320px
│  │ CODIGO            │  │ CODIGO            │   │  ← subtitle muted
│  │                   │  │                   │   │
│  │ 📅 Creado: fecha  │  │ 📅 Creado: fecha  │   │
│  │ 🟢 Activo         │  │ ⚫ Inactivo        │   │  ← colored circle icon
│  │                   │  │                   │   │
│  │[Seleccionar]      │  │[Seleccionar]      │   │
│  │[Usuarios][Editar] │  │[Usuarios]         │   │  ← Editar/Eliminar solo Admin
│  │[Eliminar]         │  │                   │   │
│  └───────────────────┘  └───────────────────┘   │
│                                                 │
│  Empty state:                                   │
│       business (64px)                           │
│       "Aún no hay empresas"                     │
│       "Crea tu primera empresa para empezar"    │
│       [+ Crear empresa]                         │
└─────────────────────────────────────────────────┘
```

**Acciones por rol:**
- Todos: Seleccionar, Usuarios
- Solo Admin: Editar, Eliminar (warn color)

---

### Modal Crear/Editar Empresa

```
┌──────────────────────────────────────┐
│ Crear empresa / Editar empresa       │  ← título
├──────────────────────────────────────┤
│                                      │
│  [Nombre de la empresa *]            │  required, max 200
│  [Código de empresa *]               │  required, max 50
│  [ ] Activo                          │  solo en edición
│                                      │
├──────────────────────────────────────┤
│                    [Cancelar] [Crear]│
└──────────────────────────────────────┘
```

Width: 500px desktop / 300px mobile

---

### Usuarios de Empresa `/companies/:id/users`

```
┌──────────────────────────────────────────────────────┐
│  ← Back   Nombre Empresa - Usuarios                  │  ← header
│           Gestiona los miembros y sus roles          │  ← subtitle
│                                      [+ Agregar]     │  ← solo Admin
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Nombre         Rol     Tarifa  Incorporación │    │  ← tabla
│  ├──────────────────────────────────────────────┤    │
│  │ 👤 Juan García  [Admin] $25.00  12/03/2024   ⋮│   │
│  │    juan@mail.com                              │    │
│  ├──────────────────────────────────────────────┤    │
│  │ 👤 Ana López  [Manager] $20.00  15/04/2024   ⋮│   │
│  │    ana@mail.com                               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Menú "⋮" (solo Admin):                              │
│    - Editar                                          │
│    - Restablecer contraseña                          │
│    - Eliminar (rojo)                                 │
│                                                      │
│  Chips de rol:                                       │
│    🔴 Admin  🟠 Manager  🟢 Developer  ⚫ Viewer      │
└──────────────────────────────────────────────────────┘
```

---

### Modal Agregar Usuario — 2 tabs

**Tab 1: Crear nuevo usuario**
```
[Nombre *]
[Correo electrónico *]
[Tarifa por hora $ ...]   ← opcional, number

ℹ️ [tertiary-container]
   Contraseña por defecto: Temporal01!
   Rol por defecto: Desarrollador
```

**Tab 2: Agregar usuario existente**
```
[Seleccionar usuario ▼ *]   ← "Nombre (email)"
[Rol ▼ *]                   ← Admin / Manager / Developer / Viewer
[Tarifa por hora $ ...]     ← opcional
```

---

## PROJECTS — Módulo de proyectos

### Lista de Proyectos `/projects`

```
┌──────────────────────────────────────────────────────┐
│  Proyectos                         [+ Crear proyecto]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Estado ▼]  [🔍 Buscar por nombre...]               │
│  3 proyectos encontrados                             │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌───────────────────┐  ┌───────────────────┐        │
│  │  PROJECT CARD     │  │  PROJECT CARD     │        │  ← ver detalle abajo
│  └───────────────────┘  └───────────────────┘        │
│                                                      │
│  Empty states:                                       │
│    Sin empresa: "Selecciona primero una empresa"     │
│    Sin proyectos: folder (64px) + "Aún no hay proy." │
│    Sin resultados: "No se encontraron proyectos"     │
└──────────────────────────────────────────────────────┘
```

**Project Card:**
```
┌──────────────────────────────────┐
│  Nombre del proyecto             │  ← title
│  [Estado]                        │  ← chip coloreado
│                                  │
│  Descripción corta del proyecto  │  ← body text muted
│                                  │
│  📅 Creado: fecha                │
│  🏢 Empresa: nombre              │
│                                  │
│       [Ver proyecto]             │  ← full-width btn primary
└──────────────────────────────────┘
```

**Chips de estado:**
- Active → verde
- Paused → naranja
- Completed → azul
- Cancelled → gris

---

### Detalle de Proyecto `/projects/:id`

```
┌──────────────────────────────────────────────────────┐
│  ← Back   Nombre del Proyecto   [Estado]  [✏][🗑]   │
├──────────────────────────────────────────────────────┤
│  [ℹ Información] [📋 Incidencias] [🗃 Tablero]       │  ← tab nav bar
├──────────────────────────────────────────────────────┤
│                                                      │
│  (contenido del tab activo — ver abajo)              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Tab: Información del proyecto (overview)**
```
┌──────────────────────────┐  ┌──────────────────────┐
│ 📊 Estadísticas          │  │ 📝 Descripción        │
│                          │  │                      │
│ Issues totales: N        │  │ Texto descripción    │
│ En progreso: N           │  │ o "Sin descripción"  │
│ Completados: N           │  │                      │
│ Horas: N                 │  └──────────────────────┘
└──────────────────────────┘
```

**Tab: Incidencias (issues list dentro del proyecto)**
- Misma estructura que Issue List pero filtrada por proyecto

**Tab: Tablero (Kanban)**
- Mismo board que Issue Board pero filtrado por proyecto

---

### Board/Kanban de Proyecto o Incidencias

```
┌──────────────────────────────────────────────────────────────────┐
│  🗃 Tablero del Proyecto                       [+ Nueva Incidencia]
│  Gestiona y rastrea tus incidencias                              │
├──────────────────────────────────────────────────────────────────┤
│  [🔍 Buscar]  [Estado ▼]  [Tipo ▼]  [Prioridad ▼]               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────┐  │
│  │ 📥 Por hacer │  │▶ En Progreso │  │🔬 Testing│  │✅ Hecho │  │
│  │  [badge: N]  │  │  [badge: N]  │  │[badge: N]│  │[badge:N]│  │
│  ├──────────────┤  ├──────────────┤  ├──────────┤  ├─────────┤  │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │          │  │         │  │
│  │ │[Bug] [!] │ │  │ │[Task][·] │ │  │  "Sin    │  │         │  │
│  │ │Título    │ │  │ │Título    │ │  │  tareas" │  │         │  │
│  │ │Proyecto  │ │  │ │Proyecto  │ │  │          │  │         │  │
│  │ │👤 Usuario│ │  │ │👤 --     │ │  │          │  │         │  │
│  │ └──────────┘ │  │ └──────────┘ │  │          │  │         │  │
│  └──────────────┘  └──────────────┘  └──────────┘  └─────────┘  │
│                                                                  │
│  Cards son arrastrables entre columnas (drag & drop)             │
└──────────────────────────────────────────────────────────────────┘
```

**Issue card en kanban:**
```
┌─────────────────────────────┐
│ [🐛 Bug icon]  [🔴 High]    │  ← tipo + prioridad badge
│ Título de la incidencia     │  ← h4
│ Nombre del proyecto         │  ← small muted
│ 👤 Usuario asignado         │  ← o nada si sin asignar
└─────────────────────────────┘
```

---

## ISSUES — Módulo de incidencias

### Lista de Incidencias `/issues`

```
┌──────────────────────────────────────────────────────┐
│  📋 Incidencias                   [+ Nueva incidencia]│
│  Gestiona tareas, bugs e historias de usuario         │
├──────────────────────────────────────────────────────┤
│  [🔍 Buscar] [Estado ▼] [Tipo ▼] [Prioridad ▼]       │
│  N incidencias encontradas                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Grid de Issue Cards (auto-fill minmax)              │
│                                                      │
│  Empty: assignment (64px) + "No se encontraron..."  │
└──────────────────────────────────────────────────────┘
```

**Issue Card:**
```
┌─────────────────────────────────┐
│ [🐛 icon tipo]  [🔴 High]       │  ← tipo + prioridad
│ Título de la incidencia         │  ← bold
│ Nombre del proyecto             │  ← muted
│                                 │
│ [ToDo] [Bug] [High]             │  ← chips status/tipo/priority
│                                 │
│ 👤 Usuario asignado o Sin asig. │
│ 📅 fecha                        │
└─────────────────────────────────┘
```

---

### Detalle de Incidencia `/issues/:id`

```
┌──────────────────────────────────────────────────────┐
│  ← Back   [🐛] Título de la incidencia               │  ← H1
│           [En Progreso] [Bug] [High]    [✏] [🗑]     │  ← chips + btns
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────┐  ┌──────────────────┐  │
│  │ ℹ Información            │  │ 📝 Descripción   │  │
│  │                          │  │                  │  │
│  │ 📁 Proyecto: nombre      │  │ Texto libre      │  │
│  │ 👤 Asignado: nombre      │  │ o "Sin descrip." │  │
│  │ ⏱ Horas estimadas: N     │  │                  │  │
│  │ 📊 Progreso: ████░░ 60%  │  └──────────────────┘  │
│  │ 📅 Creado: fecha         │                        │
│  │ 🔄 Actualizado: fecha    │                        │
│  └──────────────────────────┘                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ ⏱ Registro de tiempo                         │    │
│  │                                              │    │
│  │  Empty: "Aún no hay entradas de tiempo"      │    │
│  │  Con datos:                                  │    │
│  │    📅 Total: 4.5h                            │    │
│  │    📊 Varianza: +0.5h                        │    │
│  │    [tabla de entradas]                       │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## TIME ENTRY — Módulo de tiempo

### Time Tracker `/time-entries/tracker`

```
┌──────────────────────────────────────────────────────┐
│  ⏱ Rastreador de tiempo                              │
│  Registra tu tiempo de trabajo en tiempo real        │
│                              [🔔 toggle sonido]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  SIN TIMER ACTIVO:                                   │
│  ┌──────────────────────────────────────────────┐    │
│  │ Iniciar registro de tiempo                   │    │
│  │ Selecciona un problema y comienza            │    │
│  │                                              │    │
│  │  [Seleccionar problema ▼ *]                  │    │
│  │     "Título (NombreProyecto)"                │    │
│  │                                              │    │
│  │  [Descripción (opcional)          ]          │    │  ← textarea 3 rows
│  │                                              │    │
│  │  [▶ Iniciar temporizador]                    │    │
│  │  Ctrl+Shift+S                                │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  CON TIMER ACTIVO (draggable card):                  │
│  ┌──────────────────────────────────────────────┐    │
│  │ ⠿ [drag handle]              [— minimizar]  │    │
│  │                                              │    │
│  │   Título del issue (H2)                      │    │
│  │   Nombre del proyecto                        │    │
│  │   Descripción (si existe)                    │    │
│  │                                              │    │
│  │   ┌─────────────────────────────────┐        │    │
│  │   │    02:15:43  Tiempo transcurrido│        │    │  ← 64px monospace
│  │   └─────────────────────────────────┘        │    │
│  │   [tertiary-container background]            │    │
│  │                                              │    │
│  │   📅 Iniciado a las 09:30                    │    │
│  │                                              │    │
│  │   [⏹ Detener temporizador]  (warn color)     │    │
│  │   Ctrl+Shift+P                               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ 📋 Registros recientes                       │    │
│  │                                              │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │ Título issue          2.5h             │  │    │
│  │  │ 🏷 Proyecto    descripción breve  fecha│  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │  (repetir por entrada)                       │    │
│  │                                              │    │
│  │  Empty: "Sin registros de tiempo recientes" │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ⌨ Ctrl+Shift+S Iniciar · Ctrl+Shift+P Detener      │
│    Ctrl+Shift+M Minimizar                            │
└──────────────────────────────────────────────────────┘
```

**Timer minimizado (floating pill):**
```
┌─────────────────────────────────────────┐
│  ⏱ 02:15:43  Título issue        [⏹][↗]│  ← fixed bottom-right, pill shape
└─────────────────────────────────────────┘
```

---

### Lista de Registros de Tiempo `/time-entries`

```
┌──────────────────────────────────────────────────────┐
│  ⏱ Registros de tiempo              [+ Nuevo registro]│
│  Registra tu tiempo de trabajo                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  FILTROS DE FECHA:                                   │
│  [Últimos 7d][Últimos 30d][Este mes][Mes ant][Este año]
│  [Fecha desde 📅]   [Fecha hasta 📅]                  │
│                              [Limpiar] [Actualizar]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────┐  │
│  │ ⏱ Tiempo total  │ │ 📋 Registros │ │ 📅 Promedio│  │
│  │    12.5h        │ │   totales: 8 │ │   1.8h/día│  │
│  └─────────────────┘ └──────────────┘ └───────────┘  │
│                                                      │
│  TABLA:                                              │
│  ┌──────────────────────────────────────────────┐    │
│  │ Issue    Proyecto  Duración  Inicio  Fin  Desc│    │
│  ├──────────────────────────────────────────────┤    │
│  │ Fix bug  App Web   2.5h    09:00  11:30  ... │    │
│  │          [edit][delete]                      │    │  ← iconos al hover
│  └──────────────────────────────────────────────┘    │
│  [Paginación: ← 1-10 de 25 →]                       │
└──────────────────────────────────────────────────────┘
```

---

### Modal Nuevo/Editar Registro de Tiempo

```
┌──────────────────────────────────────┐
│ Nuevo registro / Editar registro     │
├──────────────────────────────────────┤
│                                      │
│  [Proyecto ▼ *]                      │
│  [Issue ▼]   ← habilitado si hay proyecto
│  [Descripción (opcional)]            │
│  [Fecha inicio 📅 *]  [Hora inicio]  │
│  [Fecha fin 📅]       [Hora fin]     │
│                                      │
├──────────────────────────────────────┤
│                      [Cancelar][Guardar]│
└──────────────────────────────────────┘
```

---

## REPORTS — Módulo de informes

### Patrón común de los 3 reports

Todos comparten esta estructura base:

```
HEADER:
  [icono] Título del informe
  Subtítulo / rango de fechas
                              [Exportar CSV]

FILTROS:
  [Selector específico ▼]   ← empresa/proyecto (no en user report)
  [Fecha inicio 📅]  [Fecha fin 📅]  [Limpiar] [Actualizar]
  [Últimos 7d][Últimos 30d][Este mes][Mes ant][Este año]

EMPTY STATE:
  icono 64px
  "No hay datos disponibles"
  "Selecciona un rango de fechas..."

CON DATOS: Summary Cards → Charts → Tabla(s)
```

---

### Mi Informe de Tiempo `/reports/user`

```
SUMMARY (3 cards):
  ┌──────────────────┐  ┌─────────────┐  ┌──────────────┐
  │ ⏱ Tiempo total   │  │ 📁 Proyectos│  │ 📋 Incidencias│
  │  [primary-cont.] │  │     N       │  │     N        │
  │     12.5h        │  │             │  │              │
  └──────────────────┘  └─────────────┘  └──────────────┘

CHARTS (2 columnas → 1 en mobile):
  ┌───────────────────────────┐  ┌──────────────────────┐
  │ 📈 Desglose diario        │  │ 🍩 Horas por proyecto │
  │ (Line Chart)              │  │ (Doughnut Chart)     │
  └───────────────────────────┘  └──────────────────────┘

TABLA:
  Horas por incidencia
  ┌──────────────────────────────────────┐
  │ Incidencia    Proyecto    Horas      │
  │ Fix login     App Web     [2.5h]     │  ← badge primary
  └──────────────────────────────────────┘
```

---

### Informe de Proyecto `/reports/project`

```
SUMMARY (3 cards):
  ⏱ Tiempo total  |  👥 Colaboradores  |  📋 Incidencias

CHARTS (3 charts):
  ┌─────────────────────────────────────────────┐
  │ 📈 Tendencia diaria de horas (Line, full)   │
  └─────────────────────────────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐
  │ 🥧 Horas por usuario  │  │ 📊 Horas por incid.  │
  │ (Pie Chart)           │  │ Top 10 (Bar Chart)   │
  └──────────────────────┘  └──────────────────────┘

TABLA:
  Incidencia + Horas badge
```

---

### Informe de Empresa `/reports/company`

```
SUMMARY (4 cards):
  ⏱ Tiempo total  |  👥 Usuarios activos  |  📁 Proyectos activos  |  📈 Promedio/día

CHARTS (3 charts):
  ┌─────────────────────────────────────────────┐
  │ 📈 Tendencia diaria de horas (Line, full)   │
  └─────────────────────────────────────────────┘

  ┌──────────────────────┐  ┌──────────────────────┐
  │ 🍩 Horas por usuario  │  │ 📊 Horas por proyecto│
  │ (Doughnut Chart)      │  │ (Bar Chart)          │
  └──────────────────────┘  └──────────────────────┘

TABLAS (2 tablas lado a lado → 1 col en mobile):
  ┌─────────────────────────┐  ┌─────────────────────────┐
  │ 👥 Desglose por usuario  │  │ 📁 Desglose por proyecto │
  │ Usuario     Horas        │  │ Proyecto    Horas        │
  └─────────────────────────┘  └─────────────────────────┘
```

---

## USER — Perfil de Usuario `/user`

```
┌──────────────────────────────────────────────────────┐
│  Mi Perfil                                           │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐    │
│  │  ┌─────┐                                     │    │
│  │  │ 👤  │  Nombre de Usuario                 │    │  ← card con avatar
│  │  └─────┘  usuario@email.com                  │    │
│  ├──────────────────────────────────────────────┤    │
│  │  [Información Personal] [Cambiar Contraseña] │    │  ← tabs
│  ├──────────────────────────────────────────────┤    │
│  │                                              │    │
│  │  TAB 1 — Vista:                              │    │
│  │    👤 Nombre: Juan García                    │    │
│  │    ✉  Email: juan@mail.com                   │    │
│  │    📅 Fecha de registro: 12/03/2024          │    │
│  │                      [✏ Editar Información]  │    │
│  │                                              │    │
│  │  TAB 1 — Edición:                            │    │
│  │    [Nombre *]                                │    │
│  │    [Email *]                                 │    │
│  │    [Cancelar] [Guardar Cambios]              │    │
│  │                                              │    │
│  │  TAB 2 — Cambiar Contraseña:                 │    │
│  │    [Contraseña Actual *]                     │    │
│  │    [Nueva Contraseña * (min 6)]              │    │
│  │    [Confirmar Nueva Contraseña *]            │    │
│  │    [Limpiar] [Cambiar Contraseña]            │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## COMPONENTES GLOBALES

### Floating Timer Button (estado activo — todas las rutas)

```
                           fixed bottom-right
┌──────────────────────────────────────────┐
│  ⏱  02:15:43                      [⏹]   │
│     Título del issue                     │
│     Nombre del proyecto                  │
└──────────────────────────────────────────┘
  border: 2px solid primary
  border-radius: 28px
  background: surface
  min-width: 280px
```

### Confirm Dialog (reutilizable)

```
┌──────────────────────────────────┐
│ Título de confirmación           │
├──────────────────────────────────┤
│ Mensaje descriptivo de la acción │
├──────────────────────────────────┤
│              [Cancelar][Confirmar]│
└──────────────────────────────────┘
```

### Error Dialog (con animación pulse)

```
┌──────────────────────────────────┐
│                                  │
│      ❌  ← pulse animation       │  ← 64px, error color
│                                  │
│   Título del error               │  ← centrado
│   Mensaje descriptivo            │
│                                  │
│           [Aceptar]              │
└──────────────────────────────────┘
```

### Start Timer Modal (desde sidebar/FAB)

```
┌──────────────────────────────────┐
│ Iniciar temporizador             │
├──────────────────────────────────┤
│                                  │
│  [Proyecto ▼ *]                  │
│  [Problema ▼]   ← opcional       │
│  [Descripción]  ← opcional       │
│                                  │
│  @if loading: [spinner]          │
├──────────────────────────────────┤
│              [Cancelar][▶ Iniciar]│
└──────────────────────────────────┘
```

### 404 Not Found `/**`

```
┌──────────────────────────────────┐
│                                  │
│   Página no encontrada           │
│   El recurso no existe           │
│                                  │
│   [Volver al inicio]             │
│                                  │
└──────────────────────────────────┘
```

---

## Guía de Chips y Badges

```
PRIORITY:
  Low    → color: #4caf50  (verde)
  Medium → color: #ff9800  (naranja)
  High   → color: #f44336  (rojo)

ISSUE TYPE:
  Bug     → color: #f44336  (rojo)
  Feature → color: #2196f3  (azul)
  Task    → color: #9e9e9e  (gris)

ISSUE STATUS:
  ToDo       → color: #9e9e9e  (gris)
  InProgress → color: #2196f3  (azul)
  Done       → color: #4caf50  (verde)

PROJECT STATUS:
  Active    → color: #4caf50  (verde)
  Paused    → color: #ff9800  (naranja)
  Completed → color: #2196f3  (azul)
  Cancelled → color: #9e9e9e  (gris)

USER ROLE:
  Admin     → color: #f44336  (rojo)
  Manager   → color: #ff9800  (naranja)
  Developer → color: #4caf50  (verde)
  Viewer    → color: #9e9e9e  (gris)

STYLE BASE:
  padding: 4px 8px
  border-radius: 4px
  font-weight: 600
  font-size: 12px
  color: blanco (texto sobre fondo coloreado)
```

---

## Íconos Material usados por módulo

| Módulo | Iconos |
|--------|--------|
| Auth | person, lock, visibility, visibility_off, email |
| Dashboard | business, folder, assignment, timer, assessment, view_kanban, lightbulb |
| Companies | business, event, circle (verde/gris), group, more_vert, edit, delete |
| Projects | folder, add, search, filter_list, arrow_back, edit, delete |
| Issues | assignment, bug_report, task_alt, new_releases, inbox, play_circle, science, check_circle |
| Time Entry | timer, play_arrow, stop, history, schedule, drag_indicator, volume_up, volume_off |
| Reports | assessment, bar_chart, pie_chart, folder_open, access_time, people, trending_up, list |
| User | person, email, date_range, lock, visibility |
| Global | home, settings, logout, close, menu, dark_mode, light_mode, error_outline |
