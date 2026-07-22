# Plano 00 — Auth, papéis e painel base

> **Pré-requisitos:** migrations `20260429120000_core.sql` aplicada; helpers RLS (`is_super_admin`, `is_city_admin`, `is_merchant`, `manages_entity`) prontos; cidade Carmo seedada.
> **Destrava:** todas as próximas sprints.

## 1. Contexto

- Tudo daqui pra frente exige usuário logado e contexto de cidade.
- Papéis são **por cidade** (`profile_roles`). `super_admin` tem `city_id = null`. Um usuário pode ser admin em Carmo e citizen em Capitólio.
- Precisa cobrir: signup com confirmação por email, login, recuperação de senha, escolher/trocar cidade ativa, granting automático de `citizen` na 1ª visita à cidade.
- Painel precisa ser **role-aware**: cada papel vê só o que pode tocar; merchant cai direto em `/painel/comercio` no login.

## 2. Tabelas e RLS

Tudo já existe no banco. Confirmar / ajustar:

- [x] `profiles` (auto-criado via trigger `handle_new_user`).
- [x] `profile_roles (profile_id, city_id, role)` UNIQUE — papéis por cidade.
- [x] `entity_managers` — pra ownership multi-pessoa (usado nos sprints seguintes).
- [x] `audit_log` — toda promoção/revogação registra aqui.
- [x] RLS de `profiles` (self read/update + super_admin) e `profile_roles` (self read; admin/super_admin escreve).

**Pendências:**
- [ ] Função `grant_citizen_role(p_city_id uuid)` — `security definer`, idempotente, insere em `profile_roles` se não existir.
- [ ] Trigger `tg_audit_role_change` em `profile_roles` (insert/delete) gravando em `audit_log` com diff.
- [ ] Policy explícita "**citizen pode auto-conceder citizen**" em `profile_roles for insert` quando `role = 'citizen' and profile_id = auth.uid()` (atualmente só admin/super_admin podem inserir).
- [ ] Seed: 1 super_admin, 1 city_admin Carmo, 1 merchant Carmo, 1 citizen Carmo (`supabase/seeds/auth.sql`).

## 3. Server-side

### Helpers de cidade & papel

- `apps/web/lib/cities/getCurrentCity.ts` — lê do cookie/header (middleware seta) e devolve `{ id, slug, name, state, modules: string[] }`. Retorna `null` se cidade desconhecida; chamador decide se redireciona.
- `apps/web/lib/auth/getProfile.ts` — devolve `{ profile, roles: Role[] }` ou `null`.
- `apps/web/lib/auth/requireRole.ts` — `requireRole({ city_id, kinds: ['city_admin','moderator'] })`. Lança `redirect('/entrar')` ou `notFound()` por falta de papel.
- `apps/web/lib/auth/grantCitizen.ts` — server-only, chama RPC `grant_citizen_role(city_id)`. Usado no middleware da 1ª visita logada a uma cidade ativa.

### Server Actions

#### `app/(auth)/entrar/actions.ts`
- **`signInAction`** — input Zod: `{ email: z.string().email(), password: z.string().min(8) }`. Chama `supabase.auth.signInWithPassword`. Em sucesso: redireciona para `/painel` (homing depende do papel mais alto).
- **`signInWithMagicLink`** — input: `{ email }`. Mock só por enquanto; ativar pós-MVP.

#### `app/(auth)/cadastro/actions.ts`
- **`signUpAction`** — input: `{ full_name, email, password, consent_marketing: boolean }`. Cria conta (confirma email obrigatório), cria profile (trigger), opcional set `default_city_id` se cookie de cidade existir. **Não** concede `merchant` aqui.
- Side effects: nada (trigger cuida do profile).

#### `app/(auth)/recuperar-senha/actions.ts`
- **`requestPasswordResetAction`** — `{ email }`. Manda email via Supabase Auth.
- **`resetPasswordAction`** — `{ token, password }`. Atualiza senha.

#### `app/painel/perfil/actions.ts`
- **`updateProfileAction`** — `{ full_name, phone, avatar_url, bio, default_city_id, consent_marketing }`. Escreve em `profiles`. RLS já cobre (`profiles_self_update`).
- **`uploadAvatarAction`** — recebe `FormData`; faz upload pro bucket `profiles/{profile_id}/avatar.png`.

#### `app/painel/cidade/equipe/actions.ts` (city_admin)
- **`grantRoleAction`** — `{ profile_id (uuid), city_id (uuid), role: z.enum(['city_admin','moderator','merchant']) }`. Insere em `profile_roles`. Side effect: `audit_log('grant_role', diff)`. Quem chama: city_admin daquela cidade ou super_admin.
- **`revokeRoleAction`** — `{ role_id }`. Delete + audit. Bloqueia revogação do próprio último `city_admin` da cidade (regra de segurança).
- **`approveMerchantRequestAction`** — `{ request_id }`. Lê tabela `merchant_requests` (pendência abaixo) e cria role.

