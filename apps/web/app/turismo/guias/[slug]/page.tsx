import { BookOpen, Camera, Compass, Mountain, Play, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { AppFrame, AppHeader, Band, DetailHeader, Divider, TabBar } from '@/components/carmo';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { buildSocialImages } from '@/lib/seo/social-images';
import {
  AttractionPhotoGallery,
  type AttractionGalleryPhoto,
} from '@/components/public/tourism/attraction-photo-gallery';
import { MapEmbed } from '@/components/public/tourism/map-embed';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import {
  GuideActivities,
  GuideContentBlocks,
  GuideExperiences,
  GuideFaq,
  GuideFerry,
  GuideFestival,
  GuideHighlights,
  GuidePlaces,
  GuidePracticalInfo,
  GuideReviews,
  GuideSeasons,
} from '@/components/public/tourism/guide';
import { GuidePrincipalAttractions } from '@/components/public/tourism/guide/guide-principal-attractions';
import { YouTubeEmbed } from '@/components/public/tourism/guide/youtube-embed';
import { getCurrentCity } from '@/lib/cities';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { getGuideFullBySlug, listGuides, listPublishedAttractionsByIds } from '@/lib/tourism';
import type { Attraction, GoogleAttractionPhoto, GuideLinkedEntity } from '@/lib/tourism/types';
import { parseYouTubeVideoId } from '@/lib/utils/youtube';
import { videoPosterUrl } from '@/lib/media/video-poster';

type PageProps = { params: Promise<{ slug: string }> };

const GUIDE_KIND_LABELS: Record<string, string> = {
  distrito: 'Guia de Distrito',
  cidade: 'Guia da Cidade',
  tematico: 'Guia Temático',
  roteiro: 'Roteiro',
};

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return {};
  const { slug } = await params;
  const guide = await getGuideFullBySlug({ city_id: city.id, slug });
  if (!guide) return {};

  const seo = guide.seo as { title?: string; description?: string; keywords?: string[] };
  const socialImages = buildSocialImages({
    ogImageUrl: guide.ogImageUrl,
    ogSquareImageUrl: guide.ogSquareImageUrl,
    alt: guide.name,
  });
  return {
    title: seo.title ?? `${guide.name} | Turismo em ${city.name}`,
    description: seo.description ?? guide.tagline ?? guide.description ?? undefined,
    keywords: seo.keywords,
    ...socialImages,
  };
}

function isVideoMedia(media: AttractionGalleryPhoto): boolean {
  if (media.contentType?.startsWith('video/')) return true;
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(media.src);
}

