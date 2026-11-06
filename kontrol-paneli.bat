@echo off
chcp 65001 >nul
cd /d "%~dp0"

:menu
cls
echo ======================================================
echo           ADMIN PANELI KONTROL MERKEZI
echo ======================================================
echo.
echo   [1] Projeyi Baslat (Docker + Backend + Frontend + Web)
echo   [2] Projeyi Durdur
echo   [3] Projeyi Yeniden Baslat (Restart)
echo   [4] Servislerin Durumunu Kontrol Et
echo   [5] Sadece Veritabanini Baslat (Docker)
echo   [6] Sadece Veritabanini Durdur (Docker)
echo   [0] Cikis
echo.
echo ======================================================
set /p secim="Lutfen bir islem secin (0-6): "

if "%secim%"=="1" goto baslat
if "%secim%"=="2" goto durdur
if "%secim%"=="3" goto yeniden_baslat
if "%secim%"=="4" goto durum
if "%secim%"=="5" goto db_baslat
if "%secim%"=="6" goto db_durdur
if "%secim%"=="0" exit /b 0
goto menu

:baslat
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\baslat.ps1"
pause
goto menu

:durdur
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\durdur.ps1"
pause
goto menu

:yeniden_baslat
echo Yeniden baslatiliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\durdur.ps1"
timeout /t 2 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\baslat.ps1"
pause
goto menu

:durum
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\durum.ps1"
pause
goto menu

:db_baslat
echo Docker veritabani baslatiliyor...
docker compose up -d
echo [OK] Tamamlandi.
pause
goto menu

:db_durdur
echo Docker veritabani durduruluyor...
docker compose stop
echo [OK] Tamamlandi.
pause
goto menu
