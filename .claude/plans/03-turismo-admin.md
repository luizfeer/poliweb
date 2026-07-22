# Plano 03 — Admin de turismo (acomodações, atrações, restaurantes, pesca)

> **Pré-requisitos:** `00-auth-painel.md` concluído. `01-comercio-admin.md` recomendado (compartilha padrões de upload e media).
> **Vertical estrela do MVP:** **pesca esportiva** (Furnas/CRC). Resto vai junto pra ficha de cidade ficar completa.

## 1. Contexto

- Receita futura: afiliados Booking/Airbnb (campos `booking_url`, `airbnb_url` em `accommodations`) + pacotes (`tour_packages`).
- Donos editam suas próprias páginas (mesma lógica de comércio): `owner_profile_id` + `entity_managers(entity_type='accommodation'|'restaurant'|'fishing_guide')`.
- Atrações e fishing_spots são **catálogo público curado pelo admin** (não tem dono).
- IA reescreve `description` para SEO se admin pedir (`job_type='seo_meta'`, Sonnet em casos longos).

## 2. Tabelas e RLS

Tudo em `20260429120300_tourism.sql`:

- [x] `accommodations` (com `near_lake`, `has_marina`, `booking_url`, `airbnb_url`).
- [x] `restaurants` (com `cuisine`, `delivery`, `ifood_url`).
- [x] `attractions` (atrações curadas, sem owner).
- [x] `fishing_spots` + `fishing_guides` (vertical CRC).
- [x] `tour_packages` (provider_business_id opcional para amarrar pacote a um comércio).
- [x] RLS: leitura pública de `published`; CRUD do owner / `manages_entity` / `is_city_admin`.

**Pendências:**
- [ ] Migration nova: trigger de slug (`tg_tourism_slug_unique`) — gerar slug a partir do `name` se vazio, com sufixo numérico se colidir.
- [ ] Coluna `featured_until timestamptz` em `accommodations`/`restaurants` (destaque pago com expiração). Ajustar policy public_read pra "só featured se `featured_until > now()`".
- [ ] View `mv_fishing_search` agregando `fishing_spots` + `fishing_guides` por cidade com tsv para busca.
- [ ] Storage buckets: `tourism/{city_slug}/accommodations/{id}/...`, `tourism/{city_slug}/restaurants/{id}/...`, `tourism/{city_slug}/attractions/{slug}/...`.
- [ ] Seed Carmo: 5 atrações principais (cachoeiras, mirantes), 3 fishing_spots na represa, 1 acomodação demo, 1 fishing_guide demo.

## 3. Server-side

### Queries

- `apps/web/lib/tourism/queries.ts`:
  - `listAccommodations({ city_id, filters: { type?, near_lake?, has_marina?, district_id?, max_price? } })`.
  - `getAccommodationBySlug({ city_id, slug })`.
  - `listAttractions({ city_id, type? })`.
  - `listRestaurants({ city_id, cuisine?, price_range?, delivery? })`.
  - `listFishingSpots({ city_id })`, `listFishingGuides({ city_id, has_boat? })`.
  - `listTourPackages({ city_id, provider_business_id? })`.

### Server Actions

#### `app/painel/turismo/acomodacoes/actions.ts` (merchant + city_admin)

