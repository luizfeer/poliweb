# Sprint 0 — Visão estratégica & contrato do projeto

> **Status:** vivo. Atualizar no fim de cada sprint com o que mudou.
> **Codinome:** `shimmying-singing-platypus` (gerado pelo Claude Code; não muda).
> **Cidade-foco MVP:** Carmo do Rio Claro/MG.

---

## 1. Contexto

- Portal hiperlocal **multi-cidade** (`city_id` em tudo, módulos liga/desliga por cidade).
- 5 papéis por cidade: `super_admin`, `city_admin`, `moderator`, `merchant`, `citizen`.
- "Cliente como admin da própria página" (comerciante edita ficha, imobiliária edita imóveis, pousada edita quartos) — combinação de `owner_profile_id` + `entity_managers`.
- Stack: Next 16 (App Router + RSC + Server Actions + Turbopack), React 19, Tailwind v4 + shadcn (preset Nova), Supabase (`@supabase/ssr` 0.10), Anthropic (Haiku default / Sonnet heavy), Zod, Resend, Maplibre+OSM, Davia.
- 9 módulos: `utilities`, `events`, `tourism`, `real_estate`, `businesses`, `classifieds`, `community`, `transparency`, `ads`.

## 2. Tabelas e RLS — estado do banco

Migrations já aplicadas em `supabase/migrations/`:

- [x] `20260429120000_core.sql` — cities, districts, modules, city_modules, profiles, profile_roles, entity_managers, audit_log + funções `is_super_admin()`, `is_city_admin(city_id)`, `is_merchant(city_id)`, `manages_entity(type,id)`.
- [x] `20260429120100_real_estate.sql` — realtors, realtor_agents, properties, property_inquiries, property_favorites + `manages_realtor(id)`.
- [x] `20260429120200_businesses.sql` — business_categories, businesses, business_category_assignments, business_promotions, business_reviews, business_claims + `manages_business(id)`.
- [x] `20260429120300_tourism.sql` — accommodations, restaurants, attractions, fishing_spots, fishing_guides, tour_packages.
- [x] `20260429120400_community.sql` — events, classifieds, lost_pets, lost_and_found, obituaries.
- [x] `20260429120500_utilities.sql` — garbage_schedules, emergency_contacts, pharmacies, pharmacy_shifts, health_facilities, health_campaigns, service_alerts.
- [x] `20260429120600_transparency_ads_ai.sql` — official_diaries, diary_acts, council_meetings, council_topics, public_tenders, public_works, ad_slots, advertisements, ai_jobs, embeddings.

**Pendências de banco:**
- [x] Storage buckets: `cities/`, `businesses/`, `accommodations`, `properties`, `events`, `transparency`. Policy por `city_slug` no path.
- [x] Seeds: cidade Carmo do Rio Claro (`active`) + Capitólio (`coming_soon`); distritos básicos de Carmo; categorias globais `business_categories` (city_id null); `city_modules` para Carmo (todos enabled exceto `transparency` e `ads`).
- [ ] Worker de transparência em `apps/worker`: scrapers oficiais, IA, embeddings e moderação de backlog rodando em VPS. Edge Functions ficam só para callbacks/triggers leves quando necessário.

## 3. Server-side — fundações compartilhadas

- `apps/web/lib/supabase/{client,server,middleware}.ts` ✅ já existem. **Nunca importar `@supabase/supabase-js` direto.**
- `apps/web/lib/cities/getCurrentCity.ts` — lê do middleware/cookie. **Toda query de domínio passa `city_id` via esse helper.**
- `apps/web/lib/ai/anthropic.ts` — singleton, log em `ai_jobs`.
- `apps/web/lib/auth/roles.ts` — helpers tipados pra RLS espelharem as funções do banco.
- Convenção: toda Server Action em `actions.ts` colocada na rota; input validado por Zod; mutações registram em `audit_log`.

## 4. UI público — escopo do MVP

| Rota | Status | Plano | Observação |
|---|---|---|---|
| `/` | parcial | `01-comercio-admin.md` (público é shimmying) | Hero + módulos liga/desliga |
| `/comercio`, `/comercio/[categoria]`, `/comercio/buscar`, `/comercio/negocio/[slug]` | parcial (mock) | `01-comercio-admin.md` | Já tem scaffolding em `apps/web/app/comercio/` |
| `/servicos` (utilities) | falta | `02-servicos-admin.md` | Coleta, telefones, farmácia, saúde |
| `/turismo`, `/turismo/[tipo]`, `/turismo/[slug]` | falta | `03-turismo-admin.md` | Pousadas, atrações, pesca |
| `/mapa` | implementado | mapa-guia multi-módulo | MapLibre + OSM, filtros por URL, turismo/comércio/eventos |
| `/agenda`, `/classificados`, `/comunidade` | falta | `04-comunidade-admin.md` | Eventos + UGC |
| `/transparencia` | pós-MVP | — | Depende de scrapers prontos |

## 5. UI painel — escopo do MVP

- `/entrar`, `/cadastro`, `/recuperar-senha` — sprint `00-auth-painel.md`.
- `/painel` — dashboard contextual ao papel mais alto da cidade ativa.
- `/painel/comercio` — merchant edita ficha; admin lista todos.
- `/painel/turismo` — merchant edita pousada/restaurante.
- `/painel/cidade` — city_admin: módulos, distritos, equipe, audit.
- `/painel/super` — super_admin: cidades, módulos globais, papéis transversais.

## 6. Definition of Done — Sprint 0 (este documento)

