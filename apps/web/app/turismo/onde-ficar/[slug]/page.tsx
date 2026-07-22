import { notFound } from 'next/navigation';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { TracedLink } from '@/components/analytics/traced-link';
import { AmenitiesGrid } from '@/components/public/tourism/amenities-grid';
import { MapEmbed } from '@/components/public/tourism/map-embed';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { getAccommodationBySlug } from '@/lib/tourism';
import { buildSocialImages } from '@/lib/seo/social-images';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, lodgingBusinessJsonLd } from '@/lib/seo/structured-data';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const item = await getAccommodationBySlug({ slug });
  if (!item) return { title: 'Hospedagem' };
  const socialImages = buildSocialImages({
    ogImageUrl: item.ogImageUrl,
    ogSquareImageUrl: item.ogSquareImageUrl,
    alt: item.name,
  });
  return {
    title: `${item.name} - Turismo`,
    description: item.shortDescription || item.description || undefined,
    ...socialImages,
  };
}

export default async function AccommodationDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const { slug } = await params;
  const item = await getAccommodationBySlug({ city_id: city.id, slug });
  if (!item) notFound();

  const hiListing = {
    entity_type: 'accommodation',
    entity_slug: slug,
    entity_id: item.id,
  };

  const site = resolvePublicSiteOrigin();
  const accommodationUrl = `${site}/turismo/onde-ficar/${slug}`;
  const priceRange =
    item.priceMin && item.priceMax
      ? `R$ ${item.priceMin} – R$ ${item.priceMax}`
      : item.priceMin
        ? `A partir de R$ ${item.priceMin}`
        : null;

  return (
    <AppFrame>
      <JsonLdScript
        data={lodgingBusinessJsonLd({
          name: item.name,
          url: accommodationUrl,
          description: item.shortDescription ?? item.description,
          image: item.coverUrl,
          telephone: item.whatsapp ?? item.phone,
          priceRange,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Turismo', url: `${site}/turismo` },
          { name: 'Onde ficar', url: `${site}/turismo/onde-ficar` },
          { name: item.name, url: accommodationUrl },
        ])}
      />
      <HimetricaPageView
        key={slug}
        event={HI_METRICA_EVENTS.tourism_listing_viewed}
        payload={{ kind: 'stay', ...hiListing }}
      />
      <AppHeader chips={['Hospedagem', item.type, item.nearLake ? 'Pé na água' : 'Turismo']} />
      <Band variant="paper-card" className="px-3.5 py-4">
        <div className="mb-3 flex justify-end">
          <TourismAdminEditLink href={`/painel/turismo/acomodacoes/${item.id}`} />
        </div>
        <h1 className="font-display m-0 text-[28px] font-extrabold">{item.name}</h1>
        <p className="text-ink-700 m-0 mt-1 text-[14px]">{item.shortDescription ?? item.type}</p>
        {item.aiSummary && (
          <p className="m-0 mt-2 text-[12px] font-bold text-sky-700">
            Resumido por IA — sujeito a verificação
          </p>
        )}
      </Band>
      <Divider />
      <Band className="space-y-4 px-3.5 py-4">
        {item.description && <p className="text-ink-800 m-0 text-[14px]">{item.description}</p>}
        <AmenitiesGrid items={item.amenities} />
        <MapEmbed
          lat={item.lat}
          mapCategory="pousada"
          mapPointId={item.id}
          lng={item.lng}
          label={item.name}
          address={[item.address, item.districtName].filter(Boolean).join(' · ') || null}
          analyticsContext={hiListing}
        />
        <div className="flex flex-wrap gap-2">
          {item.whatsapp && (
            <TracedLink
              className="bg-cerrado-700 rounded-md px-3 py-2 text-[13px] font-bold text-white no-underline"
              href={`https://wa.me/55${item.whatsapp.replace(/\D/g, '')}`}
              trackEvent={HI_METRICA_EVENTS.contact_whatsapp_click}
              trackPayload={hiListing}
            >
              WhatsApp
            </TracedLink>
          )}
          {item.bookingUrl && (
            <a
              className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline"
              href={item.bookingUrl}
            >
              Booking
            </a>
          )}
          {item.airbnbUrl && (
            <a
              className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline"
              href={item.airbnbUrl}
            >
              Airbnb
            </a>
          )}
          {item.phone && (
            <TracedLink
              className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline"
              href={`tel:${item.phone.replace(/\D/g, '')}`}
              trackEvent={HI_METRICA_EVENTS.contact_phone_click}
              trackPayload={hiListing}
            >
              Ligar
            </TracedLink>
          )}
        </div>
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
