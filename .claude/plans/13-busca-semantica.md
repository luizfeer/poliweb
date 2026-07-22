# Plano 13 — Busca semântica unificada

> **Pré-requisito:** Sprint 12 entregue. Conteúdo populado em comércio, turismo, classificados e eventos.
> **Estimativa:** 2 semanas (1 worker + 1 web).

---

## 1. Por quê agora

Usuário não pensa em "categoria" — pensa em intenção:
- "almoçar perto da praça"
- "encanador de confiança"
- "pousada com piscina pra família"
- "preciso de eletricista hoje"

Hoje, busca tradicional força o usuário a saber em qual módulo procurar. Busca semântica unifica e entende a intenção.

**Diferencial competitivo:** Nenhum portal hiperlocal do interior tem isso. É o argumento de "portal moderno".

A tabela `embeddings` **já existe** no schema (migration `20260429120600`). Falta popular e expor.

---

## 2. Stack de busca

**Embeddings:** OpenAI `text-embedding-3-small` (1536 dim, ~$0.02/1M tokens — muito barato).

**Por que não open-source local?** O custo do worker rodando modelo local (RAM + CPU/GPU) supera o custo da API por 10x até atingir ~50k registros/mês.

**Vector store:** `pgvector` no próprio Supabase — sem novo serviço.

**Re-rank (fase 2):** Claude Haiku para re-rankear top 20 → top 5 com explicação. Opcional.

---

## 3. Banco de dados

A tabela `embeddings` já existe. Migration `20260601120000_busca_semantica.sql` complementa:

```sql
-- Garantir extensão (provavelmente já está):
create extension if not exists vector;

-- Index ANN (Approximate Nearest Neighbor) pra performance
create index if not exists embeddings_vector_idx on embeddings
  using ivfflat (vector vector_cosine_ops) with (lists = 100);

-- Hash do conteúdo pra dedup/re-index incremental
alter table embeddings add column if not exists content_hash varchar(64);
alter table embeddings add column if not exists indexed_at timestamptz default now();
create unique index if not exists embeddings_unique_idx
  on embeddings(entity_type, entity_id, city_id);

-- Fila de indexação (worker consome)
create table if not exists indexing_queue (
  id           uuid primary key default gen_random_uuid(),
  entity_type  varchar(40) not null,
  entity_id    uuid not null,
  city_id      uuid not null references cities(id),
  operation    varchar(10) not null,    -- 'upsert' | 'delete'
  attempts     integer default 0,
  last_error   text,
  enqueued_at  timestamptz default now(),
  processed_at timestamptz,
  unique (entity_type, entity_id) -- dedup; última op vence
);
create index indexing_queue_pending on indexing_queue(enqueued_at)
  where processed_at is null;

-- Histórico de queries (analytics + descobrir gaps)
create table search_queries (
  id            uuid primary key default gen_random_uuid(),
  city_id       uuid not null references cities(id),
  profile_id    uuid references profiles(id), -- null se anônimo
  query         text not null,
  result_count  integer not null,
  clicked_entity_type varchar(40),
  clicked_entity_id   uuid,
  session_hash  varchar(64),
  created_at    timestamptz default now()
);
create index search_queries_city_idx on search_queries(city_id, created_at desc);

-- RLS
alter table indexing_queue enable row level security;
alter table search_queries enable row level security;

create policy "indexing_queue_admin" on indexing_queue for all
  using (is_super_admin() or is_city_admin(city_id));

create policy "search_queries_admin_read" on search_queries for select
  using (is_city_admin(city_id));
create policy "search_queries_insert_anyone" on search_queries for insert
  with check (true); -- inserts vêm via service role no Server Action
```

### 3.1 Triggers de fila

Pra cada tabela indexável, trigger que enfileira em INSERT/UPDATE/DELETE:

```sql
create or replace function public.enqueue_indexing()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values (tg_argv[0], old.id, old.city_id, 'delete')
    on conflict (entity_type, entity_id) do update
      set operation = 'delete', processed_at = null, attempts = 0, enqueued_at = now();
    return old;
  end if;

  -- Só reindexa se status indica visibilidade pública
  if (new.status in ('active', 'approved', 'published')) then
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values (tg_argv[0], new.id, new.city_id, 'upsert')
    on conflict (entity_type, entity_id) do update
      set operation = 'upsert', processed_at = null, attempts = 0, enqueued_at = now();
  end if;
  return new;
end; $$;

-- Aplicar a cada tabela
create trigger businesses_indexing
  after insert or update or delete on businesses
  for each row execute function enqueue_indexing('business');

-- repetir para: accommodations, restaurants, fishing_guides, events,
-- classifieds, properties, attractions, tour_packages
```

---

## 4. Worker de indexação (apps/worker)

### 4.1 Estrutura

