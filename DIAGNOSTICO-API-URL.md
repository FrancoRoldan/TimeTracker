# 🔍 Diagnóstico: Frontend Ignora Variables de API_URL

## Síntoma

El frontend sigue apuntando a `http://localhost:5083` aunque cambies `API_URL` en `.env`.

## 🎯 Causa Raíz

La URL del API se "quema" en el código JavaScript durante el **build**. Si ya construiste la imagen antes, Docker usa **cache** y no reconstruye.

## ✅ Solución Paso a Paso

### Paso 1: Verificar tu `.env`

```bash
# Ver contenido del .env
cat .env

# Debe tener algo como:
# API_URL=http://localhost:8083/api
# o
# API_URL=http://192.168.1.12:8083/api
```

⚠️ **IMPORTANTE:** La URL debe ser accesible desde tu NAVEGADOR, no desde Docker.

### Paso 2: Eliminar Contenedor y Cache Existentes

```bash
# Detener y eliminar contenedor del frontend
docker-compose stop frontend
docker-compose rm -f frontend

# OPCIONAL: Eliminar la imagen vieja para forzar rebuild
docker rmi timetracker-frontend 2>/dev/null || true
```

### Paso 3: Reconstruir SIN CACHE

```bash
# Reconstruir frontend sin usar cache
docker-compose build --no-cache frontend

# OBSERVA LOS LOGS - Deberías ver:
# ==== INICIO CONFIGURACIÓN API URL ====
# 🔧 API_URL recibido: http://localhost:8083/api  (o tu URL)
# 📄 Contenido ANTES del reemplazo:
# ...baseUrl : "API_URL_PLACEHOLDER"...
# ✅ Contenido DESPUÉS del reemplazo:
# ...baseUrl : "http://localhost:8083/api"...
# ==== FIN CONFIGURACIÓN API URL ====
```

### Paso 4: Iniciar Contenedor

```bash
docker-compose up -d frontend
```

### Paso 5: Verificar que Funcionó

```bash
# Opción 1: Ver logs del build anterior
docker-compose logs frontend | grep "API_URL"

# Opción 2: Extraer del código compilado
docker run --rm timetracker-frontend sh -c "cat /usr/share/nginx/html/main*.js" | grep -o 'baseUrl[^}]*'

# Opción 3: Usar el script de test (Windows)
.\test-frontend-build.ps1

# Opción 3: Usar el script de test (Linux/Mac)
chmod +x test-frontend-build.sh
./test-frontend-build.sh
```

## 🧪 Test Manual Completo

### Windows (PowerShell)

```powershell
# 1. Ver tu configuración
Get-Content .env | Select-String "API_URL"

# 2. Limpiar todo
docker-compose down
docker rmi timetracker-frontend

# 3. Construir con logs visibles
docker-compose build --no-cache --progress=plain frontend 2>&1 | Select-String "API_URL"

# 4. Iniciar
docker-compose up -d frontend

# 5. Verificar en el navegador
# Abrir: http://localhost:4200
# F12 → Network tab → Ver requests a /api
```

### Linux / macOS (Bash)

```bash
# 1. Ver tu configuración
grep API_URL .env

# 2. Limpiar todo
docker-compose down
docker rmi timetracker-frontend

# 3. Construir con logs visibles
docker-compose build --no-cache --progress=plain frontend 2>&1 | grep "API_URL"

# 4. Iniciar
docker-compose up -d frontend

# 5. Verificar en el navegador
# Abrir: http://localhost:4200
# F12 → Network tab → Ver requests a /api
```

## 🔬 Diagnóstico Avanzado

### Verificar que environment.ts tiene el placeholder

```bash
# Debe mostrar: baseUrl : "API_URL_PLACEHOLDER"
cat Frontend/timeTrackerApp/src/environments/environment.ts
```

Si NO tiene el placeholder, cámbialo:

