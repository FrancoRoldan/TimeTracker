# TimeTracker — Navegación y Flujos

> Mapa completo de rutas, guards, flujos de navegación y transiciones entre pantallas.
> Ver también: `SCREENS.md` (qué muestra cada pantalla) y `DESIGN_SYSTEM.md` (tokens visuales).

---

## Mapa de Rutas Completo

```
/
├── /auth                          ← Guard: IsAuthenticatedGuard (bloquea si ya hay token)
│   ├── /auth/login                ← LoginComponent
│   ├── /auth/register             ← RegisterComponent
│   └── /auth → redirige a /auth/login
│
├── /dashboard                     ← Guard: LogindGuard (requiere token)
├── /companies                     ← Guard: LogindGuard
│   └── /companies/:id/users       ← CompanyUsersComponent
├── /projects                      ← Guard: LogindGuard
│   └── /projects/:id              ← ProjectDetailComponent
│       ├── /projects/:id/overview
│       ├── /projects/:id/issues
│       ├── /projects/:id/board
│       └── /projects/:id/issues/:issueId  ← IssueDetailComponent
├── /issues                        ← Guard: LogindGuard
│   └── /issues/:id                ← IssueDetailComponent
├── /time-entries                  ← Guard: LogindGuard
│   └── /time-entries/tracker      ← TimeTrackerComponent
├── /user                          ← Guard: LogindGuard
├── /reports                       ← Guard: LogindGuard
│   ├── /reports → redirige a /reports/user
│   ├── /reports/user
│   ├── /reports/project
│   └── /reports/company
│
└── /**                            ← NotFoundComponent (404)
```

---

## Guards

### LogindGuard
- **Ruta protegida:** todas las rutas bajo `/` (excepto `/auth`)
- **Condición para pasar:** `localStorage.getItem("token")` existe
- **Si falla:** navega a `/auth`
- **En Flutter:** `go_router` con `redirect` verificando token en `SharedPreferences`

### IsAuthenticatedGuard
- **Ruta protegida:** `/auth` y sus hijos
- **Condición para pasar:** NO hay token en localStorage
- **Si falla:** navega a `/` (dashboard)
- **En Flutter:** redirect inverso en go_router para rutas de auth

### RoleGuard (disponible, no activo aún)
- **Verifica:** roles del usuario vs `route.data['roles']`
- **Si falla:** navega a `/dashboard`
- **Uso futuro previsto:** `/reports/company` requeriría Admin o Manager

---

## Flujos de Navegación

### 1. Flujo de Autenticación

```
App abre
    │
    ├─ Sin token ──────────────────→ /auth/login
    │                                    │
    │                               login exitoso
    │                                    │
    └─ Con token ─────────────────→ /dashboard ←──────┘
```

```
/auth/register → registro exitoso → /dashboard
```

```
Token expirado / 401 en cualquier llamada API:
    → AuthService intenta refresh automático
    → Si falla refresh → router.navigate(['auth']) → /auth/login
```

---

### 2. Flujo de Empresas

```
/dashboard [Ir a Empresas]
    │
    ▼
/companies
    ├─ [Crear empresa] → Modal dialog → crear → refrescar lista
    ├─ [Seleccionar]   → CompanyService.selectedCompany$ emite
    │                    → X-Company-Id header se actualiza
    │                    → todos los datos se recargan
    ├─ [Usuarios]      → /companies/:id/users
    │       │
    │       ├─ [← Back] → /companies
    │       ├─ [+ Agregar usuario] → Modal dialog
    │       └─ [⋮ Menú] → Editar/Reset password/Eliminar → Modals
    │
    ├─ [Editar] → Modal dialog
    └─ [Eliminar] → ConfirmDialog → eliminar → refrescar
```

---

### 3. Flujo de Proyectos

```
/projects
    │
    ├─ [+ Crear proyecto] → Modal dialog → crear → refrescar
    ├─ [Ver proyecto]     → /projects/:id
    │       │
    │       ├─ Tabs internas (no cambian URL principal):
    │       │   ├─ /projects/:id/overview   ← default
    │       │   ├─ /projects/:id/issues
    │       │   └─ /projects/:id/board
    │       │
    │       ├─ [← Back]  → /projects
    │       ├─ [✏ Editar] → Modal dialog
    │       └─ [🗑 Eliminar] → ConfirmDialog → eliminar → /projects
    │
    │  En tab /projects/:id/issues:
    │       └─ click issue → /issues/:id  (no /projects/:id/issues/:id)
    │
    └─ Filtros (Estado, Búsqueda) → filtran en cliente, no cambian URL
```

---

### 4. Flujo de Issues

