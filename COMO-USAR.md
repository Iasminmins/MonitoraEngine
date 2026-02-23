# MonitoraEngine - Guia Rápido de Uso

## 🚀 Início Rápido (Recomendado)

```bash
# Execute este arquivo (abre 2 janelas automaticamente):
.\START-ALL.bat
```

Isso iniciará:
- **Backend** (modo memória) na porta 8000
- **Simulador** gerando telemetria de 5 devices

## ⚙️ Modos de Operação

### Modo 1: Simples (Sem Banco de Dados) ✅ RECOMENDADO

- ✅ Rápido para iniciar
- ✅ Não precisa configurar nada
- ⚠️ Dados não persistem (apenas em memória)

**Como usar:**
```bash
cd backend
run-simple.bat
```

### Modo 2: Completo (Com PostgreSQL)

- ✅ Dados persistem no banco
- ⚠️ Requer configuração do .env
- ⚠️ Requer banco PostgreSQL rodando

**Como usar:**
```bash
cd backend
run.bat
```

## 🔧 Opções do Simulador

```bash
cd simulator
python simulator.py --devices 10 --interval-ms 500 --city riodejaneiro
```

**Parâmetros:**
- `--devices` → Número de devices (padrão: 5)
- `--interval-ms` → Intervalo entre envios em ms (padrão: 1000)
- `--city` → Cidade: saopaulo | riodejaneiro | brasilia | curitiba
- `--speed-min` → Velocidade mínima km/h (padrão: 40)
- `--speed-max` → Velocidade máxima km/h (padrão: 100)

## 📊 URLs Úteis

- **API:** http://localhost:8000
- **Documentação:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health
- **Devices:** http://localhost:8000/devices
- **Métricas:** http://localhost:8000/metrics

## 🐛 Solução de Problemas

### Erro: "Connection Refused"
**Causa:** Backend não está rodando  
**Solução:** Inicie o backend primeiro, depois o simulador

### Erro: "getaddrinfo failed"
**Causa:** Tentando conectar ao banco de dados PostgreSQL  
**Solução:** Use `run-simple.bat` ao invés de `run.bat`

### Erro: "Port 8000 already in use"
**Causa:** Já existe um processo na porta 8000  
**Solução:** 
```bash
# Windows PowerShell
netstat -ano | findstr :8000
taskkill /PID <numero_do_pid> /F
```

## 📁 Estrutura de Arquivos

```
MonitoraEngine/
├── START-ALL.bat              ← Inicia tudo (modo simples)
├── backend/
│   ├── run-simple.bat         ← Backend sem banco (memória)
│   ├── run.bat                ← Backend com PostgreSQL
│   ├── main_simple.py         ← Código do backend simples
│   └── main.py                ← Código do backend completo
└── simulator/
    └── simulator.py           ← Gerador de telemetria
```

## 🎯 Fluxo de Dados

```
Simulador → Backend API → Memória RAM
   (5 devices)   (porta 8000)   (1000 eventos/device)
```

## 🛑 Como Parar

Pressione `Ctrl+C` em cada janela de terminal aberta.
