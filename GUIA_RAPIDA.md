# Guía Rápida - TimeTracker

## 🚀 Inicio Rápido

### Requisitos Previos

**Backend:**

```bash
# Instalar .NET SDK 7+
# Instalar PostgreSQL 12+
```

**Frontend:**

```bash
# Instalar Node.js 18+
npm install -g @angular/cli@19
```

### Configuración Local en 5 Minutos

#### 1. Base de Datos

```bash
# En PostgreSQL (psql)
CREATE DATABASE TimeTracker;
CREATE USER timetracker_user WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE TimeTracker TO timetracker_user;
```

#### 2. Backend

```bash
cd Backend/TimeTracker

# Editar appsettings.json
# Cambiar: DbConnString y Jwt:Key

# Ejecutar migraciones
cd ../Data
dotnet ef database update

# Correr API
cd ../TimeTracker
dotnet run
# API en: http://localhost:5083
```

#### 3. Frontend

```bash
cd Frontend/timeTrackerApp

# Instalar dependencias
npm install

# Configurar environment.development.ts
# Cambiar: baseUrl = "http://localhost:5083/api"

# Correr servidor
ng serve
# App en: http://localhost:4200
```

### Credenciales de Prueba

Si ejecutas con `SeedDatabase.Value = "true"`:

```
Email: admin@example.com
Password: Admin123456

Email: manager@example.com
Password: Manager123456

Email: user@example.com
Password: User123456
```

---

## 📊 Flujos Principales

### 1. Registro e Inicio de Sesión

```
Usuario abre la app
    ↓
Redirige a /auth/login
    ↓
Usuario ingresa email y contraseña
    ↓
POST /api/auth/login
    ↓
Backend valida contra BD
    ↓
Backend genera JWT con claims
    ↓
Frontend guarda token en localStorage
    ↓
Redirige a /dashboard
```

**Archivo clave:** `auth.service.ts`

### 2. Seleccionar Empresa (Multi-Tenant)

```
Usuario logueado
    ↓
LayoutComponent carga empresas
    ↓
GET /api/company
    ↓
Muestra lista de empresas
    ↓
Usuario selecciona empresa
    ↓
localStorage['selectedCompany'] = company
    ↓
Todas las solicitudes HTTP usan empresa
    (Header: X-Company-Id)
```

**Archivo clave:** `company.service.ts`

### 3. Seguimiento de Tiempo

```
Usuario hace click en "Start Timer"
    ↓
Abre modal StartTimerModalComponent
    ↓
Usuario selecciona Issue o Proyecto
    ↓
POST /api/time/start
    ↓
Crea TimeEntry con StartTime
    ↓
Cronómetro comienza a correr
    ↓
Usuario hace click en "Stop"
    ↓
POST /api/time/stop/{id}
    ↓
Actualiza TimeEntry con EndTime
    ↓
Calcula DurationMinutes
```

**Archivos clave:**

- `time-entry.service.ts`
- `time-tracker.component.ts`

### 4. Reportes

```
Usuario va a /reports
    ↓
Selecciona tipo de reporte:
- Por usuario
- Por proyecto
- Por empresa
    ↓
Selecciona rango de fechas
    ↓
GET /api/reports/{tipo}?startDate=X&endDate=Y
    ↓
Backend agrega TimeEntries
    ↓
Calcula:
- Total de horas
- Horas por proyecto/usuario
- Costo (horas × tarifa)
    ↓
Frontend renderiza gráficos (Chart.js)
```

**Archivos clave:**

- `reports.service.ts`
- `user-report.component.ts`
- `project-report.component.ts`

---

## 🗂️ Estructura de Carpetas (Resumen)

```
Backend/
├── Core/
│   ├── Services/      ← Lógica de negocio
│   └── Security/      ← JWT, Hash
│
└── Data/
    ├── Models/        ← Entidades
    ├── Dtos/          ← Transfer Objects
    └── Repositorys/   ← Acceso a datos

Frontend/
├── app/
│   ├── auth/          ← Login, Register
│   ├── company/       ← Gestión empresas
│   ├── project/       ← Gestión proyectos
│   ├── issue/         ← Gestión issues
│   ├── time-entry/    ← Cronómetro
│   ├── reports/       ← Reportes y gráficos
│   └── shared/        ← Componentes comunes
```

---

## 🔐 Seguridad - Conceptos Clave

