# Plano 15 — Boletim mensal do negócio

> **Pré-requisito:** Plano 14 (analytics) entregue — `business_daily_stats` populando. Studio entregue (`html-to-image` já instalado, padrão de captura em `studio-editor.tsx`).
> **Estimativa:** 1 semana.
> **Status:** planejado (2026-06-08). Tarefa 2 do trio cardápio/boletim/reels.

---

## 1. Contexto

**Por quê:** o comerciante precisa de prova de valor recorrente e *orgulho de compartilhar*. O boletim transforma os números frios do analytics num resumo amigável: _"Seu mês: 320 visitas, 41 cliques no WhatsApp, 2º lugar em Pizzarias."_ Justifica a assinatura e vira conteúdo pro Instagram dele.

**O que destrava:** retenção de merchant pago + canal de viralização (cada boletim compartilhado é marketing do portal).

### Correções de premissa (verificadas no código em 2026-06-08)
O plano original assumia colunas que **não existem**. Estado real de `business_daily_stats` (migration `20260505190000_business_analytics.sql`):

| Coluna existente | Observação |
|---|---|
| `views` | ✅ |
| `phone_clicks` | ✅ |
| `whatsapp_clicks` | ✅ |
| `map_clicks` | ✅ ≈ "como chegar" (directions) |
| `website_clicks` | ✅ |
| `total_events` | ✅ |

**Não existem** em `business_daily_stats`: `unique_visitors`, `shares`, `favorites`, `avg_dwell_ms`.

- **Favoritos** → contar da tabela `business_favorites` (migration `20260514032843_business_favorites.sql`), não do daily_stats.
- **Visitantes únicos / shares** → não há fonte hoje. **v1 não exibe** (ou exibe só se adicionarmos eventos depois). Não inventar número.
- **Rank por categoria** → existe `business_category_assignments` (categoria primária do negócio) **e** uma tabela `business_weekly_rank` (rank semanal já calculado). Para o rank mensal: agregar `business_daily_stats` do mês entre negócios da mesma categoria primária (ver §3). Reusar `business_weekly_rank` só se quisermos atalho aproximado.

### Decisão de arquitetura (alinhada a "prefere simples")
**Geração on-demand + cache**, sem cron/edge novo. Quando o merchant abre a tela do boletim de um mês fechado, se não existe linha em `business_monthly_reports` para `(business_id, month)`, gera na hora (agrega + rank + IA), grava e serve. Meses já gerados vêm do cache. Sem worker mensal, sem Realtime. (Push "seu boletim chegou" fica pra Fase 3, opcional.)

---

## 2. Tabelas e RLS

**Migration:** `supabase/migrations/20260616120000_business_monthly_reports.sql`

```sql
create table public.business_monthly_reports (
  id            uuid primary key default gen_random_uuid(),
  city_id       uuid not null references public.cities(id) on delete cascade,
  business_id   uuid not null references public.businesses(id) on delete cascade,
  month         date not null,              -- sempre dia 1 do mês (ex.: 2026-05-01)
  metrics       jsonb not null default '{}'::jsonb,  -- somatórios do mês + deltas vs mês anterior
  category_slug text,                        -- categoria usada no ranking
  category_rank integer,                     -- posição na categoria (null se sem dados)
  category_size integer,                     -- nº de negócios na categoria (pra "2º de 9")
  ai_summary    text,                        -- parágrafo amigável (badge "Resumido por IA")
  ai_job_id     uuid references public.ai_jobs(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (business_id, month)
);

create index idx_monthly_reports_business on public.business_monthly_reports (business_id, month desc);
create index idx_monthly_reports_city on public.business_monthly_reports (city_id);

create trigger trg_monthly_reports_updated
  before update on public.business_monthly_reports
  for each row execute function public.set_updated_at();

alter table public.business_monthly_reports enable row level security;

-- leitura: quem gerencia o negócio ou city_admin (não é público — é dado de gestão)
create policy "monthly_reports_read" on public.business_monthly_reports for select
  using (public.manages_business(business_id) or public.is_city_admin(city_id));

-- escrita: só via server action com checagem; mantém as mesmas regras
create policy "monthly_reports_write" on public.business_monthly_reports for all
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));
```

**Shape de `metrics` (jsonb):**
```ts
{
  views: number; phoneClicks: number; whatsappClicks: number;
  mapClicks: number; websiteClicks: number; totalEvents: number;
  favorites: number;              // count de business_favorites no mês
  prev: { views: number; whatsappClicks: number; /* … */ } | null; // mês anterior p/ deltas
}
```

> RLS de ranking: o cálculo cruza negócios da mesma categoria. Rodar a agregação em **Server Action com service role / RPC `security definer`** (não dá pra ler stats de terceiros via RLS do merchant). Ver §3.

---

## 3. Server-side

**RPC SQL (na mesma migration) — `monthly_business_metrics` e `monthly_category_rank`:**

