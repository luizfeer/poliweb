# Plano 11 — Sistema de Indicação + Pontos + Sorteios

> **Pré-requisito:** Sprint 10 (soft launch) em andamento. Auth e painel do cidadão funcionando.
> **Estimativa:** 2 semanas. Sprint mais "produto" do que técnico — UX precisa ser irresistível.

---

## 1. Visão de produto

**Loop de viralização orgânica:**
```
Cadastro → código único → compartilha link
→ amigo acessa /r/{código} → cookie 30 dias
→ amigo se cadastra → referidor +100 pts, novo +20 pts
→ pontos viram entradas em sorteios
→ prêmio (idealmente) patrocinado por comerciante local
```

**Por que funciona em Carmo (21k hab):**
- Indicação de quem você conhece tem peso 10x maior
- Prêmio local ("jantar pra 2 no X") = marketing pro comerciante + custo zero pro portal
- Sorteio cria reason-to-return semanal/mensal

---

## 2. Banco de dados

**Migration:** `supabase/migrations/20260504120000_referral_pontos_sorteios.sql`

### 2.1 Tabelas

```sql
create table referral_codes (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  city_id     uuid not null references cities(id) on delete cascade,
  code        varchar(10) not null,
  created_at  timestamptz not null default now(),
  unique (code, city_id),
  unique (profile_id, city_id)
);

create table referral_conversions (
  id                  uuid primary key default gen_random_uuid(),
  referral_code       varchar(10) not null,
  referrer_profile_id uuid not null references profiles(id),
  referred_profile_id uuid not null references profiles(id),
  city_id             uuid not null references cities(id),
  converted_at        timestamptz not null default now(),
  unique (referred_profile_id, city_id)
);

create table citizen_points (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  city_id         uuid not null references cities(id) on delete cascade,
  balance         integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0,
  updated_at      timestamptz not null default now(),
  unique (profile_id, city_id)
);

create table point_transactions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id),
  city_id       uuid not null references cities(id),
  delta         integer not null,
  reason        varchar(60) not null,
  reference_id  uuid,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);
create index point_transactions_profile_idx on point_transactions(profile_id, city_id, created_at desc);

create table raffles (
  id                      uuid primary key default gen_random_uuid(),
  city_id                 uuid not null references cities(id),
  slug                    varchar(120) not null,
  title                   varchar(200) not null,
  description             text,
  prize_description       text not null,
  prize_value_cents       integer,
  cover_url               text,
  sponsor_business_id     uuid references businesses(id),
  entry_cost_points       integer not null default 100,
  max_entries_per_profile integer not null default 5,
  draw_at                 timestamptz not null,
  drawn_at                timestamptz,
  winner_profile_id       uuid references profiles(id),
  status                  varchar(20) not null default 'draft',
  created_by_profile_id   uuid references profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (slug, city_id)
);

create table raffle_entries (
  id            uuid primary key default gen_random_uuid(),
  raffle_id     uuid not null references raffles(id) on delete cascade,
  profile_id    uuid not null references profiles(id),
  city_id       uuid not null references cities(id),
  points_spent  integer not null,
  entries_count integer not null default 1,
  created_at    timestamptz not null default now()
);
create index raffle_entries_raffle_idx on raffle_entries(raffle_id);
```

### 2.2 RLS

```sql
alter table referral_codes enable row level security;
alter table referral_conversions enable row level security;
alter table citizen_points enable row level security;
alter table point_transactions enable row level security;
alter table raffles enable row level security;
alter table raffle_entries enable row level security;

create policy "referral_codes_own" on referral_codes for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "referral_conversions_read" on referral_conversions for select
  using (referrer_profile_id = auth.uid() or referred_profile_id = auth.uid() or is_city_admin(city_id));

create policy "citizen_points_read" on citizen_points for select
  using (profile_id = auth.uid() or is_city_admin(city_id));

create policy "point_transactions_read" on point_transactions for select
  using (profile_id = auth.uid() or is_city_admin(city_id));

create policy "raffles_public_read" on raffles for select
  using (status in ('active', 'drawn'));
create policy "raffles_admin_all" on raffles for all
  using (is_city_admin(city_id)) with check (is_city_admin(city_id));

create policy "raffle_entries_own_read" on raffle_entries for select
  using (profile_id = auth.uid() or is_city_admin(city_id));
create policy "raffle_entries_own_insert" on raffle_entries for insert
  with check (profile_id = auth.uid());
```

