# Portal Hiperlocal — Carmo do Rio Claro/MG

Plataforma de **utilidade pública**, **turismo**, **comunidade**, **transparência** e **comércio local** para Carmo do Rio Claro/MG, região da represa de Furnas e Serra da Canastra.

## Status

🚧 **Sprint 0 concluído** — scaffold inicial. Próximo: Sprint 1 (auth + layout + RLS).

Roadmap completo em `.davia/assets/roadmap.html` (abrir com `pnpm davia:open`).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + Storage + Edge Functions) · Anthropic Claude · Resend · Maplibre · Vercel.

Documentação de arquitetura interativa em **`.davia/`** (Davia).

## Setup

```bash
# 1. Instalar deps (workspace pnpm)
pnpm install

# 2. Copiar env e preencher
cp .env.example apps/web/.env.local
# Preencher as chaves — ver seções de cada serviço abaixo

# 3. Subir front em dev
pnpm dev

# 4. Abrir docs Davia
pnpm davia:open
```

### Pré-requisitos

- Node 22+ e pnpm 10+
- PM2 (`npm install -g pm2`) — gerencia worker e media-processor
- ffmpeg — conversão de vídeo (`sudo apt install ffmpeg`)
- Conta Supabase
- Anthropic API key
- BunnyCDN — storage zone + pull zone (upload de mídia)
- (opcional) Resend API key — e-mail transacional
- (opcional) OpenAI API key — embeddings e sumários automáticos
- (opcional) GitHub CLI (`gh`) — fluxo de PRs

## Serviços de background (PM2)

O projeto roda dois processos extras além do Next.js:

| Processo | O que faz |
|---|---|
| `hail-mary-media` | Daemon HTTP (porta 4010) que recebe uploads, comprime para WebP/MP4 e envia para o BunnyCDN |
| `worker-scrape-diario` | Diário Oficial — diário 06h |
| `worker-scrape-licitacoes` | Editais/Licitações — diário 06h30 |
| `worker-scrape-atas` | Atas da Câmara — segunda 07h |
| `worker-scrape-noticias-*` | Notícias Câmara + Prefeitura — terça 07h |
| `worker-scrape-proposicoes` | Proposições da Câmara — terça 07h30 |
| `worker-summarize` | Sumariza documentos novos com IA (diário 08h) |
| `worker-embed` | Gera embeddings para busca semântica (diário 08h30) |
| `worker-moderate` | Modera UGC pendente (diário 09h) |

### Subir os serviços

```bash
# Criar os arquivos .env de cada app (ver .env.example de cada um)
cp apps/worker/.env.example apps/worker/.env        # editar
cp apps/media-processor/.env.example apps/media-processor/.env  # editar

# Iniciar tudo via PM2
pm2 start ecosystem.config.cjs

# Persistir entre reboots (rodar uma vez)
pm2 save
pm2 startup   # copiar e rodar o comando que aparecer
```

### Comandos úteis PM2

```bash
pm2 list                          # status de todos os processos
pm2 logs hail-mary-media          # logs do media-processor em tempo real
pm2 logs worker-scrape-diario     # logs de um job específico
pm2 restart hail-mary-media       # reiniciar o media-processor
pm2 restart ecosystem.config.cjs  # reiniciar tudo (após deploy)

# Rodar um job do worker manualmente
pm2 trigger worker-scrape-diario restart
# ou direto:
node apps/worker/dist/index.js scrape:all
```

### Variáveis de ambiente por app

**`apps/web/.env.local`** (copiado de `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_STORAGE_ENDPOINT`, `NEXT_PUBLIC_BUNNY_CDN_URL`
- `MEDIA_PROCESSOR_URL=http://127.0.0.1:4010`, `MEDIA_PROCESSOR_SECRET` (mesmo valor do media-processor)
- `CRON_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`

**`apps/worker/.env`** (copiado de `apps/worker/.env.example`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (opcional — desativa embeddings/sumários se ausente)

**`apps/media-processor/.env`** (copiado de `apps/media-processor/.env.example`):
- `MEDIA_PROCESSOR_SECRET` (mín. 24 chars — compartilhar com a web)
- `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_STORAGE_ENDPOINT`, `NEXT_PUBLIC_BUNNY_CDN_URL`

## Estrutura

```
hail-mary/
├── apps/web/               Next.js 16 (front + serverless)
├── apps/worker/            Jobs de scraping, IA e moderação (Node.js)
├── apps/media-processor/   Serviço HTTP de compressão de mídia (Fastify)
├── supabase/               migrations + edge functions
├── .davia/                 documentação interativa do projeto
├── ecosystem.config.cjs    configuração PM2 (worker + media-processor)
└── CLAUDE.md               convenções de código (leitura obrigatória)
```

## Comandos

| Comando | Uso |
|---|---|
| `pnpm dev` | dev server (Turbopack) |
| `pnpm build` | build de produção |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm davia:open` | abre docs Davia local |
| `pnpm davia:push` | sincroniza docs Davia com workspace cloud |

## Convenções

Ver `CLAUDE.md` (também usado por agentes IA neste repo).

## Licença

Privado. Todos os direitos reservados.
