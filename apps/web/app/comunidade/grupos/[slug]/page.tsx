import type { Metadata } from 'next';
import Image from 'next/image';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { CommunityGroupPostCard } from '@/components/public/community/cards';
import { CommunityGroupFollowers } from '@/components/public/community/group-followers';
import { ReportForm } from '@/components/public/community/report-button';
import { getProfile, hasRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import {
  getCommunityGroupBySlug,
  isFollowingCommunityGroup,
  listCommunityGroupFollowers,
  listCommunityGroupPosts,
} from '@/lib/community/queries';
import { CommunityGroupShareButton } from './community-group-share-button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return { title: 'Grupo da comunidade - Carmo Local' };

  const { slug } = await params;
  const group = await getCommunityGroupBySlug({ city_id: city.id, slug });
  if (!group) return { title: 'Grupo da comunidade - Carmo Local' };

  const description =
    group.shortDescription ??
    group.description ??
    `${group.name} em ${city.name}.`;
  const images = [group.ogImageUrl ?? `/comunidade/grupos/${group.slug}/opengraph-image`];

  return {
    title: `${group.name} - Carmo Local`,
    description,
    openGraph: {
      title: group.name,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: group.name,
      description,
      images,
    },
  };
}

export default async function CommunityGroupDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const { slug } = await params;

  const group = await getCommunityGroupBySlug({ city_id: city.id, slug });
  if (!group) notFound();

  const [posts, followers, auth] = await Promise.all([
    listCommunityGroupPosts({ city_id: city.id, groupId: group.id, limit: 8 }),
    listCommunityGroupFollowers({ city_id: city.id, groupId: group.id, limit: 24 }),
    getProfile(),
  ]);
  const isFollowing = auth
    ? await isFollowingCommunityGroup(group.id, auth.profile.id)
    : false;
  const canManageGroup = auth
    ? group.ownerProfileId === auth.profile.id ||
      hasRole(auth.roles, ['city_admin', 'super_admin'], city.id)
    : false;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-0 pb-8 sm:px-4 sm:py-8">
      <section className="overflow-hidden bg-card sm:rounded-xl sm:border">
        {group.coverUrl ? (
          <Image
            src={group.coverUrl}
            alt=""
            width={1200}
            height={224}
            unoptimized
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="h-40 bg-secondary" />
        )}
        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                  {group.type === 'whatsapp_group' ? 'WhatsApp' : 'Grupo local'}
                </span>
                <span className="rounded-full border px-2 py-1 text-xs">{group.category}</span>
                {group.isOfficial ? <span className="rounded-full border px-2 py-1 text-xs">Oficial</span> : null}
                {group.featuredUntil && new Date(group.featuredUntil).getTime() > Date.now() ? (
                  <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-extrabold text-amber-900">
                    ★ Destaque
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl font-bold">{group.name}</h1>
              {group.shortDescription ? <p className="mt-2 text-muted-foreground">{group.shortDescription}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {group.whatsappInviteUrl ? (
                <a
                  href={group.whatsappInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1f8f53] px-5 py-2.5 text-sm font-semibold text-white shadow-sm no-underline transition hover:bg-[#187744] hover:no-underline"
                >
                  <MessageCircle size={17} aria-hidden="true" />
                  Entrar no WhatsApp
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              {group.websiteUrl ? (
                <a href={group.websiteUrl} target="_blank" rel="noreferrer" className="rounded-md border px-4 py-2 text-sm no-underline">
                  Site
                </a>
              ) : null}
              {group.instagramUrl ? (
                <a href={group.instagramUrl} target="_blank" rel="noreferrer" className="rounded-md border px-4 py-2 text-sm no-underline">
                  Instagram
                </a>
              ) : null}
              <CommunityGroupShareButton title={group.name} />
              <ReportForm cityId={city.id} entityType="community_group" entityId={group.id} align="left" />
              {canManageGroup ? (
                <Link href={`/painel/comunidade/grupos/${group.id}`} className="rounded-md border px-4 py-2 text-sm">
                  Administrar e postar
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {group.description ? (
                <div>
                  <h2 className="text-lg font-semibold">Sobre</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{group.description}</p>
                </div>
              ) : null}

              {group.participationInstructions ? (
                <div>
                  <h2 className="text-lg font-semibold">Como participar</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{group.participationInstructions}</p>
                </div>
              ) : null}

              {group.groupRules ? (
                <div>
                  <h2 className="text-lg font-semibold">Regras</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{group.groupRules}</p>
                </div>
              ) : null}
            </div>

            <aside className="-mx-5 space-y-4 border-y bg-background px-5 py-4 sm:mx-0 sm:rounded-lg sm:border sm:p-4">
              <div>
                <h2 className="text-lg font-semibold">Contato</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {[group.contactName, group.neighborhood].filter(Boolean).join(' - ') || 'Contato informado no grupo'}
                </p>
              </div>
              {group.contactPhone ? <p className="text-sm">Telefone: {group.contactPhone}</p> : null}
              {group.contactWhatsapp ? <p className="text-sm">WhatsApp: {group.contactWhatsapp}</p> : null}
              {group.contactEmail ? <p className="text-sm">Email: {group.contactEmail}</p> : null}
              {group.memberEstimate ? <p className="text-sm">Estimativa de pessoas: {group.memberEstimate}</p> : null}
              {group.lastVerifiedAt ? <p className="text-sm">Ultima verificacao: {formatDate(group.lastVerifiedAt)}</p> : null}
              {group.type === 'whatsapp_group' ? (
                <p className="text-sm text-muted-foreground">
                  O link leva para um ambiente externo. Entre apenas se o tema e as regras fizerem sentido para voce.
                </p>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <CommunityGroupFollowers
        cityId={city.id}
        groupId={group.id}
        groupSlug={group.slug}
        followers={followers}
        isFollowing={isFollowing}
      />

      <section className="space-y-3 px-4 sm:px-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Postagens do grupo</h2>
          {canManageGroup ? (
            <Link href={`/painel/comunidade/grupos/${group.id}`} className="rounded-md border px-4 py-2 text-sm">
              Publicar postagem
            </Link>
          ) : (
            <Link href="/comunidade/grupos/novo" className="rounded-md border px-4 py-2 text-sm">
              Indicar outro grupo
            </Link>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {posts.map((post) => (
            <div key={post.id} className="relative">
              <CommunityGroupPostCard post={post} />
              <div className="absolute right-3 top-3">
                <ReportForm cityId={city.id} entityType="community_group_post" entityId={post.id} />
              </div>
            </div>
          ))}
          {posts.length === 0 ? (
            <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Este grupo ainda nao publicou comunicados por aqui.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
