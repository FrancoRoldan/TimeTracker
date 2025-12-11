# Documentación Detallada - Backend TimeTracker

## 📑 Tabla de Contenidos

1. [Estructura de Carpetas](#estructura-de-carpetas)
2. [Modelos de Datos](#modelos-de-datos)
3. [Servicios de Negocio](#servicios-de-negocio)
4. [Controladores API](#controladores-api)
5. [DTOs (Data Transfer Objects)](#dtos)
6. [Validadores](#validadores)
7. [Unit of Work & Repositorio](#unit-of-work--repositorio)
8. [Seguridad & JWT](#seguridad--jwt)
9. [Base de Datos](#base-de-datos)
10. [Configuración](#configuración)

---

## 📂 Estructura de Carpetas

```
Backend/
├── Core/                           # Lógica de negocio (capa de dominio)
│   ├── Common/
│   │   └── Result.cs               # Clase genérica para resultados de operación
│   ├── Helpers/
│   │   ├── ListToExcelConverter.cs # Exporta datos a Excel
│   │   └── TimeTrackerSeeder.cs    # Datos de prueba iniciales
│   ├── Security/
│   │   ├── IJwtService.cs          # Interfaz para manejo de JWT
│   │   ├── JwtService.cs           # Implementación de JWT
│   │   ├── IPasswordHasher.cs       # Interfaz para hash de contraseñas
│   │   └── PasswordHasher.cs       # Implementación con bcrypt
│   └── Services/                   # Servicios de negocio
│       ├── Companies/
│       │   ├── ICompanyService.cs
│       │   └── CompanyService.cs
│       ├── Issues/
│       │   ├── IIssueService.cs
│       │   └── IssueService.cs
│       ├── Projects/
│       │   ├── IProjectService.cs
│       │   └── ProjectService.cs
│       ├── Reports/
│       │   ├── IReportingService.cs
│       │   └── ReportingService.cs
│       ├── Tenant/
│       │   ├── ITenantService.cs
│       │   └── TenantService.cs
│       ├── TimeTracking/
│       │   ├── ITimeTrackingService.cs
│       │   └── TimeTrackingService.cs
│       └── Users/
│           ├── IUserService.cs
│           └── UserService.cs
│
├── Data/                           # Acceso a datos (capa de persistencia)
│   ├── Context/
│   │   ├── AppDbContext.cs         # DbContext de Entity Framework
│   │   └── AppDbContextFactory.cs  # Factory para migraciones
│   ├── Models/                     # Entidades (tablas de BD)
│   │   ├── BaseEntity.cs           # Clase base para todas las entidades
│   │   ├── Company.cs
│   │   ├── Issue.cs
│   │   ├── Project.cs
│   │   ├── TimeEntry.cs
│   │   ├── User.cs
│   │   └── UserCompany.cs          # Relación M:N (multi-tenant)
│   ├── Dtos/                       # Objetos para transferencia
│   │   ├── AdduserRequest.cs
│   │   ├── GetUserResponse.cs
│   │   ├── LoginRequest.cs
│   │   ├── Auth/                   # DTOs de autenticación
│   │   ├── Company/                # DTOs de empresa
│   │   ├── Issue/                  # DTOs de issue
│   │   ├── Project/                # DTOs de proyecto
│   │   ├── Reports/                # DTOs de reporte
│   │   └── TimeEntry/              # DTOs de entrada de tiempo
│   ├── Enums/
│   │   ├── IssuePriority.cs        # Baja, Media, Alta
│   │   ├── IssueStatus.cs          # ToDo, InProgress, Done
│   │   ├── IssueType.cs            # Bug, Feature, Task
│   │   ├── ProjectStatus.cs        # Active, Paused, Completed
│   │   └── UserRole.cs             # Admin, Manager, User
│   ├── Configurations/             # Fluent API de EF Core
│   │   ├── CompanyConfiguration.cs
│   │   ├── IssueConfiguration.cs
│   │   ├── ProjectConfiguration.cs
│   │   ├── TimeEntryConfiguration.cs
│   │   ├── UserCompanyConfiguration.cs
│   │   └── UserConfiguration.cs
│   ├── Interfaces/
│   │   ├── IRepository.cs          # Interfaz genérica del repositorio
│   │   ├── IUnitOfWork.cs          # Patrón Unit of Work
│   │   └── IUserRepository.cs      # Repositorio específico de User
│   ├── Migrations/                 # Migraciones de EF Core
│   │   ├── 20251209025829_InitialCreate.cs
│   │   ├── 20251209025829_InitialCreate.Designer.cs
│   │   └── AppDbContextModelSnapshot.cs
│   ├── Repositorys/
│   │   ├── Repository.cs           # Implementación genérica
│   │   └── UserRepository.cs       # Implementación específica
│   ├── UnitOfWork/
│   │   └── UnitOfWork.cs           # Implementación del patrón
│   ├── Validators/                 # Validadores FluentValidation
│   │   ├── CreateCompanyRequestValidator.cs
│   │   ├── CreateIssueRequestValidator.cs
│   │   └── ...
│   ├── Data.csproj
│   └── appsettings.json
│
└── TimeTracker/                    # API REST (capa de presentación)
    ├── Controllers/
    │   ├── authController.cs       # Endpoints: register, login, refresh
    │   ├── CompanyController.cs
    │   ├── ProjectController.cs
    │   ├── IssueController.cs
    │   ├── TimeController.cs
    │   └── ReportsController.cs
    ├── Program.cs                  # Configuración de inicio
    ├── Dockerfile                  # Para contenedorización
    ├── appsettings.Development.json
    ├── appsettings.json
    ├── TimeTracker.Api.csproj
    └── Properties/
        └── launchSettings.json
```

---

## 🗂️ Modelos de Datos

### BaseEntity.cs

Clase base para todas las entidades:

```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int CompanyId { get; set; }  // Para soporte multi-tenant
}
```

### User.cs

Entidad de usuario:

```csharp
public class User : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;  // Hash bcrypt

    // Navigation properties
    public ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
}
```

**Propiedades:**

- `Id`: Identificador único
- `Nombre`: Nombre completo del usuario
- `Email`: Email único para login
- `Password`: Hash bcrypt de la contraseña
- `UserCompanies`: Colección de empresas a las que pertenece

### Company.cs

Entidad de empresa (tenant):

```csharp
public class Company : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;  // Código único, ej: "ACME"

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<UserCompany> UserCompanies { get; set; } = new List<UserCompany>();
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
```

**Propiedades:**

- `Id`: Identificador único
- `Name`: Nombre de la empresa
- `Code`: Código identificativo (ej: "ACME", "GOOGLE")
- `IsActive`: Si la empresa está activa
- `UserCompanies`: Usuarios asignados a esta empresa
- `Projects`: Proyectos de la empresa

### Project.cs

Entidad de proyecto:

```csharp
public class Project : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;

    [Column("CompanyId")]
    public new int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    // Navigation properties
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}
```

**Propiedades:**

- `Id`: Identificador único
- `Name`: Nombre del proyecto
- `StartDate`: Fecha de inicio (opcional)
- `EndDate`: Fecha de fin (opcional)
- `Status`: Estado (Active, Paused, Completed)
- `CompanyId`: Empresa propietaria
- `Issues`: Issues/tareas del proyecto

### Issue.cs

Entidad de issue (tarea/bug/feature):

```csharp
public class Issue : BaseEntity
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public IssueType Type { get; set; }                    // Bug, Feature, Task
    public IssueStatus Status { get; set; } = IssueStatus.ToDo;
    public IssuePriority Priority { get; set; } = IssuePriority.Medium;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? EstimatedHours { get; set; }           // Horas estimadas

    public int? AssignedUserId { get; set; }               // Usuario asignado (opcional)
    public User? AssignedUser { get; set; }

    // Navigation properties
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
```

**Propiedades:**

- `Id`: Identificador único
- `ProjectId`: Proyecto al que pertenece
- `Title`: Título del issue
- `Description`: Descripción detallada
- `Type`: Tipo (Bug, Feature, Task)
- `Status`: Estado (ToDo, InProgress, Done)
- `Priority`: Prioridad (Low, Medium, High)
- `EstimatedHours`: Horas estimadas para resolverlo
- `AssignedUserId`: Usuario responsable (opcional)
- `TimeEntries`: Registros de tiempo asociados

### TimeEntry.cs

Entidad de registro de tiempo:

```csharp
public class TimeEntry : BaseEntity
{
    // Flexible: puede registrarse tiempo en un Issue O en un Project
    public int? IssueId { get; set; }
    public Issue? Issue { get; set; }

    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    public int UserId { get; set; }                        // Usuario que registra
    public User User { get; set; } = null!;

    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public DateTime StartTime { get; set; }                // Inicio del registro
    public DateTime? EndTime { get; set; }                 // Fin del registro (null = en progreso)

    [MaxLength(1000)]
    public string? Description { get; set; }               // Descripción del trabajo

    // Propiedad calculada (no mapeada en BD)
    [NotMapped]
    public int? DurationMinutes => EndTime.HasValue
        ? (int)(EndTime.Value - StartTime).TotalMinutes
        : null;
}
```

**Propiedades:**

- `Id`: Identificador único
- `IssueId`: Issue asociado (opcional)
- `ProjectId`: Proyecto asociado (opcional)
- `UserId`: Usuario que registra
- `CompanyId`: Empresa (para multi-tenant)
- `StartTime`: Hora de inicio
- `EndTime`: Hora de finalización (null = en progreso)
- `Description`: Qué se hizo
- `DurationMinutes`: Calculado: duración en minutos

### UserCompany.cs

Entidad de relación (M:N con roles):

```csharp
public class UserCompany : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public UserRole Role { get; set; }                     // Admin, Manager, User
    public decimal? HourlyRate { get; set; }               // Tarifa por hora del usuario
}
```

**Propiedades:**

- `UserId`: Usuario
- `CompanyId`: Empresa
- `Role`: Rol del usuario en la empresa
- `HourlyRate`: Tarifa horaria (para cálculo de costos)

---

## 🔧 Servicios de Negocio

### IUserService / UserService

**Interfaz:**

```csharp
public interface IUserService
{
    Task<(User? user, List<UserCompany> companies)> AuthenticateAsync(
        string email,
        string password);

    Task<List<UserCompany>> GetUserCompaniesAsync(int userId);
}
```

**Métodos:**

- `AuthenticateAsync()` - Valida credenciales y retorna usuario + empresas
- `GetUserCompaniesAsync()` - Obtiene empresas a las que pertenece un usuario

**Responsabilidades:**

- Validar email y contraseña
- Verificar integridad de contraseña con bcrypt
- Obtener lista de empresas del usuario
- Retornar roles en cada empresa

---

### ICompanyService / CompanyService

**Interfaz principales:**

```csharp
public interface ICompanyService
{
    Task<Result<CompanyResponse>> CreateCompanyAsync(CreateCompanyRequest request);
    Task<Result<CompanyResponse>> GetCompanyByIdAsync(int id);
    Task<Result<List<CompanyResponse>>> GetAllCompaniesAsync();
    Task<Result<List<CompanyUserResponse>>> GetCompanyUsersAsync(int companyId);
    Task<Result<List<AvailableUserResponse>>> GetAvailableUsersAsync(int companyId);
    Task<Result> AddUserToCompanyAsync(int companyId, AddUserToCompanyRequest request);
    Task<Result> CreateAndAddUserToCompanyAsync(int companyId, CreateAndAddUserToCompanyRequest request);
    Task<Result> RemoveUserFromCompanyAsync(int companyId, int userId);
    Task<Result<RegisterUserResponse>> RegisterUserAsync(RegisterUserRequest request);
    Task<Result<JoinCompanyResponse>> JoinCompanyAsync(JoinCompanyRequest request);
    Task<Result<CompanyResponse>> UpdateCompanyAsync(int id, UpdateCompanyRequest request);
    Task<Result> DeleteCompanyAsync(int id);
    Task<Result> UpdateUserInCompanyAsync(int companyId, int userId, UpdateUserInCompanyRequest request);
}
```

**Responsabilidades:**

- Crear nuevas empresas
- Gestionar usuarios en empresas (agregar/remover)
- Manejar registros de usuarios con empresas
- Permitir que usuarios se unan a empresas existentes
- Actualizar información de empresa y usuarios

---

### IProjectService / ProjectService

**Métodos principales:**

```csharp
Task<Result<ProjectResponse>> CreateProjectAsync(CreateProjectRequest request);
Task<Result<ProjectResponse>> GetProjectByIdAsync(int projectId);
Task<Result<List<ProjectResponse>>> GetProjectsAsync(int? companyId);
Task<Result<ProjectResponse>> UpdateProjectAsync(int projectId, UpdateProjectRequest request);
Task<Result> DeleteProjectAsync(int projectId);
```

**Responsabilidades:**

- CRUD de proyectos
- Validar que proyecto pertenece a la empresa del usuario
- Manejar soft-delete (marcar como inactivo)
- Gestionar estados del proyecto

---

### IIssueService / IssueService

**Métodos principales:**

```csharp
Task<Result<IssueResponse>> CreateIssueAsync(CreateIssueRequest request);
Task<Result<IssueResponse>> GetIssueByIdAsync(int issueId);
Task<Result<List<IssueResponse>>> GetIssuesAsync(int? projectId, int? companyId);
Task<Result<IssueResponse>> UpdateIssueAsync(int issueId, UpdateIssueRequest request);
Task<Result> AssignIssueAsync(int issueId, int userId);
Task<Result> DeleteIssueAsync(int issueId);
```

**Responsabilidades:**

- CRUD de issues
- Validar que issue pertenece a proyecto de la empresa
- Asignar issues a usuarios
- Cambiar estado y prioridad

---

### ITimeTrackingService / TimeTrackingService

**Métodos principales:**

```csharp
Task<Result<TimeEntryResponse>> StartTimerAsync(StartTimerRequest request);
Task<Result<TimeEntryResponse>> StopTimerAsync(int timeEntryId);
Task<Result<TimeEntryResponse>> CreateTimeEntryAsync(CreateTimeEntryRequest request);
Task<Result<TimeEntryResponse>> UpdateTimeEntryAsync(int timeEntryId, UpdateTimeEntryRequest request);
Task<Result<List<TimeEntryResponse>>> GetTimeEntriesAsync(
    int userId,
    int companyId,
    DateTime? startDate,
    DateTime? endDate);
Task<Result> DeleteTimeEntryAsync(int timeEntryId);
```

**Responsabilidades:**

- Crear registros de tiempo
- Iniciar y detener cronómetro
- Calcular duración automáticamente
- Filtrar registros por fecha y usuario
- Validar que usuario solo modifica sus propios registros

---

### IReportingService / ReportingService

**Métodos principales:**

```csharp
Task<Result<UserReportDto>> GetUserReportAsync(
    int userId,
    int companyId,
    DateTime startDate,
    DateTime endDate);

Task<Result<ProjectReportDto>> GetProjectReportAsync(
    int projectId,
    int companyId,
    DateTime startDate,
    DateTime endDate);

Task<Result<CompanyReportDto>> GetCompanyReportAsync(
    int companyId,
    DateTime startDate,
    DateTime endDate);
```

**Responsabilidades:**

- Agregar datos de tiempo por usuario
- Calcular totales de horas
- Desglosar por proyecto e issue
- Calcular costos (horas × tarifa)
- Generar gráficos y estadísticas

---

## 🎯 Controladores API

### AuthController

**Ruta base:** `POST /api/auth`

```csharp
[Route("api/[controller]")]
[ApiController]
public class authController : ControllerBase
{
    // Register: Crea nuevo usuario + empresa + relación
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)

    // Login: Valida credenciales y retorna JWT
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)

    // Refresh: Genera nuevo token si el actual expiró
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken()
}
```

**Flujo Register:**

1. Validar request (email único, contraseña fuerte)
2. Hash contraseña con bcrypt
3. Crear usuario
4. Crear empresa
5. Crear relación UserCompany con rol Admin
6. Generar JWT
7. Retornar token + user + companies

**Flujo Login:**

1. Validar email existe
2. Verificar contraseña con bcrypt
3. Obtener empresas del usuario
4. Generar JWT con companyIds
5. Retornar token + user + companies

**Flujo Refresh:**

1. Validar token expirado (pero firma válida)
2. Extraer claims
3. Generar nuevo token
4. Retornar nuevo token

---

### CompanyController

**Ruta base:** `GET/POST/PUT/DELETE /api/company`

```csharp
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CompanyController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCompanyRequest request)

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCompanyRequest request)

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)

    [HttpGet("{id}/users")]
    public async Task<IActionResult> GetCompanyUsers(int id)

    [HttpPost("{id}/add-user")]
    public async Task<IActionResult> AddUserToCompany(int id, [FromBody] AddUserToCompanyRequest request)

    [HttpPost("{id}/remove-user")]
    public async Task<IActionResult> RemoveUserFromCompany(int id, [FromBody] RemoveUserFromCompanyRequest request)
}
```

**Protección:** Usa JWT Bearer token. El middleware valida el token y extrae userId.

---

### ProjectController

**Ruta base:** `GET/POST/PUT/DELETE /api/project`

Sigue el mismo patrón que CompanyController:

- Listar, crear, actualizar, eliminar proyectos
- Filtrar por companyId
- Validar permisos

---

### IssueController

**Ruta base:** `GET/POST/PUT/DELETE /api/issue`

Operaciones CRUD para issues:

- Crear issue (requiere projectId)
- Actualizar estado, prioridad, asignación
- Listar issues con filtros

---

### TimeController

**Ruta base:** `GET/POST/PUT/DELETE /api/time`

```csharp
[HttpPost("start")]
public async Task<IActionResult> StartTimer([FromBody] StartTimerRequest request)

[HttpPost("stop/{id}")]
public async Task<IActionResult> StopTimer(int id)

[HttpGet]
public async Task<IActionResult> GetTimeEntries([FromQuery] TimeEntryFilterRequest filter)

[HttpPost]
public async Task<IActionResult> CreateTimeEntry([FromBody] CreateTimeEntryRequest request)

[HttpPut("{id}")]
public async Task<IActionResult> UpdateTimeEntry(int id, [FromBody] UpdateTimeEntryRequest request)

[HttpDelete("{id}")]
public async Task<IActionResult> DeleteTimeEntry(int id)
```

---

### ReportsController

**Ruta base:** `GET /api/reports`

```csharp
[HttpGet("user/{userId}")]
public async Task<IActionResult> GetUserReport(
    int userId,
    [FromQuery] DateTime startDate,
    [FromQuery] DateTime endDate)

[HttpGet("project/{projectId}")]
public async Task<IActionResult> GetProjectReport(
    int projectId,
    [FromQuery] DateTime startDate,
    [FromQuery] DateTime endDate)

[HttpGet("company")]
public async Task<IActionResult> GetCompanyReport(
    [FromQuery] DateTime startDate,
    [FromQuery] DateTime endDate)
```

---

## 📦 DTOs (Data Transfer Objects)

Los DTOs definen la estructura de datos que viaja entre cliente y servidor.

### DTOs de Autenticación (Data/Dtos/Auth/)

**RegisterUserRequest:**

```csharp
public class RegisterUserRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
    public string CompanyName { get; set; }
    public string CompanyCode { get; set; }
    public decimal? HourlyRate { get; set; }
}
```

**LoginRequest:**

```csharp
public class LoginRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
    public int? CompanyId { get; set; }  // Opcional si usuario está en múltiples empresas
}
```

**LoginResponse:**

```csharp
public class LoginResponse
{
    public string Token { get; set; }
    public UserInfo User { get; set; }
    public List<UserCompanyInfo> Companies { get; set; }
    public int SelectedCompanyId { get; set; }
}

public class UserInfo
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

public class UserCompanyInfo
{
    public int CompanyId { get; set; }
    public string CompanyName { get; set; }
    public string CompanyCode { get; set; }
    public string Role { get; set; }  // "Admin", "Manager", "User"
    public decimal? HourlyRate { get; set; }
}
```

**RefreshTokenResponse:**

```csharp
public class RefreshTokenResponse
{
    public string Token { get; set; }
}
```

### DTOs de Empresa (Data/Dtos/Company/)

**CreateCompanyRequest:**

```csharp
public class CreateCompanyRequest
{
    [Required(ErrorMessage = "El nombre de la empresa es requerido")]
    [MaxLength(200)]
    public string Name { get; set; }

    [Required(ErrorMessage = "El código de la empresa es requerido")]
    [MaxLength(50)]
    public string Code { get; set; }
}
```

**CompanyResponse:**

```csharp
public class CompanyResponse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Code { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### DTOs de Proyecto (Data/Dtos/Project/)

**CreateProjectRequest:**

```csharp
public class CreateProjectRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
```

**ProjectResponse:**

```csharp
public class ProjectResponse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; }  // "Active", "Paused", "Completed"
    public int CompanyId { get; set; }
    public List<IssueResponse> Issues { get; set; }
}
```

### DTOs de Issue (Data/Dtos/Issue/)

**CreateIssueRequest:**

```csharp
public class CreateIssueRequest
{
    [Required]
    public int ProjectId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; }

    [MaxLength(2000)]
    public string Description { get; set; }

    public string Type { get; set; }      // "Bug", "Feature", "Task"
    public string Status { get; set; }    // "ToDo", "InProgress", "Done"
    public string Priority { get; set; }  // "Low", "Medium", "High"
    public decimal? EstimatedHours { get; set; }
    public int? AssignedUserId { get; set; }
}
```

**IssueResponse:**

```csharp
public class IssueResponse
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Type { get; set; }
    public string Status { get; set; }
    public string Priority { get; set; }
    public decimal? EstimatedHours { get; set; }
    public int? AssignedUserId { get; set; }
    public string AssignedUserName { get; set; }
    public decimal ActualHours { get; set; }
}
```

### DTOs de Tiempo (Data/Dtos/TimeEntry/)

**StartTimerRequest:**

```csharp
public class StartTimerRequest
{
    public int? IssueId { get; set; }     // Opcional: puede registrar tiempo en proyecto
    public int? ProjectId { get; set; }   // O en proyecto directamente
    public string Description { get; set; }
}
```

**CreateTimeEntryRequest:**

```csharp
public class CreateTimeEntryRequest
{
    public int? IssueId { get; set; }
    public int? ProjectId { get; set; }
    [Required]
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Description { get; set; }
}
```

**TimeEntryResponse:**

```csharp
public class TimeEntryResponse
{
    public int Id { get; set; }
    public int? IssueId { get; set; }
    public string IssueName { get; set; }
    public int? ProjectId { get; set; }
    public string ProjectName { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string Description { get; set; }
}
```

### DTOs de Reporte (Data/Dtos/Reports/)

**UserReportDto:**

```csharp
public class UserReportDto
{
    public int UserId { get; set; }
    public string UserName { get; set; }
    public decimal TotalHours { get; set; }
    public List<ProjectBreakdown> ProjectBreakdown { get; set; }
    public List<DailyBreakdown> DailyBreakdown { get; set; }
    public decimal EstimatedCost { get; set; }  // Total horas × tarifa
}

public class ProjectBreakdown
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; }
    public decimal Hours { get; set; }
}

public class DailyBreakdown
{
    public DateTime Date { get; set; }
    public decimal Hours { get; set; }
}
```

**ProjectReportDto:**

```csharp
public class ProjectReportDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; }
    public decimal TotalHours { get; set; }
    public List<UserBreakdown> UserBreakdown { get; set; }
    public List<IssueBreakdown> IssueBreakdown { get; set; }
    public decimal BudgetRemaining { get; set; }
}
```

---

## ✔️ Validadores

Utilizan **FluentValidation** para validar DTOs:

**CreateCompanyRequestValidator.cs:**

```csharp
public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
{
    public CreateCompanyRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("Máximo 200 caracteres");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("El código es requerido")
            .MaximumLength(50).WithMessage("Máximo 50 caracteres")
            .Matches(@"^[A-Z0-9]+$").WithMessage("Solo letras mayúsculas y números");
    }
}
```

**Validadores disponibles:**

- CreateCompanyRequestValidator
- CreateProjectRequestValidator
- CreateIssueRequestValidator
- CreateTimeEntryRequestValidator
- LoginRequestValidator
- RegisterUserRequestValidator

---

## 🔄 Unit of Work & Repositorio

### IUnitOfWork / UnitOfWork

Patrón **Unit of Work** para manejar transacciones:

```csharp
public interface IUnitOfWork
{
    IRepository<User> Users { get; }
    IRepository<Company> Companies { get; }
    IRepository<Project> Projects { get; }
    IRepository<Issue> Issues { get; }
    IRepository<TimeEntry> TimeEntries { get; }
    IRepository<UserCompany> UserCompanies { get; }

    Task<int> SaveChangesAsync();
    Task<bool> BeginTransactionAsync();
    Task<bool> CommitAsync();
    Task<bool> RollbackAsync();
}
```

**Implementación:**

```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IRepository<User> _users;
    private IRepository<Company> _companies;
    // ... más repositorios

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IRepository<User> Users
    {
        get { return _users ??= new Repository<User>(_context); }
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task<bool> BeginTransactionAsync()
    {
        await _context.Database.BeginTransactionAsync();
        return true;
    }

    public async Task<bool> CommitAsync()
    {
        await _context.Database.CommitTransactionAsync();
        return true;
    }

    public async Task<bool> RollbackAsync()
    {
        await _context.Database.RollbackTransactionAsync();
        return true;
    }
}
```

### IRepository<T> / Repository<T>

Repositorio genérico para operaciones CRUD:

```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
    Task<int> CountAsync();
}

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T> GetByIdAsync(int id)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
    }

    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null) _dbSet.Remove(entity);
    }

    public async Task<int> CountAsync()
    {
        return await _dbSet.CountAsync();
    }
}
```

### IUserRepository / UserRepository

Repositorio especializado para User con consultas personalizadas:

```csharp
public interface IUserRepository : IRepository<User>
{
    Task<User> GetByEmailAsync(string email);
    Task<List<UserCompany>> GetUserCompaniesAsync(int userId);
}

