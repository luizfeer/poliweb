import { Divider, SectionHeader } from '@/components/carmo';
import type { CurrentCity } from '@/lib/cities';
import type {
  AssistantCtaConfig,
  BannerCarouselConfig,
  BusinessPromoHeroConfig,
  CategoryGridConfig,
  CtaGridConfig,
  CustomHeroBannerConfig,
  EntityListConfig,
  FeaturedPromoGridConfig,
  FeaturesGridConfig,
  HeroCompositeConfig,
  HomeBlock,
  LodgingMapConfig,
  NewsletterCtaConfig,
  PromoStripConfig,
  RawHtmlConfig,
  ServiceListConfig,
  TileStripConfig,
  TourismGatewayConfig,
  WideBannerConfig,
} from '@/lib/home';
import { AssistantCtaBlock } from './blocks/AssistantCtaBlock';
import { BannerCarouselBlock } from './blocks/BannerCarouselBlock';
import { BusinessPromoHeroBlock } from './blocks/BusinessPromoHeroBlock';
import { CategoryGridBlock } from './blocks/CategoryGridBlock';
import { CtaGridBlock } from './blocks/CtaGridBlock';
import { CustomHeroBannerBlock } from './blocks/CustomHeroBannerBlock';
import { EntityListBlock } from './blocks/EntityListBlock';
import { FeaturedPromoGridBlock } from './blocks/FeaturedPromoGridBlock';
import { FeaturesGridBlock } from './blocks/FeaturesGridBlock';
import { HeroCompositeBlock } from './blocks/HeroCompositeBlock';
import { LodgingMapBlock } from './blocks/LodgingMapBlock';
import { NewsletterCtaBlock } from './blocks/NewsletterCtaBlock';
import { PromoStripBlock } from './blocks/PromoStripBlock';
import { RawHtmlBlock } from './blocks/RawHtmlBlock';
import { ServiceListBlock } from './blocks/ServiceListBlock';
import { TileStripBlock } from './blocks/TileStripBlock';
import { TourismGatewayBlock } from './blocks/TourismGatewayBlock';
import { TransparencyPulseBlock } from './blocks/TransparencyPulseBlock';
import { WeatherBlock } from './blocks/WeatherBlock';
import { WideBannerBlock } from './blocks/WideBannerBlock';

type Props = { blocks: HomeBlock[]; city: CurrentCity };

async function renderBlock(block: HomeBlock, city: CurrentCity) {
  switch (block.type) {
    case 'banner_carousel':
      return (
        <BannerCarouselBlock
          banners={block.banners}
          config={block.config as BannerCarouselConfig}
          title={block.title}
        />
      );
    case 'category_grid':
      return <CategoryGridBlock config={block.config as CategoryGridConfig} title={block.title} />;
    case 'entity_list':
      return (
        <EntityListBlock
          config={block.config as EntityListConfig}
          title={block.title}
          cityId={city.id}
        />
      );
    case 'promo_strip':
      return <PromoStripBlock config={block.config as PromoStripConfig} title={block.title} />;
    case 'business_promo_hero':
      return <BusinessPromoHeroBlock config={block.config as BusinessPromoHeroConfig} />;
    case 'features_grid':
      return <FeaturesGridBlock config={block.config as FeaturesGridConfig} title={block.title} />;
    case 'tile_strip':
      return <TileStripBlock config={block.config as TileStripConfig} title={block.title} />;
    case 'service_list':
      return <ServiceListBlock config={block.config as ServiceListConfig} title={block.title} />;
    case 'tourism_gateway':
      return (
        <TourismGatewayBlock
          config={block.config as TourismGatewayConfig}
          cityId={city.id}
          cityName={city.name}
          modules={city.modules}
        />
      );
    case 'lodging_map':
      return (
        <LodgingMapBlock
          config={block.config as LodgingMapConfig}
          cityId={city.id}
          cityName={city.name}
          modules={city.modules}
        />
      );
    case 'assistant_cta':
      return (
        <AssistantCtaBlock
          config={block.config as AssistantCtaConfig}
          title={block.title}
          cityName={city.name}
        />
      );
    case 'transparency_pulse':
      return (
        <TransparencyPulseBlock
          cityId={city.id}
          cityName={city.name}
          modules={city.modules}
          title={block.title}
        />
      );
    case 'cta_grid':
      return <CtaGridBlock config={block.config as CtaGridConfig} title={block.title} />;
    case 'newsletter_cta':
      return (
        <NewsletterCtaBlock
          config={block.config as NewsletterCtaConfig}
          title={block.title}
          citySlug={city.slug}
        />
      );
    case 'weather':
      return <WeatherBlock city={city} />;
    case 'custom_hero_banner':
      return (
        <CustomHeroBannerBlock
          banners={block.banners}
          config={block.config as CustomHeroBannerConfig}
        />
      );
    case 'wide_banner':
      return (
        <WideBannerBlock
          banners={block.banners}
          config={block.config as WideBannerConfig}
          title={block.title}
        />
      );
    case 'featured_promo_grid':
      return (
        <FeaturedPromoGridBlock
          config={block.config as FeaturedPromoGridConfig}
          title={block.title}
        />
      );
    case 'hero_composite':
      return (
        <HeroCompositeBlock
          config={block.config as HeroCompositeConfig}
          cityId={city.id}
          modules={city.modules}
        />
      );
    case 'raw_html':
      return <RawHtmlBlock config={block.config as RawHtmlConfig} title={block.title} />;
    default:
      return null;
  }
}

export async function HomeRenderer({ blocks, city }: Props) {
  const rendered = await Promise.all(blocks.map((block) => renderBlock(block, city)));

  type Group = { kind: 'solo'; block: HomeBlock; node: React.ReactNode } | {
    kind: 'pair';
    leader: HomeBlock;
    follower: HomeBlock;
    leaderNode: React.ReactNode;
    followerNode: React.ReactNode;
    groupTitle: string | null;
  };

  const groups: Group[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]!;
    const node = rendered[i];
    if (!node) continue;
    const next = blocks[i + 1];
    const nextNode = rendered[i + 1];
    if (block.groupWithNext && next && nextNode) {
      groups.push({
        kind: 'pair',
        leader: block,
        follower: next,
        leaderNode: node,
        followerNode: nextNode,
        groupTitle: block.groupTitle,
      });
      i += 1;
    } else {
      groups.push({ kind: 'solo', block, node });
    }
  }

  return (
    <>
      {groups.map((group, index) => {
        const showDivider = index > 0;
        if (group.kind === 'solo') {
          return (
            <div key={group.block.id}>
              {showDivider ? <Divider /> : null}
              {group.node}
            </div>
          );
        }
        return (
          <div key={group.leader.id}>
            {showDivider ? <Divider /> : null}
            {group.groupTitle ? <SectionHeader title={group.groupTitle} /> : null}
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-6 lg:px-8">
              <div className="min-w-0 lg:col-span-2">{group.leaderNode}</div>
              <div className="min-w-0 lg:col-span-1">{group.followerNode}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
