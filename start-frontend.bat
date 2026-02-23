@echo off
echo ===============================================
echo   MonitoraEngine - Instalacao Frontend
echo ===============================================
echo.

cd /d "%~dp0frontend"

echo [1/2] Instalando dependencias...
call npm install

if errorlevel 1 (
    echo.
    echo ERRO na instalacao!
    pause
    exit /b 1
)

echo.
echo [2/2] Iniciando servidor de desenvolvimento...
call npm run dev

pause
