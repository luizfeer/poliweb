# apps/mobile — Portal Carmelitano (React Native)

App mobile do portal hiperlocal. Estratégia híbrida:
- **Nativo** — Home, login/cadastro, perfil, navegação principal.
- **WebView** — todo o resto (turismo, comércio individual, painel admin, etc.).
- **Push** — Expo Notifications + tabela `device_push_tokens` no Supabase.

## Stack

- Expo SDK 54 (new architecture, expo-router 6 typed routes)
- React Native 0.79 + React 19
- TypeScript estrito + Zod nos inputs
- `@supabase/supabase-js` com storage em `expo-secure-store`
- Tab bar nativa **Liquid Glass** (iOS 26) via `expo-router/unstable-native-tabs`
- `react-native-webview` com bridge de sessão Supabase
- `expo-notifications` + canal Android + permissão iOS

## Estrutura

```
apps/mobile/
├── app/                          rotas expo-router
│   ├── _layout.tsx               providers globais + auth gate
│   ├── (auth)/                   modal stack (login, cadastro, recuperar)
│   ├── (tabs)/                   NativeTabs (liquid glass iOS)
│   │   ├── index.tsx             home nativa
│   │   ├── buscar.tsx            webview
│   │   ├── agenda.tsx            webview
│   │   ├── assistente.tsx        webview
│   │   └── perfil.tsx            nativo + links pro painel via webview
│   └── webview/[path].tsx        deep-link genérico pra rotas web
├── components/
│   ├── home/                     pieces da home nativa (cards, sections)
│   ├── ui/                       Button, TextField, Logo
│   └── webview/SmartWebView.tsx  webview com bridge de sessão
├── lib/
│   ├── auth/                     AuthProvider, schemas Zod, actions
│   ├── push/                     registro de token + provider
│   ├── api/                      fetchers do /api/mobile/* do web
│   ├── theme/tokens.ts           cores/tipografia (espelha Tailwind Nova)
│   ├── supabase.ts               cliente único (não criar variantes)
│   └── env.ts                    leitura de env tipada
├── app.config.ts                 ExpoConfig (bundle id, plugins, deep links)
├── eas.json                      perfis dev/preview/production
└── metro.config.js               monorepo aware
```

## Setup local

> Pré-requisitos: Node 20+, pnpm 10+, Xcode 26 (para iOS Liquid Glass), Android Studio.
> A Expo SDK 54 requer Xcode 26 para builds dev/preview do iOS.

```bash
# Na raiz do monorepo (usa apps/web/.env.local como fonte):
pnpm env:sync-mobile

# Ou manualmente: cp apps/mobile/.env.example apps/mobile/.env

pnpm install            # rodar na raiz do monorepo é equivalente
pnpm --filter mobile typecheck
pnpm --filter mobile dev
```

Depois rode em um dispositivo real (Liquid Glass + push só funcionam em device físico):

```bash
pnpm --filter mobile build:ios:dev      # gera dev client iOS via EAS
pnpm --filter mobile build:android:dev  # gera dev client Android via EAS
```

## Backend exigido (no app web)

- `supabase/migrations/20260518120000_device_push_tokens.sql` — tabela `device_push_tokens` com RLS.
- `apps/web/app/api/mobile/bootstrap/route.ts` — payload consolidado da home.
- `apps/web/app/api/mobile/push/register/route.ts` — recebe token Expo e persiste por usuário.

Rode `pnpm db:push` depois de revisar a migration.

## Como o web sabe que está dentro do app

Dois sinais redundantes:

1. **Query `?mobile=1`** na primeira URL aberta pelo `SmartWebView`.
2. **User-Agent** customizado: `Mozilla/5.0 (Mobile) CarmelitanoApp/<versão> (<ios|android>)`.

O middleware do web (`apps/web/middleware.ts`) sela uma cookie `pc-app=carmelitano`
(30 dias) e o `RootLayout` consulta `isMobileAppRequest()` para esconder:

- `GlobalNav` (tab bar do web — redundante com a NativeTabs)
- `ChatWidget` (o app tem a tab Assistente)
- `ConsentBanner` (consent é tratado nativamente / via iOS prompts)
- O `pb` que abre espaço para a tab bar flutuante

Páginas individuais podem consultar `await isMobileAppRequest()` para variar layout.
O `<html>` também recebe `data-app="mobile"` — útil para CSS condicional puro.

