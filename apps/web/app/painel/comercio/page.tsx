import { Link } from '@/components/navigation/link';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { requestPublishAction } from './actions';
import { DeleteBusinessButton } from './delete-business-button';
import {
  BadgeCheck,
  Camera,
  CreditCard,
  ExternalLink,
  Eye,
  Megaphone,
  MessageCircle,
  Plus,
  Sparkles,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react';

type BusinessListRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  status: string | null;
  featured: boolean | null;
  claimed: boolean | null;
  views_count: number | null;
  updated_at: string | null;
  owner_profile_id: string | null;
  cover_url: string | null;
  logo_url: string | null;
  photos: unknown;
  plan: string | null;
  ordering_enabled: boolean | null;
  verified: boolean | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Em revisão',
  published: 'Publicado',
  archived: 'Arquivado',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-paper text-ink-700 border-ink-200',
  pending: 'bg-sun-50 text-ink-900 border-sun-300',
  published: 'bg-cerrado-100 text-cerrado-700 border-cerrado-200',
  archived: 'bg-muted text-muted-foreground border-border',
};

export default async function PainelComercioPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });
  const supabase = await createClient();
  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  const managedBusinessIds = canManageAll
    ? []
    : ((
        await supabase
          .from('entity_managers')
          .select('entity_id')
          .eq('profile_id', auth.profile.id)
          .eq('entity_type', 'business')
      ).data?.map((manager) => manager.entity_id) ?? []);
  let businessesQuery = supabase
    .from('businesses')
    .select(
      'id, slug, name, short_description, status, featured, claimed, views_count, updated_at, owner_profile_id, cover_url, logo_url, photos, plan, ordering_enabled, verified',
    )
    .eq('city_id', city.id)
    .order('updated_at', { ascending: false });

  if (!canManageAll) {
    const filters = [`owner_profile_id.eq.${auth.profile.id}`];
    if (managedBusinessIds.length > 0) {
      filters.push(`id.in.(${managedBusinessIds.join(',')})`);
    }
    businessesQuery = businessesQuery.or(filters.join(','));
  }

  const { data: businesses } = await businessesQuery;
  const rows = (businesses ?? []) as BusinessListRow[];
  const publishedCount = rows.filter((business) => business.status === 'published').length;
  const mediaCount = rows.reduce((sum, business) => sum + businessPhotoCount(business), 0);
  const totalViews = rows.reduce((sum, business) => sum + (business.views_count ?? 0), 0);

  return (
    <div className="space-y-5">
      <header className="border-ink-100 bg-card shadow-card overflow-hidden rounded-2xl border">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 p-5 md:p-6">
            <div className="bg-clay-50 text-clay-700 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold">
              <Store className="size-3.5" aria-hidden="true" />
              Comércio local
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">
              Suas fichas comerciais
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
              Organize dados, fotos, pedidos, promoções e novidades dos comércios que você
              administra.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                className="bg-ink-900 hover:bg-ink-800 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:no-underline"
                href="/painel/comercio/novo"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nova ficha
              </Link>
              <Link
                className="border-ink-200 text-ink-800 hover:bg-paper inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:no-underline"
                href="/painel/comercio/assinatura"
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Assinatura e cobranças
              </Link>
            </div>
          </div>
          <div className="bg-ink-100 grid grid-cols-2 gap-px lg:grid-cols-1">
            <Metric icon={Store} label="Fichas" value={rows.length} />
            <Metric icon={BadgeCheck} label="Publicadas" value={publishedCount} />
            <Metric icon={Camera} label="Fotos" value={mediaCount} />
            <Metric icon={Eye} label="Visualizações" value={totalViews} />
          </div>
        </div>
      </header>

      {rows.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <section className="border-ink-200 bg-card shadow-card rounded-2xl border border-dashed p-6 text-center">
          <div className="bg-clay-50 text-clay-700 mx-auto flex size-12 items-center justify-center rounded-full">
            <Store className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Nenhuma ficha comercial ainda</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Cadastre o comércio, adicione capa, logo e fotos da vitrine para aparecer melhor no guia
            da cidade.
          </p>
          <Link
            className="bg-primary text-primary-foreground mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:no-underline"
            href="/painel/comercio/novo"
          >
            <Plus className="size-4" aria-hidden="true" />
            Criar primeira ficha
          </Link>
        </section>
      )}
    </div>
  );
}