<ul data-type="taskList">
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Migrations 0001–0007 aplicadas no Supabase</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Davia documentando overview/architecture/multi-city/ownership/data-model</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Storage buckets criados com policies por <code>city_slug</code></p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Seeds rodados (Carmo + Capitólio + distritos + categorias globais + city_modules)</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Helper <code>getCurrentCity()</code> implementado e testado em RSC</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Tipos do Supabase gerados em <code>apps/web/lib/supabase/database.types.ts</code></p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Plano <code>00-auth-painel.md</code> revisado e pronto para começar</p></li>
</ul>

---

## Backlog priorizado (ordem dos sprints)

1. **Sprint 1 — Auth + painel base** (`00-auth-painel.md`)
2. **Sprint 2 — Comércio admin + import cliqueiachei** (`01-comercio-admin.md`)
3. **Sprint 2C — Catálogo, Delivery e E-commerce** (`05-comercio-catalogo-delivery-ecommerce.md`) — cardápio digital + carrinho + checkout WhatsApp + configuração de entrega
4. **Sprint 3 — Serviços públicos (utilities)** (`02-servicos-admin.md`)
5. **Sprint 4 — Turismo** (`03-turismo-admin.md`)
6. **Sprint 5 — Comunidade & UGC** (`04-comunidade-admin.md`)
7. Sprint 6: transparência (worker VPS de scrapers + IA), busca semântica e painel editorial.
8. Pós-MVP: pedidos nativos + PIX, e-commerce completo (variações/estoque), real_estate (corretor admin), ads, PWA.

**Sprint 11 (em andamento — referral + pontos + sorteios):**
- Migration `20260504120000_referral_pontos_sorteios.sql` aplicada (aguardando push)
- Libs: `lib/points`, `lib/referral`, `lib/raffles`
- Páginas: `/r/[code]`, `/sorteios`, `/sorteios/[slug]`,
  `/painel/cidadao/{indicar,pontos}`, `/painel/cidade/sorteios/*`
- Cron `/api/cron/draw-raffles` + email Resend ao vencedor
- Pendente: regenerar `database.types.ts` e remover `sprint-11-types.ts`

**Delivery e Pedidos (migrations aplicadas; tipos gerados):**
- Plano: `06-delivery-pedidos-nativos-bot-whatsapp.md`. Doc Davia: `delivery-orders.html`.
- Migrations `20260530180000/190000/200000/210000` (catálogo + pedidos + presença + operadores + RPCs + RLS + planos Free/Pro + assinatura Asaas) — **aplicadas no remoto**.
- `supabase gen types` rodado: tabelas/funções de delivery no `database.types.ts`; shim `lib/delivery/db-types.ts` **removido** (consumidores usam o client tipado direto).
- Pedido gravado direto no Supabase (`create_order`), fora do Vercel; trigger enfileira WhatsApp (botões na janela 24h, senão template `novo_pedido`).
- Bot `supabase/functions/delivery-bot` (online/offline, `/lista`, aceitar/avançar via comando ou botão) — **deployado**.
- Web: cardápio real, checkout nativo, `/cardapios`. Painel: abas Cardápio/Delivery/Fila (realtime). Mobile: `app/pedidos` (lista + detalhe ao vivo).
- **Auth das edge functions resolvido (2026-06-09):** migração pro novo sistema de keys trocou o `SUPABASE_SERVICE_ROLE_KEY` auto-injetado (legado JWT → `sb_secret_...`). Com `verify_jwt=true` o gateway barrava o `sb_secret` (não é JWT) e o JWT legado não casava com o check interno → 401 sempre. Corrigido pondo `verify_jwt=false` em `delivery-bot` e `wa-outbound-worker` (igual `wa-webhook`); elas já fazem auth própria via `sb_secret`.
- **Disparo agendado (2026-06-09):** `pg_net` habilitado, `sb_secret` guardado no Vault (`edge_secret_key`), e dois jobs `pg_cron` a cada minuto (`drain-delivery-bot`, `drain-wa-outbound`) chamando as funções via `net.http_post` com `Bearer` do Vault. Verificado: cron `succeeded`, funções retornam 200.
- Pendente (operacional, depende de credenciais externas do usuário): **credenciais Meta WhatsApp Cloud API** — secrets `META_WA_ACCESS_TOKEN`, `META_WA_APP_SECRET`, `WA_VERIFY_TOKEN` (nenhum setado) + linha em `wa_channels` (waba_id/phone_number_id) pra cidade; aprovação do template Meta `novo_pedido` (`wa_templates` vazia); cadastro de operador (`business_wa_operators`) e ativar delivery em algum negócio; push ao comerciante com app fechado; secrets do Asaas (PIX).

**Mapa-guia público (`/mapa`):**
- Rota pública multi-módulo com MapLibre + tiles OSM raster.
- Camadas: atrações, igrejas via `attractions.type ilike 'igreja%'`, hospedagem, restaurantes, pesca, comércios e eventos futuros.
- Estado compartilhável via `cats`, `q`, `z`, `c` e `id`.
- Sem migration nova; usa `lat/lng` existentes e respeita `city_modules`.

## Riscos vivos

- **RLS tramela demais** ao testar — mitigação: ter 3 usuários seed (admin/merchant/citizen) e suite manual de smoke por sprint.
- **`getCurrentCity` em rotas /api** — middleware roda em edge, garantir que cookie tá lido nos Server Actions.
- **IA cara** — manter Haiku default; só ato jurídico/editorial vai pra Sonnet; logar custo em `ai_jobs` desde o dia 1.
- **Cliqueiachei import** — fonte instável; cair pra CSV manual quando quebrar.
