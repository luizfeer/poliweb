/** Contrato alinhado ao Home Builder web (`apps/web/lib/home/types.ts`). */

export type HomeBlockType =
  | 'banner_carousel'
  | 'category_grid'
  | 'entity_list'
  | 'promo_strip'
  | 'business_promo_hero'
  | 'features_grid'
  | 'tile_strip'
  | 'service_list'
  | 'tourism_gateway'
  | 'lodging_map'
  | 'assistant_cta'
  | 'transparency_pulse'
  | 'cta_grid'
  | 'newsletter_cta'
  | 'weather'
  | 'custom_hero_banner'
  | 'wide_banner'
  | 'featured_promo_grid'
  | 'hero_composite'
  | 'raw_html';

export type CategoryTone = 'clay' | 'cerrado' | 'sky' | 'sun' | 'paper-deep';
export type FeaturedPromoTone = 'cerrado' | 'sky' | 'clay' | 'sun';
export type CtaTone = 'cerrado' | 'clay' | 'sky' | 'sun';
export type FeatureTone = 'cerrado' | 'clay' | 'sky' | 'sun' | 'paper-deep';

export type CategoryItem = {
  label: string;
  icon: string;
  href: string;
  tone?: CategoryTone;
};

export type FeatureItem = {
  title: string;
  text: string;
  href: string;
  icon: string;
  tone?: FeatureTone;
};

export type TileItem = {
  title: string;
  subtitle?: string;
  illo?: string;
  href: string;
};

export type ServiceItem = {
  icon: string;
  title: string;
  sub?: string;
  when?: string;
  href: string;
  iconBg?: string;
  iconFg?: string;
};

export type CtaItem = {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  tone?: CtaTone;
};

export type EntityListSource =
  | 'businesses_featured'
  | 'businesses_recent'
  | 'tourism_attractions'
  | 'tourism_lodgings'
  | 'city_promotions';

export type BannerAspectRatio = '16:9' | '4:5' | '1:1' | '3:1' | '9:16' | '5:1';

export type BannerCarouselConfig = { intervalMs?: number; aspectRatio?: BannerAspectRatio };
export type WideBannerConfig = { aspectRatio?: BannerAspectRatio; fullBleed?: boolean };
export type CategoryGridConfig = { items: CategoryItem[] };
export type EntityListConfig = {
  source: EntityListSource;
  limit?: number;
  layout?: 'hscroll' | 'grid';
  categorySlug?: string;
  actionHref?: string;
  actionLabel?: string;
};
export type PromoStripConfig = { limit?: number };
export type BusinessPromoHeroConfig = { href?: string };
export type FeaturesGridConfig = {
  items: FeatureItem[];
  columns?: 2 | 3;
  kicker?: string;
};
export type TileStripConfig = { items: TileItem[] };
export type ServiceListConfig = {
  items: ServiceItem[];
  actionHref?: string;
  actionLabel?: string;
};
export type TourismGatewayConfig = {
  attractionsLimit?: number;
  packagesLimit?: number;
  guidesLimit?: number;
};
export type LodgingMapConfig = { categorySlug?: string; limit?: number };
export type AssistantCtaConfig = { questions: string[]; href?: string };
export type TransparencyPulseConfig = Record<string, never>;
export type CtaGridConfig = { items: CtaItem[]; columns?: 1 | 2 };
export type NewsletterCtaConfig = { source?: string; description?: string };
export type WeatherConfig = Record<string, never>;
export type CustomHeroBannerTemplate = 'merchant' | 'event' | 'tourism' | 'offer';
export type CustomHeroBannerLayout =
  | 'text_left'
  | 'text_center'
  | 'text_right'
  | 'split_left'
  | 'split_right';
export type CustomHeroBannerFont = 'display' | 'sans' | 'serif' | 'mono';
export type CustomHeroBannerAnimation = 'soft' | 'shine' | 'float' | 'none';
export type CustomHeroBannerObjectFit = 'cover' | 'contain';
export type CustomHeroBannerImagePlacement = 'background' | 'left' | 'right';

