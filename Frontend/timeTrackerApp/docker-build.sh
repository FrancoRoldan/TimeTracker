#!/bin/bash
# TimeTracker Frontend - Docker Build Script
# Construye la imagen Docker del frontend

set -e

echo "🐳 Building TimeTracker Frontend Docker Image..."
echo ""

# Variables
IMAGE_NAME="timetracker-frontend"
TAG="${1:-latest}"

# Build
echo "Building image: $IMAGE_NAME:$TAG"
docker build -t "$IMAGE_NAME:$TAG" .

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "Image: $IMAGE_NAME:$TAG"
echo ""
echo "To run the container, use:"
echo "  ./docker-run.sh"
echo ""
echo "Or manually:"
echo "  docker run -d -p 4200:80 --name timetracker-frontend $IMAGE_NAME:$TAG"