```sql
-- Somatório do mês p/ um negócio (security definer: o dono só lê o próprio via action)
create or replace function public.monthly_business_metrics(p_business_id uuid, p_month date)
returns table (views bigint, phone_clicks bigint, whatsapp_clicks bigint,
               map_clicks bigint, website_clicks bigint, total_events bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(views),0), coalesce(sum(phone_clicks),0),
         coalesce(sum(whatsapp_clicks),0), coalesce(sum(map_clicks),0),
         coalesce(sum(website_clicks),0), coalesce(sum(total_events),0)
  from business_daily_stats
  where business_id = p_business_id
    and date >= date_trunc('month', p_month)
    and date <  (date_trunc('month', p_month) + interval '1 month');
$$;

-- Rank por views na categoria primária do negócio, no mês
create or replace function public.monthly_category_rank(p_business_id uuid, p_month date)
returns table (category_slug text, rank int, category_size int)
language plpgsql stable security definer set search_path = public as $$
declare v_cat uuid; begin
  select category_id into v_cat from business_category_assignments
    where business_id = p_business_id and is_primary = true limit 1;
  if v_cat is null then return; end if;
  return query
  with sums as (
    select bca.business_id, coalesce(sum(s.views),0) as v
    from business_category_assignments bca
    join business_daily_stats s on s.business_id = bca.business_id
     and s.date >= date_trunc('month', p_month)
     and s.date <  (date_trunc('month', p_month) + interval '1 month')
    where bca.category_id = v_cat and bca.is_primary = true
    group by bca.business_id
  ), ranked as (
    select business_id, rank() over (order by v desc) as r, count(*) over () as n from sums
  )
  select (select slug from business_categories where id = v_cat),
         coalesce((select r::int from ranked where business_id = p_business_id), null),
         (select max(n)::int from ranked);
end; $$;
```

**Server Action:** `apps/web/lib/businesses/report-actions.ts`
- `generateMonthlyReportAction(input: { businessId: uuid; month: 'YYYY-MM' })`
  - Zod valida; `assertManagesBusiness`; `getCurrentCity`.
  - Recusa mês corrente/futuro (só meses fechados).
  - Se já existe `(business_id, month)`, retorna cache (a menos de `force`).
  - `rpc('monthly_business_metrics')` + `rpc('monthly_category_rank')`.
  - Favoritos: `from('business_favorites').count` no negócio (com filtro de `created_at` no mês se a tabela tiver; senão total atual — checar colunas da migration `20260514032843`).
  - Mês anterior: mesma RPC pra `p_month - 1 mês` → deltas.
  - IA: `lib/ai/anthropic.ts` (singleton) + **Haiku** (`claude-haiku-4-5-20251001`); prompt curto em PT-BR com os números → parágrafo amigável; **logar em `ai_jobs`** (tokens/custo/status) e guardar `ai_job_id`. Saída sempre com badge "Resumido por IA — sujeito a verificação".
  - `upsert` em `business_monthly_reports`.
  - `revalidatePath('/painel/comercio/${businessId}/boletim')`.

**Query de leitura:** `apps/web/lib/businesses/report-queries.ts`
- `getMonthlyReport(businessId, month)` → linha ou null.
- `listReportMonths(businessId)` → meses disponíveis (pra seletor).

> Tabelas novas não estão no `database.types` até regenerar — usar o cast permissivo `db()` (padrão de `lib/studio/actions.ts` e `lib/businesses/menu-actions.ts`).

---

## 4. UI público

Nenhuma. Boletim é dado de gestão (não exposto publicamente).

A **imagem compartilhável** é gerada client-side (não é rota pública): ver §5.

---

## 5. UI painel

**Nova aba `Boletim`** em `business-tabs.tsx` (ícone `LineChart` ou `Newspaper`), rota `app/painel/comercio/[id]/boletim/page.tsx`.

- Server component: auth + manager check (mesmo molde de `cardapio/page.tsx`); seletor de mês (default = mês fechado mais recente); chama `getMonthlyReport`; se vazio, mostra botão "Gerar boletim" → `generateMonthlyReportAction`.
- Client `monthly-report-card.tsx`:
  - Cabeçalho "Boletim de maio/2026".
  - Cards de número: visitas, WhatsApp, ligações, como-chegar, site, favoritos — cada um com delta vs mês anterior (▲/▼).
  - Faixa de ranking: "2º lugar em Pizzarias (de 9)".
  - Parágrafo da IA com badge "Resumido por IA".
  - Botão **"Baixar imagem"**: reusa `html-to-image` (`toPng`) sobre um template de boletim (`report-template.tsx`, formato story 1080×1920 ou 1:1) — mesmo padrão de `captureActive()` no `studio-editor.tsx`. Download direto (igual `onInstagram`).

**Template de imagem:** `app/painel/comercio/[id]/boletim/report-template.tsx` — usa as cores da marca (THEMES do Studio / `carmo-local-design`), número grande + "Resumido por IA" no rodapé.

### Fases
1. **Agregação + rank + tela** (números + deltas + ranking, sem IA).
2. **Resumo IA** (Haiku + ai_jobs + badge).
3. **Imagem compartilhável** + (opcional) push/email "seu boletim chegou" — só se Plano 12 (push) estiver ativo.

---

## 6. Definition of Done

- [ ] Migration `20260616120000_business_monthly_reports.sql` + RPCs aplicada; tipos regenerados (`supabase gen types`).
- [ ] `generateMonthlyReportAction` com Zod, `manages_business`, recusa mês não fechado, cache + `force`.
- [ ] RPCs `monthly_business_metrics` / `monthly_category_rank` retornam números corretos (testar com negócio real do mês anterior).
- [ ] Favoritos somados de `business_favorites` (não inventar unique_visitors/shares).
- [ ] IA: Haiku via `lib/ai/anthropic.ts`, logado em `ai_jobs`, badge "Resumido por IA" visível.
- [ ] Aba `Boletim` no painel; números + deltas + ranking + parágrafo.
- [ ] "Baixar imagem" gera PNG com `html-to-image`.
- [ ] `pnpm typecheck` e `pnpm lint` limpos.
- [ ] Davia: `data-model.html` (tabela nova) + `analytics-comerciante.html` (seção boletim) atualizados.
