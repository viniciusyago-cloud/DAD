# DAD · Troops Intel Board

Painel público, mobile-first e em tempo real com os dados de tropas da aliança DAD. Qualquer pessoa que tiver o link consegue abrir, ver, e editar. Sincroniza ao vivo entre todos os dispositivos abertos.

**Stack:** Vite + React 18 + Supabase (Postgres + Realtime) + Vercel.

---

## 🎯 O que você vai fazer (visão geral)

1. Rodar 1 script SQL no Supabase pra criar a tabela e inserir os 56 membros
2. Subir o projeto no GitHub
3. Conectar o GitHub no Vercel e configurar 2 variáveis de ambiente
4. Compartilhar o link com a aliança

Tempo total: ~15 minutos.

---

## 📋 Passo 1 — Rodar o SQL no Supabase

1. Entre no dashboard do Supabase: <https://supabase.com/dashboard>
2. Selecione o projeto que você criou pra DAD
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query** (canto superior direito)
5. Abra o arquivo `supabase/init.sql` deste projeto, copie **TODO** o conteúdo, e cole no editor
6. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
7. Você deve ver a mensagem "Success. No rows returned." — significa que tudo rodou

**Pra verificar:** vai em **Table Editor** no menu lateral, clique na tabela `members` e você deve ver os 56 jogadores listados.

> Esse script cria a tabela, ativa Row Level Security com políticas abertas (qualquer um pode ler e escrever), ativa realtime, e insere os 56 membros da enquete de julho.

---

## 📋 Passo 2 — Testar localmente (opcional, mas recomendado)

Se você quiser testar antes de fazer deploy:

1. Abra um terminal na pasta do projeto
2. Rode:
   ```bash
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Edite o `.env.local` e preencha com as suas chaves do Supabase:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (a chave anon pública)
   ```

   > **Onde acho essas chaves?** No dashboard do Supabase → **Settings → API**. A URL fica no topo. A `anon public` key fica na seção "Project API keys".

5. Rode:
   ```bash
   npm run dev
   ```
6. Abra <http://localhost:5173> no navegador. Você deve ver o painel com os 56 jogadores.

Se der erro de conexão, verifique se as chaves no `.env.local` estão certas.

---

## 📋 Passo 3 — Subir no GitHub

1. Crie um repositório novo no GitHub (privado ou público, tanto faz — só não commite o `.env.local`)
2. Na pasta do projeto, rode:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/SEU-USUARIO/dad-troops-board.git
   git branch -M main
   git push -u origin main
   ```

> O `.gitignore` já ignora o `.env.local`, então suas chaves não vão pra público.

---

## 📋 Passo 4 — Deploy no Vercel

1. Entre no Vercel: <https://vercel.com/new>
2. Clique em **Import Git Repository**
3. Selecione o repositório `dad-troops-board`
4. Na tela de configuração:
   - **Framework Preset:** Vite (já vem selecionado)
   - **Build Command:** `npm run build` (padrão, não muda)
   - **Output Directory:** `dist` (padrão, não muda)
5. Expanda a seção **Environment Variables** e adicione:
   - `VITE_SUPABASE_URL` → sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` → sua chave anon pública
6. Clique em **Deploy**

Aguarde ~1 minuto. Quando terminar, o Vercel te dá um link tipo `dad-troops-board.vercel.app`.

**Testa esse link no celular** — se aparecer os 56 jogadores, tá pronto!

---

## 📋 Passo 5 — Compartilhar com a aliança

Manda o link no chat da aliança. Qualquer um que abrir consegue ver e editar. As edições aparecem ao vivo pra todo mundo com o link aberto (Realtime).

---

## 🔒 Sobre segurança

Este projeto usa RLS (Row Level Security) do Supabase com políticas **abertas** — qualquer um com o link pode editar. Isso foi uma escolha consciente pra facilitar o uso na aliança.

**Se acontecer algum troll ou zoeira nos dados:**

- **Restaurar os dados originais:** entre no SQL Editor do Supabase, rode novamente as linhas do arquivo `init.sql` a partir de `-- ------- 5. Seed data`. Isso apaga tudo e recoloca os 56 originais.
- **Bloquear escrita temporariamente:** entre em Authentication → Policies → tabela `members`, e desabilite as políticas de INSERT/UPDATE/DELETE. Isso deixa o board só-leitura até você reativar.

---

## 🛠️ Manutenção

**Atualizar os dados iniciais (SEED):** edita o arquivo `supabase/init.sql` (a seção de `insert into public.members`) e roda ele novamente no SQL Editor.

**Mudar cores, textos, layout:** edita `src/App.jsx`. As cores estão em constantes no topo do arquivo (`gold`, `bg`, `panel`, etc). Depois de editar, faz commit e push — o Vercel redeploya automaticamente.

**Ver logs de erro:** dashboard do Vercel → seu projeto → aba **Logs**.

---

## 📁 Estrutura do projeto

```
dad-troops-board/
├── index.html               # Entry point HTML
├── package.json             # Dependências
├── vite.config.js           # Config Vite
├── vercel.json              # Config Vercel (SPA rewrites)
├── .env.example             # Modelo de variáveis de ambiente
├── .gitignore
├── README.md                # Este arquivo
├── public/
│   └── favicon.svg          # Brasão DAD
├── src/
│   ├── main.jsx             # Entry point React
│   ├── App.jsx              # Componente principal (o app inteiro)
│   ├── supabaseClient.js    # Cliente Supabase
│   └── index.css            # CSS global
└── supabase/
    └── init.sql             # Script de inicialização do banco
```

---

## ⚙️ Comandos úteis

```bash
npm install          # Instala dependências
npm run dev          # Roda em desenvolvimento (localhost:5173)
npm run build        # Gera build de produção em dist/
npm run preview      # Testa o build de produção localmente
```

---

## 🐻 Feito para a aliança DAD · Kingshot server #1
