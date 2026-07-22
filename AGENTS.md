# AGENTS.md — convenções de código

Guia para você (Codex) operar neste repositório. Atualizar a cada sprint quando uma nova convenção surgir.

## Contexto do produto

Portal hiperlocal **multi-cidade**. Cidade-foco do MVP: **Carmo do Rio Claro/MG** (~21k hab, região Furnas/Canastra). Capitólio já cadastrada como `coming_soon`; expansão prevista pra Guapé, São Roque de Minas, Alpinópolis.

**9 módulos liga/desliga por cidade:** utilities, events, tourism, real_estate, businesses, classifieds, community, transparency, ads.

**5 papéis (por cidade):** super_admin, city_admin, moderator, merchant, citizen. `super_admin` tem `city_id = null`; demais são por cidade. Um usuário pode ter papéis diferentes em cidades diferentes.

**Documentação completa em `.davia/assets/`** — leia `overview.html`, `architecture.html`, `multi-city.html`, `ownership.html`, `data-model.html`, `real-estate.html`, `businesses.html`, `auth-flow.html`, `ai-pipeline.html`, `modules-index.html`, `roadmap.html` antes de planejar mudanças grandes.

**Plano vivo em `.Codex/plans/shimmying-singing-platypus.md`** (sprint atual e backlog).

## Stack

- **Next.js 16** App Router + RSC + Server Actions + Turbopack
- **React 19**
- **Tailwind v4** + shadcn/ui (base Radix, preset Nova)
- **Supabase** (Postgres + Auth + Storage + Edge Functions)
- **`@supabase/ssr`** 0.10 — único cliente Supabase aceito
- **Anthropic SDK** — modelos: `Codex-haiku-4-5-20251001` (default) e `Codex-sonnet-4-6` (heavy)
- **Zod** — schemas de input em todo Server Action
- **Resend** — email
- **Maplibre + OSM** — mapas (sem Mapbox/Google)
- **Davia 0.1.14** — documentação interativa em `.davia/`

## Importante: Next 16

Esta é a versão 16, com mudanças relevantes em relação à 14/15. Ler `apps/web/node_modules/next/dist/docs/` quando alterar APIs Next que você não conhece — não confiar no conhecimento prévio.

## Convenções de código

### Server Components por padrão

- Fetch direto no servidor com cliente do `lib/supabase/server.ts`
- `'use client'` apenas onde precisa de estado/efeito/eventos
- Mutations sempre via **Server Actions**, nunca rotas REST extras
- Toda Server Action começa validando input com **Zod**

### Estrutura de pastas

```
apps/web/
├── app/
│   ├── (public)/        rotas sem login
│   ├── (auth)/          /entrar, /cadastro
│   ├── painel/          área logada (admin/merchant/citizen)
│   └── api/             apenas webhooks e callbacks (auth, IA, scrapers)
├── components/
│   ├── ui/              shadcn (não editar manualmente)
│   ├── public/          cards, listagens públicas
│   ├── admin/           formulários e tabelas do painel
│   └── ads/             AdSlot
└── lib/
    ├── supabase/        client / server / middleware (NÃO criar variantes)
    ├── ai/              clientes IA + prompts
    ├── scrapers/        parsers locais
    └── utils/
```

### Supabase

