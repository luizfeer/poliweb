import { Link } from '@/components/navigation/link';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import {
  AlertTriangle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Edit3,
  FileWarning,
  FolderTree,
  Import,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Store,
  Tags,
} from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { approveBusinessAction, rejectBusinessAction } from './actions';
import { ConvertBusinessToAttractionForm } from '@/components/admin/tourism/convert-business-form';

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  claimed: boolean | null;
  featured: boolean | null;
  verified: boolean | null;
  phone: string | null;
  whatsapp: string | null;
  updated_at: string | null;
  import_source: unknown;
};

type ClaimRow = {
  id: string;
  businesses: { city_id?: string | null } | null;
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

const PAGE_SIZE = 20;
const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'published', label: 'Publicado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'archived', label: 'Arquivado' },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];
type BusinessStatus = Exclude<StatusFilter, 'all'>;

const navItems = [
  {
    href: '/painel/cidade/comercio/categorias',
    title: 'Categorias',
    text: 'Editar nomes, slugs, ícones e ordem.',
    icon: FolderTree,
  },
  {
    href: '/painel/cidade/comercio/claims',
    title: 'Claims',
    text: 'Aprovar donos das páginas.',
    icon: ShieldCheck,
  },
  {
    href: '/painel/cidade/comercio/leads',
    title: 'Leads',
    text: 'Aprovar cadastros novos e liberar trial.',
    icon: Store,
  },
  {
    href: '/painel/cidade/comercio/reports',
    title: 'Relatos de erro',
    text: 'Revisar contato, endereço e duplicados.',
    icon: MessageSquareWarning,
  },
  {
    href: '/painel/cidade/comercio/import',
    title: 'Importar',
    text: 'Rodar base do CliqueiAchei.',
    icon: Import,
  },
];

export default async function CidadeComercioPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const params = await searchParams;
  const page = parsePage(params.page);
  const searchTerm = normalizeSearch(params.q);
  const selectedStatus = normalizeStatus(params.status);
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  let businessesQuery = supabase
    .from('businesses')
    .select('id, name, slug, status, claimed, featured, verified, phone, whatsapp, import_source, updated_at', { count: 'exact' })
    .eq('city_id', city.id);

  if (selectedStatus !== 'all') {
    businessesQuery = businessesQuery.eq('status', selectedStatus as BusinessStatus);
  }

  if (searchTerm) {
    const sanitizedTerm = searchTerm.replace(/[%,]/g, ' ').trim();
    if (sanitizedTerm) {
      businessesQuery = businessesQuery.or(`name.ilike.%${sanitizedTerm}%,slug.ilike.%${sanitizedTerm}%`);
    }
  }

  const [
    businessesResult,
    totalBusinessesResult,
    publishedBusinessesResult,
    pendingBusinessesCountResult,
    categoriesResult,
    pendingBusinessesResult,
    pendingClaimsResult,
    pendingReportsResult,
  ] = await Promise.all([
    businessesQuery
      .order('updated_at', { ascending: false })
      .range(rangeFrom, rangeTo),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('status', 'published'),
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('status', 'pending'),
    supabase
      .from('business_categories')
      .select('id', { count: 'exact', head: true })
      .or(`city_id.is.null,city_id.eq.${city.id}`)
      .eq('active', true),
    supabase
      .from('businesses')
      .select('id, name, slug, status, claimed, featured, verified, phone, whatsapp, import_source, updated_at')
      .eq('city_id', city.id)
      .eq('status', 'pending')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('business_claims')
      .select('id, businesses(city_id)')
      .eq('status', 'pending'),
    supabase
      .from('business_reports')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('status', 'pending'),
  ]);

  const businesses = (businessesResult.data ?? []) as BusinessRow[];
  const pendingBusinesses = (pendingBusinessesResult.data ?? []) as BusinessRow[];
  const filteredCount = businessesResult.count ?? businesses.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const currentPage = page;
  const hasFilters = Boolean(searchTerm) || selectedStatus !== 'all';
  const totalBusinesses = totalBusinessesResult.count ?? filteredCount;
  const publishedBusinessesCount = publishedBusinessesResult.count ?? 0;
  const pendingBusinessesCount = pendingBusinessesCountResult.count ?? pendingBusinesses.length;
  const importedBusinesses = businesses.filter((business) => {
    const source = business.import_source as { source?: string } | null;
    return Boolean(source?.source);
  });
  const missingContact = businesses.filter((business) => !business.phone && !business.whatsapp);
  const pendingClaims = ((pendingClaimsResult.data ?? []) as ClaimRow[]).filter(
    (claim) => claim.businesses?.city_id === city.id,
  ).length;
  const openReports = pendingReportsResult.count ?? 0;

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/30 p-5 md:p-6">
          <p className="text-sm font-medium text-muted-foreground">Admin da cidade</p>
          <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Comércio</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Operação do guia comercial: fichas, categorias, reivindicações, relatos e importações.
              </p>
            </div>
            <Link
              href="/comercio"
              className="inline-flex items-center justify-center rounded-lg border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Ver guia público
            </Link>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Store} label="Negócios" value={totalBusinesses} sub={`${publishedBusinessesCount} publicados`} />
          <Metric icon={Clock3} label="Pendentes" value={pendingBusinessesCount} sub="Aguardando aprovação" attention={pendingBusinessesCount > 0} />
          <Metric icon={ShieldCheck} label="Claims" value={pendingClaims} sub="Solicitações abertas" attention={pendingClaims > 0} />
          <Metric icon={FileWarning} label="Relatos" value={openReports} sub="Erros em revisão" attention={openReports > 0} />
        </div>
      </header>

      <nav className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} className="group rounded-2xl border bg-card p-4 shadow-sm hover:bg-muted/40 hover:no-underline" href={item.href}>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">{item.text}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <section className="grid gap-3 lg:grid-cols-3">
        <InsightCard
          title="Categorias ativas"
          value={categoriesResult.count ?? 0}
          text="Revise ícones e nomes para melhorar a navegação no app."
          href="/painel/cidade/comercio/categorias"
          icon={Tags}
        />
        <InsightCard
          title="Importados"
          value={importedBusinesses.length}
          text="Fichas vindas de base externa precisam de revisão humana."
          href="/painel/cidade/comercio/import"
          icon={Import}
        />
        <InsightCard
          title="Sem telefone"
          value={missingContact.length}
          text="Negócios sem contato têm menor utilidade na busca e no guia."
          href="#lista-negocios"
          icon={AlertTriangle}
          attention={missingContact.length > 0}
        />
      </section>

      {pendingBusinesses.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold">Aprovação pendente</h2>
          </div>
          <div className="grid gap-3">
            {pendingBusinesses.map((business) => (
              <BusinessAdminCard key={business.id} business={business} highlight />
            ))}
          </div>
        </section>
      ) : null}

      <section id="lista-negocios" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Negócios recentes</h2>
          <p className="text-sm text-muted-foreground">{filteredCount} fichas encontradas</p>
        </div>

        <form action="/painel/cidade/comercio" className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_180px_auto]">
          <label className="grid gap-1.5 text-sm font-medium">
            Buscar
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                defaultValue={searchTerm}
                name="q"
                placeholder="Nome ou slug"
                type="search"
              />
            </span>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Status
            <select className="h-10 rounded-lg border bg-background px-3 text-sm" defaultValue={selectedStatus} name="status">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">
              Buscar
            </button>
            {hasFilters ? (
              <Link className="inline-flex h-10 items-center rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-muted" href="/painel/cidade/comercio">
                Limpar
              </Link>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3">
          {businesses.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              {hasFilters ? 'Nada encontrado com esses filtros.' : 'Nenhum negócio cadastrado ainda.'}
            </div>
          ) : (
            businesses.map((business) => <BusinessAdminCard key={business.id} business={business} />)
          )}
        </div>

        {filteredCount > PAGE_SIZE ? (
          <Pagination
            currentPage={currentPage}
            searchTerm={searchTerm}
            selectedStatus={selectedStatus}
            totalPages={totalPages}
          />
        ) : null}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  attention,
}: {
  icon: typeof Store;
  label: string;
  value: number;
  sub: string;
  attention?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <Icon className={attention ? 'size-4 text-amber-600' : 'size-4 text-primary'} aria-hidden="true" />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchTerm,
  selectedStatus,
}: {
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  selectedStatus: StatusFilter;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={currentPage <= 1}
          className={
            currentPage <= 1
              ? 'pointer-events-none inline-flex h-10 items-center gap-1.5 rounded-lg border bg-muted px-3 text-sm font-semibold text-muted-foreground opacity-60'
              : 'inline-flex h-10 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-semibold hover:bg-muted'
          }
          href={commercePageHref({ page: currentPage - 1, q: searchTerm, status: selectedStatus })}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </Link>
        <Link
          aria-disabled={currentPage >= totalPages}
          className={
            currentPage >= totalPages
              ? 'pointer-events-none inline-flex h-10 items-center gap-1.5 rounded-lg border bg-muted px-3 text-sm font-semibold text-muted-foreground opacity-60'
              : 'inline-flex h-10 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-semibold hover:bg-muted'
          }
          href={commercePageHref({ page: currentPage + 1, q: searchTerm, status: selectedStatus })}
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  text,
  href,
  icon: Icon,
  attention,
}: {
  title: string;
  value: number;
  text: string;
  href: string;
  icon: typeof Store;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-card p-4 shadow-sm hover:bg-muted/40 hover:no-underline"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
        <div className={attention ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700' : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-bold">{value}</div>
    </Link>
  );
}

