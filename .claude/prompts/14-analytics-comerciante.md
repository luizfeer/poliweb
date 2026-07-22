# Prompt — Sprint 14: Analytics de Comerciante

> Cole junto com `.claude/prompts/00-onboarding.md`.

---

## Contexto

"Mini Google Analytics" pro tio do mercadinho — bonito, sem jargão, em PT-BR. Prova de valor pra vender plano premium / ads.

**Comece lendo:**
- `.claude/plans/14-analytics-comerciante.md` — plano detalhado
- `apps/web/app/comercio/negocio/[slug]/page.tsx` — onde adicionar tracking de view
- `apps/web/components/carmo/business/contact-bar.tsx` — onde adicionar tracking de cliques

## Pré-requisitos

1. Sprint 13 (busca semântica) entregue — Insights vão usar `search_queries` pra sugerir tags
2. Volume mínimo de tráfego: ~50+ views/dia/negócio top (validar antes de começar)
3. Recharts: `pnpm --filter web add recharts`
4. Decidir paleta dos charts alinhada com brand Nova/Carmo

## Privacy-first

Sem cookies de tracking, sem PII. Hash de IP+UA+date é a chave de sessão. Política em `/privacidade` precisa ser atualizada explicando o tracking agregado.

## Ordem de execução (10 dias estimados)

### Dia 1-2 — Banco

Migration `20260615120000_business_analytics.sql`:
- `business_page_events` — eventos brutos (rotacionados em 90 dias)
- `business_daily_stats` — agregados (PK composta `business_id, date`)
- `business_weekly_rank` — ranking por categoria + bairro com percentil
- RLS: insert anônimo nos events; select de stats só dono ou admin (via `manages_business`)

Cron de agregação `supabase/functions/aggregate-business-stats/index.ts` rodando 04h:
- INSERT INTO `business_daily_stats` SELECT FROM `business_page_events` GROUP BY business_id, date
- DELETE FROM `business_page_events` WHERE occurred_at < now() - interval '90 days'
- Toda segunda 05h: recalcular `business_weekly_rank` com `percent_rank()` por categoria + bairro

Aplicar e regenerar tipos.

### Dia 3 — Lib de tracking

`apps/web/lib/analytics/`:
- `session-hash.ts` — `sha256(ip + ua + date_today)` — opaco
- `source.ts` — `detectSource(headers)` retorna `'organic' | 'search' | 'category' | 'home_featured'` baseado em referrer
- `track.ts` — `trackBusinessEvent({ businessId, cityId, eventType, source })` via service role
- `dedup.ts` — Redis ou tabela in-memory: mesmo session_hash + business_id + event_type em < 60s = ignora
- `rate-limit.ts` — > 100 eventos/min do mesmo session_hash = bloqueia

Endpoint `app/api/track/business-event/route.ts` — POST que valida e insere.

### Dia 4 — Adicionar tracking nos componentes existentes

#### Views (Server Component)
Em `app/comercio/negocio/[slug]/page.tsx`:
```tsx
import { after } from 'next/server';

export default async function BusinessPage({ params }) {
  const business = await getBusinessBySlug(params.slug);
  after(async () => {
    await trackBusinessEvent({
      businessId: business.id,
      cityId: business.city_id,
      eventType: 'view',
      source: detectSource(await headers()),
    });
  });
  return <BusinessFicha business={business} />;
}
```

#### Cliques (Client Component)
Em `components/carmo/business/contact-bar.tsx` — converter pra client se ainda não for:
```tsx
'use client';
function trackClick(businessId, eventType) {
  fetch('/api/track/business-event', {
    method: 'POST',
    body: JSON.stringify({ businessId, eventType }),
    keepalive: true,
  });
}
// onClick em telefone/whatsapp/website/directions/share
```

### Dia 5 — Componentes de gráfico

`components/analytics/`:
- `stats-card.tsx` — métrica + sparkline + comparação Δ%
- `views-chart.tsx` — linha 30 dias (Recharts `LineChart`)
- `source-pie.tsx` — pizza de origens (Recharts `PieChart`)
- `ctr-bar.tsx` — barras: views vs cliques por tipo
- `rank-badge.tsx` — "Top 8% em Restaurantes" / "#2 de 14 no Centro"
- `period-picker.tsx` — 7d / 30d / 90d (search param)

### Dia 6-7 — Dashboard merchant

`app/painel/comercio/[id]/analytics/page.tsx`:
- Header com nome do negócio e period picker
- 4 stats cards: views, únicos, whatsapp_clicks, phone_clicks (com Δ% semana anterior)
- Views chart 30 dias
- Source pie + CTR bar lado a lado
- Rank badge no rodapé
- Botão "Baixar CSV" → `app/painel/comercio/[id]/analytics/export/route.ts`

`lib/analytics/queries.ts`:
- `getBusinessStats(businessId, fromDate, toDate)`
- `getBusinessRank(businessId)`
- `getStatsCSV(businessId, fromDate, toDate)`

### Dia 8 — Visão admin

`app/painel/cidade/comercio/analytics/page.tsx`:
- Top 50 negócios por views/semana
- Tabela: Δ% (decolando se > +50%, esfriando se < -30% — útil pra contatar merchant)
- Categoria com mais cliques
- Distribuição de dispositivo (desktop/mobile via UA hash)
- Export CSV agregado

### Dia 9 — Insights / nudges

`components/analytics/insight-card.tsx` — sugestões baseadas nos dados:
- "Suas fotos têm CTR baixo — atualize a foto de capa"
- "Você teve +23% de views — bom momento pra postar promoção"
- "5 pessoas buscaram 'almoço' e clicaram no concorrente. Adicione 'almoço executivo' nas tags" (depende do Sprint 13)

Engine de regras simples em `lib/analytics/insights.ts` — N casos hardcoded.

### Dia 10 — Polimento + entrevista de validação

- Loading skeletons
- Empty states (negócio novo sem dados)
- **Entrevistar 2 comerciantes reais** — validar se entendem o painel sem ajuda
- Atualizar `/privacidade` mencionando tracking agregado anônimo

## Cuidados

- **Volume de eventos brutos explode** — TTL de 90 dias é crítico. Monitorar tamanho da tabela
- **`after()` do Next 16** — confirmar que está habilitado em prod (pode requerer flag)
- **LGPD** — sem cookie, sem PII, hash opaco. Política precisa explicar isso claramente
- **Bots inflam números** — filtro de UAs conhecidos no cron de agregação
- **Comerciante vê números baixos e desmotiva** — foco em Δ% e percentil (relativo > absoluto). InsightCard sempre positivo primeiro
- **Cron de agregação falha silenciosamente** — `painel/super/saude-tecnica` mostra "última agregação" + alerta se > 30h

## Definition of Done

Checklist completo em `.claude/plans/14-analytics-comerciante.md` seção 11. **Critério final:** 2 comerciantes reais conseguem responder "quantas pessoas viram seu negócio essa semana?" sozinhos.

## Próximo sprint

Após Analytics validado, próximas opções (não-priorizadas):
- Sprint 15 — Multi-cidade (ativar Capitólio)
- Sprint 16 — Worker de transparência (scrapers VPS)
- Sprint 17 — Pedidos nativos + PIX (e-commerce)

Discutir com o usuário qual faz mais sentido após validar tração com analytics.
