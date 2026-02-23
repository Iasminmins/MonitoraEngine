@echo off
echo ===============================================
echo   MonitoraEngine - Instalacao Backend
echo ===============================================
echo.

cd /d "%~dp0backend"

echo [1/3] Criando ambiente virtual...
python -m venv venv

echo.
echo [2/3] Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo.
echo [3/3] Instalando dependencias...
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERRO na instalacao!
    pause
    exit /b 1
)

echo.
echo ===============================================
echo   Instalacao concluida!
echo   Execute: start-backend.bat para iniciar
echo ===============================================
pause
