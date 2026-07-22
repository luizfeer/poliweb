# Plano 01 — Admin de comércio (merchant + city_admin) + import Cliqueiachei

> **Pré-requisitos:** `00-auth-painel.md` concluído (login, papéis, layout `/painel`).
> **Já existe:** público em `apps/web/app/comercio/` com mock; libs em `apps/web/lib/businesses/` (`categories.ts`, `queries.ts`, `mock.ts`, `types.ts`, `icon-map.ts`). Trocar mock por Supabase é parte do plano.

## 1. Contexto

- Guia comercial é a **camada de receita recorrente** (planos `free | featured | premium`).
- Comerciante (`merchant`) edita SUA ficha; city_admin edita qualquer uma.
- Ficha pode existir antes do dono entrar — daí o **claim flow** (`business_claims`).
- Bootstrap inicial via **import Cliqueiachei** (~ centenas de comércios já cadastrados naquele site).
- Reviews são moderados: cidadão posta, IA pré-modera (`ai_jobs.moderate_ugc`), admin/dono respondem.

## 2. Tabelas e RLS

Tudo já existe. Pendências leves:

- [x] `business_categories` (hierárquica, até 3 níveis, global ou por cidade).
- [x] `businesses` + `business_category_assignments` (M:N com 1 primary).
- [x] `business_promotions`, `business_reviews`, `business_claims`.
- [x] Função `manages_business(p_business_id)` cobrindo owner direto + entity_managers + city_admin.
- [x] Policies de leitura pública (`status='published'`) e CRUD restrita a `manages_business`/`is_merchant`.

**Pendências:**
- [ ] Trigger `tg_set_published_at` em `businesses` — quando `status` vai para `published`, setar `published_at = now()`.
- [ ] View materializada `mv_business_search` (id, name, short_description, primary_category, district_name, city_slug, search_tsv) com refresh assíncrono via Edge Function. Indexar `search_tsv` com GIN.
- [ ] Coluna `import_source jsonb` em `businesses` para rastrear origem (`{ source: 'cliqueiachei', source_id, imported_at, raw_url }`). **Migration nova.**
- [ ] Storage policy: bucket `businesses/{city_slug}/{business_id}/...` permitindo write para quem `manages_business(id)`.
- [ ] Seed: ~20 categorias globais (alimentação, beleza, saúde, automotivo, vestuário, casa & construção, serviços, lazer…).

## 3. Server-side

### Substituir mock por Supabase

- `apps/web/lib/businesses/queries.ts` — refatorar funções para usar `createServerClient()` + filtro obrigatório por `getCurrentCity().id`. Nada de cache estático sem `city_id`.
- `apps/web/lib/businesses/mock.ts` — manter como fallback de dev se `NEXT_PUBLIC_USE_MOCK_BUSINESSES=true`; **default off**.
- Funções esperadas: `listBusinesses({ city_id, category_id?, district_id?, q?, page })`, `getBusinessBySlug({ city_id, slug })`, `listFeatured({ city_id, limit })`, `listCategories({ city_id })`.

### Server Actions

#### `app/painel/comercio/actions.ts` (merchant + city_admin)

- **`upsertBusinessAction`** — input Zod:
  ```ts
  z.object({
    id: z.string().uuid().optional(),
    city_id: z.string().uuid(),
    district_id: z.string().uuid().nullable(),
    slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    name: z.string().min(2).max(120),
    short_description: z.string().max(160).nullable(),
    description: z.string().max(5000).nullable(),
    cnpj: z.string().nullable(),
    phone: z.string().nullable(),
    whatsapp: z.string().nullable(),
    email: z.string().email().nullable(),
    website: z.string().url().nullable(),
    address: z.string().nullable(),
    cep: z.string().nullable(),
    lat: z.number().nullable(), lng: z.number().nullable(),
    hours: z.record(z.array(z.object({ open: z.string(), close: z.string() }))).default({}),
    amenities: z.array(z.string()).default([]),
    payment_methods: z.array(z.string()).default([]),
    status: z.enum(['draft','pending','published','archived']).default('draft'),
    category_ids: z.array(z.string().uuid()).min(1),
    primary_category_id: z.string().uuid(),
  })
  ```
  Tabelas: `businesses` (upsert), `business_category_assignments` (delete+insert dentro de transação RPC). Quem chama: dono via RLS (`biz_create`/`biz_update` + `bca_write`). Side effects: `audit_log('business.upsert')`, gera embeddings em background (job `generate_embedding`).

- **`uploadBusinessMediaAction`** — `{ business_id, kind: 'logo'|'cover'|'gallery', file: File }`. Upload pro bucket; atualiza `logo_url`/`cover_url`/`photos`.

- **`upsertPromotionAction`** — `{ business_id, id?, title, description, coupon_code?, discount_percent?, valid_from, valid_until?, active }`. Tabela `business_promotions`. RLS: `manages_business`.

- **`replyReviewAction`** — `{ review_id, reply_owner: z.string().min(2).max(1000) }`. Atualiza `reply_owner` + `reply_at`. RLS: `reviews_admin_moderate` (cobre dono via `manages_business`).

- **`requestPublishAction`** — `{ business_id }`. Seta `status='pending'`. Notifica city_admin via email (Resend) e cria entrada em `audit_log`. Disparado pelo merchant quando termina edição.

#### `app/painel/cidade/comercio/actions.ts` (city_admin)