### 2.3 Funções SQL

```sql
create or replace function public.award_points(
  p_profile_id uuid, p_city_id uuid, p_delta integer,
  p_reason varchar, p_reference uuid default null
) returns integer language plpgsql security definer as $$
declare v_balance integer;
begin
  insert into citizen_points (profile_id, city_id, balance, lifetime_earned)
  values (p_profile_id, p_city_id, greatest(0, p_delta), greatest(0, p_delta))
  on conflict (profile_id, city_id) do update
    set balance = citizen_points.balance + p_delta,
        lifetime_earned = citizen_points.lifetime_earned + greatest(0, p_delta),
        updated_at = now()
  returning balance into v_balance;

  insert into point_transactions (profile_id, city_id, delta, reason, reference_id, balance_after)
  values (p_profile_id, p_city_id, p_delta, p_reason, p_reference, v_balance);

  return v_balance;
end; $$;

create or replace function public.generate_referral_code(
  p_profile_id uuid, p_city_id uuid
) returns varchar language plpgsql security definer as $$
declare v_code varchar; v_exists boolean;
begin
  select code into v_code from referral_codes
    where profile_id = p_profile_id and city_id = p_city_id;
  if v_code is not null then return v_code; end if;

  loop
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    select exists(select 1 from referral_codes where code = v_code and city_id = p_city_id)
      into v_exists;
    exit when not v_exists;
  end loop;

  insert into referral_codes (profile_id, city_id, code)
    values (p_profile_id, p_city_id, v_code)
    on conflict (profile_id, city_id) do update set code = referral_codes.code
    returning code into v_code;

  return v_code;
end; $$;

create or replace function public.draw_raffle_winner(p_raffle_id uuid)
returns uuid language plpgsql security definer as $$
declare v_winner uuid; v_city_id uuid;
begin
  select city_id into v_city_id from raffles where id = p_raffle_id and status = 'active';
  if v_city_id is null then raise exception 'Sorteio nao encontrado ou nao ativo'; end if;

  -- Sorteio ponderado: cada entries_count = N chances
  with expanded as (
    select profile_id from raffle_entries, generate_series(1, entries_count)
    where raffle_id = p_raffle_id
  )
  select profile_id into v_winner from expanded order by random() limit 1;

  update raffles set
    winner_profile_id = v_winner,
    drawn_at = now(),
    status = 'drawn',
    updated_at = now()
  where id = p_raffle_id;

  return v_winner;
end; $$;

revoke all on function public.award_points(uuid,uuid,integer,varchar,uuid) from public, anon;
grant execute on function public.award_points(uuid,uuid,integer,varchar,uuid) to authenticated;
revoke all on function public.generate_referral_code(uuid,uuid) from public, anon;
grant execute on function public.generate_referral_code(uuid,uuid) to authenticated;
revoke all on function public.draw_raffle_winner(uuid) from public, anon;
grant execute on function public.draw_raffle_winner(uuid) to authenticated;
```

### 2.4 Tipos no Supabase

Após aplicar a migration, rodar:
```bash
supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts
```

---

## 3. Economia de pontos

