# Arquitetura e Operacao

Atualizado em 2026-06-18 durante a migracao para a VPS
`ubuntu@167.126.22.39`.

Este documento descreve o que roda em producao, quais portas sao usadas e como
operar o backend do projeto sem expor segredos.

## Divisao entre servidores

Depois da migracao de 2026-06-18:

| Host | Papel principal |
| --- | --- |
| `ubuntu@167.126.22.39` | Runtime principal do Hail Mary. |
| Maquina original `/home/ubuntu` | Runtime principal do Ingresso Facil. |

O core do Hail Mary ficou nesta VPS: `city-agent`, `hail-mary-media`,
workers continuos e jobs agendados. A maquina original ficou com o core do
Ingresso Facil: `checkout-service`, `media-service`, PostgreSQL/Redis locais e
Nginx dos dominios do Ingresso Facil.

Ha alguns pontos cruzados historicos, especialmente em dominios e servicos de
media. A regra operacional atual e:

- Hail Mary usa `http://127.0.0.1:4010` como media processor interno nesta VPS.
- Ingresso Facil continua com seus proprios servicos de media e checkout na
  maquina original.
- `media.luizalmeida.dev` nao deve ser tratado como media processor interno do
  Hail Mary sem decisao explicita.

## Visao geral

O `hail-mary` e um monorepo `pnpm` com apps web/mobile e tres servicos Node.js
de backend operacional:

| App | Papel | Runtime |
| --- | --- | --- |
| `apps/web` | Next.js do Portal Carmelitano. Hoje o dominio publico esta atras do Cloudflare/Vercel. | Next.js |
| `apps/mobile` | App Expo/React Native. Nao roda como daemon na VPS. | Expo/EAS |
| `apps/agent` | City agent HTTP usado por IA conversacional. | Node.js + PM2 |
| `apps/media-processor` | API Fastify para processar imagem/video e enviar para R2. | Node.js + PM2 |
| `apps/worker` | Jobs de scraping, indexacao, emails, push e manutencao. | Node.js + PM2 |
| `supabase` | Migrations/config do Supabase remoto. | Supabase CLI |

## VPS de background

Host atual:

```text
ubuntu@167.126.22.39
Ubuntu 24.04 ARM64
Node 20.x
pnpm 10.15.1
PM2 6.x
ffmpeg 6.1.x
Projeto: /home/ubuntu/projects/hail-mary
```

O servidor tambem hospeda outros projetos. Por isso as portas do `hail-mary`
devem evitar colisao com `wallet.ingressofacil.online`, `chat.ingressofacil.online`
e servicos Docker existentes.

## Portas

| Porta | Bind | Servico | Status/observacao |
| --- | --- | --- | --- |
| `4010` | `127.0.0.1` | `hail-mary-media` | Porta interna livre para o media processor. |
| `8790` | default Node listen | `city-agent` | Ajustada na VPS porque `8789` ja estava ocupada. |
| `8787` | existente | Outro projeto (`wallet-service`) | Nao usar para `hail-mary`. |
| `8788` | existente | Outro projeto/chat | Nao usar para `hail-mary`. |
| `8789` | existente | Outro projeto em `172.17.0.1` | Nao usar para `hail-mary`. |

Na VPS de 2026-06-18, estes overrides foram aplicados:

```text
apps/agent/.env: PORT=8790
apps/web/.env.local: CITY_AGENT_URL=http://127.0.0.1:8790
```

Backups criados antes da alteracao:

```text
apps/agent/.env.before-migration-20260618
apps/web/.env.local.before-migration-20260618
```

## Dominios e DNS

Os dominios publicos resolvem para Cloudflare, nao diretamente para o IP da VPS:

| Dominio | Uso observado | DNS observado em 2026-06-18 |
| --- | --- | --- |
| `portalcarmelitano.com.br` | Portal publico | Cloudflare |
| `carmelitano.cidadeviva.app` | URL usada pelo agent para links | Cloudflare |
| `media.luizalmeida.dev` | Endpoint publico de outro projeto; nao usar como media do Hail Mary nesta VPS. | Cloudflare |

Validacao feita na VPS:

- `https://portalcarmelitano.com.br` respondeu `200`.
- `https://carmelitano.cidadeviva.app` respondeu `200`.
- `https://media.luizalmeida.dev/health` respondeu `200`, mas esse endpoint
  nao pertence ao deploy do Hail Mary nesta VPS.

Observacao: `media.luizalmeida.dev` nao aparece no Nginx desta VPS e foi
tratado como endpoint do Ingresso Facil. O Hail Mary nesta VPS usa o media
processor local em `http://127.0.0.1:4010`.

Env ajustado no destino:

```text
apps/worker/.env: MEDIA_PROCESSOR_URL=http://127.0.0.1:4010
apps/web/.env.local: MEDIA_PROCESSOR_URL=http://127.0.0.1:4010
```

## Variaveis de ambiente

