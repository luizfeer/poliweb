import { Link } from '@/components/navigation/link';
import { HimetricaPageView } from '@/components/analytics/himetrica-page-view';
import { TracedLink } from '@/components/analytics/traced-link';
import { Truck, UtensilsCrossed } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  AppFrame,
  CoverCardRow,
  CoverCardRowItem,
  DetailHeader,
  Divider,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import {
  AmenitiesList,
  BusinessCoverCard,
  BusinessHeader,
  ContactBar,
  ContactDetailsBlock,
  GoogleImportDetailsBlock,
  HoursTable,
  PaymentMethodsList,
  visibleBusinessAmenities,
} from '@/components/carmo/business';
import {
  CATEGORY_BY_SLUG,
  getBusinessBySlug,
  listBusinessPromotions,
  listBusinessReviews,
  listByCategory,
  getBusinessDisplayPhotoUrls,
} from '@/lib/businesses';
import { listRecentEntityPosts } from '@/lib/posts/queries';
import { EntityPostsSection } from '@/components/public/entity-posts/entity-posts-section';
import { AttractionPhotoGallery } from '@/components/public/tourism/attraction-photo-gallery';
import { getProfile, hasRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { OwnerQuickActions } from '@/components/admin/media/owner-quick-actions';
import { BusinessPromoBanner } from '@/components/marketing/business-promo-banner';
import { BusinessDescription } from './business-description';
import { MapEmbed } from '@/components/public/tourism/map-embed';
import { ClaimModal } from './claim-modal';
import { ReportErrorModal } from './report-error-modal';
import { ReviewPrompt } from './review-prompt';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { buildSocialImages } from '@/lib/seo/social-images';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/seo/structured-data';

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function canEditBusiness(businessId: string) {
  const [auth, city] = await Promise.all([getProfile(), getCurrentCity()]);
  if (!auth || !city) return false;
  if (hasRole(auth.roles, ['city_admin', 'super_admin'], city.id)) return true;

  const supabase = await createClient();
  const { data: managesBusiness } = await supabase.rpc('manages_business', {
    p_business_id: businessId,
  });

  return Boolean(managesBusiness);
}

async function isBusinessFavorited(businessId: string) {
  const auth = await getProfile();
  if (!auth) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from('business_favorites')
    .select('business_id')
    .eq('business_id', businessId)
    .eq('profile_id', auth.profile.id)
    .maybeSingle();

  return Boolean(data);
}

async function listRelatedFavoriteIds(related: { id: string }[]): Promise<Set<string>> {
  if (related.length === 0) return new Set();
  const auth = await getProfile();
  if (!auth) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_favorites')
    .select('business_id')
    .eq('profile_id', auth.profile.id)
    .in(
      'business_id',
      related.map((b) => b.id),
    );

  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.business_id));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const b = await getBusinessBySlug(slug);
  if (!b) return { title: 'Negócio não encontrado' };
  const socialImages = buildSocialImages({
    ogImageUrl: b.ogImageUrl,
    ogSquareImageUrl: b.ogSquareImageUrl,
    alt: b.name,
  });
  return {
    title: `${b.name} — Portal Carmelitano`,
    description: b.shortDescription ?? `${b.name} em ${b.district ?? 'Carmo do Rio Claro'}.`,
    ...socialImages,
  };
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const primaryCat = CATEGORY_BY_SLUG[business.categories[0]];
  const visibleAmenities = visibleBusinessAmenities(business);
  const googleImport = business.googleImportSource;
  const businessPhotos = business.photos ?? [];
  const displayPhotoUrls = getBusinessDisplayPhotoUrls(business);
  const hasGoogleImportDetails = Boolean(
    googleImport &&
    (googleImport.rating !== undefined ||
      Boolean(googleImport.streetViewUrl) ||
      Boolean(googleImport.priceRange) ||
      Boolean(googleImport.priceLevel) ||
      googleImport.openNow !== undefined ||
      (googleImport.summaries?.length ?? 0) > 0 ||
      (googleImport.approvedReviews?.length ?? 0) > 0),
  );
  const [promotions, reviews, related, posts] = await Promise.all([
    listBusinessPromotions(business.id),
    listBusinessReviews(business.id),
    primaryCat
      ? listByCategory(primaryCat.slug, { limit: 6 }).then((items) =>
          items.filter((b) => b.id !== business.id).slice(0, 5),
        )
      : Promise.resolve([]),
    listRecentEntityPosts('business', business.id, 5),
  ]);
  const [canEdit, isFavorited, favoritedRelatedIds] = await Promise.all([
    canEditBusiness(business.id),
    isBusinessFavorited(business.id),
    listRelatedFavoriteIds(related),
  ]);

  const site = resolvePublicSiteOrigin();
  const businessUrl = `${site}/comercio/negocio/${business.slug}`;

  return (
    <AppFrame>
      <JsonLdScript
        data={localBusinessJsonLd({
          name: business.name,
          url: businessUrl,
          description: business.shortDescription ?? business.description ?? null,
          telephone: business.whatsapp ?? business.phone ?? null,
          image: business.coverUrl ?? null,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Comércio', url: `${site}/comercio` },
          ...(primaryCat ? [{ name: primaryCat.name, url: `${site}/comercio/${primaryCat.slug}` }] : []),
          { name: business.name, url: businessUrl },
        ])}
      />
      <HimetricaPageView
        key={business.slug}
        event={HI_METRICA_EVENTS.business_profile_viewed}
        payload={{
          entity_slug: business.slug,
          entity_id: business.id,
          category_slug: business.categories[0] ?? undefined,
        }}
      />
      <DetailHeader
        title={business.name}
        backHref={primaryCat ? `/comercio/${primaryCat.slug}` : '/comercio'}
        backLabel="Voltar para comércio"
        links={[
          ...(business.description ? [{ label: 'Sobre', href: '#sobre' as const }] : []),
          { label: 'Contato', href: '#contato' },
          ...(business.hours && Object.keys(business.hours).length > 0
            ? [{ label: 'Horários', href: '#horarios' as const }]
            : []),
          ...(businessPhotos.length > 0 ? [{ label: 'Fotos', href: '#fotos' as const }] : []),
          ...(business.lat && business.lng ? [{ label: 'Mapa', href: '#mapa' as const }] : []),
          { label: 'Avaliações', href: '#avaliacoes' },
        ]}
      />

      {canEdit ? (
        <>
          <div
            hidden
            data-native-business-actions
            data-business-id={business.id}
            data-business-name={business.name}
            data-admin-path={`/painel/comercio/${business.id}`}
            data-posts-path={`/painel/comercio/${business.id}/novidades`}
          />
          <div data-hide-in-embedded-app>
            <OwnerQuickActions
              entityType="business"
              entityId={business.id}
              adminPath={`/painel/comercio/${business.id}`}
              postsPath={`/painel/comercio/${business.id}/novidades`}
              label={business.name}
            />
          </div>
        </>
      ) : (
        <BusinessPromoBanner variant="slim" />
      )}

      <BusinessHeader business={business} isFavorited={isFavorited} />

      {/* CTA de cardápio/delivery — exibido para negócios com categorias de alimentação */}
      {business.orderingEnabled && (
        <div className="border-ink-100 flex gap-2 border-b px-4 py-3 md:px-6 lg:px-8">
          <Link
            href={`/comercio/negocio/${business.slug}/cardapio`}
            className="bg-clay-500 hover:bg-clay-600 active:bg-clay-700 flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition-colors"
          >
            <UtensilsCrossed size={17} strokeWidth={2.2} />
            Ver cardápio e pedir
          </Link>
          {business.whatsapp && (
            <TracedLink
              href={`https://wa.me/55${business.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20bc5a]"
              trackEvent={HI_METRICA_EVENTS.contact_whatsapp_click}
              trackPayload={{
                entity_type: 'business',
                entity_slug: business.slug,
                entity_id: business.id,
                context: 'delivery_cta',
              }}
            >
              <Truck size={16} strokeWidth={2.2} />
              Delivery
            </TracedLink>
          )}
        </div>
      )}

      <ContactBar
        phone={business.phone}
        whatsapp={business.whatsapp}
        googleMapsUrl={business.googleMapsUrl}
        shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/comercio/negocio/${business.slug}`}
        className="my-4"
        businessId={business.id}
        cityId={business.cityId}
        businessSlug={business.slug}
      />

      {promotions.length > 0 && (
        <>
          <Divider />
          <SectionHeader title="Promoções ativas" kicker="Cupons e ofertas" />
          <div className="grid gap-2 px-4 md:px-6 lg:px-8">
            {promotions.map((promotion) => (
              <article
                key={promotion.id}
                className="border-clay-200 bg-clay-50 rounded-md border p-3"
              >
                <div className="text-ink-900 text-[14px] font-bold">{promotion.title}</div>
                {promotion.description && (
                  <p className="text-ink-700 m-0 mt-1 text-[12px] leading-snug">
                    {promotion.description}
                  </p>
                )}
                <div className="text-clay-700 mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  {promotion.discountPercent ? <span>{promotion.discountPercent}% OFF</span> : null}
                  {promotion.couponCode ? <span>Cupom: {promotion.couponCode}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Categorias secundárias */}
      {business.categories.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5 px-4 md:px-6 lg:px-8">
          {business.categories.slice(1).map((slug) => {
            const cat = CATEGORY_BY_SLUG[slug];
            if (!cat) return null;
            return (
              <Link
                key={slug}
                href={`/comercio/${slug}`}
                className="bg-clay-50 text-clay-600 hover:bg-clay-100 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      )}

      {posts.length > 0 && (
        <>
          <Divider />
          <SectionHeader title="Novidades" />
          <div className="px-4 md:px-6 lg:px-8">
            <EntityPostsSection posts={posts} />
          </div>
        </>
      )}

      {business.description && (
        <>
          <Divider />
          <div id="sobre" className="scroll-mt-28" />
          <SectionHeader title="Sobre o negócio" />
          <BusinessDescription text={business.description} />
        </>
      )}

      <Divider />
      <div id="contato" className="scroll-mt-28" />
      <SectionHeader title="Contato e endereço" />
      <ContactDetailsBlock business={business} />
      <ReportErrorModal businessId={business.id} businessName={business.name} />

      {hasGoogleImportDetails ? (
        <>
          <Divider />
          <div id="google" className="scroll-mt-28" />
          <SectionHeader title="Dados do Google" />
          <GoogleImportDetailsBlock business={business} />
        </>
      ) : null}

      {business.lat && business.lng && (
        <>
          <Divider />
          <div id="mapa" className="scroll-mt-28" />
          <SectionHeader title="Mapa" />
          <div className="px-4 md:px-6 lg:px-8">
            <MapEmbed
              lat={business.lat ?? null}
              mapCategory="comercio"
              mapPointId={business.id}
              lng={business.lng ?? null}
              label={business.name}
              address={[business.address, business.district].filter(Boolean).join(' · ') || null}
              analyticsContext={{
                entity_type: 'business',
                entity_slug: business.slug,
                entity_id: business.id,
              }}
            />
          </div>
        </>
      )}

      {business.hours && Object.keys(business.hours).length > 0 && (
        <>
          <Divider />
          <div id="horarios" className="scroll-mt-28" />
          <SectionHeader title="Horários" kicker="Funcionamento" />
          <HoursTable hours={business.hours} />
        </>
      )}

      {visibleAmenities.length > 0 && (
        <>
          <Divider />
          <SectionHeader title="Comodidades" />
          <AmenitiesList amenities={visibleAmenities} className="px-4 md:px-6 lg:px-8" />
        </>
      )}

      {business.paymentMethods && business.paymentMethods.length > 0 && (
        <>
          <Divider />
          <SectionHeader title="Formas de pagamento" />
          <PaymentMethodsList methods={business.paymentMethods} className="px-4 md:px-6 lg:px-8" />
        </>
      )}

      <Divider />
      <div id="avaliacoes" className="scroll-mt-28" />
      <SectionHeader title="Avaliações" kicker={`${reviews.length} publicadas`} />
      <div className="space-y-2 px-4 md:px-6 lg:px-8">
        {reviews.length === 0 ? (
          <p className="text-ink-700 m-0 text-[13px]">Ainda não há avaliações publicadas.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="border-ink-100 rounded-md border bg-white p-3">
              <div className="text-ink-900 text-[12px] font-semibold">
                {'★'.repeat(review.rating)}{' '}
                <span className="text-ink-500">por {review.authorName ?? 'cidadão'}</span>
              </div>
              {review.title && (
                <div className="text-ink-900 mt-1 text-[14px] font-bold">{review.title}</div>
              )}
              {review.comment && (
                <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                  {review.comment}
                </p>
              )}
              {review.photoUrl && (
                <a
                  href={review.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-ink-100 mt-2 block overflow-hidden rounded-md border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={review.photoUrl}
                    alt={review.title ?? `Foto da avaliação de ${business.name}`}
                    className="h-36 w-full object-cover"
                  />
                </a>
              )}
              {review.replyOwner && (
                <blockquote className="bg-paper-deep text-ink-700 mt-2 rounded-md p-2 text-[12px]">
                  Resposta do negócio: {review.replyOwner}
                </blockquote>
              )}
            </article>
          ))
        )}
      </div>

      {businessPhotos.length > 0 ? (
        <>
          <Divider />
          <div id="fotos" className="scroll-mt-28" />
          <div className="px-4 md:px-6 lg:px-8">
            <AttractionPhotoGallery
              attractionName={business.name}
              photos={displayPhotoUrls.map((src) => ({ src }))}
              photoAnchorPrefix="foto"
            />
          </div>
        </>
      ) : null}

      <ReviewPrompt businessId={business.id} businessName={business.name} />

      {!business.claimed && <ClaimModal businessId={business.id} businessName={business.name} />}

      {related.length > 0 && (
        <>
          <Divider />
          <SectionHeader
            title={`Outros em ${primaryCat?.name ?? 'comércio'}`}
            action={
              primaryCat ? { label: 'Ver todos', href: `/comercio/${primaryCat.slug}` } : undefined
            }
          />
          <CoverCardRow>
            {related.map((b) => (
              <CoverCardRowItem key={b.id}>
                <BusinessCoverCard
                  business={b}
                  isFavorited={favoritedRelatedIds.has(b.id)}
                />
              </CoverCardRowItem>
            ))}
          </CoverCardRow>
        </>
      )}

      <TabBar active="comercio" />
    </AppFrame>
  );
}
