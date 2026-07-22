import { Link } from '@/components/navigation/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AtSign, ChevronLeft, Church, Clock, MapPin, Phone, Star, UserRound } from 'lucide-react';
import {
  ClaimChurchCallout,
  ChurchPhotoGallery,
  WeeklyChurchCalendar,
} from '@/components/public/churches';
import { AppFrame, DetailHeader } from '@/components/carmo';
import { getProfile, hasRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { buildSocialImages } from '@/lib/seo/social-images';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/seo/structured-data';
import {
  formatInstagramHandle,
  getChurchBySlug,
  getInstagramUrl,
  listChurchReviews,
  listScheduleByChurchSlug,
} from '@/lib/churches';
import { listRecentEntityPosts } from '@/lib/posts/queries';
import { EntityPostsSection } from '@/components/public/entity-posts/entity-posts-section';
import { AdminEditLink } from '@/components/public/admin-edit-link';
import { ChurchReviewPrompt } from './review-prompt';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const traditionLabel = {
  catolica: 'Igreja Católica',
  evangelica: 'Igreja Evangélica',
  adventista: 'Igreja Adventista',
  outra: 'Comunidade religiosa',
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const church = await getChurchBySlug(slug);
  if (!church) return { title: 'Igreja não encontrada' };

  const socialImages = buildSocialImages({
    ogImageUrl: church.ogImageUrl,
    ogSquareImageUrl: church.ogSquareImageUrl,
    alt: church.name,
  });
  return {
    title: `${church.name} - Portal Carmelitano`,
    description: church.shortDescription,
    ...socialImages,
  };
}

export default async function ChurchDetailPage({ params }: PageProps) {
  const [{ slug }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city || !city.modules.includes('community')) notFound();

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const [schedule, reviews, auth, posts] = await Promise.all([
    listScheduleByChurchSlug(church.slug),
    listChurchReviews(church.id),
    getProfile(),
    listRecentEntityPosts('church', church.id, 5),
  ]);
  const canEdit = Boolean(
    auth && hasRole(auth.roles, ['city_admin', 'super_admin', 'moderator'], city.id),
  );
  const confirmedCount = schedule.filter((item) => item.sourceStatus === 'confirmed').length;
  const hasCover = Boolean(church.coverUrl);

  const site = resolvePublicSiteOrigin();
  const churchUrl = `${site}/comunidade/igrejas/${church.slug}`;

  return (
    <AppFrame className="bg-paper overflow-x-hidden">
      <JsonLdScript
        data={{
          ...localBusinessJsonLd({
            name: church.name,
            url: churchUrl,
            description: church.shortDescription ?? null,
            telephone: church.phone ?? null,
            image: church.coverUrl ?? null,
          }),
          '@type': 'Church',
        }}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Comunidade', url: `${site}/comunidade` },
          { name: 'Igrejas', url: `${site}/comunidade/igrejas` },
          { name: church.name, url: churchUrl },
        ])}
      />
      <DetailHeader
        title={church.name}
        backHref="/comunidade"
        backLabel="Voltar para comunidade"
        links={[
          { label: 'Informações', href: '#informacoes' },
          ...(church.photos && church.photos.length > 0
            ? [{ label: 'Fotos', href: '#fotos' as const }]
            : []),
          ...(schedule.length > 0 ? [{ label: 'Horários', href: '#horarios' as const }] : []),
          { label: 'Avaliações', href: '#avaliacoes' },
        ]}
      />
      <section className="border-ink-100 relative overflow-hidden border-b bg-white">
        {church.coverUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${church.coverUrl})` }}
              aria-hidden="true"
            />
            <div className="bg-ink-900/58 absolute inset-0" aria-hidden="true" />
          </>
        ) : null}
        <div className="relative mx-auto max-w-5xl px-4 py-4 sm:px-5 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/comunidade/igrejas"
              className={
                hasCover
                  ? 'text-white/86 inline-flex min-w-0 items-center gap-1.5 text-[13px] font-bold hover:text-white hover:no-underline'
                  : 'text-ink-600 hover:text-ink-900 inline-flex min-w-0 items-center gap-1.5 text-[13px] font-bold hover:no-underline'
              }
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Igrejas
            </Link>
            {canEdit ? (
              <AdminEditLink href={`/painel/cidade/comunidade/igrejas/${church.slug}`} />
            ) : null}
          </div>

          <div className="grid min-w-0 gap-5 py-6 sm:gap-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="shadow-card flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white sm:size-28">
                {church.logoUrl ? (
                  <Image
                    src={church.logoUrl}
                    alt=""
                    width={112}
                    height={112}
                    unoptimized
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <Church size={42} className="text-clay-600" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={
                    hasCover
                      ? 'mb-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white ring-1 ring-white/20'
                      : 'bg-clay-50 text-clay-700 mb-4 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold'
                  }
                >
                  <Church size={15} className="shrink-0" aria-hidden="true" />
                  {traditionLabel[church.tradition]}
                </div>
                <h1
                  className={
                    hasCover
                      ? 'max-w-3xl break-words text-[28px] font-extrabold leading-tight text-white sm:text-[32px] md:text-5xl'
                      : 'text-ink-900 max-w-3xl break-words text-[28px] font-extrabold leading-tight sm:text-[32px] md:text-5xl'
                  }
                >
                  {church.name}
                </h1>
                <p
                  className={
                    hasCover
                      ? 'text-white/82 mt-3 max-w-2xl text-[15px] leading-relaxed'
                      : 'text-ink-600 mt-3 max-w-2xl text-[15px] leading-relaxed'
                  }
                >
                  {church.shortDescription}
                </p>
                {church.rating ? (
                  <div
                    className={
                      hasCover
                        ? 'mt-3 flex items-center gap-2 text-[13px] font-bold text-white'
                        : 'text-ink-800 mt-3 flex items-center gap-2 text-[13px] font-bold'
                    }
                  >
                    <span className="text-sun-500 flex" aria-hidden="true">
                      {'★'.repeat(Math.round(church.rating))}
                    </span>
                    {church.rating.toFixed(1)} - {church.reviewsCount} avaliacoes
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className={
                hasCover
                  ? 'shadow-card min-w-0 rounded-lg border border-white/20 bg-white/90 p-4 backdrop-blur'
                  : 'border-ink-100 bg-paper shadow-card min-w-0 rounded-lg border p-4'
              }
            >
              <div className="text-ink-900 text-[28px] font-extrabold leading-none">
                {schedule.length}
              </div>
              <p className="text-ink-600 mt-1 text-[12px] font-bold">horários publicados</p>
              <div className="text-ink-700 mt-4 rounded-md bg-white p-3 text-[12px] leading-snug">
                {confirmedCount} confirmados · {schedule.length - confirmedCount} a verificar
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid min-w-0 max-w-5xl gap-5 px-4 py-6 sm:px-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:px-6">
        <aside className="min-w-0 space-y-3">
          <section
            id="informacoes"
            className="border-ink-100 shadow-card scroll-mt-28 rounded-lg border bg-white p-4"
          >
            <h2 className="text-ink-900 text-[17px] font-extrabold">Informações</h2>
            <dl className="mt-3 space-y-3 text-[13px]">
              {church.pastorName ? (
                <InfoRow icon={UserRound} label="Responsável" value={church.pastorName} />
              ) : null}
              {church.phone ? <InfoRow icon={Phone} label="Contato" value={church.phone} /> : null}
              {church.instagram ? (
                <InfoRow
                  icon={AtSign}
                  label="Instagram"
                  value={formatInstagramHandle(church.instagram)}
                  href={getInstagramUrl(church.instagram)}
                />
              ) : null}
              {church.neighborhood || church.address || church.googleMapsUrl ? (
                <InfoRow
                  icon={MapPin}
                  label="Local"
                  value={
                    [church.address, church.neighborhood].filter(Boolean).join(' - ') ||
                    'Abrir no Google Maps'
                  }
                  href={church.googleMapsUrl ?? undefined}
                />
              ) : null}
              <InfoRow
                icon={Clock}
                label="Atualização"
                value={
                  church.claimed ? 'Perfil administrado pela igreja' : 'Aguardando reivindicação'
                }
              />
            </dl>
          </section>

          {!church.claimed ? <ClaimChurchCallout churchName={church.name} /> : null}
        </aside>

        <div className="min-w-0 space-y-6">
          {church.photos && church.photos.length > 0 ? (
            <div id="fotos" className="scroll-mt-28">
              <ChurchPhotoGallery churchName={church.name} photos={church.photos} />
            </div>
          ) : null}

          <div id="horarios" className="scroll-mt-28">
            <WeeklyChurchCalendar schedule={schedule} />
          </div>

          {posts.length > 0 && <EntityPostsSection posts={posts} />}

          <section id="avaliacoes" className="scroll-mt-28 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-ink-900 text-[20px] font-extrabold">Avaliacoes</h2>
                <p className="text-ink-600 mt-0.5 text-[13px]">{reviews.length} publicadas</p>
              </div>
              {church.rating ? (
                <div className="text-ink-900 text-[18px] font-extrabold">
                  {church.rating.toFixed(1)}
                </div>
              ) : null}
            </div>

            {reviews.length === 0 ? (
              <div className="border-ink-100 text-ink-600 shadow-card rounded-lg border bg-white p-4 text-[13px]">
                Nenhuma avaliacao publicada ainda.
              </div>
            ) : (
              <div className="grid gap-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="border-ink-100 shadow-card rounded-lg border bg-white p-4"
                  >
                    <div className="text-sun-600 flex flex-wrap items-center gap-2 text-[13px] font-bold">
                      <Star size={15} className="fill-sun-500" aria-hidden="true" />
                      {review.rating}{' '}
                      <span className="text-ink-500">por {review.authorName ?? 'cidadao'}</span>
                    </div>
                    {review.title ? (
                      <h3 className="text-ink-900 mt-2 text-[15px] font-extrabold">
                        {review.title}
                      </h3>
                    ) : null}
                    {review.comment ? (
                      <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                        {review.comment}
                      </p>
                    ) : null}
                    {review.replyOwner ? (
                      <blockquote className="bg-paper text-ink-700 mt-3 rounded-md p-3 text-[13px] leading-relaxed">
                        Resposta da igreja: {review.replyOwner}
                      </blockquote>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            <ChurchReviewPrompt churchId={church.id} churchName={church.name} />
          </section>

          <section className="border-sun-300 bg-sun-100 rounded-lg border p-4">
            <h2 className="text-ink-900 text-[17px] font-extrabold">Antes de sair de casa</h2>
            <p className="text-ink-700 mt-1 text-[13px] leading-relaxed">
              Alguns horários ainda dependem de confirmação direta com a igreja. Use o perfil
              oficial para conferir mudanças de última hora, feriados, novenas e celebrações
              especiais.
            </p>
          </section>
        </div>
      </div>
    </AppFrame>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <Icon className="text-clay-600 mt-0.5 shrink-0" size={16} aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-ink-900 font-bold">{label}</dt>
        <dd className="text-ink-600 mt-0.5 min-w-0 break-words">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-600 hover:text-clay-700 break-words hover:no-underline"
            >
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}