Arquivos com segredos que precisam existir na VPS:

```text
apps/agent/.env
apps/media-processor/.env
apps/worker/.env
apps/web/.env.local
supabase/.env
```

Chaves esperadas por arquivo, sem valores:

### `apps/agent/.env`

```text
AGENT_API_TOKEN
CITY_AGENT_MODEL
GOOGLE_GENERATIVE_AI_API_KEY
GROQ_API_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
OPENAI_API_KEY
PORT
SUPABASE_SERVICE_ROLE_KEY
```

### `apps/media-processor/.env`

```text
ALLOWED_ORIGINS
FFMPEG_BIN
HOST
IMAGE_MAX_WIDTH
IMAGE_WEBP_QUALITY
MAX_UPLOAD_BYTES
MEDIA_PROCESSOR_SECRET
PORT
R2_ACCESS_KEY_ID
R2_BUCKET
R2_ENDPOINT
R2_PUBLIC_BASE_URL
R2_SECRET_ACCESS_KEY
VIDEO_CRF
VIDEO_MAX_WIDTH
```

### `apps/worker/.env`

```text
AI_MONTHLY_BUDGET_USD
APP_URL
BREVO_API_KEY
BREVO_FROM_EMAIL
BREVO_FROM_NAME
EMAIL_BATCH_SIZE
EMAIL_POLL_INTERVAL_MS
EXPO_ACCESS_TOKEN
GOOGLE_PLACES_API_KEY
GOOGLE_ROUTES_API_KEY
MEDIA_PROCESSOR_SECRET
MEDIA_PROCESSOR_URL
OPENAI_API_KEY
OPENAI_EMBEDDING_MODEL
OPENAI_SUMMARY_MODEL
PUSH_BATCH_SIZE
PUSH_POLL_INTERVAL_MS
R2_ACCESS_KEY_ID
R2_BUCKET
R2_ENDPOINT
R2_PUBLIC_BASE_URL
R2_SECRET_ACCESS_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
VAPID_SUBJECT
WORKER_CITY_SLUG
WORKER_HTTP_TIMEOUT_MS
WORKER_MAX_RETRIES
```

### `apps/web/.env.local`

```text
ANTHROPIC_API_KEY
CITY_AGENT_TOKEN
CITY_AGENT_URL
CRON_SECRET
MEDIA_PROCESSOR_SECRET
MEDIA_PROCESSOR_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_DEFAULT_CITY_SLUG
NEXT_PUBLIC_R2_PUBLIC_BASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_VAPID_PUBLIC_KEY
OPENAI_API_KEY
OPENAI_EMBEDDING_MODEL
R2_ACCESS_KEY_ID
R2_BUCKET
R2_ENDPOINT
R2_MEDIA_MAX_BYTES
R2_PUBLIC_BASE_URL
R2_SECRET_ACCESS_KEY
RESEND_API_KEY
RESEND_AUDIENCE_ID
RESEND_FROM_EMAIL
SUPABASE_SERVICE_ROLE_KEY
```

## PM2

O arquivo `ecosystem.config.cjs` e a fonte de verdade para processos PM2.

Daemons continuos:

| Processo PM2 | App | Porta/efeito |
| --- | --- | --- |
| `city-agent` | `apps/agent` | HTTP `/health` e `/v1/cities/:slug/ask`. |
| `hail-mary-media` | `apps/media-processor` | HTTP `/health`, `/v1/process`, `/v1/reels/render`. |
| `worker-push-deliveries` | `apps/worker` | Consome fila de push. |
| `worker-email-deliveries` | `apps/worker` | Consome fila de emails. |

Jobs agendados em PM2:

| Processo PM2 | Agenda |
| --- | --- |
| `worker-scrape-diario` | `0 6 * * 1,4` |
| `worker-scrape-licitacoes` | `30 6 * * 1,4` |
| `worker-scrape-atas` | `0 7 * * 1` |
| `worker-weather` | `0 */3 * * *` |
| `worker-road-routes` | `0 * * * *` |
| `worker-scrape-noticias-camara` | `0 7 * * 2` |
| `worker-scrape-noticias-prefeitura` | `15 7 * * 2` |
| `worker-scrape-proposicoes` | `30 7 * * 2` |
| `worker-summarize` | `0 8 * * 1,4` |
| `worker-embed` | `30 8 * * *` |
| `worker-reindex-tourism` | `0 3 * * *` |
| `worker-analytics` | `30 3 * * *` |
| `worker-indexing` | `0 4 * * *` |
| `worker-moderate` | `0 9 * * *` |
| `worker-google-photos` | `*/20 * * * *` |
| `worker-og-image` | `*/3 * * * *` |

Observacao operacional: `pm2 start ecosystem.config.cjs` registra todos os jobs
mas tambem dispara uma execucao inicial. Em migracoes, prefira subir primeiro os
daemons e habilitar os jobs em uma janela controlada.

Comandos uteis:

```bash
cd /home/ubuntu/projects/hail-mary

pnpm install --frozen-lockfile
pnpm agent:build
pnpm media:build
pnpm worker:build

pm2 start ecosystem.config.cjs --only city-agent,hail-mary-media,worker-push-deliveries,worker-email-deliveries
pm2 list
pm2 logs city-agent
pm2 logs hail-mary-media
pm2 save
```

Health checks locais:

```bash
curl -fsS http://127.0.0.1:8790/health
curl -fsS http://127.0.0.1:4010/health
```

Dependencias nativas validadas na VPS:

```bash
ffmpeg -version
cd /home/ubuntu/projects/hail-mary/apps/media-processor
node -e 'import("sharp").then(() => console.log("sharp ok"))'
```

## Backups

Rotina instalada nesta VPS:

```text
/usr/local/sbin/backup-to-r2.sh
/etc/backup-to-r2.env
/etc/cron.d/db-backups-to-r2
```

Agenda UTC:

| Job | Quando | R2 |
| --- | --- | --- |
| `hailmary-supabase-daily` | diariamente `02:15` | `backups/hail-mary/supabase/daily/YYYY-MM-DD/` |
| `poliweb-weekly` | domingo `03:30` | `backups/poliweb/postgres/weekly/YYYY-MM-DD/` |

Os jobs foram testados e enviados para o bucket R2 `cidade-viva`.

Detalhes:

- Hail Mary usa dump completo custom do Supabase via container Postgres 17.
- Poliweb usa dump custom do container `poliweb_postgresql_v3`.
- Falhas sao enviadas ao Sentry quando `SENTRY_DSN` existe em
  `/etc/backup-to-r2.env`.

Bucket Lock e expiracao automatica aplicados no R2 `cidade-viva` em
2026-06-18:

| Regra | Prefixo | Politica |
| --- | --- | --- |
| `backup-retention-60d` | `backups/` | bloqueia delecao/substituicao antes de 60 dias |
| `backup-expire-60d` | `backups/` | expira objetos apos 60 dias |

O token administrativo do Cloudflare fica em `/etc/cloudflare-r2-admin.env`,
`0600 root:root`, e nao deve ser documentado em texto claro.

Comandos usados:

```bash
npx wrangler r2 bucket lock add cidade-viva backup-retention-60d backups/ --retention-days 60
npx wrangler r2 bucket lifecycle add cidade-viva backup-expire-60d backups/ --expire-days 60 --force
```

Estimativa do Poliweb medida em 2026-06-18:

| Medida | Valor |
| --- | --- |
| Banco real usado pelo app | `poliwebapp_db_v3` |
| Tamanho logico do banco | 89 MB |
| Dump custom sem gzip | 8.1 MB |
| Dump custom + gzip | 8.0 MiB |
| Retencao semanal por 60 dias | 9 copias |
| Espaco estimado em R2 | ~72 MiB, arredondar para 100 MiB |

As maiores tabelas de aplicacao sao `categories_ads_actions`,
`categories_ads_files`, `categories_ads`, `categories_ads_addresses`,
`categories_ads_phones` e `customers`.

## PM2 ou Docker?

Recomendacao atual: manter PM2 para `hail-mary` nesta VPS.

Motivos:

- O projeto ja tem `ecosystem.config.cjs` completo e operacional.
- Os servicos sao Node.js simples, sem banco local obrigatorio.
- Estado persistente relevante fica fora da VPS: Supabase e R2.
- A VPS ja hospeda outros processos fora de Docker; migrar so este app para
  Docker agora adicionaria mais uma camada sem resolver um problema atual.
- PM2 facilita logs, restart e persistencia no boot para este tipo de workload.

Quando considerar Docker:

- Se o `media-processor` precisar empacotar binarios nativos de forma
  reprodutivel, como `ffmpeg`, Chromium/Remotion ou dependencias de `sharp`.
- Se for necessario isolar recursos por app em uma VPS compartilhada.
- Se a infraestrutura passar a ser replicada em varias VPS.
- Se quiser padronizar deploy por imagem imutavel em CI/CD.

Se Docker entrar, comece pelo `media-processor`; ele e o melhor candidato por
ter processamento de imagem/video e dependencias nativas. Os workers e o agent
podem continuar em PM2 ate existir motivo claro para conteinerizar tudo.

## Checklist de migracao

1. Copiar pacote sem `node_modules`, `.git`, `.next` e logs.
2. Extrair em `/home/ubuntu/projects/hail-mary`.
3. Validar portas livres.
4. Ajustar `apps/agent/.env` e consumidores internos se houver conflito.
5. Rodar `pnpm install --frozen-lockfile`.
6. Rodar builds de `agent`, `media-processor` e `worker`.
7. Subir daemons continuos via PM2.
8. Validar `/health` local.
9. Habilitar jobs agendados em janela controlada.
10. Rodar `pm2 save` e garantir `pm2 startup` para reboot.
