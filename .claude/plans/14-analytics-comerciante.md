# Plano 14 — Analytics de comerciante

> **Pré-requisito:** Sprint 13 entregue. Volume de tráfego nas fichas suficiente pra gerar dados (~50+ visualizações/dia/negócio top).
> **Estimativa:** 1.5 semanas.

---

## 1. Por quê agora

Comerciante anunciante quer **prova de valor**. Hoje o portal mostra "X views" só pro admin. Para vender ad premium ou plano pago de destaque, o merchant precisa ver:

- Quantas pessoas viram a ficha esta semana
- Quantas clicaram em "ligar" / "WhatsApp"
- De onde vieram (Google? Outro lugar do portal?)
- Como está em relação a outros do mesmo bairro/categoria

**Modelo mental:** "Mini Google Analytics" pro tio do mercadinho — bonito, sem jargão, em PT-BR.

**Privacy-first:** Sem cookies de tracking, sem PII. Só agregados anônimos (hash de IP+UA, sem geolocalização precisa).

---

## 2. Banco de dados

**Migration:** `supabase/migrations/20260615120000_business_analytics.sql`

```sql
-- Eventos brutos (rotacionados)
create table business_page_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  city_id      uuid not null references cities(id),
  event_type   varchar(30) not null,
  -- 'view' | 'phone_click' | 'whatsapp_click' | 'website_click'
  -- | 'directions_click' | 'share' | 'favorite_add'
  session_hash varchar(64) not null,    -- sha256(IP+UA+date) — sem PII
  referrer     text,                    -- só hostname
  source       varchar(40),             -- 'organic' | 'search' | 'category' | 'home_featured'
  occurred_at  timestamptz not null default now()
);
create index bpe_business_date_idx on business_page_events(business_id, occurred_at);
-- TTL: deletar eventos > 90 dias via cron noturno

-- Agregados diários (popular via cron de madrugada)
create table business_daily_stats (
  business_id     uuid not null references businesses(id) on delete cascade,
  city_id         uuid not null references cities(id),
  date            date not null,
  views           integer default 0,
  unique_visitors integer default 0,    -- distinct session_hash
  phone_clicks    integer default 0,
  whatsapp_clicks integer default 0,
  website_clicks  integer default 0,
  directions      integer default 0,
  shares          integer default 0,
  favorites       integer default 0,
  avg_dwell_ms    integer,              -- futuro: requer tracking de saída
  primary key (business_id, date)
);
create index bds_city_date_idx on business_daily_stats(city_id, date desc);

-- Ranking semanal pré-computado (top categoria/bairro)
create table business_weekly_rank (
  business_id  uuid not null references businesses(id),
  city_id      uuid not null references cities(id),
  week_start   date not null,
  category_id  uuid references business_categories(id),
  district_id  uuid references districts(id),
  views_rank   integer,
  views_pctile integer,                  -- percentil (0..100)
  primary key (business_id, week_start, category_id, district_id)
);

-- RLS
alter table business_page_events enable row level security;
alter table business_daily_stats enable row level security;
alter table business_weekly_rank enable row level security;

-- Eventos: insert público (via Server Action), select só admin
create policy "bpe_insert_anyone" on business_page_events for insert with check (true);
create policy "bpe_admin_read" on business_page_events for select
  using (is_city_admin(city_id));

-- Stats: merchant vê seus, admin vê todos
create policy "bds_merchant_read" on business_daily_stats for select
  using (
    is_city_admin(city_id) or
    exists(select 1 from businesses b where b.id = business_id
           and (b.owner_profile_id = auth.uid() or manages_business(b.id)))
  );

create policy "bwr_merchant_read" on business_weekly_rank for select
  using (
    is_city_admin(city_id) or
    exists(select 1 from businesses b where b.id = business_id
           and (b.owner_profile_id = auth.uid() or manages_business(b.id)))
  );
```

---

## 3. Tracking client-side / server-side

### 3.1 View — Server Component (sem JS)

Na página `/comercio/negocio/[slug]/page.tsx` (Server Component), usar `after()` do Next 16 pra disparar o evento sem bloquear render:

```ts
import { after } from 'next/server';
import { trackBusinessEvent } from '@/lib/analytics/track';

export default async function BusinessPage({ params }) {
  const business = await getBusinessBySlug(params.slug);

  after(async () => {
    await trackBusinessEvent({
      businessId: business.id,
      cityId: business.city_id,
      eventType: 'view',
      source: detectSource(headers()),
    });
  });

  return <BusinessFicha business={business} />;
}
```

### 3.2 Cliques — Server Actions

Cada CTA é um `<form action={trackAndRedirectAction}>` ou client component que dispara antes do `window.open`.

