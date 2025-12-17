# TimeTracker Frontend - Docker Build Script (PowerShell)
# Construye la imagen Docker del frontend

param(
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "🐳 Building TimeTracker Frontend Docker Image..." -ForegroundColor Cyan
Write-Host ""

# Variables
$ImageName = "timetracker-frontend"

# Build
Write-Host "Building image: ${ImageName}:${Tag}" -ForegroundColor Yellow
docker build -t "${ImageName}:${Tag}" .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Image: ${ImageName}:${Tag}" -ForegroundColor White
    Write-Host ""
    Write-Host "To run the container, use:" -ForegroundColor Cyan
    Write-Host "  .\docker-run.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually:" -ForegroundColor Cyan
    Write-Host "  docker run -d -p 4200:80 --name timetracker-frontend ${ImageName}:${Tag}" -ForegroundColor White
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
