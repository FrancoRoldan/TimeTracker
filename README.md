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
Email: admin@test.com
Contraseña: Admin@123456
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

### Ejecutar con Docker Compose

```bash
# Construir e iniciar
docker-compose up -d

# Verificar servicios
docker-compose ps

# Ver logs
docker-compose logs -f
```

**Servicios:**

- API Backend: http://localhost:5000
- Frontend: http://localhost:80
- PostgreSQL: localhost:5432

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
