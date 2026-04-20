# API Integration — TimeTracker Flutter

## Configuración Base

```
Base URL: http://localhost:5083/api
Health:   GET /health  → { status: "healthy", timestamp: "..." }
```

En producción, cambiar la URL en `lib/core/constants/api_constants.dart`.

---

## Autenticación

### JWT — Estructura de Claims

```json
{
  "sub": "<userId>",
  "email": "<userEmail>",
  "CompanyId": "<defaultCompanyId>",
  "CompanyIds": "<comma-separated-ids>",
  "role": "<UserRole>"
}
```

### Headers requeridos

```
Authorization: Bearer <token>       ← Todas las rutas protegidas
X-Company-Id: <companyId>           ← Todas las rutas (multi-tenant)
```

El `AuthInterceptor` agrega automáticamente ambos headers via Dio.

### Refresh Token

- Al recibir **401**, el interceptor llama `POST /auth/refresh` con el token actual
- Si el refresh es exitoso, reintenta la request original con el nuevo token
- Si el refresh falla, limpia el storage y redirige a `/auth/login`

---

## Endpoints Completos

### AUTH — `/api/auth`

| Método | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/auth/register` | No | `RegisterRequest` | `LoginResponse` |
| POST | `/auth/login` | No | `LoginRequest` | `LoginResponse` |
| POST | `/auth/refresh` | Sí | — | `{ token: string }` |

**LoginRequest**
```json
{ "email": "string", "password": "string", "companyId": 0 }
```

**LoginResponse**
```json
{
  "token": "string",
  "user": { "id": 1, "name": "string", "email": "string" },
  "companies": [
    { "companyId": 1, "companyName": "string", "companyCode": "string", "role": "string" }
  ],
  "selectedCompanyId": 1
}
```

**RegisterRequest**
```json
{
  "name": "string", "email": "string", "password": "string",
  "companyId": 1, "role": "3", "hourlyRate": 0.0
}
```

---

### USERS — `/api/users`

| Método | Endpoint | Auth | Roles | Request | Response |
|--------|----------|------|-------|---------|----------|
| GET | `/users/profile/{id}` | Sí | — | — | `UserProfileResponse` |
| PUT | `/users/update` | Sí | — | `UpdateUserRequest` | `{ message, user }` |
| PUT | `/users/update-password` | Sí | — | `UpdatePasswordRequest` | `{ message }` |
| PUT | `/users/reset-password` | Sí | Admin | `ResetPasswordRequest` | `{ message }` |

**UpdateUserRequest**
```json
{ "id": 1, "nombre": "string", "email": "string", "usuarioActualizacion": "string" }
```

**UpdatePasswordRequest**
```json
{ "oldPassword": "string", "newPassword": "string", "confirmPassword": "string" }
```

---

### COMPANIES — `/api/company`

| Método | Endpoint | Auth | Roles | Request | Response |
|--------|----------|------|-------|---------|----------|
| GET | `/company` | Sí | — | — | `List<CompanyResponse>` |
| GET | `/company/{id}` | Sí | — | — | `CompanyResponse` |
| POST | `/company` | Sí | Admin, Manager | `CreateCompanyRequest` | `CompanyResponse` |
| PUT | `/company/{id}` | Sí | Admin | `UpdateCompanyRequest` | `CompanyResponse` |
| DELETE | `/company/{id}` | Sí | Admin | — | `{ message }` |
| GET | `/company/{id}/users` | Sí | — | — | `List<CompanyUserResponse>` |
| GET | `/company/{id}/users/available` | Sí | — | — | `List<AvailableUserResponse>` |
| POST | `/company/{id}/users` | Sí | — | `AddUserRequest` | `{ message }` |
| POST | `/company/{id}/users/create` | Sí | — | `CreateAndAddUserRequest` | `{ message }` |
| DELETE | `/company/{companyId}/users/{userId}` | Sí | — | — | `{ message }` |
| PUT | `/company/{companyId}/users/{userId}` | Sí | Admin | `UpdateUserInCompanyRequest` | `{ message }` |
| POST | `/company/join` | Sí | — | `JoinCompanyRequest` | `JoinCompanyResponse` |

**CompanyResponse**
```json
{ "id": 1, "name": "string", "code": "string", "isActive": true, "createdAt": "2024-01-01T00:00:00" }
```

**CompanyUserResponse**
```json
{
  "userId": 1, "userName": "string", "userEmail": "string",
  "role": "string", "hourlyRate": 50.0, "joinedAt": "2024-01-01T00:00:00"
}
```

---

### PROJECTS — `/api/project`

| Método | Endpoint | Auth | Roles | Request | Response |
|--------|----------|------|-------|---------|----------|
| GET | `/project?companyId={id}` | Sí | — | Query: companyId? | `List<ProjectResponse>` |
| GET | `/project/{id}` | Sí | — | — | `ProjectResponse` |
| POST | `/project` | Sí | Admin, Manager | `CreateProjectRequest` | `ProjectResponse` |
| PUT | `/project/{id}` | Sí | Admin, Manager | `UpdateProjectRequest` | `ProjectResponse` |
| PUT | `/project/{id}/status` | Sí | Admin, Manager | `ProjectStatus (int)` | `{ message }` |
| DELETE | `/project/{id}` | Sí | Admin, Manager | — | `{ message }` |

**ProjectResponse**
```json
{
  "id": 1, "companyId": 1, "companyName": "string", "name": "string",
  "startDate": "2024-01-01", "endDate": null,
  "status": 0, "issueCount": 5, "createdAt": "2024-01-01T00:00:00"
}
```

**ProjectStatus enum**: Active=0, OnHold=1, Closed=2

---

### ISSUES — `/api/issue`

| Método | Endpoint | Auth | Roles | Request | Response |
|--------|----------|------|-------|---------|----------|
| GET | `/issue/project/{projectId}` | Sí | — | — | `List<IssueResponse>` |
| GET | `/issue/{id}` | Sí | — | — | `IssueResponse` |
| GET | `/issue/assigned-to-me?companyId={id}` | Sí | — | Query: companyId? | `List<IssueResponse>` |
| GET | `/issue/my-companies?status={}&type={}&priority={}&companyId={}` | Sí | — | Query (opcionales) | `List<IssueResponse>` |
| POST | `/issue` | Sí | Admin, Manager, Developer | `CreateIssueRequest` | `IssueResponse` |
| PUT | `/issue/{id}` | Sí | Admin, Manager, Developer | `UpdateIssueRequest` | `IssueResponse` |
| PUT | `/issue/{id}/status` | Sí | Admin, Manager, Developer | `IssueStatus (int)` | `IssueResponse` |
| PUT | `/issue/{id}/assign` | Sí | Admin, Manager, Developer | `userId (int)` | `IssueResponse` |
| DELETE | `/issue/{id}` | Sí | Admin, Manager, Developer | — | `{ message }` |

**IssueResponse**
```json
{
  "id": 1, "projectId": 1, "projectName": "string",
  "title": "string", "description": "string",
  "type": 1, "status": 1, "priority": 2,
  "estimatedHours": 8.0,
  "assignedUserId": 1, "assignedUserName": "string",
  "createdAt": "2024-01-01T00:00:00", "updatedAt": "2024-01-01T00:00:00"
}
```

**IssueStatus**: ToDo=1, InProgress=2, Testing=3, Done=4  
**IssueType**: UserStory=1, Bug=2, Task=3  
**IssuePriority**: Low=1, Medium=2, High=3, Critical=4

---

### TIME ENTRIES — `/api/time`

| Método | Endpoint | Auth | Roles | Request | Response |
|--------|----------|------|-------|---------|----------|
| POST | `/time/start` | Sí | Admin, Manager, Developer | `StartTimerRequest` | `TimeEntryResponse` |
| POST | `/time/stop` | Sí | Admin, Manager, Developer | — | `TimeEntryResponse` |
| GET | `/time/active` | Sí | — | — | `TimeEntryResponse` |
| POST | `/time/manual` | Sí | Admin, Manager, Developer | `AddManualEntryRequest` | `TimeEntryResponse` |
| GET | `/time/entries?dateFrom={}&dateTo={}&projectId={}&issueId={}` | Sí | — | Query (opcionales) | `List<TimeEntryResponse>` |
| GET | `/time/entries/paginated?pageNumber={}&pageSize={}&...` | Sí | — | Query (opcionales) | `PaginatedResult<TimeEntryResponse>` |
| GET | `/time/entries/{id}` | Sí | — | — | `TimeEntryResponse` |
| PUT | `/time/entries/{id}` | Sí | Admin, Manager, Developer | `UpdateTimeEntryRequest` | `TimeEntryResponse` |
| DELETE | `/time/entries/{id}` | Sí | Admin, Manager, Developer | — | `{ message }` |

**TimeEntryResponse**
```json
{
  "id": 1, "projectId": 1, "projectName": "string",
  "issueId": 1, "issueTitle": "string",
  "userId": 1, "userName": "string",
  "startTime": "2024-01-01T09:00:00", "endTime": "2024-01-01T10:30:00",
  "durationMinutes": 90, "description": "string"
}
```

**StartTimerRequest**
```json
{ "issueId": 1, "projectId": 1, "description": "string" }
```

**PaginatedResult**
```json
{
  "items": [], "pageNumber": 1, "pageSize": 20,
  "totalCount": 100, "totalPages": 5,
  "hasNextPage": true, "hasPreviousPage": false
}
```

---

### REPORTS — `/api/reports`

| Método | Endpoint | Auth | Roles | Response |
|--------|----------|------|-------|----------|
| GET | `/reports/user?dateFrom={}&dateTo={}&projectId={}&issueId={}` | Sí | — | `UserReportResponse` |
| GET | `/reports/user/{userId}?...` | Sí | Admin, Manager | `UserReportResponse` |
| GET | `/reports/project/{projectId}?dateFrom={}&dateTo={}` | Sí | — | `ProjectReportResponse` |
| GET | `/reports/company/{companyId}?dateFrom={}&dateTo={}` | Sí | Admin, Manager | `CompanyReportResponse` |

**UserReportResponse**
```json
{
  "userId": 1, "userName": "string",
  "totalHours": 40.5, "totalMinutes": 2430,
  "dateFrom": "2024-01-01", "dateTo": "2024-01-31",
  "dailyBreakdown": [{ "date": "2024-01-01", "hours": 8.0, "minutes": 480 }],
  "projectBreakdown": [{ "projectId": 1, "projectName": "string", "hours": 20.0 }],
  "issueBreakdown": [{ "issueId": 1, "issueTitle": "string", "hours": 5.0 }],
  "issueTypeBreakdown": [{ "type": "Bug", "hours": 10.0 }]
}
```

---

## Manejo de Errores HTTP

| Código | Significado | Acción Flutter |
|--------|-------------|----------------|
| 400 | Validación fallida | Mostrar mensaje del body |
| 401 | No autenticado | Refresh token → si falla, logout |
| 403 | Sin permisos | Mostrar SnackBar de error |
| 404 | No encontrado | Mostrar mensaje o navegar atrás |
| 500 | Error del servidor | Mostrar mensaje genérico |

El `ApiClient` centraliza este manejo y lanza excepciones tipadas que el Repository captura.