```
apps/worker/src/indexing/
├── index.ts                    ← entry point: loop a cada 30s
├── fetch-content.ts            ← busca conteúdo da entity table
├── build-document.ts           ← monta texto canônico pra embedding
├── embed.ts                    ← OpenAI client
└── upsert.ts                   ← grava em embeddings
```

### 4.2 Loop principal

```ts
// apps/worker/src/indexing/index.ts
async function processIndexingQueue() {
  const supabase = createServiceRoleClient();

  while (true) {
    const { data: items } = await supabase
      .from('indexing_queue')
      .select('*')
      .is('processed_at', null)
      .lt('attempts', 3)
      .order('enqueued_at')
      .limit(20);

    if (!items?.length) {
      await sleep(30_000);
      continue;
    }

    for (const item of items) {
      try {
        if (item.operation === 'delete') {
          await deleteEmbedding(item.entity_type, item.entity_id);
        } else {
          const content = await fetchContent(item.entity_type, item.entity_id);
          if (!content) throw new Error('Conteúdo não encontrado');

          const document = buildDocument(item.entity_type, content);
          const hash = sha256(document);

          // Dedup: se hash já existe, só atualiza indexed_at
          const existing = await getExistingHash(item.entity_type, item.entity_id);
          if (existing === hash) {
            await touchIndexedAt(item.entity_type, item.entity_id);
          } else {
            const vector = await embed(document);
            await upsertEmbedding({
              entity_type: item.entity_type,
              entity_id: item.entity_id,
              city_id: item.city_id,
              content: document.slice(0, 2000),
              content_hash: hash,
              vector,
            });
          }
        }

        await supabase.from('indexing_queue')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', item.id);
      } catch (err) {
        await supabase.from('indexing_queue')
          .update({ attempts: item.attempts + 1, last_error: String(err) })
          .eq('id', item.id);
      }
    }
  }
}
```

### 4.3 buildDocument: texto canônico

```ts
function buildDocument(type: string, content: any): string {
  switch (type) {
    case 'business':
      return [
        `Nome: ${content.name}`,
        content.short_description && `Descrição: ${content.short_description}`,
        content.long_description,
        content.tags?.length && `Tags: ${content.tags.join(', ')}`,
        content.categories?.length && `Categorias: ${content.categories.map(c => c.name).join(', ')}`,
        content.address && `Endereço: ${content.address}`,
        content.district?.name && `Bairro: ${content.district.name}`,
      ].filter(Boolean).join('\n');
    // similar para accommodation, restaurant, event, classified...
  }
}
```

Princípio: incluir só campos *relevantes pra busca semântica*. Telefone, CNPJ, links — nada disso entra.

---

## 5. Server-side da busca

### `apps/web/lib/search/semantic.ts`

```ts
import 'server-only';

export type SearchHit = {
  entity_type: string;
  entity_id: string;
  score: number;          // similaridade 0..1
  title: string;          // preview
  subtitle?: string;
  url: string;            // link da ficha
  cover_url?: string;
};

export async function semanticSearch(
  query: string,
  cityId: string,
  options?: { limit?: number; types?: string[] },
): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();

  // 1. Embedding da query (Server Action — Anthropic SDK não, OpenAI direto)
  const queryVector = await embed(trimmed);

  // 2. Top-K por cosine similarity
  let q = supabase.rpc('match_embeddings', {
    p_city_id: cityId,
    p_query_vector: queryVector,
    p_limit: options?.limit ?? 20,
  });
  if (options?.types) q = q.in('entity_type', options.types);

  const { data: hits } = await q;
  if (!hits) return [];

  // 3. Hidratar com metadata por tipo (joins paralelos)
  const enriched = await hydrateHits(hits, cityId);

  // 4. Log analítico (não bloquear UI)
  after(async () => {
    await supabase.from('search_queries').insert({
      city_id: cityId, query: trimmed,
      result_count: enriched.length,
    });
  });

  return enriched;
}
```

RPC SQL:
```sql
create or replace function public.match_embeddings(
  p_city_id uuid, p_query_vector vector(1536), p_limit int default 20
) returns table (
  entity_type varchar, entity_id uuid, score float
) language sql stable as $$
  select entity_type, entity_id, 1 - (vector <=> p_query_vector) as score
  from embeddings
  where city_id = p_city_id
  order by vector <=> p_query_vector
  limit p_limit;
$$;
```

### `apps/web/lib/search/fulltext.ts` (fallback)

Quando embeddings não existem ainda (registro novo): ILIKE em `name`, `short_description`, etc. Ordem inversa de prioridade no UI.

---

## 6. Páginas e componentes

```
apps/web/
├── app/
│   ├── buscar/
│   │   └── page.tsx                       ← /buscar?q=
│   └── api/
│       └── search/
│           └── suggest/route.ts           ← autocomplete (debounce 300ms)
└── components/
    └── search/
        ├── search-bar.tsx                 ← header global, com sugestões inline
        ├── search-results-list.tsx        ← cards heterogêneos por tipo
        ├── search-filters.tsx             ← filtros lado: tipo, distrito
        ├── search-empty-state.tsx         ← "Não encontramos nada. Tente..."
        └── search-result-card.tsx         ← variação por entity_type
```

