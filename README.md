# 📚 StudyHub

Plataforma de gerenciamento de estudos com bot Discord integrado.  
Cadastre conteúdos, visualize no calendário e receba notificações automáticas no canal certo — sem intervenção manual.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)           GitHub Pages                 │
│  • Calendário mensal               (gratuito)                   │
│  • CRUD de conteúdos                                            │
│  • Gerenciador de matérias                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP (Axios)
┌────────────────────▼────────────────────────────────────────────┐
│  BACKEND (Node.js + Express)       Railway                      │
│  • API REST /api/contents          (gratuito)                   │
│  • API REST /api/subjects                                       │
│  • node-cron → verifica a cada minuto                           │
│  • Dispara notificações no horário exato                        │
└────────────────┬───────────────────┬────────────────────────────┘
                 │ Mongoose          │ Discord Bot API REST
┌────────────────▼──────┐  ┌────────▼────────────────────────────┐
│  MongoDB Atlas        │  │  BOT DISCORD (discord.js)           │
│  (gratuito 512MB)     │  │  • !hoje / !agenda / !provas        │
│  Armazena conteúdos   │  │  • Cria categorias e canais auto    │
│  e matérias           │  │  Railway (mesmo projeto ou separado)│
└───────────────────────┘  └─────────────────────────────────────┘
```

### Fluxo de notificação automática

```
node-cron (todo minuto)
    │
    ▼
getBrasiliaDateTime()  → data + hora atual no fuso UTC-3
    │
    ▼
MongoDB.find({ date, time, sentMain: false })
    │
    ├── Para cada conteúdo encontrado:
    │       └── sendDiscordNotification(canal, embed)
    │               └── Discord Bot API → canal #xxx
    │
    └── Às 08:00 BRT → busca provas de amanhã (sentDayBefore: false)
            └── envia aviso "Prova amanhã!" no canal configurado
```

---

## 📁 Estrutura de Pastas

```
studyhub/
├── frontend/                   # React + Vite → GitHub Pages
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx      # Sidebar + Header
│   │   │   ├── Calendar.jsx    # Calendário mensal (estilo Google)
│   │   │   ├── ContentCard.jsx # Card de conteúdo
│   │   │   └── DayModal.jsx    # Modal de detalhe do dia
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Página principal
│   │   │   ├── ContentForm.jsx # Criar / Editar conteúdo
│   │   │   └── SubjectsPage.jsx# Gerenciar matérias
│   │   ├── styles/             # CSS Modules + global.css
│   │   ├── utils/api.js        # Axios configurado
│   │   ├── App.jsx             # Roteamento
│   │   └── main.jsx            # Ponto de entrada
│   ├── vite.config.js
│   └── package.json
│
├── backend/                    # Node.js + Express → Railway
│   ├── src/
│   │   ├── models/
│   │   │   ├── Content.js      # Schema do conteúdo
│   │   │   └── Subject.js      # Schema da matéria
│   │   ├── controllers/
│   │   │   ├── contentController.js
│   │   │   └── subjectController.js
│   │   ├── routes/
│   │   │   ├── contentRoutes.js
│   │   │   └── subjectRoutes.js
│   │   ├── services/
│   │   │   ├── scheduler.js    # ⭐ Núcleo das notificações automáticas
│   │   │   └── discordNotifier.js # Envia embeds via Bot API
│   │   └── server.js           # Ponto de entrada
│   └── package.json
│
└── bot/                        # discord.js → Railway
    ├── src/
    │   ├── commands/
    │   │   ├── hoje.js         # !hoje
    │   │   ├── agenda.js       # !agenda
    │   │   ├── provas.js       # !provas
    │   │   └── ajuda.js        # !ajuda
    │   ├── events/
    │   │   ├── ready.js        # Setup do servidor
    │   │   └── messageCreate.js# Despachador de comandos
    │   ├── services/
    │   │   └── setupServer.js  # Cria categorias e canais
    │   ├── utils/api.js        # HTTP helper para o backend
    │   └── index.js            # Ponto de entrada
    └── package.json
