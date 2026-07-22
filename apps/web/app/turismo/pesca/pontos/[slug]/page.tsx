import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { MapEmbed } from '@/components/public/tourism/map-embed';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { getCurrentCity } from '@/lib/cities';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { getFishingSpotBySlug } from '@/lib/tourism';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, touristAttractionJsonLd } from '@/lib/seo/structured-data';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return { title: 'Ponto de pesca' };
  const { slug } = await params;
  const item = await getFishingSpotBySlug({ city_id: city.id, slug });
  if (!item) return { title: 'Ponto de pesca não encontrado' };
  const species = item.species.slice(0, 3).join(', ');
  return buildMetadata({
    title: `${item.name} — Pesca esportiva no Lago de Furnas`,
    description:
      item.description ??
      `Ponto de pesca ${item.name} no Lago de Furnas, Carmo do Rio Claro/MG${species ? `. Espécies: ${species}` : ''}.`,
    path: `/turismo/pesca/pontos/${slug}`,
    image: item.coverUrl ?? item.photos?.[0] ?? undefined,
  });
}

export default async function FishingSpotDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const { slug } = await params;
  const item = await getFishingSpotBySlug({ city_id: city.id, slug });
  if (!item) notFound();

  const hiListing = {
    entity_type: 'fishing_spot',
    entity_slug: slug,
    entity_id: item.id,
  };

  const site = resolvePublicSiteOrigin();
  const url = `${site}/turismo/pesca/pontos/${slug}`;

  return (
    <AppFrame>
      <JsonLdScript
        data={touristAttractionJsonLd({
          name: item.name,
          url,
          description: item.description,
          image: item.coverUrl ?? item.photos?.[0],
          latitude: item.lat,
          longitude: item.lng,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Turismo', url: `${site}/turismo` },
          { name: 'Pesca', url: `${site}/turismo/pesca` },
          { name: 'Pontos', url: `${site}/turismo/pesca/pontos` },
          { name: item.name, url },
        ])}
      />
      <HimetricaPageView
        key={slug}
        event={HI_METRICA_EVENTS.tourism_listing_viewed}
        payload={{ kind: 'fishing_spot', ...hiListing }}
      />
      <AppHeader chips={item.species.slice(0, 4)} />
      <Band variant="paper-card" className="px-3.5 py-4">
        <div className="mb-3 flex justify-end">
          <TourismAdminEditLink href={`/painel/cidade/turismo/pesca?ponto=${item.id}`} />
        </div>
        <h1 className="font-display m-0 text-[28px] font-extrabold">{item.name}</h1>
        <p className="text-ink-700 m-0 mt-1 text-[14px]">{item.description}</p>
      </Band>
      <Divider />
      <Band className="space-y-3 px-3.5 py-4">
        <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
          Espécies: {item.species.join(' · ') || 'em atualização'}
        </p>
        {item.regulations && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">{item.regulations}</p>
        )}
        {item.defesoPeriod && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
            Defeso: {item.defesoPeriod}
          </p>
        )}
        <MapEmbed
          lat={item.lat}
          lng={item.lng}
          label={item.name}
          mapCategory="pesca"
          mapPointId={item.id}
          analyticsContext={hiListing}
        />
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
