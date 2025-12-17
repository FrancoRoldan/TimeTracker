# TimeTracker Frontend - Standalone Dockerfile
# Este Dockerfile permite ejecutar el frontend de forma independiente
# Uso: docker build --build-arg API_URL=http://backend:8080/api -t timetracker-frontend .
#      docker run -p 4200:80 timetracker-frontend

# ============================================
# Stage 1: Build Angular Application
# ============================================
FROM node:20-alpine AS build

# Build argument for API URL (default para desarrollo local)
ARG API_URL=http://localhost:5083/api

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application source
COPY . .

# Replace API_URL in environment.ts before building
RUN echo "==== INICIO CONFIGURACIÓN API URL ====" && \
    echo "🔧 API_URL recibido: ${API_URL}" && \
    echo "📄 Contenido ANTES del reemplazo:" && \
    cat src/environments/environment.ts && \
    echo "" && \
    echo "🔄 Ejecutando reemplazo..." && \
    sed -i.bak "s|API_URL_PLACEHOLDER|${API_URL}|g" src/environments/environment.ts && \
    echo "✅ Contenido DESPUÉS del reemplazo:" && \
    cat src/environments/environment.ts && \
    echo "==== FIN CONFIGURACIÓN API URL ===="

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
COPY --from=build /app/dist/test-app/browser /usr/share/nginx/html

# Create health check endpoint
RUN echo "healthy" > /usr/share/nginx/html/health

# Set timezone
ENV TZ=America/Argentina/Buenos_Aires
RUN apk add --no-cache tzdata

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
