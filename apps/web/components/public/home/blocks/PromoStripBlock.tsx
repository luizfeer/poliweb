import { Link } from '@/components/navigation/link';
import { CupomCard, HScroll, SectionHeader } from '@/components/carmo';
import type { PromoStripConfig } from '@/lib/home';
import { listCityPromotions, type CityPromotion } from '@/lib/businesses';

const PROMO_ILLO_FALLBACKS = ['🛍️', '🎁', '🏷️', '✨', '💸', '⭐'];

function illoFor(promo: CityPromotion): string {
  const fallback = PROMO_ILLO_FALLBACKS[promo.id.charCodeAt(0) % PROMO_ILLO_FALLBACKS.length];
  return fallback ?? '🏷️';
}

type Props = {
  config: PromoStripConfig;
  title: string | null;
};

export async function PromoStripBlock({ config, title }: Props) {
  const limit = Math.max(1, Math.min(config.limit ?? 8, 20));
  const promotions = await listCityPromotions(limit);
  if (promotions.length === 0) return null;

  return (
    <>
      {title ? <SectionHeader title={title} /> : null}
      <HScroll>
        {promotions.map((promo) => (
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
              illo={illoFor(promo)}
            />
          </Link>
        ))}
      </HScroll>
    </>
  );
}
