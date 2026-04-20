# TimeTracker Flutter — Plan de Desarrollo

**Fecha:** Abril 2026
**Objetivo:** Llevar la app Flutter a paridad funcional con el frontend Angular 19, cubriendo multi-empresa, gestión de issues completa, reportes (usuario/proyecto/empresa) y administración de colaboradores.

---

## Estado Actual vs. Lo que Debería Ser

| Área | Estado Actual | Estado Objetivo |
|------|--------------|-----------------|
| Autenticación | ✅ Login, Register, Logout, Refresh | ✅ Sin cambios |
| Selector de empresa activa | ❌ No existe en UI | ✅ Selector persistente en AppBar/Drawer |
| Gestión de empresas | ❌ Solo se usa implícitamente | ✅ Lista, crear, editar empresa |
| Colaboradores de empresa | ❌ No existe | ✅ Ver, agregar, cambiar rol, eliminar |
| Proyectos | ✅ CRUD básico | ✅ CRUD + filtro por empresa activa |
| Issues (mis issues) | ✅ Solo "mis issues" | ✅ Todos los issues del proyecto |
| Issues (vista completa) | ❌ No existe | ✅ Vista por proyecto con filtros completos |
| Dashboard | ❌ No existe | ✅ Resumen con timer activo y accesos rápidos |
| Time Tracker | ✅ Start/Stop/Manual | ✅ + filtro por empresa activa |
| Reportes personales | ⚠️ Parcial (sin gráficas reales) | ✅ Gráficas, totales, breakdown por proyecto |
| Reportes por proyecto | ❌ No existe | ✅ Selección de proyecto + breakdown por usuario |
| Reportes por empresa | ❌ No existe | ✅ Totales empresa, breakdown por usuario/proyecto |

---

## Problemas Críticos a Resolver

### 1. Empresa Activa (Multi-Tenant)
El interceptor ya envía `X-Company-Id`, pero **no hay UI para cambiar de empresa**. Si un usuario pertenece a múltiples empresas, siempre usa la primera guardada en el login.

**Impacto:** Proyectos, issues y reportes muestran datos incorrectos o vacíos.

### 2. Proyectos sin Contexto de Empresa
`project_list_screen.dart` carga proyectos sin asociarlos visualmente a la empresa activa. Al cambiar de empresa no se recarga.

### 3. Issues Solo "Mis Issues"
`my_issues_screen.dart` solo muestra issues asignados al usuario. No existe vista de todos los issues de un proyecto (necesaria para roles Admin/Manager).

### 4. Reportes sin Gráficas Funcionales
`reports_screen.dart` existe pero las gráficas con `fl_chart` no están correctamente conectadas a los tres tipos de reporte (usuario, proyecto, empresa).

---

## Plan de Implementación

---

### FASE 1 — Selector de Empresa Activa (Crítico)

**Objetivo:** El usuario puede cambiar de empresa activa desde cualquier pantalla y todos los datos se recargan automáticamente.

#### 1.1 CompanyCubit — Estado Global de Empresa Activa

Archivo: `lib/features/company/bloc/company_cubit.dart`

```dart
// Estado
class CompanyState extends Equatable {
  final List<CompanyMembership> companies;
  final CompanyMembership? selectedCompany;
  final bool isLoading;
  final String? error;
}

// Métodos
Future<void> loadCompanies();
Future<void> selectCompany(CompanyMembership company); // guarda en storage, emite estado
```

`selectCompany` debe:
1. Guardar `selectedCompanyId` en `LocalStorage`
2. Actualizar `ApiClient` con el nuevo `X-Company-Id`
3. Emitir `CompanyState` actualizado

#### 1.2 CompanySelector Widget

Archivo: `lib/features/company/presentation/widgets/company_selector.dart`

- `DropdownButton` o `PopupMenuButton` con la lista de empresas del usuario
- Muestra nombre y rol actual
- Al seleccionar → llama `CompanyCubit.selectCompany()`
- Se coloca en el `AppBar` de todas las pantallas protegidas

#### 1.3 Actualizar NavigationShell

Archivo: `lib/app/router/app_router.dart`

El `NavigationShell` (scaffold raíz) debe:
- Incluir `CompanySelectorWidget` en el `AppBar`
- Proveer `CompanyCubit` como `BlocProvider` al nivel raíz
- Escuchar cambios de empresa y notificar a los cubits hijo

#### 1.4 Reactivo en cada Feature

