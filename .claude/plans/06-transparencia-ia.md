# Plano 06 — Transparência + Pipeline de IA (próxima sprint)

> **Pré-requisito:** Plano 05 (verificação) concluído. Bugs identificados resolvidos.

## 1. Contexto

Camada de **transparência** é o diferencial editorial do portal: o cidadão de Carmo não tem hoje um lugar único pra ler o Diário Oficial, atas da câmara, licitações ou status de obras. Como esses textos são longos e juridiquês, a IA resume em linguagem cidadã com link pra fonte original.

Tabelas já existem (`20260429120600_transparency_ads_ai.sql`). O que falta é:
1. Pipeline de scraper em app worker separado, rodando na VPS
2. Pipeline de resumo IA no mesmo worker, com fila e orçamento
3. Páginas públicas + painel city_admin pra revisar/republicar
4. Moderação IA do UGC dos sprints anteriores (classifieds, reviews)
5. Embeddings + busca semântica

Sprint dura 2 semanas. Custo IA esperado < US$ 30/mês. Resumos usam OpenAI `gpt-5.4-nano` como padrão barato/custo-benefício; subir para `gpt-5.4-mini` só em atos longos ou com baixa confiança. A coleta é parte do app local de informações públicas, não um serviço descartável: deve ser modular, observável e fácil de rodar numa VPS barata.

## 2. Tabelas e RLS

Já existem em `transparency_ads_ai.sql`:
- `official_diaries`, `diary_acts`
- `council_meetings`, `council_topics`
- `public_tenders`, `public_works`
- `embeddings` (pgvector), `ai_jobs`

A verificar/adicionar nesta sprint:

- [ ] `diary_acts.flagged boolean default false` — admin pode esconder ato com dados pessoais sensíveis (LGPD)
- [ ] `diary_acts.summary_status enum('pending','done','failed')` — controla pipeline IA
- [ ] `public.embeddings` com índice `ivfflat` em `embedding vector_cosine_ops` — checar se a migration criou
- [ ] Função `match_documents(query_embedding, match_threshold, match_count, filter_city_id)` retornando entity_type+entity_id+similaridade

**RLS:**
- `diary_acts`, `council_topics`, `public_tenders`, `public_works`: SELECT público para `status='published' AND flagged=false`. UPDATE/INSERT só `is_city_admin(city_id)`.
- `ai_jobs`: SELECT só admin. INSERT via service role (worker ou Edge Function leve).
- `embeddings`: SELECT via função `match_documents` apenas (não SELECT direto).

**Índices e constraints sugeridos:**
- `unique (city_id, source_url)` em `official_diaries`, `diary_acts`, `council_meetings`, `public_tenders` quando `source_url` existir.
- Chaves naturais parciais como fallback: diário por `(city_id, edition_number, published_at)`, sessão por `(city_id, meeting_type, meeting_number, started_at)`, licitação por `(city_id, process_number, bid_number)`.
- Índices por listagem pública: `(city_id, status, published_at desc)`, `(city_id, status, opening_at desc)`.
- `embeddings` com índice `ivfflat (embedding vector_cosine_ops)` e filtro por `city_id`.

## 3. Server-side

### 3.1 App worker de transparência (VPS)

Criar um app separado no monorepo:

```
apps/worker/
├── src/
│   ├── jobs/
│   │   ├── scrape-diario-oficial.ts      # diário 6h
│   │   ├── scrape-atas-camara.ts         # semanal
│   │   ├── scrape-licitacoes.ts          # diário
│   │   ├── scrape-alertas-cemig-copasa.ts # cada 2h
│   │   ├── summarize-pending.ts          # fila de resumo IA
│   │   ├── embed-pending.ts              # fila pgvector
│   │   └── moderate-backlog.ts           # pendências UGC antigas
│   ├── sources/
│   │   ├── carmo-diario-oficial.ts
│   │   ├── carmo-camara-sessoes.ts
│   │   └── carmo-licitacoes.ts
│   ├── parsers/                          # funções puras
│   ├── persistence/                      # upsert + checksum + ai_jobs
│   ├── ai/                               # prompts, budget, summarize, embeddings
│   ├── runtime/                          # retry, timeout, logger, scheduler
│   └── index.ts
└── package.json
```

