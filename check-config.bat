@echo off
echo ===============================================
echo   MonitoraEngine - Validacao de Configuracao
echo ===============================================
echo.

cd /d "%~dp0"

REM Verificar se .env existe
if not exist ".env" (
    echo [ERRO] Arquivo .env nao encontrado!
    echo.
    echo Criando .env a partir do .env.example...
    copy .env.example .env
    echo.
    echo [IMPORTANTE] Edite o arquivo .env e configure sua DATABASE_URL
    echo.
    pause
    exit /b 1
)

REM Verificar se DATABASE_URL esta configurada
findstr /C:"COLOQUE_SUA_SENHA_AQUI" .env >nul
if %errorlevel% equ 0 (
    echo [ERRO] DATABASE_URL nao configurada!
    echo.
    echo Por favor, edite o arquivo .env e configure:
    echo   DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxx.supabase.co:5432/postgres
    echo.
    echo Como obter a Connection String:
    echo   1. Acesse https://supabase.com/dashboard
    echo   2. Abra seu projeto
    echo   3. Va em Settings ^> Database
    echo   4. Copie a Connection String
    echo   5. Substitua [YOUR-PASSWORD] pela sua senha real
    echo.
    notepad .env
    pause
    exit /b 1
)

echo [OK] Arquivo .env configurado!
echo.
pause
