# TimeTracker Frontend - Docker Run Script (PowerShell)
# Ejecuta el contenedor del frontend

param(
    [int]$Port = 4200
)

$ErrorActionPreference = "Stop"

# Variables
$ImageName = "timetracker-frontend"
$ContainerName = "timetracker-frontend"

# Detener contenedor existente si está corriendo
$RunningContainer = docker ps -q -f "name=$ContainerName"
if ($RunningContainer) {
    Write-Host "⚠️  Stopping existing container..." -ForegroundColor Yellow
    docker stop $ContainerName | Out-Null
}

# Eliminar contenedor existente si existe
$ExistingContainer = docker ps -aq -f "name=$ContainerName"
if ($ExistingContainer) {
    Write-Host "🗑️  Removing existing container..." -ForegroundColor Yellow
    docker rm $ContainerName | Out-Null
}

Write-Host "🚀 Starting TimeTracker Frontend..." -ForegroundColor Cyan
Write-Host ""

# Run container
docker run -d `
  --name $ContainerName `
  -p "${Port}:80" `
  --restart unless-stopped `
  "${ImageName}:latest"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Container started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Application URL: http://localhost:$Port" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  View logs:    docker logs -f $ContainerName" -ForegroundColor White
    Write-Host "  Stop:         docker stop $ContainerName" -ForegroundColor White
    Write-Host "  Restart:      docker restart $ContainerName" -ForegroundColor White
    Write-Host "  Remove:       docker rm -f $ContainerName" -ForegroundColor White
} else {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}
