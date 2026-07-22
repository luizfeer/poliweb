import Image from 'next/image';
import Link from 'next/link';
import { Award, BadgeCheck, Heart, MapPin, Star } from 'lucide-react';
import type { Business } from '@/lib/businesses/types';
import {
  businessPublicMetricsIncludeGoogle,
  GOOGLE_PUBLIC_METRICS_TOOLTIP,
} from '@/lib/businesses';
import { CATEGORY_BY_SLUG } from '@/lib/businesses/categories';
import { BusinessCategoryIcon } from '@/lib/businesses/icon-map';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';
import { cn } from '@/lib/utils';

function resolveCoverImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (isVideoSrc(src)) return videoPosterUrl(src);
  return src;
}

type BusinessCardProps = {
  business: Business;
  width?: number;
  className?: string;
};

/** Nota / contagem já agregadas em `queries.toBusiness` (portal + Google). */
function getDisplayRating(business: Business): number | undefined {
  return typeof business.rating === 'number' && Number.isFinite(business.rating) ? business.rating : undefined;
}

function getDisplayRatingCount(business: Business): number | undefined {
  const n = business.reviewsCount;
  return typeof n === 'number' && n > 0 ? n : undefined;
}

/**
 * Card de negócio para carrosséis horizontais (destaques na home / hub).
 * Mostra cover, nome, categoria, rating e selo de verificado.
 */
