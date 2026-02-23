@echo off
echo ========================================
echo MonitoraEngine - Inicializacao Completa
echo ========================================
echo.

REM Verifica se o backend esta rodando
echo [1/2] Verificando backend...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  BACKEND NAO ESTA RODANDO!
    echo.
    echo Por favor, abra outro terminal e execute:
    echo    cd C:\Prototipo teste\MonitoraEngine\backend
    echo    .\run.bat
    echo.
    echo Depois pressione qualquer tecla para continuar...
    pause >nul
    
    REM Tenta verificar novamente
    curl -s http://localhost:8000/health >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Backend ainda nao esta respondendo!
        echo Cancelando inicializacao do simulador.
        pause
        exit /b 1
    )
)
echo ✅ Backend esta rodando
echo.

REM Inicia o simulador
echo [2/2] Iniciando simulador...
cd simulator
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
echo.
echo ========================================
echo Simulador iniciando...
echo ========================================
echo.
python simulator.py --devices 5 --interval-ms 1000 --city saopaulo
