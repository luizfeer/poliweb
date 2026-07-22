---
name: web-mobile-parity
description: Use SEMPRE que criar ou alterar uma feature pública de leitura no web (apps/web — comércio, turismo, pousadas, cardápio, home, posts/novidades) para garantir o par nativo no app (apps/mobile). Dispara em mudanças de páginas públicas, queries de domínio (lib/businesses, lib/posts), tipos compartilhados, ou quando o usuário pede "fazer no app também"/"versão nativa"/"paridade".
---

# Paridade web ↔ mobile (Carmo Local)

O portal vive em dois apps: **`apps/web`** (Next.js, fonte de verdade do produto) e
**`apps/mobile`** (Expo/React Native). Toda feature **pública de leitura** que existe no web
precisa existir no app — senão o mobile fica "travado" caindo em WebView lento.

## Regra de ouro

> Mexeu numa página pública de leitura no web? Tem que ter par nativo no mobile.

Áreas cobertas: **comércio** (`/comercio/...`), **turismo/pousadas**, **cardápio**,
**home** e **novidades (posts)**. Quando alterar essas áreas no web, abra a tela/`lib`
correspondente no mobile e replique.

## Linha nativo vs WebView (decisão padrão)

- **Leitura → nativo.** Listagens, detalhes, cardápio, fotos, avaliações (exibição), mapa.
- **Escrita / admin / auth-sensível → WebView.** Avaliar, reivindicar, reportar erro, editar
  do dono, painel `/painel/...`. Abre via `router.push('/webview/...')` (bridge de sessão já
  existente em `components/webview/SmartWebView.tsx`).
- Exceção comum: **checkout do cardápio = WhatsApp** (`Linking.openURL('https://wa.me/...')`),
  não persiste pedido — espelha o v1 do web.

## Como o mobile lê dados

- **Supabase direto pelo anon client** (`apps/mobile/lib/supabase.ts`). RLS já filtra
  publicados/cidade — não duplicar checagem de autorização.
- **Espelhe o `select` e os mappers puros do web.** Ex.: `business-detail.ts` copia
  `BUSINESS_PUBLIC_SELECT`, `toBusiness`, `mergePlatformAndGoogleRatings`,
  `asGoogleImportSource` de `apps/web/lib/businesses/queries.ts`. Se o web mudar o select ou a
  fórmula de rating, atualizar o porte no mobile no mesmo PR.
- **Tipos portados** ficam em `apps/mobile/lib/businesses/types.ts` /
  `catalog-types.ts` — mantenha o shape igual ao web (`apps/web/lib/businesses/types.ts`).
- **Cache sempre via `cachedJson`** (`apps/mobile/lib/api/cached-json.ts`): SWR persistente em
  AsyncStorage = "carrega rápido + sync em background". TTL ~5 min pra detalhe. Aqueça com um
  `prefetch...()` no `onPressIn` dos cards. **Não** crie camada de cache nova (sem Realtime/cron).

## Mapa de paridade (web → mobile)

| Web | Mobile |
| --- | --- |
| `app/comercio/negocio/[slug]/page.tsx` | `app/(tabs)/index/comercio/[slug].tsx` + `components/businesses/BusinessDetailScreen.tsx` |
| `app/comercio/negocio/[slug]/cardapio/page.tsx` | `app/(tabs)/index/comercio/[slug]/cardapio.tsx` + `components/businesses/catalog/CatalogScreen.tsx` |
| `lib/businesses/queries.ts` (`getBusinessBySlug`, promotions, reviews) | `lib/api/business-detail.ts` |
| `lib/businesses/menu-queries.ts` | `lib/api/business-menu.ts` |
| `lib/posts/queries.ts` (`listRecentEntityPosts`) | leitura de `entity_posts` em `business-detail.ts` |
| `components/carmo/business/info-blocks.tsx` (labels) | `lib/businesses/labels.ts` |
| listagens `/comercio`, `/comercio/pousadas` | `components/explore/ExploreMapScreen.tsx` |

## Roteamento

- Navegação interna de negócio/pousada usa a rota nativa: `router.push('/comercio/{slug}')`.
- **Tabela central de paridade de rotas: `apps/mobile/lib/navigation/smart-route.ts`**
  (`NATIVE_ROUTES`). Ao criar uma tela nativa que substitui uma página web, adicione a regra
  (ex.: `/comercio/negocio/{slug}` → `/comercio/{slug}`). Quem usa `smartNavigate`/busca passa a
  abrir nativo automaticamente.
- Mantenha o `decodePath` em `app/(tabs)/index/webview/[path].tsx` com o handler antigo como
  **fallback** (deep links e push notifications antigos não podem quebrar).

## Checklist ao criar/alterar feature pública no web

1. [ ] Tipos sincronizados entre `apps/web/lib/...` e `apps/mobile/lib/...`?
2. [ ] `select` e mappers do mobile batem com o web (rating, categorias, mídia)?
3. [ ] Tela nativa cobre as seções de leitura? Escrita roteada pro WebView?
4. [ ] Cache via `cachedJson` com key definida + `prefetch` no `onPressIn`?
5. [ ] Regra adicionada em `smart-route.ts` + fallback preservado no `decodePath`?
6. [ ] `pnpm --filter mobile typecheck` (ou `cd apps/mobile && npx tsc --noEmit`) limpo?
7. [ ] Strings PT-BR, código em inglês, componentes nomeados, tokens de `lib/theme/tokens.ts`?
8. [ ] Davia atualizada quando a feature é nova (skill `davia-documentation`)?
