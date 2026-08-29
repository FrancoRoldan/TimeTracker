# Plan de Observabilidad, Telemetría y Métricas — TimeTracker

**Versión:** 0.1
**Estado:** Borrador inicial
**Aplicaciones cubiertas:** `timetracker-api` (ASP.NET Core, net8.0) y `timetracker-web` (Angular 19)
**Fecha:** 2026-08-28

> Este documento es la adaptación del *Plan Inicial de Observabilidad, Telemetría y Métricas v0.1* (marco general) al caso concreto de TimeTracker.
>
> **Estado de ejecución (2026-08-28):**
>
> - **Fase 0** (prerrequisitos de código, §30) — completada. Cerró A1, A2, A3, A4, A8 y A10. Ver [Anexo B](#anexo-b--registro-de-la-fase-0-ejecutada).
> - **Fase 2** (instrumentación del backend) — completada. La API emite logs estructurados con `traceId`, trazas y métricas por OpenTelemetry, y tiene health checks reales. Cerró A5, A6 y A7. Ver [Anexo C](#anexo-c--registro-de-la-fase-2-ejecutada).
> - **Fase 3** (frontend/RUM) — completada. El navegador reporta errores, Web Vitals y eventos a `POST /api/telemetry`, y propaga `traceparent`, con lo que la traza empieza en el clic del usuario. Cerró A11–A16. Ver [Anexo E](#anexo-e--registro-de-la-fase-3-ejecutada).
> - **Fase 4** (plataforma) — completada. Collector, Tempo, Loki, Promtail, Prometheus y Grafana viven en el perfil `observability` del `docker-compose.yml`, con datasources y dashboards versionados. Ver [Anexo F](#anexo-f--registro-de-las-fases-4-y-5-ejecutadas).
> - **Fase 5** (auditoría) — completada. Tabla `AuditLogs` escrita por un interceptor de EF Core, correlacionada con trazas y logs por `TraceId`, y su propio dashboard. Ver [Anexo F](#anexo-f--registro-de-las-fases-4-y-5-ejecutadas).
> - **Fase 6** (analytics) — completada. El catálogo de eventos de §23 está instrumentado y permite reconstruir qué venía haciendo el usuario antes de un error. Ver [Anexo G](#anexo-g--registro-de-la-fase-6-ejecutada).
> - **Fase 7** (SLOs, alertas y runbooks) — pendiente.
>
> El resto del documento sigue siendo *propuesta*, salvo lo marcado como **Estado actual**. El [Anexo A](#anexo-a--deuda-técnica-que-bloquea-la-observabilidad) lista la deuda pendiente.

---

## 1. Objetivo

Establecer una estrategia unificada para monitorear TimeTracker en sus tres capas: SPA Angular, API .NET y PostgreSQL.

El objetivo no es solamente detectar que la aplicación falló, sino poder responder:

1. ¿Está funcionando correctamente?
2. ¿Está funcionando lentamente?
3. ¿Qué componente está causando el problema?
4. ¿Qué usuarios o **empresas (tenants)** están afectados?
5. ¿Qué ocurrió antes y después del problema?
6. ¿Qué cambio produjo la degradación?
7. ¿Cuál fue el impacto de negocio?

Traducido al dominio de esta aplicación, deberá poder responderse:

```text
¿Por qué el timer de un usuario quedó abierto 14 horas?
¿Por qué GET /api/reports/company/{id} tarda 8 segundos para la empresa X?
¿Quién eliminó el TimeEntry 4821 y con qué valores previos?
¿Un usuario está viendo datos de una empresa a la que no pertenece?
¿La lentitud de esta mañana afectó a todas las empresas o a una sola?
¿El deploy de anoche subió la tasa de 500 en /api/time/start?
```

---

## 2. Alcance

### 2.1 Dentro del alcance

**Backend**

```text
TimeTracker.Api        ASP.NET Core, net8.0, minimal hosting
Core                   Servicios de negocio (Result<T>)
Data                   EF Core 9 + Npgsql, UnitOfWork, Repository
PostgreSQL 16          Única dependencia de datos
```

**Frontend**

```text
timetracker-web        Angular 19.0.3, standalone components, zone-based
                       Material 19, Chart.js 4 + ng2-charts
                       SPA servida por Nginx en producción
```

**Infraestructura**

```text
Docker Compose         postgres / backend / frontend
Nginx                  Sirve el bundle Angular
Linux (contenedores)
```

### 2.2 Fuera del alcance en esta versión

El marco general contempla componentes que **no existen en TimeTracker**. Se declaran explícitamente fuera de alcance para no planificar sobre supuestos:

```text
Kubernetes             No se usa; solo Docker Compose
SQL Server             No se usa; el motor es PostgreSQL
Message brokers        No existen
Workers / background   No existen servicios de fondo
Servicios Windows      No aplica
IIS                    No aplica
React / Blazor         No aplica
APIs externas          La API no realiza llamadas HTTP salientes
```

### 2.3 Candidatos futuros

```text
Redis                  El paquete Microsoft.Extensions.Caching.StackExchangeRedis
                       ya está referenciado en Backend/Data/Data.csproj, pero NO
                       está registrado en DI ni existe el servicio en compose.
                       Si se activa, deberá instrumentarse como dependencia.

PWA / Service Worker   No hay @angular/service-worker ni ngsw-config.json.
                       Si se agrega, habilita métricas offline/online y
                       obliga a revisar idempotencia (§14).

Kubernetes             Si se migra desde Compose, aplicar §10.3.
```

---

## 3. Principios

### 3.1 Observabilidad no es solamente logging

Se utilizarán cuatro pilares principales:

```text
Logs
Metrics
Traces
Events
```

Complementados con:

```text
Audit
Analytics
RUM
```

Cada uno tendrá una finalidad específica y no deberán mezclarse: la auditoría no es un log, y analytics no es una métrica de negocio.

---

## 4. Clasificación de la información

### 4.1 Logs

Responder:

> ¿Qué ocurrió?

Ejemplos aplicados a TimeTracker:

```text
ERROR  Npgsql timeout ejecutando ReportingService.GetCompanyReport
WARN   TenantService rechazó X-Company-Id=17 para userId=42
INFO   TimeTracker.Api started (version 1.4.0, env Production)
WARN   Refresh token vencido para userId=42
```

> **Fase 2 (hecho):** Serilog emite JSON compacto en Production y texto legible en
> Development. Cada evento lleva `service.name`, `service.version`,
> `deployment.environment`, `traceId` y `spanId`, más `tenant.id`/`user.id`/`user.role`
> dentro del scope de request. Ver §24.2 y el [Anexo C](#anexo-c--registro-de-la-fase-2-ejecutada).

### 4.2 Métricas

Responder:

> ¿Cuánto está ocurriendo?

Ejemplos:

```text
http requests/sec por endpoint
error rate 5xx
P95 de /api/reports/company/{id}
conexiones activas del pool Npgsql
timers activos en este momento
GC / CPU / memoria del contenedor backend
```

### 4.3 Traces

Responder:

> ¿Cómo atravesó el sistema una operación?

Recorrido real de un "Stop Timer":

```text
Browser (Angular)
   ↓  POST /api/time/stop
LoginInterceptor  (Authorization + X-Company-Id)
   ↓
TimeController.StopTimer
   ↓
TimeTrackingService.StopTimerAsync
   ↓
UnitOfWork → Repository<TimeEntry>
   ↓
Npgsql → PostgreSQL (UPDATE "TimeEntries")
```

Las operaciones deberán utilizar `TraceId` para permitir correlación distribuida entre navegador, API y base de datos.

### 4.4 Audit

Responder:

> ¿Quién cambió qué y cuándo?

Ejemplo del dominio:

```text
User:      42
Company:   7
Entity:    Issue
EntityId:  318

Status:
InProgress → Done

Timestamp:
2026-08-28 09:00:00Z
TraceId: 4bf92f3577b34da6a3ce929d0e0e4736
```

La auditoría deberá generarse en el backend (interceptor de EF Core) y **no depender de información enviada por el frontend**.

### 4.5 Analytics

Responder:

> ¿Cómo utilizan los usuarios la aplicación?

Ejemplos:

```text
timer_started
company_switched
report_viewed
issue_assigned
theme_changed
```

Analytics no deberá utilizarse como mecanismo de seguridad ni de auditoría.

---

## 5. Arquitectura objetivo

```text
                          USUARIOS
                             │
                             ▼
                    Angular 19 SPA (Nginx)
                       timetracker-web
                             │
                    ┌────────┴────────┐
                    │                 │
              User Events        API Requests
              JS errors          (Bearer + X-Company-Id)
              Web Vitals               │
                    │                  ▼
                    │           TimeTracker.Api
                    │            (ASP.NET Core 8)
                    │                  │
                    │                  ▼
                    │               Npgsql
                    │                  │
                    │                  ▼
                    │           PostgreSQL 16
                    │                  │
                    │                  ▼
                    │            Audit Events
                    │            (tabla AuditLogs)
                    │                  │
                    ▼                  │
            POST /api/telemetry ───────┤
                                       │
                ┌──────────────────────┴──────┐
                │      OpenTelemetry SDK      │
                └──────────────┬──────────────┘
                               │  OTLP
                        OTEL Collector
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
                Loki       Prometheus      Tempo
                Logs         Metrics       Traces
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                            Grafana
```

Diferencia clave respecto del marco general: **no hay Redis, ni message brokers, ni APIs externas** en el camino de la request. La única dependencia de la API es PostgreSQL.

---

## 6. Estándar de instrumentación

Se utilizará **OpenTelemetry** como estándar único de instrumentación.

### 6.1 Backend

Paquetes propuestos:

```text
OpenTelemetry.Extensions.Hosting
OpenTelemetry.Exporter.OpenTelemetryProtocol
OpenTelemetry.Instrumentation.AspNetCore
OpenTelemetry.Instrumentation.Http
OpenTelemetry.Instrumentation.Runtime
Npgsql.OpenTelemetry            (el propio driver expone ActivitySource)
Serilog.AspNetCore + Serilog.Sinks.OpenTelemetry
```

> **Nota de compatibilidad:** los proyectos tienen TFM `net8.0` pero referencian EF Core / Npgsql `9.0.0`. Al incorporar OpenTelemetry deberá fijarse una línea de versiones coherente y verificarse que `Npgsql.OpenTelemetry` corresponda a la major del driver instalado.

Además de la instrumentación automática, se definirá un `ActivitySource` propio para operaciones de negocio:

```text
ActivitySource: "TimeTracker.Business"
Spans: StartTimer, StopTimer, GenerateCompanyReport, AddUserToCompany
```

### 6.2 Frontend

```text
@opentelemetry/sdk-trace-web
@opentelemetry/instrumentation-fetch  (o -xml-http-request)
@opentelemetry/context-zone           (la app es zone-based)
@opentelemetry/exporter-trace-otlp-http
web-vitals
```

Alternativa mínima si se prefiere no incorporar el SDK completo: enviar errores y Web Vitals al endpoint propio `POST /api/telemetry` (§18) y correlacionar por `traceId` generado en el interceptor.

### 6.3 Atributos obligatorios

Toda señal (log, métrica, span, evento) deberá llevar:

```text
service.name             timetracker-api | timetracker-web
service.version          1.4.0
deployment.environment   Development | Staging | Production
host.name / container.id
trace_id
span_id
```

Cuando corresponda:

```text
tenant.id      (CompanyId)
user.id        (claim NameIdentifier)
user.role      (Admin | Manager | User)
session.id
```

---

## 7. Correlación

Campos de correlación comunes a las tres capas:

```text
traceId
spanId
correlationId
service.name
service.version
deployment.environment
```

Cuando corresponda:

```text
userId
tenantId      ← CompanyId, el eje transversal de esta aplicación
sessionId
anonymousId
```

**Estado actual y hueco principal:** el contexto de tenant/usuario existe únicamente dentro de `Backend/Core/Services/Tenant/TenantService.cs`, que lo resuelve on-demand desde `IHttpContextAccessor` en cada llamada de servicio. No hay ningún punto donde ese contexto se empuje a un scope de logging o a los atributos del span.

**Propuesta:** un middleware temprano en el pipeline (`TenantContextMiddleware`) que resuelva `CompanyId`, `UserId` y `Role` una sola vez por request y:

```text
1. Abra un ILogger scope con tenant.id / user.id / user.role
2. Agregue esos mismos atributos a Activity.Current
3. Devuelva 403 explícito cuando la validación de X-Company-Id falla
```

> **Hecho (Fases 0 y 2):** los tres puntos están implementados en
> `TimeTracker/Middleware/TenantContextMiddleware.cs`, que corre justo después de
> `UseAuthorization()`. `TenantService` lanza una `TenantAccessDeniedException` tipada
> que el `ExceptionHandlingMiddleware` traduce a 403 y contabiliza en la métrica
> `timetracker.tenant_access_denied`.

No deberán incluirse en ninguna señal: contraseñas, hashes bcrypt, tokens JWT, connection strings ni el valor de `Jwt:Key`.

---

## 8. Backend .NET

### 8.1 Superficie a instrumentar

Los 7 controllers de `Backend/TimeTracker/Controllers/`:

```text
/api/auth       POST register | login | refresh          (anónimos)

/api/company    POST /, GET /, GET /{id}
                GET  /{id}/users, GET /{id}/users/available
                POST /{id}/users, POST /{id}/users/create
                POST /join
                PUT  /{id}, PUT /{companyId}/users/{userId}
                DELETE /{id}, DELETE /{companyId}/users/{userId}

/api/project    POST /, GET /, GET /{id}
                PUT /{id}, PUT /{id}/status, DELETE /{id}

/api/issue      POST /, GET /{id}, GET /project/{projectId}
                GET /assigned-to-me, GET /my-companies
                GET /project/{projectId}/assigned-to-me
                PUT /{id}, PUT /{id}/assign, PUT /{id}/status
                DELETE /{id}

/api/time       POST /start, POST /stop, POST /manual
                GET /active, GET /entries, GET /entries/paginated
                GET /entries/{id}, PUT /entries/{id}
                DELETE /entries/{id}

/api/reports    GET /user, GET /user/{userId}
                GET /project/{projectId}, GET /company/{companyId}

/api/users      GET /profile/{id}, PUT /update
                PUT /update-password, PUT /reset-password
```

### 8.2 HTTP

```text
Request count por route + method
Response status (2xx / 4xx / 5xx)
Duration (histograma)
Exceptions
Route template (nunca la URL con ids, para no explotar cardinalidad)
tenant.id como atributo (cardinalidad acotada: pocas empresas)
```

### 8.3 Dependencias

Una sola:

```text
PostgreSQL vía Npgsql
```

Cada span de base de datos deberá registrar `db.system=postgresql`, `db.operation`, la tabla, la duración y el error. **No deberá registrarse el texto de la query con parámetros** si contiene datos personales.

### 8.4 Runtime

```text
GC (colecciones por generación, pausas, heap)
CPU del proceso
Memoria (working set, allocated)
ThreadPool (threads, queue length)
Excepciones no manejadas
```

### 8.5 Health checks

> **Fase 2 (hecho):** los tres endpoints existen.
>
> ```text
> GET /health        → liveness (se mantiene por compatibilidad con docker-compose)
> GET /health/live   → liveness
> GET /health/ready  → verifica la conexión real a PostgreSQL; 503 si está caída
> GET /info          → application, version, commitSha, buildNumber, environment
> ```
>
> Verificado: con la base inalcanzable, `/health/ready` devuelve 503 con
> `{"status":"Unhealthy","checks":[{"name":"postgresql","error":"Failed to connect..."}]}`,
> mientras que `/health` sigue en 200. Queda pendiente (Fase 4) apuntar el healthcheck
> de `docker-compose.yml` a `/health/ready`.

---

## 9. Métricas HTTP (RED)

Se implementarán métricas RED por endpoint.

### Rate

```text
requests/sec por route, method y tenant
```

### Errors

```text
5xx rate
4xx rate  (con desglose 401 / 403 — relevante por multi-tenancy)
exception rate
```

### Duration

```text
P50 / P95 / P99
```

Ejemplos de lectura objetivo:

```text
GET /api/time/entries

Rate:       6 req/s
Error:      0.2%
P50:        38 ms
P95:       140 ms
P99:       310 ms
```

```text
POST /api/time/start

Rate:      0.4 req/s
Error:     0.0%
P50:        22 ms
P95:        90 ms
P99:       180 ms
```

```text
GET /api/reports/company/{companyId}

Rate:     0.05 req/s
Error:     1.1%
P50:       620 ms
P95:      2400 ms      ← candidato natural a paginación / índices
P99:      5800 ms
```

Los endpoints de reportes son los de mayor riesgo: agregan `TimeEntries` sin paginación (limitación conocida del proyecto) y su latencia crece con el volumen histórico de cada empresa.

---

## 10. Métricas de infraestructura

### 10.1 Contenedores (Docker Compose)

Mediante `cadvisor` o el receiver `docker_stats` del OTel Collector, para los tres servicios de `docker-compose.yml`:

```text
CPU utilization        (postgres / backend / frontend)
Memory utilization + límites
Disk utilization       (volumen postgres_data)
Disk latency
Network traffic
Container restarts
Healthcheck status
```

### 10.2 Host

```text
CPU / memoria / disco / red del host
Espacio libre del volumen postgres_data
```

### 10.3 Kubernetes — solo si se migra

No aplica hoy. Si en el futuro se abandona Compose, incorporar:

```text
Pod status, container restarts, CrashLoopBackOff
CPU/Memory requests y limits
Node pressure, pending pods, deployment replicas
```

---

## 11. Base de datos (PostgreSQL 16)

Se deberá observar:

```text
Conexiones activas / idle / idle-in-transaction
Uso del connection pool de Npgsql
Tiempo de espera para obtener conexión
Duración de queries (P95 / P99)
Errores y timeouts
Deadlocks y locks
CPU e IO del contenedor postgres
Tamaño de la base y de las tablas grandes (TimeEntries)
```

Deberá diferenciarse siempre:

```text
Pool de conexiones de la aplicación   ≠   capacidad del servidor PostgreSQL
```

Un aumento del `Maximum Pool Size` no debe utilizarse automáticamente como solución a un problema de rendimiento: normalmente traslada la saturación al motor.

**Estado actual:** `Backend/Data/Context/AppDbContext.cs` configura `UseNpgsql(cnnString)` **sin** `EnableRetryOnFailure`, **sin** `CommandTimeout` y **sin** interceptores (`ISaveChangesInterceptor` / `DbCommandInterceptor`). Tampoco hay `LogTo`.

**Riesgo específico de transacciones:** `CompanyService` abre transacciones explícitas y tiene retornos tempranos de `Result.Failure(...)` dentro de la transacción **sin rollback**; esas conexiones quedan en `idle in transaction` hasta el Dispose del scope. La métrica `idle-in-transaction` es la que expone este problema y debe estar en el dashboard de PostgreSQL desde el MVP.

**Propuesta adicional:** exportar métricas del motor con `postgres_exporter` y observar en particular las consultas de `ReportingService`, únicas con agregaciones sobre volumen creciente.

---

## 12. HTTP Client / APIs externas

**Estado actual: TimeTracker no realiza llamadas HTTP salientes.** No hay `IHttpClientFactory` registrado ni integraciones con terceros.

Se deja definido el contrato para cuando aparezca la primera dependencia externa (envío de emails, SSO corporativo, exportación a un ERP):

```text
Request count
Success rate
Error rate
Timeouts
Latency (P95 / P99)
Retry count
Circuit breaker state
```

`OpenTelemetry.Instrumentation.Http` se incluye desde el MVP precisamente para que esa cobertura sea automática el día que se agregue la primera integración.

---

## 13. Resiliencia

Políticas a contemplar por dependencia:

```text
PostgreSQL   Timeout de comando + EnableRetryOnFailure (retry transitorio)
Frontend     Timeout en las llamadas HTTP + backoff en el refresh de token
Telemetría   Fire-and-forget, jamás bloqueante
```

No se aplicará retry indiscriminadamente:

```text
GET  /api/time/entries        retry seguro (idempotente)
POST /api/time/start          NO reintentar sin Idempotency-Key
POST /api/time/manual         NO reintentar sin Idempotency-Key
POST /api/company/{id}/users  NO reintentar
```

**Riesgo identificado en el frontend:** `Frontend/timeTrackerApp/src/app/shared/services/login-interceptor.interceptor.ts` reintenta la request original tras refrescar el token en un 401. Si el 401 ocurre sobre un `POST` que el servidor ya había procesado, el reintento puede duplicar la operación. Además, varios 401 concurrentes disparan N refreshes en paralelo (no hay serialización de la cola) y un refresh fallido no cierra sesión ni redirige: el error solo llega al componente.

---

## 14. Idempotencia

Las operaciones con efectos secundarios deberán evaluar el uso de:

```http
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
```

Endpoints candidatos, en orden de prioridad:

```text
POST /api/time/start           duplicaría timers activos
POST /api/time/manual          duplicaría horas → afecta reportes y costos
POST /api/company/{id}/users   duplicaría membresías
POST /api/company/join
POST /api/auth/register
```

El backend deberá garantizar que requests repetidas con la misma clave no generen múltiples operaciones.

Esto cobra especial importancia ante:

```text
Retries del interceptor tras refresh de token
Fallos de red y timeouts
Doble click en el botón "Start Timer"
Transiciones offline/online si en el futuro se agrega PWA
```

Mitigación complementaria posible sin cambiar el contrato HTTP: `StartTimerAsync` debería rechazar el alta si el usuario ya tiene un `TimeEntry` con `EndTime == null` en la misma empresa.

---

## 15. Frontend / PWA

`timetracker-web` es hoy una SPA sin service worker. Deberá instrumentar:

### 15.1 Errores

```text
Excepciones JavaScript no controladas
Unhandled promise rejections
Errores de renderizado de componentes Angular
Errores de API (4xx / 5xx)
Chunk loading errors (lazy loading de rutas)
```

**Estado actual:** **no existe un `ErrorHandler` global**. `Frontend/timeTrackerApp/src/main.ts` solo hace `.catch(err => console.error(err))` sobre el bootstrap, y hay ~80 llamadas `console.*` dispersas en 30 archivos. Ningún error del navegador llega hoy a ningún backend.

### 15.2 Puntos de instrumentación (chokepoints)

En lugar de tocar los ~25 componentes que manejan errores, se instrumentarán tres puntos únicos:

```text
1. ErrorHandler global      (nuevo, registrado en app.config.ts)
   → errores de render, async y chunk loading

2. shared/utils/error-handler.util.ts → extractErrorMessage()
   → ya normaliza los formatos de error de ASP.NET y los status 0/401/403/404/500,
     y es invocado desde ~25 componentes: es el mejor punto único para
     capturar errores HTTP con contexto de ruta y operación

3. shared/services/login-interceptor.interceptor.ts
   → duración de cada request, status, correlación traceparent,
     y eventos específicos de refresh de token
```

Complementariamente, `shared/services/toast.service.ts` permite saber qué error vio realmente el usuario, no solo cuál se produjo.

### 15.3 Performance — Web Vitals

```text
LCP
INP
CLS
FCP
TTFB
```

### 15.4 Aplicación

```text
Page load
Route change (Router events)
Duración de llamadas a la API
Feature usage
Interacciones del usuario
```

### 15.5 Prerrequisitos de build

> **Fase 0 (hecho):** la configuración `production` de `angular.json` ya define
> `sourceMap: { "scripts": true, "hidden": true }`. Los `.map` se generan (49 en el
> último build) pero no se referencian desde el bundle, y ambos `nginx.conf` los
> bloquean con `location ~ \.map$ { deny all; }` para que no se sirvan al público.
> Falta definir a qué backend de errores se suben durante el build (Fase 3).

También deberá inyectarse la versión de la aplicación: `environment.ts` hoy contiene **solo** `baseUrl`, sin `appVersion`, `envName`, endpoint de telemetría ni sampling.

---

## 16. Real User Monitoring (RUM)

Se implementará RUM para conocer el comportamiento desde dispositivos reales.

Dimensiones recomendadas:

```text
application       timetracker-web
version
environment
browser / browserVersion
OS
deviceType
route             (route template de Angular, no la URL con ids)
connection        cuando esté disponible
```

Ejemplo de lectura objetivo:

```text
timetracker-web v1.4.0

Desktop:
LCP P75 = 1.6 s

Mobile:
LCP P75 = 3.9 s
```

Relevante en esta aplicación porque las vistas de reportes cargan Chart.js y Bootstrap desde CDN externa (`index.html`), lo que introduce una dependencia de red de terceros que solo se observa desde el navegador del usuario.

---

## 17. Telemetría de errores del frontend

Cada error reportado deberá incluir:

```text
timestamp
application       timetracker-web
version
environment
route
errorType
message
stack
traceId
sessionId
anonymousId
browser / OS
```

**No deberán enviarse nunca:**

```text
El token JWT de localStorage
El refresh token
Contraseñas (formularios de login, register, update-password, reset-password)
El objeto user completo (contiene email)
Cabeceras Authorization
Cualquier cuerpo de request de /api/auth/*
```

El sanitizado deberá aplicarse **antes** de encolar el evento, con una lista de bloqueo explícita sobre nombres de campo (`password`, `token`, `authorization`, `refreshToken`).

La telemetría deberá utilizar un endpoint específico y controlado (§18) y **jamás bloquear una operación funcional del usuario**.

---

## 18. Endpoint de Telemetry

Se expondrá un endpoint propio:

```text
POST /api/telemetry
```

Al ser consumido directamente desde el navegador deberá considerarse **público** y protegerse en consecuencia:

```text
HTTPS obligatorio
CORS restringido al origen del frontend
Rate limiting por IP y por sessionId
Límite de tamaño de payload
Límite de eventos por batch
Validación de esquema (FluentValidation, como el resto de la API)
Límite de cantidad y longitud de propiedades
Sanitization / filtrado de PII
Sampling configurable
```

> **Fase 0 (hecho):** el CORS abierto ya se corrigió. Los orígenes se configuran en
> `Cors:AllowedOrigins` y en `Production` la API no arranca con la lista vacía. El
> resto de los controles de esta sección (rate limiting, límites de payload,
> validación de esquema, sampling) sigue pendiente.

Arquitectura mínima (suficiente para el volumen actual):

```text
Angular
  ↓
POST /api/telemetry
  ↓
OTel Collector (OTLP)
```

Si el volumen lo justifica en el futuro:

```text
Angular → Telemetry API → Queue → Telemetry Worker → Collector
```

---

## 19. Usuarios anónimos

La aplicación podrá utilizar identificadores anónimos para analytics:

```text
anonymousId    UUID persistido en localStorage, sobrevive al logout
sessionId      UUID por sesión de navegación
```

Estos identificadores **no deberán utilizarse para autorización**. La autorización sigue dependiendo exclusivamente de:

```text
JWT firmado (claims: NameIdentifier, Email, CompanyId, CompanyIds, Role)
+ validación de X-Company-Id contra el claim CompanyIds
```

Cuando un usuario pasa de anónimo (pantalla de login) a autenticado, podrá realizarse *identity stitching* para analytics, respetando la política de privacidad definida. El `anonymousId` deberá regenerarse si el usuario lo solicita.

---

## 20. Auditoría

### 20.1 Estado actual

No existe tabla ni entidad de auditoría. Lo único disponible son los campos de `Backend/Data/Models/BaseEntity.cs`:

```text
Id, CompanyId, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted
```

`AppDbContext.SaveChangesAsync(CancellationToken)` los rellena, pero:

```text
✗ _currentUserId y _currentTenantId son SIEMPRE null en runtime
  (AddDbContext resuelve el constructor de solo `options`, no el de
   (options, tenantId, userId)) → CreatedBy/UpdatedBy quedan "SYSTEM"

✗ No se sobrescribe SaveChanges() síncrono ni la sobrecarga
  SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken),
  que EF invoca internamente en algunos caminos
```

> **Fase 0 (hecho):** el prerrequisito ya está resuelto. `AppDbContext` recibe un
> `ICurrentUserAccessor` y estampa el `userId` real; el estampado se centralizó en
> `ApplyAuditInformation()` y cubre también las sobrecargas de guardado que antes
> quedaban fuera. Sigue pendiente la tabla `AuditLog` y el interceptor (Fase 5).
>
> Nota: el **filtro global de tenant** sigue sin activarse, porque los query filters
> se fijan al construir el modelo (que EF cachea) y no pueden depender de la request.
> El aislamiento continúa aplicándose servicio por servicio vía `ITenantService`.

### 20.2 Diseño propuesto

Nueva entidad `AuditLog` + `ISaveChangesInterceptor` registrado sobre `AppDbContext`, que capture las entradas `Added / Modified / Deleted` del `ChangeTracker`.

Campos mínimos de cada registro:

```text
AuditId
Timestamp        UTC
UserId           desde ITenantService (no desde el frontend)
CompanyId        tenant
Action           Create | Update | Delete | Approve | Export | Login
EntityType       Company | UserCompany | Project | Issue | TimeEntry | User
EntityId
OldValues        JSON
NewValues        JSON
TraceId
Application      timetracker-api
IpAddress
```

### 20.3 Acciones auditables

Todos los endpoints de escritura de la API:

```text
Company
  POST   /api/company                          Create
  PUT    /api/company/{id}                     Update
  DELETE /api/company/{id}                     Delete
  POST   /api/company/join                     Join

UserCompany  (crítico: define permisos y costos)
  POST   /api/company/{id}/users               AddMember
  POST   /api/company/{id}/users/create        CreateAndAddMember
  PUT    /api/company/{companyId}/users/{id}   ChangeRole / ChangeHourlyRate
  DELETE /api/company/{companyId}/users/{id}   RemoveMember

Project
  POST   /api/project                          Create
  PUT    /api/project/{id}                     Update
  PUT    /api/project/{id}/status              ChangeStatus
  DELETE /api/project/{id}                     Delete

Issue
  POST   /api/issue                            Create
  PUT    /api/issue/{id}                       Update
  PUT    /api/issue/{id}/assign                Assign
  PUT    /api/issue/{id}/status                ChangeStatus
  DELETE /api/issue/{id}                       Delete

TimeEntry  (crítico: base de los reportes y costos)
  POST   /api/time/start                       StartTimer
  POST   /api/time/stop                        StopTimer
  POST   /api/time/manual                      CreateManual
  PUT    /api/time/entries/{id}                Update
  DELETE /api/time/entries/{id}                Delete

User / Seguridad
  POST   /api/auth/register                    Register
  POST   /api/auth/login                       Login / LoginFailed
  PUT    /api/users/update                     UpdateProfile
  PUT    /api/users/update-password            ChangePassword
  PUT    /api/users/reset-password             ResetPassword (Admin)
```

Nunca deberán almacenarse en `OldValues`/`NewValues` los campos `PasswordHash`, tokens ni secretos: la lista de campos excluidos deberá ser explícita en el interceptor.

---

## 21. Relación entre observabilidad y auditoría

La auditoría deberá poder correlacionarse con la observabilidad mediante `TraceId`.

```text
Usuario (Manager)
 ↓
Angular SPA
 ↓
PUT /api/issue/318/status
 ↓
TimeTracker.Api
 ↓
IssueService → UnitOfWork → PostgreSQL
 ↓
AuditLog
```

Todo se relaciona por:

```text
TraceId = 4bf92f3577b34da6a3ce929d0e0e4736
```

Esto permite responder primero:

> ¿Quién cambió el estado del issue 318?

y a continuación:

> ¿Qué ocurrió técnicamente durante esa operación? ¿Cuánto tardó el UPDATE? ¿Hubo un reintento? ¿El usuario vio un error?

---

## 22. Métricas de negocio

Catálogo mínimo de TimeTracker (contador salvo indicación):

```text
Tiempo
  timers_started
  timers_stopped
  timers_active               (gauge — timers con EndTime null)
  timers_abandoned            (timers abiertos > 12 h)
  time_entries_created_manual
  time_entries_edited
  time_entries_deleted
  minutes_tracked_total       (contador de DurationMinutes)

Trabajo
  issues_created
  issues_assigned
  issues_completed            (transición a Done)
  projects_created
  projects_completed

Organización
  companies_created
  company_members_added
  company_members_removed
  company_role_changed

Usuarios
  users_registered
  users_logged_in
  login_failed
  password_reset

Reportes
  reports_generated           (por tipo: user | project | company)
```

Las métricas de negocio llevarán `tenant.id` como dimensión, pero **no** identificadores personales (email, nombre) como etiquetas.

---

## 23. Analytics

Analytics utilizará eventos explícitos, nunca inferidos de logs.

Catálogo inicial:

```text
timer_started
timer_stopped
timer_modal_opened
manual_entry_created
company_switched
company_created
project_created
issue_created
issue_assigned
issue_status_changed
report_viewed
report_range_changed
report_type_changed
theme_changed
dark_mode_toggled
feature_used
```

Contrato común:

```json
{
  "event": "report_viewed",
  "timestamp": "2026-08-28T09:00:00.000Z",
  "application": "timetracker-web",
  "version": "1.4.0",
  "environment": "Production",
  "sessionId": "5f3c...",
  "anonymousId": "b21a...",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "properties": {
    "reportType": "company",
    "rangeDays": 30
  }
}
```

`properties` no deberá contener nombres de empresa, emails ni descripciones de issues: solo dimensiones de baja cardinalidad.

---

## 24. Logs

### 24.1 Niveles

```text
TRACE
DEBUG
INFO
WARN
ERROR
FATAL
```

Producción no deberá emitir `DEBUG` ni `TRACE`. Como referencia, la configuración actual (`Microsoft.AspNetCore=Warning`) ya es razonable y debe conservarse.

### 24.2 Formato estructurado

Se adoptará Serilog con salida JSON. Preferentemente:

```json
{
  "level": "ERROR",
  "message": "Npgsql timeout en GetCompanyReport",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "service.name": "timetracker-api",
  "service.version": "1.4.0",
  "deployment.environment": "Production",
  "tenant.id": 7,
  "user.id": 42,
  "route": "GET /api/reports/company/{companyId}",
  "exception": "Npgsql.NpgsqlException: ..."
}
```

en lugar de texto libre sin contexto.

### 24.3 Prerrequisitos de código

**Estado original (resuelto en Fase 0):** había 48 bloques `try/catch` prácticamente idénticos repartidos en los 7 controllers, con la forma:

```csharp
catch (Exception ex)
{
    _logger.LogError(ex, "Error ...");
    return StatusCode(500, new { error = "Internal server error" });
}
```

Además:

```text
✗ No hay UseExceptionHandler ni ProblemDetails
✗ El formato de error no es uniforme ({ error } vs { error, errors })
✗ authController.RefreshToken devuelve StatusCode(500, ex.Message)
  → fuga de detalles internos al cliente
✗ Result<T> (Backend/Core/Common/Result.cs) no tiene código de error tipado,
  por lo que los controllers mapean a HTTP comparando strings:
      result.Error!.Contains("access") ? Forbid() : NotFound(...)
✗ Ningún servicio de Core/Services inyecta ILogger; CompanyService traga
  las excepciones en catch { return Result.Failure($"...{ex.Message}") }
  y el stack original se pierde definitivamente
```

**Propuesta y estado:**

```text
✓ 1. Agregar un ErrorCode tipado (enum) a Result<T>              Fase 0
✓ 2. Reemplazar los try/catch por un ExceptionHandlingMiddleware
     único que devuelva ProblemDetails con traceId               Fase 0
✓ 3. Mapear ErrorCode → status HTTP en un único lugar            Fase 0
✓ 4. Inyectar ILogger en los servicios y loguear la excepción
     original antes de convertirla en Result.Failure             Fase 2
```

Los cuatro puntos están implementados. `CompanyService` ya no pierde el stack: cada `catch` hace `_logger.LogError(ex, ...)` antes de devolver el `Result`.

---

## 25. Retención

Política inicial, dimensionada para una aplicación interna (no un e-commerce de alto volumen):

| Información | Retención propuesta | Justificación |
| --- | ---: | --- |
| Logs | 30 días | Suficiente para diagnóstico post-incidente |
| Traces | 7 días | Volumen bajo; sampling al 100% viable |
| Métricas | 13 meses | Permite comparación interanual de horas cargadas |
| Audit | 5 años o según requerimiento legal | Sustenta horas facturadas y costos |
| Analytics | 12 meses | Análisis de adopción de funcionalidades |
| RUM / errores frontend | 30 días | Alineado con logs |

Estos valores deberán revisarse según:

```text
Volumen real
Costo de almacenamiento
Requerimientos legales sobre horas trabajadas
Requerimientos operacionales
```

Nota: la auditoría de `TimeEntry` sustenta el cálculo de costos por `HourlyRate`, por lo que su retención debe alinearse con la política de conservación de documentación laboral y contable de la organización, no con la de logs.

---

## 26. Dashboards

### Dashboard 1 — API Overview (`timetracker-api`)

```text
Requests / Errors / P95 / P99
Disponibilidad
Estado de /health/ready
Versión desplegada
```

### Dashboard 2 — Endpoints

```text
Requests por route
Errores por route (4xx / 5xx separados)
Latencia por route
Distribución de status codes
Top endpoints lentos
```

### Dashboard 3 — PostgreSQL

```text
Conexiones activas / idle / idle-in-transaction
Uso del pool Npgsql y tiempo de espera
Duración de queries P95 / P99
Deadlocks y locks
Tamaño de TimeEntries
CPU / IO del contenedor postgres
```

### Dashboard 4 — Docker / Infraestructura

```text
CPU / memoria / disco / red por contenedor
Restarts
Estado de healthchecks
Espacio libre del volumen postgres_data
```

### Dashboard 5 — Frontend / RUM

```text
LCP / INP / CLS por device y ruta
Errores JS por tipo y versión
Latencia de API vista desde el navegador
Chunk loading errors
Navegadores y sistemas operativos
```

### Dashboard 6 — Negocio

```text
Timers iniciados / detenidos / activos ahora
Timers abandonados (> 12 h)
Horas registradas por día y por empresa
Issues creados vs completados
Usuarios activos por empresa
Reportes generados
```

### Dashboard 7 — Auditoría

```text
Cambios por día
Top usuarios que modifican
Entidades más modificadas
Eliminaciones de TimeEntry
Cambios de rol y de HourlyRate
Resets de contraseña
```

---

## 27. Alertas

Las alertas deberán enfocarse en problemas accionables. Cada una responde: qué pasó, por qué importa, qué componente está afectado, qué acción tomar.

### Técnicas

```text
API 5xx rate > 2% durante 5 min
API P95 > 1 s durante 10 min
/api/reports/* P95 > 5 s durante 10 min
/health/ready fallando 2 chequeos consecutivos
Pool PostgreSQL en uso > 80%
Conexiones idle-in-transaction > 5 durante 5 min
CPU contenedor > 85% sostenido 10 min
Memoria contenedor > 90%
Reinicios de contenedor en la última hora > 2
Espacio libre del volumen postgres_data < 15%
```

### De dominio / seguridad

```text
Tasa de 403 anómala          → posible fallo o intento de cruce de tenant
Tasa de 401 anómala          → problema en el refresh de token del frontend
login_failed > N por usuario en 10 min
Timers activos con antigüedad > 12 h
Caída abrupta de minutes_tracked_total respecto de la media semanal
Errores JS del frontend > N por minuto tras un deploy
```

No se crearán alertas simplemente porque una métrica cambió. Cada alerta deberá tener un runbook asociado.

---

## 28. SLO / SLA

Los SLO se definen **por servicio**, no para "la plataforma".

### `timetracker-api`

```text
Disponibilidad             99.5%   (mensual, ventana de horario laboral)
P95 latencia general       < 500 ms
P95 /api/reports/*         < 3 s   (objetivo relajado, agregaciones pesadas)
Error rate 5xx             < 1%
```

### `timetracker-web`

```text
LCP P75                    < 2.5 s (desktop)
LCP P75                    < 4.0 s (mobile)
INP P75                    < 200 ms
Tasa de errores JS         < 0.5% de sesiones
```

### PostgreSQL

```text
Saturación del pool        < 70% en promedio
P95 duración de query      < 200 ms
```

Estos valores son iniciales y deberán recalibrarse tras cuatro semanas de datos reales.

---

## 29. Deployments y cambios

La observabilidad deberá permitir correlacionar degradaciones con deployments.

Cada aplicación deberá reportar:

```text
application
version
buildNumber
commitSha
environment
deploymentTime
```

### Backend

Inyectar en `Backend/Dockerfile` vía `ARG`/`ENV` y exponer en `GET /info`, además de adjuntarlos como atributos de recurso de OpenTelemetry:

```text
timetracker-api
Version: 1.4.0
Commit:  a82f91c
Build:   18242
Env:     Production
```

### Frontend

`Frontend/Dockerfile` ya sustituye `API_URL_PLACEHOLDER` en `environment.ts` durante el build; se extenderá el mismo mecanismo a `appVersion`, `commitSha`, `envName` y `telemetryUrl`.

> **Atención:** `src/environments/environment.ts` está actualmente modificado en el repositorio con `baseUrl: "http://localhost:5083/api"`, pisando el `API_URL_PLACEHOLDER` que el Dockerfile espera reemplazar. Debe restaurarse desde `environment.template.ts` antes de tocar este mecanismo.

Esto permitirá detectar en Grafana:

```text
Deployment marker
      ↓
Error rate ↑
Latency ↑
```

y decidir un rollback con evidencia.

---

## 30. Estrategia de implementación

### Fase 0 — Prerrequisitos de código ✅ COMPLETADA (2026-08-28)

Antes de instrumentar (detalle en el Anexo A, registro de ejecución en el Anexo B):

```text
✓ UseAuthentication() en el pipeline
✓ ExceptionHandlingMiddleware + ProblemDetails
✓ ErrorCode tipado en Result<T>
✓ 403 explícito en la validación de tenant
✓ Contexto de usuario en el AppDbContext (fin del autor "SYSTEM")
✓ CORS restringido por configuración
✓ sourceMap hidden en la config production de Angular
```

### Fase 1 — Estándar

```text
Naming de servicios y métricas
Atributos obligatorios y opcionales
Formato de log estructurado
Catálogo de métricas de negocio
Catálogo de eventos de analytics
Política de PII
Política de retención
```

### Fase 2 — Backend ✅ COMPLETADA (2026-08-28)

```text
✓ Serilog JSON
✓ OpenTelemetry: AspNetCore + Http + Runtime + Npgsql
✓ TenantContextMiddleware (scope de log y atributos de span)
✓ ActivitySource "TimeTracker.Business"
✓ Health checks reales (/health/live, /health/ready) + /info
✓ Métricas de negocio
```

Registro de ejecución en el [Anexo C](#anexo-c--registro-de-la-fase-2-ejecutada).

### Fase 3 — Frontend ✅ COMPLETADA (2026-08-28)

```text
✓ ErrorHandler global
✓ Instrumentación del LoginInterceptor (errores de API, timing, traceparent)
✓ Web Vitals
✓ RUM básico
✓ Propagación de traceparent hacia la API
✓ Source maps en el build de producción (Fase 0)
```

Registro de ejecución en el [Anexo E](#anexo-e--registro-de-la-fase-3-ejecutada).

### Fase 4 — Plataforma ✅ COMPLETADA (2026-08-28)

```text
✓ OpenTelemetry Collector
✓ Prometheus
✓ Loki (+ Promtail, que lee los logs por la API de Docker)
✓ Tempo
✓ Grafana, con datasources y dashboards aprovisionados
  postgres_exporter + cadvisor        pendientes
```

Van en el perfil `observability` del `docker-compose.yml`, para no encarecer el
arranque normal. Registro en el [Anexo F](#anexo-f--registro-de-las-fases-4-y-5-ejecutadas).

### Fase 5 — Auditoría ✅ COMPLETADA (2026-08-29)

```text
✓ Entidad AuditLog
✓ ISaveChangesInterceptor
✓ Correlación con TraceId
✓ Dashboard de auditoría
```

Sin migración de EF Core: la aplicación crea el esquema con `EnsureCreated()`
y la única migración del repositorio ya estaba desfasada del modelo. Registro en
el [Anexo F](#anexo-f--registro-de-las-fases-4-y-5-ejecutadas).

### Fase 6 — Analytics ✅ COMPLETADA (2026-08-29)

```text
✓ Servicio de eventos en Angular, instrumentado en los servicios de dominio
✓ POST /api/telemetry con rate limiting y validación   (Fase 3)
✓ Almacenamiento: logs estructurados en Loki + contador en Prometheus
✓ Dashboard: eventos más frecuentes y recorrido de sesión
```

Registro en el [Anexo G](#anexo-g--registro-de-la-fase-6-ejecutada).

### Fase 7 — Alerting

```text
SLOs por servicio
Reglas de alerta
Canales de notificación
Runbooks
```

---

## 31. Primer MVP

Deliberadamente pequeño. Objetivo: poder recorrer un incidente de punta a punta.

### Backend

```text
✓ Serilog con salida JSON
✓ OpenTelemetry (AspNetCore + Runtime + Npgsql)
✓ Métricas HTTP RED por endpoint
✓ Tracing HTTP + PostgreSQL
✓ TraceId en toda respuesta de error
✓ ExceptionHandlingMiddleware + ProblemDetails
✓ /health/ready verificando la base
```

### Frontend

```text
✓ ErrorHandler global
✓ Captura de errores de API vía extractErrorMessage
✓ application + version en cada evento
✓ Web Vitals básicos
✓ Correlación traceparent con la API
```

### Plataforma

```text
✓ otel-collector
✓ prometheus
✓ loki
✓ tempo
✓ grafana
   (5 servicios nuevos en docker-compose.yml, red timetracker-network)
```

### Dashboards

```text
✓ API Overview
✓ PostgreSQL
✓ Frontend / RUM
```

### Alertas

```text
✓ 5xx rate
✓ P95 de latencia
✓ /health/ready caído
✓ Saturación del pool de PostgreSQL
```

Queda **fuera del MVP**: auditoría persistida, analytics, idempotencia, SLOs formales.

---

## 32. Principio final

La arquitectura objetivo deberá permitir recorrer una incidencia desde el síntoma hasta la causa:

```text
                    INCIDENTE
              "Los reportes no cargan"
                        │
                        ▼
                Grafana / Alerta
             P95 /api/reports/company ↑
                        │
                        ▼
                     Metrics
           ¿todas las empresas o una sola?
                        │
                        ▼
                      Trace
             span lento = Npgsql SELECT
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Angular     API    PostgreSQL
              │         │         │
              ▼         ▼         ▼
            Logs      Logs   idle-in-transaction
                        │
                        ▼
                      Audit
          ¿alguien cargó 40.000 TimeEntries?
                        │
                        ▼
                  Deployment marker
              versión 1.4.0, commit a82f91c
```

El objetivo final no es acumular la mayor cantidad posible de logs, métricas o eventos, sino poder responder rápidamente:

> **Qué pasó, dónde pasó, por qué pasó, a qué empresa y a qué usuarios afectó, y qué cambio lo provocó.**

---

## 33. Próximos pasos

| # | Definición pendiente | Estado |
| --- | --- | --- |
| 1 | Catálogo de aplicaciones (`timetracker-api`, `timetracker-web`) | Definido en §2 |
| 2 | Ambientes existentes (¿hay Staging o solo Dev y Prod?) | **Pendiente** |
| 3 | Dependencias por aplicación | Definido en §2 y §12 |
| 4 | Naming convention de métricas y spans | **Pendiente** |
| 5 | Contrato de logs | Propuesto en §24 |
| 6 | Catálogo de métricas de negocio | Propuesto en §22 |
| 7 | Catálogo de eventos de analytics | Propuesto en §23 |
| 8 | Política de auditoría (qué se audita y por cuánto tiempo) | Propuesto en §20 y §25 |
| 9 | Política de PII | Propuesto en §17 |
| 10 | Retención definitiva | Propuesto en §25, **requiere validación legal** |
| 11 | SLOs por servicio | Propuesto en §28, **recalibrar con datos reales** |
| 12 | Dashboards | Propuestos en §26 |
| 13 | Alertas y umbrales | Propuestos en §27 |
| 14 | Runbooks | **Parcial** — [`observability/RUNBOOK_SOPORTE.md`](observability/RUNBOOK_SOPORTE.md) cubre el recorrido de un reporte de usuario; faltan los de cada alerta (Fase 7) |
| 15 | Arquitectura del OTel Collector (pipelines, sampling, límites) | **Pendiente** |
| 16 | Resolución de la deuda técnica del Anexo A | **Parcial** — cerrados A1–A8 y A10–A16 en las Fases 0, 2 y 3; quedan A9, A17 y A18 |

Este documento deberá evolucionar desde `v0.1` hasta convertirse en el estándar de observabilidad de TimeTracker.

---

## Anexo A — Deuda técnica que bloquea la observabilidad

Esta es la diferencia principal entre el marco general y este documento: en TimeTracker hay puntos del código que **impiden** instrumentar con sentido. Deben resolverse antes o durante la Fase 2.

> **Estado a 2026-08-28:** Fase 0 cerró A1–A4, A8 y A10
> ([Anexo B](#anexo-b--registro-de-la-fase-0-ejecutada)); Fase 2 cerró A5–A7
> ([Anexo C](#anexo-c--registro-de-la-fase-2-ejecutada)); Fase 3 cerró A11–A16
> ([Anexo E](#anexo-e--registro-de-la-fase-3-ejecutada)).
> Quedan pendientes **A9** (secreto JWT commiteado), **A17** (paquete Redis sin usar)
> y **A18** (unificar los dos Dockerfiles del backend).

| # | Hallazgo | Archivo | Impacto sobre el plan | Estado |
| --- | --- | --- | --- | --- |
| A1 | `AddDbContext` resuelve el constructor de solo `options`; `_currentTenantId` y `_currentUserId` son siempre `null` | `Backend/Data/Context/AppDbContext.cs` | **Bloqueante de §20.** El filtro global de tenant nunca se aplica y toda auditoría registraría `"SYSTEM"` || ✅ Resuelto (Fase 0) |
| A2 | `Result<T>` sin código de error tipado; los controllers mapean a HTTP por comparación de strings | `Backend/Core/Common/Result.cs`, `Controllers/TimeController.cs` | **Bloqueante de §24.** Sin tipo de error no hay clasificación de fallos en métricas ni spans || ✅ Resuelto (Fase 0) |
| A3 | Falta `app.UseAuthentication()` (solo hay `UseAuthorization`) | `Backend/TimeTracker/Program.cs` | El contexto de identidad no está garantizado en el pipeline temprano donde debe correr el middleware de correlación || ✅ Resuelto (Fase 0) |
| A4 | `TenantService.GetTenantId()` lanza `UnauthorizedAccessException` no capturada → HTTP 500 | `Backend/Core/Services/Tenant/TenantService.cs` | Los intentos de cruce de tenant se contabilizan como error del servidor, no como 403. Rompe la alerta de seguridad de §27 || ✅ Resuelto (Fase 0) |
| A5 | Ningún servicio de `Core/Services` inyecta `ILogger`; `CompanyService` traga excepciones en `catch { return Result.Failure($"...{ex.Message}") }` | `Backend/Core/Services/Companies/CompanyService.cs` | El stack original se pierde; los spans fallidos quedan sin causa || ✅ Resuelto (Fase 2) |
| A6 | Retornos tempranos dentro de transacciones sin `RollbackTransactionAsync` | `Backend/Core/Services/Companies/CompanyService.cs` | Conexiones en `idle in transaction`. Debe monitorearse desde el MVP (§11) || ✅ Resuelto (Fase 2) |
| A7 | `/health` no verifica la base de datos | `Backend/TimeTracker/Program.cs` | El healthcheck de Compose da falso positivo. Bloquea el SLO de disponibilidad (§28) || ✅ Resuelto (Fase 2) |
| A8 | CORS `WithOrigins("*").AllowAnyHeader().AllowAnyMethod()` | `Backend/TimeTracker/Program.cs` | **Bloqueante de §18.** No puede exponerse `/api/telemetry` con este CORS || ✅ Resuelto (Fase 0) |
| A9 | Secreto JWT commiteado en el repositorio | `Backend/TimeTracker/appsettings.json`, `docker-compose.yml` | Riesgo de seguridad independiente; además debe garantizarse que nunca aparezca en un log o span || ⏳ Pendiente |
| A10 | La configuración `production` no define `sourceMap` | `Frontend/timeTrackerApp/angular.json` | **Bloqueante de §15.** Sin source maps los stack traces de RUM son ilegibles || ✅ Resuelto (Fase 0) |
| A11 | No existe `ErrorHandler` global; ~80 `console.*` en 30 archivos | `Frontend/timeTrackerApp/src/main.ts`, `app.config.ts` | Ningún error del navegador sale hoy del navegador || ✅ Resuelto (Fase 3) |
| A12 | `catchError → of(...)` silencia errores | `Frontend/.../time-entry/services/time-entry.service.ts` | Errores invisibles tanto para el usuario como para la telemetría || ✅ Resuelto (Fase 3) |
| A13 | `debugger;` olvidado en `register()` | `Frontend/.../auth/services/auth.service.ts` | Detiene la ejecución con DevTools abiertas; debe eliminarse || ✅ Resuelto (Fase 3) |
| A14 | `environment.ts` con el `API_URL_PLACEHOLDER` pisado por `http://localhost:5083/api` | `Frontend/timeTrackerApp/src/environments/environment.ts` | Rompe el mecanismo de inyección de configuración por build (§29) || ✅ Resuelto (Fase 3) |
| A15 | Refresh de token sin serializar; N refreshes concurrentes; el fallo no desloguea | `Frontend/.../shared/services/login-interceptor.interceptor.ts` | Genera ruido de 401 y reintentos no idempotentes (§13, §14) || ✅ Resuelto (Fase 3) |
| A16 | `cypress.config.ts` apunta a `localhost:3000` / `localhost:3001`, que no coinciden con los puertos reales (4200 / 5083) | `Frontend/timeTrackerApp/cypress.config.ts` | Los E2E no pueden usarse como verificación sintética del stack instrumentado || ✅ Resuelto (Fase 3) |
| A17 | `Microsoft.Extensions.Caching.StackExchangeRedis` referenciado sin usarse | `Backend/Data/Data.csproj` | Confunde el inventario de dependencias: no instrumentar Redis mientras no exista || ⏳ Pendiente |
| A18 | Dos Dockerfiles de backend con configuraciones distintas (puerto 80 vs 8080/8081) | `Backend/Dockerfile`, `Backend/TimeTracker/Dockerfile` | Los `ARG` de versión/commit del §29 deben agregarse al que efectivamente usa `docker-compose.yml` || ⏳ Pendiente |

---

## Anexo B — Registro de la Fase 0 ejecutada

**Fecha:** 2026-08-28
**Alcance:** prerrequisitos de código listados en §30 Fase 0. No incluye instrumentación (Serilog, OpenTelemetry, RUM, plataforma), que corresponde a las fases 2 a 4.

### B.1 Qué se cambió

| Ítem | Cambio | Archivos |
| --- | --- | --- |
| A2 | `ErrorCode` tipado (`None`, `Validation`, `NotFound`, `Forbidden`, `Unauthorized`, `Conflict`, `Unexpected`) incorporado a `Result`/`Result<T>`, con fábricas `NotFound()`, `Forbidden()`, `Unauthorized()`, `Conflict()`. `Failure(string)` conserva el código `Validation`, de modo que las llamadas existentes no cambian de status | `Core/Common/ErrorCode.cs` (nuevo), `Core/Common/Result.cs` |
| A2 | Mapeo único `ErrorCode → HTTP` mediante `ToErrorResponse()`. Se eliminaron los 7 sitios que decidían el status comparando texto (`result.Error!.Contains("access")`) | `TimeTracker/Extensions/ResultExtensions.cs` (nuevo), los 7 controllers |
| A2 | Los servicios pasaron a devolver el código correcto en ~50 puntos de fallo (`"... not found"` → `NotFound`, accesos y permisos → `Forbidden`, `"User not authenticated"` → `Unauthorized`) | `Core/Services/**` |
| — | **48 bloques `try/catch` eliminados** de los controllers y reemplazados por un middleware único que devuelve ProblemDetails con `traceId`. Se eliminó también la fuga de `ex.Message` en `RefreshToken` (el detalle interno solo se expone en Development) | `TimeTracker/Middleware/ExceptionHandlingMiddleware.cs` (nuevo), los 7 controllers |
| A3 | `app.UseAuthentication()` agregado antes de `UseAuthorization()` | `TimeTracker/Program.cs` |
| A4 | `TenantAccessDeniedException` tipada; el middleware la traduce a **403** (antes era una `UnauthorizedAccessException` no capturada que terminaba en 500) | `Core/Common/Exceptions/TenantAccessDeniedException.cs` (nuevo), `Core/Services/Tenant/TenantService.cs` |
| A1 | `ICurrentUserAccessor` permite a la capa de datos conocer al usuario de la request. `CreatedBy`/`UpdatedBy` dejan de ser siempre `"SYSTEM"`. El estampado se movió a `ApplyAuditInformation()` y ahora cubre también los caminos de guardado que antes no pasaban por el override | `Data/Interfaces/ICurrentUserAccessor.cs` (nuevo), `Data/Context/AppDbContext.cs`, `Core/Services/Tenant/TenantService.cs` |
| A8 | CORS restringido por configuración (`Cors:AllowedOrigins`). En `Production` la API **no arranca** si la lista está vacía; fuera de producción se mantiene permisivo para no romper el desarrollo local | `TimeTracker/Program.cs`, `appsettings*.json`, `docker-compose.yml`, `.env.example` |
| A10 | `sourceMap: { scripts: true, hidden: true }` en la configuración `production`. Los `.map` se generan pero no se referencian desde el bundle, y nginx los bloquea para que no se sirvan al público | `Frontend/timeTrackerApp/angular.json`, `Frontend/nginx.conf`, `Frontend/timeTrackerApp/nginx.conf` |

### B.2 Cambios de contrato HTTP

Al pasar de un status decidido por texto a uno decidido por `ErrorCode`, algunas respuestas cambiaron de código:

```text
"Company not found" / "Project not found" / "Issue not found"
"Time entry not found" / "User not found"
    400 → 404

"You don't have access to ..." / "User does not belong to this company"
"You don't have permission to view ..."
    400 → 403

"User not authenticated"
    400 → 401
```

El cuerpo de todas las respuestas de error es ahora `application/problem+json`, pero **conserva las propiedades `error` y `errors`** porque son las que lee `extractErrorMessage()` en el frontend antes que cualquier otro campo. El frontend no requiere cambios.

Efecto colateral positivo: donde antes se devolvía `Forbid()` (403 con cuerpo vacío, que el frontend traducía al genérico *"No tiene permisos para realizar esta acción"*), ahora el 403 lleva el mensaje real del servidor.

### B.3 Qué NO se hizo, y por qué

```text
Filtro global de tenant en AppDbContext
    Los query filters se evalúan al construir el modelo, que EF cachea,
    por lo que no pueden depender de la request sin un IModelCacheKeyFactory
    propio. El aislamiento sigue aplicándose servicio por servicio vía
    ITenantService, igual que antes. Queda documentado en el código.

A5, A6  Logging en servicios y rollback de transacciones  → Fase 2
A7      Health check real contra la base                  → Fase 2
A9      Secreto JWT commiteado                            → seguridad, fuera de Fase 0
A11-A16 Deuda del frontend                                → Fase 3
A17     Paquete Redis sin usar                            → limpieza
A18     Unificación de los dos Dockerfiles                → Fase 4 (§29)
```

### B.4 Verificación realizada

```text
✓ dotnet build          0 errores; advertencias de 23 → 1
✓ dotnet test          90/90 (75 preexistentes + 15 nuevos del mapeo ErrorCode→HTTP)
✓ ng build --prod      OK; 49 source maps generados, 0 referencias sourceMappingURL
✓ API arranca con el pipeline nuevo y /health responde 200
✓ Endpoint protegido sin token                         → 401
✓ CORS con Origin http://localhost:4200                → Access-Control-Allow-Origin presente
✓ CORS con Origin no permitido                         → sin header (bloqueado)
✓ Excepción de infraestructura (PostgreSQL inalcanzable)
  → ProblemDetails 500 con traceId, en vez del 500 opaco anterior
```

No fue posible ejercitar los flujos que requieren base de datos: el PostgreSQL configurado en `appsettings.json` (`192.168.1.40:5432`) no es alcanzable desde el entorno de desarrollo usado. Quedan pendientes de validación contra una base real:

```text
- 403 efectivo ante un X-Company-Id de otra empresa
- CreatedBy/UpdatedBy con el userId real en vez de "SYSTEM"
- Los nuevos 404 en los flujos de Company, Project, Issue y TimeEntry
```

La suite Cypress (`cypress/e2e/full-flow.cy.ts`) es el vehículo natural para esa validación, pero antes debe corregirse A16: apunta a los puertos 3000/3001 en lugar de 4200/5083.

---

## Anexo C — Registro de la Fase 2 ejecutada

**Fecha:** 2026-08-28
**Alcance:** instrumentación del backend (§30 Fase 2). No incluye frontend/RUM (Fase 3) ni la plataforma Grafana/Loki/Tempo/Prometheus (Fase 4).

### C.1 Paquetes incorporados

```text
Serilog.AspNetCore                             10.0.0
Serilog.Formatting.Compact                      3.0.0
OpenTelemetry.Extensions.Hosting                1.18.0
OpenTelemetry.Instrumentation.AspNetCore        1.18.0
OpenTelemetry.Instrumentation.Http              1.18.0
OpenTelemetry.Instrumentation.Runtime           1.18.0
OpenTelemetry.Exporter.OpenTelemetryProtocol    1.18.0
Npgsql.OpenTelemetry                             9.0.3   ← alineado con el driver Npgsql 9
AspNetCore.HealthChecks.NpgSql                   9.0.0
```

> La advertencia de compatibilidad de §6.1 se materializó: `dotnet add package` resolvió
> `Npgsql.OpenTelemetry` 10.x, que arrastra Npgsql 10 y no coincide con el driver 9.0.0
> del proyecto. Se fijó explícitamente en 9.0.3.

### C.2 Qué se cambió

| Área | Cambio | Archivos |
| --- | --- | --- |
| Logging (§24) | Serilog con `CompactJsonFormatter` en Production y salida legible en Development. Enriquecido con `service.name`, `service.version` y `deployment.environment` | `TimeTracker/Observability/ObservabilityExtensions.cs` (nuevo) |
| Correlación (§7, §21) | `TraceContextEnricher` agrega `traceId` y `spanId` a **cada** evento de log: es lo que permite saltar de Loki a Tempo | `TimeTracker/Observability/TraceContextEnricher.cs` (nuevo) |
| Correlación (§7) | `TenantContextMiddleware` resuelve tenant/usuario una vez por request y los publica como scope de log y como tags del span (`tenant.id`, `user.id`, `user.role`) | `TimeTracker/Middleware/TenantContextMiddleware.cs` (nuevo) |
| Trazas (§6, §8) | OpenTelemetry con instrumentación de ASP.NET Core, HttpClient y Npgsql. Los health checks se filtran para no generar ruido | `TimeTracker/Observability/ObservabilityExtensions.cs` |
| Métricas (§9, §11) | Métricas HTTP RED por endpoint, runtime (GC, CPU, threads) y del driver Npgsql, que es la fuente de la alerta de saturación del pool | idem |
| Negocio (§22) | Catálogo de 17 métricas funcionales y `ActivitySource "TimeTracker.Business"` con spans `StartTimer`, `StopTimer` y `GenerateCompanyReport` | `Core/Observability/TimeTrackerTelemetry.cs` (nuevo) + los servicios |
| Identidad (§29) | `ServiceInfo` centraliza `application`/`version`/`commitSha`/`buildNumber`/`environment`, tomados de configuración con fallback a la versión del ensamblado | `TimeTracker/Observability/ServiceInfo.cs` (nuevo) |
| A7 | Health checks reales: `/health` y `/health/live` (liveness) y `/health/ready` (verifica PostgreSQL). Nuevo `/info` | `TimeTracker/Program.cs` |
| A5 | `ILogger<CompanyService>` inyectado; los 7 `catch` registran la excepción original antes de convertirla en `Result` | `Core/Services/Companies/CompanyService.cs` |
| A6 | Los retornos tempranos dentro de transacciones hacen rollback vía `RollbackAndFail()` | idem |
| Log de acceso | `UseSerilogRequestLogging` emite una línea por request con método, ruta, status y duración; los health checks bajan a `Verbose` | `TimeTracker/Program.cs` |

### C.3 Métricas de negocio instrumentadas

```text
timers_started              TimeTrackingService.StartTimerAsync
timers_stopped              TimeTrackingService.StopTimerAsync
minutes_tracked_total       StopTimerAsync + AddManualEntryAsync
time_entries_created_manual AddManualEntryAsync
time_entries_edited         UpdateEntryAsync
time_entries_deleted        DeleteEntryAsync
issues_created              IssueService.CreateIssueAsync
issues_completed            ChangeIssueStatusAsync (solo transición a Done)
projects_created            ProjectService.CreateProjectAsync
companies_created           CompanyService.CreateCompanyAsync
company_members_added       CreateCompanyAsync + AddUserToCompanyAsync
company_members_removed     RemoveUserFromCompanyAsync
users_registered            authController.Register
users_logged_in             authController.Login
login_failed                authController.Login (sin registrar el email)
reports_generated           ReportingService, con la dimensión report.type
tenant_access_denied        ExceptionHandlingMiddleware
```

Todas llevan `tenant.id` como dimensión y ninguna almacena identificadores personales.

### C.4 Sobre el exportador OTLP

El exportador solo se activa si hay endpoint configurado en `Otlp:Endpoint` o en la
variable estándar `OTEL_EXPORTER_OTLP_ENDPOINT`. Sin él la aplicación funciona igual y
la instrumentación queda inerte: **no hace falta levantar la plataforma de la Fase 4
para poder desarrollar**. Hasta que exista el Collector, la telemetría se genera pero
no se exporta a ningún lado.

### C.5 Verificación realizada

```text
✓ dotnet build       0 errores
✓ dotnet test        90/90
✓ /health            200 Healthy
✓ /health/live       200
✓ /health/ready      503 Unhealthy, con el error real de PostgreSQL en el cuerpo
✓ /info              {"application":"timetracker-api","version":"1.4.0",
                      "commitSha":"a82f91c","buildNumber":"18242", ...}
                     alimentado por Build__Version / Build__CommitSha / Build__Number
✓ Logs en Development  texto legible con las propiedades del servicio
✓ Logs en Production   JSON compacto; cada evento con traceId, spanId,
                       service.name, service.version, deployment.environment
✓ Log de acceso        {"@mt":"HTTP {RequestMethod} {RequestPath} responded
                        {StatusCode} in {Elapsed} ms", "Endpoint":"...GetActiveTimer",
                        "StatusCode":401, "traceId":"56c44c63..."}
✓ ProblemDetails       el traceId del cuerpo de error es ahora el TraceId de W3C
                       (32 hex), buscable directamente en Tempo
```

Sigue sin poder validarse contra base de datos real (ver B.4): las métricas de negocio
y los spans de `StartTimer`/`StopTimer` están instrumentados pero no ejercitados.

### C.6 Pendientes que habilita esta fase

```text
Fase 4  Levantar otel-collector, Prometheus, Loki, Tempo y Grafana en
        docker-compose y apuntar OTEL_EXPORTER_OTLP_ENDPOINT al collector.
        Recién entonces la telemetría llega a algún lado.
Fase 4  Apuntar el healthcheck de docker-compose.yml a /health/ready
        y pasar Build__Version / Build__CommitSha como ARG del Dockerfile.
Fase 3  Frontend: ErrorHandler global, Web Vitals y propagación de traceparent
        para cerrar la correlación navegador → API → PostgreSQL.
```

---

## Anexo D — Guía de configuración contra un stack existente

Qué hay que setear para conectar `timetracker-api` a una plataforma de observabilidad
ya montada. **No requiere cambios de código.**

### D.1 Variables

| Variable | Efecto | Por defecto |
| --- | --- | --- |
| `OTLP_ENDPOINT` | Destino OTLP de **trazas y métricas**. Vacío = instrumentación inerte | vacío |
| `OTLP_PROTOCOL` | `grpc` (puerto 4317) o `http/protobuf` (puerto 4318) | `grpc` |
| `CORS_ALLOWED_ORIGINS` | Origen exacto del frontend. **En Production la API no arranca si está vacío** | `http://localhost:4200` |
| `BUILD_VERSION` | Versión expuesta en `/info` y como `service.version` | `unknown` |
| `BUILD_COMMIT_SHA` | Commit, para correlacionar degradaciones con deploys | `unknown` |
| `BUILD_NUMBER` | Número de build | `unknown` |

Fuera de Docker las mismas claves se pasan como `Otlp__Endpoint`, `Build__Version`,
`Build__CommitSha`, `Build__Number` y `Cors__AllowedOrigins__0`.

### D.2 Ejemplo de `.env`

```bash
# Collector en la misma red de Docker Compose
OTLP_ENDPOINT=http://otel-collector:4317
OTLP_PROTOCOL=grpc

# Collector fuera de Docker, en el host
# OTLP_ENDPOINT=http://host.docker.internal:4317

CORS_ALLOWED_ORIGINS=https://timetracker.midominio.com

BUILD_VERSION=1.4.0
BUILD_COMMIT_SHA=a82f91c
BUILD_NUMBER=18242
```

El collector debe ser alcanzable desde la red `timetracker-network` (agregarlo a esa
red, o exponerlo en el host y usar `host.docker.internal`).

### D.3 Las tres señales

**Trazas → Tempo.** Push OTLP. Incluye HTTP entrante, PostgreSQL vía Npgsql, HttpClient
y los spans de negocio `StartTimer`, `StopTimer` y `GenerateCompanyReport`.

**Métricas → Prometheus.** Push OTLP al Collector; Prometheus scrapea al Collector, no a
la API. **La API no expone `/metrics`**: si el diseño es que Prometheus scrapee la
aplicación directamente, hay que agregar `OpenTelemetry.Exporter.Prometheus.AspNetCore`.
Incluye las métricas RED por endpoint, runtime (GC, CPU, threads), el pool de Npgsql y
las 17 métricas de negocio de §22.

**Logs → Loki.** No van por OTLP: la aplicación escribe **JSON compacto por stdout** y se
recogen con Promtail, Alloy, Fluent Bit o el log driver de Docker. Formato
`CompactJsonFormatter` de Serilog:

```json
{"@t":"2026-08-28T13:22:46.63Z",
 "@mt":"HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed} ms",
 "@l":"Information",
 "@tr":"56c44c63824acfbf0d942ea1a0f5e656",
 "@sp":"a6593f660279bcad",
 "traceId":"56c44c63824acfbf0d942ea1a0f5e656",
 "spanId":"a6593f660279bcad",
 "RequestMethod":"GET","RequestPath":"/api/time/active","StatusCode":401,
 "Elapsed":12.2768,
 "Endpoint":"TimeTracker.Controllers.TimeController.GetActiveTimer (TimeTracker.Api)",
 "service.name":"timetracker-api","service.version":"1.4.0",
 "deployment.environment":"Production"}
```

Campos relevantes al configurar la ingesta:

```text
@t   timestamp        @l   nivel (ausente = Information)
@mt  message template @tr  traceId        @sp  spanId
```

`traceId` y `spanId` están duplicados como propiedades de primer nivel además de
`@tr`/`@sp`, para que la derivación de labels no dependa del formato de Serilog.

Labels sugeridas en Loki: `service.name`, `deployment.environment`, `service.version`.
**No usar `traceId` como label** (cardinalidad ilimitada): va como campo indexado por el
derived field que enlaza a Tempo.

### D.4 Health checks

```text
GET /health        liveness  — 200 mientras el proceso responda
GET /health/live   liveness
GET /health/ready  readiness — 503 si PostgreSQL no responde
GET /info          identidad del despliegue
```

El healthcheck de `docker-compose.yml` apunta a `/health/ready`, con `timeout: 25s`
porque un fallo de conexión a PostgreSQL tarda unos 15 s en dar timeout.

### D.5 Comportamiento cuando el collector no está

Verificado con el endpoint OTLP configurado y nada escuchando: la API responde con
normalidad (`/health` 200, endpoints 401/200 según corresponda) y no registra ruido de
export en los logs de aplicación. Los fallos del exportador van al EventSource interno
de OpenTelemetry, no a Serilog.

Es decir: **el collector caído no degrada la aplicación**, y se puede configurar
`OTLP_ENDPOINT` antes de tener la plataforma arriba.

### D.6 Lo que todavía no emite la aplicación

```text
Frontend           Sin ErrorHandler global, sin Web Vitals, sin RUM (Fase 3).
                   El navegador no envía nada todavía.
traceparent        El LoginInterceptor de Angular no propaga el contexto de traza,
                   así que las trazas empiezan en la API, no en el navegador.
Logs por OTLP      Los logs no se exportan por OTLP; salen por stdout.
/metrics           No existe endpoint de scrape en la API.
Auditoría          La tabla AuditLog y su interceptor son Fase 5.
```

---

## Anexo E — Registro de la Fase 3 ejecutada

**Fecha:** 2026-08-28
**Alcance:** instrumentación del frontend y endpoint de ingesta (§15–§19 y §30 Fase 3).

### E.1 Decisiones de diseño

```text
Destino       POST /api/telemetry en la propia API (§18), no OTLP directo desde
              el navegador. El collector no queda expuesto a Internet y el
              saneado de PII se aplica del lado del servidor.

SDK           Sin SDK de OpenTelemetry web. Solo web-vitals (~2 kB) y código
              propio para generar traceparent y agrupar el envío.
              El bundle inicial pasó de 1.14 MB a 1.15 MB.

Persistencia  Los eventos no se guardan en base: se emiten como logs
              estructurados (que Promtail/Alloy llevan a Loki) y como métricas
              OTLP, de modo que el frontend queda en los mismos dashboards que
              el backend sin infraestructura adicional.
```

### E.2 Backend — `POST /api/telemetry`

| Control | Implementación |
| --- | --- |
| Anónimo | `[AllowAnonymous]`: el navegador reporta también antes del login |
| Rate limiting | 60 lotes/minuto, particionado por `X-Session-Id` y, si falta, por IP. Sin cola: descartar es preferible a demorar |
| Tamaño de payload | `[RequestSizeLimit]` de 128 KB |
| Límite de lote | 50 eventos; 20 propiedades por evento |
| Validación de esquema | FluentValidation: tipos acotados (`error`, `web_vital`, `api_error`, `event`), longitudes máximas, `traceId` de 32 hex |
| Saneado de PII | `TelemetrySanitizer` en el servidor, independiente del saneado del navegador |
| CORS | La política restringida de la Fase 0 (A8) ya lo cubre |

Archivos: `Data/Dtos/Telemetry/TelemetryRequest.cs`,
`Data/Validators/TelemetryBatchRequestValidator.cs`,
`Core/Services/Telemetry/TelemetrySanitizer.cs`,
`Core/Services/Telemetry/TelemetryIngestionService.cs`,
`TimeTracker/Controllers/TelemetryController.cs`,
`TimeTracker/Observability/RateLimitPolicies.cs`.

Nuevas métricas: `frontend_errors`, `frontend_api_errors`, `web_vital` (histograma con
dimensión `vital.name`), `frontend_events`.

### E.3 Frontend

| Pieza | Qué hace |
| --- | --- |
| `TelemetryService` | Cola en memoria, agrupación cada 5 s, `sendBeacon` al ocultar la pestaña, saneado local, `sessionId`/`anonymousId`, muestreo. Nunca lanza |
| `GlobalErrorHandler` | Registrado como `ErrorHandler` (A11). Captura errores de renderizado, asíncronos y de carga de chunks; ignora los `HttpErrorResponse` porque los reporta el interceptor con más contexto |
| `trace-context.util.ts` | Genera `traceparent` W3C por request |
| `LoginInterceptor` | Agrega `traceparent`, mide duración, reporta `api_error`, marca llamadas lentas (>3 s) y **serializa el refresh de token** (A15) |
| `web-vitals.ts` | LCP, INP, CLS, FCP y TTFB |
| `environment.*.ts` | `appVersion`, `envName` y bloque `telemetry` (enabled, endpoint, sampleRate) |

### E.4 Deuda del frontend cerrada

```text
A11  ErrorHandler global               → creado y registrado en app.config.ts
A12  catchError que tragaba errores    → ver nota abajo
A13  debugger; en auth.service.ts      → eliminado
A14  environment.ts con placeholder    → restaurado y ampliado; el Dockerfile
                                          ahora reemplaza también APP_VERSION y ENV_NAME
A15  Refresh de token sin serializar   → un solo refresh; los demás 401 esperan
                                          su resultado. Un refresh fallido cierra sesión
A16  Puertos de Cypress 3000/3001      → 4200 y 5083, sobrescribibles por
                                          CYPRESS_BASE_URL / CYPRESS_API_URL
```

> **Sobre A12:** el `catchError` de `getActiveTimer()` sigue devolviendo `null` en vez de
> propagar el error. Propagarlo tumbaría la carga completa del dashboard, que consume
> esa llamada dentro de un `forkJoin`. Lo que se corrigió es la **invisibilidad**: el 404
> se sigue tratando como estado válido del dominio, y cualquier otro fallo emite el
> evento `active_timer_degraded`, con lo que un pico deja de ser silencioso.

### E.5 Verificación realizada

```text
✓ dotnet build / dotnet test          0 errores, 90/90
✓ ng build --configuration production  OK. Bundle 1.14 MB → 1.15 MB
✓ Lote válido de 3 eventos             202 {"accepted":3}
✓ Application desconocida              400
✓ Tipo de evento inválido              400 con ProblemDetails y traceId
✓ Lote de 51 eventos                   400
✓ Rate limiting: 70 lotes seguidos     60 aceptados / 10 rechazados con 429
✓ Partición del rate limit             otra sesión sigue en 202
```

**Saneado de PII**, enviando a propósito secretos incrustados:

```text
Enviado                                          Registrado
------------------------------------------------ ---------------------------------
"...token eyJhbGciOiJIUzI1NiJ9.eyJz...abc y      "Fallo con token [REDACTED]
 mail juan.perez@empresa.com"                     y mail [REDACTED]"
"Authorization: Bearer abc123def456"              "Authorization: Bearer [REDACTED]"
properties: { "password": "hunter2" }             (la clave se descarta entera)
```

Ninguno de los cuatro secretos aparece en el log.

**Correlación navegador → API:**

```text
traceparent enviado:  00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
traceId de la API:       4bf92f3577b34da6a3ce929d0e0e4736
=> misma traza
```

Es el objetivo de §32: la traza deja de empezar en la API y arranca en el navegador.

### E.6 Lo que queda

```text
A9   Secreto JWT commiteado en appsettings.json y docker-compose.yml
A17  Paquete Redis referenciado sin usar
A18  Dos Dockerfiles de backend con configuraciones distintas

§20  Auditoría persistida (tabla AuditLog + interceptor)   → Fase 5
§23  Catálogo completo de analytics                        → Fase 6
§26  Dashboards y §27 alertas                              → Fase 7

Los `console.*` que quedan en la aplicación no se tocaron: ahora conviven con la
telemetría y siguen siendo útiles en desarrollo. Los errores que importan ya salen
por el ErrorHandler y por el interceptor.
```

---

## Anexo F — Registro de las Fases 4 y 5 ejecutadas

**Fechas:** plataforma 2026-08-28, auditoría 2026-08-29.

### F.1 Fase 4 — Plataforma

Cinco servicios en el `docker-compose.yml`, bajo el perfil `observability`:

```text
docker compose up -d                          solo la aplicación
docker compose --profile observability up -d  aplicación + plataforma
```

| Servicio | Rol |
| --- | --- |
| `otel-collector` | Recibe OTLP y reparte: trazas a Tempo, métricas expuestas para Prometheus |
| `tempo` | Trazas, retención 7 días (§25) |
| `loki` + `promtail` | Logs. Promtail los lee por la API de Docker, sin cambiar el logging driver |
| `prometheus` | Métricas, retención 90 días. Scrapea al Collector, no a la API |
| `grafana` | Puerto 3000, con datasources y dashboards versionados en `observability/` |

**Correlación entre señales.** Es lo que da valor al conjunto:

```text
log  → traza    derived field del datasource de Loki sobre "traceId"
traza → logs    tracesToLogsV2 mapeando service.name → service_name
```

Para que ese segundo salto funcione, los contenedores declaran su identidad OTel
con la etiqueta de Docker `observability.service.name` y Promtail la convierte en
el label `service_name` de Loki. Sin eso el span decía `timetracker-api` y el log
decía `backend`, y Grafana no encontraba nada.

**Dashboards.** `API Overview`, `Negocio y Frontend` y `Auditoría`. Las consultas
usan nombres de métrica verificados contra Prometheus, no supuestos: el exportador
del Collector agrega la unidad al nombre (`timetracker_users_logged_in_logins_total`,
`timetracker_web_vital_milliseconds`).

**Dos ajustes que salieron de usarlos de verdad:**

```text
Exportación cada 60 s   El valor por defecto del SDK hacía que un pico de errores
                        tardara más de un minuto en verse y pareciera que el panel
                        estaba roto. OTEL_METRIC_EXPORT_INTERVAL pasa a 15 s.

increase() extrapola    Un contador entero producía "5,3 logins fallidos".
                        Los paneles de conteo van envueltos en round().

$__interval corto       Con scrape cada 15 s, increase($__interval) puede caer en
                        ventanas donde Prometheus no tiene dos muestras y no
                        devuelve NINGUNA serie: el panel queda vacío en vez de
                        mostrar ceros. Los paneles de barras fijan interval: 1m.
```

### F.2 Fase 5 — Auditoría

**`AuditLog`** (`Data/Models/AuditLog.cs`) con los campos de §20.2: quién, cuándo,
qué entidad, qué cambió, valores anteriores y nuevos en `jsonb`, `TraceId`,
aplicación e IP. No hereda de `BaseEntity` a propósito: no es una entidad de
dominio, no se borra por soft-delete y no debe auditarse a sí misma.

**`AuditSaveChangesInterceptor`** (`Data/Interceptors/`). Se eligió un interceptor
sobre el `ChangeTracker` y no llamadas desde los servicios porque así ninguna
operación se puede olvidar de auditar: todo lo que pase por `SaveChanges` queda
registrado, venga de donde venga.

Trabaja **en dos fases**: las modificaciones y bajas se registran dentro de la
misma transacción, y las altas se completan justo después. La razón es que la
clave primaria de una entidad nueva no existe hasta que EF guarda — registrarlas
antes dejaba `EntityId` en 0 y el JSON con el temporal negativo de EF
(`-2147482644`). Por eso el interceptor es **scoped**: mantiene estado entre fases.

Garantías que impone:

```text
No audita secretos      PasswordHash, Token, Secret y similares nunca se serializan
No se audita a sí misma
No registra ruido       un Modified sin cambios reales no genera entrada
Nunca rompe el negocio  un fallo escribiendo auditoría no propaga excepción
Soft-delete como baja   IsDeleted = true se registra con Action = "Delete"
```

**Sin migración de EF Core.** La aplicación crea el esquema con
`Database.EnsureCreated()`, no con migraciones, y la única migración del
repositorio ya estaba desfasada del modelo: generar una nueva producía un diff con
cambios no relacionados (`AlterColumn` sobre `TimeEntries`, `AddColumn ProjectId`)
y advertencia de posible pérdida de datos. La tabla se crea sola al recrear la base.

**Dashboard de auditoría** (Dashboard 7 de §26). Consulta la tabla directamente con
un datasource de PostgreSQL: la auditoría es un registro de negocio con retención
propia, no telemetría operacional, y no tiene sentido meterla en Loki.

> Detalle del aprovisionamiento: Grafana solo interpola `$VAR`; la sintaxis de bash
> `${VAR:-valor}` se pasa literal y la conexión falla con *"no PostgreSQL user name
> specified in startup packet"*.

### F.3 Verificación realizada

```text
✓ dotnet build / dotnet test        0 errores, 92/92
✓ EnsureCreated crea AuditLogs      jsonb en los valores, 5 índices
✓ Create / Update / Delete          registrados con EntityId real (no 0)
✓ ChangedColumns                    "Name,UpdatedAt" en la edición
✓ Soft-delete                       IsDeleted=true → Action "Delete"
✓ UserId, CompanyId, IpAddress      poblados desde la request
✓ Operaciones del seeder            quedan sin UserId, como corresponde
✓ Datasource de PostgreSQL          Create: 37, Update: 2, Delete: 1
```

**Secretos.** Se ejercitó el caso más sensible, un cambio de contraseña:

```text
Action=Update  EntityType=User  ChangedColumns=UpdatedAt,UpdatedBy
```

El cambio de `PasswordHash` no aparece. Una búsqueda por `password`, `hash` o el
prefijo de bcrypt sobre toda la tabla devuelve **0 coincidencias**.

**Correlación de §21**, el objetivo de la fase. Un único `TraceId` une las tres señales:

```text
TraceId 4692eb964e41ece7e015746ef1197c2a

  Tempo        POST api/project + 3 spans de Npgsql
  Loki         HTTP POST /api/project responded 201
  AuditLogs    Create | Project | EntityId 6 | UserId 1
```

Responde primero "¿quién creó ese proyecto?" y después "¿qué ocurrió técnicamente
durante esa operación?".

### F.4 Lo que queda

```text
Fase 6  Analytics: catálogo de eventos de uso y su almacenamiento
Fase 7  SLOs, reglas de alerta, canales de notificación y runbooks
A9      Secreto JWT commiteado en el repositorio
A17     Paquete Redis referenciado sin usar
A18     Unificar los dos Dockerfiles del backend
        postgres_exporter y cadvisor para las métricas de §10 y §11
        Retención de la auditoría: hoy no se purga (§25)
```

---

## Anexo G — Registro de la Fase 6 ejecutada

**Fecha:** 2026-08-29
**Objetivo:** poder responder *qué venía haciendo el usuario antes del error*, que era el único de los tres recorridos de §32 que todavía no se podía contestar.

### G.1 El hueco que cerró

Antes de esta fase existían solo dos llamadas a `trackEvent` en todo el frontend
—`slow_api_call` y `active_timer_degraded`—, y ninguna era una acción del usuario.
El catálogo de §23 estaba definido en este documento pero sin instrumentar. Se sabía
*en qué ruta* falló, no *cómo llegó ahí*.

Había además un problema de fondo: el backend **contaba** los eventos como métrica
pero no los registraba, así que ni siquiera eran consultables. Una métrica dice
cuántos; para reconstruir una sesión hace falta saber quién y en qué orden.

### G.2 Dónde se instrumentó

En los **servicios de Angular**, no en los componentes: es el mismo chokepoint que
se usó para los errores en la Fase 3, y evita tocar los ~25 componentes.

| Evento | Origen |
| --- | --- |
| `page_view` | `TelemetryService`, automático en cada `NavigationEnd`. Incluye la ruta anterior |
| `timer_started`, `timer_stopped`, `manual_entry_created` | `time-entry.service.ts` |
| `company_switched`, `company_created` | `company.service.ts` |
| `project_created` | `project.service.ts` |
| `issue_created`, `issue_assigned`, `issue_status_changed` | `issue.service.ts` |
| `report_viewed` | `reports.service.ts`, con `reportType` y `conRango` como propiedades |
| `theme_changed`, `dark_mode_toggled` | `theme-service.service.ts` |

`report_viewed` lleva el tipo y la presencia de rango como propiedades, de modo que
un solo evento cubre `report_viewed`, `report_type_changed` y `report_range_changed`
del catálogo. `page_view` no está en §23 pero es la miga de pan más barata y la que
más aporta: sin ella no se reconstruye el recorrido.

### G.3 Verificación

Se simuló la sesión de un usuario que termina con un error y se reconstruyó
consultando Loki por `sessionId`:

```text
-  page_view          /dashboard    {"from":"/auth/login"}
-  company_switched   /dashboard    {"companyId":"2"}
-  page_view          /time-entry   {"from":"/dashboard"}
-  timer_started      /time-entry   {"origen":"proyecto"}
-  timer_stopped      /time-entry   {"duracionMin":"94"}
-  page_view          /reports      {"from":"/time-entry"}
-  report_viewed      /reports      {"reportType":"company","conRango":"true"}
X  API 500            /reports      8123 ms
X  TypeError          /reports      Cannot read properties of undefined
```

Nueve eventos en orden: se ve que el usuario cambió de empresa, cargó tiempo y al
abrir el reporte de empresa con rango de fechas la API respondió 500, y que el
frontend además reventó al intentar leer el resultado.

### G.4 Dashboard

Dos paneles nuevos en *Negocio y Frontend*:

```text
Eventos de uso más frecuentes    métrica por event_name
Recorrido de una sesión          variable de texto donde se pega un sessionId
```

El `sessionId` aparece en cualquier error del navegador, así que el camino natural
es: error → copiar sessionId → ver el recorrido completo.

### G.5 Nota sobre privacidad

Los eventos no llevan identificadores personales. `company_switched` registra el id
de la empresa, no su nombre; `issue_created` el tipo y la prioridad, no el título.
El saneado del servidor (§17) se aplica igual sobre las propiedades, y el
`sessionId` es un identificador de navegación que no sirve para autorización (§19).