```bash
# Restaurar el placeholder
cat > Frontend/timeTrackerApp/src/environments/environment.ts << 'EOF'
// NOTA: Este archivo es modificado en build-time por Docker
export const environment = {
    baseUrl : "API_URL_PLACEHOLDER"
};
EOF
```

### Verificar que docker-compose pasa el ARG

```bash
# Ver la configuración final de docker-compose
docker-compose config | grep -A 5 "frontend:"

# Debe mostrar algo como:
#   build:
#     args:
#       API_URL: http://localhost:8083/api
```

### Verificar el Dockerfile

```bash
# Ver que el Dockerfile tiene el reemplazo
grep -A 5 "Replace API_URL" Frontend/Dockerfile

# Debe mostrar el comando sed con el placeholder
```

## ❓ ¿Sigue sin funcionar?

### Opción 1: Build directo (bypass docker-compose)

```bash
# Build manual pasando el ARG explícitamente
cd Frontend
docker build \
    --build-arg API_URL=http://localhost:8083/api \
    --no-cache \
    --progress=plain \
    -t timetracker-frontend-test \
    .

# Ejecutar
docker run -d -p 4200:80 --name frontend-test timetracker-frontend-test

# Verificar
curl http://localhost:4200/health
```

### Opción 2: Verificar en el navegador

1. Abre http://localhost:4200
2. Abre DevTools (F12)
3. Tab "Network"
4. Recarga la página
5. Busca requests que vayan a `/api`
6. Verifica la URL completa del request

**Ejemplo correcto:**
```
Request URL: http://localhost:8083/api/auth/login
```

**Ejemplo incorrecto:**
```
Request URL: http://localhost:5083/api/auth/login  ← Puerto viejo!
```

### Opción 3: Verificar dentro del contenedor

```bash
# Entrar al contenedor
docker-compose exec frontend sh

# Ver los archivos JavaScript compilados
ls -lh /usr/share/nginx/html/

# Buscar la URL en los archivos
grep -o 'localhost:[0-9]*' /usr/share/nginx/html/*.js

# Salir
exit
```

## 🚨 Errores Comunes

### 1. No reconstruiste después de cambiar .env

```bash
# ❌ Incorrecto
docker-compose up -d frontend

# ✅ Correcto
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### 2. Docker usó cache

```bash
# ❌ Incorrecto (usa cache)
docker-compose build frontend

# ✅ Correcto (sin cache)
docker-compose build --no-cache frontend
```

### 3. API_URL tiene formato incorrecto en .env

```env
# ❌ Incorrecto - Con comillas
API_URL="http://localhost:8083/api"

# ❌ Incorrecto - Sin esquema
API_URL=localhost:8083/api

# ❌ Incorrecto - Nombre de contenedor
API_URL=http://backend:80/api

# ✅ Correcto
API_URL=http://localhost:8083/api

# ✅ Correcto (IP)
API_URL=http://192.168.1.12:8083/api
```

### 4. .env no está en la raíz del proyecto

```bash
# El .env DEBE estar aquí:
TimeTracker/
├── .env           ← AQUÍ
├── docker-compose.yml
├── Frontend/
└── Backend/
```

## 📋 Checklist Final

Antes de pedir ayuda, verifica:

- [ ] El archivo `.env` existe en la raíz del proyecto
- [ ] `API_URL` en `.env` usa `localhost` o una IP (NO nombres de contenedor)
- [ ] `API_URL` en `.env` usa el puerto EXTERNO del backend (ej: 8083)
- [ ] Ejecutaste `docker-compose build --no-cache frontend`
- [ ] Reiniciaste el contenedor: `docker-compose up -d frontend`
- [ ] El backend está corriendo y responde: `curl http://localhost:8083/health`
- [ ] Viste los logs del build y el reemplazo se ejecutó correctamente
- [ ] Limpiaste la cache del navegador (Ctrl+Shift+R)

---

**TimeTracker** © 2025

💡 **Tip:** Si nada funciona, ejecuta `.\test-frontend-build.ps1` (Windows) o `./test-frontend-build.sh` (Linux/Mac) para un diagnóstico automático.
