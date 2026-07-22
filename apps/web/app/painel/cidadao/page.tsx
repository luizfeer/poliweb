import Image from 'next/image';
import { Link } from '@/components/navigation/link';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getCitizenDashboard } from '@/lib/citizen/dashboard-queries';
import type { Classified } from '@/lib/classifieds/types';
import type { CommunityGroup } from '@/lib/community/types';
import type { CitizenBusinessSummary, CitizenGroupPostPreview } from '@/lib/citizen/dashboard-queries';
import { isVideoSrc, videoPosterUrl } from '@/lib/media/video-poster';
import { isMobileAppRequest } from '@/lib/runtime/mobile-app';
import {
  ChevronRight,
  Coins,
  Heart,
  HeartHandshake,
  Megaphone,
  MessageSquareText,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export const metadata = { title: 'Meu painel - Portal Carmelitano' };

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
});

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Em revisão',
  published: 'Publicado',
  rejected: 'Recusado',
  archived: 'Arquivado',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

export default async function CitizenHubPage() {
  const [auth, city, isMobile] = await Promise.all([
    requireProfile(),
    getCurrentCity(),
    isMobileAppRequest(),
  ]);
  if (!city) return null;

  const dashboard = await getCitizenDashboard(city.id, auth.profile.id, city.modules);
  const totalItems =
    dashboard.counts.classifieds +
    dashboard.counts.groups +
    dashboard.counts.businesses +
    dashboard.counts.posts;
  const firstName = auth.profile.full_name?.split(/\s+/)[0] ?? 'você';

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-2xl border border-ink-100 bg-card shadow-card">
        <div className="border-b bg-[linear-gradient(135deg,#fff7ed_0%,#f8fafc_58%,#ecfeff_100%)] p-5 sm:p-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-clay-700 ring-1 ring-clay-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Meu painel
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Olá, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Acompanhe o que você publicou em {city.name}: classificados, grupos, comércios e avisos.
          </p>
        </div>

        {!isMobile ? (
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:p-5">
            <Metric label="Classificados" value={dashboard.counts.classifieds} />
            <Metric label="Grupos" value={dashboard.counts.groups} />
            <Metric label="Comércios" value={dashboard.counts.businesses} />
            <Metric label="Posts" value={dashboard.counts.posts} />
          </div>
        ) : null}
      </header>

      {!isMobile ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">Atalhos</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Shortcut
              href="/anuncie"
              icon={Megaphone}
              title="Anuncie no portal"
              text="Destaques comerciais e visibilidade extra"
              tone="bg-sun-100 text-ink-900"
            />
            <Shortcut
              href="/servicos"
              icon={Wrench}
              title="Serviços públicos"
              text="Coleta, telefones, farmácias e alertas"
              tone="bg-sky-100 text-sky-700"
            />
            {city.modules.includes('classifieds') ? (
              <Shortcut
                href="/painel/cidadao/classificados/novo"
                icon={Tag}
                title="Novo classificado"
                text="Venda, vaga ou serviço para a cidade"
                tone="bg-clay-50 text-clay-700"
              />
            ) : null}
            <Shortcut
              href="/painel/favoritos"
              icon={Heart}
              title="Favoritos"
              text="Pousadas, imóveis e comércios salvos"
              tone="bg-clay-50 text-clay-700"
            />
            {city.modules.includes('community') ? (
              <Shortcut
                href="/painel/comunidade"
                icon={UsersRound}
                title="Publicar na comunidade"
                text="Eventos, pets, achados e grupos"
                tone="bg-cerrado-100 text-cerrado-700"
              />
            ) : null}
            <Shortcut
              href="/painel/cidadao/indicar"
              icon={HeartHandshake}
              title="Indicar amigos"
              text="Convide e ganhe pontos no portal"
              tone="bg-cerrado-100 text-cerrado-700"
            />
            <Shortcut
              href="/painel/cidadao/pontos"
              icon={Coins}
              title="Meus pontos"
              text="Saldo e histórico de fidelidade"
              tone="bg-cerrado-100 text-cerrado-700"
            />
          </div>
        </section>
      ) : null}

      {totalItems === 0 ? (
        <section className="rounded-2xl border border-dashed border-ink-200 bg-card p-8 text-center shadow-card">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-clay-50 text-clay-700">
            <ShoppingBag className="size-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Você ainda não publicou nada aqui</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Comece com um classificado, cadastre um grupo ou reivindique a ficha do seu comércio.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {city.modules.includes('classifieds') ? (
              <Link
                href="/painel/cidadao/classificados/novo"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:no-underline"
              >
                <Plus className="size-4" aria-hidden="true" />
                Criar classificado
              </Link>
            ) : null}
            {city.modules.includes('community') ? (
              <Link
                href="/painel/comunidade/grupos/novo"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-paper hover:no-underline"
              >
                <UsersRound className="size-4" aria-hidden="true" />
                Cadastrar grupo
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {city.modules.includes('classifieds') ? (
        <ContentSection
          title="Classificados"
          count={dashboard.counts.classifieds}
          href="/painel/cidadao/classificados"
          compact={isMobile}
          emptyText="Anuncie itens, vagas e serviços para quem mora ou visita a cidade."
          emptyAction={{ href: '/painel/cidadao/classificados/novo', label: 'Novo classificado' }}
        >
          {dashboard.classifieds.map((item) => (
            <ClassifiedPreview key={item.id} item={item} />
          ))}
        </ContentSection>
      ) : null}

      {city.modules.includes('community') ? (
        <ContentSection
          title="Grupos e coletivos"
          count={dashboard.counts.groups}
          href="/painel/comunidade/grupos"
          compact={isMobile}
          emptyText="Cadastre coletivos, associações e grupos úteis da região."
          emptyAction={{ href: '/painel/comunidade/grupos/novo', label: 'Novo grupo' }}
        >
          {dashboard.groups.map((group) => (
            <GroupPreview key={group.id} group={group} />
          ))}
        </ContentSection>
      ) : null}

      {city.modules.includes('businesses') ? (
        <ContentSection
          title="Comércios"
          count={dashboard.counts.businesses}
          href="/painel/comercio"
          compact={isMobile}
          emptyText="Reivindique ou cadastre a ficha do seu negócio no guia local."
          emptyAction={{ href: '/comercio/cadastro', label: 'Cadastrar comércio' }}
        >
          {dashboard.businesses.map((business) => (
            <BusinessPreview key={business.id} business={business} />
          ))}
        </ContentSection>
      ) : null}

      {city.modules.includes('community') ? (
        <ContentSection
          title="Posts em grupos"
          count={dashboard.counts.posts}
          href="/painel/comunidade"
          compact={isMobile}
          emptyText="Publique avisos, pedidos e oportunidades nos grupos que você administra."
          emptyAction={{ href: '/painel/comunidade', label: 'Ir para comunidade' }}
        >
          {dashboard.posts.map((post) => (
            <PostPreview key={post.id} post={post} />
          ))}
        </ContentSection>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-paper p-3 text-center">
      <p className="text-2xl font-black text-ink-900">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Shortcut({
  href,
  icon: Icon,
  title,
  text,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  text: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group flex min-h-20 items-center gap-3 rounded-xl border border-ink-100 bg-card p-3 text-foreground shadow-sm transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

function ContentSection({
  title,
  count,
  href,
  compact = false,
  emptyText,
  emptyAction,
  children,
}: {
  title: string;
  count: number;
  href: string;
  compact?: boolean;
  emptyText: string;
  emptyAction: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {!compact ? <p className="text-xs text-muted-foreground">{count} no total</p> : null}
        </div>
        {count > 0 ? (
          <Link
            href={href}
            prefetch={false}
            className="inline-flex items-center gap-1 text-sm font-semibold text-cerrado-700 hover:no-underline"
          >
            Ver todos
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {count > 0 ? (
          children
        ) : (
          <div className="rounded-xl border border-dashed bg-paper p-5 text-center">
            <p className="text-sm text-muted-foreground">{emptyText}</p>
            <Link
              href={emptyAction.href}
              prefetch={false}
              className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              {emptyAction.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const className = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function ClassifiedPreview({ item }: { item: Classified }) {
  const coverSrc = item.coverUrl
    ? isVideoSrc(item.coverUrl)
      ? videoPosterUrl(item.coverUrl)
      : item.coverUrl
    : null;

  return (
    <Link
      href="/painel/cidadao/classificados"
      prefetch={false}
      className="group flex gap-3 rounded-xl border border-ink-100 bg-background p-3 transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {coverSrc ? (
          <Image src={coverSrc} alt="" fill unoptimized className="object-cover" sizes="64px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Tag className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          {item.reviewStatus !== 'approved' ? <StatusBadge status={item.reviewStatus} /> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
        {item.createdAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Criado em {dateFormatter.format(new Date(item.createdAt))}
          </p>
        ) : null}
      </div>
      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function GroupPreview({ group }: { group: CommunityGroup }) {
  return (
    <Link
      href={`/painel/comunidade/grupos/${group.id}`}
      prefetch={false}
      className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-background p-3 transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-cerrado-100 text-cerrado-700">
        <UsersRound className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={group.status} />
          <span className="text-xs font-medium text-muted-foreground">{group.category}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{group.name}</p>
        {group.shortDescription ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{group.shortDescription}</p>
        ) : null}
      </div>
      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function BusinessPreview({ business }: { business: CitizenBusinessSummary }) {
  const heroImage = business.coverUrl ?? business.logoUrl;

  return (
    <Link
      href={`/comercio/negocio/${business.slug}`}
      prefetch={false}
      className="group flex gap-3 rounded-xl border border-ink-100 bg-background p-3 transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Store className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <StatusBadge status={business.status ?? 'draft'} />
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{business.name}</p>
        {business.updatedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Atualizado em {dateFormatter.format(new Date(business.updatedAt))}
          </p>
        ) : null}
      </div>
      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function PostPreview({ post }: { post: CitizenGroupPostPreview }) {
  return (
    <Link
      href={`/painel/comunidade/grupos/${post.groupId}`}
      prefetch={false}
      className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-background p-3 transition hover:border-clay-300 hover:bg-clay-50 hover:no-underline"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-clay-50 text-clay-700">
        <MessageSquareText className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs font-medium text-muted-foreground">{post.groupName}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{post.title}</p>
        {post.createdAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Publicado em {dateFormatter.format(new Date(post.createdAt))}
          </p>
        ) : null}
      </div>
      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
