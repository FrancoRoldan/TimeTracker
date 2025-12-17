#!/bin/bash
# TimeTracker Frontend - Docker Run Script
# Ejecuta el contenedor del frontend

set -e

# Variables
IMAGE_NAME="timetracker-frontend"
CONTAINER_NAME="timetracker-frontend"
PORT="${1:-4200}"

# Detener contenedor existente si está corriendo
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️  Stopping existing container..."
    docker stop $CONTAINER_NAME
fi

# Eliminar contenedor existente si existe
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "🗑️  Removing existing container..."
    docker rm $CONTAINER_NAME
fi

echo "🚀 Starting TimeTracker Frontend..."
echo ""

# Run container
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE_NAME:latest

echo ""
echo "✅ Container started successfully!"
echo ""
echo "📍 Application URL: http://localhost:$PORT"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f $CONTAINER_NAME"
echo "  Stop:         docker stop $CONTAINER_NAME"
echo "  Restart:      docker restart $CONTAINER_NAME"
echo "  Remove:       docker rm -f $CONTAINER_NAME"
