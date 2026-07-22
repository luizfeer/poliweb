# Plano 04 — Comunidade & UGC (eventos, classificados, pets, achados, obituários)

> **Pré-requisitos:** `00-auth-painel.md` concluído. Anthropic + `ai_jobs` operacionais (vide `01-comercio-admin.md`).
> **Tema:** **viralização local** — UGC controlado por IA + admin.

## 1. Contexto

- Cobre os módulos `events`, `classifieds`, `community`.
- Posts vêm de cidadãos logados (`citizen`) ou comerciantes (eventos podem amarrar a `organizer_business_id`).
- **Moderação obrigatória:** todo UGC entra como `pending`, IA classifica, admin tem fila pra revisar/sobrescrever.
- Obituários são exceção: **só admin/funerária autorizada posta** (sensibilidade LGPD + cuidado emocional).
- Classificados de imóveis NÃO ficam aqui — vão pra `properties` (módulo `real_estate`, pós-MVP).
- LGPD: opt-out direto pelo painel do cidadão; classificados expiram em 60 dias automaticamente; pets têm reverse-flow ("encontrado" → "reunited").

## 2. Tabelas e RLS

Tudo em `20260429120400_community.sql`:

- [x] `event_categories` + `events`.
- [x] `classifieds` (com `expires_at default now() + 60 days`).
- [x] `lost_pets` (status: lost|found|reunited; moderation_status separada).
- [x] `lost_and_found` (objetos perdidos/achados).
- [x] `obituaries` (só admin posta).
- [x] RLS: leitura pública só `published`/`moderation_status='published'`; self insert/update; admin override.

**Pendências:**
- [ ] Migration nova:
  - Job pg_cron diário `expire_classifieds`: `update classifieds set status='archived' where expires_at < now() and status = 'published'`.
  - Job pg_cron `auto_resolve_old_pets`: pets `lost` há > 90 dias → status `archived` (mantém histórico).
  - Coluna `flagged_count int default 0` em `classifieds`, `lost_pets`, `lost_and_found` para denúncias.
- [ ] Tabela `content_reports (id, reporter_profile_id, entity_type, entity_id, reason, notes, status, reviewed_by, created_at)` para denúncias de UGC. RLS: self insert; admin lê/atualiza.
- [ ] Storage bucket `community/{city_slug}/{entity_type}/{id}/...`.
- [ ] Seed Carmo: 5 categorias de evento (cultural, religioso, esportivo, gastronômico, infantil).

## 3. Server-side

### Queries

- `apps/web/lib/community/queries.ts`:
  - `listEvents({ city_id, when?: 'today'|'week'|'month'|'all', category_id?, q? })` — só `published`, ordena por `start_at`.
  - `getEventBySlug({ city_id, slug })`.
  - `listClassifieds({ city_id, type?, q?, page })` — só `published` + `expires_at > now()`.
  - `listLostPets({ city_id, status?: 'lost'|'found' })` — só `moderation_status='published'`.
  - `listLostAndFound({ city_id, type?: 'lost'|'found' })`.
  - `listObituaries({ city_id, days?: 30 })`.

### Server Actions

#### `app/comunidade/agenda/submeter/actions.ts` (qualquer logado)

- **`submitEventAction`** — Zod:
  ```ts
  z.object({
    id: z.string().uuid().optional(),
    city_id: z.string().uuid(),
    slug: z.string().regex(/^[a-z0-9-]*$/).optional(),
    title: z.string().min(3).max(140),
    description: z.string().max(5000).nullable(),
    start_at: z.coerce.date(),
    end_at: z.coerce.date().nullable(),
    location: z.string().max(200).nullable(),
    address: z.string().nullable(),
    lat: z.number().nullable(), lng: z.number().nullable(),
    category_id: z.string().uuid().nullable(),
    organizer_name: z.string().nullable(),
    organizer_business_id: z.string().uuid().nullable(),
    is_free: z.boolean().default(true),
    ticket_url: z.string().url().nullable(),
    cover_url: z.string().nullable(),
    capacity: z.number().int().nonnegative().nullable(),
  }).refine(d => !d.end_at || d.end_at > d.start_at, 'end_at deve ser posterior a start_at')
  ```
  Tabela `events`. RLS `events_create` (qualquer logado). Status entra como `pending`. Side: dispara `ai_jobs.moderate_ugc`. Se `organizer_business_id` vier preenchido, valida via `manages_business`.

