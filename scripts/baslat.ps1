$Host.UI.RawUI.WindowTitle = "Admin Paneli - Baslatici"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "          E-Ticaret Admin Paneli Baslatici            " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $PSScriptRoot

# 1. Docker Servisleri
Write-Host "[1/4] Docker veritabani servisleri baslatiliyor..." -ForegroundColor Yellow
try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        docker compose -f (Join-Path $baseDir "docker-compose.yml") up -d
        Write-Host "  [OK] PostgreSQL ve PgAdmin konteynerleri hazir." -ForegroundColor Green
    } else {
        Write-Host "  [UYARI] Docker Desktop calismiyor gibi gorunuyor. PostgreSQL icin Docker'i baslatmaniz gerekebilir." -ForegroundColor Magenta
    }
} catch {
    Write-Host "  [UYARI] Docker calistirilirken bir sorun olustu." -ForegroundColor Magenta
}
Write-Host ""

# 2. Backend (.NET 10 API Host)
Write-Host "[2/4] Backend (.NET 10 Web API) baslatiliyor..." -ForegroundColor Yellow
$backendProject = "backend\src\ApiHost\ApiHost.csproj"
$backendArgs = "/k title Admin Paneli - Backend (.NET) && dotnet run --project `"$backendProject`" --no-launch-profile --urls http://localhost:5000"
Start-Process -FilePath "cmd.exe" -WorkingDirectory $baseDir -ArgumentList $backendArgs
Write-Host "  [OK] Backend ayri bir konsol penceresinde baslatildi (http://localhost:5000)." -ForegroundColor Green
Write-Host ""

# 3. Frontend (React 19 + Vite)
Write-Host "[3/4] Frontend (React 19 + Vite) baslatiliyor..." -ForegroundColor Yellow
$frontendDir = Join-Path $baseDir "frontend"
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "  [*] Frontend bagimliliklari ilk kez yukleniyor, lutfen bekleyin..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -WorkingDirectory $frontendDir -ArgumentList "/c npm install" -Wait
}
$frontendArgs = "/k title Admin Paneli - Frontend (Vite) && npm run dev"
Start-Process -FilePath "cmd.exe" -WorkingDirectory $frontendDir -ArgumentList $frontendArgs
Write-Host "  [OK] Frontend ayri bir konsol penceresinde baslatildi (http://localhost:3000)." -ForegroundColor Green
Write-Host ""

# 4. Tarayiciyi Acma ve Ozet
Write-Host "[4/4] Servisler hazirlaniyor ve tarayici aciliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "       [OK] Tum Servisler Basariyla Baslatildi!       " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  * Frontend Portali  : http://localhost:3000" -ForegroundColor White
Write-Host "  * Backend API Host  : http://localhost:5000" -ForegroundColor White
Write-Host "  * OpenAPI / Swagger : http://localhost:5000/openapi/v1.json" -ForegroundColor White
Write-Host "  * PgAdmin 4 Arayuzu : http://localhost:5050 (admin@ecommerce.com / postgres)" -ForegroundColor White
Write-Host "  * PostgreSQL Portu  : localhost:5433" -ForegroundColor White
Write-Host "======================================================" -ForegroundColor Green
Write-Host "Durdurmak icin 'durdur.bat' dosyasini cift tiklayarak calistirabilirsiniz." -ForegroundColor Gray
Write-Host ""
