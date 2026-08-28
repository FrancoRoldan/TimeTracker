# TimeTracker - Guía para Claude Code

Aplicación multi-tenant de seguimiento de tiempo. Backend: ASP.NET Core 7 + PostgreSQL. Frontend: Angular 19 + Material Design.

## Estructura del Proyecto

```
TimeTracker/
├── Backend/
│   ├── Core/               # Servicios de negocio y seguridad
│   ├── Data/               # Modelos, DTOs, Repositorios, Validadores
│   └── TimeTracker/        # API REST (Controllers, Program.cs)
└── Frontend/
    └── timeTrackerApp/     # App Angular 19
        └── src/app/        # Módulos: auth, company, project, issue, time-entry, reports, shared
```

## Backend (.NET Core)

### Modelos Principales
- **BaseEntity**: Id, CreatedAt, UpdatedAt, IsActive
- **User**: Nombre, Email, PasswordHash
- **Company**: Name, Code, Description
- **UserCompany** (M:N): UserId, CompanyId, Role (Admin/Manager/User), HourlyRate
- **Project**: Name, Description, CompanyId, Status (Active/Paused/Completed)
- **Issue**: Title, Description, ProjectId, Type (Bug/Feature/Task), Status (ToDo/InProgress/Done), Priority (Low/Medium/High), AssignedUserId
- **TimeEntry**: UserId, CompanyId, ProjectId?, IssueId?, StartTime, EndTime?, DurationMinutes, Description

### Servicios (Core/Services/)
- **UserService**: Login, Register, GetById, GetByEmail
- **CompanyService**: CRUD empresas, GetUserCompanies
- **ProjectService**: CRUD proyectos por empresa
- **IssueService**: CRUD issues por proyecto
- **TimeTrackingService**: StartTimer, StopTimer, GetEntries
- **ReportingService**: Reportes por usuario, proyecto, empresa
- **TenantService**: Extrae CompanyId del HttpContext

### Controllers (6 endpoints)
- `AuthController`: /api/auth/login, /api/auth/register, /api/auth/refresh
- `CompanyController`: /api/company (CRUD)
- `ProjectController`: /api/project (CRUD por empresa)
- `IssueController`: /api/issue (CRUD por proyecto)
- `TimeController`: /api/time (start, stop, list)
- `ReportsController`: /api/reports/{user|project|company}

### Seguridad
- **JWT**: Claims (sub=userId, email, role, companyId, companyIds[])
- **PasswordHasher**: bcrypt con salt automático
- **Multi-tenant**: Validación de CompanyId en cada request
- **CORS**: Configurado en Program.cs (wildcard en dev, restringir en prod)

### Configuración (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DbConnString": "Host=localhost;Database=TimeTracker;Username=...;Password=..."
  },
  "Jwt": {
    "Key": "clave-secreta-256-bits",
    "Issuer": "TimeTrackerApi",
    "Audience": "TimeTrackerApp",
    "DurationInMinutes": 60
  },
  "SeedDatabase": {
    "Value": "false"
  }
}
```

### Patrones
- **Unit of Work**: `IUnitOfWork` centraliza transacciones
- **Repository**: `IRepository<T>` genérico + específicos
- **Result Pattern**: `Result<T>` con IsSuccess, Data, Error

## Frontend (Angular 19)

### Configuración
- **Environment**: `environment.development.ts` → `baseUrl: "http://localhost:5083/api"`
- **Standalone Components**: Sin módulos NgModule
- **Material Design 3**: Temas (azul, pink, green, ocre, violet, orange) + modo oscuro
- **Lazy Loading**: Rutas con `loadChildren`

### Módulos Principales
- **auth**: Login, Register (rutas: /auth/login, /auth/register)
- **company**: Gestión empresas (CRUD, selección de empresa activa)
- **project**: Gestión proyectos (CRUD, estados)
- **issue**: Gestión issues/tareas (CRUD, tipos, prioridades)
- **time-entry**: Cronómetro, registros manuales
- **reports**: Reportes y gráficos (Chart.js)
- **shared**: Layout, sidebars, theme-switcher, dialogs

### Servicios Clave
- **AuthService**: Login, register, refresh token, localStorage (token, user, companies)
- **CompanyService**: CRUD, BehaviorSubject para empresa seleccionada
- **ProjectService/IssueService/TimeEntryService**: CRUD respectivos
- **ReportsService**: Fetch reportes por tipo y rango de fechas

### Guards
- **LogindGuard** (`canActivate`): Verifica token, redirige a /auth si no existe
- **IsAuthenticatedGuard**: Bloquea /auth si ya está autenticado

### Interceptores
- **LoginInterceptor**:
  - Agrega `Authorization: Bearer {token}` y `X-Company-Id` a requests
  - Maneja 401: refresca token automáticamente
  - Excluye: /login, /refresh

### Rutas Protegidas
```
/ → LayoutComponent (con sidebars)
  ├── /dashboard
  ├── /company
  ├── /project
  ├── /issue
  ├── /time-entry
  └── /reports
