# Stage 1: Build Angular application
FROM node:20-alpine AS build

# Build argument for API URL
ARG API_URL=http://localhost:5083/api

# Identidad del despliegue (§29 del plan de observabilidad): viaja dentro del
# bundle y acompaña a cada error y Web Vital que reporta el navegador.
ARG APP_VERSION=unknown
ARG ENV_NAME=Production

WORKDIR /app

# Copy package files
COPY timeTrackerApp/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY timeTrackerApp/ ./

# Replace API_URL in environment.ts before building
RUN echo "==== INICIO CONFIGURACIÓN API URL ====" && \
    echo "🔧 API_URL recibido: ${API_URL}" && \
    echo "📄 Contenido ANTES del reemplazo:" && \
    cat src/environments/environment.ts && \
    echo "" && \
    echo "🔄 Ejecutando reemplazo..." && \
    sed -i.bak "s|API_URL_PLACEHOLDER|${API_URL}|g" src/environments/environment.ts && \
    sed -i "s|APP_VERSION_PLACEHOLDER|${APP_VERSION}|g" src/environments/environment.ts && \
    sed -i "s|ENV_NAME_PLACEHOLDER|${ENV_NAME}|g" src/environments/environment.ts && \
    echo "✅ Contenido DESPUÉS del reemplazo:" && \
    cat src/environments/environment.ts && \
    echo "==== FIN CONFIGURACIÓN API URL ===="

# Build for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/dist/test-app/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