public class UserRepository : Repository<User>, IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<User> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<List<UserCompany>> GetUserCompaniesAsync(int userId)
    {
        return await _context.UserCompanies
            .Where(uc => uc.UserId == userId)
            .Include(uc => uc.Company)
            .ToListAsync();
    }
}
```

---

## 🔐 Seguridad & JWT

### IJwtService / JwtService

```csharp
public interface IJwtService
{
    string GenerateToken(User user, List<int> companyIds, int defaultCompanyId, UserRole role);
    ClaimsPrincipal ValidateToken(string token, bool validateLifetime = true);
    string RefreshToken(string token);
    User getUserFromToken(string token);
    string ExtractTokenFromHeader(string authorizationHeader);
}
```

**Implementación de GenerateToken:**

```csharp
public string GenerateToken(User user, List<int> companyIds, int defaultCompanyId, UserRole role)
{
    var securityKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim("CompanyIds", JsonConvert.SerializeObject(companyIds)),
        new Claim("CompanyId", defaultCompanyId.ToString()),
        new Claim(ClaimTypes.Role, role.ToString())
    };

    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(1),
        signingCredentials: credentials);

    var tokenHandler = new JwtSecurityTokenHandler();
    return tokenHandler.WriteToken(token);
}
```

**Estructura del Token:**

```
Header: { "alg": "HS256", "typ": "JWT" }

