# Prompt de onboarding — começo de qualquer nova sessão

> Cole esse texto inteiro como **primeira mensagem** ao iniciar uma sessão nova do Claude Code.
> Vai economizar 30+ minutos de exploração e evitar que a IA "redescubra" tudo.

---

## 1. Contexto do projeto

Sou o Luiz, dono do **Carmo Local** — portal hiperlocal multi-cidade em Next.js 16 + Supabase. Cidade-foco do MVP: **Carmo do Rio Claro/MG**. Repositório `hail-mary`. Codinome do plano vivo: `shimmying-singing-platypus`.

**Antes de qualquer coisa:**
1. Lê integralmente `CLAUDE.md` (raiz do repo) — convenções obrigatórias
2. Lê `.claude/plans/shimmying-singing-platypus.md` — plano vivo, status atual de cada sprint
3. Lê `.claude/plans/README.md` — ordem dos sprints e notas operacionais por sprint
4. Lê o `.md` específico do que vamos trabalhar (ex: `11-referral-pontos-sorteios.md`)

## 2. Stack — não inventar

- **Next.js 16** App Router + RSC + Server Actions + Turbopack (não confundir com 14/15 — APIs mudaram)
  - Em vez de `middleware.ts`, este projeto usa **`apps/web/proxy.ts`** (convenção nova do Next 16)
  - Use `after()` de `next/server` para tracking não-bloqueante
- **React 19** (com compiler ativado em `next.config.ts`)
- **Tailwind v4** + shadcn/ui (preset Nova). Componentes em `apps/web/components/ui/` — não editar manualmente
- **Supabase** via `@supabase/ssr` 0.10 — **NUNCA** importar `@supabase/supabase-js` direto
  - Cliente em RSC/Server Action: `await createClient()` de `@/lib/supabase/server`
  - Cliente service role (cross-usuário, cron): `createServiceRoleClient()` de `@/lib/supabase/service`
  - Browser: `createClient()` de `@/lib/supabase/client`
- **Zod 4** em todo input de Server Action
- **Anthropic SDK** singleton em `lib/ai/anthropic.ts`. Modelos: `haiku` default, `sonnet` heavy
- **Resend** para email
- **Bunny CDN** para mídia (não Supabase Storage)

## 3. Regras de ouro multi-cidade

- **Toda query de domínio filtra por `city_id`.** Sem exceção.
- Cidade atual vem de `getCurrentCity()` (`@/lib/cities`)
- Antes de mostrar feature, cheque `city.modules` para módulo habilitado
- Slugs públicos são UNIQUE por cidade
- Storage Bunny começa com `{city_slug}/...`

## 4. Auth e papéis

- 5 papéis por cidade: `super_admin`, `city_admin`, `moderator`, `merchant`, `citizen`
- `super_admin.city_id = null`. Demais sempre têm `city_id`
- **`super_admin` tem bypass implícito** em `hasRole()` para qualquer check não-citizen-only — comportamento documentado em `lib/auth/roles.ts`
- RLS é fonte de verdade. Não duplique em código se a RLS já cobre
- Ownership client-page é `owner_profile_id` (1 dono) ou tabela `entity_managers` (multi-pessoa)
- Funções SQL: `is_city_admin(city_id)`, `manages_business(id)`, `manages_realtor(id)`, `manages_entity(type, id)`

## 5. Convenções de código

- Server Components por padrão. `'use client'` só onde precisa de estado/efeito
- Mutations sempre via Server Actions (em `actions.ts` colocado na rota), nunca rotas REST extras
- Toda Server Action começa com `safeParse` Zod
- Mutações sensíveis registram em `audit_log`
- Componentes **nomeados** (não default export) — exceto `page.tsx`/`layout.tsx`
- Strings UI em **PT-BR**. Código em inglês
- Sem `any` — use `unknown` + narrowing
- Sem comentários redundantes. Só para "porquês" não-óbvios
- Datas: armazenar UTC, exibir em `America/Sao_Paulo` via `Intl.DateTimeFormat('pt-BR', { timeZone: city.timezone })`
- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

## 6. Migrations

- Em `supabase/migrations/` no padrão `YYYYMMDDHHMMSS_descricao.sql`
- **Nunca alterar** migration já pushada
- Toda nova tabela tem: `id uuid default gen_random_uuid() primary key`, `created_at`, `updated_at`, RLS ativada
- Trigger `set_updated_at` já existe em `core.sql` — reuse, não recrie
- Após criar migration, regenerar tipos: `supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts`

## 7. Fluxo de trabalho ideal

1. Le o plano específico do sprint
2. Confere com `pnpm --filter web build` que tudo compila antes de começar
3. Implementa em **camadas pequenas e commitáveis** (migration → libs → server actions → páginas → componentes)
4. **Testa build a cada camada** (`pnpm --filter web build` deve passar)
5. Commita cada camada com mensagem `tipo(escopo): descrição` em PT-BR (`feat(referral):`, `fix(media):`, `docs(plans):`...)
6. **Não dá push sem o usuário pedir**
7. **Não cria docs `.md`** sem ser solicitado (só atualiza os existentes em `.davia/`)

## 8. Truques importantes

- **Tipos do Supabase desatualizados após nova migration?** Crie um arquivo temporário `apps/web/lib/supabase/sprint-XX-types.ts` com Row types manuais + `@ts-expect-error` localizado nas chamadas de RPC/tabela nova. Documente no commit que precisa ser removido após `supabase gen types`
- **Preciso ler/escrever em nome de outro usuário?** (signup processando referral, cron, webhook). Use `createServiceRoleClient()` do `@/lib/supabase/service`. **NUNCA** use service role em rota pública sem validação manual
- **Build Next 16 falha com "Both middleware file and proxy file"?** Delete o `middleware.ts` — Next 16 usa `proxy.ts`
- **Server Action não suspende UI?** Use `useActionState` (React 19) e `pending` do hook. Padrão visto em `RaffleEntryForm`
- **Tracking sem bloquear render?** `import { after } from 'next/server'` e chame dentro do Server Component
- **Múltiplas tools em paralelo?** Sempre, quando independentes. Economiza turnos
- **Supabase CLI não instalado localmente.** Faço migrations e código, mas o usuário aplica no banco e regenera tipos manualmente

## 9. O que está pronto (Sprint 0–11)

Auth, painel, comércio (admin), serviços públicos, turismo, comunidade (eventos/classificados/pets/obituários), real estate, transparência (página), SEO/a11y, newsletter, soft launch + ads (em curso), **referral + pontos + sorteios** (Sprint 11 em deploy).

## 10. Próximos sprints planejados

Cada sprint tem `.claude/plans/NN-*.md` detalhado e `.claude/prompts/NN-*.md` com guia rápido pra começar. Ordem:

- **Sprint 12** — PWA + Push notifications (`12-pwa-push-notifications.md`)
- **Sprint 13** — Busca semântica unificada (`13-busca-semantica.md`)
- **Sprint 14** — Analytics de comerciante (`14-analytics-comerciante.md`)

---

**Confirme que leu CLAUDE.md, o plano vivo e o plano da sprint que vamos trabalhar antes de propor qualquer mudança.**
