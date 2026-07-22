import Image from 'next/image';
import { BadgeCheck, Camera, MapPin, Star } from 'lucide-react';
import type { Business } from '@/lib/businesses/types';
import {
  businessPublicMetricsIncludeGoogle,
  getBusinessDisplayPhotoUrls,
  GOOGLE_PUBLIC_METRICS_TOOLTIP,
} from '@/lib/businesses';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';
import { CATEGORY_BY_SLUG } from '@/lib/businesses/categories';
import { BusinessCategoryIcon } from '@/lib/businesses/icon-map';
import { cn } from '@/lib/utils';
import { BusinessHeaderActions } from './business-header-actions';

type BusinessHeaderProps = {
  business: Business;
  isFavorited?: boolean;
  className?: string;
};

export function BusinessHeader({ business, isFavorited = false, className }: BusinessHeaderProps) {
  const primary = CATEGORY_BY_SLUG[business.categories[0]];
  const photos = getBusinessDisplayPhotoUrls(business);
  const hasPhotoSection = Boolean(business.photos?.length);
  const googleMetricsTip = businessPublicMetricsIncludeGoogle(business)
    ? GOOGLE_PUBLIC_METRICS_TOOLTIP
    : undefined;

  return (
    <header className={cn('bg-white px-4 py-4 md:px-6 lg:px-8', className)}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="m-0 flex items-center gap-1.5 text-[26px] font-bold leading-tight text-ink-950 md:text-[30px]">
            {business.name}
            {business.verified ? (
              <BadgeCheck className="size-5 shrink-0 text-sky-700" strokeWidth={2.4} />
            ) : null}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-ink-700">
            {primary ? <span>{primary.name}</span> : null}
            {business.district ? (
              <>
                {primary ? (
                  <span className="text-ink-300" aria-hidden="true">
                    ·
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                  {business.district}
                </span>
              </>
            ) : null}
            {business.rating !== undefined ? (
              <span
                className={cn(
                  'inline-flex flex-wrap items-center gap-x-2 gap-y-1',
                  googleMetricsTip && 'cursor-help',
                )}
                title={googleMetricsTip}
              >
                <span className="text-ink-300" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="fill-ink-900 text-ink-900 size-3.5" aria-hidden="true" />
                  {business.rating.toFixed(1).replace('.', ',')}
                </span>
                {business.reviewsCount ? (
                  <>
                    <span className="text-ink-300" aria-hidden="true">
                      ·
                    </span>
                    {business.portalReviewsCount &&
                    business.reviewsCount > business.portalReviewsCount ? (
                      <>
                        <a href="#avaliacoes" className="underline underline-offset-2">
                          {business.portalReviewsCount} no portal
                        </a>
                        <span className="text-ink-500 font-semibold">
                          {' '}
                          · {business.reviewsCount} no total
                        </span>
                      </>
                    ) : business.portalReviewsCount ? (
                      <a href="#avaliacoes" className="underline underline-offset-2">
                        {business.portalReviewsCount} avaliações
                      </a>
                    ) : (
                      <span>{business.reviewsCount} avaliações (Google)</span>
                    )}
                  </>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
        <BusinessHeaderActions
          businessId={business.id}
          businessSlug={business.slug}
          businessName={business.name}
          initialSaved={isFavorited}
        />
      </div>

      <BusinessHeroPhotoGrid
        businessName={business.name}
        iconName={primary?.icon}
        photos={photos}
        photoLinksToGallery={hasPhotoSection}
        showAllPhotosLink={hasPhotoSection}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          {primary ? (
            <h2 className="m-0 text-[20px] font-bold leading-tight text-ink-950 md:text-[22px]">
              {business.district ? `${primary.name} em ${business.district}` : primary.name}
            </h2>
          ) : null}
          {business.shortDescription ? (
            <p className="text-ink-700 m-0 mt-1 text-[14px] leading-relaxed">
              {business.shortDescription}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[12px] md:min-w-[260px]">
          <div
            className={cn(
              'rounded-md border border-ink-100 bg-white p-2',
              googleMetricsTip && 'cursor-help',
            )}
            title={googleMetricsTip}
          >
            <strong className="block text-[16px]">
              {business.rating !== undefined ? business.rating.toFixed(1).replace('.', ',') : 'Novo'}
            </strong>
            <span className="mt-0.5 flex justify-center">
              <StarRating rating={business.rating} />
            </span>
          </div>
          <div
            className={cn(
              'rounded-md border border-ink-100 bg-white p-2',
              googleMetricsTip && 'cursor-help',
            )}
            title={googleMetricsTip}
          >
            <strong className="block text-[16px]">{business.reviewsCount ?? 0}</strong>
            avaliações
          </div>
          <div className="rounded-md border border-ink-100 bg-white p-2">
            <strong className="block text-[16px]">{photos.length}</strong>
            fotos
          </div>
        </div>
      </div>
    </header>
  );
}

function BusinessHeroPhotoGrid({
  businessName,
  iconName,
  photos,
  photoLinksToGallery,
  showAllPhotosLink,
}: {
  businessName: string;
  iconName?: string;
  photos: string[];
  photoLinksToGallery: boolean;
  showAllPhotosLink: boolean;
}) {
  const visiblePhotos = photos.slice(0, 5);

  if (visiblePhotos.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-clay-300 to-clay-700 text-white/45">
        <BusinessCategoryIcon name={iconName} size={64} strokeWidth={1.2} />
      </div>
    );
  }

  if (visiblePhotos.length === 1) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-ink-100">
        <BusinessHeroPhoto src={visiblePhotos[0]} alt={businessName} priority />
        {photoLinksToGallery ? (
          <HeroPhotoScrollLink index={0} label={`Ver na galeria: foto 1 de ${businessName}`} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-ink-100">
      <div className="grid aspect-[4/3] grid-cols-1 gap-1 md:aspect-[2/1] md:grid-cols-4 md:grid-rows-2">
        <div className="relative min-h-0 md:col-span-2 md:row-span-2">
          <BusinessHeroPhoto src={visiblePhotos[0]} alt={businessName} priority />
          {photoLinksToGallery ? (
            <HeroPhotoScrollLink index={0} label={`Ver na galeria: foto 1 de ${businessName}`} />
          ) : null}
        </div>
        {visiblePhotos.slice(1).map((photo, index) => (
          <div key={photo} className="relative hidden min-h-0 md:block">
            <BusinessHeroPhoto src={photo} alt={`Foto ${index + 2} de ${businessName}`} />
            {photoLinksToGallery ? (
              <HeroPhotoScrollLink
                index={index + 1}
                label={`Ver na galeria: foto ${index + 2} de ${businessName}`}
              />
            ) : null}
          </div>
        ))}
      </div>
      {showAllPhotosLink ? (
        <a
          href="#fotos"
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2 text-[12px] font-bold text-ink-900 shadow-sm hover:bg-paper-tint"
        >
          <Camera className="size-4" aria-hidden="true" />
          Mostrar todas as fotos
        </a>
      ) : null}
    </div>
  );
}

function BusinessHeroPhoto({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const isVideo = isVideoSrc(src);
  const displaySrc = isVideo ? videoPosterUrl(src) : src;
  if (isVideo && !displaySrc) {
    return (
      <video
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }
  return (
    <Image
      src={displaySrc ?? src}
      alt={alt}
      fill
      unoptimized
      className="object-cover"
      sizes={priority ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 100vw'}
      priority={priority}
    />
  );
}

function HeroPhotoScrollLink({ index, label }: { index: number; label: string }) {
  return (
    <a
      href={`#foto-${index}`}
      className="absolute inset-0 z-[1] hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-clay-600"
      aria-label={label}
    />
  );
}

function StarRating({ rating }: { rating?: number }) {
  const safeRating = rating ?? 0;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${safeRating.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < Math.round(safeRating)
              ? 'fill-sun-500 text-sun-500 size-3.5'
              : 'text-ink-300 size-3.5'
          }
          strokeWidth={2.4}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

