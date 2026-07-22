import { Link } from '@/components/navigation/link';
import { Band, CupomCard, HScroll, PousadaCard, SectionHeader } from '@/components/carmo';
import { BusinessCard } from '@/components/carmo/business';
import type { EntityListConfig } from '@/lib/home';
import {
  listActiveFeaturedBusinesses,
  listBusinesses,
  listByCategory,
  listCityPromotions,
  type Business,
  type CityPromotion,
} from '@/lib/businesses';
import { listAttractions } from '@/lib/tourism';

type Props = {
  config: EntityListConfig;
  title: string | null;
  cityId: string;
};

function actionFor(config: EntityListConfig) {
  if (!config.actionHref) return undefined;
  return { label: config.actionLabel ?? 'Ver tudo', href: config.actionHref };
}

function lodgingDistanceLabel(b: Business): string | undefined {
  if (b.district && b.address) return `${b.district} · ${b.address.split(',')[0]}`;
  return b.district ?? b.address ?? undefined;
}

const PROMO_ILLO_FALLBACKS = ['🛍️', '🎁', '🏷️', '✨', '💸', '⭐'];

function promotionIlloFor(promo: CityPromotion): string {
  const fallback = PROMO_ILLO_FALLBACKS[promo.id.charCodeAt(0) % PROMO_ILLO_FALLBACKS.length];
  return fallback ?? '🏷️';
}

export async function EntityListBlock({ config, title, cityId }: Props) {
  const limit = Math.max(1, Math.min(config.limit ?? 8, 20));

  if (config.source === 'businesses_featured') {
    const items = await listActiveFeaturedBusinesses({ city_id: cityId, limit });
    if (items.length === 0) return null;
    return (
      <>
        {title ? <SectionHeader title={title} action={actionFor(config)} /> : null}
        <HScroll>
          {items.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </HScroll>
      </>
    );
  }

  if (config.source === 'businesses_recent') {
    const items = await listBusinesses({ city_id: cityId, sort: 'recent', limit });
    if (items.length === 0) return null;
    return (
      <>
        {title ? <SectionHeader title={title} action={actionFor(config)} /> : null}
        <HScroll>
          {items.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </HScroll>
      </>
    );
  }

  if (config.source === 'tourism_lodgings') {
    const items = await listByCategory(config.categorySlug ?? 'pousadas', {
      city_id: cityId,
      sort: 'rating',
      limit,
    });
    if (items.length === 0) return null;
    return (
      <>
        {title ? <SectionHeader title={title} action={actionFor(config)} /> : null}
        <HScroll>
          {items.map((lodging) => (
            <PousadaCard
              key={lodging.id}
              name={lodging.name}
              dist={lodgingDistanceLabel(lodging)}
              rating={lodging.rating}
              tags={(lodging.amenities ?? []).slice(0, 2)}
              photo={lodging.coverUrl}
              illo={lodging.coverUrl ? undefined : '🏞️'}
              href={`/comercio/negocio/${lodging.slug}`}
            />
          ))}
        </HScroll>
      </>
    );
  }

  if (config.source === 'tourism_attractions') {
    const items = await listAttractions({ city_id: cityId, limit });
    if (items.length === 0) return null;
    return (
      <>
        {title ? <SectionHeader title={title} action={actionFor(config)} /> : null}
        <HScroll>
          {items.map((attraction) => (
            <Link
              key={attraction.id}
              href={`/turismo/atracoes/${attraction.slug}`}
              className="block w-[220px] shrink-0 overflow-hidden rounded-xs border border-ink-100 bg-white hover:no-underline"
            >
              <div className="h-[130px] overflow-hidden bg-gradient-to-br from-cerrado-300 to-cerrado-700">
                {attraction.coverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={attraction.coverUrl}
                    alt={attraction.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="px-3 py-2.5">
                <div className="text-ink-900 text-[14px] font-bold leading-tight">
                  {attraction.name}
                </div>
                {attraction.description ? (
                  <div className="text-ink-600 mt-1 line-clamp-2 text-[12px] leading-snug">
                    {attraction.description}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </HScroll>
      </>
    );
  }

  if (config.source === 'city_promotions') {
    const items = await listCityPromotions(limit);
    if (items.length === 0) return null;
    return (
      <>
        {title ? <SectionHeader title={title} action={actionFor(config)} /> : null}
        <HScroll>
          {items.map((promo) => (
            <Link
              key={promo.id}
              href={`/comercio/negocio/${promo.businessSlug}`}
              className="hover:no-underline"
            >
              <CupomCard
                brand={promo.businessName}
                off={
                  promo.discountPercent !== null && promo.discountPercent > 0
                    ? `${promo.discountPercent}%`
                    : promo.title
                }
                illo={promotionIlloFor(promo)}
              />
            </Link>
          ))}
        </HScroll>
      </>
    );
  }

  return (
    <Band className="px-3.5 pb-3 text-ink-600 text-[13px]">
      Fonte de dados nao reconhecida: {String(config.source)}
    </Band>
  );
}
