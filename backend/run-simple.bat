@echo off
echo ========================================
echo MonitoraEngine Backend - Modo Simples
echo (Sem banco de dados - apenas memoria)
echo ========================================
echo.

REM Ativa o ambiente virtual
echo [1/3] Ativando ambiente virtual...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERRO: Falha ao ativar ambiente virtual
    pause
    exit /b 1
)
echo OK - Ambiente virtual ativado
echo.

REM Instala dependencias
echo [2/3] Instalando dependencias...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)
echo OK - Dependencias instaladas
echo.

REM Inicia o servidor
echo [3/3] Iniciando servidor FastAPI (modo memoria)...
echo.
echo Servidor rodando em: http://localhost:8000
echo Documentacao API: http://localhost:8000/docs
echo.
echo ⚠️  MODO DE DESENVOLVIMENTO
echo Dados armazenados apenas em memoria (nao persistem)
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000
