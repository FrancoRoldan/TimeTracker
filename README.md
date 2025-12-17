# ⏱️ TimeTracker

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](package.json)
[![.NET Version](https://img.shields.io/badge/.NET-7.0+-512BD4)](https://dotnet.microsoft.com/)
[![Angular Version](https://img.shields.io/badge/Angular-19-DD0031)](https://angular.io/)

Aplicación web moderna para **rastreo de tiempo en proyectos e issues**, diseñada para equipos de desarrollo que necesitan monitorear eficientemente su productividad.

---

## 🎯 Características Principales

- ✅ **Multi-tenant** - Múltiples empresas/equipos en una sola instancia
- ✅ **Rastreo en Tiempo Real** - Cronómetro integrado en vivo
- ✅ **Gestión de Proyectos** - Crear, editar, pausar, completar proyectos
- ✅ **Gestión de Issues** - Tracking de problemas con prioridad y estado
- ✅ **Reportes Avanzados** - Gráficos por usuario, proyecto, período
- ✅ **Autenticación Segura** - JWT + bcrypt
- ✅ **Control de Roles** - Roles por empresa (Admin, Manager, Developer)
- ✅ **Gestión de Usuarios** - CRUD de usuarios por empresa
- ✅ **Interfaz Responsiva** - Diseño moderno con Material Design

---

## 🛠️ Stack Tecnológico

### Backend

- **Framework:** ASP.NET Core 7+
- **ORM:** Entity Framework Core
- **Base de Datos:** PostgreSQL
- **Validación:** FluentValidation
- **Autenticación:** JWT Bearer Tokens
- **Hash de Contraseñas:** Bcrypt

### Frontend

- **Framework:** Angular 19
- **UI Library:** Angular Material 19
- **Lenguaje:** TypeScript 5.5
- **Estado:** RxJS Observables
- **Gráficos:** Chart.js
- **Estilos:** CSS 3 + Material Theming

---

## 📋 Requisitos Previos

### Desarrollo Local

- **.NET SDK 7.0+** - [Descargar](https://dotnet.microsoft.com/download)
- **Node.js 18.x+** - [Descargar](https://nodejs.org/)
- **PostgreSQL 12+** - [Descargar](https://www.postgresql.org/download/)
- **Git** - [Descargar](https://git-scm.com/)

### Docker (Alternativo)

- **Docker Engine 20.10+**
- **Docker Compose 2.0+**

---

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/TimeTracker.git
cd TimeTracker
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos en PostgreSQL
createdb timetracker

# Ejecutar migraciones (desde carpeta Backend)
cd Backend
dotnet ef database update
```

### 3. Setup Backend

```bash
# Restaurar paquetes
dotnet restore

# Ejecutar servidor (en Background/TimeTracker)
cd TimeTracker
dotnet run
```

El API estará disponible en: **http://localhost:5000**

### 4. Setup Frontend

```bash
# En Frontend/timeTrackerApp
npm install

# Ejecutar servidor de desarrollo
ng serve --open
```

La aplicación estará disponible en: **http://localhost:4200**

### 5. Credenciales de Prueba

```
Email: john@acme.com
Contraseña: Admin123!
```

---

## 📁 Estructura del Proyecto

```
TimeTracker/
├── Backend/
│   ├── Core/                    # Servicios de negocio
│   │   ├── Services/
│   │   ├── Security/
│   │   └── Helpers/
│   ├── Data/                    # Modelos y acceso a datos
│   │   ├── Models/
│   │   ├── Configurations/
│   │   ├── Dtos/
│   │   └── Migrations/
│   └── TimeTracker/             # API Principal
│       └── Controllers/
│
├── Frontend/
│   └── timeTrackerApp/
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/        # Autenticación
│       │   │   ├── company/     # Gestión de empresas
│       │   │   ├── project/     # Gestión de proyectos
│       │   │   ├── issue/       # Gestión de issues
│       │   │   ├── time-entry/  # Rastreo de tiempo
│       │   │   ├── reports/     # Reportes
│       │   │   └── shared/      # Componentes compartidos
│       │   └── assets/
│       └── environments/        # Configuración por ambiente
│
└── Documentación/
    ├── README.md                # Este archivo
    ├── INDICE.md                # Índice de documentación
    ├── GUIA_RAPIDA.md           # Setup y referencia rápida
    ├── DOCUMENTACION_COMPLETA.md
    ├── DOCUMENTACION_BACKEND.md
    ├── DOCUMENTACION_FRONTEND.md
    └── INSTRUCCIONES_DESPLIEGUE.md
```

---

## 🔐 Seguridad

- **Autenticación:** JWT Bearer Tokens con refresh token
- **Hash de Contraseñas:** Bcrypt (10 rounds)
- **Validación:** FluentValidation en todos los DTOs
- **CORS:** Configurado por ambiente
- **Multi-tenant:** Aislamiento de datos por CompanyId
- **Headers:** X-Company-Id en cada request autenticado

---

## 📊 Modelos de Datos

### Entidades Principales

```
User (Autenticación)
    ↓
UserCompany (Relación M:N, define rol)
    ↓
├─ Company (Tenant)
│   ├─ Project
│   │   └─ TimeEntry
│   │   └─ Issue
│   │       └─ TimeEntry
```

**Modelos:**

- **User** - Identidad de usuario
- **Company** - Tenant/Empresa
- **Project** - Proyecto dentro de empresa
- **Issue** - Issue/Problema dentro de proyecto
- **TimeEntry** - Entrada de tiempo (vinculada a Issue O Project)
- **UserCompany** - Relación usuario-empresa con rol

---

## 🔌 API REST Principales

### Autenticación

```bash
POST   /api/auth/register          # Registrar usuario
POST   /api/auth/login             # Iniciar sesión
POST   /api/auth/refresh           # Refrescar token
```

### Empresas

```bash
GET    /api/companies              # Listar empresas
POST   /api/companies              # Crear empresa
GET    /api/companies/{id}         # Obtener empresa
PUT    /api/companies/{id}         # Actualizar empresa
DELETE /api/companies/{id}         # Eliminar empresa
```

### Proyectos

```bash
GET    /api/projects               # Listar proyectos
POST   /api/projects               # Crear proyecto
PUT    /api/projects/{id}          # Actualizar proyecto
DELETE /api/projects/{id}          # Eliminar proyecto
```

### Issues

```bash
GET    /api/issues                 # Listar issues
POST   /api/issues                 # Crear issue
PUT    /api/issues/{id}            # Actualizar issue
DELETE /api/issues/{id}            # Eliminar issue
```

### Rastreo de Tiempo

```bash
GET    /api/timeentries            # Listar entradas de tiempo
POST   /api/timeentries            # Crear entrada
PUT    /api/timeentries/{id}       # Actualizar entrada
DELETE /api/timeentries/{id}       # Eliminar entrada
```

### Reportes

```bash
GET    /api/reports/user           # Reporte por usuario
GET    /api/reports/project        # Reporte por proyecto
GET    /api/reports/summary        # Reporte resumido
```

---

## 💻 Desarrollo

### Construcción

```bash
# Backend - Release
cd Backend/TimeTracker
dotnet build -c Release

# Frontend - Production
cd Frontend/timeTrackerApp
ng build --configuration production
```

### Testing

```bash
# Backend (si existen tests)
cd Backend
dotnet test

# Frontend (si existen tests)
cd Frontend/timeTrackerApp
ng test
```

### Linting

```bash
# Frontend
cd Frontend/timeTrackerApp
ng lint
```

---

## 🐳 Docker & Docker Compose

**🚀 Guía Rápida:** Ver `INICIO-RAPIDO-DOCKER.md` para un tutorial paso a paso.

### Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+

### Configuración Inicial

1. Crear archivo de variables de entorno:

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus valores
nano .env
```

2. **IMPORTANTE - Configurar API_URL:** El frontend necesita saber dónde está el backend. Esta URL debe ser accesible desde tu navegador:

```env
# Para acceso local
API_URL=http://localhost:5083/api

# Para acceso en red local (reemplaza con tu IP)
API_URL=http://192.168.1.10:5083/api

# Para producción
API_URL=https://api.tudominio.com/api
```

⚠️ **NO uses nombres de contenedores Docker** (ej: `http://backend:80/api`) - el navegador no puede resolverlos.

3. Variables de entorno disponibles (`.env`):

```env
# Database
DB_PASSWORD=TimeTracker2024!
DB_PORT=5432

# Backend
BACKEND_PORT=5083
BACKEND_HOST=localhost
ASPNETCORE_ENVIRONMENT=Production

# JWT
JWT_KEY=tu-clave-secreta-muy-larga-de-al-menos-256-bits
JWT_ISSUER=TimeTrackerApi
JWT_AUDIENCE=TimeTrackerApp

# Frontend
FRONTEND_PORT=4200

# API URL (configuración build-time del frontend)
API_URL=http://localhost:5083/api

# Timezone
TIMEZONE=America/Argentina/Buenos_Aires

# Seed Database
SEED_DATABASE=false
```

**📖 Más información sobre configuración de API_URL:** Ver `Frontend/timeTrackerApp/CONFIGURACION-API.md`

### Ejecutar con Docker Compose

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Construir sin usar cache (útil después de cambios)
docker-compose build --no-cache

# Iniciar servicios específicos
docker-compose up -d postgres backend

# Verificar estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Detener servicios
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar contenedores + volúmenes (⚠️ elimina datos)
docker-compose down -v
```

⚠️ **Importante:** Si cambias `API_URL` en `.env`, debes reconstruir el frontend:

```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Arquitectura de Servicios

El `docker-compose.yml` configura 3 servicios:

| Servicio   | Puerto    | URL                       | Health Check                  | Descripción                    |
| ---------- | --------- | ------------------------- | ----------------------------- | ------------------------------ |
| postgres   | 5432      | localhost:5432            | `pg_isready`                  | Base de datos PostgreSQL 16    |
| backend    | 5083      | http://localhost:5083     | http://localhost:5083/health  | API ASP.NET Core               |
| frontend   | 4200      | http://localhost:4200     | http://localhost:4200/health  | Angular App con Nginx          |

### Volúmenes Persistentes

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar volumen de PostgreSQL
docker volume inspect timetracker_postgres_data

# Backup de base de datos
docker-compose exec postgres pg_dump -U timetracker_user TimeTracker > backup.sql

# Restaurar base de datos
docker-compose exec -T postgres psql -U timetracker_user TimeTracker < backup.sql
```

### Salud de Servicios (Health Checks)

Todos los servicios incluyen health checks:

```bash
# Ver estado de health checks
docker inspect timetracker-backend --format='{{.State.Health.Status}}'
docker inspect timetracker-frontend --format='{{.State.Health.Status}}'
docker inspect timetracker-postgres --format='{{.State.Health.Status}}'
```

### Acceso a Contenedores

```bash
# Acceder a shell del backend
docker-compose exec backend sh

# Acceder a PostgreSQL
docker-compose exec postgres psql -U timetracker_user -d TimeTracker

# Ver variables de entorno del backend
docker-compose exec backend env
```

### Solución de Problemas

#### Servicios no inician

```bash
# Ver logs detallados
docker-compose logs backend
docker-compose logs postgres

# Reconstruir imágenes
docker-compose build --no-cache
docker-compose up -d
```

#### Error de conexión a base de datos

```bash
# Verificar que postgres esté healthy
docker-compose ps

# Reiniciar servicio de base de datos
docker-compose restart postgres

# Verificar logs de postgres
docker-compose logs postgres
```

#### Cambios en código no se reflejan

```bash
# Reconstruir imagen específica
docker-compose build backend
docker-compose up -d backend

# O reconstruir todo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Frontend no conecta con Backend

```bash
# 1. Verificar que backend responde
curl http://localhost:5083/health

# 2. Verificar API_URL en .env
cat .env | grep API_URL

# 3. Si cambiaste API_URL, reconstruir frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**📖 Más información:** Ver `CONFIGURACION-PUERTOS.md` para entender cómo funcionan los puertos.

### Entornos de Desarrollo vs Producción

#### Desarrollo (con hot-reload)

Para desarrollo local, es recomendable ejecutar backend y frontend directamente:

```bash
# Backend
cd Backend/TimeTracker
dotnet run

# Frontend
cd Frontend/timeTrackerApp
ng serve
```

#### Producción

Para producción, usar Docker Compose con las siguientes consideraciones:

1. Cambiar `ASPNETCORE_ENVIRONMENT=Production` en `.env`
2. Usar un JWT_KEY seguro y único
3. Configurar DB_PASSWORD complejo
4. Considerar usar un proxy reverso (Nginx/Traefik) adicional
5. Configurar SSL/TLS con certificados
6. Limitar puertos expuestos solo a los necesarios

### Dockerfile Multi-Stage

Los Dockerfiles utilizan builds multi-stage para optimizar tamaño:

**Backend:**
- Stage 1 (build-env): SDK para compilar
- Stage 2 (final): Runtime Alpine (imagen pequeña)
- Tamaño final: ~150MB

**Frontend:**
- Stage 1 (build): Node para compilar Angular
- Stage 2 (final): Nginx Alpine para servir
- Tamaño final: ~25MB

### Red Docker

Los servicios comparten una red bridge (`timetracker-network`) que permite:

- Resolución DNS por nombre de servicio
- Aislamiento de red
- Comunicación inter-contenedores segura

### URLs de Acceso

Después de ejecutar `docker-compose up -d`:

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5083
- **PostgreSQL**: localhost:5432

### Monitoreo

```bash
# Uso de recursos
docker stats

# Logs de todos los servicios
docker-compose logs --tail=100 -f

# Inspeccionar configuración de un servicio
docker-compose config
```

### Ejecutar Servicios Independientes

También puedes ejecutar **solo el frontend** o **solo el backend** usando sus Dockerfiles dedicados:

#### Frontend Standalone

```bash
cd Frontend/timeTrackerApp

# Linux/macOS
./docker-build.sh && ./docker-run.sh

# Windows PowerShell
.\docker-build.ps1; .\docker-run.ps1

# Manual
docker build -t timetracker-frontend .
docker run -d -p 4200:80 --name timetracker-frontend timetracker-frontend
```

**Documentación completa:** `Frontend/timeTrackerApp/DOCKER.md`

#### Backend Standalone

```bash
cd Backend
docker build -t timetracker-backend .
docker run -d -p 5083:8080 --name timetracker-backend timetracker-backend
```

**Más información:** Ver `DOCKER.md` - Sección "Ejecutar Servicios de Forma Independiente"

---

## 📚 Documentación Completa

Este proyecto incluye documentación exhaustiva:

| Documento                                                      | Descripción                         | Leer |
| -------------------------------------------------------------- | ----------------------------------- | ---- |
| [INDICE.md](./INDICE.md)                                       | Índice maestro y mapa de lectura    | 📖   |
| [GUIA_RAPIDA.md](./GUIA_RAPIDA.md)                             | Setup rápido y referencia (25 págs) | 📖   |
| [DOCUMENTACION_COMPLETA.md](./DOCUMENTACION_COMPLETA.md)       | Visión general completa (70 págs)   | 📖   |
| [DOCUMENTACION_BACKEND.md](./DOCUMENTACION_BACKEND.md)         | Backend detallado (80 págs)         | 📖   |
| [DOCUMENTACION_FRONTEND.md](./DOCUMENTACION_FRONTEND.md)       | Frontend detallado (70 págs)        | 📖   |
| [RESUMEN_TECNICO_EJECUTIVO.md](./RESUMEN_TECNICO_EJECUTIVO.md) | Resumen ejecutivo                   | 📖   |
| [INSTRUCCIONES_DESPLIEGUE.md](./INSTRUCCIONES_DESPLIEGUE.md)   | Guía de despliegue completa         | 📖   |

**Total:** 400+ páginas, 50,000+ palabras de documentación

---

## 🧪 Flujos de Negocio Principales

### Flujo 1: Autenticación de Usuario

```
Usuario → Login → Token JWT → Selecciona Empresa → Dashboard
```

### Flujo 2: Rastreo de Tiempo

```
Proyecto/Issue → Iniciar Cronómetro → ⏱️ En Ejecución → Pausar/Detener → Guardar
```

### Flujo 3: Gestión de Proyectos

```
Nueva Empresa → Crear Proyecto → Crear Issues → Asignar Usuarios → Rastrear Tiempo
```

### Flujo 4: Reportes

```
Seleccionar Rango de Fechas → Aplicar Filtros → Generar Gráficos → Exportar (si aplica)
```

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- **C#:** Seguir convenciones Microsoft
- **TypeScript:** Usar ESLint y Prettier
- **Commits:** Mensajes claros y descriptivos
- **Documentación:** Actualizar docs con cambios

---

## 🐛 Reporte de Problemas

Si encuentras un bug, por favor abre una issue describiendo:

- Qué sucedió
- Pasos para reproducir
- Comportamiento esperado
- Capturas de pantalla (si aplica)
- Tu entorno (SO, versiones, etc.)

---

## 📝 Licencia

Este proyecto está bajo la licencia **MIT**. Ver [LICENSE](./LICENSE) para más detalles.

---

## 👥 Autores

- **Tu Nombre** - Desarrollo y arquitectura
- Contribuidores del equipo

---

## 📞 Soporte

¿Preguntas o problemas?

- 📖 Revisa la [Documentación Completa](./DOCUMENTACION_COMPLETA.md)
- ⚡ Lee la [Guía Rápida](./GUIA_RAPIDA.md)
- 🔧 Consulta [Troubleshooting](./GUIA_RAPIDA.md#troubleshooting)
- 💬 Abre una issue en GitHub

---

## 🚀 Roadmap

### Versión Actual (1.0)

- ✅ Autenticación y autorización
- ✅ CRUD de empresas, proyectos, issues
- ✅ Rastreo de tiempo
- ✅ Reportes básicos
- ✅ Interfaz responsiva

### Futuras Mejoras

- 🔄 Integración con Jira/Azure DevOps
- 🔄 Exportación de reportes (PDF, Excel)
- 🔄 Notificaciones en tiempo real (WebSocket)
- 🔄 Mobile app nativa
- 🔄 Integraciones con Slack/Teams
- 🔄 Análisis de productividad avanzado
- 🔄 Two-factor authentication (2FA)
- 🔄 SSO (Single Sign-On)

---

## 📊 Estadísticas del Proyecto

```
Backend:
  - Líneas de código: ~3,000
  - Servicios: 7
  - Controllers: 6
  - Modelos: 6
  - DTOs: 20+

Frontend:
  - Líneas de código: ~5,000
  - Componentes: 20+
  - Servicios: 6
  - Módulos: 6

Base de Datos:
  - Tablas: 6
  - Relaciones: 8
  - Índices: 10+

Documentación:
  - Documentos: 8
  - Páginas: 400+
  - Palabras: 50,000+
  - Ejemplos código: 150+
```

---

## ⭐ Reconocimientos

Agradecimientos especiales a:

- [Angular Team](https://angular.io/)
- [.NET Team](https://dotnet.microsoft.com/)
- [Entity Framework Team](https://learn.microsoft.com/en-us/ef/)
- [PostgreSQL](https://www.postgresql.org/)

---

## 📅 Última Actualización

**11 de Diciembre de 2025** - Versión 1.0 Completa

---

<div align="center">

### Construido con ❤️ para equipos productivos

⭐ Si te gusta este proyecto, ¡no olvides darle una estrella!

[Ver Documentación Completa](./INDICE.md) • [Reportar Bug](https://github.com/) • [Solicitar Feature](https://github.com/)

</div>

---

## 🔗 Enlaces Útiles

- [Sitio Web](https://example.com)
- [Documentación API](./DOCUMENTACION_BACKEND.md)
- [Guía de Contribución](./CONTRIBUTING.md)
- [Código de Conducta](./CODE_OF_CONDUCT.md)
- [Changelog](./CHANGELOG.md)

---

**TimeTracker** © 2025. Todos los derechos reservados.