### Header global

Substituir/adicionar `SearchBar` em `components/carmo/app-header.tsx`:
- Input com placeholder rotativo: "almoçar perto da praça", "encanador", "pousada com piscina"
- Sugestões em dropdown (≤6) ao digitar 2+ chars
- Enter ou click em sugestão → `/buscar?q=...`
- Atalho `/` foca a busca

---

## 7. UI da página `/buscar`

```
┌──────────────────────────────────────────────────┐
│ [🔍] almoçar perto da praça          [filtros▾]  │
├──────────────────────────────────────────────────┤
│ Filtros:                                         │
│  [✓] Comércio   [✓] Turismo   [ ] Classificados │
│  [✓] Eventos                                     │
├──────────────────────────────────────────────────┤
│ 🍽️  Restaurante do Lago                          │
│     Almoço executivo, vista pra Praça Mons. Rui │
│     ⭐ 4.5 · 200m da Praça                        │
├──────────────────────────────────────────────────┤
│ 🏨  Pousada Recanto                              │
│     Cozinha mineira, almoço aberto ao público   │
├──────────────────────────────────────────────────┤
│ 📅  Festival Gastronômico                        │
│     Sábado · Praça Mons. Rui                    │
└──────────────────────────────────────────────────┘
```

Cada card tem ícone do tipo, score visual (estrelas se score > 0.7), CTA de "Ver detalhes".

---

## 8. Track de cliques

Quando usuário clica num resultado, registrar `clicked_entity_*` em `search_queries` (mesma row, via UPDATE):

```ts
'use server';
export async function trackSearchClickAction(input: {
  queryId: string; entityType: string; entityId: string;
}) {
  // upd search_queries set clicked_*
}
```

Permite calcular CTR por tipo, e descobrir queries com 0 cliques (gap de conteúdo).

---

## 9. Painel admin: insights de busca

`/painel/cidade/busca/insights`:
- Top 50 queries do mês
- Queries com 0 resultados (gap de conteúdo — produto sabe o que falta)
- Queries com 0 cliques (relevância ruim — re-indexar?)
- Distribuição de tipos clicados (negócio vs evento vs ...)
- Latência média da busca

---

## 10. Variáveis de ambiente

```bash
# apps/worker/.env
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=

# apps/web/.env (a busca usa OpenAI também no Server Action)
OPENAI_API_KEY=
```

Restaurar no `.env.example` o `OPENAI_API_KEY` removido no audit (agora ele tem uso real).

---

## 11. Ordem de execução

1. **Dia 1-2:** Migration + RLS + RPC `match_embeddings` + triggers de fila
2. **Dia 3-4:** Worker `apps/worker/src/indexing/*` + smoke test (indexar 50 negócios)
3. **Dia 5:** `lib/search/{semantic,fulltext}.ts` + Server Actions
4. **Dia 6-7:** Página `/buscar` + componentes
5. **Dia 8:** SearchBar global no header com sugestões inline
6. **Dia 9:** Painel admin de insights
7. **Dia 10-12:** Tunning + smoke test E2E + medir relevância (top-3 acerto > 80% em 20 queries reais)

---

## 12. Definition of Done

- [ ] Migration aplicada, triggers ativos em todas as 8 tabelas indexáveis
- [ ] Worker roda em loop sem deadlock; processa 100 itens em < 1 min
- [ ] `embeddings` populado para todos os negócios ativos de Carmo (smoke)
- [ ] `/buscar?q=...` retorna resultados em < 800ms (P95)
- [ ] SearchBar global com sugestões funcionais
- [ ] Click em resultado registra `clicked_entity_*`
- [ ] Painel admin mostra top queries
- [ ] Fallback fulltext funciona quando embedding não existe
- [ ] Empty state amigável ("Tente buscar por...")
- [ ] Relevância: top-3 contém resultado correto em 16/20 queries de teste
- [ ] Documentação Davia: `.davia/assets/busca-semantica.html`

---

## 13. Riscos

| Risco | Mitigação |
|-------|-----------|
| Custo OpenAI escala mal | Cache de query vectors com hash (mesma query nas últimas 24h reusa) |
| Worker cai e fila explode | Cron monitor: alerta se `count(processed_at is null) > 1000` |
| Embeddings ficam stale após edição | Trigger já reenfileira em UPDATE |
| Latência da busca degrada UX | Loading skeleton + fallback fulltext em paralelo |
| Vendor lock OpenAI | Wrapper `embed()` permite trocar por Voyage AI ou local em 1 dia |
| Conteúdo em português performa pior | text-embedding-3-small é multilingual; smoke test em 20 queries reais antes de promover |