export type CustomHeroBannerConfig = {
  template?: CustomHeroBannerTemplate;
  layout?: CustomHeroBannerLayout;
  height?: 'compact' | 'standard' | 'tall';
  fullBleed?: boolean;
  imagePlacement?: CustomHeroBannerImagePlacement;
  imageFit?: CustomHeroBannerObjectFit;
  imagePositionX?: number;
  imagePositionY?: number;
  overlayOpacity?: number;
  overlayDirection?: 'left' | 'right' | 'bottom' | 'none';
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
  eyebrow?: string;
  headline?: string;
  subtitle?: string;
  badge?: string;
  ctaLabel?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  footerNote?: string;
  font?: CustomHeroBannerFont;
  headlineSize?: 'sm' | 'md' | 'lg';
  animation?: CustomHeroBannerAnimation;
};

export type FeaturedPromoItem = {
  badge?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** UUID em media_assets — usado só pelo web. Mobile ignora. */
  imageAssetId?: string | null;
  href: string;
  tone?: FeaturedPromoTone;
};

export type FeaturedPromoGridConfig = {
  items: FeaturedPromoItem[];
  columns?: 2 | 3;
};

export type RawHtmlPadding = 'none' | 'tight' | 'comfortable';

export type RawHtmlGalleryItem = {
  assetId: string;
  url: string;
  alt?: string;
};

export type RawHtmlConfig = {
  html: string;
  padding?: RawHtmlPadding;
  gallery?: RawHtmlGalleryItem[];
};

export type HomeBlockConfigByType = {
  banner_carousel: BannerCarouselConfig;
  category_grid: CategoryGridConfig;
  entity_list: EntityListConfig;
  promo_strip: PromoStripConfig;
  business_promo_hero: BusinessPromoHeroConfig;
  features_grid: FeaturesGridConfig;
  tile_strip: TileStripConfig;
  service_list: ServiceListConfig;
  tourism_gateway: TourismGatewayConfig;
  lodging_map: LodgingMapConfig;
  assistant_cta: AssistantCtaConfig;
  transparency_pulse: TransparencyPulseConfig;
  cta_grid: CtaGridConfig;
  newsletter_cta: NewsletterCtaConfig;
  weather: WeatherConfig;
  custom_hero_banner: CustomHeroBannerConfig;
  wide_banner: WideBannerConfig;
  featured_promo_grid: FeaturedPromoGridConfig;
  /** Web-only — mobile ignora. Tipo opaco para manter o contrato. */
  hero_composite: Record<string, unknown>;
  raw_html: RawHtmlConfig;
};

export type HomeBannerLinkType = 'internal' | 'external' | 'none';
export type HomeBannerLinkTarget = '_self' | '_blank';

export type HomeBanner = {
  id: string;
  blockId: string;
  position: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  videoUrl: string | null;
  videoContentType: string | null;
  linkType: HomeBannerLinkType;
  linkUrl: string | null;
  linkTarget: HomeBannerLinkTarget;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

export type HomeBlock = {
  id: string;
  layoutId: string;
  cityId: string;
  type: HomeBlockType;
  position: number;
  enabled: boolean;
  title: string | null;
  config: HomeBlockConfigByType[HomeBlockType];
  banners: HomeBanner[];
  /** Flag de agrupamento usada apenas no web (desktop). Mobile ignora e empilha normalmente. */
  groupWithNext: boolean;
  groupTitle: string | null;
};

export type HomeTopMargin = 'none' | 'sm' | 'md' | 'lg';

export type HomeLayoutConfig = {
  topMargin?: HomeTopMargin;
  headerFade?: boolean;
};

export const DEFAULT_HOME_LAYOUT_CONFIG: HomeLayoutConfig = {
  topMargin: 'none',
  headerFade: false,
};

export type HomeLayout = {
  id: string;
  cityId: string;
  config: HomeLayoutConfig;
  blocks: HomeBlock[];
};
