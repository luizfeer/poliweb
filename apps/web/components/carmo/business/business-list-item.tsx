import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import type { Business } from '@/lib/businesses/types';
import {
  businessPublicMetricsIncludeGoogle,
  GOOGLE_PUBLIC_METRICS_TOOLTIP,
} from '@/lib/businesses';
import { CATEGORY_BY_SLUG } from '@/lib/businesses/categories';
import { BusinessCategoryIcon } from '@/lib/businesses/icon-map';
import { cn } from '@/lib/utils';
import { ContactBar } from './contact-bar';

type BusinessListItemProps = {
  business: Business;
  /** Esconde a categoria (útil quando lista já é por categoria). */
  hideCategory?: boolean;
  className?: string;
};

/**
 * Linha compacta do guia comercial.
 * - Ícone da categoria primária à esquerda
 * - Nome + categoria + endereço/distrito + rating
 * - CTAs de WhatsApp e ligar inline (mobile-friendly)
 */
export function BusinessListItem({ business, hideCategory, className }: BusinessListItemProps) {
  const primaryCat = CATEGORY_BY_SLUG[business.categories[0]];
  const googleTip = businessPublicMetricsIncludeGoogle(business) ? GOOGLE_PUBLIC_METRICS_TOOLTIP : undefined;

  return (
    <article
      className={cn(
        'flex items-start gap-3 px-3.5 py-3 bg-white border-b border-ink-100',
        className,
      )}
    >
      <div className="w-10 h-10 rounded-md bg-clay-50 text-clay-600 flex items-center justify-center shrink-0">
        <BusinessCategoryIcon name={primaryCat?.icon} size={20} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/comercio/negocio/${business.slug}`}
          className="block hover:text-clay-600 transition-colors"
        >
          <div className="flex items-center gap-1">
            <h3 className="text-[14px] font-semibold text-ink-900 leading-tight truncate m-0">
              {business.name}
            </h3>
            {business.verified && (
              <BadgeCheck size={14} className="text-sky-700 shrink-0" strokeWidth={2.4} />
            )}
          </div>
          {!hideCategory && primaryCat && (
            <div className="text-[11px] text-clay-600 font-medium mt-0.5">{primaryCat.name}</div>
          )}
          {business.shortDescription && (
            <p className="text-[12px] text-ink-700 leading-snug mt-0.5 line-clamp-2 m-0">
              {business.shortDescription}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-600">
            {business.district && (
              <span className="flex items-center gap-0.5">
                <MapPin size={11} strokeWidth={2.2} />
                {business.district}
              </span>
            )}
            {business.rating !== undefined && (
              <span
                className={cn('flex items-center gap-0.5', googleTip && 'cursor-help')}
                title={googleTip}
              >
                <Star size={11} className="fill-sun-500 text-sun-500" strokeWidth={3} />
                {business.rating.toFixed(1)}
                {business.reviewsCount ? (
                  <span className="text-ink-400">({business.reviewsCount})</span>
                ) : null}
              </span>
            )}
          </div>
        </Link>
      </div>

      <ContactBar
        variant="compact"
        phone={business.phone}
        whatsapp={business.whatsapp}
        className="self-center"
        businessId={business.id}
        cityId={business.cityId}
        businessSlug={business.slug}
      />
    </article>
  );
}
