import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Megaphone, Sparkles, ExternalLink, ChevronRight } from 'lucide-react';
import { FeaturePurchaseDialog } from '@/components/community/feature-purchase-dialog';
import { hasRole, requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getManagedCommunityGroupById, listCommunityGroupPosts } from '@/lib/community/queries';

export const metadata = { title: 'Gerenciar grupo - Carmo Local' };

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default async function ManagedCommunityGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const { id } = await params;

  const group = await getManagedCommunityGroupById({
    city_id: city.id,
    id,
    profile_id: auth.profile.id,
    can_manage_city: hasRole(auth.roles, ['city_admin', 'super_admin'], city.id),
  });
  if (!group) notFound();

  const posts = await listCommunityGroupPosts({
    city_id: city.id,
    groupId: group.id,
    includePending: true,
    limit: 5,
  });

  const isFeatured = group.featuredUntil
    ? new Date(group.featuredUntil).getTime() > Date.now()
    : false;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Minha comunidade</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <StatusBadge status={group.status} />
          {isFeatured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-1 text-xs font-bold text-ink-900">
              <Sparkles className="size-3.5" /> Destaque até {dateFormatter.format(new Date(group.featuredUntil!))}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Escolha o que quer fazer com o grupo. Cada ação abre em uma tela própria.
        </p>
        <div>
          <Link
            href={`/comunidade/grupos/${group.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Ver página pública <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          href={`/painel/comunidade/grupos/${group.id}/editar`}
          icon={<Pencil className="size-6" />}
          title="Editar grupo"
          description="Dados públicos, contatos, regras e configurações do grupo."
          accent="bg-clay-50 text-clay-700 ring-clay-200"
        />
        <ActionCard
          href={`/painel/comunidade/grupos/${group.id}/postar`}
          icon={<Megaphone className="size-6" />}
          title="Publicar postagem"
          description="Avisos, pedidos, doações e oportunidades que aparecem no grupo."
          accent="bg-cerrado-50 text-cerrado-700 ring-cerrado-200"
        />
        <div className="flex flex-col gap-3 rounded-xl border-2 border-sun-300 bg-sun-50 p-5 shadow-sm">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-sun-300 text-ink-900 ring-1 ring-sun-400">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">Destacar grupo</h2>
            <p className="mt-1 text-sm text-ink-700">
              R$ 49,90 por 30 dias no topo do diretório, com selo Destaque.
            </p>
          </div>
          <div className="mt-auto pt-2">
            <FeaturePurchaseDialog
              cityId={city.id}
              targetType="community_group"
              targetId={group.id}
              targetTitle={group.name}
              planSlug="destaque-30d"
              amountCents={4900}
              durationDays={30}
              defaultFullName={auth.profile.full_name}
              defaultPhone={auth.profile.phone}
              currentFeaturedUntil={group.featuredUntil}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Últimas postagens</h2>
            <p className="text-sm text-muted-foreground">
              {posts.length === 0
                ? 'Nenhuma postagem criada ainda.'
                : `${posts.length} postagem${posts.length === 1 ? '' : 's'} recente${posts.length === 1 ? '' : 's'}.`}
            </p>
          </div>
          {posts.length > 0 ? (
            <Link
              href={`/painel/comunidade/grupos/${group.id}/postar`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Nova postagem
            </Link>
          ) : null}
        </div>
        {posts.length > 0 ? (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id} className="py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {post.postType} · {post.status}
                </p>
                <h3 className="mt-0.5 font-semibold">{post.title}</h3>
                {post.body ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-clay-50/40"
    >
      <div className={`inline-flex size-12 items-center justify-center rounded-full ring-1 ${accent}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
        <p className="mt-1 text-sm text-ink-700">{description}</p>
      </div>
      <div className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
        Abrir <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-800' },
    draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Em revisão', className: 'bg-amber-100 text-amber-800' },
    rejected: { label: 'Recusado', className: 'bg-destructive/10 text-destructive' },
    archived: { label: 'Arquivado', className: 'bg-muted text-muted-foreground' },
  };
  const meta = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