### JWT (JSON Web Token)

**Token almacenado en localStorage:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Claims dentro del token:**

- `sub`: ID del usuario
- `email`: Email del usuario
- `role`: Rol (Admin, Manager, User)
- `companyId`: Empresa actual
- `companyIds`: Lista de empresas

**Validez:** 1 hora (configurable en `Program.cs`)

### Interceptor de Login

**Automáticamente agrega headers a cada solicitud:**

```
Authorization: Bearer {token}
X-Company-Id: {companyId}
```

**Si token expira (401):**

1. Llama a `POST /api/auth/refresh`
2. Obtiene nuevo token
3. Reintenta solicitud original

### Validación Multi-Tenant

**Backend valida:**

- Usuario pertenece a empresa
- Usuario tiene permiso en empresa
- Filtra datos por empresa

**Frontend valida:**

- Guard protege rutas autenticadas
- Selecciona empresa antes de usar app

---

## 🛠️ Tareas Comunes

### Agregar Nueva Funcionalidad (Ej: Nueva Entidad)

#### Backend (5 pasos):

1. **Crear Modelo** (Data/Models/MyEntity.cs):

```csharp
public class MyEntity : BaseEntity
{
    public string Name { get; set; }
}
```

2. **Crear DTO** (Data/Dtos/MyEntity/):

```csharp
public class CreateMyEntityRequest
{
    public string Name { get; set; }
}
```

3. **Crear Servicio** (Core/Services/MyEntity/):

```csharp
public interface IMyEntityService
{
    Task<Result<MyEntityResponse>> CreateAsync(CreateMyEntityRequest request);
}
```

4. **Crear Controlador** (Controllers/MyEntityController.cs):

```csharp
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MyEntityController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMyEntityRequest request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(result);
    }
}
```

5. **Registrar en DI** (Program.cs):

```csharp
builder.Services.AddScoped<IMyEntityService, MyEntityService>();
```

#### Frontend (5 pasos):

1. **Crear Servicio** (app/my-entity/services/):

```typescript
@Injectable({ providedIn: "root" })
export class MyEntityService {
  getMyEntities(): Observable<MyEntity[]> {
    return this.http.get<MyEntity[]>(`${this.urlApi}/my-entity`);
  }
}
```

2. **Crear Interfaz** (app/my-entity/interfaces/):

```typescript
export interface MyEntity {
  id: number;
  name: string;
}
```

3. **Crear Componente** (app/my-entity/components/):

```typescript
@Component({...})
export class MyEntityListComponent implements OnInit {
  myEntities$: Observable<MyEntity[]>;

  ngOnInit() {
    this.myEntities$ = this.service.getMyEntities();
  }
}
```

4. **Crear Rutas** (app/my-entity/my-entity.routes.ts):

```typescript
export const routes: Routes = [{ path: "", component: MyEntityListComponent }];
```

5. **Agregar a Rutas Principales** (app.routes.ts):

```typescript
{
  path: 'my-entity',
  loadChildren: () => import('./my-entity/my-entity.routes')
}
```

### Agregar Validación

**Backend (FluentValidation):**

```csharp
public class CreateMyEntityValidator : AbstractValidator<CreateMyEntityRequest>
{
    public CreateMyEntityValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre es requerido")
            .MaximumLength(200).WithMessage("Máximo 200 caracteres");
    }
}
```

**Frontend (Reactive Forms):**

```typescript
this.form = this.fb.group({
  name: ["", [Validators.required, Validators.maxLength(200)]],
});
```

### Manejar Errores

**Backend:**

```csharp
public Result<T> Failed(string error)
{
    return new Result<T> { IsSuccess = false, Error = error };
}
```

**Frontend:**

```typescript
this.service.create(data).subscribe(
  (success) => this.toastService.success("Creado"),
  (error) => this.toastService.error(error.error.error)
);
```

---

## 📊 Base de Datos - Consultas Útiles

