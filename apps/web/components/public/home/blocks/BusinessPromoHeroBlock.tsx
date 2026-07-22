import { BusinessPromoHero } from '@/components/marketing/business-promo-hero';
import type { BusinessPromoHeroConfig } from '@/lib/home';

type Props = { config: BusinessPromoHeroConfig };

export function BusinessPromoHeroBlock({ config }: Props) {
  return <BusinessPromoHero href={config.href ?? '/comercio/cadastro'} />;
}
