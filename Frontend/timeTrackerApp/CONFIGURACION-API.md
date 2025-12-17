# Configuración de URL del Backend API

Este documento explica cómo configurar la URL del backend para el frontend de TimeTracker.

## 🎯 Resumen

El frontend necesita saber dónde está el backend. Esta URL se configura en **build-time** (antes de compilar), no en runtime.

## 📝 Importante: ¿Qué URL usar?

**La URL debe ser accesible desde el NAVEGADOR del usuario, NO desde el contenedor Docker.**

### ❌ Incorrecto
```bash
# NO uses 'backend' o nombres de contenedores Docker
API_URL=http://backend:80/api
```
**Por qué falla:** El navegador del usuario no puede resolver el nombre DNS 'backend'. Eso solo funciona DENTRO de la red Docker.

### ✅ Correcto

**Para acceso local:**
```bash
API_URL=http://localhost:5083/api
```

**Para acceso en red local:**
```bash
API_URL=http://192.168.1.10:5083/api
```

**Para producción:**
```bash
API_URL=https://api.midominio.com/api
```

---

## 🔧 Métodos de Configuración

### 1. Docker Compose (Recomendado)

Edita el archivo `.env`:

```env
# Backend
BACKEND_PORT=5083
BACKEND_HOST=localhost

# API URL (se construye automáticamente)
API_URL=http://localhost:5083/api

# O especifica una URL completa custom
API_URL=http://192.168.1.10:8080/api
```

Luego reconstruye:

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### 2. Build Manual con ARG

```bash
cd Frontend/timeTrackerApp

# Build con URL custom
docker build \
  --build-arg API_URL=http://192.168.1.10:5083/api \
  -t timetracker-frontend .

# Run
docker run -d -p 4200:80 timetracker-frontend
```

### 3. Scripts PowerShell/Bash

**PowerShell:**
```powershell
# Edita el script docker-build.ps1 y agrega:
docker build `
  --build-arg API_URL=http://192.168.1.10:5083/api `
  -t timetracker-frontend .
```

**Bash:**
```bash
# Edita el script docker-build.sh y agrega:
docker build \
  --build-arg API_URL=http://192.168.1.10:5083/api \
  -t timetracker-frontend .
```

---

## 🧪 Verificar la Configuración

### Durante el Build

El Dockerfile mostrará la URL configurada:

```
🔧 Configurando API URL: http://localhost:5083/api
✅ environment.ts configurado:
export const environment = {
    baseUrl : "http://localhost:5083/api"
};
```

### Después del Build

```bash
# Extraer el archivo compilado y verificar
docker run --rm timetracker-frontend cat /usr/share/nginx/html/main.*.js | grep -o 'http://[^"]*api'
```

### En el Navegador

Abre las DevTools del navegador:
1. F12 → Network tab
2. Recarga la página
3. Busca requests que vayan a `/api`
4. Verifica que vayan a la URL correcta

---

## 🔄 Cambiar la URL Después de Construir

**NO es posible.** La URL se "quema" en el código JavaScript compilado.

Para cambiar la URL, debes:

1. Modificar la variable de entorno
2. Reconstruir la imagen
3. Reiniciar el contenedor

```bash
# Docker Compose
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Manual
docker build --build-arg API_URL=nueva-url -t timetracker-frontend .
docker rm -f timetracker-frontend
docker run -d -p 4200:80 --name timetracker-frontend timetracker-frontend
```

---

## 🏗️ Desarrollo Local (sin Docker)

Para desarrollo local con `ng serve`:

Edita `src/environments/environment.development.ts`:

```typescript
export const environment = {
    baseUrl : "http://localhost:5083/api"
};
```

Luego ejecuta:
```bash
ng serve
```

**Angular automáticamente usa `environment.development.ts` en desarrollo.**

---

## 📊 Escenarios Comunes

### Escenario 1: Todo en localhost

```env
# .env
BACKEND_PORT=5083
API_URL=http://localhost:5083/api
FRONTEND_PORT=4200
```

```bash
docker-compose up -d
```

Acceder desde:
- Frontend: http://localhost:4200
- Backend: http://localhost:5083

### Escenario 2: Backend en servidor remoto

```env
# .env
API_URL=http://192.168.1.100:5083/api
FRONTEND_PORT=4200
```

```bash
# Solo construir frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Escenario 3: Producción con dominio

```env
# .env
API_URL=https://api.miapp.com/api
FRONTEND_PORT=80
```

```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Problema: CORS errors

**Síntoma:** `Access to XMLHttpRequest at 'http://...' from origin 'http://...' has been blocked by CORS`

**Solución:** Configurar CORS en el backend para permitir el origen del frontend.

Backend: `Program.cs`
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

### Problema: Network error / ERR_CONNECTION_REFUSED

**Causa:** La URL del API no es accesible desde el navegador.

**Verificar:**
```bash
# Desde tu máquina (no Docker), prueba:
curl http://localhost:5083/api/health
```

**Solución:** Usa la IP o dominio correcto que sea accesible desde el navegador.

### Problema: URL no cambió después de rebuild

**Causa:** Docker usó cache de la capa del build.

**Solución:**
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## 📚 Más Información

- `DOCKER.md` - Guía completa de Docker
- `README.md` - Documentación principal
- `src/environments/` - Archivos de configuración de entorno

---

**TimeTracker** © 2025