Payload: {
  "sub": "1",
  "email": "user@example.com",
  "CompanyIds": "[1, 2, 3]",
  "CompanyId": "1",
  "role": "Admin",
  "iat": 1670573000,
  "exp": 1670576600,
  "iss": "TimeTracker",
  "aud": "TimeTrackerClient"
}

Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### IPasswordHasher / PasswordHasher

Hash y verificación de contraseñas con bcrypt:

```csharp
public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        // bcrypt genera un hash + salt automáticamente
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
```

**Ejemplo:**

```csharp
// Hash
string hashedPassword = _passwordHasher.HashPassword("MyPassword123");
// Output: $2a$11$abcd...xyz  (diferente cada vez)

// Verificación
bool isValid = _passwordHasher.VerifyPassword("MyPassword123", hashedPassword);
// Output: true
```

---

## 🗄️ Base de Datos

### AppDbContext

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Issue> Issues { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<UserCompany> UserCompanies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Fluent API configuration
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Index para queries frecuentes
        modelBuilder.Entity<TimeEntry>()
            .HasIndex(te => new { te.UserId, te.CompanyId, te.StartTime });

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Company>()
            .HasIndex(c => c.Code).IsUnique();
    }
}
```

### Migraciones

```bash
# Crear migración inicial
dotnet ef migrations add InitialCreate

