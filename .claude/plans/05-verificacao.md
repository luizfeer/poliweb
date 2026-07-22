# Plano 05 — Verificação e fechamento dos Sprints 0–4

> **Objetivo:** auditar tudo que foi implementado até agora, encontrar lacunas e fechá-las antes de abrir o Sprint 5 (transparência + IA). É um plano de **caça-bugs e regressão**, não de feature nova.

## 1. Contexto

Foram entregues, em paralelo:
- Sprint 0 — scaffold + design system + business front (mock)
- Auth + painel base (`00-auth-painel.md`)
- Comércio admin (`01-comercio-admin.md`)
- Serviços/utilities admin (`02-servicos-admin.md`)
- Turismo admin (`03-turismo-admin.md`)
- Comunidade admin (`04-comunidade-admin.md`)

Volume é grande, sessões foram intercaladas. Antes de começar transparência+IA é seguro **fechar a base**.

## 2. Bugs e ruídos óbvios já identificados

Resolver ANTES da auditoria funcional:

- [ ] **Pasta duplicada `apps/web/app/mocs/`** (typo de `mocks/`) — checar conteúdo, mesclar com `mocks/` e deletar. Provável `git mv` perdido entre sessões.
- [ ] **Migrations com timestamps duplicados:** `20260430204311_comercio_admin_plan01.sql` e `20260430204330_comercio_admin_plan01.sql` têm o **mesmo nome** com timestamps diferentes. Verificar qual é a correta (a mais nova) e arquivar/deletar a outra antes de rodar `db push` em ambiente novo.
- [ ] **`apps/web/app/painel/admin/` vs `apps/web/app/painel/cidade/`** — ambos existem. `cidade/` é o esquema novo (multi-tenant). Conferir se `admin/` ainda tem rotas vivas; se não, deletar.
- [ ] Revisar `git status` — qualquer arquivo modificado não-commitado vira commit `chore(cleanup):`.

## 3. Auditoria de banco (Supabase)

Rodar em ordem:

```bash
pnpm db:push         # garante migrations aplicadas
pnpm db:migration:list   # confirma sincronia
pnpm db:types        # gera tipos atualizados
```

Validar com SQL via dashboard ou `supabase db remote query`:

- [ ] **RLS habilitada em TODAS as tabelas de domínio.** Query: `select tablename from pg_tables where schemaname='public' and rowsecurity=false;` — esperado: vazio.
- [ ] **Funções helper existem e retornam o esperado:**
  - `is_super_admin()` — true só pra super_admin
  - `is_city_admin(city_id)` — true pra super_admin, city_admin e moderator daquela cidade
  - `is_merchant(city_id)` — true pra super_admin e merchant daquela cidade
  - `manages_business(business_id)` — true pra owner direto, entity_managers ou city_admin da cidade do business
  - `grant_citizen_role(p_city_id)` — idempotente, cria role citizen se não existir
- [ ] **Trigger `handle_new_user()` cria profile** ao inserir em `auth.users`. Smoke: criar usuário via Supabase dashboard, verificar profile.
- [ ] **Cidades-base populadas:** Carmo do Rio Claro (status=active) + Capitólio (status=coming_soon). Districts de Carmo coerentes com `20260430221600_fix_crc_districts.sql`.
- [ ] **`city_modules`** com 9 módulos habilitados pra Carmo.
- [ ] **`business_categories`** populadas com hierarquia (12 macros + folhas) — esse seed está em `seed.sql` ou em uma das migrations comercio_admin_plan01.
- [ ] **`event_categories`** populadas (Sprint 4).
- [ ] **`ad_slots`** com pelo menos os slots do design (`home_top`, `category_*`, `sidebar`) já presentes.

## 4. Auditoria de auth (smoke manual)

Usar contas de teste do `supabase/seeds/auth.sql` (tabela em `.davia/assets/data/auth-test-accounts.json`).

- [ ] **`/cadastro`** cria usuário, profile aparece, sem role global.
- [ ] **`/entrar`** loga e redireciona pro `/painel`.
- [ ] **`/painel`** redireciona corretamente:
  - super_admin → `/painel/super`
  - city_admin/moderator → `/painel/cidade`
  - merchant → `/painel/comercio`
  - citizen sem outros papéis → `/painel/perfil`
- [ ] **Middleware** seta cookie `city_slug` e header `x-city-slug`. Inspecionar DevTools → Application → Cookies.
- [ ] **`grant_citizen_role`** idempotente: visitar /painel duas vezes não cria duas linhas em `profile_roles`.
- [ ] **Logout** (`/sair`) limpa cookies e volta pra home.
- [ ] **`/recuperar-senha`** envia email (Resend ou SMTP configurado) — caso não tenha SMTP configurado, marcar como bloqueio e criar issue.

