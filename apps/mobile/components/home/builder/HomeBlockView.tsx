import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';

import { AssistantPrompt } from '@/components/home/AssistantPrompt';
import { AttractionCard } from '@/components/home/AttractionCard';
import { BusinessCard } from '@/components/home/BusinessCard';
import { BusinessPromoHero } from '@/components/home/BusinessPromoHero';
import { CommunityGrid } from '@/components/home/CommunityGrid';
import { FeaturedPromoCard } from '@/components/home/FeaturedPromoCard';
import { HScroll } from '@/components/home/HScroll';
import { LatestFeaturesGrid } from '@/components/home/LatestFeaturesGrid';
import { ListItem } from '@/components/home/ListItem';
import { LodgingMapPreview } from '@/components/home/LodgingMapPreview';
import { NewsletterCard } from '@/components/home/NewsletterCard';
import { PromoCard } from '@/components/home/PromoCard';
import { RoundCat } from '@/components/home/RoundCat';
import { SectionHeader } from '@/components/home/SectionHeader';
import { TileGrid } from '@/components/home/TileGrid';
import { TourismGateway } from '@/components/home/TourismGateway';
import { WeatherCard } from '@/components/home/WeatherCard';
import { BannerCarousel } from './BannerCarousel';
import { CustomHeroBanner } from './CustomHeroBanner';
import { RawHtmlBlock } from './RawHtmlBlock';
import { TransparencyPulseCard } from './TransparencyPulseCard';
import type { HomeBlockDataBag } from '@/lib/home/block-data';
import type { HomeCity } from '@/lib/home/fetch-home-screen';
import {
  categoryToneToMobile,
  ctaToneToMobile,
  featureToneToMobile,
  lucideToIonicon,
  serviceListIconColors,
  serviceListIonicon,
} from '@/lib/home/icon-map';
import { portalHrefToMobile } from '@/lib/home/portal-href';
import type {
  AssistantCtaConfig,
  BannerCarouselConfig,
  BusinessPromoHeroConfig,
  CategoryGridConfig,
  CtaGridConfig,
  CustomHeroBannerConfig,
  EntityListConfig,
  FeaturedPromoGridConfig,
  FeaturedPromoTone,
  FeaturesGridConfig,
  HomeBlock,
  LodgingMapConfig,
  NewsletterCtaConfig,
  PromoStripConfig,
  RawHtmlConfig,
  ServiceListConfig,
  TileStripConfig,
  TourismGatewayConfig,
  WideBannerConfig,
} from '@/lib/home/types';
import { openPortalUrl } from '@/lib/navigation/open-portal-url';
import { palette, radius } from '@/lib/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;

type Props = {
  block: HomeBlock;
  city: HomeCity;
  data: HomeBlockDataBag;
  greeting?: string;
};

function sectionAction(config: { actionHref?: string; actionLabel?: string }) {
  if (!config.actionHref) return undefined;
  return {
    label: config.actionLabel ?? 'Ver tudo',
    href: portalHrefToMobile(config.actionHref),
  };
}