| Ação | Pontos | Trigger |
|------|--------|---------|
| Cadastro (welcome) | +20 | `signUpAction` |
| Ser indicado | +20 (extra ao welcome) | `applyReferralOnSignup` |
| Indicar alguém | **+100** | `applyReferralOnSignup` |
| Classificado aprovado | +5 | Action de aprovação admin |
| Evento aprovado | +10 | Action de aprovação admin |
| Achado/perdido resolvido | +5 | Action de marcar resolvido |
| Review escrito | +5 | `createReviewAction` |
| Ajuste manual admin | variável | `/painel/cidade/pontos` |
| Entrada em sorteio | -100 a -500 | `enterRaffleAction` |

Centralizar em `apps/web/lib/points/economy.ts`:
```ts
export const POINTS = {
  signup_bonus: 20,
  referral_received: 20,
  referral_earned: 100,
  classified_posted: 5,
  event_submitted: 10,
  lost_found_resolved: 5,
  review_written: 5,
} as const;
```

---

## 4. Estrutura de arquivos

```
apps/web/
├── app/
│   ├── r/[code]/page.tsx                    ← captura cookie + redirect
│   ├── (public)/sorteios/
│   │   ├── page.tsx                         ← lista pública
│   │   └── [slug]/page.tsx                  ← ficha + botão entrar
│   └── painel/
│       ├── cidadao/
│       │   ├── pontos/page.tsx              ← saldo + histórico
│       │   ├── indicar/page.tsx             ← link + QR + contagem
│       │   └── sorteios/page.tsx            ← meus sorteios
│       └── cidade/
│           ├── sorteios/
│           │   ├── page.tsx                 ← listagem admin
│           │   ├── novo/page.tsx
│           │   ├── [id]/page.tsx
│           │   └── actions.ts
│           └── pontos/
│               ├── page.tsx                 ← ranking + ajuste manual
│               └── actions.ts
└── lib/
    ├── referral/
    │   ├── actions.ts                       ← server actions
    │   ├── codes.ts                         ← getOrCreateCode, applyReferral
    │   └── cookie.ts                        ← REF_COOKIE_NAME, helpers
    ├── points/
    │   ├── economy.ts                       ← POINTS constants
    │   ├── award.ts                         ← awardPoints helper (chama RPC)
    │   └── queries.ts                       ← getMyBalance, getMyHistory
    └── raffles/
        ├── queries.ts                       ← listActive, listEnded, getBySlug
        └── enter.ts                         ← validações antes de enterRaffleAction

components/
├── citizen/
│   ├── points-balance.tsx                   ← chip saldo no header
│   ├── referral-card.tsx                    ← card grande com link + QR
│   ├── referral-share-buttons.tsx           ← whatsapp / link / copiar
│   └── points-history.tsx                   ← tabela paginada
└── raffles/
    ├── raffle-card.tsx                      ← card público
    ├── raffle-entry-modal.tsx               ← confirma entradas (client)
    └── raffle-admin-row.tsx                 ← row da listagem admin
```

---

## 5. Server Actions detalhadas

### `lib/referral/actions.ts`

```ts
'use server';
// getOrCreateMyReferralCodeAction()
//   → requireProfile + getCurrentCity
//   → rpc('generate_referral_code', { p_profile_id, p_city_id })
//   → return { code, shareUrl }

// applyReferralCookieAction(formData)
//   → opcional: action interna chamada pelo signupAction
```

### `lib/referral/codes.ts` (interno, chamado por signUpAction)

