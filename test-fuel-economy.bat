@echo off
echo ========================================
echo TESTE: ECONOMIA DE COMBUSTIVEL
echo ========================================
echo.

cd /d "%~dp0"

python test_fuel_economy.py

echo.
echo ========================================
echo Pressione qualquer tecla para fechar
pause >nul