- **NUNCA** importar `@supabase/supabase-js` direto. Sempre via `lib/supabase/{client,server,middleware}.ts`
- `client.ts` → browser
- `server.ts` → RSC + Server Actions (chama `cookies()`)
- `middleware.ts` → apenas refresh de sessão, não autoriza nada
- **RLS é a fonte de verdade da autorização** — não duplicar checagens em código se a RLS já cobre
- Toda nova tabela: `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, RLS ativada
- Migrations em `supabase/migrations/` com nome `YYYYMMDDHHMMSS_descricao.sql` — nunca alterar migration já pushada
- Para criar migration, preferir `npx supabase migration new nome_da_migration`; não inventar timestamp manualmente se o CLI puder gerar
- Antes de criar ou rodar migration, executar `npx supabase migration list` e garantir que o timestamp novo não existe nem no Local nem no Remote
- O Supabase identifica migration pelo timestamp inicial (`YYYYMMDDHHMMSS`), não pelo nome completo; dois arquivos com o mesmo timestamp são conflito mesmo com descrições diferentes
- Migration já aplicada no remoto é imutável: não editar, renomear, reaproveitar timestamp, nem trocar conteúdo. Correção futura sempre em migration nova
- Depois de `db push`, se faltou coluna, seed, policy, trigger ou função, criar uma nova migration corretiva em vez de mexer na anterior
- Se `migration list` mostrar Local/Remote divergente, resolver o histórico antes de continuar e não aplicar SQL manual sem documentar a causa no resumo da tarefa
- Types gerados em `apps/web/lib/supabase/database.types.ts` via `supabase gen types`

### Multi-cidade (regra de ouro)

- **Toda query de domínio filtra por `city_id`.** Sem exceção.
- A cidade atual vem do contexto da request (subdomínio em prod, path em dev) — disponibilizada via helper `getCurrentCity()` que ler do middleware/cookie.
- **Antes de mostrar uma feature, cheque `city_modules`** — não basta a tabela existir, o módulo tem que estar habilitado pra cidade.
- Slugs públicos são UNIQUE por cidade — pode existir `pousada-do-lago` em Carmo e em Capitólio.
- Storage paths começam com `{city_slug}/...`.
- Nunca cruze dados entre cidades sem `super_admin` explícito.

### Auth, papéis e ownership

- Papéis em `profile_roles` (não em `profiles.role` — é tabela separada por cidade).
- `super_admin` tem `city_id = null`; demais sempre têm `city_id`.
- Default em signup: nada (cidadão sem papel global). Pra ganhar `citizen` em uma cidade ele acessa aquela cidade pela 1ª vez (Server Action insere o role).
- Promoção a `merchant` é solicitada pelo usuário e aprovada por admin (com `audit_log`).
- **"Cliente como admin da própria página"** vem de duas pernas combinadas:
  - `owner_profile_id` direto na tabela (caso 1 dono)
  - `entity_managers(profile_id, entity_type, entity_id, role)` para multi-pessoa
- RLS sempre verifica via funções `is_city_admin(city_id)`, `manages_business(id)`, `manages_realtor(id)`, `manages_entity(type, id)` — não duplique a lógica em código.

### IA

- Todo cliente IA via `lib/ai/anthropic.ts` (singleton)
- Sempre logar uso em `ai_jobs` (tokens, custo, status)
- Default = Haiku; Sonnet apenas para tarefas que claramente exigem (atos jurídicos, resumos editoriais)
- Conteúdo gerado por IA exibido pro usuário **sempre** com badge "Resumido por IA — sujeito a verificação" + link para fonte

### LGPD

- Nunca expor: CPF, endereço residencial completo, dados de saúde individuais, nomes em contextos administrativos sensíveis
- UGC sempre tem opt-out direto pelo painel do cidadão
- Política de privacidade em `/privacidade` é fonte de verdade — manter alinhada com o código

### Estilo

- Componentes **nomeados** (não default export) — exceto `page.tsx`/`layout.tsx`
- Strings em **PT-BR** (UI). Código em **inglês**
- **Nunca recriar arquivos inteiros por delete/add ou reescrita ampla quando houver texto PT-BR com acentos.** Isso já corrompeu acentos no Windows. Preferir `apply_patch` pontual e, depois de editar UI em português, revisar o diff procurando `Ã`, `Â`, `â€¦`, `â€”`, `�` ou mojibake semelhante.
- Slugs públicos em PT-BR, sem acentos: `recanto-da-furnas`
- Datas: armazenar UTC, exibir em America/Sao_Paulo via `Intl.DateTimeFormat('pt-BR', ...)`
- Moeda: `R$` com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Sem `any` — usar `unknown` + narrowing
- Sem comentários redundantes (o código bem nomeado fala por si). Comentários apenas para *o porquê* não-óbvio

### Davia

- A cada feature nova: atualizar a página relevante em `.davia/assets/`
- Diagramas em `.davia/assets/mermaids/*.mmd` (auto-convertem para Excalidraw)
- Tabelas em `.davia/assets/data/*.json` como **arrays top-level** com props flat
- Páginas em HTML com tags Tiptap-compliant (sem `<div>`, `<span>`, `<img>`)
- Embeds: `<excalidraw data-path="data/x.json" />`, `<database-view data-path="data/x.json" />`, `<mdx-component data-path="components/x.mdx" />`
- Skill local em `.Codex/skills/davia-documentation/SKILL.md`

## Comandos úteis

```bash
pnpm dev                  # subir o front em dev
pnpm build                # build de produção
pnpm lint                 # eslint
pnpm format               # prettier
pnpm davia:open           # abrir docs Davia local
```

## Antes de fazer commit

1. `pnpm lint` passou
2. `pnpm build` compila (rodar pelo menos no fim do sprint)
3. Migration nova? Documentou no `data-model.html`?
4. Server Action nova? Tem validação Zod?
5. Componente client-side novo? Realmente precisa ser client?

## Padrão de commit

`tipo(escopo): descrição` curta, em PT-BR.
- `feat(turismo): adiciona ficha pública de pousada`
- `fix(auth): corrige redirect pós-login para comerciante`
- `docs(davia): atualiza diagrama de pipeline IA`
- `chore(deps): atualiza next 16.2.4`

Sem trailers de "Co-authored by" automáticos a menos que solicitado.