**Decisão técnica: Bun ou Node 20 + TypeScript.** Preferência inicial: Node 20 com `tsx` para reduzir risco em VPS e CI. Bun fica aceito se os parsers exigirem mais throughput depois.

**Padrão de cada job:**
1. Lê env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_SUMMARY_MODEL`
2. Cria registro em `ai_jobs` com `status='running'`
3. Busca páginas oficiais com `fetch` + timeout + retry com backoff
4. Parseia HTML com funções puras, sem persistência misturada
5. Calcula `checksum` estável por item normalizado
6. Faz upsert por `source_url` ou chave natural estável
7. Se checksum não mudou, marca `skipped` e não reprocessa IA
8. Enfileira resumo/embedding somente quando item é novo ou mudou
9. Atualiza `ai_jobs` com tokens, custo estimado, contadores e erro final
10. Retorna/loga `{ ok, processed, inserted, updated, skipped, errors }`

**Fontes oficiais iniciais:**
- Diário Oficial: `https://www.carmodorioclaro.mg.gov.br/portal/diario-oficial`
- Sessões Plenárias: `https://www.carmodorioclaro.cam.mg.gov.br/portal/sessaoplenaria`
- Licitações: `https://www.carmodorioclaro.mg.gov.br/portal/editais/1`

**Edge Functions nesta arquitetura:**
- Não são o executor principal do scraping pesado.
- Podem existir como callbacks leves para cron externo, triggers de UGC ou disparo manual do painel.
- O caminho feliz é VPS → `apps/worker` → Supabase.

### 3.2 Server Actions (painel)

`apps/web/app/painel/cidade/transparencia/actions.ts`:
- `flagAct(actId, reason)` — esconde ato sensível
- `republishAct(actId)` — marca `summary_status='pending'` e solicita reprocessamento ao worker
- `triggerScraperManual(source)` — botão de "rodar agora" no painel; chama endpoint protegido do worker
- `dismissJob(jobId)` — descarta ai_job que falhou

Toda Server Action: Zod, `is_city_admin`, log em `audit_log`.

### 3.3 Contratos de scraping

Todo item coletado deve persistir:
- `city_id`
- `source_url`
- `source_host`
- `scraped_at`
- `published_at` quando a fonte informar
- `title`
- `raw_text`
- `raw_html_excerpt`
- `checksum`
- `parse_confidence`
- `parser_warnings`

**Diário Oficial:**
- Extrair `edition_number`, `published_at`, `title`, `detail_url`, `download_url`, `page_count`, `file_size`.
- Tentar obter texto integral da edição/ato.
- Classificar: lei, decreto, portaria, resolução, edital, extrato, chamamento, licitação, nomeação, convênio, termo aditivo, processo seletivo, outros.
- Detectar `flagged_suspected=true` para CPF, endereço residencial, prontuário, laudo médico, menores e indícios de dado sensível.

**Sessões da Câmara:**
- Extrair `meeting_type`, `meeting_number`, `legislature`, `session_label`, `started_at`, `detail_url`.
- Na página de detalhe, extrair pauta, proposições, autores, votações, resultado e anexos quando existirem.
- Normalizar `council_topics` por assunto, sem inventar campos ausentes.

**Licitações:**
- Extrair `bid_number`, `process_number`, `modality`, `status`, `object_summary`, `posted_at`, `opening_at`, `updated_at`, `detail_url`.
- Quando disponível, extrair valor estimado, secretaria demandante, vencedor, homologação, retificação, suspensão e anexos.

### 3.4 lib/ai/