```
Acceso desde múltiples puntos:
  /issues (lista global)
  /projects/:id/issues (lista por proyecto)
  /projects/:id/board (kanban)
  /dashboard (botón "Mis incidencias")

Click en cualquier issue → /issues/:id

/issues/:id
    ├─ [← Back] → /projects  ← NOTA: siempre va a proyectos, no a la lista de issues
    ├─ [✏ Editar] → Modal dialog
    └─ [🗑 Eliminar] → ConfirmDialog → eliminar → /issues
```

**Kanban drag & drop:**
```
Arrastrar card de columna A a columna B
    → PATCH /api/issue/:id (actualiza status)
    → La card se mueve visualmente
    → NO navega a ninguna ruta
```

---

### 5. Flujo de Tiempo

```
OPCIÓN A — Desde /time-entries/tracker:
    [▶ Iniciar temporizador]
        → POST /api/time/start
        → Timer activo (card con HH:MM:SS corriendo)
        → Floating pill aparece en TODAS las rutas
    
    [⏹ Detener temporizador]
        → PUT /api/time/stop/:id
        → Timer se detiene
        → Pill desaparece

OPCIÓN B — Desde sidebar (FAB flotante en /time-entries):
    [▶ FAB]
        → StartTimerModal abre
        → Seleccionar proyecto/issue/descripción
        → [▶ Iniciar] → mismo flujo que opción A

OPCIÓN C — Desde cualquier ruta (pill flotante visible):
    [⏹ Stop en pill] → igual que detener en opción A
```

```
/time-entries (lista)
    ├─ [+ Nuevo registro] → Modal dialog → crear → refrescar
    ├─ [✏ Editar] → Modal dialog
    ├─ [🗑 Eliminar] → ConfirmDialog → eliminar → refrescar
    └─ Filtros de fecha → recargan datos del API
```

---

### 6. Flujo de Reports

```
/reports → redirige a /reports/user

Sidebar nav tiene 3 links directos:
  /reports/user     ← "Mis reportes"
  /reports/project  ← "Reportes de proyecto"
  /reports/company  ← "Reportes de empresa"

Flujo en cada report:
  1. Seleccionar empresa/proyecto (si aplica)
  2. Seleccionar rango de fechas (picker o quick filter)
  3. [Actualizar] → GET /api/reports/:tipo?startDate=X&endDate=Y
  4. Cards + Charts + Tablas se renderizan con la respuesta
  5. [Exportar CSV] → descarga el reporte
```

---

### 7. Flujo de Selección de Empresa (Multi-tenant)

```
Sidebar Left → Company Selector (dropdown)
    │
    ├─ Usuario selecciona empresa
    │       │
    │       ▼
    │   CompanyService.setSelectedCompany(company)
    │   localStorage['selectedCompany'] = company
    │       │
    │       ▼
    │   LoginInterceptor agrega X-Company-Id header a todos los requests
    │       │
    │       ▼
    │   Componentes escuchan selectedCompany$ observable
    │   y recargan sus datos
    │
    └─ Persistencia: la empresa seleccionada sobrevive refresh de página
```

---

### 8. Flujo de Temas (sin navegación)

```
Toolbar [⚙️ settings icon]
    → Right sidebar abre
        ├─ Toggle dark/light → ThemeService.toggleDark()
        │   → add/remove '.dark-theme' en <body>
        │   → localStorage['dark-mode'] = true/false
        │
        └─ Click swatch color → ThemeService.setTheme('pink')
            → remove todas las clases de tema del <body>
            → add nueva clase ('pink', 'green', etc.)
            → localStorage['theme'] = 'pink'
```

---

## Navegaciones Programáticas (router.navigate)

| Componente | Evento | Destino |
|-----------|--------|---------|
| LoginComponent | Login exitoso | `/` (dashboard) |
| RegisterComponent | Registro exitoso | `/` (dashboard) |
| AuthService | Refresh token falla | `/auth` |
| LogindGuard | Sin token | `/auth` |
| IsAuthenticatedGuard | Con token en /auth | `/` |
| RoleGuard | Sin rol requerido | `/dashboard` |
| ProjectListComponent | Click "Ver proyecto" | `/projects/:id` |
| ProjectDetailComponent | Back button | `/projects` |
| ProjectDetailComponent | Delete exitoso | `/projects` |
| ProjectIssuesComponent | Click issue | `/issues/:id` |
| ProjectBoardComponent | Click kanban card | `/issues/:id` |
| IssueListComponent | Click issue row | `/issues/:id` |
| IssueDetailComponent | Back button | `/projects` ⚠️ |
| IssueDetailComponent | Delete exitoso | `/issues` |
| IssueBoardComponent | Click kanban card | `/issues/:id` |
| CompanyListComponent | Click "Usuarios" | `/companies/:id/users` |
| CompanyUsersComponent | Back button | `/companies` |

