# Supabase

Banco, auth, storage e edge functions do portal.

## Variáveis do CLI (`supabase/.env`)

As chaves `NEXT_PUBLIC_*` / `SUPABASE_SERVICE_ROLE_KEY` em `apps/web/.env.local` servem para o app Next.js. **Para migrations remotas** o CLI usa a **senha do Postgres** do projeto.

1. Copie o exemplo: `cp supabase/.env.example supabase/.env` (Windows: `copy supabase\.env.example supabase\.env`).
2. Em [Database settings](https://supabase.com/dashboard/project/_/settings/database), copie a **Database password** para `SUPABASE_DB_PASSWORD` em `supabase/.env`.
3. (Opcional) `SUPABASE_ACCESS_TOKEN` — token da sua conta, útil em CI ou se quiser evitar `supabase login`.

O CLI carrega `supabase/.env` automaticamente ao rodar comandos com a pasta `supabase/` no repositório.

## Setup local

```bash
# 1. Instalar Supabase CLI (uma vez) — ou usar apenas pnpm (npx no script)
# Windows (scoop):  scoop install supabase
# Windows (winget): winget install Supabase.CLI
# macOS:            brew install supabase/tap/supabase

# 2. Preencher supabase/.env (senha do Postgres — ver seção acima)

# 3. Linkar ao projeto remoto (ref do MVP)
pnpm db:link

# 4. Aplicar migrations no remoto
pnpm db:push

# 5. Gerar types TS para o app
pnpm db:types
```

## Estrutura

```
supabase/
├── .env.example           # modelo para supabase/.env (senha Postgres p/ CLI)
├── config.toml            # gerado por `supabase init`
├── migrations/            # SQL versionado (timestamp_descricao.sql)
├── functions/             # Edge Functions (Deno) — scrapers, jobs IA
└── seed.sql               # dados iniciais (cidade, bairros, categorias)
```

## Convenções

- Toda tabela tem `id uuid default gen_random_uuid()`, `created_at`, `updated_at`
- RLS sempre habilitada — políticas explícitas por papel (admin/merchant/citizen)
- Migrations nunca alteradas após push — sempre nova migration pra mudanças
- Soft delete via `deleted_at` quando o histórico importa (audit_log, UGC)
