import { notFound } from 'next/navigation';
import { Utensils } from 'lucide-react';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { TracedLink } from '@/components/analytics/traced-link';
import { MapEmbed } from '@/components/public/tourism/map-embed';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { getCurrentCity } from '@/lib/cities';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { getRestaurantBySlug } from '@/lib/tourism';
import { buildSocialImages } from '@/lib/seo/social-images';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, restaurantJsonLd } from '@/lib/seo/structured-data';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const item = await getRestaurantBySlug({ slug });
  if (!item) return { title: 'Onde comer' };
  const socialImages = buildSocialImages({
    ogImageUrl: item.ogImageUrl,
    ogSquareImageUrl: item.ogSquareImageUrl,
    alt: item.name,
  });
  return {
    title: `${item.name} - Onde comer`,
    description: item.description || undefined,
    ...socialImages,
  };
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const { slug } = await params;
  const item = await getRestaurantBySlug({ city_id: city.id, slug });
  if (!item) notFound();

  const hiListing = {
    entity_type: 'restaurant',
    entity_slug: slug,
    entity_id: item.id,
  };

  const site = resolvePublicSiteOrigin();
  const restaurantUrl = `${site}/turismo/onde-comer/${slug}`;

  return (
    <AppFrame>
      <JsonLdScript
        data={restaurantJsonLd({
          name: item.name,
          url: restaurantUrl,
          description: item.description,
          image: item.coverUrl ?? item.photos?.[0],
          priceRange: item.priceRange,
          telephone: item.whatsapp ?? item.phone,
          servesCuisine: item.cuisine.join(', ') || null,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Turismo', url: `${site}/turismo` },
          { name: 'Onde comer', url: `${site}/turismo/onde-comer` },
          { name: item.name, url: restaurantUrl },
        ])}
      />
      <HimetricaPageView
        key={slug}
        event={HI_METRICA_EVENTS.tourism_listing_viewed}
        payload={{ kind: 'eat', ...hiListing }}
      />
      <AppHeader chips={['Onde comer', ...item.cuisine.slice(0, 3)]} />
      <Band variant="paper-card" className="px-3.5 py-4">
        <div className="mb-3 flex justify-between gap-3">
          <span className="bg-clay-50 text-clay-700 inline-flex size-10 items-center justify-center rounded-md">
            <Utensils className="size-5" aria-hidden="true" />
          </span>
          <TourismAdminEditLink href={`/painel/turismo/restaurantes/${item.id}`} />
        </div>
        <h1 className="font-display m-0 text-[28px] font-extrabold">{item.name}</h1>
        <p className="text-ink-700 m-0 mt-1 text-[14px]">
          {item.description ?? (item.cuisine.join(' · ') || 'Restaurante em atualização.')}
        </p>
        {item.aiSummary ? (
          <p className="m-0 mt-2 text-[12px] font-bold text-sky-700">
            Resumido por IA — sujeito a verificação
          </p>
        ) : null}
      </Band>
      <Divider />
      <Band className="space-y-4 px-3.5 py-4">
        <MapEmbed
          lat={item.lat}
          mapCategory="restaurante"
          mapPointId={item.id}
          lng={item.lng}
          label={item.name}
          address={[item.address, item.districtName].filter(Boolean).join(' · ') || null}
          analyticsContext={hiListing}
        />
        <div className="flex flex-wrap gap-2">
          {item.whatsapp ? (
            <TracedLink
              className="bg-cerrado-700 rounded-md px-3 py-2 text-[13px] font-bold text-white no-underline"
              href={`https://wa.me/55${item.whatsapp.replace(/\D/g, '')}`}
              trackEvent={HI_METRICA_EVENTS.contact_whatsapp_click}
              trackPayload={hiListing}
            >
              WhatsApp
            </TracedLink>
          ) : null}
          {item.phone ? (
            <TracedLink
              className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline"
              href={`tel:${item.phone.replace(/\D/g, '')}`}
              trackEvent={HI_METRICA_EVENTS.contact_phone_click}
              trackPayload={hiListing}
            >
              Ligar
            </TracedLink>
          ) : null}
          {item.ifoodUrl ? (
            <a
              className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline"
              href={item.ifoodUrl}
            >
              iFood
            </a>
          ) : null}
        </div>
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
