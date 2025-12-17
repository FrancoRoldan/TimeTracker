# TimeTracker Frontend - Guía Docker

Esta guía explica cómo ejecutar el frontend de TimeTracker usando Docker de forma independiente.

## 🚀 Inicio Rápido

### Opción 1: Usar Scripts (Recomendado)

#### Linux / macOS

```bash
# Construir la imagen
chmod +x docker-build.sh
./docker-build.sh

# Ejecutar el contenedor
chmod +x docker-run.sh
./docker-run.sh

# O especificar un puerto diferente
./docker-run.sh 8080
```

#### Windows (PowerShell)

```powershell
# Construir la imagen
.\docker-build.ps1

# Ejecutar el contenedor
.\docker-run.ps1

# O especificar un puerto diferente
.\docker-run.ps1 -Port 8080
```

### Opción 2: Comandos Manuales

```bash
# Construir la imagen
docker build -t timetracker-frontend .

# Ejecutar el contenedor
docker run -d \
  --name timetracker-frontend \
  -p 4200:80 \
  --restart unless-stopped \
  timetracker-frontend

# Acceder a la aplicación
# http://localhost:4200
```

## 📋 Requisitos

- Docker Engine 20.10+
- 2GB de RAM disponible
- Puerto 4200 (o el que elijas) disponible

## 🔧 Configuración

### Variables de Entorno

El frontend se conecta al backend a través de la configuración en `environment.ts`. Para cambiar la URL del backend:

1. **Editar antes del build:**
   ```bash
   # Editar src/environments/environment.ts
   baseUrl: "http://tu-backend:5083/api"
   ```

2. **Usar variables de entorno en runtime:**
   ```bash
   docker run -d \
     --name timetracker-frontend \
     -p 4200:80 \
     -e API_URL="http://backend:5083/api" \
     timetracker-frontend
   ```

### Puertos

Por defecto, el contenedor expone el puerto 80 internamente. Puedes mapearlo a cualquier puerto externo:

```bash
# Puerto 4200
docker run -d -p 4200:80 timetracker-frontend

# Puerto 8080
docker run -d -p 8080:80 timetracker-frontend

# Puerto 80 (requiere permisos en Linux)
docker run -d -p 80:80 timetracker-frontend
```

## 🔍 Verificación y Debugging

### Ver Logs

```bash
# Logs en tiempo real
docker logs -f timetracker-frontend

# Últimas 100 líneas
docker logs --tail 100 timetracker-frontend

# Logs con timestamps
docker logs -t timetracker-frontend
```

### Health Check

```bash
# Verificar estado del contenedor
docker ps | grep timetracker-frontend

# Health check manual
curl http://localhost:4200/health

# Inspeccionar health check
docker inspect timetracker-frontend --format='{{.State.Health.Status}}'
```

### Acceso al Contenedor

```bash
# Shell interactivo
docker exec -it timetracker-frontend sh

# Ver archivos servidos
docker exec timetracker-frontend ls -la /usr/share/nginx/html

# Ver configuración de Nginx
docker exec timetracker-frontend cat /etc/nginx/nginx.conf
```

## 🛠️ Gestión del Contenedor

### Comandos Útiles

```bash
# Iniciar
docker start timetracker-frontend

# Detener
docker stop timetracker-frontend

# Reiniciar
docker restart timetracker-frontend

# Eliminar
docker rm -f timetracker-frontend

# Ver recursos utilizados
docker stats timetracker-frontend
```

### Actualizar la Aplicación

```bash
# 1. Reconstruir la imagen
docker build -t timetracker-frontend .

# 2. Detener y eliminar el contenedor actual
docker rm -f timetracker-frontend

# 3. Ejecutar nuevo contenedor
docker run -d --name timetracker-frontend -p 4200:80 timetracker-frontend
```

## 🐛 Troubleshooting

### Problema: Puerto ya en uso

```bash
# Ver qué está usando el puerto
# Linux/macOS
lsof -i :4200

# Windows
netstat -ano | findstr :4200

# Solución: Usar otro puerto
docker run -d -p 8080:80 timetracker-frontend
```

### Problema: El contenedor no inicia

```bash
# Ver logs de error
docker logs timetracker-frontend

# Verificar que la imagen existe
docker images | grep timetracker-frontend

# Reconstruir sin caché
docker build --no-cache -t timetracker-frontend .
```

### Problema: No se conecta al backend

```bash
# Verificar configuración de red
docker inspect timetracker-frontend

# Si backend está en Docker, usar red compartida
docker network create timetracker-network
docker run --network timetracker-network --name backend ...
docker run --network timetracker-network --name frontend ...
```

### Problema: Cambios no se reflejan

```bash
# Limpiar cache de build
docker builder prune

# Reconstruir sin caché
docker build --no-cache -t timetracker-frontend .
```

## 📦 Optimizaciones

### Reducir Tamaño de Imagen

La imagen ya usa multi-stage build y está optimizada (~25MB), pero puedes:

```dockerfile
# Deshabilitar source maps en production
# angular.json
"sourceMap": false
```

### Performance de Nginx

El archivo `nginx.conf` ya incluye:
- Compresión Gzip
- Caché de assets estáticos
- Headers de seguridad
- Health checks

## 🔐 Seguridad

### Headers de Seguridad

El Nginx está configurado con:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`

### HTTPS

Para producción con HTTPS:

```bash
docker run -d \
  --name timetracker-frontend \
  -p 443:443 \
  -v /path/to/certs:/etc/nginx/certs \
  timetracker-frontend
```

Editar `nginx.conf` para agregar:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    ...
}
```

## 🌐 Conectar con Backend

### Backend en localhost

```bash
# Backend NO en Docker
docker run -d -p 4200:80 timetracker-frontend
# Frontend accederá a http://host.docker.internal:5083/api
```

### Backend en Docker (misma red)

```bash
# Crear red
docker network create timetracker-network

# Backend
docker run -d \
  --name timetracker-backend \
  --network timetracker-network \
  -p 5083:8080 \
  timetracker-backend

# Frontend
docker run -d \
  --name timetracker-frontend \
  --network timetracker-network \
  -p 4200:80 \
  timetracker-frontend
```

Editar `environment.ts`:
```typescript
baseUrl: "http://timetracker-backend:8080/api"
```

### Docker Compose (Recomendado)

Ver `docker-compose.yml` en la raíz del proyecto para ejecutar todo el stack.

## 📊 Información de la Imagen

```bash
# Ver tamaño de la imagen
docker images timetracker-frontend

# Inspeccionar capas
docker history timetracker-frontend

# Ver detalles completos
docker inspect timetracker-frontend
```

## 🔄 CI/CD

### GitHub Actions Example

```yaml
name: Build Frontend Docker Image

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          cd Frontend/timeTrackerApp
          docker build -t timetracker-frontend .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker tag timetracker-frontend username/timetracker-frontend:latest
          docker push username/timetracker-frontend:latest
```

## 📚 Recursos Adicionales

- [Documentación de Docker](https://docs.docker.com/)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)
- [Angular Docker Guide](https://angular.io/guide/deployment)

---

**TimeTracker Frontend** © 2025
