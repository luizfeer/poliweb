import { notFound } from 'next/navigation';
import { Bath, BedDouble, Car, Heart, MapPin, Play, Ruler, Share2 } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { PropertyContactGate } from '@/components/public/contact/property-contact-gate';
import { StoryPhotoGallery, type StoryGalleryPhoto } from '@/components/public/media/story-photo-gallery';
import { Button } from '@/components/ui/button';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';
import { getPropertyBySlug, PROPERTY_TYPE_LABELS, formatCentsAsCurrency, type Property } from '@/lib/real-estate';
import { buildSocialImages } from '@/lib/seo/social-images';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, realEstateListingJsonLd } from '@/lib/seo/structured-data';
import { createInquiryAction, toggleFavoriteAction } from '../actions';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: 'Imóvel - Portal Carmelitano' };
  const socialImages = buildSocialImages({
    ogImageUrl: property.ogImageUrl,
    ogSquareImageUrl: property.ogSquareImageUrl,
    alt: property.title,
  });
  return {
    title: `${property.title} - Portal Carmelitano`,
    description: property.description || undefined,
    ...socialImages,
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const price =
    property.listingType === 'sale' ? property.price : (property.rentPrice ?? property.price);

  const site = resolvePublicSiteOrigin();
  const propertyUrl = `${site}/imoveis/${slug}`;
  const media = mediaForProperty(property);
  const cover = media[0] ?? null;

  return (
    <AppFrame>
      <JsonLdScript
        data={realEstateListingJsonLd({
          name: property.title,
          url: propertyUrl,
          description: property.description,
          price: price ? price / 100 : null,
          image: property.coverUrl ?? property.photos?.[0],
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Imóveis', url: `${site}/imoveis` },
          { name: property.title, url: propertyUrl },
        ])}
      />
      <AppHeader chips={['Imóveis', PROPERTY_TYPE_LABELS[property.propertyType]]} />
      <Band variant="paper-card">
        <div className="bg-cerrado-100 flex aspect-[16/10] items-center justify-center overflow-hidden">
          {cover ? (
            isVideoSrc(cover.src, cover.contentType) ? (
              <div className="relative h-full w-full">
                <video
                  src={cover.src}
                  poster={videoPosterUrl(cover.src) ?? undefined}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                  <Play className="h-12 w-12 fill-white" aria-hidden="true" />
                </span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.src} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <Ruler size={42} className="text-cerrado-700" />
          )}
        </div>
        <div className="space-y-3 px-3.5 py-4">
          <div>
            <p className="text-ink-900 m-0 text-[20px] font-extrabold">
              {price === null
                ? 'Preço sob consulta'
                : formatCentsAsCurrency(Math.round(price * 100))}
            </p>
            <h1 className="font-display m-0 mt-1 text-[25px] font-extrabold leading-tight">
              {property.title}
            </h1>
            {property.districtName && (
              <p className="text-ink-700 m-0 mt-2 flex items-center gap-1 text-[13px]">
                <MapPin size={15} />
                {property.districtName}
              </p>
            )}
          </div>

          <div className="text-ink-700 grid grid-cols-4 gap-2 text-center text-[12px]">
            <Metric
              icon={<Ruler size={16} />}
              label="Área"
              value={property.areaUsefulM2 ? `${Math.round(property.areaUsefulM2)} m²` : '-'}
            />
            <Metric
              icon={<BedDouble size={16} />}
              label="Quartos"
              value={property.bedrooms?.toString() ?? '-'}
            />
            <Metric
              icon={<Bath size={16} />}
              label="Banhos"
              value={property.bathrooms?.toString() ?? '-'}
            />
            <Metric
              icon={<Car size={16} />}
              label="Vagas"
              value={property.parkingSpaces?.toString() ?? '-'}
            />
          </div>

          <PropertyContactGate
            propertyId={property.id}
            propertySlug={property.slug}
            nextPath={`/imoveis/${property.slug}`}
            contactName={property.realtor?.name ?? null}
          />

          <div className="grid grid-cols-2 gap-2">
            <form action={toggleFavoriteAction}>
              <input type="hidden" name="property_id" value={property.id} />
              <input type="hidden" name="property_slug" value={property.slug} />
              <Button type="submit" variant="outline" className="w-full">
                <Heart size={16} />
                Favoritar
              </Button>
            </form>
            <Button type="button" variant="outline" className="w-full">
              <Share2 size={16} />
              Compartilhar
            </Button>
          </div>
        </div>
      </Band>

      {media.length > 1 ? (
        <>
          <Divider />
          <div className="px-3.5 py-4">
            <StoryPhotoGallery title={property.title} photos={media} />
          </div>
        </>
      ) : null}

      <Divider />

      <Band variant="paper-card" className="space-y-3 px-3.5 py-4">
        <h2 className="m-0 text-[18px] font-extrabold">Detalhes</h2>
        <p className="text-ink-700 m-0 whitespace-pre-line text-[14px] leading-relaxed">
          {property.description ?? 'Anunciante ainda não adicionou descrição.'}
        </p>
      </Band>

      <Divider />

      <Band variant="paper-card" className="space-y-3 px-3.5 py-4">
        <h2 className="m-0 text-[18px] font-extrabold">Tenho interesse</h2>
        <form action={createInquiryAction} className="space-y-2">
          <input type="hidden" name="property_id" value={property.id} />
          <input type="hidden" name="property_slug" value={property.slug} />
          <input
            name="requester_name"
            required
            placeholder="Seu nome"
            className="border-ink-200 h-10 w-full rounded-md border px-3 text-[14px]"
          />
          <input
            name="requester_phone"
            required
            placeholder="WhatsApp ou telefone"
            className="border-ink-200 h-10 w-full rounded-md border px-3 text-[14px]"
          />
          <input
            name="requester_email"
            type="email"
            placeholder="Email (opcional)"
            className="border-ink-200 h-10 w-full rounded-md border px-3 text-[14px]"
          />
          <textarea
            name="message"
            placeholder="Mensagem"
            rows={4}
            className="border-ink-200 w-full rounded-md border px-3 py-2 text-[14px]"
          />
          <Button type="submit" className="w-full">
            Enviar contato
          </Button>
        </form>
      </Band>

      <TabBar active="home" />
    </AppFrame>
  );
}

function mediaForProperty(property: Property): StoryGalleryPhoto[] {
  const urls = [property.coverUrl, ...property.photos, property.videoUrl].filter(
    (url): url is string => Boolean(url),
  );
  return Array.from(new Set(urls)).map((src) => ({ src }));
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-paper rounded-md p-2">
      <div className="text-clay-600 mx-auto flex justify-center">{icon}</div>
      <p className="m-0 mt-1 font-bold">{value}</p>
      <p className="text-ink-600 m-0 text-[10px]">{label}</p>
    </div>
  );
}