function BusinessCard({ business }: { business: BusinessListRow }) {
  const status = business.status ?? 'draft';
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusClass = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const photoCount = businessPhotoCount(business);
  const heroImage = business.cover_url ?? business.logo_url;
  const planLabel = business.plan ? business.plan : 'Plano básico';

  return (
    <article className="border-ink-100 bg-card shadow-card overflow-hidden rounded-2xl border">
      <div
        className="bg-paper relative min-h-40 bg-cover bg-center"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
      >
        {!heroImage ? (
          <div className="text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
            <Camera className="text-clay-600 size-8" aria-hidden="true" />
            <span className="text-sm font-semibold">
              Adicione uma capa para destacar este comércio
            </span>
          </div>
        ) : null}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass}`}
          >
            {statusLabel}
          </span>
          {business.featured ? (
            <span className="border-sun-300 bg-sun-50 text-ink-900 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Em destaque
            </span>
          ) : null}
        </div>
        {business.logo_url ? (
          <div
            className="shadow-pop absolute bottom-3 left-3 size-14 rounded-xl border-2 border-white bg-white bg-cover bg-center"
            style={{ backgroundImage: `url(${business.logo_url})` }}
            aria-hidden="true"
          />
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold leading-tight">{business.name}</h2>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {business.short_description ??
                  'Sem descrição curta. Use a edição para explicar o que o comércio oferece.'}
              </p>
            </div>
            {business.verified ? (
              <span className="bg-cerrado-100 text-cerrado-700 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Verificado
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SmallMetric icon={Camera} label="Fotos" value={photoCount} />
          <SmallMetric icon={Eye} label="Acessos" value={business.views_count ?? 0} />
          <SmallMetric
            icon={Truck}
            label="Pedidos"
            value={business.ordering_enabled ? 'Ativo' : 'Off'}
          />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-paper text-ink-700 rounded-full px-2.5 py-1 font-semibold">
            {planLabel}
          </span>
          <span>{business.claimed ? 'Ficha reivindicada' : 'Aguardando reivindicação'}</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            prefetch={false}
            className="bg-primary text-primary-foreground inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:no-underline"
            href={`/painel/comercio/${business.id}`}
          >
            <Store className="size-4" aria-hidden="true" />
            Editar ficha
          </Link>
          <Link
            prefetch={false}
            className="border-ink-200 text-ink-800 hover:bg-paper inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:no-underline"
            href={`/comercio/negocio/${business.slug}`}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver pública
          </Link>
          <Link
            prefetch={false}
            className="border-ink-200 text-ink-800 hover:bg-paper inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:no-underline"
            href={`/painel/comercio/${business.id}/pedidos`}
          >
            <Truck className="size-4" aria-hidden="true" />
            Pedidos
          </Link>
          <Link
            prefetch={false}
            className="border-ink-200 text-ink-800 hover:bg-paper inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:no-underline"
            href={`/painel/comercio/${business.id}/promocoes`}
          >
            <Megaphone className="size-4" aria-hidden="true" />
            Promoções
          </Link>
          <Link
            prefetch={false}
            className="border-ink-200 text-ink-800 hover:bg-paper inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:no-underline"
            href={`/painel/comercio/${business.id}/reviews`}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Reviews
          </Link>
          <Link
            prefetch={false}
            className="border-ink-200 text-ink-800 hover:bg-paper inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:no-underline"
            href={`/painel/comercio/${business.id}/novidades`}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Novidades
          </Link>
          {business.status === 'draft' ? (
            <SubmitOnceForm action={requestPublishAction}>
              <input type="hidden" name="business_id" value={business.id} />
              <SubmitOnceButton
                label="Solicitar publicação"
                pendingLabel="Enviando..."
                icon={<BadgeCheck className="size-4" aria-hidden="true" />}
                className="bg-ink-900 hover:bg-ink-800 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
              />
            </SubmitOnceForm>
          ) : null}
        </div>

        <div className="border-ink-100 flex justify-end border-t pt-3">
          <DeleteBusinessButton businessId={business.id} businessName={business.name} />
        </div>
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]">
        <Icon className="text-clay-700 size-4" aria-hidden="true" />
        {label}
      </div>
      <div className="text-ink-900 mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function SmallMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-paper rounded-xl p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
        <Icon className="text-clay-700 size-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="text-ink-900 mt-1 text-sm font-black">{value}</div>
    </div>
  );
}

function businessPhotoCount(business: BusinessListRow): number {
  const legacyPhotos = Array.isArray(business.photos)
    ? business.photos.filter((photo): photo is string => typeof photo === 'string').length
    : 0;

  return (business.cover_url ? 1 : 0) + (business.logo_url ? 1 : 0) + legacyPhotos;
}