## 5. Auditoria de cada módulo admin

Para cada um dos 4 paineis (`comercio`, `servicos`, `turismo`, `comunidade`), repetir a checklist:

### 5.1 Comércio (`/painel/cidade/comercio`)
- [ ] city_admin lista TODOS negócios da cidade
- [ ] city_admin aprova claim → `claimed=true` + log em `audit_log`
- [ ] city_admin promove cidadão a merchant
- [ ] merchant (logado) só vê seus negócios em `/painel/comercio`
- [ ] merchant cria negócio em status `draft`, edita, publica → `published`
- [ ] merchant adiciona promotion → aparece pública na ficha
- [ ] página pública `/comercio/negocio/[slug]` puxa do Supabase (não mock) — checar com `NEXT_PUBLIC_USE_MOCK_BUSINESSES=false`
- [ ] busca normaliza acentos
- [ ] cidadão posta review → fica em `pending` até admin aprovar
- [ ] import script Cliqueiachei roda em dry-run sem erro

### 5.2 Serviços públicos (`/painel/cidade/servicos`)
- [ ] CRUD coleta de lixo por bairro (admin)
- [ ] CRUD telefones úteis com categorias
- [ ] CRUD farmácias e plantão
- [ ] CRUD UBSs e campanhas de vacinação
- [ ] CRUD service_alerts (água/energia/trânsito)
- [ ] páginas públicas `/servicos/*` mostram dados corretos por bairro/data

### 5.3 Turismo (`/painel/cidade/turismo`, `/painel/turismo`)
- [ ] city_admin gerencia accommodations, restaurants, attractions, fishing_spots, fishing_guides, tour_packages
- [ ] dono de pousada (merchant + entity_managers) edita só sua pousada
- [ ] página pública `/turismo/pousadas/[slug]` carrega do Supabase
- [ ] mapa OSM funciona com lat/lng

### 5.4 Comunidade (`/painel/cidade/comunidade`, `/painel/comunidade`)
- [ ] eventos: admin cria evento, aparece em `/agenda`
- [ ] classifieds: cidadão posta, fica `pending`, admin aprova
- [ ] lost_pets: cidadão posta com foto (Supabase Storage path `{city_slug}/lost_pets/...`)
- [ ] obituários: admin posta
- [ ] moderação: ações destrutivas geram `audit_log`

## 6. Auditoria técnica geral

- [ ] `pnpm build` na raiz roda sem warnings de TS, sem erros
- [ ] `pnpm lint` zero
- [ ] Lighthouse mobile em `/`, `/comercio`, `/turismo/pousadas`, `/agenda` ≥ 85 perf e a11y
- [ ] LCP < 2.5s em conexão simulada Slow 3G
- [ ] Bundle do home page < 200KB JS first load (Next imprime no build)
- [ ] Server Components dominantes — `'use client'` apenas onde necessário (medir: contagem de arquivos com `use client`)
- [ ] Toda Server Action tem schema Zod no input
- [ ] Storage paths sempre `{city_slug}/...`
- [ ] `getCurrentCity()` usado em TODA query de domínio (grep `from('businesses')`, `from('events')` etc — confirmar filtro por city_id)

## 7. Auditoria de Davia

- [ ] Páginas existem: `overview`, `architecture`, `multi-city`, `ownership`, `data-model`, `auth-flow`, `ai-pipeline`, `businesses-front`, `roadmap`, `modules-index`, `design-system`
- [ ] Mermaids equivalentes em `mermaids/`
- [ ] `data/sprints.json` com status atualizado (Sprints 1-4 = ✅)
- [ ] `pnpm davia:open` carrega sem erro

## 8. Definition of Done deste plano

- [ ] Todos os bugs da seção 2 resolvidos
- [ ] Todos os checklists das seções 3, 4, 5 e 6 marcados (ou item criado em backlog se inviável agora)
- [ ] Davia atualizada
- [ ] Build limpo + push
- [ ] Smoke test manual gravado em screenshots ou notas em `.claude/plans/05-verificacao-resultados.md`

## 9. Saídas esperadas

Ao fim deste plano, o repositório fica:
- Sem migrations duplicadas
- Sem rotas mortas (`/painel/admin` antigo, `mocs/`)
- Com paineis dos 4 módulos validados manualmente
- Pronto para receber **Sprint 5 — Transparência + IA** sem dúvida sobre o que está funcionando.

> Resultados/notas vão em `.claude/plans/05-verificacao-resultados.md` (criar ao terminar a auditoria).
