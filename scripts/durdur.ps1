$Host.UI.RawUI.WindowTitle = "Admin Paneli - Durdurucu"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================" -ForegroundColor Red
Write-Host "          E-Ticaret Admin Paneli Durdurucu            " -ForegroundColor Red
Write-Host "======================================================" -ForegroundColor Red
Write-Host ""

$baseDir = Split-Path -Parent $PSScriptRoot

# 1. Portlari (5000 ve 3000) kullanan surecleri sonlandirma
Write-Host "[1/3] Backend ve Frontend servisleri sonlandiriliyor..." -ForegroundColor Yellow

$ports = 5000, 3000
foreach ($port in $ports) {
    try {
        $lines = netstat -ano | Select-String ":$port\s"
        foreach ($line in $lines) {
            $parts = ($line.Line.Trim() -split '\s+')
            if ($parts.Length -ge 5 -and $parts[1] -match ":$port$") {
                $procId = [int]$parts[4]
                if ($procId -gt 0 -and $procId -ne $PID) {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "  [OK] Port $port uzerindeki islem sonlandirildi (PID: $procId)." -ForegroundColor Green
                }
            }
        }
    } catch {}
}

# ApiHost surecini sonlandir
Get-Process -Name "ApiHost" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] ApiHost islemi sonlandirildi (PID: $($_.Id))." -ForegroundColor Green
}

# Acilan CMD pencerelerini kapat
try {
    taskkill /FI "WINDOWTITLE eq Admin Paneli - Backend (.NET)*" /T /F >$null 2>&1
    taskkill /FI "WINDOWTITLE eq Admin Paneli - Frontend (Vite)*" /T /F >$null 2>&1
    Write-Host "  [OK] Konsol pencereleri kapatildi." -ForegroundColor Green
} catch {}

Write-Host ""

# 2. Docker Konteynerlerini Durdurma
Write-Host "[2/3] Docker servisleri (PostgreSQL ve PgAdmin) durduruluyor..." -ForegroundColor Yellow
try {
    $dockerCheck = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        docker compose -f (Join-Path $baseDir "docker-compose.yml") stop
        Write-Host "  [OK] Docker konteynerleri guvenle durduruldu." -ForegroundColor Green
    } else {
        Write-Host "  [BILGI] Docker servisi aktif degil." -ForegroundColor Gray
    }
} catch {
    Write-Host "  [UYARI] Docker durdurulurken hata olustu." -ForegroundColor Magenta
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "     [OK] Tum Servisler Basariyla Durduruldu!         " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
