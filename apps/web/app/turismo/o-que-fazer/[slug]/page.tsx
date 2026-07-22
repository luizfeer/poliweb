import {
  BadgeCheck,
  Camera,
  Clock3,
  Compass,
  ExternalLink,
  Globe,
  MapPin,
  MessageSquareQuote,
  Mountain,
  PawPrint,
  Phone,
  Route,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { TracedLink } from '@/components/analytics/traced-link';
import {
  AppFrame,
  Band,
  CoverCardRow,
  CoverCardRowItem,
  DetailHeader,
  Divider,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import {
  AttractionPhotoGallery,
  type AttractionGalleryPhoto,
} from '@/components/public/tourism/attraction-photo-gallery';
import { MapEmbed } from '@/components/public/tourism/map-embed';
import { AttractionCoverCard } from '@/components/public/tourism/attraction-card';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { buildSocialImages } from '@/lib/seo/social-images';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, touristAttractionJsonLd } from '@/lib/seo/structured-data';
import { getAttractionFullBySlug, listAttractions } from '@/lib/tourism';
import { formatTourismAmenityLabel } from '@/lib/tourism/amenity-labels';
import { formatAttractionEntryPresentation } from '@/lib/tourism/entry-fee-display';
import { formatGoogleImportReviewTime } from '@/lib/format/google-import-review-time';
import { cn } from '@/lib/utils';
import type { GoogleAttractionPhoto } from '@/lib/tourism/types';
import { AttractionHeaderActions } from './attraction-header-actions';
import { ContributionPrompts } from './contribution-prompts';

type PageProps = { params: Promise<{ slug: string }> };

type InfoItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

type ParsedHourLine = {
  day: string;
  hours: string;
};

const ATTRACTION_TYPE_LABELS: Record<string, string> = {
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

const DAY_NAMES = [
  { keys: ['monday', 'segunda-feira', 'segunda'], label: 'Segunda' },
  { keys: ['tuesday', 'terça-feira', 'terca-feira', 'terça', 'terca'], label: 'Terça' },
  { keys: ['wednesday', 'quarta-feira', 'quarta'], label: 'Quarta' },
  { keys: ['thursday', 'quinta-feira', 'quinta'], label: 'Quinta' },
  { keys: ['friday', 'sexta-feira', 'sexta'], label: 'Sexta' },
  { keys: ['saturday', 'sábado', 'sabado'], label: 'Sábado' },
  { keys: ['sunday', 'domingo'], label: 'Domingo' },
];

function publicTourismUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tourism/${path}`;
}

function googlePhotoUrl(photo: GoogleAttractionPhoto, width = 900): string | null {
  if (photo.url) return photo.url;
  if (!photo.name.startsWith('places/') || !photo.name.includes('/photos/')) return null;
  return `/api/google-place-photo?name=${encodeURIComponent(photo.name)}&w=${width}`;
}

function uniquePhotos(values: AttractionGalleryPhoto[]): AttractionGalleryPhoto[] {
  const seen = new Set<string>();
  return values.filter((photo) => {
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatAttractionType(value: string) {
  return ATTRACTION_TYPE_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

function clipMetaDescription(text: string, max = 155): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return {};
  const { slug } = await params;
  const item = await getAttractionFullBySlug({ city_id: city.id, slug });
  if (!item) {
    return { title: 'Atração não encontrada' };
  }
  const typeLabel = formatAttractionType(item.type);
  const raw =
    item.description ??
    item.googleSummary ??
    `${item.name} — ${typeLabel} em ${city.name}. Dicas, mapa e horários no Portal Carmelitano.`;
  const description = clipMetaDescription(raw);
  const title = `${item.name} | O que fazer em ${city.name}`;
  const path = `/turismo/o-que-fazer/${slug}`;
  const socialImages = buildSocialImages({
    ogImageUrl: item.ogImageUrl,
    ogSquareImageUrl: item.ogSquareImageUrl,
    alt: item.name,
  });
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'Portal Carmelitano',
      locale: 'pt_BR',
      type: 'website',
      ...(socialImages.openGraph ?? {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(socialImages.twitter ?? {}),
    },
  };
}

function normalizeDisplayAddress(value: string) {
  return value
    .replace(/,\s*Brazil$/i, '')
    .replace(/,\s*\d{5}-?\d{3}(?=,|$)/g, '')
    .replace(/\s*,\s*/g, ', ');
}

function splitHours(value: string): string[] {
  const compact = value
    .replaceAll('\u202f', ' ')
    .replaceAll('\u2009', ' ')
    .replaceAll('\u00a0', ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) return [];

  const dayPattern =
    'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|segunda-feira|terça-feira|terca-feira|quarta-feira|quinta-feira|sexta-feira|sábado|sabado|domingo|segunda|terça|terca|quarta|quinta|sexta';
  return compact
    .split(new RegExp(`\\s+(?=(?:${dayPattern})\\s*:)`, 'i'))
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseHourLine(line: string): ParsedHourLine | null {
  const [rawDay, ...rest] = line.split(':');
  const rawHours = rest.join(':').trim();
  const day = translateDay(rawDay);
  if (!day || !rawHours) return null;
  return { day, hours: translateHours(rawHours) };
}

function isParsedHourLine(value: ParsedHourLine | null): value is ParsedHourLine {
  return value !== null;
}

function translateDay(value: string): string | null {
  const key = value.trim().toLowerCase();
  return DAY_NAMES.find((day) => day.keys.includes(key))?.label ?? null;
}

function translateHours(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('closed') || lower.includes('fechado')) return 'Fechado';
  if (lower.includes('open 24 hours') || lower.includes('24 horas')) return 'Aberto 24 horas';

  return value
    .split(/\s*[–—-]\s*/)
    .map((part) => formatClock(part))
    .join('–');
}

function formatClock(value: string): string {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return value.trim();
  const period = match[3].toUpperCase();
  let hour = Number(match[1]);
  const minute = match[2] ?? '00';
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function StarRating({ rating }: { rating: number | null }) {
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

function AttractionHeroPhotoGrid({
  attractionName,
  photos,
}: {
  attractionName: string;
  photos: AttractionGalleryPhoto[];
}) {
  const visiblePhotos = photos.slice(0, 5);

  if (visiblePhotos.length === 0) {
    return (
      <div className="bg-cerrado-700 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg text-white/55">
        <Mountain className="size-16" strokeWidth={1.4} aria-hidden="true" />
      </div>
    );
  }

  if (visiblePhotos.length === 1) {
    return (
      <div className="bg-ink-100 relative aspect-[16/9] overflow-hidden rounded-lg">
        <HeroPhoto src={visiblePhotos[0].src} alt={attractionName} priority />
      </div>
    );
  }

  return (
    <div className="bg-ink-100 relative overflow-hidden rounded-lg">
      <div className="grid aspect-[4/3] grid-cols-1 gap-1 md:aspect-[2/1] md:grid-cols-4 md:grid-rows-2">
        <a
          href="#fotos"
          className="focus-visible:outline-clay-500 block min-h-0 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:col-span-2 md:row-span-2"
          aria-label={`Ver galeria de fotos de ${attractionName}`}
        >
          <HeroPhoto src={visiblePhotos[0].src} alt={attractionName} priority />
        </a>
        {visiblePhotos.slice(1).map((photo, index) => (
          <a
            key={photo.src}
            href="#fotos"
            className="focus-visible:outline-clay-500 hidden min-h-0 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:block"
            aria-label={`Ver galeria de fotos de ${attractionName}`}
          >
            <HeroPhoto src={photo.src} alt={`Foto ${index + 2} de ${attractionName}`} />
          </a>
        ))}
      </div>
      {photos.length > 1 ? (
        <a
          href="#fotos"
          className="border-ink-200 text-ink-900 hover:bg-paper-tint absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-[12px] font-bold shadow-sm"
        >
          <Camera className="size-4" aria-hidden="true" />
          Mostrar todas as fotos
        </a>
      ) : null}
    </div>
  );
}

function entryFeePillClass(tone: 'free' | 'paid' | 'neutral'): string {
  return cn(
    'mt-1 inline-flex w-fit max-w-full items-center rounded-full px-3 py-1.5 text-[13px] font-bold leading-tight shadow-sm ring-1',
    tone === 'free' && 'bg-cerrado-100 text-cerrado-900 ring-cerrado-300/55',
    tone === 'paid' &&
      'bg-gradient-to-r from-clay-50 via-white to-sun-50 text-clay-900 ring-clay-300/50',
    tone === 'neutral' && 'bg-ink-100 text-ink-800 ring-ink-200/90',
  );
}

function HeroPhoto({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

function InfoCard({
  item,
  attractionSlug,
  attractionId,
}: {
  item: InfoItem;
  attractionSlug: string;
  attractionId: string;
}) {
  const Icon = item.icon;
  const entryPresentation =
    item.label === 'Entrada' ? formatAttractionEntryPresentation(item.value) : null;

  const content = (
    <span className="flex min-w-0 items-start gap-2.5">
      <span className="bg-cerrado-100 text-cerrado-700 flex size-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="text-ink-500 block text-[11px] font-semibold uppercase tracking-[0.05em]">
          {item.label}
        </span>
        {entryPresentation ? (
          <>
            <span className={entryFeePillClass(entryPresentation.tone)}>
              {entryPresentation.title}
            </span>
            {entryPresentation.description ? (
              <span className="text-ink-600 mt-1.5 block text-[12px] font-medium leading-snug">
                {entryPresentation.description}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-ink-900 block break-words text-[13px] font-semibold leading-snug">
            {item.value}
          </span>
        )}
      </span>
    </span>
  );

  const tracePayload = {
    entity_type: 'attraction',
    entity_slug: attractionSlug,
    entity_id: attractionId,
  };

  if (!item.href) {
    return <li className="border-ink-100 rounded-md border bg-white p-3">{content}</li>;
  }

  if (item.href.startsWith('tel:')) {
    return (
      <li>
        <TracedLink
          href={item.href}
          className="border-ink-100 hover:bg-paper-tint block rounded-md border bg-white p-3"
          trackEvent={HI_METRICA_EVENTS.contact_phone_click}
          trackPayload={tracePayload}
        >
          {content}
        </TracedLink>
      </li>
    );
  }

  if (item.href.startsWith('http')) {
    return (
      <li>
        <TracedLink
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border-ink-100 hover:bg-paper-tint block rounded-md border bg-white p-3"
          trackEvent={HI_METRICA_EVENTS.contact_website_click}
          trackPayload={tracePayload}
        >
          {content}
        </TracedLink>
      </li>
    );
  }

  return (
    <li>
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="border-ink-100 hover:bg-paper-tint block rounded-md border bg-white p-3"
      >
        {content}
      </a>
    </li>
  );
}

export default async function AttractionDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const { slug } = await params;
  const [item, attractionSuggestions] = await Promise.all([
    getAttractionFullBySlug({ city_id: city.id, slug }),
    listAttractions({ city_id: city.id, limit: 8 }),
  ]);
  if (!item) notFound();
  const recommendedAttractions = attractionSuggestions
    .filter((attraction) => attraction.id !== item.id)
    .slice(0, 3);

  const googlePhotos: AttractionGalleryPhoto[] = [];
  for (const photo of item.googlePhotos) {
    const src = googlePhotoUrl(photo);
    if (src) googlePhotos.push({ src, attribution: photo.attribution });
  }
  const gallery = uniquePhotos([
    ...(item.coverUrl ? [{ src: item.coverUrl }] : []),
    ...[...item.photos].reverse().map((src) => ({ src })),
    ...item.publicPhotos
      .filter((photo) => photo.mediaType === 'image')
      .map((photo) => ({
        src: publicTourismUrl(photo.storagePath),
        attribution: photo.caption,
      })),
    ...googlePhotos,
  ]);
  const totalReviews = item.reviews.length + item.googleReviews.length || item.reviewsCount;
  const description = item.description ?? item.googleSummary ?? item.type;
  const attractionTypeLabel = formatAttractionType(item.type);
  const hours = item.hoursLegacyText
    ? splitHours(item.hoursLegacyText).map(parseHourLine).filter(isParsedHourLine)
    : [];
  const infoItems: InfoItem[] = [
    { icon: Mountain, label: 'Perfil', value: item.difficulty ?? attractionTypeLabel },
    { icon: Ticket, label: 'Entrada', value: item.priceRange ?? item.entryFee ?? 'Consultar' },
    ...(item.bestSeason ? [{ icon: Clock3, label: 'Melhor época', value: item.bestSeason }] : []),
    ...(item.durationMinutes
      ? [{ icon: Route, label: 'Duração média', value: `${item.durationMinutes} min` }]
      : []),
    ...(item.address
      ? [{ icon: MapPin, label: 'Endereço', value: normalizeDisplayAddress(item.address) }]
      : []),
    ...(item.phone
      ? [{ icon: Phone, label: 'Telefone', value: item.phone, href: `tel:${item.phone}` }]
      : []),
    ...(item.website
      ? [
          {
            icon: Globe,
            label: 'Site',
            value: item.website.replace(/^https?:\/\//i, ''),
            href: item.website,
          },
        ]
      : []),
  ];

  const hiListing = {
    entity_type: 'attraction',
    entity_slug: slug,
    entity_id: item.id,
  };

  const site = resolvePublicSiteOrigin();
  const attractionUrl = `${site}/turismo/o-que-fazer/${slug}`;

  return (
    <AppFrame>
      <JsonLdScript
        data={touristAttractionJsonLd({
          name: item.name,
          url: attractionUrl,
          description,
          image: item.coverUrl ?? gallery[0]?.src,
          latitude: item.lat,
          longitude: item.lng,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Turismo', url: `${site}/turismo` },
          { name: 'O que fazer', url: `${site}/turismo/o-que-fazer` },
          { name: item.name, url: attractionUrl },
        ])}
      />
      <HimetricaPageView
        key={slug}
        event={HI_METRICA_EVENTS.tourism_listing_viewed}
        payload={{ kind: 'do', ...hiListing }}
      />
      <DetailHeader
        title={item.name}
        backHref="/turismo/o-que-fazer"
        backLabel="Voltar para atrações"
        links={[
          { label: 'Informações', href: '#informacoes' },
          ...(hours.length > 0 ? [{ label: 'Horários', href: '#horarios' as const }] : []),
          ...(gallery.length > 1 ? [{ label: 'Fotos', href: '#fotos' as const }] : []),
          { label: 'Mapa', href: '#mapa' },
          { label: 'Avaliações', href: '#avaliacoes' },
        ]}
      />
      <header className="bg-white px-4 py-4 md:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-ink-950 m-0 text-[26px] font-bold leading-tight md:text-[30px]">
              {item.name}
            </h1>
            <div className="text-ink-700 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold">
              {item.featured ? (
                <span className="text-ink-900 inline-flex items-center gap-1">
                  <BadgeCheck className="text-cerrado-700 size-4" aria-hidden="true" />
                  destaque
                </span>
              ) : null}
              <span>{attractionTypeLabel}</span>
              <span className="text-ink-300" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="fill-ink-900 text-ink-900 size-3.5" aria-hidden="true" />
                {item.averageRating?.toFixed(1).replace('.', ',') ?? 'Novo'}
              </span>
              <span className="text-ink-300" aria-hidden="true">
                ·
              </span>
              <a href="#avaliacoes" className="underline underline-offset-2">
                {totalReviews} avaliações
              </a>
            </div>
          </div>
          <AttractionHeaderActions attractionName={item.name} />
        </div>
        <AttractionHeroPhotoGrid attractionName={item.name} photos={gallery} />
        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div>
            <h2 className="text-ink-950 m-0 text-[20px] font-bold leading-tight md:text-[22px]">
              {attractionTypeLabel} em {city.name}
            </h2>
            <p className="text-ink-700 m-0 mt-1 text-[14px] leading-relaxed">{description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[12px] md:min-w-[260px]">
            <div className="border-ink-100 rounded-md border bg-white p-2">
              <strong className="block text-[16px]">
                {item.averageRating?.toFixed(1).replace('.', ',') ?? 'Novo'}
              </strong>
              <span className="mt-0.5 flex justify-center">
                <StarRating rating={item.averageRating} />
              </span>
            </div>
            <div className="border-ink-100 rounded-md border bg-white p-2">
              <strong className="block text-[16px]">{totalReviews}</strong>
              avaliações
            </div>
            <div className="border-ink-100 rounded-md border bg-white p-2">
              <strong className="block text-[16px]">{gallery.length}</strong>
              fotos
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <TourismAdminEditLink href={`/painel/cidade/turismo/atracoes/${item.id}`} />
        </div>
      </header>

      <Divider />
      <div id="informacoes" className="scroll-mt-28" />
      <SectionHeader title="Informações úteis" />
      <ul className="m-0 grid list-none gap-2 px-4 md:px-6 lg:px-8">
        {infoItems.map((info) => (
          <InfoCard
            key={`${info.label}-${info.value}`}
            item={info}
            attractionSlug={slug}
            attractionId={item.id}
          />
        ))}
      </ul>

      {hours.length > 0 ? (
        <>
          <Divider />
          <div id="horarios" className="scroll-mt-28" />
          <SectionHeader title="Horários" kicker="Funcionamento" />
          <ul className="m-0 list-none px-4 md:px-6 lg:px-8">
            {hours.map((line) => (
              <li
                key={line.day}
                className="border-ink-100 flex items-baseline justify-between border-b py-1.5 last:border-0"
              >
                <span className="text-ink-700 text-[13px]">{line.day}</span>
                <span className="text-ink-900 text-[13px] font-semibold">{line.hours}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {item.googleSummary ? (
        <>
          <Divider />
          <SectionHeader title="Resumo do Google" />
          <Band className="px-4 md:px-6 lg:px-8">
            <article className="border-ink-100 rounded-md border bg-white p-3">
              <p className="text-ink-800 m-0 text-[13px] leading-relaxed">{item.googleSummary}</p>
            </article>
          </Band>
        </>
      ) : null}

      {item.amenities.length > 0 || item.petFriendly || item.familyFriendly ? (
        <>
          <Divider />
          <SectionHeader title="Comodidades" />
          <div className="flex flex-wrap gap-1.5 px-4 md:px-6 lg:px-8">
            {item.familyFriendly ? (
              <span className="bg-cerrado-100 text-cerrado-700 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium">
                <Users className="size-3.5" aria-hidden="true" />
                Bom para famílias
              </span>
            ) : null}
            {item.petFriendly ? (
              <span className="bg-cerrado-100 text-cerrado-700 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium">
                <PawPrint className="size-3.5" aria-hidden="true" />
                Aceita pet
              </span>
            ) : null}
            {item.amenities.map((amenity) => (
              <span
                key={amenity}
                className="bg-cerrado-100 text-cerrado-700 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium"
              >
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {formatTourismAmenityLabel(amenity)}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {item.services.length > 0 ? (
        <>
          <Divider />
          <SectionHeader title="Serviços" />
          <div className="grid gap-2 px-4 md:px-6 lg:px-8">
            {item.services.map((service) => (
              <article
                key={service.id}
                className="border-ink-100 rounded-md border bg-white p-3 text-[13px]"
              >
                <strong>{service.label}</strong>
                <p className="text-ink-700 m-0 mt-1">
                  {service.details ?? service.kind}
                  {service.price ? ` · ${formatMoney(service.price)}` : ''}
                </p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {gallery.length > 1 ? (
        <>
          <Divider />
          <div className="px-4 md:px-6 lg:px-8">
            <AttractionPhotoGallery id="fotos" attractionName={item.name} photos={gallery} />
          </div>
        </>
      ) : null}

      <Divider />
      <div id="mapa" className="scroll-mt-28" />
      <SectionHeader title="Mapa" />
      <div className="px-4 md:px-6 lg:px-8">
        <MapEmbed
          lat={item.lat}
          mapCategory={item.type?.toLowerCase().startsWith('igreja') ? 'igreja' : 'atracao'}
          mapPointId={item.id}
          lng={item.lng}
          label={item.name}
          address={item.address ? normalizeDisplayAddress(item.address) : null}
          analyticsContext={hiListing}
        />
        <div className="mt-2 flex gap-2">
          {item.streetViewUrl ? (
            <a
              className="border-ink-100 inline-flex flex-1 items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-[13px] font-semibold text-sky-700"
              href={item.streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver 360
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      <Divider />
      <div id="avaliacoes" className="scroll-mt-28" />
      <SectionHeader title="Avaliações" kicker={`${totalReviews} no total`} />
      <div className="space-y-2 px-4 md:px-6 lg:px-8">
        <ContributionPrompts attractionId={item.id} attractionName={item.name} />
        {item.reviews.map((review) => (
          <article
            key={review.id}
            className="border-ink-100 rounded-md border bg-white p-3 text-[13px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={review.rating} />
              <strong>{review.title ?? 'Avaliação'}</strong>
            </div>
            {review.comment ? (
              <p className="text-ink-700 m-0 mt-1 leading-relaxed">{review.comment}</p>
            ) : null}
            {review.replyOwner ? (
              <blockquote className="bg-paper-deep text-ink-700 mt-2 rounded-md p-2 text-[12px]">
                Resposta: {review.replyOwner}
              </blockquote>
            ) : null}
          </article>
        ))}
        {item.googleReviews.map((review) => {
          const timeLabel = formatGoogleImportReviewTime(review);
          return (
            <article
              key={`google-${review.id}`}
              className="border-ink-100 bg-paper rounded-md border p-3 text-[13px]"
            >
              <div className="text-ink-600 flex flex-wrap items-center gap-2 text-[12px]">
                <MessageSquareQuote className="text-ink-500 size-3.5" aria-hidden="true" />
                <span className="text-ink-900 font-semibold">
                  {review.authorName ?? 'Usuário do Google'}
                </span>
                <StarRating rating={review.rating} />
                <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-sky-700">
                  Google
                </span>
                {timeLabel ? <span>{timeLabel}</span> : null}
              </div>
              {review.text ? (
                <p className="text-ink-800 m-0 mt-2 leading-relaxed">{review.text}</p>
              ) : null}
              {review.authorUrl ? (
                <a
                  href={review.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 hover:underline"
                >
                  Ver no Google
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          );
        })}
        {item.reviews.length === 0 && item.googleReviews.length === 0 ? (
          <p className="border-ink-100 text-ink-700 m-0 rounded-md border bg-white p-3 text-[13px]">
            Ainda não há avaliações publicadas para este lugar.
          </p>
        ) : null}
      </div>

      <Divider />
      <Band className="px-4 py-4 md:px-6 lg:px-8">
        <section className="border-ink-100 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-brand-700 m-0 text-[12px] font-bold uppercase tracking-wide">
                Planeje o passeio
              </p>
              <h2 className="text-ink-950 m-0 mt-1 text-[19px] font-bold leading-tight">
                Buscando o que fazer em {city.name}?
              </h2>
              <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                Veja mais atrações, mirantes, cachoeiras e pontos culturais próximos.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/turismo/o-que-fazer"
                className="bg-ink-900 inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-bold text-white no-underline"
              >
                <Compass className="size-4" aria-hidden="true" />
                Ver atrações
              </Link>
              <Link
                href="/turismo"
                className="border-ink-200 text-ink-900 hover:bg-paper-tint inline-flex min-h-10 items-center justify-center rounded-md border bg-white px-4 text-[13px] font-bold no-underline"
              >
                Guia de turismo
              </Link>
            </div>
          </div>
        </section>
      </Band>

      {recommendedAttractions.length > 0 ? (
        <>
          <Divider />
          <SectionHeader title="Outras atrações recomendadas" />
          <CoverCardRow>
            {recommendedAttractions.map((attraction) => (
              <CoverCardRowItem key={attraction.id}>
                <AttractionCoverCard item={attraction} cityName={city.name} />
              </CoverCardRowItem>
            ))}
          </CoverCardRow>
        </>
      ) : null}

      {item.relatedPackages.length > 0 ? (
        <>
          <Divider />
          <SectionHeader title="Roteiros com este lugar" />
          <div className="grid gap-2 px-4 md:px-6 lg:px-8">
            {item.relatedPackages.map((tourPackage) => (
              <article
                key={tourPackage.id}
                className="border-ink-100 rounded-md border bg-white p-3 text-[13px]"
              >
                <strong>{tourPackage.title}</strong>
                <p className="text-ink-700 m-0 mt-1">{tourPackage.description}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}

      <Divider />
      <Band className="px-4 py-4 md:px-6 lg:px-8">
        <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[12px]">
          Fotos e avaliações da comunidade passam por moderação antes de aparecer publicamente.
        </p>
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
