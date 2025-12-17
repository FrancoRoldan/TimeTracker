# Configuración de Puertos en TimeTracker

Esta guía explica cómo funcionan los puertos en Docker y cómo configurarlos correctamente.

## 🎯 Concepto Importante: Puerto Interno vs Externo

En Docker, hay DOS puertos que debes entender:

```
Host (tu máquina) : Puerto Contenedor (dentro de Docker)
      EXTERNO     :        INTERNO
```

### Ejemplo

```yaml
ports:
  - "5083:80"
```

- **5083** = Puerto EXTERNO (en tu máquina/host)
- **80** = Puerto INTERNO (dentro del contenedor Docker)

## 🔍 Configuración Actual

### Backend

```yaml
# docker-compose.yml
backend:
  ports:
    - "${BACKEND_PORT:-5083}:80"  # 5083 (externo) : 80 (interno)
  environment:
    ASPNETCORE_URLS: http://+:80   # Escucha en puerto 80 DENTRO del contenedor
```

**¿Qué significa esto?**
- ASP.NET Core escucha en el **puerto 80** DENTRO del contenedor
- Docker mapea el **puerto 5083** de tu máquina al **puerto 80** del contenedor
- Accedes desde tu navegador a: `http://localhost:5083`

### Frontend

```yaml
# docker-compose.yml
frontend:
  ports:
    - "${FRONTEND_PORT:-4200}:80"  # 4200 (externo) : 80 (interno)
```

**¿Qué significa esto?**
- Nginx escucha en el **puerto 80** DENTRO del contenedor
- Docker mapea el **puerto 4200** de tu máquina al **puerto 80** del contenedor
- Accedes desde tu navegador a: `http://localhost:4200`

## ⚙️ Configurar en .env

```env
# Puerto EXTERNO del backend (para acceder desde tu máquina)
BACKEND_PORT=5083

# Puerto EXTERNO del frontend (para acceder desde tu máquina)
FRONTEND_PORT=4200

# URL del API para el frontend (usa el puerto EXTERNO)
API_URL=http://localhost:5083/api
```

## 🌐 ¿Qué URL usa el Frontend?

**IMPORTANTE:** El frontend se ejecuta en el NAVEGADOR del usuario, NO dentro de Docker.

Por lo tanto:
- ✅ `API_URL=http://localhost:5083/api` (correcto - usa puerto externo)
- ✅ `API_URL=http://192.168.1.12:5083/api` (correcto - IP de tu máquina)
- ❌ `API_URL=http://backend:80/api` (incorrecto - el navegador no puede resolver 'backend')

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                        TU MÁQUINA (Host)                        │
│                                                                 │
│  Navegador                                                      │
│     │                                                           │
│     │ 1. http://localhost:4200  ─────────►  Puerto 4200        │
│     │                                            │              │
│     │                                            ▼              │
│     │                              ┌─────────────────────────┐  │
│     │                              │  Frontend Container     │  │
│     │                              │  Nginx en puerto 80     │  │
│     │                              └─────────────────────────┘  │
│     │                                                           │
│     │ 2. XHR: http://localhost:5083/api                        │
│     │                                            │              │
│     │                                            ▼              │
│     │                              ┌─────────────────────────┐  │
│     └────────────────────────────► │  Backend Container      │  │
│                                    │  ASP.NET en puerto 80   │  │
│                                    └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Ejemplos de Configuración

### Escenario 1: Todo en localhost (default)

```env
# .env
BACKEND_PORT=5083
FRONTEND_PORT=4200
API_URL=http://localhost:5083/api
```

```bash
docker-compose up -d
```

Acceder:
- Frontend: http://localhost:4200
- Backend: http://localhost:5083
- Swagger: http://localhost:5083/swagger

### Escenario 2: Backend en puerto 8083

```env
# .env
BACKEND_PORT=8083        # Cambiar puerto externo
FRONTEND_PORT=4200
API_URL=http://localhost:8083/api  # Actualizar URL
```

```bash
docker-compose down
docker-compose build --no-cache frontend  # Reconstruir porque API_URL cambió
docker-compose up -d
```

Acceder:
- Frontend: http://localhost:4200
- Backend: http://localhost:8083

### Escenario 3: Acceso desde otra máquina en la red

```env
# .env (en máquina 192.168.1.12)
BACKEND_PORT=5083
FRONTEND_PORT=80        # Usar puerto 80 para acceso web normal
API_URL=http://192.168.1.12:5083/api
```

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

Acceder desde cualquier máquina en la red:
- Frontend: http://192.168.1.12
- Backend: http://192.168.1.12:5083

## ❌ Errores Comunes

### Error 1: "Connection refused" en el frontend

**Causa:** La URL del API no es accesible desde tu navegador.

**Solución:**
```bash
# Verifica que el backend responde
curl http://localhost:5083/health

# Si no responde, verifica logs
docker-compose logs backend

# Verifica que el puerto está correcto en .env
cat .env | grep BACKEND_PORT
cat .env | grep API_URL
```

### Error 2: Cambié BACKEND_PORT pero sigue sin funcionar

**Causa:** El frontend ya fue compilado con la URL anterior.

**Solución:**
```bash
# Actualiza .env
nano .env
# Cambia: BACKEND_PORT=nuevo_puerto
# Cambia: API_URL=http://localhost:nuevo_puerto/api

# Reconstruye el frontend
docker-compose build --no-cache frontend
docker-compose up -d
```

### Error 3: CORS error

**Causa:** El backend no permite requests desde el origen del frontend.

**Verificar:** El backend ya tiene CORS configurado para permitir cualquier origen (`*`).

**Si el problema persiste:**
```bash
# Verifica los logs del backend
docker-compose logs backend | grep CORS

# Verifica en el navegador (F12 → Console)
# Debería mostrar el error CORS específico
```

### Error 4: "backend: forward host lookup failed"

**Causa:** Usaste `API_URL=http://backend:80/api` (nombre de contenedor).

**Solución:**
```env
# Cambia en .env
API_URL=http://localhost:5083/api  # o tu IP
```

```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 🔧 Troubleshooting Checklist

Si el frontend no conecta con el backend:

- [ ] El backend está corriendo: `docker-compose ps | grep backend`
- [ ] El backend responde: `curl http://localhost:5083/health`
- [ ] El puerto en .env es correcto: `cat .env | grep BACKEND_PORT`
- [ ] La API_URL en .env es correcta: `cat .env | grep API_URL`
- [ ] Reconstruiste el frontend después de cambiar API_URL: `docker-compose build --no-cache frontend`
- [ ] No hay conflicto de puertos: `netstat -ano | findstr :5083` (Windows) o `lsof -i :5083` (Linux/Mac)
- [ ] CORS está habilitado en el backend (ya está configurado)

## 📝 Resumen

1. **Puerto INTERNO (80)**: Usado dentro del contenedor, NO lo cambies
2. **Puerto EXTERNO (5083, 4200)**: Configurado en `.env` con `BACKEND_PORT` y `FRONTEND_PORT`
3. **API_URL**: Debe usar el puerto EXTERNO del backend
4. **Después de cambiar API_URL**: Reconstruir frontend con `docker-compose build --no-cache frontend`

---

**TimeTracker** © 2025