```sql
-- Listar usuarios por empresa
SELECT u.nombre, u.email, uc.role
FROM "User" u
JOIN "UserCompany" uc ON u.id = uc."UserId"
WHERE uc."CompanyId" = 1;

-- Total de horas por proyecto
SELECT p.name, SUM(EXTRACT(EPOCH FROM (te."EndTime" - te."StartTime"))/3600) as total_hours
FROM "TimeEntry" te
JOIN "Project" p ON te."ProjectId" = p.id
GROUP BY p.id, p.name;

-- Issues pendientes
SELECT i.title, i.priority, i.status
FROM "Issue" i
WHERE i.status != 'Done'
ORDER BY i.priority DESC;

-- Registros de tiempo de hoy
SELECT u.nombre, te."StartTime", te."EndTime",
       EXTRACT(EPOCH FROM (te."EndTime" - te."StartTime"))/3600 as hours
FROM "TimeEntry" te
JOIN "User" u ON te."UserId" = u.id
WHERE DATE(te."StartTime") = CURRENT_DATE
ORDER BY te."StartTime";
```

---

## 🔍 Debugging

### Backend

**Habilitar logs:**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft": "Warning"
    }
  }
}
```

**Breakpoints en Visual Studio:**

- F10: Step over
- F11: Step into
- Shift+F11: Step out
- F5: Continuar

### Frontend

**Chrome DevTools:**

- F12: Abrir DevTools
- Network: Ver solicitudes HTTP
- Application: Ver localStorage
- Console: Ver logs

**Angular DevTools:**

- Instalar extensión de Chrome
- Ver estado de componentes
- Inspeccionar observables

---

## 📚 Recursos Útiles

### Documentación Oficial

- [Angular 19 Docs](https://angular.io/docs)
- [.NET 7 Docs](https://learn.microsoft.com/en-us/dotnet/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)

### Librerías Usadas

- [Material Design](https://material.angular.io/)
- [Chart.js](https://www.chartjs.org/)
- [RxJS](https://rxjs.dev/)
- [Moment.js](https://momentjs.com/)

---

## ✅ Checklist de Despliegue

### Backend

- [ ] Cambiar JWT:Key por valor seguro en appsettings.json
- [ ] Configurar ConnectionString correcta
- [ ] Cambiar CORS origins permitidos
- [ ] Habilitar HTTPS en producción
- [ ] Configurar logging adecuado
- [ ] Ejecutar migraciones en BD producción
- [ ] Cambiar SeedDatabase a false
- [ ] Build en modo Release
- [ ] Probar endpoints con Swagger

### Frontend

- [ ] Cambiar environment.ts con URL de API correcta
- [ ] Cambiar baseUrl a HTTPS
- [ ] Build producción: `ng build --configuration production`
- [ ] Comprimir assets (gzip)
- [ ] Minificar CSS y JS
- [ ] Ejecutar tests
- [ ] Verificar accesibilidad
- [ ] Probar en navegadores soportados

---

## 🆘 Troubleshooting

### "Token inválido"

→ Borrar localStorage, hacer login nuevamente
→ Verificar JWT:Key en appsettings.json

### "CORS error"

→ Verificar appsettings.json CORS origins
→ Revisar LoginInterceptor en frontend

### "401 Unauthorized"

→ Token expirado, refrescar automáticamente
→ Verificar Authorization header
→ Revisar permisos de usuario

### "Database connection error"

→ Verificar PostgreSQL está ejecutándose
→ Validar connection string
→ Revisar usuario/contraseña de BD

### "Port 5083 en uso"

→ Cambiar puerto en launchSettings.json
→ O matar proceso: `netstat -ano | findstr :5083`

---

## 📞 Soporte

**Para reportar bugs o pedir mejoras:**

1. Documentar el problema detalladamente
2. Incluir logs y screenshots
3. Listar pasos para reproducir
4. Indicar versión del navegador/SO

---

## 🎯 Próximos Pasos Recomendados

1. **Entender la arquitectura completa**

   - Leer DOCUMENTACION_COMPLETA.md

2. **Profundizar en Backend**

   - Leer DOCUMENTACION_BACKEND.md
   - Explorar Unit Tests

3. **Profundizar en Frontend**

   - Leer DOCUMENTACION_FRONTEND.md
   - Explorar routing y lazy-loading

4. **Configurar CI/CD**

   - GitHub Actions para tests
   - Deploy automático a servidor

5. **Optimización**

   - Caché de requests
   - Paginación en listas
   - Virtual scrolling para grandes listas

6. **Seguridad adicional**
   - Rate limiting en API
   - CSRF protection
   - Validación en servidor (actualmente básica)

---

**Última actualización:** 11 de diciembre de 2025

¡Feliz desarrollo! 🚀
