# TimeTracker Frontend - Standalone Dockerfile
# Este Dockerfile permite ejecutar el frontend de forma independiente
# Uso: docker build -t timetracker-frontend .
#      docker run -p 4200:80 -e API_URL=http://backend:8080/api timetracker-frontend
#
# La config (API_URL, APP_VERSION, ENV_NAME) se inyecta en runtime, no en build-time
# (ver docker-entrypoint.sh): la imagen se buildea una sola vez y sirve para
# cualquier entorno cambiando solo variables de entorno del contenedor.

# ============================================
# Stage 1: Build Angular Application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application source
COPY . .

# Build for production
RUN npm run build -- --configuration production

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from build stage
COPY --from=build /app/dist/timetracker-app/browser /usr/share/nginx/html

# Create health check endpoint
RUN echo "healthy" > /usr/share/nginx/html/health

# Entrypoint: genera assets/env.js con la config de runtime antes de arrancar nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set timezone
ENV TZ=America/Argentina/Buenos_Aires
RUN apk add --no-cache tzdata

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
