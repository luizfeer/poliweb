# Plano 12 — PWA + Notificações Push

> **Pré-requisito:** Sprint 11 (referral) entregue. Base de usuários cadastrados crescendo via indicação.
> **Estimativa:** 1.5 semanas. Mais infra do que UI.

---

## 1. Por quê agora

Cidade pequena, base ~500 usuários — push notification é o canal de retenção mais barato e direto:
- **"Farmácia de plantão hoje: Drogasil"** — alerta utilitário diário
- **"Evento hoje 19h: Cantata na Praça"** — lembrete de agenda
- **"Você ganhou o sorteio do mês!"** — engajamento de gamificação
- **"Seu classificado foi aprovado"** — feedback transacional

PWA também resolve "ícone na tela inicial" — em smartphone Android isso vira "app" pra tia da padaria sem precisar de App Store.

---

## 2. Banco de dados

**Migration:** `supabase/migrations/20260518120000_pwa_push.sql`

```sql
-- Inscrições push por dispositivo
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  city_id     uuid not null references cities(id),
  endpoint    text not null,
  keys_json   jsonb not null,           -- { p256dh, auth }
  user_agent  text,
  last_seen_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (profile_id, endpoint)
);
create index push_subs_city_idx on push_subscriptions(city_id);

-- Histórico de envios
create table push_notifications (
  id              uuid primary key default gen_random_uuid(),
  city_id         uuid not null references cities(id),
  title           varchar(100) not null,
  body            varchar(300) not null,
  url             text,                  -- deep link
  icon_url        text,
  audience        varchar(40) not null,  -- 'all_city' | 'role:merchant' | 'profile:uuid'
  audience_filter jsonb,                 -- ex: { module: 'tourism' }
  sent_count      integer default 0,
  delivered_count integer default 0,
  failed_count    integer default 0,
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  status          varchar(20) default 'queued', -- queued|sending|sent|cancelled
  created_by_profile_id uuid references profiles(id),
  created_at      timestamptz not null default now()
);

-- Log granular (debug + métrica)
create table push_delivery_log (
  id               uuid primary key default gen_random_uuid(),
  notification_id  uuid not null references push_notifications(id) on delete cascade,
  subscription_id  uuid references push_subscriptions(id) on delete set null,
  status           varchar(20),          -- delivered|failed|expired
  error_message    text,
  delivered_at     timestamptz default now()
);

-- Preferências por categoria (LGPD: granular)
create table push_preferences (
  profile_id     uuid primary key references profiles(id) on delete cascade,
  city_id        uuid not null references cities(id),
  alerts         boolean default true,    -- alertas urgentes (saúde, segurança)
  events         boolean default true,    -- eventos da agenda
  utilities      boolean default true,    -- coleta, farmácia
  raffles        boolean default true,    -- sorteios
  classifieds    boolean default false,   -- aprovação dos próprios
  newsletter     boolean default false,   -- digest semanal
  updated_at     timestamptz default now()
);

alter table push_subscriptions enable row level security;
alter table push_notifications enable row level security;
alter table push_delivery_log enable row level security;
alter table push_preferences enable row level security;

create policy "push_subs_own" on push_subscriptions for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "push_notif_admin" on push_notifications for all
  using (is_city_admin(city_id)) with check (is_city_admin(city_id));

create policy "push_delivery_admin" on push_delivery_log for select
  using (exists(select 1 from push_notifications n
                where n.id = notification_id and is_city_admin(n.city_id)));

create policy "push_prefs_own" on push_preferences for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
```

---

## 3. Variáveis de ambiente novas

```bash
# .env.example
VAPID_PUBLIC_KEY=             # gerada por npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:contato@carmodorioclaro.com.br
NEXT_PUBLIC_VAPID_PUBLIC_KEY= # mesma do server, mas exposta pro client subscribe
```

Geração inicial:
```bash
npx web-push generate-vapid-keys
```

---

## 4. Estrutura de arquivos

```
apps/web/
├── public/
│   ├── manifest.json                       ← PWA manifest
│   ├── icon-192.png                        ← gerados via skill carmo-design
│   ├── icon-512.png
│   └── icon-maskable.png
├── app/
│   ├── sw.ts                               ← Service Worker (Next 16 nativo)
│   ├── api/
│   │   └── push/
│   │       ├── subscribe/route.ts          ← POST: cria subscription
│   │       └── unsubscribe/route.ts        ← POST: remove
│   └── painel/
│       ├── cidadao/notificacoes/page.tsx   ← opt-in + preferências
│       └── cidade/push/
│           ├── page.tsx                    ← histórico + métricas
│           ├── novo/page.tsx               ← compor
│           └── actions.ts
└── lib/
    └── push/
        ├── server.ts                       ← sendPushTo*, web-push wrapper
        ├── client.ts                       ← askPermission, subscribe (browser)
        ├── audience.ts                     ← resolve "all_city"|"role:X" → endpoints
        └── templates.ts                    ← buildPayload por tipo

components/
└── citizen/
    ├── push-opt-in-card.tsx                ← convite suave (não invasivo)
    └── push-preferences.tsx                ← toggles por categoria
```

---

## 5. Service Worker

`app/sw.ts` — Next.js 16 suporta service worker nativo via `output: 'export'` ou via convenção `sw.ts` no app root. Validar suporte; fallback é `public/sw.js` manual.

