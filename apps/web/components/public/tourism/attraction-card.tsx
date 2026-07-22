import Link from 'next/link';
import { Camera, Mountain, Star } from 'lucide-react';
import type { Attraction } from '@/lib/tourism';
import { formatAttractionEntryCompact } from '@/lib/tourism/entry-fee-display';

const ATTRACTION_KIND_LABELS: Record<string, string> = {
  balneario: 'Balneário',
  cachoeira: 'Cachoeira',
  historico: 'Histórico',
  igreja: 'Igreja',
  lago: 'Lago',
  mirante: 'Mirante',
  museu: 'Museu',
  parque: 'Parque',
  praia: 'Praia',
  trilha: 'Trilha',
};

/** Capa única + tipografia estilo listagem compacta (ex.: hub de turismo). */
export function AttractionCoverCard({
  item,
  cityName,
}: {
  item: Attraction;
  cityName: string;
}) {
  const images = getAttractionImages(item);
  const coverSrc = images[0];
  const kindLabel = ATTRACTION_KIND_LABELS[item.type] ?? 'Atração';
  const metaLine =
    item.bestSeason ??
    (item.durationMinutes ? `Cerca de ${item.durationMinutes} min` : null);
  const rawFee = item.priceRange ?? item.entryFee;
  const priceOrFee = rawFee ? formatAttractionEntryCompact(rawFee) : null;
  const textMetaParts = [metaLine, priceOrFee].filter(Boolean) as string[];
  const textMeta = textMetaParts.join(' · ');
  const showRating = typeof item.rating === 'number';

  return (
    <Link
      href={`/turismo/o-que-fazer/${item.slug}`}
      className="group block w-full no-underline hover:no-underline"
    >
      <div className="border-ink-100 relative aspect-[4/5] overflow-hidden rounded-xl border bg-ink-100 shadow-sm">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cerrado-100 to-sun-100">
            <Mountain className="text-clay-600 size-10" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
        {item.featured ? (
          <span className="border-ink-200/80 absolute left-2.5 top-2.5 rounded-full border bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink-900 shadow-sm backdrop-blur-[2px]">
            Em destaque
          </span>
        ) : null}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-ink-900 m-0 line-clamp-2 font-sans text-[15px] font-semibold leading-snug">
          {item.name}
        </p>
        <p className="text-ink-600 m-0 line-clamp-1 text-[13px] font-normal leading-snug">
          {kindLabel} · {cityName}
        </p>
        {(textMeta || showRating) ? (
          <p className="text-ink-600 m-0 flex flex-wrap items-center gap-x-1 text-[13px] leading-snug">
            {textMeta ? <span>{textMeta}</span> : null}
            {textMeta && showRating ? (
              <span className="text-ink-400" aria-hidden="true">
                ·
              </span>
            ) : null}
            {showRating ? (
              <span className="inline-flex items-center gap-0.5">
                <Star className="fill-ink-900 text-ink-900 size-3.5" aria-hidden="true" />
                {item.rating?.toFixed(1).replace('.', ',')}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function AttractionCard({ item }: { item: Attraction }) {
  const images = getAttractionImages(item).slice(0, 6);

  return (
    <Link
      href={`/turismo/o-que-fazer/${item.slug}`}
      className="bg-ink-900 shadow-card group relative block aspect-[16/10] overflow-hidden rounded-md text-white no-underline hover:no-underline"
    >
      <AttractionImageGrid images={images} name={item.name} />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/55 to-black/10"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold md:mb-2.5 md:text-[12px]">
          <span className="bg-white/18 rounded-full px-2 py-1 backdrop-blur md:px-2.5">{item.type}</span>
          {(item.priceRange ?? item.entryFee) ? (
            <span className="bg-white/18 max-w-[min(100%,14rem)] truncate rounded-full px-2 py-1 backdrop-blur md:px-2.5">
              {formatAttractionEntryCompact(item.priceRange ?? item.entryFee)}
            </span>
          ) : null}
          {images.length > 0 ? (
            <span className="bg-white/18 inline-flex items-center gap-1 rounded-full px-2 py-1 backdrop-blur md:px-2.5">
              <Camera className="size-3" aria-hidden="true" />
              {images.length}
            </span>
          ) : null}
          {item.rating ? (
            <span className="text-ink-900 ml-auto inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-1 md:px-2.5">
              <Star className="fill-sun-500 text-sun-500 size-3" aria-hidden="true" />
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h2 className="m-0 line-clamp-2 font-sans text-[17px] font-extrabold leading-tight text-white drop-shadow md:text-[19px]">
          {item.name}
        </h2>
        <p className="text-white/82 m-0 mt-1 line-clamp-2 text-[12px] font-medium leading-snug md:mt-1.5 md:text-[13px]">
          {item.description ?? item.googleSummary ?? item.type}
        </p>
      </div>
    </Link>
  );
}

function getAttractionImages(item: Attraction): string[] {
  const values = [
    item.coverUrl,
    ...item.photos,
    ...item.googlePhotos
      .map((photo) => {
        if (photo.url) return photo.url;
        if (!photo.name.startsWith('places/') || !photo.name.includes('/photos/')) return null;
        return `/api/google-place-photo?name=${encodeURIComponent(photo.name)}&w=640`;
      })
      .filter((photo): photo is string => Boolean(photo)),
  ];
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function AttractionImageGrid({ images, name }: { images: string[]; name: string }) {
  if (images.length === 0) {
    return (
      <div className="bg-sun-100 flex h-full w-full items-center justify-center">
        <Mountain size={38} className="text-clay-700" aria-hidden="true" />
      </div>
    );
  }

  if (images.length === 1) {
    return <CardImage src={images[0]} alt={name} />;
  }

  if (images.length === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2">
        {images.map((src, index) => (
          <CardImage key={src} src={src} alt={index === 0 ? name : ''} />
        ))}
      </div>
    );
  }

  if (images.length >= 6) {
    return (
      <div className="grid h-full w-full grid-cols-3 grid-rows-2">
        {images.slice(0, 6).map((src, index) => (
          <CardImage key={src} src={src} alt={index === 0 ? name : ''} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-2">
      <CardImage src={images[0]} alt={name} className="col-span-2 row-span-2" />
      {images.slice(1, 3).map((src, index) => (
        <div key={src} className="relative">
          <CardImage src={src} alt="" />
          {index === 1 && images.length > 3 ? (
            <span className="bg-ink-900/45 absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-white">
              +{images.length - 3}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CardImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03] ${className ?? ''}`}
      loading="lazy"
    />
  );
}