Estender:
- `lib/ai/openai.ts` — wrapper único para Responses API + embeddings
- `lib/ai/prompts.ts` — prompts canônicos (resumir DO, classificar UGC, anonimizar nomes)
- `lib/ai/budget.ts` — `assertWithinBudget(cityId)`: aborta se gasto do mês > teto
- `lib/ai/embeddings.ts` — wrapper OpenAI text-embedding-3-small + insert em `embeddings`

No worker, esses contratos podem ser reaproveitados ou espelhados em `apps/worker/src/ai/`. Se houver duplicação inevitável, mover tipos e prompts puros para `packages/shared`.

### 3.5 lib/transparency/

`apps/web/lib/transparency/queries.ts`:
- `listDiaryActs({ from, to, type })`
- `listCouncilTopics({ from, to })`
- `listPublicTenders({ status })`
- `listPublicWorks({ status })`
- `searchSemantic(query, cityId)` → chama `match_documents` rpc

### 3.6 lib/search/

`semanticSearch(query)` para busca sitewide:
1. Embed query (OpenAI)
2. `rpc('match_documents')` com filtro `city_id`
3. Hidrata resultados (lookup nas tabelas reais)
4. Ordena por similaridade

## 4. UI público

### Rotas

- `/transparencia` — hub com últimos atos do DO + atas + licitações abertas + obras
- `/transparencia/diario-oficial` — timeline mensal de atos com filtro por tipo (lei, decreto, nomeação, licitação)
- `/transparencia/diario-oficial/[id]` — ato individual: resumo IA + texto original colapsável + link fonte
- `/transparencia/atas-camara` — lista de sessões + temas resumidos por vereador
- `/transparencia/atas-camara/[meetingId]` — detalhe da sessão
- `/transparencia/licitacoes` — em aberto + histórico
- `/transparencia/obras` — mapa Maplibre + lista
- `/transparencia/buscar?q=` — busca semântica IA ("o que decidiram sobre escolas?")

### Componentes (`components/carmo/transparency/`)

- `DiaryActCard` — card com tipo, data, resumo IA, badge "Resumido por IA", link "Ver ato original"
- `ActDetail` — página de detalhe com toggle resumo/texto-original
- `CouncilSession` — lista de tópicos com autor + voto
- `TenderRow` — número, modalidade, valor, prazo, status
- `PublicWorkPin` — marcador no mapa com popup
- `SemanticSearchResults` — lista de resultados cross-modal

### Componente já existente

`AICallout` (`components/carmo/ai-callout.tsx`) — usar para todo conteúdo gerado por IA. Sempre com link `source.href` apontando pro original.

## 5. UI painel

### `/painel/cidade/transparencia/`

Páginas:
- `page.tsx` — dashboard: jobs em execução, atos pendentes de revisão, alertas de scraper falhando
- `diario-oficial/page.tsx` — lista filtrável, ações: flag, republish, link fonte
- `diario-oficial/[id]/page.tsx` — edição manual do resumo (raras correções)
- `atas-camara/page.tsx`, `licitacoes/page.tsx`, `obras/page.tsx` — CRUD análogo
- `ai-jobs/page.tsx` — observabilidade: tokens, custo do mês, falhas, botão "rodar scraper agora"

### Componentes painel

- `JobStatusBadge` — pending/running/done/failed com cor
- `BudgetMeter` — barra de progresso do gasto IA do mês vs teto
- `ScraperHealthCard` — última execução, próximo run, último erro
- `FlagDialog` — confirma flag de ato (justifica + grava em audit_log)

### Cron config

Na VPS, preferir `systemd timers` ou `crontab` chamando o CLI do worker:

```bash
cd /opt/hail-mary
pnpm --filter worker scrape:diario
pnpm --filter worker scrape:atas
pnpm --filter worker scrape:licitacoes
pnpm --filter worker summarize:pending
pnpm --filter worker embed:pending
```

