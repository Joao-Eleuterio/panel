# Painel Pessoal

PWA pessoal (tarefas, leituras, notas e ideias por área) com base de dados no Supabase
e login por email/password. Site estático — sem build step.

## Estrutura

- `index.html` — a app inteira (UI + IndexedDB local + sync Supabase + auth)
- `manifest.json`, `sw.js` — PWA (instalável no iPhone, offline)
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — ícones
- `netlify.toml` — diz ao Netlify para servir a raiz do repo

## Deploy automático (GitHub + Netlify)

Configuração única. Depois disto, cada `git push` publica sozinho.

1. Cria um repo no GitHub e sobe estes ficheiros (ver comandos abaixo).
2. No Netlify: **Add new site → Import an existing project → GitHub** e escolhe o repo.
   - Build command: (vazio)
   - Publish directory: `.`
3. Deploy. A partir daqui, qualquer push para `main` gera um novo deploy.

### Comandos git (primeira vez)

```bash
cd painel
git init
git add .
git commit -m "Painel Pessoal inicial"
git branch -M main
git remote add origin https://github.com/<o-teu-user>/<o-repo>.git
git push -u origin main
```

### Atualizações

```bash
git add .
git commit -m "descrição da mudança"
git push
```

## Backend (Supabase)

- Projeto: `cakkiafbcdwrimyrgifi` (região eu-central-1)
- Tabela `items` com RLS: cada linha tem `user_id` e só o dono autenticado lê/escreve.
- A `anon key` embutida no `index.html` é pública por design; o acesso aos dados exige login.

## Nota de segurança

Sem sessão iniciada, a base não é acessível (nem leitura nem escrita).
A confirmação de email está ligada — ao criar conta, confirma pelo link e depois entra.