Cada pantalla protegida debe:
```dart
// En initState o en el Cubit:
context.read<CompanyCubit>().stream.listen((companyState) {
  if (companyState.selectedCompany != null) {
    _reload(); // recarga datos con la nueva empresa
  }
});
```

**Archivos a modificar:**
- `project_cubit.dart` — recibir companyId como parámetro
- `issue_cubit.dart` — recibir companyId
- `time_entry_cubit.dart` — recibir companyId
- `reports_cubit.dart` — recibir companyId

---

### FASE 2 — Gestión de Empresa y Colaboradores

#### 2.1 Pantalla de Gestión de Empresa

Archivo nuevo: `lib/features/company/presentation/screens/company_detail_screen.dart`

**Secciones:**
1. **Info de la empresa** — nombre, código, descripción (solo Admin puede editar)
2. **Colaboradores** — lista de `UserCompany` con nombre, email, rol, tarifa por hora
3. **Agregar colaborador** — buscar usuario por email, asignar rol y tarifa

**Layout:**
```
AppBar: "Mi Empresa" [Editar si Admin]
─────────────────────────────
Sección: Información
  Nombre: Acme Corp
  Código: ACME
  Descripción: ...
─────────────────────────────
Sección: Colaboradores (N miembros)
  [+ Agregar]
  ┌─────────────────────────────┐
  │ Juan García   Admin  $50/h  │ [Editar] [Eliminar]
  │ Ana López     Manager $40/h │ [Editar] [Eliminar]
  │ Pedro Ruiz    User   $30/h  │ [Editar] [Eliminar]
  └─────────────────────────────┘
```

**Restricciones:**
- Solo Admin ve [Editar] y [Eliminar] en colaboradores
- Solo Admin puede editar info de la empresa
- No se puede eliminar el último Admin

#### 2.2 Dialog: Agregar/Editar Colaborador

Archivo nuevo: `lib/features/company/presentation/widgets/collaborator_dialog.dart`

Campos:
- Email del usuario (para agregar) / Nombre (para editar, solo muestra)
- Rol: `DropdownButton<UserRole>` (Admin / Manager / User)
- Tarifa por hora: campo numérico

#### 2.3 CompanyRepository — Nuevos Métodos

Archivo: `lib/features/company/data/company_repository.dart`

```dart
Future<List<UserCompanyDetail>> getCompanyMembers(int companyId);
Future<void> addMember(int companyId, String email, UserRole role, double hourlyRate);
Future<void> updateMember(int companyId, int userId, UserRole role, double hourlyRate);
Future<void> removeMember(int companyId, int userId);
Future<void> updateCompany(int companyId, UpdateCompanyRequest request);
```

#### 2.4 Modelo: UserCompanyDetail

Archivo nuevo: `lib/core/models/user_company_detail.dart`

```dart
@JsonSerializable()
class UserCompanyDetail {
  final int userId;
  final String userName;
  final String userEmail;
  final UserRole role;
  final double hourlyRate;
}
```

---

### FASE 3 — Vista Completa de Issues

#### 3.1 Rediseño de la Pantalla de Issues

La pantalla actual `my_issues_screen.dart` solo muestra "mis issues". Necesita dos modos:

**Modo A — Mis Issues** (usuario normal): issues asignados al usuario actual
**Modo B — Issues del Proyecto** (Admin/Manager): todos los issues de un proyecto

**Nuevo archivo:** `lib/features/issue/presentation/screens/issues_screen.dart`

**Layout:**
```
AppBar: "Issues" [Filtros]
─────────────────────────────
Filtros horizontales:
  [Proyecto ▼]  [Estado ▼]  [Tipo ▼]  [Prioridad ▼]

Tabs (si es Admin/Manager):
  [Mis Issues]  [Todos]

Lista de issues:
  ┌─────────────────────────────────┐
  │ 🔴 BUG — Alta Prioridad         │
  │ Error al cargar reportes        │
  │ Proyecto: Backend API           │
  │ Asignado: Juan García  [ToDo]   │
  └─────────────────────────────────┘
```

#### 3.2 IssueCubit — Métodos Adicionales

```dart
Future<void> loadIssuesByProject(int projectId, {IssueStatus? status, IssueType? type, IssuePriority? priority});
Future<void> loadAllIssues({int? projectId, IssueStatus? status, String? assignedUserId});
Future<void> assignIssue(int issueId, String userId);
```

#### 3.3 Detalle de Issue

