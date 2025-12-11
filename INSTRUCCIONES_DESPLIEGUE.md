# Instrucciones de Despliegue - TimeTracker

## 📋 Guía Completa de Despliegue

### Contenido

1. [Despliegue Local](#despliegue-local)
2. [Despliegue en Servidor Linux](#despliegue-en-servidor-linux)
3. [Despliegue con Docker](#despliegue-con-docker)
4. [Configuración de SSL/HTTPS](#configuración-de-sslhttps)
5. [Base de Datos en Producción](#base-de-datos-en-producción)
6. [Monitoreo y Logs](#monitoreo-y-logs)
7. [Backup y Recuperación](#backup-y-recuperación)
8. [Troubleshooting](#troubleshooting)

---

## 🏠 Despliegue Local

### Requisitos Previos

```bash
# Verificar versiones
dotnet --version        # 7.0+
node --version          # 18.0+
npm --version           # 9.0+
```

### Paso 1: Base de Datos

```bash
# Iniciar PostgreSQL
# En Windows (si está instalado como servicio)
# Ya debería estar corriendo

# En Linux
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear BD y usuario
sudo -u postgres psql

postgres=# CREATE DATABASE timetracker;
postgres=# CREATE USER tracker_user WITH PASSWORD 'SecurePass123!';
postgres=# GRANT ALL PRIVILEGES ON DATABASE timetracker TO tracker_user;
postgres=# \q
```

### Paso 2: Backend

```bash
cd Backend/TimeTracker

# Editar appsettings.json
cat appsettings.json
# Actualizar: DbConnString, Jwt:Key

# Restaurar paquetes NuGet
dotnet restore

# Ejecutar migraciones
cd ../Data
dotnet ef database update

# Volver a API
cd ../TimeTracker

# Build
dotnet build -c Release

# Ejecutar
dotnet run --environment Development
# ó en producción
dotnet run --environment Production
```

**Output esperado:**

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5083
```

### Paso 3: Frontend

```bash
cd Frontend/timeTrackerApp

# Instalar dependencias
npm install

# Editar environment.development.ts
# baseUrl = "http://localhost:5083/api"

# Ejecutar servidor de desarrollo
ng serve

# ó build de producción
ng build --configuration production
```

**Output esperado:**

```
✔ Compiled successfully.
⠙ Generating index html...
✔ index html generated.

Initial Chunk Files   | Names         |  Raw Size | Estimated Transfer Size
main-XXXX.js          | main          |   2.5 MB | 450 KB
```

### Acceder a la Aplicación

- **Frontend:** http://localhost:4200
- **Backend (API):** https://localhost:5083/api
- **Swagger (API docs):** https://localhost:5083/swagger

---

## 🐧 Despliegue en Servidor Linux (Ubuntu 22.04)

### Instalación de Dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar .NET runtime
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
sudo chmod +x dotnet-install.sh
./dotnet-install.sh --runtime aspnet --version 7.0 -InstallDir /usr/local/dotnet
sudo ln -s /usr/local/dotnet/dotnet /usr/bin/dotnet

# Verificar instalación
dotnet --version

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar nginx (reverse proxy)
sudo apt install -y nginx
```

### Configuración de PostgreSQL

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear BD
sudo -u postgres psql << EOF
CREATE DATABASE timetracker;
CREATE USER tracker_user WITH PASSWORD 'SecurePass123!';
GRANT ALL PRIVILEGES ON DATABASE timetracker TO tracker_user;
\q
EOF
```

### Deploy Backend

```bash
# Crear carpeta de aplicación
sudo mkdir -p /var/www/timetracker-api
sudo chown $USER:$USER /var/www/timetracker-api

# Clonar/Copiar código
git clone <repo> /var/www/timetracker-api
cd /var/www/timetracker-api/Backend/TimeTracker

# Configurar appsettings.json
cat > appsettings.json << 'EOF'
{
  "ConnectionStrings": {
    "DbConnString": "Host=localhost;Port=5432;Database=timetracker;Username=tracker_user;Password=SecurePass123!"
  },
  "Jwt": {
    "Key": "your-very-long-secret-key-minimum-32-characters-here!!!!",
    "Issuer": "TimeTracker",
    "Audience": "TimeTrackerClient"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
EOF

# Publicar aplicación
cd /var/www/timetracker-api/Backend
dotnet publish -c Release -o /var/www/timetracker-api/published

# Crear servicio systemd
sudo cat > /etc/systemd/system/timetracker-api.service << 'EOF'
[Unit]
Description=TimeTracker API
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=10
User=www-data
WorkingDirectory=/var/www/timetracker-api/published
ExecStart=/usr/bin/dotnet /var/www/timetracker-api/published/TimeTracker.Api.dll
SyslogIdentifier=timetracker-api
Environment="ASPNETCORE_ENVIRONMENT=Production"
Environment="ASPNETCORE_URLS=http://localhost:5083"

[Install]
WantedBy=multi-user.target
EOF

# Habilitar y iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable timetracker-api
sudo systemctl start timetracker-api

# Verificar estado
sudo systemctl status timetracker-api
sudo journalctl -u timetracker-api -n 50 -f
```

### Deploy Frontend

```bash
# Crear carpeta
sudo mkdir -p /var/www/timetracker-web
cd /var/www/timetracker-web

# Clonar/Copiar código
git clone <repo> .

# Configurar environment
cd src/environments
cat > environment.ts << 'EOF'
export const environment = {
  production: true,
  baseUrl: "https://api.timetracker.com/api"
};
EOF

# Build
cd /var/www/timetracker-web/Frontend/timeTrackerApp
npm install
ng build --configuration production

# Copiar archivos a nginx
sudo cp -r dist/test-app/* /var/www/timetracker-web/public
```

### Configuración de Nginx

```bash
# Crear configuración
sudo cat > /etc/nginx/sites-available/timetracker << 'EOF'
# API Backend
upstream timetracker_api {
    server localhost:5083;
}

# Frontend
server {
    listen 80;
    listen [::]:80;
    server_name timetracker.com www.timetracker.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name timetracker.com www.timetracker.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/timetracker.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/timetracker.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend - SPA
    root /var/www/timetracker-web/public;
    index index.html;

    # Archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api {
        proxy_pass http://timetracker_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Logs
    access_log /var/log/nginx/timetracker-access.log;
    error_log /var/log/nginx/timetracker-error.log;
}
EOF

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/timetracker /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remover default si existe

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

### Certificado SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --nginx -d timetracker.com -d www.timetracker.com

# Auto-renovación (automática con certbot)
sudo systemctl enable certbot.timer
```

---

## 🐳 Despliegue con Docker

### Dockerfile Backend

```dockerfile
# Dockerfile (Backend/TimeTracker/)
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

WORKDIR /app

# Copiar solución
COPY TimeTracker.sln .
COPY Core/ Core/
COPY Data/ Data/
COPY TimeTracker/ TimeTracker/

# Build
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:7.0

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 5083

ENV ASPNETCORE_URLS=http://+:5083
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "TimeTracker.Api.dll"]
```

### Dockerfile Frontend

```dockerfile
# Dockerfile (Frontend/timeTrackerApp/)
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Nginx runtime
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/test-app /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: timetracker-db
    environment:
      POSTGRES_DB: timetracker
      POSTGRES_USER: tracker_user
      POSTGRES_PASSWORD: SecurePass123!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tracker_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Backend
  api:
    build:
      context: ./Backend
      dockerfile: TimeTracker/Dockerfile
    container_name: timetracker-api
    environment:
      ConnectionStrings__DbConnString: "Host=postgres;Port=5432;Database=timetracker;Username=tracker_user;Password=SecurePass123!"
      Jwt__Key: "your-very-long-secret-key-minimum-32-characters-here!!!!"
      ASPNETCORE_ENVIRONMENT: Production
    ports:
      - "5083:5083"
    depends_on:
      postgres:
        condition: service_healthy

  # Frontend
  web:
    build:
      context: ./Frontend/timeTrackerApp
      dockerfile: Dockerfile
    container_name: timetracker-web
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro

volumes:
  postgres_data:
```

### Ejecutar con Docker

```bash
# Build y start
docker-compose up --build

# Ver logs
docker-compose logs -f api
docker-compose logs -f web

# Detener
docker-compose down

# Limpiar volúmenes (cuidado!)
docker-compose down -v
```

---

## 🔐 Configuración de SSL/HTTPS

### Generar Certificados Autofirmados (Desarrollo)

```bash
# Crear directorio
mkdir -p ssl

# Generar certificado
openssl req -x509 -newkey rsa:4096 -nodes \
  -out ssl/certificate.crt \
  -keyout ssl/certificate.key \
  -days 365 \
  -subj "/C=MX/ST=Mexico/L=Mexico/O=TimeTracker/CN=localhost"

# Usar en .NET
# Program.cs:
builder.WebHost.UseKestrel(options => {
    options.ListenAnyIP(5083, listenOptions => {
        listenOptions.UseHttps("ssl/certificate.pfx", "password");
    });
});
```

### Renovación Automática de Certificados (Let's Encrypt)

```bash
# Cron job para renovación automática
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
```

---

## 🗄️ Base de Datos en Producción

### Backup Automático

```bash
# Script backup.sh
#!/bin/bash

BACKUP_DIR="/backups/timetracker"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/timetracker_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

pg_dump -U tracker_user -h localhost timetracker > $BACKUP_FILE
gzip $BACKUP_FILE

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Subir a S3 (opcional)
aws s3 cp "$BACKUP_FILE.gz" s3://my-backups/timetracker/
```

### Cron Job para Backup Diario

```bash
# Agregar a crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
```

### Restauración de Backup

```bash
# Restaurar desde archivo
gunzip < /backups/timetracker/timetracker_20231211_020000.sql.gz | \
  psql -U tracker_user -h localhost timetracker

# O directamente
psql -U tracker_user -h localhost timetracker < backup_file.sql
```

---

## 📊 Monitoreo y Logs

### Logs del Backend

```bash
# Ver logs en tiempo real
sudo journalctl -u timetracker-api -n 50 -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/timetracker-access.log
sudo tail -f /var/log/nginx/timetracker-error.log
```

### Monitoreo con Prometheus (Opcional)

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "timetracker-api"
    static_configs:
      - targets: ["localhost:5083"]
    metrics_path: "/metrics"
```

### Health Check

```bash
# Verificar API está activa
curl https://api.timetracker.com/api/health

# Verificar BD
psql -U tracker_user -h localhost -d timetracker -c "SELECT 1"
```

---

## 🔄 Backup y Recuperación

### Plan de Backup

```
Diario:      00:00 - Backup incremental BD
Semanal:     Domingo 02:00 - Backup completo
Mensual:     Primer día 03:00 - Backup completo + archivos
Anual:       01-Enero 04:00 - Backup completo en storage externo
```

### Recuperación de Desastres

```bash
# 1. Verificar última copia de seguridad
ls -la /backups/timetracker/

# 2. Restaurar BD
gunzip < /backups/timetracker/latest.sql.gz | \
  psql -U tracker_user -h localhost timetracker

# 3. Verificar integridad
psql -U tracker_user -h localhost timetracker \
  -c "SELECT COUNT(*) FROM \"User\";"

# 4. Reiniciar servicios
sudo systemctl restart timetracker-api
sudo systemctl restart nginx

# 5. Verificar funcionalidad
curl https://api.timetracker.com/api/health
```

---

## 🆘 Troubleshooting

### Problema: "Connection refused" al BD

```bash
# Verificar PostgreSQL está activo
sudo systemctl status postgresql

# Verificar connection string
# En appsettings.json:
"DbConnString": "Host=localhost;Port=5432;Database=timetracker;Username=tracker_user;Password=SecurePass123!"

# Probar conexión manualmente
psql -h localhost -U tracker_user -d timetracker
```

### Problema: API retorna 500

```bash
# Ver logs detallados
sudo journalctl -u timetracker-api -n 100

# Verificar archivos de configuración
cat /var/www/timetracker-api/published/appsettings.json

# Reiniciar servicio
sudo systemctl restart timetracker-api
```

### Problema: Frontend no se carga

```bash
# Verificar nginx está corriendo
sudo systemctl status nginx

# Ver errores de nginx
sudo tail -f /var/log/nginx/timetracker-error.log

# Probar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

### Problema: Base de datos llena

```bash
# Ver tamaño de BD
psql -U tracker_user -d timetracker -c \
  "SELECT pg_size_pretty(pg_database_size('timetracker'));"

# Ver tablas grandes
psql -U tracker_user -d timetracker -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
   FROM pg_tables
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Vacío (cleanup)
vacuumdb -U tracker_user timetracker
```

### Problema: Certificado SSL expirado

```bash
# Renovar manualmente
sudo certbot renew --force-renewal

# Recargar nginx con nuevo certificado
sudo systemctl reload nginx

# Verificar certificado
openssl x509 -in /etc/letsencrypt/live/timetracker.com/fullchain.pem -text -noout
```

---

## ✅ Checklist de Despliegue

- [ ] Dependencias instaladas (.NET, Node.js, PostgreSQL, nginx)
- [ ] BD creada con usuario y permisos
- [ ] Migraciones ejecutadas (`dotnet ef database update`)
- [ ] `appsettings.json` configurado (DB, JWT:Key)
- [ ] `environment.ts` configurado (API URL)
- [ ] Backend compilado (`dotnet publish -c Release`)
- [ ] Frontend compilado (`ng build --configuration production`)
- [ ] Servicio systemd creado y habilitado
- [ ] Nginx configurado con SSL
- [ ] Certificado SSL válido (Let's Encrypt)
- [ ] CORS configurado correctamente
- [ ] Logs funcionando
- [ ] Backup automático configurado
- [ ] Health check respondiendo
- [ ] Base de datos respaldada
- [ ] Acceso de terceros bloqueado (firewall)
- [ ] Usuarios de test creados
- [ ] Prueba de login exitosa
- [ ] Prueba de registroexitosa
- [ ] Prueba de cronómetro exitosa
- [ ] Monitoreo activado

---

## 📞 Soporte Post-Despliegue

**Problemas comunes y soluciones rápidas:**

1. **API no responde** → Ver logs: `sudo journalctl -u timetracker-api -f`
2. **BD desconectada** → Verificar: `sudo systemctl status postgresql`
3. **Certificado expirado** → Renovar: `sudo certbot renew`
4. **Disco lleno** → Limpiar logs antiguos y backups
5. **Rendimiento lento** → Ver índices de BD: `SELECT * FROM pg_stat_user_indexes;`

---

**Documento generado:** 11 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** Listo para producción

🚀 _¡Despliegue exitoso!_