- **`upsertAccommodationAction`** — Zod (resumo):
  ```ts
  z.object({
    id: z.string().uuid().optional(),
    city_id: z.string().uuid(),
    district_id: z.string().uuid().nullable(),
    slug: z.string().regex(/^[a-z0-9-]*$/).max(80).optional(), // gerado se vazio
    name: z.string().min(2).max(120),
    type: z.enum(['pousada','hotel','chale','airbnb','camping','rancho','casa_temporada']),
    short_description: z.string().max(160).nullable(),
    description: z.string().max(8000).nullable(),
    address: z.string().nullable(), cep: z.string().nullable(),
    lat: z.number().nullable(), lng: z.number().nullable(),
    phone: z.string().nullable(), whatsapp: z.string().nullable(),
    email: z.string().email().nullable(),
    website: z.string().url().nullable(),
    booking_url: z.string().url().nullable(),
    airbnb_url: z.string().url().nullable(),
    instagram: z.string().nullable(),
    price_min: z.number().nonnegative().nullable(),
    price_max: z.number().nonnegative().nullable(),
    rooms_count: z.number().int().nonnegative().nullable(),
    max_guests: z.number().int().nonnegative().nullable(),
    amenities: z.array(z.string()).default([]),
    near_lake: z.boolean().default(false),
    has_marina: z.boolean().default(false),
    status: z.enum(['draft','pending','published','archived']).default('draft'),
  }).refine(d => !d.price_max || !d.price_min || d.price_max >= d.price_min, { message: 'price_max < price_min' })
  ```
  Tabela `accommodations`. RLS: `accom_create/update`. Side: `audit_log`, embedding async.

- **`uploadAccommodationMediaAction`** — `{ id, kind: 'cover'|'gallery', file: File }`.
- **`requestPublishAccommodationAction`** — pending → city_admin aprova.
- **`generateSeoCopyAction`** — `{ id, target: 'description'|'short_description' }`. Lê current copy + nome + amenities + tipo, chama Anthropic Sonnet, retorna sugestão (não escreve direto). Loga em `ai_jobs`. UI mostra diff antes de aplicar.

#### `app/painel/turismo/restaurantes/actions.ts`

- **`upsertRestaurantAction`** — `{ id?, city_id, district_id?, slug?, name, description?, cuisine: string[], price_range: '$'|'$$'|'$$$'|'$$$$', address?, phone?, whatsapp?, hours, delivery, ifood_url?, lat?, lng?, status }`.
- **`uploadRestaurantMediaAction`**.

#### `app/painel/turismo/pesca/actions.ts`

- **`upsertFishingGuideAction`** (merchant) — `{ id?, city_id, slug?, full_name, license_number?, about?, phone?, whatsapp?, email?, services: string[], price_range?, has_boat, photo_url? }`. Status volta a draft em qualquer edit.
- **`upsertFishingSpotAction`** (city_admin only — `spots_admin` policy) — `{ id?, city_id, slug?, name, description?, lat?, lng?, species: string[], regulations?, defeso_period?, requires_guide, access_difficulty?, status }`.

#### `app/painel/cidade/turismo/atracoes/actions.ts` (city_admin)

- **`upsertAttractionAction`** — `{ id?, city_id, slug?, name, type, description?, address?, lat?, lng?, hours?, entry_fee?, difficulty?, duration_minutes?, best_season?, status }`.
- **`reorderFeaturedAttractionsAction`** — `{ city_id, ordered_ids: uuid[] }` (afeta home/turismo).

#### `app/painel/cidade/turismo/pacotes/actions.ts`

- **`upsertTourPackageAction`** — `{ id?, city_id, provider_business_id?, slug?, title, description?, duration_hours?, price?, includes: string[], contact_phone?, contact_whatsapp?, status }`. RLS: `packages_provider_write` (dono do business OU city_admin).

### Edge Functions

- `supabase/functions/seo-rewrite/index.ts` — recebe `{ entity_type, entity_id, target_field }`, busca registro, monta prompt, chama Anthropic, devolve sugestão (não persiste).
- Reuso de `embed-business` adaptado para `accommodation`/`restaurant`/`attraction`.

## 4. UI público

Rota raiz: `/turismo`.

