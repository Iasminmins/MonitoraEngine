@echo off
echo ========================================
echo Teste de Conexao Backend + Frontend
echo ========================================
echo.

echo [1/3] Testando Backend...
curl -s http://localhost:8000/health
echo.
echo.

echo [2/3] Testando Metricas...
curl -s http://localhost:8000/metrics
echo.
echo.

echo [3/3] Testando Devices...
curl -s http://localhost:8000/devices
echo.
echo.

echo ========================================
echo Teste concluido!
echo ========================================
pause