Archivo nuevo: `lib/features/issue/presentation/screens/issue_detail_screen.dart`

```
AppBar: "Issue #42"
─────────────────────────────
Título: Error al cargar reportes
Tipo: 🔴 Bug
Prioridad: Alta
Estado: [En Progreso ▼]  (editable)
─────────────────────────────
Descripción:
  Al filtrar por fecha mayor a 6 meses...
─────────────────────────────
Asignado a: [Juan García ▼]  (editable si Admin/Manager)
Horas estimadas: 4h
─────────────────────────────
Tiempo registrado: 2h 30m
  [Ver entradas de tiempo]
─────────────────────────────
[Editar Issue]  [Eliminar]
```

#### 3.4 IssueFormDialog — Mejoras

Archivo: `lib/features/issue/presentation/widgets/issue_form_dialog.dart`

Agregar campos faltantes:
- Horas estimadas (`estimatedHours`)
- Usuario asignado: `DropdownButton` con miembros de la empresa
- Tipo de issue: selector visual con iconos
- Prioridad: selector con colores

---

### FASE 4 — Dashboard

**Archivo nuevo:** `lib/features/dashboard/presentation/screens/dashboard_screen.dart`

**Layout:**
```
AppBar: "Dashboard" + Company Selector
─────────────────────────────
Card: Timer Activo (si hay uno corriendo)
  ⏱ 01:23:45  — "Arreglando bug de login"
  Proyecto: Backend API | Issue #42
  [Detener]
─────────────────────────────
Resumen del día (Mis horas hoy: 4h 30m)
  ████████████░░░░ (barra de progreso hacia 8h)
─────────────────────────────
Mis Issues Activos (máx. 5)
  • Bug: Error en login        [InProgress]
  • Feature: Export PDF        [ToDo]
  → Ver todos
─────────────────────────────
Proyectos Activos (máx. 4 en grid 2x2)
  [Backend API]  [Frontend App]
  [Mobile App]   [+ Ver todos]
─────────────────────────────
Actividad Reciente (últimas 5 entradas de tiempo)
  Hoy 14:00 — 2h 15m — Backend API
  Hoy 10:00 — 1h 30m — Frontend App
```

**DashboardCubit:**
```dart
class DashboardState {
  final TimeEntry? activeTimer;
  final Duration todayDuration;
  final List<Issue> activeIssues;
  final List<Project> activeProjects;
  final List<TimeEntry> recentEntries;
}
```

---

### FASE 5 — Reportes Completos

#### 5.1 Rediseño de ReportsScreen

Archivo: `lib/features/reports/presentation/screens/reports_screen.dart`

**Nuevo diseño con tabs:**
```
AppBar: "Reportes"
─────────────────────────────
Tabs: [Personal] [Por Proyecto] [Por Empresa]
─────────────────────────────
Filtro de fechas: [Desde] [Hasta]  [Aplicar]
─────────────────────────────
[Contenido según tab activo]
```

#### 5.2 Tab Personal (UserReport)

```
Total: 120h 30m   Costo: $6,025.00
─────────────────────────────
Gráfica: Horas por día (línea, últimos 30 días)
  fl_chart LineChart
─────────────────────────────
Breakdown por Proyecto:
  Backend API     45h  37%  ████████░░░░
  Frontend App    40h  33%  ███████░░░░░
  Mobile App      35h  30%  ██████░░░░░░
─────────────────────────────
Gráfica: Distribución (dona/pie)
  fl_chart PieChart
```

#### 5.3 Tab Por Proyecto (ProjectReport)

```
Selector: [Proyecto ▼]
─────────────────────────────
Total proyecto: 450h  Costo: $18,000
─────────────────────────────
Gráfica: Horas por día (barras)
─────────────────────────────
Breakdown por Usuario:
  Juan García   200h  44%  ████████░░░
  Ana López     150h  33%  ██████░░░░░
  Pedro Ruiz    100h  22%  ████░░░░░░░
─────────────────────────────
Gráfica: Distribución por usuario (dona)
```

#### 5.4 Tab Por Empresa (CompanyReport)

```
Total empresa: 1,200h  Costo total: $52,000
─────────────────────────────
Gráfica: Horas por semana (barras agrupadas)
─────────────────────────────
Breakdown por Proyecto:
  Backend API    450h  37%
  Frontend App   380h  32%
  Mobile App     370h  31%
─────────────────────────────
Breakdown por Usuario:
  Top 5 usuarios con más horas
─────────────────────────────
Gráfica: Comparativa proyectos (barras horizontales)
```

