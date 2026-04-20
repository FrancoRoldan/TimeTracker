# Features — TimeTracker Flutter

## Mapeo Angular → Flutter

| Angular Component | Flutter Screen | Ruta GoRouter |
|-------------------|---------------|---------------|
| `LoginComponent` | `LoginScreen` | `/auth/login` |
| `RegisterComponent` | `RegisterScreen` | `/auth/register` |
| `CompanyListComponent` | `CompanyListScreen` | `/companies` |
| `CompanyUsersComponent` | `CompanyUsersScreen` | `/companies/:id/users` |
| `ProjectListComponent` | `ProjectListScreen` | `/projects` |
| `ProjectDetailComponent` (tabs) | `ProjectDetailScreen` | `/projects/:id` |
| `ProjectOverviewComponent` | Tab: Overview | `/projects/:id` (tab 0) |
| `ProjectIssuesComponent` | Tab: Issues | `/projects/:id` (tab 1) |
| `ProjectBoardComponent` | Tab: Board | `/projects/:id` (tab 2) |
| `IssueListComponent` | `IssueListScreen` | `/issues` |
| `IssueDetailComponent` | `IssueDetailScreen` | `/issues/:id` |
| `MyIssuesComponent` | `MyIssuesScreen` | `/issues/my` |
| `TimeTrackerComponent` | `TimeTrackerScreen` | `/time-entries/tracker` |
| `TimeEntryListComponent` | `TimeEntryListScreen` | `/time-entries` |
| `UserReportComponent` | `UserReportScreen` | `/reports/user` |
| `ProjectReportComponent` | `ProjectReportScreen` | `/reports/project` |
| `CompanyReportComponent` | `CompanyReportScreen` | `/reports/company` |
| `UserInfoComponent` | `UserProfileScreen` | `/user` |

---

## Estructura de Navegación

### Shell principal (con NavigationBar)

La app usa un `ShellRoute` de GoRouter que envuelve las rutas protegidas con una `NavigationBar` adaptativa (bottom en móvil, rail en tablet/desktop).

```
NavigationBar items:
  0. Projects  → /projects
  1. Issues    → /issues/my
  2. Timer     → /time-entries/tracker
  3. Reports   → /reports/user
  4. Profile   → /user
```

### Flujo completo de rutas

```
/auth/login          (no autenticado)
/auth/register       (no autenticado)

/ ─────────────────────────────── ShellRoute (NavigationBar)
  /projects
  /projects/:id
  /companies
  /companies/:id/users
  /issues
  /issues/my
  /issues/:id
  /time-entries
  /time-entries/tracker
  /reports/user
  /reports/project
  /reports/company
  /user
```

---

## Guards (equivalentes Angular → GoRouter redirect)

| Angular Guard | GoRouter redirect | Comportamiento |
|--------------|-------------------|----------------|
| `LogindGuard` (canActivate) | `redirect` en ShellRoute | Sin token → `/auth/login` |
| `IsAuthenticatedGuard` | `redirect` en `/auth` | Con token → `/projects` |
| Role check (Admin/Manager) en Company Report | `redirect` en `/reports/company` | Sin rol → `/reports/user` |

---

## Pantallas en Detalle

### Auth

**LoginScreen** (`/auth/login`)
- Formulario: email, password
- Botón "Iniciar sesión" → POST `/auth/login`
- Link a registro
- Manejo de error 401

**RegisterScreen** (`/auth/register`)
- Formulario: nombre, email, password, confirmar password
- POST `/auth/register`
- Redirect a login tras registro exitoso

---

### Companies

**CompanyListScreen** (`/companies`)
- Grid de cards (responsive: 1-2-3 columnas)
- FAB para crear empresa (Admin/Manager)
- Swipe o menú contextual para editar/eliminar
- Chip selector de empresa activa (equivalente al dropdown del sidebar Angular)

**CompanyUsersScreen** (`/companies/:id/users`)
- Lista de usuarios con rol y tarifa horaria
- Botón "Agregar usuario"
- Opciones: editar rol, eliminar usuario
- Dialog para resetear contraseña (Admin)