export function BusinessCard({ business, width = 220, className }: BusinessCardProps) {
  const primaryCat = CATEGORY_BY_SLUG[business.categories[0]];
  const displayRating = getDisplayRating(business);
  const googleTip = businessPublicMetricsIncludeGoogle(business) ? GOOGLE_PUBLIC_METRICS_TOOLTIP : undefined;

  return (
    <Link href={`/comercio/negocio/${business.slug}`} className="shrink-0">
      <article
        className={cn(
          'bg-white border border-ink-100 rounded-md overflow-hidden hover:shadow-card transition-shadow',
          className,
        )}
        style={{ width }}
      >
        <div className="relative h-[120px] bg-gradient-to-br from-clay-100 to-clay-300 flex items-center justify-center">
          {resolveCoverImageSrc(business.coverUrl) ? (
            <Image
              src={resolveCoverImageSrc(business.coverUrl)!}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes={`${width}px`}
            />
          ) : (
            <BusinessCategoryIcon
              name={primaryCat?.icon}
              size={40}
              className="text-clay-700/40"
              strokeWidth={1.4}
            />
          )}

          {business.featured && (
            <div className="absolute top-2 left-2 bg-clay-500 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs">
              Destaque
            </div>
          )}

          {displayRating !== undefined && (
            <div
              className={cn(
                'absolute top-2 right-2 flex items-center gap-0.5 rounded-xs bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white',
                googleTip && 'cursor-help',
              )}
              title={googleTip}
            >
              <Star size={10} className="fill-sun-500 text-sun-500" strokeWidth={3} />
              {displayRating.toFixed(1).replace('.', ',')}
            </div>
          )}
        </div>

        <div className="px-3 pt-2.5 pb-3">
          <div className="flex items-center gap-1">
            <h3 className="text-[14px] font-bold text-ink-900 leading-tight truncate m-0">
              {business.name}
            </h3>
            {business.verified && (
              <BadgeCheck size={13} className="text-sky-700 shrink-0" strokeWidth={2.4} />
            )}
          </div>
          {primaryCat && (
            <div className="text-[11px] text-clay-600 font-medium mt-0.5">{primaryCat.name}</div>
          )}
          {business.district && (
            <div className="text-[11px] text-ink-600 mt-1.5 flex items-center gap-0.5">
              <MapPin size={11} strokeWidth={2.2} />
              {business.district}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

type BusinessCoverCardProps = Omit<BusinessCardProps, 'width'> & {
  /** Indica se o visitante logado já salvou este negócio nos favoritos. */
  isFavorited?: boolean;
};

export function BusinessCoverCard({ business, className, isFavorited = false }: BusinessCoverCardProps) {
  const primaryCat = CATEGORY_BY_SLUG[business.categories[0]];
  const rawCover = business.coverUrl ?? business.photos?.[0];
  const coverSrc = resolveCoverImageSrc(rawCover);
  const displayRating = getDisplayRating(business);
  const showRating = displayRating !== undefined;
  const ratingCount = getDisplayRatingCount(business);
  const ratingCountLabel =
    ratingCount !== undefined && ratingCount >= 1000
      ? `${(ratingCount / 1000).toFixed(1).replace('.', ',')}k`
      : ratingCount !== undefined
        ? String(ratingCount)
        : null;

  const rowCategory = [primaryCat?.name, business.district].filter(Boolean).join(' · ') || null;

  const guestFavorite =
    !business.featured &&
    showRating &&
    displayRating! >= 4.7 &&
    (ratingCount ?? 0) >= 5;

  const googleTip = businessPublicMetricsIncludeGoogle(business) ? GOOGLE_PUBLIC_METRICS_TOOLTIP : undefined;

  return (
    <Link
      href={`/comercio/negocio/${business.slug}`}
      className={cn(
        'group block w-full rounded-xl no-underline hover:no-underline',
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-100 shadow-[0_1px_3px_rgba(15,23,42,0.12)]">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={business.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-clay-100 to-clay-300">
            <BusinessCategoryIcon
              name={primaryCat?.icon}
              size={42}
              className="text-clay-700/45"
              strokeWidth={1.4}
            />
          </div>
        )}

        {business.featured || guestFavorite ? (
          <span className="pointer-events-none absolute left-3 top-3 z-[1] inline-flex max-w-[min(100%-4rem,16rem)] items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-neutral-900 shadow-[0_1px_4px_rgba(15,23,42,0.18)]">
            <Award className="size-3.5 shrink-0 text-amber-600" strokeWidth={2.2} aria-hidden="true" />
            {business.featured ? 'Em destaque' : 'Preferido dos hóspedes'}
          </span>
        ) : null}

        <span
          className="pointer-events-none absolute right-3 top-3 z-[1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
          aria-hidden="true"
        >
          <Heart
            className={cn(
              'size-[22px]',
              isFavorited ? 'fill-rose-500 stroke-white' : 'fill-transparent stroke-white',
            )}
            strokeWidth={2.25}
            aria-hidden="true"
          />
        </span>
      </div>

      <div className="text-neutral-950 mt-2 space-y-0.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <p className="m-0 min-w-0 flex-1 font-sans text-[15px] font-semibold leading-snug text-neutral-950 line-clamp-2">
              {business.name}
            </p>
            {business.verified ? (
              <BadgeCheck
                className="mt-0.5 size-3.5 shrink-0 text-emerald-800"
                strokeWidth={2.4}
                aria-label="Verificado"
              />
            ) : null}
          </div>
          {showRating ? (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 pt-0.5 text-[13px] font-semibold leading-none text-neutral-950',
                googleTip && 'cursor-help',
              )}
              title={googleTip}
              aria-label={
                ratingCount
                  ? `Nota ${displayRating!.toFixed(1).replace('.', ',')} com ${ratingCount} avaliações`
                  : `Nota ${displayRating!.toFixed(1).replace('.', ',')}`
              }
            >
              <Star className="size-3.5 shrink-0 fill-neutral-950 text-neutral-950" strokeWidth={2} aria-hidden="true" />
              <span className="tabular-nums">{displayRating!.toFixed(1).replace('.', ',')}</span>
              {ratingCountLabel ? (
                <span className="font-medium text-neutral-600">({ratingCountLabel})</span>
              ) : null}
            </span>
          ) : null}
        </div>
        {rowCategory ? (
          <p className="m-0 line-clamp-1 text-[13px] font-medium leading-snug text-neutral-600">{rowCategory}</p>
        ) : null}
        {business.shortDescription ? (
          <p className="m-0 line-clamp-2 text-[13px] font-normal leading-snug text-neutral-600">
            {business.shortDescription}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