## Push notifications

**O que está pronto:**
- ✅ Permissão (iOS prompt + Android channels `default` + `alerts`).
- ✅ Registro do token Expo no dispositivo (depois do login).
- ✅ Persistência em `device_push_tokens` (RLS por owner).
- ✅ Helpers de envio em [`apps/web/lib/push/expo-push.ts`](../web/lib/push/expo-push.ts): `sendExpoPush`, `pushToUser`, `pushToUsers` — com limpeza automática de tokens `DeviceNotRegistered`.
- ✅ Deep link da notificação: payload `{ "route": "/(tabs)/buscar" }` ou `{ "url": "/turismo/onde-ficar" }`.
- ✅ Handler em foreground (banner + som + badge).

**O que falta (não bloqueia a v1):**
- ⏳ Server Actions que disparam push em eventos do produto (novo alerta da cidade, resposta do admin no painel, aprovação de comércio). Cada feature decide quem notificar.
- ⏳ UI de preferências de notificação por categoria (alertas, eventos, promoções) no `/painel/notificacoes`.
- ⏳ APNs key / FCM credentials no painel EAS (necessário só para produção).

### Como disparar um push em produção

```ts
// apps/web/app/painel/.../actions.ts
import { pushToUsers } from '@/lib/push/expo-push';

await pushToUsers(citizenIds, {
  title: 'Falta d\'água amanhã',
  body: 'Centro e Vila Rica · 14h às 18h.',
  data: { url: '/servicos/alertas' },
});
```


- Tokens só são registrados depois que o usuário tem sessão (`AuthProvider`).
- Provider `PushNotificationsProvider` faz: registro → POST `/api/mobile/push/register` com `Authorization: Bearer <access_token>`.
- Deep link: payload `{ "route": "/(tabs)/buscar" }` ou `{ "url": "/turismo/onde-ficar" }` na notificação.
- Para enviar pra produção use a Expo Push API com o token salvo. Exemplo (server-side):

```ts
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({
    to: token,
    title: 'Alerta da cidade',
    body: 'Falta d\'água no bairro Centro hoje 14h–18h.',
    data: { url: '/servicos/alertas' },
    channelId: 'alerts',
  }),
});
```

## NativeTabs (Liquid Glass iOS 26)

`expo-router/unstable-native-tabs` usa `UITabBarController` no iOS — no iOS 26 a barra
adota o material Liquid Glass automaticamente. Em iOS 17–18 é a `UITabBar` clássica;
no Android usa `BottomNavigationView`. Ícones com `sf="..."` mapeiam pra SF Symbols.

## WebView <-> nativo

`SmartWebView` injeta `window.__CARMO_MOBILE__` antes do carregamento. O app web pode
detectar `window.__CARMO_MOBILE__?.app === 'carmelitano'` pra:
- Esconder header/footer redundantes.
- Disparar ações via `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'navigate', payload: '/(tabs)/perfil' }))`.

Cookies/session: `sharedCookiesEnabled` propaga cookies do Supabase em iOS. Para
sincronizar sessões, o app injeta `localStorage.setItem('sb-access-token', ...)` —
o cliente Supabase do web reusa essa chave automaticamente.

## Decisões de arquitetura

- **Supabase direto, sem REST extra**: o app fala com Supabase via SDK quando precisa
  de auth; chamadas de domínio (home, ofertas) vão por `/api/mobile/*` no web pra
  reusar o filtro `city_id` e RLS centralizada.
- **Sem state global**: contexto só para auth/push. Resto vive em estado local.
- **i18n**: PT-BR hard-coded por enquanto (CLAUDE.md). Futuro: `expo-localization`.
- **Tema**: light only por enquanto (a marca Carmo é light). Tokens em `lib/theme/tokens.ts` espelham o Tailwind v4.

## Próximos passos sugeridos

1. Substituir os PNGs em `assets/` (ícone, splash, notification-icon).
2. Criar projeto EAS (`eas project:init`) e preencher `EAS_PROJECT_ID` no `.env`.
3. Configurar APNs key no painel EAS pra produção iOS.
4. Implementar a flag `window.__CARMO_MOBILE__` no Next pra esconder header/footer dentro do webview.
5. Adicionar OTA updates: `eas update --branch preview --message 'fix x'`.