/auth → LayoutLogin
  ├── /login
  └── /register
```

### Temas (public/themes/)
- Variables CSS M3: `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-tertiary-container`
- Temas: azul (default), pink, green, ocre, violet, orange
- Dark mode: `.dark-theme` class en `<body>`
- Persistencia: localStorage `"theme"`, `"dark-mode"`

### Patrones CSS
```css
/* Usar siempre variables M3 para colores */
background-color: var(--mat-sys-surface);
color: var(--mat-sys-on-surface);

/* Excepción: Status colors hardcoded */
color: #4caf50; /* Success */
color: #f44336; /* Error */
```

## Flujos Clave

### 1. Login
```
1. Usuario ingresa email/password
2. POST /api/auth/login
3. Backend valida bcrypt
4. Backend genera JWT con claims
5. Frontend guarda: localStorage['token'], ['user'], ['companies']
6. Redirige a /dashboard
```

### 2. Multi-Tenant
```
1. Usuario selecciona empresa del dropdown
2. localStorage['selectedCompany'] = company
3. LoginInterceptor agrega X-Company-Id a headers
4. Backend valida usuario pertenece a empresa
5. Datos filtrados por CompanyId
```

### 3. Seguimiento de Tiempo
```
1. Click "Start Timer" → Modal selecciona Issue/Proyecto
2. POST /api/time/start → TimeEntry (startTime=now, endTime=null)
3. Frontend: intervalo cada 1s actualiza display (HH:MM:SS)
4. Click "Stop" → PUT /api/time/stop/{id}
5. Backend: endTime=now, calcula DurationMinutes
6. Frontend actualiza lista
```

### 4. Reportes
```
1. Usuario selecciona tipo (User/Project/Company) y fechas
2. GET /api/reports/{tipo}?startDate=X&endDate=Y
3. Backend agrega TimeEntries, calcula totales y costos
4. Frontend renderiza gráficos (Chart.js: línea, barras, pie, dona)
```

## Comandos Comunes

### Docker Compose (Recomendado)
```bash
# Iniciar toda la aplicación
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Backup de BD
docker-compose exec postgres pg_dump -U timetracker_user TimeTracker > backup.sql
```

**Servicios disponibles:**
- Frontend: http://localhost:4200
- Backend: http://localhost:5083
- PostgreSQL: localhost:5432

**Archivos de configuración:**
- `docker-compose.yml`: Definición de servicios
- `.env`: Variables de entorno (crear desde `.env.example`)
- `Backend/Dockerfile`: Build del backend
- `Frontend/Dockerfile`: Build del frontend con Nginx

### Backend (Local)
```bash
cd Backend/TimeTracker
dotnet restore
dotnet run  # API en http://localhost:5083

