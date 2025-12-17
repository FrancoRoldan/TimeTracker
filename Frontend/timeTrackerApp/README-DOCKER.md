# TimeTracker Frontend - Docker Quick Start

## 🚀 Inicio Rápido

### Windows (PowerShell)
```powershell
# 1. Construir imagen
.\docker-build.ps1

# 2. Ejecutar contenedor
.\docker-run.ps1

# Aplicación disponible en: http://localhost:4200
```

### Linux / macOS
```bash
# 1. Construir imagen
./docker-build.sh

# 2. Ejecutar contenedor
./docker-run.sh

# Aplicación disponible en: http://localhost:4200
```

## 📋 Comandos Útiles

```bash
# Ver logs
docker logs -f timetracker-frontend

# Reiniciar
docker restart timetracker-frontend

# Detener
docker stop timetracker-frontend

# Eliminar
docker rm -f timetracker-frontend

# Health check
curl http://localhost:4200/health
```

## 🔧 Personalizar Puerto

```bash
# Linux/macOS
./docker-run.sh 8080

# Windows
.\docker-run.ps1 -Port 8080
```

## 📚 Documentación Completa

Ver `DOCKER.md` para documentación detallada incluyendo:
- Configuración avanzada
- Troubleshooting
- Variables de entorno
- Conexión con backend
- Seguridad y HTTPS
- CI/CD

## 🔗 Conectar con Backend

El frontend está configurado para conectarse al backend en `http://localhost:5083/api`.

Si el backend está en Docker:
```bash
# Crear red
docker network create timetracker-network

# Ejecutar backend
docker run -d --name timetracker-backend --network timetracker-network -p 5083:8080 timetracker-backend

# Ejecutar frontend
docker run -d --name timetracker-frontend --network timetracker-network -p 4200:80 timetracker-frontend
```

## ❓ Ayuda

- Documentación completa: `DOCKER.md`
- Guía principal: `../../DOCKER.md`
- Issues: Verificar logs con `docker logs timetracker-frontend`
