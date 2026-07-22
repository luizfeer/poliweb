# Prompt — Finalizar Sprint 11 (Referral + Pontos + Sorteios)

> Use quando voltar pra fechar o que ficou pendente do Sprint 11.
> Cole junto com `.claude/prompts/00-onboarding.md`.

---

## Contexto

Sprint 11 está **funcionalmente completo** (front + back), faltam etapas operacionais e finalização técnica. Branch `main` no GitHub já tem todos os 11 commits do sprint.

**Comece lendo:**
- `.claude/plans/11-referral-pontos-sorteios.md` — plano detalhado
- `.claude/plans/README.md` — seção "Sprint 11 (em andamento)"

## O que falta (em ordem)

### 1. Aplicar migration no Supabase

```bash
supabase db push
# OU aplicar manualmente via dashboard:
# supabase/migrations/20260504120000_referral_pontos_sorteios.sql
```

Confirmar criação de: `referral_codes`, `referral_conversions`, `citizen_points`, `point_transactions`, `raffles`, `raffle_entries` + funções `award_points`, `generate_referral_code`, `draw_raffle_winner`.

### 2. Regenerar tipos e remover workarounds temporários

```bash
supabase gen types typescript --local > apps/web/lib/supabase/database.types.ts
```

Em seguida, **deletar** `apps/web/lib/supabase/sprint-11-types.ts` e remover os workarounds nestes arquivos:
- `apps/web/lib/points/award.ts`
- `apps/web/lib/points/queries.ts`
- `apps/web/lib/referral/codes.ts`
- `apps/web/lib/raffles/queries.ts`
- `apps/web/app/(public)/sorteios/actions.ts`
- `apps/web/app/painel/cidade/sorteios/actions.ts`
- `apps/web/app/api/cron/draw-raffles/route.ts`

Padrão de remoção:
- `import { asSprint11 } from '@/lib/supabase/sprint-11-types'` → remover
- `asSprint11(await createClient())` → `await createClient()`
- `asSprint11(createServiceRoleClient())` → `createServiceRoleClient()`
- `// @ts-expect-error sprint-11 RPC pending types regen` → remover
- `as unknown as string`/`as number | null` em retornos de RPC → remover (tipos vão estar corretos)
- `.maybeSingle<...>()`, `.single<...>()`, `.returns<...>()` com generics manuais → remover (inferência funciona)

Validar com `pnpm --filter web build && pnpm --filter web lint`.

### 3. Conectar dados reais nas páginas mock

Duas páginas têm `// TODO sprint-11:` indicando o SQL alvo:

#### `apps/web/app/painel/cidadao/sorteios/page.tsx`
Criar `lib/raffles/queries.ts > listMyEntries(profileId, cityId)`:
```sql
SELECT raffles.*,
       sum(raffle_entries.entries_count) as my_entries,
       sum(raffle_entries.points_spent) as my_points_spent,
       (raffles.winner_profile_id = $1) as is_winner
FROM raffle_entries
JOIN raffles ON raffles.id = raffle_entries.raffle_id
WHERE raffle_entries.profile_id = $1 AND raffle_entries.city_id = $2
GROUP BY raffles.id
ORDER BY raffles.draw_at DESC
```

Substituir `MOCK_ENTRIES` e remover banner "Dados de exemplo".

#### `apps/web/app/painel/cidade/pontos/page.tsx`
Criar `lib/points/admin-queries.ts` com:
- `getCityPointsSummary(cityId)` — count de cidadãos, sum de balance e lifetime, count de referral_conversions, sum de raffle_entries
- `getTopCitizensByBalance(cityId, limit=50)` — JOIN profiles + count de referral_conversions
- `getRecentTransactions(cityId, limit=30)` — JOIN profiles para nome
- `getTopReferrers(cityId, limit=10)` — GROUP BY referrer

Substituir `MOCK_RANKING`, `MOCK_SUMMARY`, `MOCK_RECENT` e remover banner.

Reativar botão "+ Ajuste manual" criando `adminAdjustPointsAction(formData)` em `actions.ts` (Zod com `profile_id`, `delta`, `reason`).

### 4. Triggers de pontos em outras actions (opcional, baixa prioridade)

Em cada action listada abaixo, importar `awardPoints` e `POINTS` e disparar após sucesso da ação:
- `approveClassifiedAction` → `+5` (`classified_posted`) ao autor
- `approveEventAction` → `+10` (`event_submitted`) ao organizador
- `markLostFoundResolvedAction` → `+5` (`lost_found_resolved`)
- `createBusinessReviewAction` → `+5` (`review_written`)

### 5. Configuração de produção

```bash
# Vercel env vars (production)
CRON_SECRET=<gerar com: openssl rand -base64 32>
```

Agendar cron diário às 03h. Em `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/draw-raffles", "schedule": "0 3 * * *" }
  ]
}
```

Vercel Cron já manda `Authorization: Bearer ${CRON_SECRET}` automaticamente quando essa env existe.

### 6. Smoke test E2E (3 contas)

1. **Conta A** cadastra → vai em `/painel/cidadao/indicar` → copia link
2. **Conta B** abre o link em janela anônima → `/r/{code}` → segue para `/cadastro` → conclui
3. Confirma: A tem +100 pts (`referral_earned`), B tem +20+20=+40 pts (`signup_bonus` + `referral_received`)
4. **Admin** cria sorteio rascunho → ativa → B entra com 1 entrada
5. Define `draw_at` no passado → chama manualmente `GET /api/cron/draw-raffles` com header de auth
6. Confirma email Resend recebido pelo vencedor + `audit_log` registrado

## Definition of Done

- [ ] Migration aplicada e funcional
- [ ] `sprint-11-types.ts` removido, build limpo, lint ok
- [ ] Páginas mock conectadas a dados reais
- [ ] Cron rodando em produção
- [ ] Smoke test E2E passou
- [ ] Atualizar `.davia/assets/` com nova página `referral-pontos-sorteios.html`

Após terminar: marca como concluído em `shimmying-singing-platypus.md` e parte para o **Sprint 12**.