- **`approveBusinessAction`** — `{ business_id }`. Vai de `pending` → `published`. Trigger seta `published_at`.
- **`rejectBusinessAction`** — `{ business_id, reason }`. Volta pra `draft` com motivo em `audit_log`.
- **`reviewClaimAction`** — `{ claim_id, action: 'approve'|'reject', reason? }`. Approve: cria `entity_managers (profile_id, 'business', business_id, 'owner')` + atualiza `businesses.owner_profile_id` + `claimed=true`. Reject: grava motivo. Sempre `audit_log`.
- **`upsertCategoryAction`** — global se `city_id=null` (só super_admin) ou local; `{ id?, parent_id?, slug, name, icon?, display_order, active }`.
- **`importCliqueiacheiAction`** — input: `{ city_id, dry_run: boolean }`. Roda scraper de `apps/web/lib/scrapers/cliqueiachei.ts`. Cada item vira `business` com `status='draft'`, `claimed=false`, `import_source={...}`. Categoria mapeada por dicionário em `apps/web/lib/scrapers/cliqueiachei.categories.ts`. Idempotente (UNIQUE em `import_source->>'source_id'` via index parcial). Side effect: `audit_log('businesses.import.cliqueiachei', { count })`.

#### `app/comercio/[slug]/actions.ts` (público logado)

- **`createReviewAction`** — `{ business_id, rating: z.number().int().min(1).max(5), title?, comment? }`. RLS `reviews_self_create`. **Side effect:** dispara `ai_jobs` com `job_type='moderate_ugc'`; só publica se IA aprovar (status `pending → published`). Conteúdo aprovado por IA recebe badge "Resumido por IA — sujeito a verificação" se houve reescrita.
- **`submitClaimAction`** — `{ business_id, evidence_text, evidence_url? }`. RLS `claims_self_create`.

### Edge Functions

- `supabase/functions/moderate-ugc/index.ts` — recebe `review_id`, chama Anthropic Haiku, classifica `safe|spam|toxic`, atualiza `business_reviews.status`. Loga em `ai_jobs`.
- `supabase/functions/embed-business/index.ts` — gera embedding (`businesses.id` → `embeddings(entity_type='business')`).

## 4. UI público

- `app/comercio/page.tsx` — listagem com hero + categorias top + featured. ✅ scaffolding existe.
- `app/comercio/[categoria]/page.tsx` — filtro por categoria + sub-categorias + facetas (bairro, abertos agora, com cupom). ✅ scaffolding.
- `app/comercio/buscar/page.tsx` — full-text via `mv_business_search` + `lib/businesses/queries.searchBusinesses`.
- `app/comercio/negocio/[slug]/page.tsx` — ficha completa, mapa Maplibre, horários, reviews (paginados), promoções ativas, CTA WhatsApp/telefone. CTA "Sou o dono" → modal de claim.
- `components/public/businesses/BusinessCard.tsx`, `CategoryGrid.tsx`, `ReviewList.tsx`, `PromotionBadge.tsx`, `ClaimDialog.tsx`.

## 5. UI painel

### Merchant

- `/painel/comercio` — lista das fichas que o merchant gerencia (via `entity_managers` + `owner_profile_id`).
- `/painel/comercio/[id]` — tabs: **Dados, Mídia, Horários, Promoções, Reviews, Estatísticas (views_count)**. Botão "Solicitar publicação" se em `draft`.
- `/painel/comercio/[id]/promocoes` — lista + form `<PromotionDialog>`.
- `/painel/comercio/[id]/reviews` — moderação leve (responder, denunciar).

### City admin

- `/painel/cidade/comercio` — tabela com filtros (status, categoria, importado, claimed). Ações em massa: aprovar, rejeitar, arquivar. Coluna "Origem" mostra `import_source.source` se houver.
- `/painel/cidade/comercio/categorias` — árvore de categorias (drag & drop pra reordenar `display_order`).
- `/painel/cidade/comercio/claims` — fila de `business_claims` pendentes; botão approve/reject.
- `/painel/cidade/comercio/import` — form de import Cliqueiachei (`dry_run` toggle), histórico das execuções (lê `audit_log` filtrado).

### Componentes admin

- `components/admin/businesses/BusinessForm.tsx` (RHF + Zod compartilhada com Server Action).
- `components/admin/businesses/HoursEditor.tsx` (UI dia-a-dia).
- `components/admin/businesses/CategoryPicker.tsx` (multi com pill de "principal").
- `components/admin/businesses/MediaUploader.tsx` (logo, capa, galeria).
- `components/admin/businesses/ImportCliqueiacheiForm.tsx`.

## 6. Definition of Done

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Migration nova com <code>import_source jsonb</code>, trigger <code>set_published_at</code>, view <code>mv_business_search</code> + index GIN</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Storage bucket <code>businesses/</code> com policies por <code>city_slug</code> + <code>manages_business</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Seed de ~20 categorias globais aplicado</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Mock substituído: <code>lib/businesses/queries.ts</code> agora bate no Supabase com <code>city_id</code> obrigatório</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions <code>upsert/upload/promotion/reply/requestPublish</code> implementadas e validadas com Zod</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions admin <code>approve/reject/reviewClaim/upsertCategory/importCliqueiachei</code> implementadas</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Edge function <code>moderate-ugc</code> deployada; review novo passa por IA antes de publicar</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Página pública <code>/comercio/negocio/[slug]</code> com mapa, horários, reviews, promoções, CTA claim</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel merchant: lista, edit (tabs), promoções, reviews — testado com usuário <code>merchant</code> de Carmo</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel city_admin: aprovação, claims, categorias (árvore drag&drop), import — testado</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Import Cliqueiachei rodado em modo <code>dry_run</code> e em real para Carmo (≥ 50 fichas em <code>draft</code>)</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Lighthouse mobile &gt; 85 em <code>/comercio</code>; <code>pnpm build</code> + <code>pnpm lint</code> verdes</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Davia <code>businesses.html</code> + <code>businesses-front.html</code> atualizadas; diagrama de claim flow novo</p></li>
</ul>