> ⚠️ **Inconsistencia conocida en Angular:** IssueDetail → Back lleva a `/projects` en lugar de `/issues`. En Flutter replicar este comportamiento o corregirlo.

---

## Acciones que usan Dialogs (no navegan)

Estas acciones abren un Dialog/Modal — NO cambian la ruta:

| Acción | Dialog |
|--------|--------|
| Crear empresa | CompanyModalComponent |
| Editar empresa | CompanyModalComponent |
| Eliminar empresa | ConfirmDialogComponent |
| Agregar usuario | AddUserModalComponent |
| Editar usuario | EditUserModalComponent |
| Reset password | ResetPasswordModalComponent |
| Crear proyecto | ProjectModalComponent |
| Editar proyecto | ProjectModalComponent |
| Eliminar proyecto | ConfirmDialogComponent |
| Crear issue | IssueModalComponent |
| Editar issue | IssueModalComponent |
| Eliminar issue | ConfirmDialogComponent |
| Nuevo time entry | TimeEntryModalComponent |
| Editar time entry | TimeEntryModalComponent |
| Eliminar time entry | ConfirmDialogComponent |
| Iniciar timer (desde FAB) | StartTimerModalComponent |
| Cualquier error de API | ErrorDialogComponent |

---

## Parámetros de Ruta

| Ruta | Param | Tipo | Cómo se obtiene |
|------|-------|------|-----------------|
| `/companies/:id/users` | `id` | number | `snapshot.paramMap.get('id')` |
| `/projects/:id` | `id` | number | `snapshot.paramMap.get('id')` |
| `/projects/:id/issues/:issueId` | `issueId` | number | `snapshot.paramMap.get('issueId')` |
| `/issues/:id` | `id` | number | `snapshot.paramMap.get('id')` |

---

## Navegación en Sidebar (links estáticos)

```
LEFT SIDEBAR (siempre visible en desktop):

  [Company Selector ▼]    ← No navega, cambia estado global

  🏠  Panel de control   → /dashboard
  🏢  Empresas           → /companies
  📁  Proyectos          → /projects
  ⏱   Registro de tiempo → /time-entries
  📊  Mis reportes       → /reports/user
  📈  Reportes proyecto  → /reports/project
  📋  Reportes empresa   → /reports/company
  👤  Mi cuenta          → /user
```

**Comportamiento mobile:** sidebar cierra automáticamente al hacer click en cualquier item.

---

## Estado Global (no URL-based)

| Estado | Dónde vive | Cómo se comparte |
|--------|-----------|-----------------|
| Token JWT | localStorage `"token"` | LoginInterceptor lo agrega a cada request |
| Usuario actual | localStorage `"user"` | AuthService expone `currentUser$` |
| Empresa seleccionada | localStorage `"selectedCompany"` | CompanyService expone `selectedCompany$` |
| Lista de empresas del usuario | localStorage `"companies"` | AuthService las carga al login |
| Tema activo | localStorage `"theme"` | ThemeService, clase en `<body>` |
| Dark mode | localStorage `"dark-mode"` | ThemeService, clase `.dark-theme` en `<body>` |
| Timer activo | En memoria (TimeEntryService) | Floating pill lo escucha via observable |

---

## Equivalencias para Flutter (go_router)

```dart
// Estructura de rutas equivalente en go_router:

GoRouter(
  redirect: (context, state) {
    final hasToken = /* check SharedPreferences */;
    final isAuthRoute = state.uri.path.startsWith('/auth');

    if (!hasToken && !isAuthRoute) return '/auth/login';
    if (hasToken && isAuthRoute) return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/auth/login', builder: ...),
    GoRoute(path: '/auth/register', builder: ...),
    ShellRoute(                          // LayoutComponent (sidebars)
      builder: (ctx, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: ...),
        GoRoute(path: '/companies', builder: ...),
        GoRoute(
          path: '/companies/:id/users',
          builder: (ctx, state) => CompanyUsersScreen(
            id: int.parse(state.pathParameters['id']!)
          ),
        ),
        GoRoute(
          path: '/projects',
          builder: ...,
          routes: [
            GoRoute(
              path: ':id',
              builder: (ctx, state) => ProjectDetailScreen(
                id: int.parse(state.pathParameters['id']!)
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/issues/:id',
          builder: (ctx, state) => IssueDetailScreen(
            id: int.parse(state.pathParameters['id']!)
          ),
        ),
        GoRoute(path: '/time-entries', builder: ...),
        GoRoute(path: '/time-entries/tracker', builder: ...),
        GoRoute(path: '/user', builder: ...),
        GoRoute(path: '/reports/user', builder: ...),
        GoRoute(path: '/reports/project', builder: ...),
        GoRoute(path: '/reports/company', builder: ...),
      ],
    ),
  ],
)
```