export function HomeBlockView({ block, city, data, greeting }: Props) {
  switch (block.type) {
    case 'banner_carousel':
      return (
        <BannerCarousel
          banners={block.banners}
          aspectRatio={(block.config as BannerCarouselConfig).aspectRatio}
          title={block.title}
        />
      );

    case 'wide_banner': {
      const banner = block.banners[0];
      if (!banner) return null;
      const cfg = block.config as WideBannerConfig;
      const ratio =
        cfg.aspectRatio === '3:1' ? 3 : cfg.aspectRatio === '16:9' ? 16 / 9 : 5;
      const height = (cfg.fullBleed ? SCREEN_W : SCREEN_W - 32) / ratio;
      return (
        <View style={{ paddingHorizontal: cfg.fullBleed ? 0 : 16, marginTop: 8 }}>
          <Pressable
            onPress={() => {
              if (banner.linkUrl && banner.linkType !== 'none') {
                if (banner.linkType === 'external') openPortalUrl(banner.linkUrl);
                else router.push(portalHrefToMobile(banner.linkUrl) as never);
              }
            }}
          >
            <Image
              source={{ uri: banner.imageUrl }}
              style={{ width: '100%', height, borderRadius: cfg.fullBleed ? 0 : radius.lg }}
              contentFit="cover"
            />
          </Pressable>
        </View>
      );
    }

    case 'custom_hero_banner': {
      const banner = block.banners[0];
      if (!banner) return null;
      return <CustomHeroBanner banner={banner} config={block.config as CustomHeroBannerConfig} />;
    }

    case 'business_promo_hero': {
      const cfg = block.config as BusinessPromoHeroConfig;
      return (
        <BusinessPromoHero
          greeting={greeting ?? `Portal de ${city.name}`}
          href={cfg.href ? portalHrefToMobile(cfg.href) : undefined}
        />
      );
    }

    case 'category_grid': {
      const cfg = block.config as CategoryGridConfig;
      const items = cfg.items ?? [];
      if (items.length === 0) return null;
      return (
        <>
          {block.title ? <SectionHeader title={block.title} /> : null}
          <HScroll>
            {items.map((item, index) => (
              <RoundCat
                key={`${item.label}-${index}`}
                label={item.label}
                icon={lucideToIonicon(item.icon)}
                tone={categoryToneToMobile(item.tone)}
                href={portalHrefToMobile(item.href)}
              />
            ))}
          </HScroll>
        </>
      );
    }

    case 'features_grid': {
      const cfg = block.config as FeaturesGridConfig;
      const items = (cfg.items ?? []).map((item) => ({
        title: item.title,
        text: item.text,
        href: portalHrefToMobile(item.href),
        icon: lucideToIonicon(item.icon),
        tone: featureToneToMobile(item.tone),
      }));
      if (items.length === 0) return null;
      return (
        <>
          {block.title ? (
            <SectionHeader title={block.title} kicker={cfg.kicker} />
          ) : null}
          <LatestFeaturesGrid items={items} />
        </>
      );
    }

    case 'entity_list':
      return <EntityListBlockView block={block} city={city} data={data} />;

    case 'promo_strip': {
      const cfg = block.config as PromoStripConfig;
      const limit = Math.min(cfg.limit ?? 8, data.promotions.length);
      const items = data.promotions.slice(0, limit);
      if (items.length === 0) return null;
      return (
        <>
          {block.title ? (
            <SectionHeader
              title={block.title}
              actionLabel="Ver tudo"
              actionHref={portalHrefToMobile('/comercio?promo=1')}
            />
          ) : null}
          <HScroll>
            {items.map((p) => (
              <PromoCard
                key={p.id}
                title={p.title}
                brand={p.businessName}
                businessSlug={p.businessSlug}
                discountPercent={p.discountPercent}
              />
            ))}
          </HScroll>
        </>
      );
    }

    case 'tourism_gateway': {
      if (!city.modules.includes('tourism')) return null;
      const cfg = block.config as TourismGatewayConfig;
      const limit = cfg.attractionsLimit ?? 3;
      return (
        <>
          {block.title ? (
            <SectionHeader title={block.title} kicker="Turismo" />
          ) : (
            <SectionHeader title="Turismo na região" kicker="Furnas · Canastra" />
          )}
          <TourismGateway
            cityName={city.name}
            attractionsCount={Math.min(data.attractions.length, limit)}
          />
          {data.attractions.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <HScroll>
                {data.attractions.slice(0, limit).map((a) => (
                  <AttractionCard
                    key={a.id}
                    slug={a.slug}
                    name={a.name}
                    coverUrl={a.coverUrl}
                    shortDescription={a.shortDescription}
                    kind={a.kind}
                    cityName={city.name}
                    rating={a.rating}
                    reviewsCount={a.reviewsCount}
                    featured={a.featured}
                  />
                ))}
              </HScroll>
            </View>
          ) : null}
        </>
      );
    }

    case 'lodging_map': {
      if (!city.modules.includes('tourism')) return null;
      const cfg = block.config as LodgingMapConfig;
      const limit = cfg.limit ?? 6;
      const lodgings = data.lodgings.slice(0, limit);
      if (lodgings.length === 0) return null;
      return (
        <>
          <SectionHeader
            title={block.title ?? 'Onde ficar'}
            kicker="Pousadas"
            actionLabel={cfg.categorySlug ? 'Ver mapa' : undefined}
            actionHref={
              cfg.categorySlug
                ? portalHrefToMobile('/turismo/onde-ficar')
                : undefined
            }
          />
          <LodgingMapPreview cityName={city.name} lodgings={lodgings} />
          <View style={{ marginTop: 8 }}>
            <HScroll>
              {lodgings.map((b) => (
                <BusinessCard
                  key={b.id}
                  slug={b.slug}
                  name={b.name}
                  category="Pousada"
                  district={b.district}
                  rating={b.rating}
                  reviewsCount={b.reviewsCount}
                  coverUrl={b.coverUrl}
                />
              ))}
            </HScroll>
          </View>
        </>
      );
    }

    case 'assistant_cta': {
      const cfg = block.config as AssistantCtaConfig;
      return (
        <>
          {block.title ? (
            <SectionHeader
              title={block.title}
              kicker="Busca com IA"
              actionLabel="Abrir"
              actionHref={portalHrefToMobile(cfg.href ?? '/assistente')}
            />
          ) : null}
          <AssistantPrompt questions={cfg.questions} />
        </>
      );
    }

    case 'transparency_pulse': {
      if (!city.modules.includes('transparency') || !data.transparency) return null;
      return (
        <>
          {block.title ? (
            <SectionHeader
              title={block.title}
              kicker="Transparência"
              actionLabel="Abrir"
              actionHref={portalHrefToMobile('/transparencia')}
            />
          ) : null}
          <TransparencyPulseCard cityName={city.name} snapshot={data.transparency} />
        </>
      );
    }

    case 'tile_strip': {
      const cfg = block.config as TileStripConfig;
      const tiles = (cfg.items ?? []).map((item) => ({
        title: item.title,
        subtitle: item.subtitle ?? '',
        href: portalHrefToMobile(item.href),
        illo: item.illo,
        icon: lucideToIonicon('Tag'),
        tone: 'paper' as const,
      }));
      if (tiles.length === 0) return null;
      return (
        <>
          {block.title ? <SectionHeader title={block.title} /> : null}
          <TileGrid tiles={tiles} />
        </>
      );
    }

    case 'service_list': {
      const cfg = block.config as ServiceListConfig;
      const action = sectionAction(cfg);
      const items = (cfg.items ?? []).map((item) => {
        let sub = item.sub ?? item.when;
        if (item.title.toLowerCase().includes('farmácia') && data.dutyPharmacyName) {
          sub = data.dutyPharmacyName;
        }
        if (item.title.toLowerCase().includes('alerta') && data.alertTitle) {
          sub = data.alertArea ?? data.alertTitle;
        }
        return {
          icon: serviceListIonicon(item.icon, item.title),
          iconColors: serviceListIconColors(item.iconBg, item.iconFg),
          title: item.title,
          sub,
          href: portalHrefToMobile(item.href),
        };
      });
      if (items.length === 0) return null;
      return (
        <>
          {block.title ? (
            <SectionHeader
              title={block.title}
              actionLabel={action?.label}
              actionHref={action?.href}
            />
          ) : null}
          <View style={styles.list}>
            {items.map((item, idx) => (
              <ListItem
                key={`${item.href}-${idx}`}
                icon={item.icon}
                iconColors={item.iconColors}
                title={item.title}
                sub={item.sub}
                href={item.href}
                divider={idx < items.length - 1}
              />
            ))}
          </View>
        </>
      );
    }

    case 'cta_grid': {
      const cfg = block.config as CtaGridConfig;
      const items = (cfg.items ?? []).map((item) => ({
        title: item.title,
        description: item.description,
        icon: lucideToIonicon(item.icon),
        href: portalHrefToMobile(item.href),
        tone: ctaToneToMobile(item.tone),
      }));
      if (items.length === 0) return null;
      return (
        <>
          {block.title ? (
            <SectionHeader
              title={block.title}
              kicker="Comunidade"
              actionLabel="Abrir"
              actionHref={portalHrefToMobile('/comunidade')}
            />
          ) : null}
          <CommunityGrid items={items} />
        </>
      );
    }

    case 'newsletter_cta': {
      const cfg = block.config as NewsletterCtaConfig;
      return (
        <>
          {block.title ? <SectionHeader title={block.title} kicker="Newsletter" /> : null}
          <NewsletterCard citySlug={city.slug} description={cfg.description} />
        </>
      );
    }

    case 'featured_promo_grid': {
      const cfg = block.config as FeaturedPromoGridConfig;
      const items = cfg.items ?? [];
      if (items.length === 0) return null;
      const cycle: FeaturedPromoTone[] = ['cerrado', 'sky', 'clay', 'sun'];
      return (
        <>
          {block.title ? <SectionHeader title={block.title} /> : null}
          <HScroll>
            {items.map((item, idx) => (
              <FeaturedPromoCard
                key={`${item.href}-${idx}`}
                badge={item.badge}
                title={item.title}
                subtitle={item.subtitle}
                imageUrl={item.imageUrl}
                href={portalHrefToMobile(item.href)}
                tone={item.tone ?? cycle[idx % cycle.length]!}
              />
            ))}
          </HScroll>
        </>
      );
    }

    case 'hero_composite':
      // Bloco web-only — mobile não renderiza.
      return null;

    case 'raw_html':
      return <RawHtmlBlock config={block.config as RawHtmlConfig} title={block.title} />;

    case 'weather':
      if (!data.weather) return null;
      return (
        <View style={{ marginTop: 8 }}>
          <WeatherCard cityName={city.name} weather={data.weather} />
        </View>
      );

    default:
      return null;
  }
}