function BusinessAdminCard({ business, highlight }: { business: BusinessRow; highlight?: boolean }) {
  const importSource = business.import_source as { source?: string } | null;
  const updatedAt = business.updated_at
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(business.updated_at))
    : 'sem data';

  return (
    <article className={highlight ? 'rounded-2xl border border-amber-200 bg-amber-50/50 p-4' : 'rounded-2xl border bg-card p-4'}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold">{business.name}</h3>
            <StatusPill status={business.status ?? 'draft'} />
            {business.verified ? <Badge label="Verificado" icon={BadgeCheck} /> : null}
            {business.claimed ? <Badge label="Reivindicado" icon={CheckCircle2} /> : null}
          </div>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {business.slug} · origem {importSource?.source ?? 'manual'} · atualizado {updatedAt}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {business.whatsapp ? `WhatsApp: ${business.whatsapp}` : business.phone ? `Telefone: ${business.phone}` : 'Sem telefone cadastrado'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
            href={`/painel/comercio/${business.id}`}
            prefetch={false}
          >
            <Edit3 className="size-4" aria-hidden="true" />
            Editar ficha
          </Link>
          <Link
            className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
            href={`/comercio/negocio/${business.slug}`}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver pública
          </Link>
          <ConvertBusinessToAttractionForm businessId={business.id} />
          {business.status === 'pending' ? (
            <>
              <SubmitOnceForm action={approveBusinessAction}>
                <input type="hidden" name="business_id" value={business.id} />
                <SubmitOnceButton
                  label="Aprovar"
                  pendingLabel="Aprovando..."
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-75"
                />
              </SubmitOnceForm>
              <SubmitOnceForm action={rejectBusinessAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="business_id" value={business.id} />
                <input className="w-44 rounded-lg border bg-background px-3 py-2 text-sm" name="reason" placeholder="Motivo" required />
                <SubmitOnceButton
                  label="Rejeitar"
                  pendingLabel="Rejeitando..."
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                />
              </SubmitOnceForm>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = status === 'published' ? 'Publicado' : status === 'pending' ? 'Pendente' : status;
  const className =
    status === 'published'
      ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700'
      : status === 'pending'
        ? 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700'
        : 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground';

  return <span className={className}>{label}</span>;
}

function Badge({ label, icon: Icon }: { label: string; icon: typeof BadgeCheck }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

function normalizeSearch(value: string | undefined) {
  return (value ?? '').trim().slice(0, 80);
}

function normalizeStatus(value: string | undefined) {
  return statusOptions.some((option) => option.value === value) ? (value as StatusFilter) : 'all';
}

function commercePageHref({
  page,
  q,
  status,
}: {
  page: number;
  q: string;
  status: StatusFilter;
}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (status !== 'all') params.set('status', status);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return query ? `/painel/cidade/comercio?${query}` : '/painel/cidade/comercio';
}
