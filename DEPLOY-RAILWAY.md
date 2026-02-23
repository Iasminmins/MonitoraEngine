# 🚂 Deploy no Railway - Guia Completo

## Pré-requisitos
1. Conta no GitHub (gratuita): https://github.com
2. Conta no Railway (gratuita): https://railway.app

## Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `MonitoraEngine`
3. Deixe como **Público** (ou Privado se preferir)
4. **NÃO** marque "Add README" (já temos)
5. Clique em **"Create repository"**

## Passo 2: Conectar Repositório Local ao GitHub

Copie o link que aparecer (será algo como: `https://github.com/SEU_USUARIO/MonitoraEngine.git`)

Execute no PowerShell:

```powershell
cd "C:\Prototipo teste\MonitoraEngine"
git remote add origin https://github.com/SEU_USUARIO/MonitoraEngine.git
git branch -M main
git push -u origin main
```

Se pedir login, use suas credenciais do GitHub.

## Passo 3: Deploy no Railway

### 3.1 - Backend

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"**
3. Escolha **"Deploy from GitHub repo"**
4. Autorize o Railway a acessar seu GitHub
5. Selecione o repositório **MonitoraEngine**
6. Railway vai detectar o projeto automaticamente

### 3.2 - Configurar Root Directory

Como temos backend e frontend separados:

1. Clique no serviço criado
2. Vá em **Settings**
3. Em **Root Directory**, coloque: `backend`
4. Em **Build Command**: deixe vazio (Nixpacks detecta automaticamente)
5. Em **Start Command**: `uvicorn main_simple:app --host 0.0.0.0 --port $PORT`

### 3.3 - Variáveis de Ambiente (opcional)

Por enquanto não precisa, pois está usando memória.

### 3.4 - Domínio Público

1. Vá em **Settings** > **Networking**
2. Clique em **Generate Domain**
3. Copie o link (será algo como: `monitoraengine-production.up.railway.app`)

## Passo 4: Deploy do Frontend

1. No dashboard do Railway, clique em **"+ New"**
2. Escolha **"Deploy from GitHub repo"** novamente
3. Selecione o mesmo repositório **MonitoraEngine**
4. Clique em **"Add Service"**

### 4.1 - Configurar Root Directory

1. Clique no serviço do frontend
2. Vá em **Settings**
3. Em **Root Directory**, coloque: `frontend`
4. Em **Build Command**: `npm install && npm run build`
5. Em **Start Command**: `npm start`

### 4.2 - Variáveis de Ambiente do Frontend

1. Vá em **Variables**
2. Adicione:
   ```
   NEXT_PUBLIC_API_URL=https://SEU_BACKEND_URL.up.railway.app
   ```
   (Substitua pelo URL do backend que você copiou antes)

### 4.3 - Gerar Domínio do Frontend

1. Vá em **Settings** > **Networking**
2. Clique em **Generate Domain**
3. Copie o link do frontend

## Passo 5: Testar

Acesse o domínio do frontend e verifique se está funcionando!

## 📊 Arquitetura Final

```
SEU_SIMULADOR (local) 
    ↓
BACKEND (Railway) 
    ↓
FRONTEND (Railway)
    ↓
NAVEGADOR DO USUÁRIO
```

## 💰 Custos

Railway oferece:
- **$5 de crédito grátis por mês**
- Suficiente para 2 serviços pequenos rodando 24/7

## 🔧 Próximos Passos (Opcional)

### Adicionar Banco de Dados PostgreSQL:
1. No Railway, clique **"+ New"** > **"Database"** > **"PostgreSQL"**
2. Copie o `DATABASE_URL`
3. Adicione nas variáveis do backend
4. Mude de `main_simple.py` para `main.py` no start command

### Apontar Simulador para Produção:
```bash
python simulator.py --api-url https://SEU_BACKEND.up.railway.app
```

## ❓ Problemas Comuns

**Erro: "Application failed to respond"**
- Verifique se a porta está correta (`$PORT`)
- Verifique os logs em **Deployments** > **View Logs**

**Erro: "Build failed"**
- Verifique se o `Root Directory` está correto
- Verifique se `requirements.txt` existe no backend
- Verifique se `package.json` existe no frontend

## 📝 Checklist

- [ ] Repositório criado no GitHub
- [ ] Código enviado com `git push`
- [ ] Backend deployado no Railway
- [ ] Domínio do backend gerado
- [ ] Frontend deployado no Railway
- [ ] Variável `NEXT_PUBLIC_API_URL` configurada
- [ ] Domínio do frontend gerado
- [ ] Teste: Frontend carregando
- [ ] Simulador apontando para produção
- [ ] Dados aparecendo no dashboard

---

**Dúvidas?** Me chame que eu te ajudo! 🚀