#### `app/comunidade/classificados/postar/actions.ts`

- **`submitClassifiedAction`** — `{ city_id, type: 'vehicle'|'job'|'service'|'item'|'other', title, description?, price?, is_negotiable, category_label?, attributes: jsonb, contact_name?, contact_phone, contact_whatsapp?, cover_url?, photos: string[] }`. Tabela `classifieds`. RLS `classifieds_self_create`. Status `pending` → IA modera.
- **`renewClassifiedAction`** — `{ id }`. Estende `expires_at` por 30 dias. Self only.
- **`archiveClassifiedAction`** — self ou admin.

#### `app/comunidade/pets/postar/actions.ts`

- **`submitLostPetAction`** — `{ city_id, status: 'lost'|'found', pet_name?, species, breed?, color?, size?, age_months?, has_collar, microchip, description, last_seen_at, last_seen_location?, district_id?, lat?, lng?, contact_name, contact_phone, contact_whatsapp?, cover_url?, photos }`. RLS `pets_self_create`. IA modera.
- **`updatePetStatusAction`** — `{ id, status: 'reunited' }`. Self.

#### `app/comunidade/achados/postar/actions.ts`

- **`submitLostAndFoundAction`** — `{ city_id, type: 'lost'|'found', item_description, category?, location?, district_id?, occurred_at?, contact_phone, contact_whatsapp?, cover_url? }`. IA modera.
- **`resolveLostAndFoundAction`** — `{ id }` → `status='resolved'`.

#### `app/comunidade/[any]/[id]/actions.ts`

- **`reportContentAction`** — `{ entity_type: 'event'|'classified'|'lost_pet'|'lost_and_found', entity_id, reason: 'spam'|'inadequate'|'fake'|'other', notes? }`. Cria `content_reports`. Incrementa `flagged_count`. Se ≥3 flags, oculta automaticamente (`status='pending'` de volta) e empilha na fila admin.

#### `app/painel/cidade/comunidade/actions.ts` (city_admin/moderator)

- **`approveModerationAction`** — `{ entity_type, entity_id }`. Vai pra `published`. Audit.
- **`rejectModerationAction`** — `{ entity_type, entity_id, reason }`. Vai pra `rejected`. Audit + email pro autor.
- **`deleteContentAction`** — `{ entity_type, entity_id }`. Hard delete + audit (com diff completo do conteúdo arquivado).
- **`upsertEventCategoryAction`** — `{ id?, city_id?, slug, name, icon?, display_order }`. Global se super_admin.

#### `app/painel/cidade/obituarios/actions.ts` (city_admin)

- **`upsertObituaryAction`** — `{ id?, city_id, full_name, age?, photo_url?, death_date, wake_location?, wake_at?, burial_at?, burial_location?, mass_at?, mass_location?, family_message?, funeral_home?, status }`. Validação de respeito: `family_message` opt-in da família registrada em `audit_log` com referência manual.
- **`publishObituaryAction`** — `{ id }` → `published`.

### Edge Functions

- `supabase/functions/moderate-ugc/index.ts` — generaliza além de reviews:
  - Recebe `{ entity_type, entity_id }`.
  - Lê `title + description + photos[]` (photos podem ir pra Vision se precisar).
  - Anthropic Haiku classifica em `safe | borderline | unsafe`.
  - `safe` → `published`. `borderline` → mantém `pending` (admin decide). `unsafe` → `rejected` com motivo.
  - Loga sempre em `ai_jobs`.

- `supabase/functions/expire-classifieds-cron/index.ts` — alternativa se pg_cron não estiver disponível no projeto Supabase. Schedule diário via Supabase Cron.

## 4. UI público

Rota raiz: `/comunidade` (hub) + sub-rotas dedicadas.

- `app/agenda/page.tsx` — calendário/lista de eventos. Filtros: hoje/semana/mês, categoria, gratuito.
- `app/agenda/[slug]/page.tsx` — ficha de evento, botão "Adicionar ao Google Calendar" (export ICS), share WhatsApp.
- `app/agenda/submeter/page.tsx` — form (logado).

