import { notFound } from 'next/navigation';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { TracedLink } from '@/components/analytics/traced-link';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { buildSocialImages } from '@/lib/seo/social-images';
import { getFishingGuideBySlug } from '@/lib/tourism';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return {};
  const { slug } = await params;
  const item = await getFishingGuideBySlug({ city_id: city.id, slug });
  if (!item) return { title: 'Guia de pesca' };
  const socialImages = buildSocialImages({
    ogImageUrl: item.ogImageUrl,
    ogSquareImageUrl: item.ogSquareImageUrl,
    alt: item.fullName,
  });
  return {
    title: `${item.fullName} - Portal Carmelitano`,
    description: item.about || undefined,
    ...socialImages,
  };
}

export default async function FishingGuideDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const { slug } = await params;
  const item = await getFishingGuideBySlug({ city_id: city.id, slug });
  if (!item) notFound();

  const hiListing = {
    entity_type: 'fishing_guide',
    entity_slug: slug,
    entity_id: item.id,
  };

  return (
    <AppFrame>
      <HimetricaPageView
        key={slug}
        event={HI_METRICA_EVENTS.tourism_listing_viewed}
        payload={{ kind: 'fishing_guide', ...hiListing }}
      />
      <AppHeader chips={['Guia', item.hasBoat ? 'Com barco' : 'Pesca']} />
      <Band variant="paper-card" className="px-3.5 py-4">
        <div className="mb-3 flex justify-end">
          <TourismAdminEditLink href={`/painel/cidade/turismo/pesca?guia=${item.id}`} />
        </div>
        <h1 className="font-display m-0 text-[28px] font-extrabold">{item.fullName}</h1>
        <p className="text-ink-700 m-0 mt-1 text-[14px]">
          {item.about ?? 'Guia de pesca esportiva.'}
        </p>
      </Band>
      <Divider />
      <Band className="space-y-3 px-3.5 py-4">
        <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
          Serviços: {item.services.join(' · ') || 'sob consulta'}
        </p>
        {item.licenseNumber && (
          <p className="text-ink-700 m-0 rounded-md bg-white p-3 text-[13px]">
            Licença: {item.licenseNumber}
          </p>
        )}
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
