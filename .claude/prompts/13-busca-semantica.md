# Prompt — Sprint 13: Busca Semântica Unificada

> Cole junto com `.claude/prompts/00-onboarding.md`.

---

## Contexto

Busca unificada por intenção ("almoçar perto da praça") usando embeddings OpenAI + pgvector. Diferencial competitivo — nenhum portal hiperlocal do interior tem isso.

**A tabela `embeddings` JÁ EXISTE** no schema (migration `20260429120600_transparency_ads_ai.sql`). Falta popular e expor UI.

**Comece lendo:**
- `.claude/plans/13-busca-semantica.md` — plano detalhado
- `supabase/migrations/20260429120600_transparency_ads_ai.sql` (search por "embeddings")
- `apps/worker/` — estrutura existente do worker (se já existe)

## Pré-requisitos

1. Confirmar `pgvector` extension habilitada: `select extname from pg_extension where extname='vector';`
2. Confirmar OpenAI API key (já em `.env.example` — restaurar de comentário se necessário)
3. Decidir hosting do worker: VPS Hetzner (~$5/mês) ou Railway/Fly.io
4. Anthropic SDK também necessário se for re-rank com Haiku (fase 2)

## Por que OpenAI e não local

`text-embedding-3-small` custa ~$0.02/1M tokens. Para 5k registros indexados + 1k queries/dia = ~$1/mês. Alternativa local exige RAM/GPU dedicada que custa 10x mais até atingir escala.

## Ordem de execução (12 dias estimados)

### Dia 1-2 — Banco e triggers

Migration `20260601120000_busca_semantica.sql`:
- Index ANN: `create index embeddings_vector_idx on embeddings using ivfflat (vector vector_cosine_ops) with (lists=100)`
- Adicionar `content_hash varchar(64)` e `indexed_at timestamptz` na tabela `embeddings`
- UNIQUE em `(entity_type, entity_id, city_id)`
- Tabela `indexing_queue` (worker consome)
- Tabela `search_queries` (analytics + descobrir gaps)
- RPC `match_embeddings(p_city_id, p_query_vector, p_limit)`
- Trigger `enqueue_indexing()` em 8 tabelas: `businesses`, `accommodations`, `restaurants`, `fishing_guides`, `events`, `classifieds`, `properties`, `attractions`, `tour_packages`
  - Só enfileira quando `status` indica visibilidade pública
  - DELETE também enfileira pra remover do índice

Aplicar e regenerar tipos.

### Dia 3-4 — Worker de indexação

Em `apps/worker/src/indexing/`:
- `index.ts` — loop principal a cada 30s; processa batch de 20
- `fetch-content.ts` — `switch (entity_type)` carrega da tabela com JOINs necessários
- `build-document.ts` — texto canônico **só campos relevantes**:
  ```ts
  // business: nome, descrições, tags, categorias, endereço, bairro
  // event: título, descrição, local, categoria, data
  // classified: título, descrição, categoria, preço, condição
  // ... (sem telefone, CNPJ, links)
  ```
- `embed.ts` — wrapper OpenAI (env `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`)
- `upsert.ts` — verifica `content_hash`; só re-embeda se mudou

Smoke test: indexar 50 negócios reais de Carmo, validar que vetores caíram no banco.

### Dia 5 — Lib de busca

`apps/web/lib/search/`:
- `semantic.ts` — `semanticSearch(query, cityId, options)` chamando RPC `match_embeddings` + hidratação por entity_type
- `fulltext.ts` — fallback ILIKE em `name`/`short_description` quando embedding não existe
- `hydrate.ts` — joins paralelos por tipo (Promise.all + map por entity_type)
- `embed-query.ts` — wrapper OpenAI (cache em memória de 24h por hash da query)
- Server Action `trackSearchClickAction(queryId, entityType, entityId)`

### Dia 6-7 — Página `/buscar`

- `app/buscar/page.tsx` (Server Component, lê `?q=`)
- `components/search/`:
  - `search-results-list.tsx` — cards heterogêneos por tipo
  - `search-result-card.tsx` — variação por `entity_type`
  - `search-filters.tsx` — checkboxes por tipo
  - `search-empty-state.tsx` — sugestões de queries quando 0 resultados
- Track de query e cliques registra em `search_queries`

### Dia 8 — SearchBar global

- Refatorar `components/carmo/app-header.tsx` (atualmente o header tem só link pra `/comercio/buscar`)
- Novo input com sugestões inline:
  - Debounce 300ms via `useDeferredValue` ou `useTransition`
  - Endpoint `/api/search/suggest?q=` retorna top 6
  - Atalho `/` foca a busca (client component)
  - Placeholder rotativo: "almoçar perto da praça", "encanador", "pousada com piscina"

### Dia 9 — Painel admin de insights

`app/painel/cidade/busca/insights/page.tsx`:
- Top 50 queries do mês (com count)
- Queries com 0 resultados (gap de conteúdo — produto sabe o que falta)
- Queries com 0 cliques (relevância ruim)
- Distribuição de tipos clicados (pizza)
- Latência média

### Dia 10-12 — Tunning e relevância

- Smoke test com **20 queries reais de Carmo** — alvo: top-3 contém resultado correto em 16/20
- Ajustar `buildDocument` se houver gaps consistentes
- Considerar re-rank com Haiku se relevância < 80%
- Latência alvo: < 800ms P95

## Cuidados

- **Custo OpenAI escala mal sem cache** — implementar cache de query vectors (mesma query em 24h reusa)
- **Worker cai e fila explode** — cron monitor: alerta se `count(processed_at is null) > 1000`
- **Vendor lock OpenAI** — wrapper `embed()` permite trocar por Voyage AI ou local em 1 dia
- **Conteúdo PT-BR** — `text-embedding-3-small` é multilingual mas fazer smoke test em queries reais antes de promover
- **pgvector lists=100** funciona até ~1M registros; após, considerar HNSW

## Definition of Done

Checklist completo em `.claude/plans/13-busca-semantica.md` seção 12.

## Próximo sprint

Com tráfego de busca rodando (semana 2 pós-deploy), partir para **Sprint 14 (Analytics de comerciante)** seguindo `.claude/prompts/14-analytics-comerciante.md`.