#### `app/painel/super/cidades/actions.ts` (super_admin)
- **`createCityAction`** — `{ slug, name, state, status, timezone, lat?, lng?, population?, ibge_code? }`. Insere em `cities`. RLS: `is_super_admin()`.
- **`toggleCityModuleAction`** — `{ city_id, module_key, enabled }`. Upsert em `city_modules`. RLS: `is_city_admin(city_id) or is_super_admin`.

### Middleware

- `apps/web/middleware.ts` — além do refresh `@supabase/ssr` padrão:
  - Lê subdomínio em prod (`carmo.localportal.app`) ou path `/c/[city_slug]/...` em dev.
  - Seta cookie `city_slug` + header `x-city-slug` na response.
  - Se logado e `city_slug` válido (`status='active'`), chama `grantCitizen` quando ainda não tem o papel.

### Pendência opcional

- Tabela `merchant_requests (id, profile_id, city_id, business_hint, justification, status, reviewed_by, reviewed_at)` para fluxo "solicitar virar comerciante". RLS: self insert/read; admin atualiza.

## 4. UI público (não-logado)

- `app/(auth)/layout.tsx` — layout neutro com hero da cidade.
- `app/(auth)/entrar/page.tsx` — formulário shadcn `Form` + `signInAction`.
- `app/(auth)/cadastro/page.tsx` — `signUpAction` + checkbox de consentimento (LGPD).
- `app/(auth)/recuperar-senha/page.tsx` + `app/(auth)/recuperar-senha/[token]/page.tsx`.
- `app/(auth)/sair/route.ts` — handler `POST` que dá `signOut` e redireciona pra home.
- `components/auth/CityPicker.tsx` — dropdown "Você está em **Carmo**" com lista de cidades `active` (header global).

## 5. UI painel (logado)

### Layout

- `app/painel/layout.tsx` — server component, busca `profile + roles + city_modules` da cidade ativa; passa para um `<PainelShell>` client (sidebar dinâmica).
- `components/painel/Sidebar.tsx` — itens condicionais ao papel:
  - **citizen:** Perfil, Favoritos, Meus anúncios (se tiver classifieds).
  - **merchant:** Perfil + "Minha página" (`/painel/comercio/[slug]` ou `/painel/turismo/[slug]`).
  - **city_admin/moderator:** Cidade (módulos, distritos, equipe), Moderação (UGC), Audit, Conteúdo (utilities, agenda etc).
  - **super_admin:** Cidades, Módulos globais, Papéis globais.

### Páginas

- `/painel` — dashboard com cards por permissão.
- `/painel/perfil` — edit de profile + avatar + cidades onde tem papel.
- `/painel/cidade/equipe` — tabela `profile_roles` da cidade, com `<GrantRoleDialog>`.
- `/painel/cidade/modulos` — toggles de `city_modules`.
- `/painel/cidade/distritos` — CRUD de `districts` (city_admin).
- `/painel/cidade/audit` — leitura paginada de `audit_log` (filtros por entity_type, action).
- `/painel/super/cidades` — CRUD de `cities` (só super_admin).

## 6. Definition of Done

<ul data-type="taskList">
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Função <code>grant_citizen_role</code> + trigger de audit em <code>profile_roles</code> aplicados via migration nova</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Policy "citizen pode auto-conceder citizen" adicionada</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Seed <code>supabase/seeds/auth.sql</code> com 4 usuários (super, city_admin, merchant, citizen)</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Middleware setando <code>city_slug</code> em cookie + header em todas as rotas</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Helpers <code>getCurrentCity</code>, <code>getProfile</code>, <code>requireRole</code>, <code>grantCitizen</code> implementados e tipados</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Telas <code>/entrar</code>, <code>/cadastro</code>, <code>/recuperar-senha</code> funcionando com Server Actions + Zod</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Layout <code>/painel</code> com sidebar role-aware</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>CRUD de equipe (<code>/painel/cidade/equipe</code>) e módulos (<code>/painel/cidade/modulos</code>) testados com city_admin de Carmo</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>1ª visita logada a Carmo concede <code>citizen</code> automático e grava em <code>audit_log</code></p></li>
<li data-checked="false" data-type="taskItem"><input type="checkbox" /><p><code>pnpm build</code> passa; lint limpo; smoke manual com 3 usuários OK</p></li>
<li data-checked="true" data-type="taskItem"><input type="checkbox" checked /><p>Davia <code>auth-flow.html</code> atualizada com diagrama do middleware</p></li>
</ul>