# Aplicar migraciones
dotnet ef database update

# Listar migraciones
dotnet ef migrations list

# Revertir última migración
dotnet ef database update (nombre-migración-anterior)
```

---

## ⚙️ Configuración

### appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "ConnectionStrings": {
    "DbConnString": "Host=localhost;Port=5432;Database=TimeTracker;Username=user;Password=password"
  },
  "Jwt": {
    "Key": "your-super-secret-key-with-minimum-32-characters-here!!!!",
    "Issuer": "TimeTracker",
    "Audience": "TimeTrackerClient",
    "ExpiresInHours": 1
  },
  "SeedDatabase": {
    "Value": "true"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200", "http://192.168.1.12:4200"]
  }
}
```

### Program.cs - Configuración Completa

```csharp
var builder = WebApplication.CreateBuilder(args);

// ===== SERVICIOS =====

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder.WithOrigins("*")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Controladores
builder.Services.AddControllers();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Base de Datos
var cnnString = builder.Configuration.GetConnectionString("DbConnString");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(cnnString));

// HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateCompanyRequestValidator>();

// ===== INYECCIÓN DE DEPENDENCIAS =====

// Seguridad
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ITenantService, TenantService>();

// Repositorio y UnitOfWork
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Servicios de Negocio
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IIssueService, IssueService>();
builder.Services.AddScoped<ITimeTrackingService, TimeTrackingService>();
builder.Services.AddScoped<IReportingService, ReportingService>();

// ===== AUTENTICACIÓN JWT =====

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

// ===== BUILD APP =====

var app = builder.Build();

// ===== SEED DATABASE (OPCIONAL) =====

string seedDatabase = builder.Configuration.GetSection("SeedDatabase:Value").Value ?? "False";
bool seedData = false;
bool.TryParse(seedDatabase, out seedData);

if (seedData)
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        dbContext.Database.EnsureCreated();
        TimeTrackerSeeder.Seed(dbContext, passwordHasher);
    }
}

// ===== MIDDLEWARE =====

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## 📝 Resumen

El Backend de TimeTracker implementa:

✅ **Arquitectura limpia** con separación de capas  
✅ **Multi-tenant** - Aislamiento de datos por empresa  
✅ **Seguridad robusta** - JWT + bcrypt  
✅ **ORM moderno** - Entity Framework Core  
✅ **Validación** - FluentValidation  
✅ **Patrón UnitOfWork** - Transacciones controladas  
✅ **API RESTful** - Completa y documentada  
✅ **Base de datos relacional** - PostgreSQL

**Stack Tecnológico:**

- .NET 7+
- PostgreSQL
- Entity Framework Core
- FluentValidation
- JWT (System.IdentityModel.Tokens.Jwt)
- bcrypt (BCrypt.Net-Next)
- AutoMapper (para mapeo de DTOs)

---

_Documentación generada: 11 de diciembre de 2025_