function EntityListBlockView({
  block,
  city,
  data,
}: {
  block: HomeBlock;
  city: HomeCity;
  data: HomeBlockDataBag;
}) {
  const cfg = block.config as EntityListConfig;
  const limit = Math.max(1, Math.min(cfg.limit ?? 8, 20));
  const action = sectionAction(cfg);

  let content: ReactNode = null;

  switch (cfg.source) {
    case 'businesses_featured': {
      const items = data.featuredBusinesses.slice(0, limit);
      if (items.length === 0) return null;
      content = (
        <HScroll>
          {items.map((b) => (
            <BusinessCard
              key={b.id}
              slug={b.slug}
              name={b.name}
              category={b.category}
              district={b.district}
              rating={b.rating}
              reviewsCount={b.reviewsCount}
              coverUrl={b.coverUrl}
            />
          ))}
        </HScroll>
      );
      break;
    }
    case 'businesses_recent': {
      const items = data.recentBusinesses.slice(0, limit);
      if (items.length === 0) return null;
      content = (
        <HScroll>
          {items.map((b) => (
            <BusinessCard
              key={b.id}
              slug={b.slug}
              name={b.name}
              category={b.category}
              district={b.district}
              rating={b.rating}
              reviewsCount={b.reviewsCount}
              coverUrl={b.coverUrl}
            />
          ))}
        </HScroll>
      );
      break;
    }
    case 'tourism_lodgings': {
      const items = data.lodgings.slice(0, limit);
      if (items.length === 0) return null;
      content = (
        <HScroll>
          {items.map((b) => (
            <BusinessCard
              key={b.id}
              slug={b.slug}
              name={b.name}
              category="Pousada"
              district={b.district}
              rating={b.rating}
              reviewsCount={b.reviewsCount}
              coverUrl={b.coverUrl}
            />
          ))}
        </HScroll>
      );
      break;
    }
    case 'tourism_attractions': {
      const items = data.attractions.slice(0, limit);
      if (items.length === 0) return null;
      content = (
        <HScroll>
          {items.map((a) => (
            <AttractionCard
              key={a.id}
              slug={a.slug}
              name={a.name}
              coverUrl={a.coverUrl}
              shortDescription={a.shortDescription}
              kind={a.kind}
              cityName={city.name}
              rating={a.rating}
              reviewsCount={a.reviewsCount}
              featured={a.featured}
            />
          ))}
        </HScroll>
      );
      break;
    }
    case 'city_promotions': {
      const items = data.promotions.slice(0, limit);
      if (items.length === 0) return null;
      content = (
        <HScroll>
          {items.map((p) => (
            <PromoCard
              key={p.id}
              title={p.title}
              brand={p.businessName}
              businessSlug={p.businessSlug}
              discountPercent={p.discountPercent}
            />
          ))}
        </HScroll>
      );
      break;
    }
    default:
      return null;
  }

  return (
    <>
      {block.title ? (
        <SectionHeader
          title={block.title}
          actionLabel={action?.label}
          actionHref={action?.href}
        />
      ) : null}
      {content}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    marginHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    overflow: 'hidden',
  },
});
