# 🚀 TimeTracker - Inicio Rápido con Docker

Guía paso a paso para levantar TimeTracker con Docker Compose.

## ✅ Pre-requisitos

- Docker Desktop instalado y corriendo
- Puertos 4200, 5083 y 5432 disponibles

## 📝 Paso a Paso

### 1. Clonar y Configurar

```bash
# Clonar repositorio
cd TimeTracker

# Crear archivo de configuración
cp .env.example .env
```

### 2. Editar Configuración (`.env`)

```env
# Database
DB_PASSWORD=TimeTracker2024!

# Backend - Puerto EXTERNO (para acceder desde tu máquina)
BACKEND_PORT=5083

# Frontend - Puerto EXTERNO
FRONTEND_PORT=4200

# API URL - DEBE usar el puerto EXTERNO del backend
API_URL=http://localhost:5083/api

# JWT
JWT_KEY=tu-clave-secreta-muy-larga-de-al-menos-256-bits

# Seed Database (crear datos de prueba)
SEED_DATABASE=true
```

⚠️ **IMPORTANTE:** `API_URL` debe usar `localhost` (o tu IP) y el puerto EXTERNO (5083).
❌ NO uses `http://backend:80/api` - el navegador no puede resolverlo.

### 3. Construir e Iniciar

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs (opcional)
docker-compose logs -f
```

### 4. Verificar que Todo Funciona

```bash
# Backend health check
curl http://localhost:5083/health
# Respuesta esperada: {"status":"healthy","timestamp":"..."}

# Frontend
curl http://localhost:4200/health
# Respuesta esperada: healthy

# Ver estado de contenedores
docker-compose ps
# Todos deben estar "Up" y "healthy"
```

### 5. Acceder a la Aplicación

Abre tu navegador:

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:5083
- **Swagger (API docs):** http://localhost:5083/swagger

### 6. Credenciales de Prueba (si SEED_DATABASE=true)

```
Email: admin@example.com
Password: Admin123456
```

## 🔧 Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Ver logs de un servicio
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Detener todo
docker-compose down

# Reconstruir después de cambios
docker-compose build --no-cache
docker-compose up -d
```

## ⚙️ Cambiar Puerto del Backend

Si necesitas usar otro puerto (ej: 8083):

```bash
# 1. Editar .env
nano .env

# Cambiar:
BACKEND_PORT=8083
API_URL=http://localhost:8083/api

# 2. Reconstruir SOLO el frontend (porque API_URL cambió)
docker-compose build --no-cache frontend

# 3. Reiniciar
docker-compose down
docker-compose up -d
```

## 🐛 Problemas Comunes

### Frontend no conecta con Backend

```bash
# 1. Verificar que backend responde
curl http://localhost:5083/health

# 2. Ver logs del backend
docker-compose logs backend

# 3. Verificar .env
cat .env | grep API_URL
cat .env | grep BACKEND_PORT

# 4. Si cambiaste API_URL, reconstruir frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Puerto ya en uso

```bash
# Windows
netstat -ano | findstr :5083

# Linux/Mac
lsof -i :5083

# Solución: Cambiar puerto en .env
```

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs backend
docker-compose logs postgres

# Reconstruir sin cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Documentación Adicional

- **Configuración de Puertos:** `CONFIGURACION-PUERTOS.md`
- **Configuración de API URL:** `Frontend/timeTrackerApp/CONFIGURACION-API.md`
- **Docker Completo:** `DOCKER.md`
- **README Principal:** `README.md`

## 🔄 Actualizar Código

Si haces cambios en el código:

```bash
# Para cambios en backend
docker-compose build backend
docker-compose up -d backend

# Para cambios en frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Para cambios en ambos
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🗑️ Empezar de Cero

```bash
# ADVERTENCIA: Esto elimina TODO (incluyendo datos)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Diagrama de Arquitectura

```
┌──────────────────────────────────────────────┐
│            TU MÁQUINA                        │
│                                              │
│  Navegador                                   │
│      │                                       │
│      ├─► http://localhost:4200              │
│      │         │                             │
│      │         ▼                             │
│      │   ┌─────────────┐                    │
│      │   │  Frontend   │ Puerto 4200:80     │
│      │   │   (Nginx)   │                    │
│      │   └─────────────┘                    │
│      │                                       │
│      └─► http://localhost:5083/api          │
│                │                             │
│                ▼                             │
│          ┌─────────────┐                    │
│          │   Backend   │ Puerto 5083:80     │
│          │  (ASP.NET)  │                    │
│          └──────┬──────┘                    │
│                 │                            │
│                 ▼                            │
│          ┌─────────────┐                    │
│          │  PostgreSQL │ Puerto 5432:5432   │
│          │             │                    │
│          └─────────────┘                    │
│                                              │
└──────────────────────────────────────────────┘
```

---

**TimeTracker** © 2025

💡 **Tip:** Si algo no funciona, revisa los logs con `docker-compose logs -f`