Comportamento mínimo:
```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon ?? '/icon-192.png',
    badge: '/icon-badge.png',
    data: { url: data.url ?? '/' },
    tag: data.tag,                  // dedup notificações
    requireInteraction: data.persistent === true,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## 6. Manifest

`public/manifest.json`:
```json
{
  "name": "Carmo Local",
  "short_name": "Carmo",
  "description": "Portal hiperlocal de Carmo do Rio Claro",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#A8531C",
  "background_color": "#FFF8F0",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["news", "lifestyle", "social"],
  "lang": "pt-BR"
}
```

Adicionar `<link rel="manifest" href="/manifest.json" />` no `app/layout.tsx`.

---

## 7. Wrapper de envio (`lib/push/server.ts`)

```ts
import 'server-only';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToCity(
  cityId: string,
  payload: { title: string; body: string; url?: string; tag?: string },
  category: keyof PushPreferencesRow,
) {
  const supabase = await createServiceRoleClient();

  // Carrega subs filtradas por preferência
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, keys_json, profile_id, push_preferences!inner(*)')
    .eq('city_id', cityId)
    .eq(`push_preferences.${category}`, true);

  const notif = await createNotificationRecord(cityId, payload, 'all_city');

  // Paraleliza com limite (não bombar 5000 push de uma vez)
  await pMap(subs ?? [], async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys_json },
        JSON.stringify(payload),
      );
      await logDelivery(notif.id, sub.id, 'delivered');
    } catch (err) {
      await logDelivery(notif.id, sub.id, 'failed', err.message);
      // 410 Gone → remove subscription stale
      if (err.statusCode === 410) await removeSubscription(sub.id);
    }
  }, { concurrency: 50 });
}

export async function sendPushToProfile(profileId: string, ...);
```

---

## 8. Opt-in client (`lib/push/client.ts`)

```ts
'use client';

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const reg = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  });

  return true;
}
```

---

## 9. Trigger automático em outras actions

Após criar/aprovar entidades existentes, disparar push se categoria habilitada:

| Trigger | Categoria | Audiência |
|---------|-----------|-----------|
| `approveClassifiedAction` | `classifieds` | autor do classificado |
| `publishEventAction` | `events` | toda cidade |
| `createServiceAlertAction` | `alerts` | toda cidade |
| `setPharmacyShiftAction` | `utilities` | toda cidade (manhã da troca) |
| `drawRaffleWinnerAction` | `raffles` | winner + toda cidade |

---

## 10. Painel admin de push

`/painel/cidade/push` — tabela com:
- Histórico das últimas notificações
- Métricas: enviadas / entregues / falhadas / taxa de entrega
- Botão "novo push"

`/painel/cidade/push/novo`:
- Form: título (max 50 chars com contador), corpo (max 200), URL deep link, categoria
- Audience picker: toda cidade / só merchants / por módulo
- Preview de como vai aparecer (mock notification)
- Agendamento opcional (`scheduled_for`)
- Botão "enviar agora" / "agendar"

---

## 11. Preferências do cidadão (LGPD)

`/painel/cidadao/notificacoes`:
- Card "Receber notificações no celular?" → botão `subscribeToPush()`
- Toggles por categoria: alertas, eventos, utilidades, sorteios, classificados, newsletter
- Botão "Cancelar todas" → `unsubscribeFromPush()`
- Lista de dispositivos inscritos com "remover este dispositivo"
- Texto LGPD: "Você pode cancelar a qualquer momento. Não compartilhamos seus dados."

---

## 12. Ordem de execução

1. **Dia 1:** Migration + RLS + tipos + gerar VAPID keys
2. **Dia 2:** Manifest + Service Worker + ícones (skill `carmo-design`)
3. **Dia 3:** `lib/push/{server,client,audience}.ts` + endpoints `/api/push/*`
4. **Dia 4:** Painel cidadão (opt-in + preferências)
5. **Dia 5-6:** Painel admin (compose + histórico + métricas)
6. **Dia 7:** Triggers automáticos nas actions existentes
7. **Dia 8:** Cron de envios agendados + smoke test em 3 dispositivos reais (Android/iOS/Desktop)

---

## 13. Definition of Done

- [ ] PWA instalável (passa no Lighthouse PWA audit)
- [ ] Service Worker registra e recebe push
- [ ] Cidadão consegue ativar push e receber notificação teste
- [ ] Preferências por categoria respeitadas no envio
- [ ] Admin envia push pra cidade e vê métricas reais (enviadas/entregues)
- [ ] Subscriptions com endpoint expirado (410) são removidas automaticamente
- [ ] Sorteio realizado dispara push pro winner
- [ ] Documentação em `.davia/assets/pwa-push.html`

---

## 14. Riscos

| Risco | Mitigação |
|-------|-----------|
| iOS Safari não suporta web push fora de PWA instalado | Educar usuário a "Adicionar à tela inicial" |
| Browser remove subscription silenciosamente | Re-subscribe no carregamento se permission=granted mas no sub local |
| Spam admin → usuário desabilita tudo | Limite soft: máx 3 push/dia por cidade no admin UI |
| LGPD: opt-in obrigatório | Permission do browser já garante; preferências granulares são extra |
| VAPID key vaza | Rotação manual via `npx web-push generate-vapid-keys`; subs antigas viram 410 |
