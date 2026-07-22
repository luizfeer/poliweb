# Home Builder — catálogo de blocos

Blocos da home pública configuráveis por cidade via `/painel/cidade/home`. Cada bloco é uma linha em `home_blocks` com um `type` (enum) e um `config` (jsonb). Esta pasta tem a implementação web (RSC/React).

> **Pra portar pro app React Native:** mantenha o mesmo `type` + `config` schema. Só troque o renderer. As tabelas e Server Actions ficam iguais. O contrato é o `config`, não o JSX.

## Schema comum

```ts
type HomeBlock = {
  id: string;
  layoutId: string;
  cityId: string;
  type: HomeBlockType;     // 'banner_carousel' | 'category_grid' | 'entity_list' | 'promo_strip'
  position: number;        // ordem na home (asc)
  enabled: boolean;        // só renderiza se true
  title: string | null;    // cabeçalho opcional do bloco
  config: HomeBlockConfigByType[type];
  banners: HomeBanner[];   // só para banner_carousel
};
```

Catálogo de tipos disponíveis: [`block-catalog.ts`](../../../../lib/home/block-catalog.ts). Cada entrada traz `label`, `description`, `defaultConfig`.

---

## 1. `banner_carousel`

Carrossel horizontal de slides. Cada slide tem imagem obrigatória + vídeo opcional. Quando há vídeo, ele toca uma vez (mute, inline, autoplay quando visível) e ao terminar/falhar volta pra imagem estática. Suporta link interno (router push), externo (`<a target>`) ou nenhum.

### Config

```ts
type BannerCarouselConfig = {
  intervalMs?: number;                       // (reservado pra autoplay; hoje não rotaciona automaticamente)
  aspectRatio?: '16:9' | '4:5' | '1:1' | '3:1';
};
```

### Filhos (`home_block_banners`)

```ts
type HomeBanner = {
  id: string;
  position: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;               // media_assets.cdn_url do image_asset
  imageAlt: string | null;
  videoUrl: string | null;        // media_assets.cdn_url do video_asset (opcional)
  videoContentType: string | null;
  linkType: 'internal' | 'external' | 'none';
  linkUrl: string | null;
  linkTarget: '_self' | '_blank';
  active: boolean;
  startAt: string | null;         // ISO; banner só aparece após
  endAt: string | null;           // ISO; banner some depois
};
```

### React Native

- Use `<Image source={{ uri: imageUrl }} />` como base sempre presente.
- Sobreponha `<Video source={{ uri: videoUrl }} muted isLooping={false} shouldPlay={isVisible} onPlaybackStatusUpdate={…} />` (expo-av) e faça fade pra Image quando `didJustFinish`.
- IntersectionObserver vira `isVisible` derivado de FlatList `viewabilityConfig`.
- Link interno: `navigation.navigate(routeFromUrl(linkUrl))`. Externo: `Linking.openURL(linkUrl)`.

---

## 2. `category_grid`

Grid horizontal scrollável de ícones circulares (RoundCat na web). Funciona como atalhos pra rotas internas.

### Config

```ts
type CategoryGridConfig = {
  items: Array<{
    label: string;
    icon: string;          // chave do ICON_MAP (ver icon-map.ts) — lucide name
    href: string;
    tone?: 'clay' | 'cerrado' | 'sky' | 'sun' | 'paper-deep';
  }>;
};
```

### React Native

- Map de ícones precisa ser equivalente (use `lucide-react-native` ou `@expo/vector-icons`).
- Tons viram cores do design system (mesma paleta `clay`, `cerrado`, etc).
- Layout: `FlatList horizontal` com cards 76px largura, 70px círculo.

---

## 3. `entity_list`

Listagem dinâmica que puxa dados de um módulo. Renderiza horizontal scroll com cards específicos por fonte.

### Config

```ts
type EntityListConfig = {
  source:
    | 'businesses_featured'      // negócios com plano de destaque
    | 'businesses_recent'        // negócios publicados recentes
    | 'tourism_attractions'      // atrações turísticas
    | 'tourism_lodgings'         // pousadas/hotéis (businesses com category 'pousadas')
    | 'city_promotions';         // cupons ativos
  limit?: number;                // 1..20, default 8
  layout?: 'hscroll' | 'grid';   // grid não implementado ainda
  categorySlug?: string;         // override pra tourism_lodgings (default 'pousadas')
  actionHref?: string;           // CTA "Ver tudo"
  actionLabel?: string;
};
```

