#!/bin/bash
# Script para testear la construcción del frontend con debugging

echo "=========================================="
echo "TEST: Construcción del Frontend"
echo "=========================================="
echo ""

# Leer API_URL del .env
if [ -f .env ]; then
    echo "📄 Leyendo .env..."
    source .env
    echo "   API_URL desde .env: ${API_URL}"
    echo "   BACKEND_PORT desde .env: ${BACKEND_PORT}"
    echo "   BACKEND_HOST desde .env: ${BACKEND_HOST}"
else
    echo "⚠️  Archivo .env no encontrado"
    API_URL="http://localhost:5083/api"
fi

echo ""
echo "=========================================="
echo "Construyendo imagen..."
echo "=========================================="
echo ""

# Construir con el API_URL del .env
docker build \
    --build-arg API_URL="${API_URL}" \
    --no-cache \
    --progress=plain \
    -t timetracker-frontend-test \
    -f Frontend/Dockerfile \
    Frontend/

BUILD_EXIT_CODE=$?

echo ""
echo "=========================================="
echo "Resultado del Build"
echo "=========================================="

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build exitoso"
    echo ""
    echo "Verificando el contenido compilado..."
    echo ""

    # Extraer y buscar la URL en el código compilado
    docker run --rm timetracker-frontend-test sh -c "cat /usr/share/nginx/html/main*.js" | grep -o 'baseUrl[^}]*' | head -1

    echo ""
    echo "Para ejecutar el contenedor:"
    echo "  docker run -d -p 4200:80 --name frontend-test timetracker-frontend-test"
else
    echo "❌ Build falló con código: $BUILD_EXIT_CODE"
fi

echo ""
echo "=========================================="