#### 5.5 ReportsCubit — Actualización

```dart
// Nuevos métodos
Future<void> loadProjectReport(int projectId, DateTime start, DateTime end);
Future<void> loadCompanyReport(DateTime start, DateTime end);

// Estado extendido
class ReportsState {
  final ReportType activeTab;      // user | project | company
  final int? selectedProjectId;    // para tab de proyecto
  final UserReport? userReport;
  final ProjectReport? projectReport;
  final CompanyReport? companyReport;
  final DateTimeRange dateRange;
  final bool isLoading;
  final String? error;
}
```

#### 5.6 Widgets de Gráficas

Archivos nuevos en `lib/features/reports/presentation/widgets/`:

- `line_chart_widget.dart` — Horas por día (fl_chart LineChart)
- `bar_chart_widget.dart` — Comparativas (fl_chart BarChart)
- `pie_chart_widget.dart` — Distribución (fl_chart PieChart)
- `breakdown_list_widget.dart` — Lista con barra de progreso horizontal
- `date_range_picker_widget.dart` — Selector de rango de fechas reutilizable

---

### FASE 6 — Mejoras de UX y Navegación

#### 6.1 Rediseño de Navegación

**Actual:** Bottom navigation con 5 items (Proyectos, Issues, Tiempo, Reportes, Perfil)

**Propuesto:** Bottom navigation con drawer lateral para Admin

```
Bottom Nav (todos los roles):
  🏠 Dashboard
  ⏱ Tiempo
  📋 Issues
  📊 Reportes
  👤 Perfil

Drawer (solo Admin/Manager):
  Gestión
  ├── 🏢 Mi Empresa
  ├── 📁 Proyectos
  └── 👥 Colaboradores
```

#### 6.2 AppBar Consistente

Todos los `Scaffold` con rutas protegidas deben tener:
```dart
AppBar(
  title: Text(screenTitle),
  actions: [
    CompanySelectorWidget(),  // dropdown empresa activa
    IconButton(profile),
  ],
)
```

#### 6.3 Empty States Mejorados

Cada pantalla con lista vacía debe mostrar:
- Icono ilustrativo
- Mensaje contextual
- Botón de acción principal (ej: "Crear primer proyecto")

#### 6.4 Pull-to-Refresh

Todas las listas deben soportar `RefreshIndicator` con `onRefresh`.

---

## Estructura de Archivos Final

```
lib/
├── app/
│   ├── router/app_router.dart           (modificar: rutas nuevas)
│   └── theme/
├── core/
│   ├── network/
│   │   ├── api_client.dart
│   │   └── auth_interceptor.dart
│   ├── storage/local_storage.dart
│   ├── constants/api_constants.dart
│   ├── models/
│   │   ├── user.dart
│   │   ├── company.dart
│   │   ├── user_company_detail.dart     (NUEVO)
│   │   ├── project.dart
│   │   ├── issue.dart
│   │   ├── time_entry.dart
│   │   └── reports/
│   │       ├── user_report.dart
│   │       ├── project_report.dart
│   │       └── company_report.dart
│   └── enums/
└── features/
    ├── auth/                            (sin cambios)
    ├── dashboard/                       (NUEVO)
    │   ├── bloc/
    │   │   ├── dashboard_cubit.dart
    │   │   └── dashboard_state.dart
    │   └── presentation/
    │       └── screens/dashboard_screen.dart
    ├── company/                         (ampliar)
    │   ├── bloc/
    │   │   ├── company_cubit.dart       (modificar: selectCompany, loadMembers)
    │   │   └── company_state.dart
    │   ├── data/
    │   │   └── company_repository.dart  (modificar: CRUD miembros)
    │   └── presentation/
    │       ├── screens/
    │       │   └── company_detail_screen.dart   (NUEVO)
    │       └── widgets/
    │           ├── company_selector.dart         (NUEVO)
    │           └── collaborator_dialog.dart      (NUEVO)
    ├── project/                         (modificar: reactividad a empresa)
    │   ├── bloc/project_cubit.dart
    │   ├── data/project_repository.dart
    │   └── presentation/
    │       └── screens/project_list_screen.dart
    ├── issue/                           (ampliar)
    │   ├── bloc/
    │   │   ├── issue_cubit.dart         (modificar: modos, filtros adicionales)
    │   │   └── issue_state.dart
    │   ├── data/issue_repository.dart   (modificar: loadByProject, loadAll)
    │   └── presentation/
    │       ├── screens/
    │       │   ├── issues_screen.dart           (NUEVO - reemplaza my_issues)
    │       │   └── issue_detail_screen.dart     (NUEVO)
    │       └── widgets/
    │           ├── issue_form_dialog.dart        (modificar: más campos)
    │           └── issue_tile.dart
    ├── time_entry/                      (modificar: filtro empresa)
    │   ├── bloc/time_entry_cubit.dart
    │   ├── data/time_entry_repository.dart
    │   └── presentation/
    │       └── screens/time_tracker_screen.dart
    ├── reports/                         (ampliar)
    │   ├── bloc/
    │   │   ├── reports_cubit.dart       (modificar: 3 tipos + estado extendido)
    │   │   └── reports_state.dart
    │   ├── data/reports_repository.dart
    │   └── presentation/
    │       ├── screens/reports_screen.dart      (modificar: tabs)
    │       └── widgets/
    │           ├── line_chart_widget.dart       (NUEVO)
    │           ├── bar_chart_widget.dart        (NUEVO)
    │           ├── pie_chart_widget.dart        (NUEVO)
    │           ├── breakdown_list_widget.dart   (NUEVO)
    │           └── date_range_picker_widget.dart (NUEVO)
    ├── user/                            (sin cambios mayores)
    │   ├── bloc/user_cubit.dart
    │   ├── data/user_repository.dart
    │   └── presentation/
    │       └── screens/user_profile_screen.dart
    └── shared/
        └── widgets/
            ├── status_chip.dart
            ├── confirm_dialog.dart
            ├── empty_state_widget.dart          (NUEVO)
            └── loading_widget.dart              (NUEVO)
```