# Migraciones
cd ../Data
dotnet ef database update
```

### Frontend (Local)
```bash
cd Frontend/timeTrackerApp
npm install
ng serve  # App en http://localhost:4200
ng build --configuration production
```

### Database (Manual)
```sql
-- PostgreSQL
CREATE DATABASE TimeTracker;
CREATE USER timetracker_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE TimeTracker TO timetracker_user;
```

## Credenciales de Prueba (si SeedDatabase=true)
- `admin@example.com` / `Admin123456` (Admin)
- `manager@example.com` / `Manager123456` (Manager)
- `user@example.com` / `User123456` (User)

## Validación

### Backend (FluentValidation)
```csharp
// Data/Validators/
RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
```

### Frontend (Reactive Forms)
```typescript
this.form = this.fb.group({
  name: ['', [Validators.required, Validators.maxLength(200)]]
});
```

## Convenciones

### Backend
- Servicios retornan `Result<T>` con IsSuccess/Error
- DTOs separados: Request (Create, Update), Response
- Validadores FluentValidation para cada DTO
- Async/await en todos los métodos

### Frontend
- Componentes standalone con `inject()`
- `ChangeDetectionStrategy.OnPush` para performance
- BehaviorSubject para state management
- Observables con async pipe
- Control flow: `@if`, `@for`, `@else` (Angular 17+)

### CSS
- Mobile-first: breakpoint 768px
- Spacing: 8px, 12px, 16px, 20px, 40px
- Border-radius: 4px (containers), 8px (buttons)
- Variables M3 para todos los colores (excepto status)

## Referencias Rápidas

### Ubicaciones Importantes
- Configuración Backend: `Backend/TimeTracker/Program.cs`
- Configuración BD: `Backend/Data/Context/AppDbContext.cs`
- Configuración Frontend: `Frontend/timeTrackerApp/src/app/app.config.ts`
- Rutas Frontend: `Frontend/timeTrackerApp/src/app/app.routes.ts`
- Environment: `Frontend/timeTrackerApp/src/environments/`
- Temas: `Frontend/timeTrackerApp/public/themes/`

### Documentación Detallada
- `README.md`: Documentación principal con Quick Start
- `DOCKER.md`: Guía completa de Docker y Docker Compose
- `GUIA_RAPIDA.md`: Setup y troubleshooting
- `DOCUMENTACION_BACKEND.md`: Backend exhaustivo
- `DOCUMENTACION_FRONTEND.md`: Frontend exhaustivo
- `DOCUMENTACION_COMPLETA.md`: Visión general completa
- `RESUMEN_TECNICO_EJECUTIVO.md`: Decisiones arquitectónicas
- `INSTRUCCIONES_DESPLIEGUE.md`: Deploy y Docker
- `PLAN_OBSERVABILIDAD.md`: Plan de observabilidad, telemetría, métricas y auditoría (v0.1, propuesta — nada implementado aún)

## Limitaciones Actuales
- ❌ Sin paginación en listados
- ❌ Sin caché (todo desde BD)
- ✅ Tests unitarios: 90 en `Backend/TimeTracker.Tests` (`dotnet test`)
- ✅ CORS restringido vía `Cors:AllowedOrigins`; en `Production` la API no arranca si está vacío
- ❌ Sin observabilidad: ni logging estructurado, ni métricas, ni trazas (ver `PLAN_OBSERVABILIDAD.md`)
- ❌ Sin SignalR (tiempo real)
- ❌ Sin PWA
- ❌ Sin export Excel/PDF

## Notas de Desarrollo
- PostgreSQL usa comillas dobles para nombres de columnas
- JWT expira en 1 hora (configurable)
- Multi-tenant via UserCompany (M:N)
- TimeEntry puede tener ProjectId O IssueId (ambos opcionales)
- Empresa seleccionada persiste en localStorage
- Refresh token automático en 401
