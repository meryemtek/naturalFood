$Host.UI.RawUI.WindowTitle = "Admin Paneli - Servis Durumlari"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "               SERVIS DURUMLARI                       " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Docker Konteyner Durumlari:" -ForegroundColor Yellow
docker ps -a --filter "name=modular_admin" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

Write-Host "2. Ag Portlari ve Surec Durumlari:" -ForegroundColor Yellow
$p5000 = netstat -ano | Select-String ":5000\s.*LISTENING"
if ($p5000) {
    Write-Host "  [AKTIF] Backend API Host (Port 5000) calisiyor." -ForegroundColor Green
} else {
    Write-Host "  [KAPALI] Backend API Host (Port 5000) calismiyor." -ForegroundColor Red
}

$p3000 = netstat -ano | Select-String ":3000\s.*LISTENING"
if ($p3000) {
    Write-Host "  [AKTIF] Frontend Vite (Port 3000) calisiyor." -ForegroundColor Green
} else {
    Write-Host "  [KAPALI] Frontend Vite (Port 3000) calismiyor." -ForegroundColor Red
}

$p5433 = netstat -ano | Select-String ":5433\s.*LISTENING"
if ($p5433) {
    Write-Host "  [AKTIF] PostgreSQL Veritabani (Port 5433) aktif." -ForegroundColor Green
} else {
    Write-Host "  [KAPALI] PostgreSQL Veritabani (Port 5433) calismiyor." -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
