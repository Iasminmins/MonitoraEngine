@echo off
echo ===============================================
echo   MonitoraEngine - Backend
echo ===============================================
echo.

cd /d "%~dp0"

REM Verificar se .env esta configurado
if not exist ".env" (
    echo [ERRO] Arquivo .env nao encontrado!
    echo Execute: check-config.bat primeiro
    pause
    exit /b 1
)

findstr /C:"COLOQUE_SUA_SENHA_AQUI" .env >nul
if %errorlevel% equ 0 (
    echo [ERRO] DATABASE_URL nao configurada no .env!
    echo Execute: check-config.bat para configurar
    pause
    exit /b 1
)

cd backend

if not exist "venv\Scripts\activate.bat" (
    echo [ERRO] Ambiente virtual nao encontrado!
    echo Execute: install-backend.bat primeiro
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo [OK] Iniciando backend em http://localhost:8000
echo Pressione Ctrl+C para parar
echo.

python main.py

pause