```ts
export async function applyReferralOnSignup(
  refCode: string, newProfileId: string, cityId: string
): Promise<void> {
  const supabase = await createClient(); // service role aqui (bypassa RLS)

  // 1. Localizar referidor
  const { data: refRow } = await supabase
    .from('referral_codes')
    .select('profile_id')
    .eq('code', refCode.toUpperCase())
    .eq('city_id', cityId)
    .maybeSingle();
  if (!refRow) return; // código inválido = ignora silenciosamente

  // 2. Anti-fraude básico: não permitir auto-referência
  if (refRow.profile_id === newProfileId) return;

  // 3. Registrar conversão (UNIQUE garante idempotência)
  const { data: conv, error } = await supabase
    .from('referral_conversions')
    .insert({
      referral_code: refCode.toUpperCase(),
      referrer_profile_id: refRow.profile_id,
      referred_profile_id: newProfileId,
      city_id: cityId,
    })
    .select('id')
    .single();
  if (error || !conv) return;

  // 4. Pontos pros dois
  await supabase.rpc('award_points', {
    p_profile_id: refRow.profile_id, p_city_id: cityId,
    p_delta: POINTS.referral_earned, p_reason: 'referral_earned',
    p_reference: conv.id,
  });
  await supabase.rpc('award_points', {
    p_profile_id: newProfileId, p_city_id: cityId,
    p_delta: POINTS.referral_received, p_reason: 'referral_received',
    p_reference: conv.id,
  });
}
```

### `app/painel/cidade/sorteios/actions.ts`

```ts
createRaffleAction(formData)         // Zod, requireRole admin
updateRaffleAction(formData)
activateRaffleAction(raffleId)       // status: draft → active
drawRaffleWinnerAction(raffleId)     // chama RPC + envia email (Resend) + audit_log
cancelRaffleAction(raffleId)         // status → cancelled, reembolsa pontos das entries
```

### `app/painel/cidadao/sorteios/actions.ts`

```ts
enterRaffleAction(formData)
  // Zod: { raffleId, entriesCount: 1..max_entries_per_profile }
  // 1. Carrega raffle (ativo, draw_at no futuro)
  // 2. Calcula custo total = entry_cost_points * entriesCount
  // 3. Verifica saldo via citizen_points (RLS própria)
  // 4. Insert raffle_entries
  // 5. award_points(profileId, -custo, 'raffle_entry', entry.id)
  // 6. revalidatePath('/sorteios/[slug]')
```

---

## 6. Integração no signup flow

**Editar** `app/(auth)/cadastro/actions.ts`:

```ts
import { cookies } from 'next/headers';
import { applyReferralOnSignup } from '@/lib/referral/codes';
import { POINTS } from '@/lib/points/economy';
import { REF_COOKIE_NAME } from '@/lib/referral/cookie';

// ... depois de criar usuário e profile:

// Bônus de boas-vindas
await supabase.rpc('award_points', {
  p_profile_id: user.id, p_city_id: city.id,
  p_delta: POINTS.signup_bonus, p_reason: 'signup_bonus',
});

// Processar referral se houver cookie
const cookieStore = await cookies();
const refCode = cookieStore.get(REF_COOKIE_NAME)?.value;
if (refCode) {
  await applyReferralOnSignup(refCode, user.id, city.id);
  cookieStore.delete(REF_COOKIE_NAME);
}
```

**Criar** `app/r/[code]/page.tsx`:

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REF_COOKIE_NAME } from '@/lib/referral/cookie';