---

### Projects

**ProjectListScreen** (`/projects`)
- Grid de cards por empresa activa
- Card muestra: nombre, estado, cantidad de issues
- Filtro por estado
- FAB crear proyecto (Admin/Manager)

**ProjectDetailScreen** (`/projects/:id`)
- TabBar con 3 tabs: Overview, Issues, Board
- Tab Overview: info del proyecto, fechas, estado
- Tab Issues: lista filtrable de issues del proyecto
- Tab Board: kanban simplificado (columnas verticales en móvil, horizontal en tablet)

---

### Issues

**IssueListScreen** (`/issues`)
- Lista paginada con chips de filtro (estado, tipo, prioridad)
- Chips: ToDo, InProgress, Testing, Done

**MyIssuesScreen** (`/issues/my`)
- Issues asignados al usuario actual
- Mismo layout que IssueList

**IssueDetailScreen** (`/issues/:id`)
- Título, descripción, tipo, prioridad, estado
- Selector de asignado
- Botón cambiar estado
- Historial de entradas de tiempo del issue

---

### Time Entry

**TimeTrackerScreen** (`/time-entries/tracker`)
- Pantalla principal del timer
- Selector de Issue/Proyecto
- Botón Start/Stop con display HH:MM:SS
- Lista de entradas recientes (últimas 5)
- FAB para entrada manual

**TimeEntryListScreen** (`/time-entries`)
- Lista paginada de todas las entradas
- Filtros: fecha, proyecto, issue
- Swipe para eliminar / tap para editar

---

### Reports

> Nota: fl_chart reemplaza a Chart.js. Los tipos de gráfico se mantienen equivalentes.

**UserReportScreen** (`/reports/user`)
- Date range picker
- Gráfico de barras: horas por día
- Gráfico de dona: distribución por proyecto
- Totales: horas totales, por proyecto, por issue

**ProjectReportScreen** (`/reports/project`)
- Selector de proyecto
- Gráfico de línea: horas por día
- Gráfico de barras: distribución por usuario

**CompanyReportScreen** (`/reports/company`) — Admin/Manager only
- Gráfico de barras: horas por usuario
- Gráfico de barras: horas por proyecto
- Totales y costos (hourlyRate × horas)

---

### User

**UserProfileScreen** (`/user`)
- Nombre, email (editable)
- Cambio de contraseña
- Selector de tema (6 colores + dark mode)
- Selector de empresa activa (si tiene múltiples)
- Cerrar sesión

---

## Componentes Globales (equivalentes Angular shared/)

| Angular | Flutter Widget |
|---------|---------------|
| `LayoutComponent` (sidenav) | `ShellRoute` con `NavigationBar`/`NavigationRail` |
| `ConfirmDialogComponent` | `showDialog()` con widget reutilizable `ConfirmDialog` |
| `ErrorDialogComponent` | `ScaffoldMessenger.showSnackBar()` + `AlertDialog` |
| `FloatingTimerButtonComponent` | `FloatingActionButton` persistente en ShellRoute |
| `ToastService` | `ScaffoldMessenger.showSnackBar()` helper |
| `ThemeService` | `ThemeCubit` (global) |
| Selector de empresa activa | Dropdown en AppBar del Shell |

---

## Features No Incluidas en V1

Las siguientes features del Angular no se implementan en la primera versión Flutter:

| Feature Angular | Razón | Plan futuro |
|----------------|-------|-------------|
| Drag-and-drop kanban | Complejidad, falta lib estable mobile | V2 con `flutter_reorderable_list` |
| Drag floating timer | No aplica en móvil | Reemplazado por FAB fijo |
| Audio al iniciar timer | Opcional, no crítico | V2 |
| Atajos de teclado | No aplica en móvil | Solo en desktop build |
| Paginación avanzada | Backend retorna lista completa en mayoría | Implementar donde backend soporte |