### React Native

- A query é a mesma (Supabase JS funciona igual). Renderize cards equivalentes.
- Para cada `source`, mapeie ao componente nativo:
  - `businesses_*` → `BusinessCardNative`
  - `tourism_lodgings` → `PousadaCardNative`
  - `tourism_attractions` → `AttractionCardNative`
  - `city_promotions` → `CupomCardNative`

---

## 4. `promo_strip`

Faixa horizontal de cupons da cidade. Equivalente a `entity_list` com `source: 'city_promotions'`, mas é um tipo separado por ser caso de uso muito comum.

### Config

```ts
type PromoStripConfig = {
  limit?: number; // default 8
};
```

### React Native

- Mesma fonte de dados (`listCityPromotions`). Card de cupom adaptado pro nativo.

---

## 5. `business_promo_hero`

Hero grande convidando comerciantes a se cadastrar (componente `BusinessPromoHero`).

```ts
type BusinessPromoHeroConfig = { href?: string };  // default '/comercio/cadastro'
```

**RN:** card grande com gradiente + CTA. Reimplementar nativo com mesmo copy.

---

## 6. `features_grid`

Grid de 2 ou 3 colunas com cards de feature (ícone, título, texto curto, link). Estilo "Novidades no Portal".

```ts
type FeaturesGridConfig = {
  columns?: 2 | 3;
  kicker?: string;
  items: Array<{ title; text; href; icon; tone?: 'cerrado'|'clay'|'sky'|'sun'|'paper-deep' }>;
};
```

**RN:** `FlatList numColumns={columns}`.

---

## 7. `tile_strip`

HScroll de cards quadrados com título grande + emoji + subtítulo + link. Equivalente ao `TileCard` da web ("Aproveite a cidade").

```ts
type TileStripConfig = { items: Array<{ title; subtitle?; illo?; href }> };
```

**RN:** `FlatList horizontal`. Use emoji nativo (sistema renderiza).

---

## 8. `service_list`

Lista vertical compacta dentro de um Band. Cada item tem ícone à esquerda, título e subtítulo, chevron pra entrar. Usado em "Serviços públicos".

```ts
type ServiceListConfig = {
  items: Array<{
    icon: string;          // lucide name
    title: string;
    sub?: string;
    when?: string;         // alternativa a sub, destaca em clay-600
    href: string;
    iconBg?: 'paper'|'clay-50'|'cerrado-100'|'sky-100'|'sun-100';
    iconFg?: 'ink-900'|'clay-600'|'cerrado-700'|'sky-700';
  }>;
  actionHref?: string;
  actionLabel?: string;
};
```

**RN:** `FlatList vertical`. Equivale a uma `SectionList` simples.

---

## 9. `tourism_gateway`

Widget grande do módulo turismo: atrações, pacotes e guias da cidade. Bloqueia se `tourism` não estiver em `city_modules`.

```ts
type TourismGatewayConfig = {
  attractionsLimit?: number;   // default 3
  packagesLimit?: number;      // default 2
  guidesLimit?: number;        // default 3
};
```

**RN:** widget composto — atrações em `FlatList horizontal`, pacotes em cards verticais. Mesma query.

---

## 10. `lodging_map`

Banner com convite para o mapa de pousadas (preview com 3 cards). Bloqueia se `tourism` não estiver ativo.

```ts
type LodgingMapConfig = { categorySlug?: string; limit?: number };  // default 'pousadas' / 6
```

**RN:** card grande com preview de 3 thumbnails. Tap abre `MapScreen`.

---

## 11. `assistant_cta`

Card que abre o assistente IA com perguntas-exemplo clicáveis.

```ts
type AssistantCtaConfig = { questions: string[]; href?: string };
```

**RN:** card grande + `FlatList horizontal` de pills. Tap em pill navega com `q` param.

---

## 12. `transparency_pulse`

Widget que mostra um snapshot recente de transparência (notícias oficiais, proposições, licitações). Bloqueia se `transparency` não estiver ativo ou se não houver snapshot.

```ts
type TransparencyPulseConfig = Record<string, never>;
```

