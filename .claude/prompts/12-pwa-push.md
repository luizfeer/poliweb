# Prompt — Sprint 12: PWA + Push Notifications

> Cole junto com `.claude/prompts/00-onboarding.md`.

---

## Contexto

Implementar PWA instalável + web push notifications. Canal de retenção mais barato pra cidade pequena. Sprint 11 (referral) deve estar **completamente fechado** antes de começar (incluindo migration aplicada e tipos regenerados).

**Comece lendo:**
- `.claude/plans/12-pwa-push-notifications.md` — plano detalhado completo
- `apps/web/proxy.ts` — entender o middleware atual

## Por quê

- "Farmácia de plantão hoje" — alerta utilitário
- "Evento hoje 19h na praça" — lembrete de agenda
- "Você ganhou o sorteio!" — engajamento (já tem hook em `lib/raffles/notifications.ts`)
- "Seu classificado foi aprovado" — feedback transacional
- PWA = ícone na tela inicial sem App Store

## Pré-requisitos antes de codar

1. Gerar VAPID keys: `npx web-push generate-vapid-keys`
2. Adicionar em `.env.local` e em `.env.example`:
   ```
   VAPID_PUBLIC_KEY=
   VAPID_PRIVATE_KEY=
   VAPID_SUBJECT=mailto:contato@carmodorioclaro.com.br
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=
   ```
3. Instalar: `pnpm --filter web add web-push @types/web-push`
4. Pedir ao designer (ou skill `carmo-local-design`) ícones 192px, 512px e 512px maskable

## Ordem de execução (10 dias estimados)

### Dia 1 — Banco
- Criar migration `20260518120000_pwa_push.sql` com 4 tabelas: `push_subscriptions`, `push_notifications`, `push_delivery_log`, `push_preferences`
- RLS: subs/prefs do dono; notifs/log só admin
- Aplicar e regenerar tipos

### Dia 2 — PWA básico
- `public/manifest.json` (theme `#A8531C`, bg `#FFF8F0`)
- `public/icon-192.png`, `icon-512.png`, `icon-maskable.png`
- `<link rel="manifest">` em `app/layout.tsx`
- Service worker via `app/sw.ts` (Next 16 nativo) — handlers `push` e `notificationclick`
- Validar com Lighthouse PWA audit (target ≥90)

### Dia 3 — Wrapper de envio
- `lib/push/server.ts`: `sendPushToCity()`, `sendPushToProfile()` com `web-push`
  - Filtra por `push_preferences.{categoria}=true`
  - Concorrência limitada (50 paralelos)
  - 410 Gone → remove subscription stale
- `lib/push/client.ts`: `subscribeToPush()`, `unsubscribeFromPush()`
- `lib/push/audience.ts`: resolver "all_city" / "role:merchant" / "profile:uuid" → endpoints
- `app/api/push/subscribe/route.ts` e `unsubscribe/route.ts`

### Dia 4 — Painel cidadão
- `app/painel/cidadao/notificacoes/page.tsx`:
  - Card "Receber notificações" com botão `subscribeToPush()`
  - Toggles por categoria (alerts, events, utilities, raffles, classifieds, newsletter)
  - Lista de dispositivos com "remover este"
  - Texto LGPD claro
- Adicionar link no `components/painel/sidebar.tsx`

### Dia 5-6 — Painel admin
- `app/painel/cidade/push/page.tsx` — histórico + métricas (enviadas/entregues/falhadas)
- `app/painel/cidade/push/novo/page.tsx` — form: título (≤50), corpo (≤200), URL deep link, categoria, audience picker, agendamento opcional, preview de mock notification
- `actions.ts`: `sendPushAction`, `schedulePushAction`, `cancelScheduledPushAction`
- Limite soft de 3 push/dia por cidade no UI

### Dia 7 — Triggers automáticos
Disparar `sendPushToProfile/sendPushToCity` em:
- `approveClassifiedAction` (autor) → categoria `classifieds`
- `publishEventAction` (toda cidade) → `events`
- `createServiceAlertAction` (toda cidade) → `alerts`
- `setPharmacyShiftAction` (manhã da troca) → `utilities`
- `drawRaffleWinnerAction` no cron (winner + cidade) → `raffles`

### Dia 8 — Cron + smoke test
- `app/api/cron/send-scheduled-push/route.ts` (header `Authorization: Bearer $CRON_SECRET`)
- Loop pelas `push_notifications` com `scheduled_for <= now()` e `status = 'queued'`
- Smoke test em 3 dispositivos: Android Chrome, iOS Safari (PWA instalado), Desktop Chrome

## Cuidados

- iOS Safari só suporta web push **dentro de PWA instalado**. Educar usuário a "Adicionar à tela inicial"
- Permission request **uma só vez** — se negar, não insistir
- Re-subscribe automático se `permission=granted` mas não há sub local
- Spam admin: limite UI hard de 3/dia
- Service Worker em dev: `next dev --turbopack` pode requerer flag específica — checar docs Next 16

## Definition of Done (do plano)

Checklist em `.claude/plans/12-pwa-push-notifications.md` seção 13.

## Próximo sprint

Após validar push em produção (1 semana de uso real), partir para **Sprint 13 (Busca semântica)** seguindo `.claude/prompts/13-busca-semantica.md`.