function HeroMediaSlot({
  media,
  alt,
  eager,
  controls,
}: {
  media: AttractionGalleryPhoto;
  alt: string;
  eager?: boolean;
  controls?: boolean;
}) {
  if (isVideoMedia(media)) {
    return (
      <div className="relative h-full w-full">
        <video
          src={media.src}
          poster={videoPosterUrl(media.src) ?? undefined}
          className="h-full w-full object-cover"
          muted={!controls}
          playsInline
          preload="metadata"
          controls={controls}
          aria-label={alt}
        >
          <track kind="captions" />
        </video>
        {!controls ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15 text-white">
            <Play className="size-10 fill-white" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.src}
      alt={alt}
      className="h-full w-full object-cover"
      loading={eager ? 'eager' : 'lazy'}
    />
  );
}

function HeroPhotoGrid({ name, photos }: { name: string; photos: AttractionGalleryPhoto[] }) {
  const visible = photos.slice(0, 5);

  if (visible.length === 0) {
    return (
      <div className="bg-cerrado-700 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl text-white/55">
        <Mountain className="size-16" strokeWidth={1.4} aria-hidden="true" />
      </div>
    );
  }

  if (visible.length === 1) {
    return (
      <div className="bg-ink-100 relative aspect-[16/9] overflow-hidden rounded-xl">
        <HeroMediaSlot media={visible[0]} alt={name} eager controls={isVideoMedia(visible[0])} />
      </div>
    );
  }

  return (
    <div className="bg-ink-100 relative overflow-hidden rounded-xl">
      <div className="grid aspect-[4/3] grid-cols-1 gap-1 md:aspect-[2/1] md:grid-cols-4 md:grid-rows-2">
        <div className="min-h-0 md:col-span-2 md:row-span-2">
          <HeroMediaSlot
            media={visible[0]}
            alt={name}
            eager
            controls={isVideoMedia(visible[0])}
          />
        </div>
        {visible.slice(1).map((media, i) => (
          <div key={media.src} className="hidden min-h-0 md:block">
            <HeroMediaSlot media={media} alt={`Mídia ${i + 2} de ${name}`} />
          </div>
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

export default async function GuideDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  const { slug } = await params;

  if (!city) {
    return (
      <AppFrame>
        <AppHeader chips={['Guias']} />
        <Band className="px-3.5 py-5">
          <h1 className="font-display m-0 text-[22px] font-extrabold">
            Não foi possível carregar a cidade
          </h1>
          <p className="text-ink-700 m-0 mt-2 text-[14px] leading-relaxed">
            Verifique a conexão com o banco e o slug em{' '}
            <code className="bg-paper-deep rounded px-1 font-mono text-[13px]">
              NEXT_PUBLIC_DEFAULT_CITY_SLUG
            </code>
            .
          </p>
          <p className="m-0 mt-3 flex flex-wrap gap-x-3 gap-y-1">
            <Link
              href="/turismo/guias"
              className="text-clay-700 text-[14px] font-semibold underline"
            >
              Lista de guias
            </Link>
            <Link href="/turismo" className="text-clay-700 text-[14px] font-semibold underline">
              Turismo
            </Link>
          </p>
        </Band>
        <TabBar active="home" />
      </AppFrame>
    );
  }

  if (!city.modules.includes('tourism')) {
    return (
      <AppFrame>
        <AppHeader chips={['Guias']} />
        <TourismAdminEditBar href="/painel/cidade/turismo" />
        <Band className="px-3.5 py-5">
          <h1 className="font-display m-0 text-[22px] font-extrabold">Guia indisponível</h1>
          <p className="text-ink-700 m-0 mt-2 rounded-md border bg-white p-4 text-[14px]">
            O módulo de turismo ainda não está ativo nesta cidade.
          </p>
          <p className="m-0 mt-3">
            <Link href="/turismo" className="text-clay-700 text-[14px] font-semibold underline">
              Voltar ao turismo
            </Link>
          </p>
        </Band>
        <TabBar active="home" />
      </AppFrame>
    );
  }

  const item = await getGuideFullBySlug({ city_id: city.id, slug });
  if (!item) notFound();

  const attractionLinks = item.linkedEntities.filter((e) => e.entityType === 'attraction');
  const principalAttractionIds = attractionLinks.map((e) => e.entityId);
  const publishedAttractions =
    principalAttractionIds.length > 0
      ? await listPublishedAttractionsByIds({ city_id: city.id, ids: principalAttractionIds })
      : [];
  const attractionById = new Map(publishedAttractions.map((a) => [a.id, a]));
  const principalAttractionRows: Array<{ link: GuideLinkedEntity; attraction: Attraction }> = [];
  for (const link of [...attractionLinks].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const attraction = attractionById.get(link.entityId);
    if (attraction) principalAttractionRows.push({ link, attraction });
  }

  const googlePhotos: AttractionGalleryPhoto[] = [];
  for (const photo of item.googlePhotos) {
    const src = googlePhotoUrl(photo);
    if (src) googlePhotos.push({ src, attribution: photo.attribution });
  }
  const gallery = uniquePhotos([
    ...(item.coverUrl ? [{ src: item.coverUrl }] : []),
    ...item.cdnMedia.map((media) => ({
      src: media.url,
      contentType: media.contentType,
      attribution: media.altText,
    })),
    ...[...item.photos].reverse().map((src) => ({ src })),
    ...item.publicPhotos.map((photo) => ({
      src: publicTourismUrl(photo.storagePath),
      attribution: photo.caption,
    })),
    ...googlePhotos,
  ]);

  const totalReviews = item.reviews.length + item.googleReviews.length || item.reviewsCount;
  const kindLabel = GUIDE_KIND_LABELS[item.kind] ?? 'Guia';
  const guideVideoId = parseYouTubeVideoId(item.youtubeUrl ?? '');

  const navLinks: { label: string; href: `#${string}` }[] = [
    { label: 'Sobre', href: '#sobre' },
    ...(principalAttractionRows.length > 0
      ? [{ label: 'Atrações' as const, href: '#atracoes' as `#${string}` }]
      : []),
    ...(guideVideoId ? [{ label: 'Vídeo' as const, href: '#video' as `#${string}` }] : []),
    ...item.sections.map((s) => ({
      label: s.title.replace(/^(O que|Melhor|Festa|Balsa|Locais).*/, '$1...').slice(0, 16),
      href: `#${s.id}` as `#${string}`,
    })),
    ...(item.practicalInfo.length > 0
      ? [{ label: 'Dicas' as const, href: '#dicas' as `#${string}` }]
      : []),
    ...(item.faq.length > 0 ? [{ label: 'FAQ' as const, href: '#faq' as `#${string}` }] : []),
    ...(gallery.length > 1 ? [{ label: 'Fotos' as const, href: '#fotos' as `#${string}` }] : []),
    { label: 'Avaliações', href: '#avaliacoes' },
  ];

  const otherGuides = await listGuides({ city_id: city.id, limit: 6 });
  const relatedGuides = otherGuides.filter((g) => g.id !== item.id).slice(0, 3);

  const hiListing = {
    entity_type: 'tourism_guide',
    entity_slug: slug,
    entity_id: item.id,
  };

  return (
    <AppFrame>
      <HimetricaPageView
        key={slug}
        event={HI_METRICA_EVENTS.tourism_listing_viewed}
        payload={{ kind: 'guide', guide_kind: item.kind, ...hiListing }}
      />
      <DetailHeader
        title={item.name}
        backHref="/turismo"
        backLabel="Voltar para turismo"
        links={navLinks}
      />

      {/* ─── Hero ─── */}
      <header className="bg-white px-4 py-4 md:px-6 lg:px-8">
        <HeroPhotoGrid name={item.name} photos={gallery} />

        <div className="mt-5">
          <div className="text-ink-500 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
            <span className="bg-clay-50 text-clay-600 rounded-full px-2.5 py-1">{kindLabel}</span>
            {item.averageRating ? (
              <>
                <span className="text-ink-300" aria-hidden="true">
                  ·
                </span>
                <span className="text-ink-900 inline-flex items-center gap-1">
                  <Star className="fill-sun-500 text-sun-500 size-3.5" aria-hidden="true" />
                  {item.averageRating.toFixed(1).replace('.', ',')}
                </span>
              </>
            ) : null}
            <span className="text-ink-300" aria-hidden="true">
              ·
            </span>
            <a href="#avaliacoes" className="text-ink-600 underline underline-offset-2">
              {totalReviews} avaliações
            </a>
          </div>

          <h1 className="font-display text-ink-950 m-0 mt-2 text-[28px] font-extrabold leading-[1.1] tracking-tight md:text-[34px]">
            {item.name}
          </h1>
          {item.tagline ? (
            <p className="text-ink-600 m-0 mt-2 text-[15px] leading-relaxed md:text-[16px]">
              {item.tagline}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px]">
            <div className="border-ink-100 rounded-lg border bg-white p-2.5">
              <strong className="text-ink-900 block text-[16px]">
                {item.averageRating?.toFixed(1).replace('.', ',') ?? 'Novo'}
              </strong>
              <span className="mt-0.5 flex justify-center">
                <span className="inline-flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(item.averageRating ?? 0)
                          ? 'fill-sun-500 text-sun-500 size-3'
                          : 'text-ink-300 size-3'
                      }
                      strokeWidth={2.4}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </span>
            </div>
            <div className="border-ink-100 rounded-lg border bg-white p-2.5">
              <strong className="text-ink-900 block text-[16px]">{totalReviews}</strong>
              avaliações
            </div>
            <div className="border-ink-100 rounded-lg border bg-white p-2.5">
              <strong className="text-ink-900 block text-[16px]">{gallery.length}</strong>
              fotos
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <TourismAdminEditLink href={`/painel/cidade/turismo/guias/${item.id}`} />
        </div>
      </header>

      {/* ─── Highlights ─── */}
      {item.highlights.length > 0 ? (
        <>
          <Divider />
          <div className="py-4">
            <GuideHighlights items={item.highlights} />
          </div>
        </>
      ) : null}

      {/* ─── Intro / About ─── */}
      {item.description ? (
        <>
          <Divider />
          <div id="sobre" className="scroll-mt-28" />
          <div className="px-4 py-5 md:px-6 lg:px-8">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="text-clay-500 size-5" strokeWidth={2} aria-hidden="true" />
              <h2 className="font-display text-ink-900 m-0 text-[22px] font-extrabold tracking-tight md:text-[26px]">
                Sobre
              </h2>
            </div>
            <div className="text-ink-700 space-y-3 text-[14px] leading-relaxed">
              {item.description
                .split('\n')
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i} className="m-0">
                    {p}
                  </p>
                ))}
            </div>
          </div>
        </>
      ) : null}

      {/* ─── Principais atrações (cadastro) ─── */}
      {principalAttractionRows.length > 0 ? (
        <>
          <Divider />
          <div id="atracoes" className="scroll-mt-28" />
          <div className="py-4">
            <GuidePrincipalAttractions rows={principalAttractionRows} />
          </div>
        </>
      ) : null}

      {/* ─── Vídeo (opcional) — mais abaixo: após intro e atrações em destaque ─── */}
      {guideVideoId ? (
        <>
          <Divider />
          <section id="video" className="scroll-mt-28 bg-white px-4 py-5 md:px-6 lg:px-8">
            <h2 className="font-display text-ink-900 m-0 text-[18px] font-bold tracking-tight md:text-[21px]">
              Conheça em vídeo
            </h2>
            <p className="text-muted-foreground m-0 mt-1 max-w-2xl text-[13px] leading-relaxed md:text-[14px]">
              Panorama ou tour deste destino no YouTube.
            </p>
            <div className="ring-clay-500/15 mx-auto mt-4 max-w-4xl overflow-hidden rounded-xl shadow-sm ring-1 ring-inset">
              <YouTubeEmbed url={item.youtubeUrl} title={`Vídeo: ${item.name}`} />
            </div>
          </section>
        </>
      ) : null}

      {/* ─── Dynamic Sections ─── */}
      {item.sections.map((section) => {
        const hasFares = section.fares && section.fares.length > 0;
        const hasDate = section.date !== null;
        const hasSeasons = section.seasons && section.seasons.length > 0;
        const hasPlaces = section.places && section.places.length > 0;
        const hasItems = section.items && section.items.length > 0;
        const hasExperiences = section.experiences && section.experiences.length > 0;

        return (
          <div key={section.id}>
            <Divider />
            <div id={section.id} className="scroll-mt-28" />
            <div className="py-4">
              {hasExperiences ? (
                <GuideExperiences
                  title={section.title}
                  subtitle={section.subtitle}
                  experiences={section.experiences!}
                />
              ) : hasFares ? (
                <GuideFerry
                  title={section.title}
                  subtitle={section.subtitle}
                  content={section.content}
                  fares={section.fares}
                  warning={section.warning}
                  cta={section.cta}
                />
              ) : hasDate ? (
                <GuideFestival
                  title={section.title}
                  subtitle={section.subtitle}
                  date={section.date}
                  description={section.description}
                  programHighlights={section.programHighlights}
                  tips={section.tips}
                />
              ) : hasSeasons ? (
                <GuideSeasons
                  title={section.title}
                  subtitle={section.subtitle}
                  seasons={section.seasons!}
                />
              ) : hasPlaces ? (
                <GuidePlaces
                  title={section.title}
                  subtitle={section.subtitle}
                  places={section.places!}
                />
              ) : hasItems ? (
                <GuideActivities
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.items!}
                />
              ) : section.content ? (
                <div className="px-4 md:px-6 lg:px-8">
                  <h2 className="font-display text-ink-900 m-0 mb-3 text-[22px] font-extrabold tracking-tight md:text-[26px]">
                    {section.title}
                  </h2>
                  {section.subtitle ? (
                    <p className="text-ink-600 m-0 mb-3 text-[14px]">{section.subtitle}</p>
                  ) : null}
                  <div className="text-ink-700 space-y-2 text-[13px] leading-relaxed">
                    {section.content.map((text, i) => (
                      <p key={i} className="m-0">
                        {text}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* ─── Content Blocks (Quote / Banner) ─── */}
      {item.contentBlocks.length > 0 ? (
        <>
          <Divider />
          <div className="py-4">
            <GuideContentBlocks blocks={item.contentBlocks} />
          </div>
        </>
      ) : null}

      {/* ─── Practical Info ─── */}
      {item.practicalInfo.length > 0 ? (
        <>
          <Divider />
          <div id="dicas" className="scroll-mt-28" />
          <div className="py-4">
            <GuidePracticalInfo title="Informações importantes" items={item.practicalInfo} />
          </div>
        </>
      ) : null}

      {/* ─── FAQ ─── */}
      {item.faq.length > 0 ? (
        <>
          <Divider />
          <div id="faq" className="scroll-mt-28" />
          <div className="py-4">
            <GuideFaq items={item.faq} />
          </div>
        </>
      ) : null}

      {/* ─── Photo Gallery ─── */}
      {gallery.length > 1 ? (
        <>
          <Divider />
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <AttractionPhotoGallery id="fotos" attractionName={item.name} photos={gallery} />
          </div>
        </>
      ) : null}

      {/* ─── Map ─── */}
      {item.lat && item.lng ? (
        <>
          <Divider />
          <div id="mapa" className="scroll-mt-28" />
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <h2 className="font-display text-ink-900 m-0 mb-3 text-[22px] font-extrabold tracking-tight md:text-[26px]">
              Localização
            </h2>
            <MapEmbed
              lat={item.lat}
              lng={item.lng}
              label={item.name}
              address={item.address}
              mapCategory="guia"
              mapPointId={item.id}
              analyticsContext={hiListing}
            />
          </div>
        </>
      ) : null}

      {/* ─── Reviews ─── */}
      <Divider />
      <div id="avaliacoes" className="scroll-mt-28" />
      <div className="py-4">
        <GuideReviews
          reviews={item.reviews}
          googleReviews={item.googleReviews}
          averageRating={item.averageRating}
          totalCount={item.reviewsCount}
        />
      </div>

      {/* ─── Explore more ─── */}
      <Divider />
      <Band className="px-4 py-4 md:px-6 lg:px-8">
        <section className="border-ink-100 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-clay-600 m-0 text-[12px] font-bold uppercase tracking-wide">
                Explore mais
              </p>
              <h2 className="text-ink-950 m-0 mt-1 text-[19px] font-bold leading-tight">
                Descubra mais de {city.name}
              </h2>
              <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                Veja atrações, onde ficar, onde comer e outros guias da região.
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

      {/* ─── Related Guides ─── */}
      {relatedGuides.length > 0 ? (
        <>
          <Divider />
          <div className="px-4 py-4 md:px-6 lg:px-8">
            <h2 className="font-display text-ink-900 m-0 mb-3 text-[20px] font-extrabold">
              Outros guias
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/turismo/guias/${guide.slug}`}
                  className="border-ink-100 group overflow-hidden rounded-xl border bg-white no-underline transition-shadow hover:shadow-md"
                >
                  {guide.coverUrl ? (
                    <div className="bg-paper-deep relative aspect-[16/9] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={guide.coverUrl}
                        alt={guide.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <div className="p-3">
                    <span className="text-clay-600 mb-1 block text-[11px] font-semibold uppercase">
                      {GUIDE_KIND_LABELS[guide.kind] ?? 'Guia'}
                    </span>
                    <h3 className="text-ink-900 m-0 text-[14px] font-bold">{guide.name}</h3>
                    {guide.tagline ? (
                      <p className="text-ink-600 m-0 mt-1 line-clamp-2 text-[12px]">
                        {guide.tagline}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* ─── Internal Links ─── */}
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
