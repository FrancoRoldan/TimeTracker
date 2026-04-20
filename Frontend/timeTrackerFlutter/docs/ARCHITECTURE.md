# Arquitectura — TimeTracker Flutter

## Visión General

La app Flutter sigue **Clean Architecture** organizada por features, con **BLoC/Cubit** como patrón de manejo de estado. Consume el mismo backend ASP.NET Core 7 que el frontend Angular.

---

## Capas

```
Presentation  →  Bloc/Cubit  →  Domain (Repository)  →  Data (RemoteDataSource)  →  API
```

| Capa | Responsabilidad | Equivalente Angular |
|------|----------------|---------------------|
| **Presentation** | Widgets, Screens | Components |
| **Bloc/Cubit** | Estado de UI, lógica de presentación | BehaviorSubject + Signals |
| **Repository** | Abstracción de datos, lógica de negocio | Service |
| **RemoteDataSource** | Llamadas HTTP via Dio | HttpClient calls dentro del Service |
| **Models** | DTOs Dart con fromJson/toJson | Interfaces TypeScript |

---

## Estructura de Carpetas

```
lib/
├── main.dart                        # Punto de entrada
├── app/
│   ├── router/
│   │   └── app_router.dart          # GoRouter — equivalente a app.routes.ts
│   └── theme/
│       └── app_theme.dart           # Material 3 — equivalente a public/themes/
├── core/
│   ├── constants/
│   │   └── api_constants.dart       # Base URL, headers — equiv. environment.ts
│   ├── enums/                       # Enums Dart — equiv. core/enums/ Angular
│   │   ├── user_role.dart
│   │   ├── issue_status.dart
│   │   ├── issue_type.dart
│   │   ├── issue_priority.dart
│   │   └── project_status.dart
│   ├── models/                      # DTOs — equiv. interfaces TypeScript
│   │   ├── user.dart
│   │   ├── company.dart
│   │   ├── project.dart
│   │   ├── issue.dart
│   │   ├── time_entry.dart
│   │   ├── paginated_result.dart
│   │   └── reports/
│   │       ├── user_report.dart
│   │       ├── project_report.dart
│   │       └── company_report.dart
│   ├── network/
│   │   ├── api_client.dart          # Dio singleton — equiv. HttpClient + interceptors
│   │   ├── auth_interceptor.dart    # JWT header + refresh — equiv. login.interceptor.ts
│   │   └── company_interceptor.dart # X-Company-Id header
│   └── storage/
│       └── local_storage.dart      # SharedPreferences + SecureStorage — equiv. localStorage
└── features/
    ├── auth/
    ├── company/
    ├── project/
    ├── issue/
    ├── time_entry/
    ├── reports/
    └── user/
```

### Estructura interna de cada Feature

```
features/{feature}/
├── bloc/
│   ├── {feature}_cubit.dart         # o _bloc.dart para flujos complejos
│   ├── {feature}_event.dart         # solo si se usa Bloc (no Cubit)
│   └── {feature}_state.dart
├── data/
│   ├── {feature}_repository.dart    # interfaz + implementación
│   └── {feature}_remote_data_source.dart
└── presentation/
    ├── screens/
    │   └── {screen}_screen.dart
    └── widgets/
        └── {widget}_widget.dart
```

---

## Patrón BLoC / Cubit

### ¿Cuándo usar Cubit vs Bloc?

| Usar **Cubit** | Usar **Bloc** |
|----------------|---------------|
| CRUD simple, estado lineal | Flujos con múltiples eventos y transiciones |
| Listas, formularios | Timer activo, autenticación multi-paso |
| Auth state, Theme state | TimeEntry (start/stop/tick) |

### Flujo de datos

```
Widget (UI)
  │  dispatchEvent / callMethod
  ▼
Bloc/Cubit
  │  llama repository
  ▼
Repository
  │  llama data source
  ▼
RemoteDataSource
  │  HTTP via ApiClient (Dio)
  ▼
Backend ASP.NET Core
  │  respuesta JSON
  ▲
  │  model.fromJson()
Cubit emite nuevo State
  │
  ▼
BlocBuilder/BlocListener
  └─ Widget se re-renderiza
```

### Ejemplo — AuthCubit

```dart
// Estado
abstract class AuthState extends Equatable {}
class AuthInitial extends AuthState { ... }
class AuthLoading extends AuthState { ... }
class AuthAuthenticated extends AuthState { final User user; ... }
class AuthError extends AuthState { final String message; ... }

// Cubit
class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _repository;
  AuthCubit(this._repository) : super(AuthInitial());

  Future<void> login(String email, String password) async {
    emit(AuthLoading());
    final result = await _repository.login(email, password);
    result.fold(
      (error) => emit(AuthError(error)),
      (user)  => emit(AuthAuthenticated(user)),
    );
  }
}
```

---

## Estado Global vs Local

| BLoC/Cubit | Scope | Equivalente Angular |
|-----------|-------|---------------------|
| `AuthCubit` | Global (MultiBlocProvider en main) | AuthService (singleton) |
| `CompanyCubit` | Global | CompanyService (selectedCompany$) |
| `ThemeCubit` | Global | ThemeService |
| `ProjectCubit` | Feature (solo en /projects) | ProjectService |
| `IssueCubit` | Feature | IssueService |
| `TimeEntryCubit` | Feature + FloatingTimer | TimeEntryService |
| `ReportsCubit` | Feature | ReportsService |

Los BLoCs globales se proveen en `main.dart` con `MultiBlocProvider`.  
Los BLoCs de feature se proveen en el router al entrar a la ruta.

---

## Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|---------|-----------|---------|
| Archivos | snake_case | `auth_cubit.dart` |
| Clases | PascalCase | `AuthCubit` |
| Variables/métodos | camelCase | `selectedCompany` |
| Constantes | SCREAMING_SNAKE o camelCase | `baseUrl`, `kApiTimeout` |
| Carpetas features | snake_case | `time_entry/` |

---

## Navegación

Se usa **GoRouter** (equivalente al router de Angular con guards).

- `redirect` en rutas protegidas → verifica token en SecureStorage
- `ShellRoute` → layout con `NavigationBar` o `NavigationRail` (adaptive)
- Rutas anidadas para `/projects/:id` con tabs

Ver [app_router.dart](../lib/app/router/app_router.dart) para la configuración completa.

---

## Temas

**Material Design 3** con `useMaterial3: true`.

- 6 seed colors: blue, pink, green, amber, purple, orange
- Tema oscuro/claro automático
- Persistencia en SharedPreferences

Ver [app_theme.dart](../lib/app/theme/app_theme.dart).