```tsx
// components/carmo/business/contact-bar.tsx (client)
'use client';

export function PhoneButton({ businessId, phone }) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={() => {
        // fire-and-forget, não bloqueia
        fetch('/api/track/business-event', {
          method: 'POST',
          body: JSON.stringify({ businessId, eventType: 'phone_click' }),
          keepalive: true,
        });
      }}
    >
      {phone}
    </a>
  );
}
```

`/api/track/business-event/route.ts` valida + insere via service role.

### 3.3 Anti-spam / dedup

- Mesmo `session_hash` + mesmo `business_id` + mesmo `event_type` em < 60s → dedup (ignora)
- Rate limit: > 100 eventos/min do mesmo session_hash → bloqueia

---

## 4. Cron de agregação

**Edge Function** `supabase/functions/aggregate-business-stats/index.ts` rodando todo dia às 04h:

```ts
// Para cada cidade ativa:
//   1. Agregar business_page_events do dia anterior em business_daily_stats
//   2. Calcular unique_visitors via count(distinct session_hash)
//   3. Deletar business_page_events > 90 dias
//
// Toda segunda 05h:
//   4. Recalcular business_weekly_rank (categoria + bairro) com pctile
```

SQL de agregação:
```sql
insert into business_daily_stats (
  business_id, city_id, date, views, unique_visitors,
  phone_clicks, whatsapp_clicks, website_clicks, directions, shares, favorites
)
select
  business_id, city_id, date_trunc('day', occurred_at)::date,
  count(*) filter (where event_type = 'view'),
  count(distinct session_hash) filter (where event_type = 'view'),
  count(*) filter (where event_type = 'phone_click'),
  count(*) filter (where event_type = 'whatsapp_click'),
  count(*) filter (where event_type = 'website_click'),
  count(*) filter (where event_type = 'directions_click'),
  count(*) filter (where event_type = 'share'),
  count(*) filter (where event_type = 'favorite_add')
from business_page_events
where occurred_at >= current_date - interval '1 day'
  and occurred_at < current_date
group by business_id, city_id, date_trunc('day', occurred_at)
on conflict (business_id, date) do update set
  views = excluded.views, ...;
```

---

## 5. Estrutura de arquivos

```
apps/web/
├── app/
│   ├── api/track/
│   │   └── business-event/route.ts        ← endpoint POST
│   └── painel/
│       ├── comercio/[id]/
│       │   ├── analytics/page.tsx         ← dashboard merchant
│       │   └── analytics/export/route.ts  ← CSV download
│       └── cidade/comercio/
│           └── analytics/page.tsx         ← visão admin (todos negócios)
└── lib/
    └── analytics/
        ├── track.ts                       ← trackBusinessEvent (server-side)
        ├── session-hash.ts                ← sha256(IP+UA+date)
        ├── source.ts                      ← detectSource a partir de referrer
        └── queries.ts                     ← getStatsForBusiness, getWeeklyRank

components/
├── analytics/
│   ├── stats-card.tsx                     ← métrica única com sparkline
│   ├── views-chart.tsx                    ← linha 30 dias (Recharts)
│   ├── source-pie.tsx                     ← pizza de fontes
│   ├── ctr-bar.tsx                        ← barra: views vs cliques
│   ├── rank-badge.tsx                     ← "Top 10% em Restaurantes"
│   └── period-picker.tsx                  ← 7d / 30d / 90d
└── carmo/business/
    ├── contact-bar.tsx                    ← (atualizado com tracking)
    └── share-button.tsx                   ← (idem)
```

---

## 6. Dashboard do merchant `/painel/comercio/[id]/analytics`

```
┌────────────────────────────────────────────────────────────┐
│ Restaurante do Lago — Analytics       [7d] [30d▾] [90d]   │
├────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │  1.247   │ │   312    │ │    89    │ │    24    │       │
│ │  Views   │ │ Únicos   │ │ Whatsapp │ │ Ligações │       │
│ │ ↑ 23%    │ │ ↑ 18%    │ │ ↑ 41%    │ │ ↓ 5%     │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├────────────────────────────────────────────────────────────┤
│ 📈 Visualizações nos últimos 30 dias                       │
│  [linha temporal]                                          │
├────────────────────────────────────────────────────────────┤
│ De onde vieram             |  CTR (clique vs visualização) │
│ [pizza]                    |  [barras]                     │
│  • Busca portal: 45%       |  WhatsApp:    7.1% ████       │
│  • Categoria:    28%       |  Telefone:    1.9% █          │
│  • Direto:       15%       |  Direções:    3.2% ██         │
│  • Compartilh.:  12%       |                                │
├────────────────────────────────────────────────────────────┤
│ 🏆 Você está no top 8% em "Restaurantes" desta semana     │
│ Bairro Centro: posição #2 de 14                            │
└────────────────────────────────────────────────────────────┘
[ Baixar CSV ]
```

