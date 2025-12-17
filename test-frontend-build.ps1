# Script para testear la construcción del frontend con debugging

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST: Construcción del Frontend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Leer API_URL del .env
$API_URL = "http://localhost:5083/api"
$BACKEND_PORT = "5083"
$BACKEND_HOST = "localhost"

if (Test-Path .env) {
    Write-Host "📄 Leyendo .env..." -ForegroundColor Yellow
    Get-Content .env | ForEach-Object {
        if ($_ -match "^API_URL=(.*)$") {
            $API_URL = $matches[1]
        }
        if ($_ -match "^BACKEND_PORT=(.*)$") {
            $BACKEND_PORT = $matches[1]
        }
        if ($_ -match "^BACKEND_HOST=(.*)$") {
            $BACKEND_HOST = $matches[1]
        }
    }
    Write-Host "   API_URL desde .env: $API_URL" -ForegroundColor White
    Write-Host "   BACKEND_PORT desde .env: $BACKEND_PORT" -ForegroundColor White
    Write-Host "   BACKEND_HOST desde .env: $BACKEND_HOST" -ForegroundColor White
} else {
    Write-Host "⚠️  Archivo .env no encontrado, usando valores por defecto" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Construyendo imagen..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Construir con el API_URL del .env
docker build `
    --build-arg API_URL="$API_URL" `
    --no-cache `
    --progress=plain `
    -t timetracker-frontend-test `
    -f Frontend/Dockerfile `
    Frontend/

$BUILD_EXIT_CODE = $LASTEXITCODE

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resultado del Build" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($BUILD_EXIT_CODE -eq 0) {
    Write-Host "✅ Build exitoso" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verificando el contenido compilado..." -ForegroundColor Yellow
    Write-Host ""

    # Extraer y buscar la URL en el código compilado
    $output = docker run --rm timetracker-frontend-test sh -c "cat /usr/share/nginx/html/main*.js" 2>$null
    if ($output -match 'baseUrl[^}]*') {
        Write-Host "Encontrado en código compilado:" -ForegroundColor Green
        Write-Host $matches[0] -ForegroundColor White
    } else {
        Write-Host "⚠️  No se pudo extraer baseUrl del código compilado" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Para ejecutar el contenedor:" -ForegroundColor Cyan
    Write-Host "  docker run -d -p 4200:80 --name frontend-test timetracker-frontend-test" -ForegroundColor White
} else {
    Write-Host "❌ Build falló con código: $BUILD_EXIT_CODE" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