- `app/classificados/page.tsx` — lista por tipo (Veículos, Vagas, Serviços, Itens, Outros). Cards com preço.
- `app/classificados/[id]/page.tsx` — detalhe + galeria + contato (revelar phone após aceitar termo anti-spam).
- `app/classificados/postar/page.tsx` — wizard 3 passos (tipo → dados → fotos).

- `app/comunidade/pets/page.tsx` — abas Perdidos / Encontrados / Reunidos. Busca por bairro/espécie.
- `app/comunidade/pets/[id]/page.tsx` — ficha + botão "Eu vi este pet" → cria `content_reports` com `reason='match'`.
- `app/comunidade/pets/postar/page.tsx`.

- `app/comunidade/achados/page.tsx` — lista; mesmo padrão.

- `app/comunidade/obituarios/page.tsx` — feed cronológico (últimos 30 dias por padrão).
- `app/comunidade/obituarios/[id]/page.tsx` — página respeitosa: foto, nome, datas, missa, mensagem da família. Sem comentários (decisão editorial).

Componentes públicos:
- `components/public/community/EventCard.tsx` (badge gratuito/pago).
- `components/public/community/EventCalendar.tsx`.
- `components/public/community/ClassifiedCard.tsx`.
- `components/public/community/PetCard.tsx`.
- `components/public/community/ObituaryCard.tsx`.
- `components/public/community/ReportButton.tsx` (uso compartilhado).

## 5. UI painel

### Citizen

- `/painel/comunidade/meus-anuncios` — lista do que postou (eventos, classificados, pets, achados). Status visível. Ações: editar (se `pending|draft`), arquivar, renovar.

### City admin / moderator

- `/painel/cidade/comunidade/moderacao` — fila unificada (UGC pendente). Filtros por entidade. Cada card mostra preview + decisão da IA + botões aprovar/rejeitar/excluir.
- `/painel/cidade/comunidade/agenda` — todos os eventos (CRUD admin) + categorias.
- `/painel/cidade/comunidade/denuncias` — lista de `content_reports` agrupada por entity. Resolve/dismiss.
- `/painel/cidade/obituarios` — só admin: form completo + lista (filtrável por mês).

### Componentes admin

- `components/admin/community/ModerationQueue.tsx` (com hot-keys: A=aprovar, R=rejeitar, E=excluir).
- `components/admin/community/EventForm.tsx`.
- `components/admin/community/ObituaryForm.tsx` (UX cuidadosa, validação extra de fonte).
- `components/admin/community/ReportList.tsx`.

## 6. Definition of Done

<ul data-type="taskList">
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Migration nova: pg_cron <code>expire_classifieds</code> + <code>auto_resolve_old_pets</code> + <code>flagged_count</code> + tabela <code>content_reports</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Storage bucket <code>community/</code> com policies por <code>city_slug</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Seed: 5 categorias de evento para Carmo</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Edge function <code>moderate-ugc</code> generalizada (events/classifieds/pets/lost_and_found) e deployada</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions <code>submitEvent/Classified/LostPet/LostAndFound</code> implementadas com Zod e disparo de IA</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Actions admin <code>approve/reject/delete/upsertCategory/upsertObituary</code> implementadas</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Server Action <code>reportContent</code> com auto-ocultação após 3 flags</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Páginas públicas: <code>/agenda</code>, <code>/classificados</code>, <code>/comunidade/pets</code>, <code>/comunidade/achados</code>, <code>/comunidade/obituarios</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Wizards de postar (eventos, classificados, pets, achados) testados com usuário <code>citizen</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel <code>moderacao</code> com hot-keys + decisão IA visível</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Painel <code>obituarios</code> só visível para city_admin (RLS verificada)</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Job pg_cron <code>expire_classifieds</code> testado: classificado com <code>expires_at</code> passado vai pra <code>archived</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p>Davia: nova página <code>community.html</code> com diagrama de fluxo de moderação UGC</p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p><code>pnpm build</code> + <code>pnpm lint</code> verdes; Lighthouse mobile &gt; 85 em <code>/agenda</code> e <code>/classificados</code></p></li>
</ul>
