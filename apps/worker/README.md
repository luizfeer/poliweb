# Worker

Daemon Node.js que roda na VPS via PM2 e centraliza:

- **Scrapers** de transparência (diário oficial, atas, licitações, notícias, proposições).
- **Pipelines de IA** (summarize, embed, indexing, moderate, OG image, AI estimate).
- **Imports** externos (CliqueiAchei, fotos do Google Places).
- **Atualização de clima** (`weather:update`).
- **Agregação de analytics** (`analytics:aggregate`).
- **Reindex de turismo** (`reindex:tourism`).
- **Envio de emails transacionais via Brevo** (`email:deliveries`, daemon).
- **Lifecycle de leads de comércio** (`business:trial-nudges`, cron diário).

Cada job é despachado pelo mesmo binário (`dist/index.js`) com um argumento — PM2
orquestra horários e restart.

## Variáveis (`.env` no `apps/worker/`)

```env
# Supabase (obrigatórias)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cidade default usada por scrapers
WORKER_CITY_SLUG=carmo-do-rio-claro

# Google / Bunny / OpenAI (já existiam)
GOOGLE_PLACES_API_KEY=
BUNNY_STORAGE_ZONE=
BUNNY_STORAGE_ACCESS_KEY=
BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com
NEXT_PUBLIC_BUNNY_CDN_URL=
OPENAI_API_KEY=
OPENAI_SUMMARY_MODEL=gpt-5.4-nano
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_MONTHLY_BUDGET_USD=5
WORKER_HTTP_TIMEOUT_MS=15000
WORKER_MAX_RETRIES=2

# Email (Brevo) — obrigatórias se for rodar email:deliveries
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=contato@carmolocal.com.br
BREVO_FROM_NAME=Portal Carmelitano
BREVO_DEFAULT_SERVICE=hail_mary
APP_URL=https://carmolocal.com.br
EMAIL_POLL_INTERVAL_MS=15000
EMAIL_BATCH_SIZE=25
```

Para usar o mesmo daemon com outros sistemas, configure contas extras em
`BREVO_SERVICES_JSON`. As chaves ficam sempre no `.env`; a fila envia apenas
`metadata.email_service`.

```env
BREVO_SERVICES_JSON={"ingresso_facil":{"apiKey":"xkeysib-...","fromEmail":"contato@ingressofacil.online","fromName":"Ingresso Facil","appUrl":"https://ingressofacil.online","defaultTags":["ingresso_facil"]}}
```

## Local

```bash
pnpm --filter worker build
pnpm --filter worker email:deliveries        # daemon de emails
pnpm --filter worker business:trial-nudges   # tick único de nudges/overdue
pnpm --filter worker scrape:all
```

## Deploy na VPS (PM2)

> A unit de systemd antiga (`hail-mary-worker@*.service`) ainda está em
> `deploy/systemd/` como referência. O modo atual recomendado é PM2 —
> a unit dá pra remover quando todos os jobs estiverem migrados.

1. Atualizar o código:

   ```bash
   cd /opt/hail-mary
   git pull
   pnpm install --frozen-lockfile
   pnpm --filter worker build
   ```

2. Atualizar `/opt/hail-mary/apps/worker/.env` com as variáveis acima.

3. Subir tudo no PM2:

   ```bash
   pm2 start apps/worker/deploy/pm2/ecosystem.config.cjs
   pm2 save
   pm2 startup    # uma vez só, segue as instruções pra habilitar no boot
   ```

4. Status e logs:

   ```bash
   pm2 status
   pm2 logs worker-email-deliveries --lines 100
   pm2 logs worker-business-trial-nudges --lines 100
   ```

5. Atualizar depois de novo deploy:

   ```bash
   cd /opt/hail-mary && git pull
   pnpm install --frozen-lockfile
   pnpm --filter worker build
   pm2 reload apps/worker/deploy/pm2/ecosystem.config.cjs   # rolling reload
   ```

## Como funciona o envio de email

1. App web (`apps/web`) **nunca chama Brevo direto**. Quando precisa de email,
   chama `createNotification({ sendEmail: true, metadata: { email_to: ... } })`
   ou insere manualmente em `notifications` + `notification_deliveries`
   (`channel='email'`, `status='pending'`, `provider='brevo'`).
2. O job `email:deliveries` roda em loop fazendo polling a cada
   `EMAIL_POLL_INTERVAL_MS`:
   - busca até `EMAIL_BATCH_SIZE` deliveries pendentes;
   - resolve destinatário (`metadata.email_to` → `profiles.email`);
   - escolhe a conta Brevo por `metadata.email_service` ou usa
     `BREVO_DEFAULT_SERVICE`;
   - renderiza HTML com o template em `src/jobs/email/template.ts`
     usando `metadata.email_brand_name` quando informado;
   - chama `POST /v3/smtp/email` da Brevo;
   - marca `sent`/`failed` com timestamps e mensagem.

Metadados aceitos por email:

| Campo | Uso |
| --- | --- |
| `email_service` | Serviço configurado no `.env` (`hail_mary`, `ingresso_facil`, etc.). |
| `email_to` | Destinatário explícito quando não há profile/auth. |
| `email_brand_name` | Nome exibido no cabeçalho do email. |
| `email_cta_label` | Texto do botão. Padrão: `Abrir no painel`. |
| `email_footnote` | Rodapé do email. |
| `email_tags` | Tags extras enviadas para a Brevo. |

O prompt pronto para integrar próximos projetos está em
`EMAIL_DISPATCHER_INTEGRATION_PROMPT.md`.

Se faltar destinatário, a linha fica como `pending` (o filtro de email
em memória evita re-tentativa em loop — admin pode marcar `skipped`
manualmente).

## Como funciona business:trial-nudges

Executa **um ciclo** e sai (cron-style). Cada execução faz 3 passes:

| Pass | Condição                                                                       | Ação                                                                                |
| ---- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| D-7  | `business_leads.status='approved'` AND `nudge_d7_sent_at IS NULL` AND `trial_ends_at ∈ [now+6d, now+7d)` | Cria notificação `subscription.trial_ending_d7`, enfileira email, marca `nudge_d7_sent_at`. |
| D-2  | mesma lógica com `nudge_d2_sent_at` e janela `[now+1d, now+2d)`                | Notificação `trial_ending_d2`, priority `high`.                                     |
| Overdue +5 | `asaas_subscription_status='OVERDUE'` AND `asaas_next_due_date ≤ now-5d` AND `overdue_unpublished_at IS NULL` | `businesses.status='draft'`, notifica merchant (`overdue_unpublished`, priority `urgent`) + city admins. |

Resumo de cada execução vai pro stdout (capturado pelos logs do PM2).

## O que pedir pro Brevo

Pra `email:deliveries` funcionar:

1. **API key transacional** (Settings → SMTP & API → API keys). Permissão
   "Send transactional emails".
2. **Domínio verificado** com SPF e DKIM (Senders → Domains).
3. **Remetente padrão** com o domínio verificado.
4. (Opcional) IP allowlist com o IP da VPS pra hardenizar a API key.

Não precisa configurar listas, contatos ou campanhas — usamos só o
endpoint transacional inline (sem templates do Brevo por enquanto).

## Migração / removendo o antigo

- O pacote `apps/email-worker` foi descontinuado (código absorvido aqui).
- A rota `apps/web/app/api/cron/business-trial-nudges` foi removida.
- A migração `20260513105059_notifications_brevo_provider.sql` troca o
  provider default para `brevo` no RPC `create_notification` e re-aponta
  deliveries antigas pendentes (`provider='resend'`).