---

## Prioridad de Implementación

| Fase | Descripción | Prioridad | Impacto |
|------|-------------|-----------|---------|
| 1 | Selector de empresa activa | 🔴 Crítica | Sin esto los datos son incorrectos |
| 2 | Gestión de empresa y colaboradores | 🟠 Alta | Funcionalidad Admin básica |
| 3 | Issues completo + detalle | 🟠 Alta | Necesario para Manager y Admin |
| 4 | Dashboard | 🟡 Media | Mejora UX significativamente |
| 5 | Reportes completos (3 tipos) | 🟡 Media | Feature de valor para empresa |
| 6 | Mejoras UX/navegación | 🟢 Baja | Polish final |

---

## Dependencias de Packages a Agregar

```yaml
# pubspec.yaml — agregar si no están
dependencies:
  # Ya existen:
  # fl_chart: ^0.68.0

  # Agregar:
  shimmer: ^3.0.0           # Loading skeletons
  cached_network_image: ^3.3.1  # Si se agregan avatares de usuario

dev_dependencies:
  # Ya existen todos los necesarios
```

---

## Convenciones a Mantener

- **State management:** BLoC/Cubit (sin cambiar a Riverpod/Provider)
- **Navegación:** Go Router (mantener `ShellRoute`)
- **HTTP:** Dio con `AuthInterceptor`
- **Storage:** `FlutterSecureStorage` para token, `SharedPreferences` para preferencias
- **Serialización:** `json_serializable` con archivos `.g.dart`
- **Diseño:** Material Design 3 con los mismos tokens de color que Angular
- **Patrones CSS → Flutter:** Variables M3 → `Theme.of(context).colorScheme`
- **Control de acceso:** Verificar `userRole` antes de mostrar acciones de Admin/Manager

---

## Endpoints Backend Relevantes para Features Nuevas

```
# Empresa
GET    /api/company                      → Lista empresas del usuario
PUT    /api/company/{id}                 → Actualizar empresa
GET    /api/company/{id}/users           → Miembros de la empresa
POST   /api/company/{id}/users           → Agregar colaborador
PUT    /api/company/{id}/users/{userId}  → Actualizar rol/tarifa
DELETE /api/company/{id}/users/{userId}  → Eliminar colaborador

# Issues por proyecto (no solo "mis issues")
GET    /api/issue?projectId={id}         → Issues de un proyecto
GET    /api/issue?assignedToMe=true      → Solo mis issues

# Reportes
GET    /api/reports/user?startDate=X&endDate=Y
GET    /api/reports/project?projectId=X&startDate=Y&endDate=Z
GET    /api/reports/company?startDate=X&endDate=Y
```

---

*Documento generado en base a comparación entre Angular 19 frontend y Flutter app existente.*
