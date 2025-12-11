# TimeTracker - Documentación Exhaustiva del Proyecto

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura General](#arquitectura-general)
3. [Backend (.NET/C#)](#backend-netc)
4. [Frontend (Angular)](#frontend-angular)
5. [Base de Datos](#base-de-datos)
6. [Seguridad](#seguridad)
7. [Flujos de Negocio](#flujos-de-negocio)
8. [Configuración y Despliegue](#configuración-y-despliegue)

---

## 📌 Descripción General

**TimeTracker** es una aplicación empresarial **multi-tenant** para el seguimiento de tiempo y gestión de proyectos. Permite que los usuarios registren el tiempo invertido en proyectos, problemas y tareas, generando reportes detallados de productividad.

### Características Principales:

- 🔐 Autenticación con JWT
- 🏢 Soporte Multi-Tenant (múltiples empresas)
- 📊 Seguimiento de Tiempo con Cronómetro
- 🎯 Gestión de Proyectos e Issues
- 📈 Reportes y Análisis
- 👥 Gestión de Usuarios y Roles
- 🎨 Interfaz Responsiva con Material Design

### Stack Tecnológico:

- **Backend**: ASP.NET Core 7+, Entity Framework Core, PostgreSQL
- **Frontend**: Angular 19, Angular Material, Chart.js
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)

---

## 🏗️ Arquitectura General

```
TimeTracker/
├── Backend/
│   ├── Core/                    # Lógica de negocio
│   ├── Data/                    # Acceso a datos
│   └── TimeTracker/             # API REST
└── Frontend/
    └── timeTrackerApp/          # Aplicación Angular
```

### Patrón de Arquitectura:

- **Backend**: Clean Architecture con separación de capas (Core, Data, API)
- **Frontend**: Modular con componentes reutilizables y servicios centralizados
- **Comunicación**: API REST con JWT

---

## 🔧 Backend (.NET/C#)

### Estructura del Proyecto Backend

```
Backend/
├── Core/
│   ├── Common/
│   │   └── Result.cs            # Clase para resultados de operaciones
│   ├── Helpers/
│   │   ├── ListToExcelConverter.cs
│   │   └── TimeTrackerSeeder.cs  # Datos de prueba
│   ├── Security/
│   │   ├── IJwtService.cs
│   │   ├── JwtService.cs
│   │   ├── IPasswordHasher.cs
│   │   └── PasswordHasher.cs
│   └── Services/                 # Servicios de negocio
│       ├── Companies/
│       ├── Issues/
│       ├── Projects/
│       ├── Reports/
│       ├── Tenant/
│       ├── TimeTracking/
│       └── Users/
├── Data/
│   ├── Context/
│   │   ├── AppDbContext.cs
│   │   └── AppDbContextFactory.cs
│   ├── Models/                   # Entidades
│   ├── Dtos/                     # Objetos de transferencia
│   ├── Configurations/           # Fluent API de EF Core
│   ├── Interfaces/
│   ├── Migrations/
│   ├── Repositorys/
│   ├── UnitOfWork/
│   └── Validators/
└── TimeTracker/
    ├── Program.cs               # Configuración de inicio
    ├── Controllers/             # Endpoints API
    └── appsettings.json
```

### Modelos de Datos Principales

#### **User.cs**

```csharp
public class User : BaseEntity
{
    public string Nombre { get; set; }           // Nombre del usuario
    public string Email { get; set; }            // Email único
    public string Password { get; set; }         // Hash de contraseña
    public ICollection<UserCompany> UserCompanies { get; set; }
}
```

#### **Company.cs**

```csharp
public class Company : BaseEntity
{
    public string Name { get; set; }             // Nombre empresa
    public string Code { get; set; }             // Código único (ej: "ACME")
    public bool IsActive { get; set; }           // Estado activo
    public ICollection<UserCompany> UserCompanies { get; set; }
    public ICollection<Project> Projects { get; set; }
}
```

#### **Project.cs**

```csharp
public class Project : BaseEntity
{
    public string Name { get; set; }             // Nombre del proyecto
    public DateTime? StartDate { get; set; }     // Fecha inicio
    public DateTime? EndDate { get; set; }       // Fecha fin
    public ProjectStatus Status { get; set; }    // Estado (Active, Paused, Completed)
    public int CompanyId { get; set; }
    public Company Company { get; set; }
    public ICollection<Issue> Issues { get; set; }
}
```

#### **Issue.cs**

```csharp
public class Issue : BaseEntity
{
    public int ProjectId { get; set; }           // Proyecto padre
    public Project Project { get; set; }
    public string Title { get; set; }            // Título
    public string? Description { get; set; }     // Descripción
    public IssueType Type { get; set; }          // Tipo (Bug, Feature, Task)
    public IssueStatus Status { get; set; }      // Estado (ToDo, InProgress, Done)
    public IssuePriority Priority { get; set; }  // Prioridad (Low, Medium, High)
    public decimal? EstimatedHours { get; set; } // Horas estimadas
    public int? AssignedUserId { get; set; }     // Usuario asignado
    public User? AssignedUser { get; set; }
    public ICollection<TimeEntry> TimeEntries { get; set; }
}
```

#### **TimeEntry.cs**

```csharp
public class TimeEntry : BaseEntity
{
    public int? IssueId { get; set; }            // Issue (opcional)
    public Issue? Issue { get; set; }
    public int? ProjectId { get; set; }          // Proyecto (opcional)
    public Project? Project { get; set; }
    public int UserId { get; set; }              // Usuario que registra
    public User User { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; }
    public DateTime StartTime { get; set; }      // Inicio
    public DateTime? EndTime { get; set; }       // Fin
    public string? Description { get; set; }     // Descripción
    public int? DurationMinutes { get; set; }    // Calculado: (EndTime - StartTime).TotalMinutes
}
```

#### **UserCompany.cs** (Relación Multi-Tenant)

```csharp
public class UserCompany : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; }
    public UserRole Role { get; set; }           // Admin, Manager, User
    public decimal? HourlyRate { get; set; }     // Tarifa por hora
}
```

### Enumeraciones

```csharp
// Roles de usuario
public enum UserRole
{
    Admin = 0,
    Manager = 1,
    User = 2
}

// Estado del proyecto
public enum ProjectStatus
{
    Active = 0,
    Paused = 1,
    Completed = 2
}

// Tipo de issue
public enum IssueType
{
    Bug = 0,
    Feature = 1,
    Task = 2
}

// Estado del issue
public enum IssueStatus
{
    ToDo = 0,
    InProgress = 1,
    Done = 2
}

// Prioridad del issue
public enum IssuePriority
{
    Low = 0,
    Medium = 1,
    High = 2
}
```

### Controladores API

#### **AuthController** - Autenticación

```
POST   /api/auth/register              Registrar usuario
POST   /api/auth/login                 Iniciar sesión
POST   /api/auth/refresh               Refrescar token JWT
```

#### **CompanyController** - Gestión de Empresas

```
GET    /api/company                    Listar empresas del usuario
GET    /api/company/{id}               Obtener empresa por ID
POST   /api/company                    Crear nueva empresa
PUT    /api/company/{id}               Actualizar empresa
DELETE /api/company/{id}               Eliminar empresa
GET    /api/company/{id}/users         Listar usuarios en empresa
POST   /api/company/{id}/add-user      Agregar usuario a empresa
POST   /api/company/{id}/remove-user   Remover usuario de empresa
```

#### **ProjectController** - Gestión de Proyectos

```
GET    /api/project                    Listar proyectos
GET    /api/project/{id}               Obtener proyecto
POST   /api/project                    Crear proyecto
PUT    /api/project/{id}               Actualizar proyecto
DELETE /api/project/{id}               Eliminar proyecto
```

#### **IssueController** - Gestión de Issues

```
GET    /api/issue                      Listar issues
GET    /api/issue/{id}                 Obtener issue
POST   /api/issue                      Crear issue
PUT    /api/issue/{id}                 Actualizar issue
DELETE /api/issue/{id}                 Eliminar issue
```

#### **TimeController** - Seguimiento de Tiempo

```
GET    /api/time                       Listar registros de tiempo
GET    /api/time/{id}                  Obtener registro
POST   /api/time/start                 Iniciar cronómetro
POST   /api/time/stop                  Detener cronómetro
POST   /api/time                       Crear registro manual
PUT    /api/time/{id}                  Actualizar registro
DELETE /api/time/{id}                  Eliminar registro
```

#### **ReportsController** - Reportes

```
GET    /api/reports/user/{userId}      Reporte por usuario
GET    /api/reports/project/{projectId} Reporte por proyecto
GET    /api/reports/company/{companyId} Reporte por empresa
```

### Servicios de Negocio (Core/Services)

#### **IUserService / UserService**

Maneja autenticación y gestión de usuarios:

- `AuthenticateAsync(email, password)` - Valida credenciales
- `GetUserCompaniesAsync(userId)` - Obtiene empresas del usuario

#### **ICompanyService / CompanyService**

Gestión de empresas y usuarios:

- `CreateCompanyAsync()` - Crear empresa
- `GetCompanyByIdAsync()` - Obtener empresa
- `AddUserToCompanyAsync()` - Agregar usuario
- `RegisterUserAsync()` - Registro de usuario
- `JoinCompanyAsync()` - Unirse a empresa

#### **IProjectService / ProjectService**

Gestión de proyectos:

- `CreateProjectAsync()`
- `GetProjectByIdAsync()`
- `UpdateProjectAsync()`
- `DeleteProjectAsync()`

#### **IIssueService / IssueService**

Gestión de issues:

- `CreateIssueAsync()`
- `GetIssueByIdAsync()`
- `UpdateIssueAsync()`
- `AssignIssueAsync()`

#### **ITimeTrackingService / TimeTrackingService**

Registro de tiempo:

- `StartTimerAsync()` - Inicia cronómetro
- `StopTimerAsync()` - Detiene cronómetro
- `CreateTimeEntryAsync()` - Crea registro manual
- `GetTimeEntriesAsync()` - Obtiene registros

#### **IReportingService / ReportingService**

Generación de reportes:

- `GetUserReportAsync()` - Reporte por usuario
- `GetProjectReportAsync()` - Reporte por proyecto
- `GetCompanyReportAsync()` - Reporte por empresa

### Seguridad (Core/Security)

#### **IJwtService / JwtService**

Manejo de tokens JWT:

```csharp
// Genera token con claims (userId, companyIds, rol)
string GenerateToken(User user, List<int> companyIds, int defaultCompanyId, UserRole role)

// Valida y recupera claims del token
ClaimsPrincipal ValidateToken(string token, bool validateLifetime = true)

// Refresca token expirado
string RefreshToken(string token)

// Extrae usuario del token
User getUserFromToken(string token)
```

#### **IPasswordHasher / PasswordHasher**

Hash y verificación de contraseñas con bcrypt.

### Configuración (Program.cs)

```csharp
// CORS - Permite solicitudes desde cualquier origen
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder.WithOrigins("*")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Base de datos - PostgreSQL
var cnnString = builder.Configuration.GetConnectionString("DbConnString");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(cnnString));

// Inyección de dependencias (Services)
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IIssueService, IssueService>();
builder.Services.AddScoped<ITimeTrackingService, TimeTrackingService>();
builder.Services.AddScoped<IReportingService, ReportingService>();

// Autenticación JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

### Configuración (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DbConnString": "Host=localhost;Port=5432;Database=TimeTracker;Username=user;Password=password"
  },
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "TimeTracker",
    "Audience": "TimeTrackerClient"
  },
  "SeedDatabase": {
    "Value": "true" // Carga datos iniciales
  }
}
```

---

## 🎨 Frontend (Angular)

### Estructura del Proyecto Frontend

```
Frontend/timeTrackerApp/src/
├── app/
│   ├── app.component.ts          # Componente raíz
│   ├── app.config.ts             # Configuración de la app
│   ├── app.routes.ts             # Rutas principales
│   ├── auth/                     # Módulo autenticación
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   └── interfaces/
│   ├── company/                  # Módulo empresas
│   │   ├── components/
│   │   ├── services/
│   │   └── interfaces/
│   ├── project/                  # Módulo proyectos
│   ├── issue/                    # Módulo issues
│   ├── time-entry/               # Módulo tiempo
│   ├── reports/                  # Módulo reportes
│   ├── dashboard/                # Dashboard
│   ├── core/                     # Servicios core
│   ├── shared/                   # Componentes compartidos
│   │   ├── components/
│   │   ├── services/
│   │   ├── interfaces/
│   │   ├── pipes/
│   │   └── layouts/
│   └── guards/                   # Guards de rutas
├── environments/                 # Configuración por entorno
├── main.ts                       # Entrada de la app
└── styles.css
```

### Versiones de Librerías

```json
{
  "dependencies": {
    "@angular/animations": "^19.0.3",
    "@angular/cdk": "^19.0.2",
    "@angular/common": "^19.0.3",
    "@angular/compiler": "^19.0.3",
    "@angular/core": "^19.0.3",
    "@angular/forms": "^19.0.3",
    "@angular/material": "^19.0.3",
    "@angular/platform-browser": "^19.0.3",
    "@angular/router": "^19.0.3",
    "chart.js": "^4.4.7",
    "moment": "^2.30.1",
    "ng2-charts": "^6.0.1",
    "rxjs": "~7.8.0"
  }
}
```

### Rutas Principales (app.routes.ts)

```
/auth                 # Autenticación (login, register)
/dashboard            # Dashboard principal
/company              # Gestión de empresas
/project              # Gestión de proyectos
/issue                # Gestión de issues
/time-entry           # Seguimiento de tiempo
/reports              # Reportes
```

### Servicios Principales

#### **AuthService** (auth/services/auth.service.ts)

Maneja toda la lógica de autenticación:

```typescript
// Login
login(req: LoginRequest): Observable<LoginResponse>

// Registro
register(req: RegisterRequest): Observable<LoginResponse>

// Refresca token expirado
refreshToken(): Observable<RefreshTokenResponse>

// Logout
logout(): void

// Verifica si está autenticado
isAuthenticated(): boolean

// Obtiene token del localStorage
getTokenLocalStorage(): string | null

// Guarda token en localStorage
saveTokenLocalStorage(token: string): void

// Obtiene rol del usuario en la empresa
getUserRole(): UserRole | undefined

// Verifica si usuario tiene algún rol
hasRole(roles: UserRole[]): boolean
```

#### **CompanyService** (company/services/company.service.ts)

Gestión de empresas:

```typescript
getCompanies(): Observable<Company[]>
getCompanyById(id: number): Observable<Company>
createCompany(data: CreateCompanyRequest): Observable<Company>
updateCompany(id: number, data: UpdateCompanyRequest): Observable<Company>
deleteCompany(id: number): Observable<void>
getCompanyUsers(companyId: number): Observable<CompanyUser[]>
addUserToCompany(companyId: number, request: AddUserToCompanyRequest): Observable<void>
removeUserFromCompany(companyId: number, userId: number): Observable<void>
```

#### **ProjectService** (project/services/project.service.ts)

Gestión de proyectos:

```typescript
getProjects(companyId?: number): Observable<Project[]>
getProjectById(id: number): Observable<Project>
createProject(data: CreateProjectRequest): Observable<Project>
updateProject(id: number, data: UpdateProjectRequest): Observable<Project>
deleteProject(id: number): Observable<void>
```

#### **IssueService** (issue/services/issue.service.ts)

Gestión de issues:

```typescript
getIssues(projectId?: number): Observable<Issue[]>
getIssueById(id: number): Observable<Issue>
createIssue(data: CreateIssueRequest): Observable<Issue>
updateIssue(id: number, data: UpdateIssueRequest): Observable<Issue>
deleteIssue(id: number): Observable<void>
assignIssue(issueId: number, request: AssignIssueRequest): Observable<void>
```

#### **TimeEntryService** (time-entry/services/time-entry.service.ts)

Registro de tiempo:

```typescript
getTimeEntries(filters?: any): Observable<TimeEntry[]>
getTimeEntryById(id: number): Observable<TimeEntry>
createTimeEntry(data: CreateTimeEntryRequest): Observable<TimeEntry>
startTimer(data: StartTimerRequest): Observable<TimeEntry>
stopTimer(id: number): Observable<TimeEntry>
updateTimeEntry(id: number, data: UpdateTimeEntryRequest): Observable<TimeEntry>
deleteTimeEntry(id: number): Observable<void>
```

#### **ReportsService** (reports/services/reports.service.ts)

Generación de reportes:

```typescript
getUserReport(userId: number, startDate?: Date, endDate?: Date): Observable<UserReport>
getProjectReport(projectId: number, startDate?: Date, endDate?: Date): Observable<ProjectReport>
getCompanyReport(companyId: number, startDate?: Date, endDate?: Date): Observable<CompanyReport>
```

### Interceptores

#### **LoginInterceptor** (shared/services/login-interceptor.interceptor.ts)

Intercepta todas las solicitudes HTTP para:

1. Agregar header de autorización `Authorization: Bearer {token}`
2. Agregar header de compañía `X-Company-Id: {companyId}`
3. Manejar errores 401 (token expirado)
4. Refrescar token automáticamente
5. Reintentar la solicitud original

```typescript
export function LoginInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  // Skip para rutas públicas
  if (
    req.url.includes("/login") ||
    req.url.includes("/register") ||
    req.url.includes("/refresh")
  ) {
    return next(req);
  }

  // Agrega headers
  let headers = req.headers
    .set("Authorization", `Bearer ${token}`)
    .set("X-Company-Id", `${companyId}`);

  // Maneja errores
  return next(req.clone({ headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap((newToken) => {
            // Reintenta con nuevo token
            const newReq = req.clone({
              headers: req.headers.set(
                "Authorization",
                `Bearer ${newToken.token}`
              ),
            });
            return next(newReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
}
```

### Componentes Principales

#### **TimeTrackerComponent** (time-entry/components/time-tracker/)

Cronómetro en tiempo real:

- Iniciar/pausar/detener temporizador
- Visualización en vivo del tiempo transcurrido
- Registro del tiempo invertido
- Lista de registros del día

#### **ProjectCardComponent** (project/components/project-card/)

Tarjeta de proyecto con:

- Nombre, estado, fechas
- Issues asociados
- Acciones (editar, eliminar)

#### **IssueModalComponent** (issue/components/issue-modal/)

Modal para crear/editar issues:

- Titulo, descripción
- Tipo (Bug, Feature, Task)
- Estado, prioridad
- Usuario asignado
- Horas estimadas

#### **LayoutComponent** (shared/layouts/layout.component.ts)

Estructura principal de la aplicación:

- Barra de navegación
- Sidebar izquierda (navegación)
- Sidebar derecha (configuración, tema)
- Contenido principal
- Botón flotante para iniciar timer

### Guardias de Rutas

#### **AuthGuard** (guards/auth.guard.ts)

Protege rutas autenticadas verificando token JWT

#### **IsAuthenticatedGuard** (guards/is-authenticated.guard.ts)

Redirige usuarios autenticados fuera de /auth

### Interfaces Principales

```typescript
// Autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  companies: UserCompanyInfo[];
  selectedCompanyId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

// Empresa
export interface Company {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

// Proyecto
export interface Project {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: ProjectStatus;
  companyId: number;
}

// Issue
export interface Issue {
  id: number;
  projectId: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  estimatedHours: number;
  assignedUserId: number;
}

// Registro de Tiempo
export interface TimeEntry {
  id: number;
  issueId: number;
  projectId: number;
  userId: number;
  companyId: number;
  startTime: Date;
  endTime: Date;
  description: string;
  durationMinutes: number;
}

// Reportes
export interface UserReport {
  userId: number;
  userName: string;
  totalHours: number;
  dailyBreakdown: DailyBreakdown[];
  projectBreakdown: ProjectBreakdown[];
}

export interface ProjectReport {
  projectId: number;
  projectName: string;
  totalHours: number;
  userBreakdown: UserBreakdown[];
  issueBreakdown: IssueBreakdown[];
}
```

### Enumeraciones

```typescript
// Rol del usuario
export enum UserRole {
  Admin = "Admin",
  Manager = "Manager",
  User = "User",
}

// Estado del proyecto
export enum ProjectStatus {
  Active = "Active",
  Paused = "Paused",
  Completed = "Completed",
}

// Tipo de issue
export enum IssueType {
  Bug = "Bug",
  Feature = "Feature",
  Task = "Task",
}

// Estado del issue
export enum IssueStatus {
  ToDo = "ToDo",
  InProgress = "InProgress",
  Done = "Done",
}

// Prioridad del issue
export enum IssuePriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}
```

### Tubería Personalizada (Pipes)

#### **EnumLabelPipe** (shared/pipes/enum-label.pipe.ts)

Convierte enumeraciones a etiquetas legibles:

```typescript
{
  {
    issue.priority | enumLabel;
  }
} // Output: "High" -> "Alta"
```

### Servicios Compartidos

#### **ThemeService** (shared/services/theme-service.service.ts)

Maneja temas claro/oscuro

#### **ToastService** (shared/services/toast.service.ts)

Notificaciones (snackbar)

#### **KeyboardShortcutService** (shared/services/keyboard-shortcut.service.ts)

Atajos de teclado personalizados

#### **AudioService** (shared/services/audio.service.ts)

Efectos de sonido para notificaciones

### Configuración de Entorno

#### environment.ts (Producción)

```typescript
export const environment = {
  baseUrl: "http://192.168.1.12:5083/api",
};
```

#### environment.development.ts (Desarrollo)

```typescript
export const environment = {
  baseUrl: "http://localhost:5083/api",
};
```

---

## 🗄️ Base de Datos

### Esquema ERD (Entity Relationship Diagram)

```
USER (1) -----> (N) USER_COMPANY (N) -----> (1) COMPANY
                                              |
                                              | (1) ----> (N) PROJECT
                                              |               |
                                              |               | (1) ----> (N) ISSUE
                                              |               |             |
                                              |               |             | (1) ----> (N) TIME_ENTRY
                                              |               |             |
                                              |               |             | (0,1) --- (N) USER
                                              |               |
                                              |               | (1) ----> (N) TIME_ENTRY
                                              |
                                              | (1) ----> (N) TIME_ENTRY
```

### Tablas Principales

| Tabla           | Columnas                                                                                                  | Descripción            |
| --------------- | --------------------------------------------------------------------------------------------------------- | ---------------------- |
| **User**        | id, nombre, email, password, created_at, updated_at                                                       | Usuarios del sistema   |
| **Company**     | id, name, code, is_active, created_at, updated_at                                                         | Empresas (tenants)     |
| **UserCompany** | id, user_id, company_id, role, hourly_rate, created_at                                                    | Relación M:N con roles |
| **Project**     | id, company_id, name, start_date, end_date, status, created_at                                            | Proyectos por empresa  |
| **Issue**       | id, project_id, title, description, type, status, priority, estimated_hours, assigned_user_id, created_at | Issues de proyectos    |
| **TimeEntry**   | id, issue_id, project_id, user_id, company_id, start_time, end_time, description, created_at              | Registros de tiempo    |

### Migraciones

- `20251209025829_InitialCreate` - Creación inicial de tablas

---

## 🔐 Seguridad

### Autenticación

**Flujo de Login:**

1. Usuario entra credenciales (email, password)
2. Backend valida contra tabla User
3. Backend genera JWT con claims:
   - `sub` (userId)
   - `email`
   - `companyIds` (lista de empresas del usuario)
   - `role` (rol en empresa actual)
   - `companyId` (empresa seleccionada)
4. Frontend almacena token en `localStorage`
5. Frontend adjunta token en header `Authorization` de cada solicitud

**JWT Token:**

```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "sub": "1",
  "email": "usuario@example.com",
  "companyIds": [1, 2, 3],
  "role": "Admin",
  "companyId": 1,
  "iat": 1670573000,
  "exp": 1670576600
}
Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### Validación

**Backend:**

- Validación de modelos con FluentValidation
- Validación de tokens JWT en cada solicitud
- Validación de permisos por rol
- Validación de tenant (solo accede a datos de su empresa)

**Frontend:**

- Validación de formularios en tiempo real
- Guards de rutas protegidas
- Manejo de errores HTTP

### Hash de Contraseñas

Se utiliza **bcrypt** para hashear contraseñas:

- Implementado en `PasswordHasher.cs`
- Contraseñas nunca se transmiten en texto plano
- Almacenadas hasheadas en BD

---

## 📊 Flujos de Negocio

### 1. Registro e Inicio de Sesión

```
Frontend: Register Form
    ↓
Backend: POST /auth/register
    ↓ Validate & Create User
Database: Insert User, UserCompany
    ↓
Backend: Generate JWT
    ↓
Frontend: Store Token + User
    ↓
Frontend: Redirect to Dashboard
```

### 2. Seguimiento de Tiempo

```
User: Click "Start Timer"
    ↓
Frontend: POST /api/time/start
    ↓ Create TimeEntry
Database: Insert TimeEntry (start_time, end_time=null)
    ↓
Frontend: Timer Running
    ↓
User: Click "Stop Timer"
    ↓
Frontend: PUT /api/time/{id}
    ↓ Update TimeEntry
Database: Update TimeEntry (set end_time)
    ↓
Frontend: Show Duration
```

### 3. Gestión Multi-Tenant

```
User: Select Company
    ↓
Frontend: Save to localStorage
    ↓
Frontend: Add Header X-Company-Id
    ↓
Backend: Extract CompanyId from JWT + Header
    ↓
Backend: Validate User Belongs to Company
    ↓
Database: Filter by CompanyId
    ↓
Return Company Data Only
```

### 4. Generación de Reportes

```
User: Request Report (date range, filters)
    ↓
Frontend: GET /api/reports/user/{userId}?startDate=X&endDate=Y
    ↓
Backend: Query TimeEntries, Issues, Projects
    ↓
Backend: Calculate Metrics
    - Total hours
    - Hours by project
    - Hours by issue
    - Hours by user
    - Cost (hours * hourly_rate)
    ↓
Frontend: Render Charts (Chart.js)
    - Bar chart: Hours by project
    - Pie chart: Distribution
    - Line chart: Trend
    ↓
User: View Report
```

---

## 🚀 Configuración y Despliegue

### Requisitos Previos

**Backend:**

- .NET 7+ SDK
- PostgreSQL 12+
- Visual Studio 2022 (opcional)

**Frontend:**

- Node.js 18+
- npm o yarn
- Angular CLI 19

### Configuración Local

#### Backend

1. **Configurar BD:**

```bash
# En PostgreSQL
CREATE DATABASE TimeTracker;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE TimeTracker TO user;
```

2. **Configurar appsettings.json:**

```json
{
  "ConnectionStrings": {
    "DbConnString": "Host=localhost;Port=5432;Database=TimeTracker;Username=user;Password=password"
  },
  "Jwt": {
    "Key": "your-super-secret-key-min-32-chars-here!!!!",
    "Issuer": "TimeTracker",
    "Audience": "TimeTrackerClient"
  }
}
```

3. **Ejecutar migraciones:**

```bash
cd Backend/Data
dotnet ef database update
```

4. **Ejecutar Backend:**

```bash
cd Backend/TimeTracker
dotnet run
# API escuchará en http://localhost:5083
```

#### Frontend

1. **Instalar dependencias:**

```bash
cd Frontend/timeTrackerApp
npm install
```

2. **Configurar environment.development.ts:**

```typescript
export const environment = {
  baseUrl: "http://localhost:5083/api",
};
```

3. **Ejecutar servidor de desarrollo:**

```bash
ng serve
# App en http://localhost:4200
```

### Docker

**Backend Dockerfile:**

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:7.0
COPY . /app
WORKDIR /app
EXPOSE 5083
ENTRYPOINT ["dotnet", "TimeTracker.Api.dll"]
```

**Usar:**

```bash
docker build -t timetracker-api .
docker run -p 5083:5083 timetracker-api
```

### Variables de Entorno

| Variable       | Descripción       | Ejemplo               |
| -------------- | ----------------- | --------------------- |
| `DB_HOST`      | Host de BD        | localhost             |
| `DB_PORT`      | Puerto de BD      | 5432                  |
| `DB_NAME`      | Nombre de BD      | TimeTracker           |
| `DB_USER`      | Usuario de BD     | user                  |
| `DB_PASSWORD`  | Contraseña de BD  | password              |
| `JWT_KEY`      | Clave secreta JWT | your-secret-key       |
| `JWT_ISSUER`   | Emisor de JWT     | TimeTracker           |
| `JWT_AUDIENCE` | Audiencia de JWT  | TimeTrackerClient     |
| `CORS_ORIGINS` | Orígenes CORS     | http://localhost:4200 |

---

## 📝 Resumen

**TimeTracker** es una aplicación empresarial robusta que demuestra:

✅ **Arquitectura limpia** - Separación de responsabilidades  
✅ **Multi-tenant** - Aislamiento de datos por empresa  
✅ **Seguridad** - JWT, bcrypt, CORS  
✅ **Escalabilidad** - Servicios desacoplados  
✅ **UX moderna** - Angular Material, responsive design  
✅ **Reportes avanzados** - Gráficos y análisis  
✅ **Real-time** - Cronómetro en vivo

El código está bien organizado, es mantenible y sigue mejores prácticas de desarrollo.

---

**Documentación generada:** 11 de diciembre de 2025  
**Versión del Backend:** .NET 7+  
**Versión del Frontend:** Angular 19  
**Base de Datos:** PostgreSQL
