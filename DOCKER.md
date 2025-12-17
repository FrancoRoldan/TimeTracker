# 🐳 TimeTracker - Guía Completa de Docker

Esta guía proporciona instrucciones detalladas para ejecutar TimeTracker usando Docker y Docker Compose.

---

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Arquitectura de Contenedores](#arquitectura-de-contenedores)
- [Configuración](#configuración)
- [Comandos Principales](#comandos-principales)
- [Gestión de Datos](#gestión-de-datos)
- [Troubleshooting](#troubleshooting)
- [Producción](#producción)
- [Desarrollo](#desarrollo)

---

## Requisitos Previos

### Instalación de Docker

#### Windows
```bash
# Descargar e instalar Docker Desktop
https://www.docker.com/products/docker-desktop/

# Verificar instalación
docker --version
docker-compose --version
```

#### Linux
```bash
# Instalar Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

#### macOS
```bash
# Descargar e instalar Docker Desktop
https://www.docker.com/products/docker-desktop/

# Verificar instalación
docker --version
docker-compose --version
```

### Versiones Requeridas

- Docker Engine: 20.10+
- Docker Compose: 2.0+

---

## Arquitectura de Contenedores

TimeTracker está compuesto por 3 servicios principales:

```
┌─────────────────────────────────────────────┐
│         TimeTracker Application             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌─────────────┐         │
│  │   Frontend   │  │   Backend   │         │
│  │  (Angular)   │◄─┤  (ASP.NET)  │         │
│  │  Port: 4200  │  │  Port: 5083 │         │
│  │   + Nginx    │  └──────┬──────┘         │
│  └──────────────┘         │                │
│                           │                │
│                           ▼                │
│                  ┌─────────────────┐       │
│                  │   PostgreSQL    │       │
│                  │   Port: 5432    │       │
│                  │   Volume: data  │       │
│                  └─────────────────┘       │
│                                             │
│         Network: timetracker-network       │
└─────────────────────────────────────────────┘
```

### Servicios

#### 1. PostgreSQL (postgres)
- **Imagen:** `postgres:16-alpine`
- **Puerto:** 5432
- **Volumen:** `postgres_data` → `/var/lib/postgresql/data/pgdata`
- **Health Check:** `pg_isready` cada 10s
- **Función:** Base de datos principal

#### 2. Backend (backend)
- **Build:** `./Backend/Dockerfile`
- **Puerto:** 5083 → 80 (interno)
- **Imagen base:** `mcr.microsoft.com/dotnet/aspnet:8.0-alpine`
- **Health Check:** HTTP GET `/health` cada 30s
- **Dependencias:** postgres (healthy)
- **Función:** API REST ASP.NET Core

#### 3. Frontend (frontend)
- **Build:** `./Frontend/Dockerfile`
- **Puerto:** 4200 → 80 (interno)
- **Imagen base:** `nginx:alpine`
- **Health Check:** HTTP GET `/health` cada 30s
- **Función:** Aplicación Angular servida por Nginx

---

## Configuración

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Contenido del `.env`:

```env
# ===========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===========================================
DB_PASSWORD=TimeTracker2024!
DB_PORT=5432

# ===========================================
# CONFIGURACIÓN DE BACKEND
# ===========================================
BACKEND_PORT=5083
ASPNETCORE_ENVIRONMENT=Production

# ===========================================
# CONFIGURACIÓN JWT (SEGURIDAD)
# ===========================================
# IMPORTANTE: Cambiar en producción
JWT_KEY=tu-clave-secreta-muy-larga-de-al-menos-256-bits-para-jwt-token-seguro
JWT_ISSUER=TimeTrackerApi
JWT_AUDIENCE=TimeTrackerApp

# ===========================================
# CONFIGURACIÓN DE FRONTEND
# ===========================================
FRONTEND_PORT=4200

# ===========================================
# CONFIGURACIÓN GENERAL
# ===========================================
TIMEZONE=America/Argentina/Buenos_Aires

# Inicializar base de datos con datos de prueba
# Valores: true | false
SEED_DATABASE=false
```

### 2. Archivo docker-compose.yml

El archivo `docker-compose.yml` ya está configurado en la raíz del proyecto.

**Características:**
- Redes aisladas entre servicios
- Health checks automáticos
- Persistencia de datos con volúmenes
- Configuración mediante variables de entorno
- Restart automático (`unless-stopped`)

---

## Comandos Principales

### Iniciar Aplicación

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs durante el inicio
docker-compose up

# Iniciar servicios específicos
docker-compose up -d postgres
docker-compose up -d backend frontend
```

### Verificar Estado

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend

# Ver últimas 100 líneas de logs
docker-compose logs --tail=100

# Ver uso de recursos
docker stats
```

### Detener y Eliminar

```bash
# Detener servicios (mantiene contenedores)
docker-compose stop

# Iniciar servicios detenidos
docker-compose start

# Reiniciar servicios
docker-compose restart

# Reiniciar servicio específico
docker-compose restart backend

# Detener y eliminar contenedores
docker-compose down

# Detener, eliminar contenedores y volúmenes (⚠️ ELIMINA DATOS)
docker-compose down -v

# Detener, eliminar contenedores, volúmenes e imágenes
docker-compose down -v --rmi all
```

### Reconstruir Imágenes

```bash
# Reconstruir todas las imágenes
docker-compose build

# Reconstruir sin usar cache
docker-compose build --no-cache

# Reconstruir imagen específica
docker-compose build backend
docker-compose build frontend

# Reconstruir y reiniciar
docker-compose up -d --build
```

### Acceder a Contenedores

```bash
# Shell del backend
docker-compose exec backend sh

# Shell de PostgreSQL
docker-compose exec postgres sh

# Consola de PostgreSQL
docker-compose exec postgres psql -U timetracker_user -d TimeTracker

# Ver variables de entorno
docker-compose exec backend env
docker-compose exec postgres env
```

---

## Gestión de Datos

### Volúmenes

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar volumen de PostgreSQL
docker volume inspect timetracker_postgres_data

# Ver ubicación del volumen
docker volume inspect timetracker_postgres_data --format '{{ .Mountpoint }}'
```

### Backup de Base de Datos

```bash
# Backup completo
docker-compose exec postgres pg_dump -U timetracker_user TimeTracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup con compresión
docker-compose exec postgres pg_dump -U timetracker_user TimeTracker | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup de esquema solamente
docker-compose exec postgres pg_dump -U timetracker_user --schema-only TimeTracker > schema_backup.sql

# Backup de datos solamente
docker-compose exec postgres pg_dump -U timetracker_user --data-only TimeTracker > data_backup.sql
```

### Restaurar Base de Datos

```bash
# Restaurar desde backup
docker-compose exec -T postgres psql -U timetracker_user TimeTracker < backup.sql

# Restaurar desde backup comprimido
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U timetracker_user TimeTracker

# Restaurar después de recrear base de datos
docker-compose exec postgres dropdb -U timetracker_user TimeTracker
docker-compose exec postgres createdb -U timetracker_user TimeTracker
docker-compose exec -T postgres psql -U timetracker_user TimeTracker < backup.sql
```

### Ejecutar Migraciones

```bash
# Desde el contenedor del backend
docker-compose exec backend dotnet ef database update

# O ejecutar localmente apuntando a la BD en Docker
cd Backend/Data
dotnet ef database update --connection "Host=localhost;Port=5432;Database=TimeTracker;Username=timetracker_user;Password=TimeTracker2024!"
```

---

## Troubleshooting

### Servicios no inician

```bash
# Ver logs detallados
docker-compose logs backend
docker-compose logs postgres

# Verificar configuración
docker-compose config

# Reconstruir sin cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Error: "Connection refused" al Backend

```bash
# Verificar que postgres esté healthy
docker-compose ps

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar postgres
docker-compose restart postgres

# Esperar a que postgres esté ready
docker-compose exec postgres pg_isready -U timetracker_user
```

### Backend no conecta a PostgreSQL

```bash
# Verificar variables de entorno del backend
docker-compose exec backend env | grep ConnectionStrings

# Verificar red
docker network inspect timetracker_timetracker-network

# Probar conexión desde backend a postgres
docker-compose exec backend ping postgres
```

### Frontend muestra error 404

```bash
# Verificar logs de frontend
docker-compose logs frontend

# Verificar que el build se completó correctamente
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Verificar archivos en nginx
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Puerto ya está en uso

```bash
# Cambiar puerto en .env
# Ejemplo: BACKEND_PORT=5084
nano .env

# Reiniciar servicios
docker-compose down
docker-compose up -d
```

### Volumen de datos corrupto

```bash
# Backup de datos si es posible
docker-compose exec postgres pg_dumpall -U timetracker_user > backup_all.sql

# Eliminar volumen corrupto
docker-compose down -v

# Recrear servicios y restaurar datos
docker-compose up -d
docker-compose exec -T postgres psql -U timetracker_user < backup_all.sql
```

### Limpiar todo y empezar de cero

```bash
# ⚠️ ADVERTENCIA: Esto elimina TODOS los datos

# Detener y eliminar todo
docker-compose down -v --rmi all

# Limpiar imágenes huérfanas
docker image prune -a

# Limpiar volúmenes huérfanos
docker volume prune

# Reiniciar desde cero
docker-compose build --no-cache
docker-compose up -d
```

---

## Producción

### Checklist de Seguridad

- [ ] Cambiar `JWT_KEY` a valor único y seguro (256+ bits)
- [ ] Cambiar `DB_PASSWORD` a contraseña compleja
- [ ] Configurar `ASPNETCORE_ENVIRONMENT=Production`
- [ ] No exponer puerto de PostgreSQL (comentar `ports` en docker-compose.yml)
- [ ] Configurar firewall para limitar acceso
- [ ] Habilitar SSL/TLS con certificados
- [ ] Configurar proxy reverso (Nginx/Traefik)
- [ ] Implementar rate limiting
- [ ] Configurar backups automáticos
- [ ] Monitorear logs y recursos

### Configuración Recomendada para Producción

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    # No exponer puerto externamente
    # ports:
    #   - "5432:5432"
    restart: always

  backend:
    restart: always
    environment:
      ASPNETCORE_ENVIRONMENT: Production

  frontend:
    restart: always
```

Ejecutar con:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### SSL/TLS con Nginx

Crear archivo `nginx-ssl.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://frontend:80;
    }

    location /api {
        proxy_pass http://backend:80;
    }
}
```

### Backups Automáticos

Script de backup automático:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T postgres pg_dump -U timetracker_user TimeTracker | gzip > "$BACKUP_DIR/timetracker_$DATE.sql.gz"

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "timetracker_*.sql.gz" -mtime +7 -delete
```

Configurar cron:
```bash
0 2 * * * /path/to/backup.sh
```

---

## Ejecutar Servicios de Forma Independiente

Además de Docker Compose, puedes ejecutar frontend y backend de forma independiente usando sus Dockerfiles dedicados.

### Frontend Standalone

El frontend tiene su propio Dockerfile en `Frontend/timeTrackerApp/Dockerfile`.

#### Usando Scripts (Recomendado)

**Linux/macOS:**
```bash
cd Frontend/timeTrackerApp

# Construir
chmod +x docker-build.sh
./docker-build.sh

# Ejecutar
chmod +x docker-run.sh
./docker-run.sh

# O en puerto diferente
./docker-run.sh 8080
```

**Windows (PowerShell):**
```powershell
cd Frontend/timeTrackerApp

# Construir
.\docker-build.ps1

# Ejecutar
.\docker-run.ps1

# O en puerto diferente
.\docker-run.ps1 -Port 8080
```

#### Manualmente

```bash
cd Frontend/timeTrackerApp

# Construir imagen
docker build -t timetracker-frontend .

# Ejecutar contenedor
docker run -d \
  --name timetracker-frontend \
  -p 4200:80 \
  --restart unless-stopped \
  timetracker-frontend

# Acceder
# http://localhost:4200
```

**Documentación completa:** Ver `Frontend/timeTrackerApp/DOCKER.md`

### Backend Standalone

El backend tiene su Dockerfile en `Backend/Dockerfile`.

```bash
cd Backend

# Construir imagen
docker build -t timetracker-backend .

# Ejecutar contenedor (requiere PostgreSQL)
docker run -d \
  --name timetracker-backend \
  -p 5083:8080 \
  -e ConnectionStrings__DbConnString="Host=host.docker.internal;Port=5432;Database=TimeTracker;Username=timetracker_user;Password=TimeTracker2024!" \
  -e Jwt__Key="tu-clave-secreta-muy-larga" \
  -e Jwt__Issuer="TimeTrackerApi" \
  -e Jwt__Audience="TimeTrackerApp" \
  --restart unless-stopped \
  timetracker-backend

# Acceder a API
# http://localhost:5083/api
```

### Combinar Frontend + Backend Independientes

```bash
# 1. Crear red compartida
docker network create timetracker-network

# 2. PostgreSQL
docker run -d \
  --name timetracker-postgres \
  --network timetracker-network \
  -p 5432:5432 \
  -e POSTGRES_DB=TimeTracker \
  -e POSTGRES_USER=timetracker_user \
  -e POSTGRES_PASSWORD=TimeTracker2024! \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# 3. Backend
docker run -d \
  --name timetracker-backend \
  --network timetracker-network \
  -p 5083:8080 \
  -e ConnectionStrings__DbConnString="Host=timetracker-postgres;Port=5432;Database=TimeTracker;Username=timetracker_user;Password=TimeTracker2024!" \
  timetracker-backend

# 4. Frontend
docker run -d \
  --name timetracker-frontend \
  --network timetracker-network \
  -p 4200:80 \
  timetracker-frontend
```

---

## Desarrollo

### Hot Reload

Para desarrollo con hot reload, ejecutar servicios localmente:

```bash
# Solo iniciar PostgreSQL
docker-compose up -d postgres

# Backend localmente
cd Backend/TimeTracker
dotnet run

# Frontend localmente
cd Frontend/timeTrackerApp
ng serve
```

### Debug del Backend

```bash
# Ejecutar backend en modo debug
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Adjuntar debugger a puerto 5000
```

### Ejecutar Tests

```bash
# Tests del backend
docker-compose exec backend dotnet test

# Tests del frontend
docker-compose exec frontend npm test
```

---

## Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [.NET Docker Hub](https://hub.docker.com/_/microsoft-dotnet)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

---

## Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica la configuración: `docker-compose config`
3. Consulta esta documentación
4. Abre un issue en GitHub

---

**TimeTracker** © 2025 - Documentación de Docker
