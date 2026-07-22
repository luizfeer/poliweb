import { ImageResponse } from 'next/og';
import { getCurrentCity } from '@/lib/cities';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { getAttractionFullBySlug } from '@/lib/tourism';
import type { AttractionFull, GoogleAttractionPhoto } from '@/lib/tourism/types';

/** OG roda sem `NEXT_PUBLIC_SITE_URL` no Vercel — fallback pra URL do deploy. */
export const runtime = 'nodejs';

export const alt = 'Atração turística — Portal Carmelitano';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TYPE_LABELS: Record<string, string> = {
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

function formatType(value: string) {
  return TYPE_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

function publicTourismUrl(path: string) {
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/tourism/${path}`;
}

function googlePhotoUrl(
  photo: GoogleAttractionPhoto,
  siteOrigin: string,
  width = 900,
): string | null {
  if (photo.url) return photo.url;
  if (!photo.name.startsWith('places/') || !photo.name.includes('/photos/')) return null;
  return `${siteOrigin}/api/google-place-photo?name=${encodeURIComponent(photo.name)}&w=${width}`;
}

function clipText(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function taglineForOg(item: AttractionFull, cityName: string, typeLabel: string): string {
  const base =
    item.description ??
    item.googleSummary ??
    `${typeLabel} em ${cityName}: horários, como chegar e o que levar — pelo guia local Portal Carmelitano.`;
  return clipText(base, 142);
}

function heroImageUrl(item: AttractionFull, siteOrigin: string): string | null {
  const candidates: Array<string | null | undefined> = [
    item.coverUrl,
    item.photos[0],
    item.publicPhotos[0]?.storagePath,
  ];
  for (const c of candidates) {
    if (c) return publicTourismUrl(c);
  }
  for (const photo of item.googlePhotos) {
    const url = googlePhotoUrl(photo, siteOrigin);
    if (url) return url;
  }
  return null;
}

async function probeHeroUrl(heroUrl: string | null): Promise<string | null> {
  if (!heroUrl) return null;
  try {
    const res = await fetch(heroUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) return null;
    return heroUrl;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const city = await getCurrentCity();
    if (!city) return fallbackImage('Portal Carmelitano', 'Atrações turísticas');

    const item = await getAttractionFullBySlug({ city_id: city.id, slug });
    if (!item) return fallbackImage(city.name, 'Atrações turísticas');

    const siteOrigin = resolvePublicSiteOrigin();
    const rawHeroUrl = heroImageUrl(item, siteOrigin);
    const heroUrl = await probeHeroUrl(rawHeroUrl);
    const typeLabel = formatType(item.type);
    const tagline = taglineForOg(item, city.name, typeLabel);
    const rating =
      item.averageRating != null
        ? `${item.averageRating.toFixed(1).replace('.', ',')} · avaliações`
        : 'Confira no Portal Carmelitano';

    return renderImage({
      heroUrl,
      cityName: city.name,
      title: item.name,
      tagline,
      typeLabel,
      rating,
    });
  } catch (error) {
    console.error('[og:attraction] failed to render', error);
    return fallbackImage('Portal Carmelitano', 'Atrações turísticas');
  }
}

function fallbackImage(cityName: string, subtitle: string) {
  return renderImage({
    heroUrl: null,
    cityName,
    title: subtitle,
    tagline: `Descubra atrações, pousadas e roteiros em ${cityName}.`,
    typeLabel: 'Portal Carmelitano',
    rating: 'carmolocal.com.br',
  });
}

type RenderInput = {
  heroUrl: string | null;
  cityName: string;
  title: string;
  tagline: string;
  typeLabel: string;
  rating: string;
};

function renderImage({ heroUrl, cityName, title, tagline, typeLabel, rating }: RenderInput) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
        }}
      >
        {heroUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={heroUrl}
              width={1200}
              height={630}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(115deg, rgba(31,74,44,0.92) 0%, rgba(25,25,25,0.78) 42%, rgba(25,25,25,0.55) 100%)',
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #1F4A2C 0%, #C84810 52%, #FAF8F5 100%)',
            }}
          />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            padding: 56,
            paddingBottom: 52,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,209,191,0.95)',
              }}
            >
              Portal Carmelitano · {cityName}
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                maxWidth: 980,
                color: '#FFF5EE',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: 'rgba(250,248,245,0.92)',
                maxWidth: 920,
                lineHeight: 1.35,
              }}
            >
              {tagline}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#F4B73A',
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: '2px solid rgba(244,183,58,0.55)',
                  background: 'rgba(31,74,44,0.35)',
                }}
              >
                {typeLabel}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(250,248,245,0.88)' }}>
                {rating}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