- `app/turismo/page.tsx` — landing visual: hero com foto da cidade, 4 categorias (Onde ficar, O que fazer, Onde comer, Pesca), 3 atrações em destaque, 3 acomodações featured.
- `app/turismo/onde-ficar/page.tsx` — listagem com filtros (tipo, near_lake, faixa de preço, max_guests, amenities). Paginação SSR.
- `app/turismo/onde-ficar/[slug]/page.tsx` — ficha completa: galeria, preços, mapa, amenities, CTAs (WhatsApp, Booking, Airbnb).
- `app/turismo/o-que-fazer/page.tsx` — atrações com filtro por tipo (cachoeira, mirante, trilha, balneário…).
- `app/turismo/o-que-fazer/[slug]/page.tsx` — ficha + dificuldade/duração/melhor época.
- `app/turismo/onde-comer/page.tsx` — restaurantes com filtros (cuisine, price_range, delivery).
- `app/turismo/pesca/page.tsx` — landing dedicada (vertical estrela): pontos famosos, guias, regulamentação resumida.
- `app/turismo/pesca/pontos/[slug]/page.tsx` — ficha do spot com espécies, regulamento, defeso.
- `app/turismo/pesca/guias/[slug]/page.tsx` — ficha do guia com licença, serviços, contato.
- `app/turismo/pacotes/page.tsx` — pacotes turísticos.

Componentes públicos:
- `components/public/tourism/AccommodationCard.tsx` (badge "Pé na água" se `near_lake`).
- `components/public/tourism/AmenitiesGrid.tsx`.
- `components/public/tourism/MapEmbed.tsx` (Maplibre + OSM, marker custom).
- `components/public/tourism/FishingSpotCard.tsx`, `FishingGuideCard.tsx`.

## 5. UI painel

### Merchant

- `/painel/turismo` — lista das fichas que o merchant gerencia (acomodações, restaurantes, fishing_guides).
- `/painel/turismo/acomodacoes/[id]` — tabs: Dados, Preços, Mídia, Comodidades, SEO (botão "Sugerir copy com IA").
- `/painel/turismo/restaurantes/[id]` — Dados, Cardápio (link iFood), Mídia, Horários.
- `/painel/turismo/pesca/[id]` — Dados do guia.

### City admin

- `/painel/cidade/turismo/atracoes` — tabela + form. Reorder featured (drag&drop).
- `/painel/cidade/turismo/pesca` — gerencia spots; lista de guides para verificar (`verified=true`).
- `/painel/cidade/turismo/pacotes` — lista global; pode editar qualquer pacote.
- `/painel/cidade/turismo/aprovacoes` — fila genérica `pending` (acom/rest/guide).

### Componentes admin

- `components/admin/tourism/AccommodationForm.tsx`.
- `components/admin/tourism/AmenitiesPicker.tsx` (lista compartilhada com restaurantes).
- `components/admin/tourism/SeoSuggestionDialog.tsx` (mostra diff IA vs atual).
- `components/admin/tourism/FishingSpotForm.tsx` (com seletor de espécies).
- `components/admin/tourism/AttractionForm.tsx`.

## 6. Definition of Done

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Migration nova: trigger de slug + <code>featured_until</code> + <code>mv_fishing_search</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Storage buckets <code>tourism/</code> com policies por <code>city_slug</code> + <code>manages_entity</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Seed Carmo: ≥5 atrações, ≥3 fishing_spots, 1 acomodação e 1 fishing_guide demo</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions <code>upsertAccommodation/Restaurant/FishingGuide/FishingSpot/Attraction/TourPackage</code> com Zod</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Edge function <code>seo-rewrite</code> deployada; fluxo "sugerir com IA" funciona com diff</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Página pública <code>/turismo</code> com 4 categorias e destaques</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Listagem <code>/turismo/onde-ficar</code> com filtros (tipo, near_lake, preço, guests, amenities)</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Ficha de acomodação com CTAs Booking/Airbnb/WhatsApp e mapa Maplibre</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Landing <code>/turismo/pesca</code> com pontos + guias + regulamentação</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel merchant testado: pousada cria/edita ficha e pede publicação</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel city_admin: aprova fichas pendentes, gerencia atrações e fishing_spots</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Davia <code>real-estate.html</code> mantida e <code>tourism.html</code> nova com diagrama de fluxo</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p><code>pnpm build</code> + <code>pnpm lint</code> verdes; Lighthouse mobile &gt; 85 em <code>/turismo</code></p></li>
</ul>