```

---

## ⚙️ Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9
- Conta gratuita no [MongoDB Atlas](https://cloud.mongodb.com)
- Conta gratuita no [Railway](https://railway.app)
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)
- Conta no [GitHub](https://github.com) (para o Pages)

---

## 🚀 Execução Local

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/studyhub.git
cd studyhub
```

### 2. Configure o Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais
npm install
npm run dev
# Rodando em http://localhost:3001
```

Variáveis obrigatórias no `.env`:
```env
PORT=3001
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/studyhub
DISCORD_BOT_TOKEN=seu_token
DISCORD_GUILD_ID=id_do_servidor
FRONTEND_URL=http://localhost:5173
```

### 3. Configure o Bot

```bash
cd ../bot
cp .env.example .env
# Edite o .env
npm install
npm start
```

Variáveis obrigatórias no `.env`:
```env
DISCORD_BOT_TOKEN=seu_token
DISCORD_GUILD_ID=id_do_servidor
BACKEND_URL=http://localhost:3001
```

### 4. Configure o Frontend

```bash
cd ../frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001 (padrão em dev — pode deixar em branco)
npm install
npm run dev
# Rodando em http://localhost:5173
```

---

## 🤖 Criando o Bot Discord

1. Acesse [discord.com/developers/applications](https://discord.com/developers/applications)
2. Clique **New Application** → nomeie como "StudyHub"
3. Vá em **Bot** → clique **Add Bot**
4. Em **Privileged Gateway Intents**, ative:
   - ✅ `MESSAGE CONTENT INTENT`
   - ✅ `SERVER MEMBERS INTENT`
5. Copie o **Token** → coloque em `DISCORD_BOT_TOKEN`
6. Gere o link de convite em **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Manage Channels`, `Read Message History`
7. Acesse o link gerado e adicione o bot ao seu servidor
8. Clique com o botão direito no servidor → **Copiar ID** → coloque em `DISCORD_GUILD_ID`

> ⚠️ Para copiar IDs, ative o **Modo Desenvolvedor** em Configurações → Avançado → Modo Desenvolvedor.

---

## 🌐 Deploy em Produção

### Backend + Bot → Railway

O Railway pode hospedar múltiplos serviços a partir de um único repositório.

#### Passo a passo