**RN:** card complexo — reimplementar com mesmo snapshot fetch.

---

## 13. `cta_grid`

Grid de CTAs vazios (`EmptyCta`) em 1 ou 2 colunas. Cada item é ícone + título + descrição + label CTA + link.

```ts
type CtaGridConfig = {
  columns?: 1 | 2;
  items: Array<{ icon; title; description; cta; href; tone?: 'cerrado'|'clay'|'sky'|'sun' }>;
};
```

**RN:** `FlatList numColumns`.

---

## 14. `newsletter_cta`

Card pra cadastrar email no resumo semanal. Já é um componente cliente (`NewsletterCTA`) com Server Action interna.

```ts
type NewsletterCtaConfig = { source?: string; description?: string };  // source default 'home'
```

**RN:** form nativo, mesma Server Action via HTTP.

---

## 15. `weather`

Widget de clima da cidade (atual + previsão). Fetch interno via `getWeatherForHome`.

```ts
type WeatherConfig = Record<string, never>;
```

**RN:** mesma fonte (Open-Meteo). Card com selecionável dos dias.

---

## 16. `raw_html`

Bloco "escape hatch" pra publicar conteúdo urgente sem release. Admin escreve HTML direto no painel; é sanitizado no render web e isolado em WebView no mobile.

### Config

```ts
type RawHtmlConfig = {
  html: string;                                   // HTML bruto editado pelo admin
  padding?: 'none' | 'tight' | 'comfortable';     // espaçamento horizontal (default: 'comfortable')
  gallery?: Array<{                                // imagens uploadeadas pra reusar no HTML
    assetId: string;
    url: string;
    alt?: string;
  }>;
};
```

### Segurança

- **Sempre sanitizado** em `lib/home/sanitize-raw-html.ts` (server-only) antes de renderizar
- Tags permitidas: `p, h1–h6, a, img, strong/em, ul/ol/li, blockquote, hr, code, figure, span, div`
- Bloqueado: `script, style, iframe, object, embed, form, input`, handlers `on*`, `javascript:` URLs
- Links externos ganham `target="_blank" rel="noopener noreferrer"` automaticamente
- Imagens ganham `loading="lazy"`

### Galeria

Imagens uploadeadas via `DirectMediaUpload` com `entityType='home_block'`, `role='gallery'`. URLs ficam disponíveis no editor pro admin colar como `<img>` no HTML. A action `updateHomeBlockAction` reconcilia `media_links` automaticamente.

### React Native

- Renderizado em `react-native-webview` (já dep do app), com altura calculada via `postMessage` (bridge JS injetado)
- Cliques em `<a>` são interceptados — links `/...` viram navegação interna via `openPortalUrl`; URLs http(s) abrem no browser
- O WebView roda em origin isolado — scripts dentro do HTML não tocam o app nativo

---

## Adicionar um novo tipo de bloco

1. Adicionar o valor no enum SQL `home_block_type` (nova migration `alter type home_block_type add value '...'`).
2. Adicionar o tipo TS em [`lib/home/types.ts`](../../../../lib/home/types.ts) (`HomeBlockType` + `HomeBlockConfigByType` + interface do config).
3. Adicionar entrada em [`lib/home/block-catalog.ts`](../../../../lib/home/block-catalog.ts) com `label`, `description`, `defaultConfig`.
4. Criar o componente em `components/public/home/blocks/MeuBlocoBlock.tsx`.
5. Adicionar o `case` em [`HomeRenderer.tsx`](../HomeRenderer.tsx).
6. Atualizar este README com schema + dica de port pra RN.

## Permissões

- **Leitura pública** (`home_layouts`, `home_blocks`, `home_block_banners`): qualquer um.
- **Escrita**: `city_admin` ou `super_admin` da cidade. RLS faz a checagem via `public.is_city_admin(city_id)`.
- **Upload de mídia** dos banners: usa `entityType='home_block'`, `entityId=block.id`, `role='ad'`. A política `media_links_insert` cobre via `is_city_admin(city_id)`.

## Render: fallback

Em `app/page.tsx`, se a cidade não tem nenhum bloco em `home_blocks`, mostramos o layout hardcoded antigo. Assim que o city_admin cria o primeiro bloco, a home passa a ser o layout customizado.
