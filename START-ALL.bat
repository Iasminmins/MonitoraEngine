@echo off
echo ========================================
echo MonitoraEngine - Startup (Modo Simples)
echo ========================================
echo.
echo MODO DE DESENVOLVIMENTO:
echo - Backend sem banco de dados
echo - Dados armazenados em memoria
echo - Perfeito para testes rapidos
echo.
echo Este script vai abrir 2 janelas:
echo   1. Backend (FastAPI na porta 8000)
echo   2. Simulador (Gerando telemetria)
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

REM Inicia backend em nova janela
start "MonitoraEngine Backend" cmd /k "cd /d %~dp0backend && run-simple.bat"

REM Aguarda 5 segundos para backend iniciar
echo.
echo Aguardando backend iniciar (5 segundos)...
timeout /t 5 /nobreak >nul

REM Inicia simulador em nova janela
start "MonitoraEngine Simulator" cmd /k "cd /d %~dp0 && start-simulator.bat"

echo.
echo ========================================
echo ✅ Sistema iniciado!
echo ========================================
echo.
echo Janelas abertas:
echo   - Backend: http://localhost:8000
echo   - Simulador: Gerando telemetria
echo.
echo ⚠️  ATENCAO: Dados em memoria (nao persistem)
echo.
echo Para parar: Feche as janelas ou pressione Ctrl+C
echo.
pause