**Tom da UI:** sem jargão. "Visualizações" não "page views". "Quantas pessoas pediram seu telefone" no tooltip.

---

## 7. Comparações + insights ("nudges")

Componente `<InsightCard>` mostra dicas baseadas nos dados:

- "Suas fotos têm CTR baixo — atualize a foto de capa pra atrair mais cliques"
- "Você teve +23% de views esta semana — bom momento pra postar uma promoção"
- "5 pessoas buscaram 'almoço' e clicaram no seu concorrente. Adicione 'almoço executivo' nas suas tags"
  - Esse último depende do Sprint 13 (busca semântica) — usa search_queries com clicked_entity_id

---

## 8. Visão admin `/painel/cidade/comercio/analytics`

Tabela ranking + filtros:
- Top 50 negócios por views/semana
- Categoria com mais cliques
- Negócios "decolando" (Δ% > 50% semana)
- Negócios "esfriando" (Δ% < -30% semana — nudge admin pra contatar)
- Distribuição por dispositivo (desktop/mobile via UA hash) [opcional]
- Export CSV

---

## 9. CSV export

`/painel/comercio/[id]/analytics/export?range=30d`:
```csv
date,views,unique_visitors,phone_clicks,whatsapp_clicks,website_clicks,shares
2026-05-01,42,38,3,7,1,0
...
```

Útil pra merchant levar pro contador / agência.

---

## 10. Ordem de execução

1. **Dia 1-2:** Migration + RLS + cron de agregação (smoke com dados sintéticos)
2. **Dia 3:** `lib/analytics/{track,session-hash,source}.ts` + endpoint `/api/track/*`
3. **Dia 4:** Adicionar tracking nos componentes existentes (ContactBar, ShareButton, página do negócio com `after()`)
4. **Dia 5:** Componentes `<StatsCard>`, `<ViewsChart>`, `<SourcePie>` (Recharts)
5. **Dia 6-7:** Dashboard merchant `/painel/comercio/[id]/analytics` completo
6. **Dia 8:** Visão admin + CSV export
7. **Dia 9:** Insights/nudges + smoke E2E (gerar 1000 eventos sintéticos, validar agregados)
8. **Dia 10:** Polimento UX + entrevista com 2 comerciantes (validar se entendem o painel)

---

## 11. Definition of Done

- [ ] Migration aplicada + cron de agregação rodando diariamente
- [ ] Eventos brutos rotacionam após 90 dias
- [ ] `view` registrado via `after()` sem bloquear render
- [ ] Cliques (phone, whatsapp, website, directions, share) registrados via API
- [ ] Dedup de eventos do mesmo session_hash em 60s funciona
- [ ] Dashboard merchant carrega em < 1s
- [ ] Recharts renderiza linha 30 dias e pizza de fontes
- [ ] Comparação semana vs semana anterior (Δ%)
- [ ] Rank badge mostra posição real na categoria + bairro
- [ ] Export CSV funcional
- [ ] Visão admin lista top/decolando/esfriando
- [ ] Pelo menos 1 InsightCard implementado
- [ ] 2 comerciantes reais conseguem responder "quantas pessoas viram seu negócio essa semana?" sozinhos
- [ ] Documentação Davia: `.davia/assets/analytics-comerciante.html`

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| Volume de eventos explode banco | Rotação em 90 dias + agregados diários como fonte de verdade |
| Tracking quebra performance da página pública | `after()` do Next 16 + `keepalive: true` no fetch dos cliques |
| LGPD: tracking visto como invasivo | Sem cookie, sem PII, hash de IP+UA → opaco. Política em `/privacidade` explica |
| Bots inflam números | Rate limit por session_hash + filtro de UAs conhecidos no cron de agregação |
| Comerciante vê números baixos e desmotiva | Foco em Δ% e percentil (relativo > absoluto). Insights positivos primeiro |
| Cron de agregação falha silenciosamente | Healthcheck `/painel/super/saude-tecnica` mostra "última agregação" + alerta se > 30h |

---

## 13. Métricas-bússola

- **Engajamento merchant:** % de merchants que abriram o painel de analytics nos últimos 7 dias (target > 60%)
- **Recorrência:** dias da semana em que merchant volta ao painel
- **Conversão pra plano premium:** % que upgradou após ver o painel (mede valor percebido)
- **NPS pós-onboarding:** pesquisa de 1-pergunta após 30 dias de uso do analytics