export default async function ReferralCapturePage({
  params,
}: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const sanitized = code.toUpperCase().slice(0, 10);
  if (!/^[A-Z0-9]+$/.test(sanitized)) redirect('/');

  (await cookies()).set(REF_COOKIE_NAME, sanitized, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  redirect('/cadastro');
}
```

---

## 7. Cron de sorteio automático

**Edge Function** `supabase/functions/draw-raffles/index.ts`:

```ts
// Chamada via Supabase Cron (todo dia 03h)
// 1. select * from raffles where status='active' and draw_at <= now()
// 2. para cada → rpc('draw_raffle_winner', { p_raffle_id })
// 3. envia email pro winner via Resend (template raffle-winner)
```

**Ou** cron route `app/api/cron/draw-raffles/route.ts` chamado por Vercel Cron / cron-job.org:
```ts
// header X-Cron-Secret obrigatório
// loopa raffles vencidos, chama RPC, manda email
```

---

## 8. Componentes-chave

### `components/citizen/referral-card.tsx`
- Mostra `https://carmolocal.com.br/r/JOAO2024` em destaque
- Botão "copiar link" (uses `navigator.clipboard`)
- Botão "compartilhar no WhatsApp" → `https://wa.me/?text=...`
- QR code (lib `qrcode.react`) — útil pra passar em conversa
- Contador: "X amigos se cadastraram pelo seu link → Y pontos ganhos"
- Frase motivacional: "Indique mais 2 amigos e você tem entrada no sorteio do mês"

### `components/raffles/raffle-card.tsx` (público)
- Foto do prêmio (cover_url)
- Título + descrição curta
- Badge "Sorteio em X dias"
- "Custo: 100 pts por entrada"
- Logo do patrocinador (sponsor_business_id) com link pra ficha
- CTA: "Entrar no sorteio" (se logado) ou "Cadastre-se pra participar"

---

## 9. Ordem de execução

1. **Dia 1-2:** Migration + RLS + funções SQL + types regenerados + seeds (1 sorteio teste)
2. **Dia 3:** `lib/referral/*` + `lib/points/*` + integração no signup + `/r/[code]`
3. **Dia 4:** Painel cidadão (`/painel/cidadao/indicar`, `/pontos`)
4. **Dia 5-6:** Componentes públicos + `/sorteios` + `/sorteios/[slug]` + `enterRaffleAction`
5. **Dia 7-8:** Painel admin (`/painel/cidade/sorteios/*` + actions)
6. **Dia 9:** Cron de sorteio automático + email Resend ao winner
7. **Dia 10:** Smoke test E2E (criar usuário A, gerar link, criar usuário B via link, validar pontos, criar sorteio admin, B entra, sortear, validar email)

---

## 10. Definition of Done

- [ ] Migration aplicada + RLS policies validadas com 3 papéis (cidadão / admin / super_admin)
- [ ] `/r/{code}` seta cookie e redireciona corretamente
- [ ] Cadastro com cookie credita +100 ao referidor e +20 extra ao novo
- [ ] Cadastro sem cookie credita só +20 (welcome)
- [ ] Auto-referência bloqueada (mesma pessoa não pode ser referidora dela mesma)
- [ ] `/painel/cidadao/indicar` mostra código, link, QR e contagem real
- [ ] `/painel/cidadao/pontos` mostra saldo + histórico paginado
- [ ] Admin cria sorteio rascunho → ativa → cidadão consegue entrar
- [ ] Saldo insuficiente mostra erro claro (não 500)
- [ ] Cron de sorteio sorteia winner ponderado por entries_count
- [ ] Email Resend ao winner com template HTML
- [ ] `audit_log` registra criação/ativação/sorteio
- [ ] Build limpo, lint ok
- [ ] Davia atualizado: nova página `referral-pontos-sorteios.html` em `.davia/assets/`

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Fraude: pessoa cria N contas pra auto-indicar | UNIQUE em `referred_profile_id` + check IP/email no `signUpAction` (futuro: SMS verify) |
| Inflação de pontos | `lifetime_earned` separado de `balance`; admin pode auditar |
| Sorteio "manipulado" | RPC `draw_raffle_winner` é `security definer` + `audit_log` registra `winner_profile_id` no momento exato |
| Race condition na entrada (gastar mais do que tem) | check `balance >= 0` constraint no banco + transação na RPC |
| Spam de invites no WhatsApp | Não é nosso problema (responsabilidade do usuário); termos de uso menciona |

---

## 12. Métricas-bússola

- **Taxa de conversão de link:** clicks em `/r/*` / cadastros via cookie
- **Coeficiente viral K:** indicações por usuário ativo (target: K > 0.3)
- **Tempo médio até primeira indicação:** dias entre cadastro e 1ª referral_conversion
- **% de usuários com saldo > 0:** engajamento da economia
- **Taxa de participação em sorteios:** entries / usuários elegíveis