`apps/web/vercel.json` só deve ser criado se o Vercel Cron for usado como fallback para bater em um endpoint protegido do worker. Cada endpoint precisa validar `Authorization: Bearer ${WORKER_CRON_SECRET}`.

## 6. Pipeline de moderação UGC retroativa

Sprints 1-4 deixaram classifieds e reviews em `status='pending'` aguardando moderação. Esta sprint deve **moderar retroativamente**:

1. Trigger DB on insert em `classifieds`, `business_reviews`, `lost_pets`, `lost_and_found` chama Edge Function `moderate-ugc`
2. `moderate-ugc` usa OpenAI barato para classificar:
   - `auto_approve` (claramente OK) → `status='published'`
   - `flag_for_review` → permanece `pending`, notifica admin
   - `auto_reject` (xingamento, spam) → `status='rejected'`
3. Job batch no worker para processar pendências antigas: `pnpm --filter worker moderate:backlog`

## 7. Definition of Done

### Banco
- [ ] Coluna `flagged` adicionada (migration) onde necessário
- [ ] Índice ivfflat em `embeddings`
- [ ] Função `match_documents` criada e testada
- [ ] RLS de transparência testada com 3 papéis

### Pipeline IA
- [x] `apps/worker` criado com jobs modulares de diário, atas, licitações, resumos, embeddings e moderação
- [x] Worker compilando localmente com TypeScript
- [x] Deploy em VPS iniciado com `.env.example` e units `systemd`
- [ ] Worker rodando contra Supabase real com `pnpm --filter worker ...`
- [ ] Healthcheck por email se 0 atos coletados em 3 dias
- [ ] `BudgetMeter` mostra gasto real do mês
- [ ] Custo do mês de teste < US$ 5

### Públicas
- [ ] `/transparencia` hub renderiza dados reais
- [ ] `/transparencia/diario-oficial` lista 30+ atos com resumo IA
- [ ] `/transparencia/buscar` retorna resultados semânticos relevantes
- [ ] Toda página IA-gerada com badge + link fonte
- [ ] LGPD: nenhum CPF, endereço residencial ou nome em ato sensível visível ao público

### Painel
- [ ] city_admin consegue flag/republish ato
- [ ] city_admin vê dashboard de jobs IA com custo e falhas
- [ ] Backlog de UGC moderado (< 100 itens em pending)

### Davia
- [ ] `transparencia.html` atualizada
- [ ] `ai-pipeline.html` mostra fluxo real (não mockado)
- [ ] `data/ai-cost.json` com 1 mês de custo real
- [ ] `roadmap.html` marca Sprint 5 como ✅

### Build & qualidade
- [ ] `pnpm build` limpo
- [ ] `pnpm lint` zero
- [ ] Sem `any` introduzido
- [ ] Server Actions com Zod
- [ ] Smoke test ponta-a-ponta gravado em `.claude/plans/06-resultados.md`

## 8. Riscos específicos

| Risco | Mitigação |
|---|---|
| HTML do DO de Carmo muda e quebra parser | Healthcheck + fallback pra processamento manual |
| VPS fica fora do ar | `ai_jobs` expõe última execução; painel alerta atraso; jobs são idempotentes e podem rodar backlog |
| IA alucina e atribui ato errado | Sempre exibir texto original + link fonte; admin pode flag |
| Custo IA estoura | Cap mensal em código; alerta em 80%; modo degradado com `gpt-5.4-nano` e checksum |
| LGPD em DO (afastamentos médicos, processos individuais) | Prompt instrui anonimizar; admin tem botão flag pra esconder |
| Embeddings ficam stale após edição admin | Trigger pgvector reembebe on update |

## 9. Próximo passo após esta sprint

Sprint 7 — **Comércio polish + classificados pesados + soft launch:**
- SEO técnico (sitemap, schema.org)
- Acessibilidade (axe)
- Analytics (Plausible)
- Resumo semanal por email da newsletter
- Soft launch com 50-100 betatesters de Carmo