1. Acesse [railway.app](https://railway.app) e faça login com GitHub
2. Clique **New Project → Deploy from GitHub Repo**
3. Selecione o repositório `studyhub`
4. Railway detecta automaticamente os serviços; configure dois separados:

**Serviço 1 — Backend:**
- Root Directory: `/backend`
- Start Command: `npm start`
- Variáveis de ambiente:
  ```
  PORT=3001
  MONGODB_URI=...
  DISCORD_BOT_TOKEN=...
  DISCORD_GUILD_ID=...
  FRONTEND_URL=https://SEU_USUARIO.github.io/studyhub
  ```
- Após criar, copie a URL pública gerada (ex: `https://studyhub-backend.up.railway.app`)

**Serviço 2 — Bot:**
- Root Directory: `/bot`
- Start Command: `npm start`
- Variáveis de ambiente:
  ```
  DISCORD_BOT_TOKEN=...
  DISCORD_GUILD_ID=...
  BACKEND_URL=https://studyhub-backend.up.railway.app
  ```

> 💡 O Railway oferece **$5/mês grátis** (suficiente para ambos os serviços rodando 24/7).

---

### Frontend → GitHub Pages

1. Edite `frontend/vite.config.js` e altere `REPO_NAME` para o nome do seu repositório:
   ```js
   const REPO_NAME = "studyhub"; // nome exato do seu repo
   ```

2. Crie o arquivo `frontend/.env` com a URL do backend Railway:
   ```env
   VITE_API_URL=https://studyhub-backend.up.railway.app
   ```

3. Instale o `gh-pages` (já está no package.json):
   ```bash
   cd frontend
   npm install
   ```

4. Faça o deploy:
   ```bash
   npm run deploy
   ```
   Isso faz o build e publica na branch `gh-pages` automaticamente.

5. No GitHub, vá em **Settings → Pages**:
   - Source: `Deploy from a branch`
   - Branch: `gh-pages` / `/ (root)`
   - Salve

6. Aguarde ~2 minutos e acesse:  
   `https://SEU_USUARIO.github.io/studyhub`

#### Deploy automático via GitHub Actions (opcional)

Crie `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths: [frontend/**]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

---

## 📋 Endpoints da API

| Método | Rota                        | Descrição                          |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/contents`             | Lista conteúdos (filtros por query)|
| GET    | `/api/contents/today`       | Conteúdos de hoje                  |
| GET    | `/api/contents/upcoming`    | Próximos conteúdos                 |
| GET    | `/api/contents/exams`       | Provas futuras                     |
| GET    | `/api/contents/:id`         | Conteúdo por ID                    |
| POST   | `/api/contents`             | Criar conteúdo                     |
| PUT    | `/api/contents/:id`         | Atualizar conteúdo                 |
| DELETE | `/api/contents/:id`         | Excluir conteúdo                   |
| GET    | `/api/subjects`             | Listar matérias                    |
| POST   | `/api/subjects`             | Criar matéria                      |
| PUT    | `/api/subjects/:id`         | Atualizar matéria                  |
| DELETE | `/api/subjects/:id`         | Excluir matéria                    |
| GET    | `/health`                   | Health check (Railway)             |

---

## 🤖 Comandos do Bot

| Comando         | Descrição                                              |
|-----------------|--------------------------------------------------------|
| `!hoje`         | Conteúdos de hoje agrupados por matéria                |
| `!agenda`       | Próximos 7 conteúdos (use `!agenda 15` para mais)     |
| `!provas`       | Provas futuras com contagem regressiva e urgência      |
| `!ajuda`        | Lista todos os comandos                                |

---

## 🔔 Lógica de Notificações

| Tipo     | Quando é enviado                                      |
|----------|-------------------------------------------------------|
| Aula     | No horário cadastrado                                 |
| Revisão  | No horário cadastrado                                 |
| Prova    | **1 dia antes** às 08:00 BRT + **no dia** no horário |

Todas as notificações são enviadas como **embeds** coloridos com a cor da matéria.  
O flag `sentMain` / `sentDayBefore` no banco garante que cada notificação seja enviada **uma única vez**.

---

## 🛠️ Tecnologias Utilizadas

| Camada    | Tecnologia        | Motivo                          |
|-----------|-------------------|---------------------------------|
| Frontend  | React 18 + Vite   | SPA rápida, hot-reload          |
| Frontend  | React Router v6   | Navegação SPA                   |
| Frontend  | date-fns          | Manipulação de datas sem peso   |
| Backend   | Node.js + Express | API REST leve e simples         |
| Backend   | Mongoose          | ODM para MongoDB                |
| Backend   | node-cron         | Agendador de tarefas            |
| Bot       | discord.js v14    | Biblioteca oficial Discord      |
| Banco     | MongoDB Atlas     | Gratuito, cloud, sem servidor   |
| Hospedagem| Railway           | Deploy simples, free tier       |
| Frontend  | GitHub Pages      | Gratuito para sites estáticos   |

---

## 🐛 Solução de Problemas

**Bot não envia notificações:**
- Verifique se `DISCORD_BOT_TOKEN` está correto
- Confirme que `MESSAGE CONTENT INTENT` está ativo no Portal
- O canal Discord deve ter o mesmo nome digitado no cadastro (sem `#`)

**Backend não conecta ao MongoDB:**
- Verifique se o IP `0.0.0.0/0` está liberado no Atlas Network Access
- Confirme a string de conexão no `.env`

**Frontend não carrega dados:**
- Confirme que `VITE_API_URL` aponta para o backend Railway
- Verifique se o CORS do backend permite a origem do GitHub Pages

**Notificações duplicadas:**
- Isso não deveria ocorrer, pois os flags `sentMain`/`sentDayBefore` são definidos atomicamente
- Se ocorrer, verifique se há mais de uma instância do backend rodando

---

## 📄 Licença

MIT — Livre para uso, modificação e distribuição.
