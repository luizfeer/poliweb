import { Link } from '@/components/navigation/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttractionFormModal } from '@/components/admin/tourism/attraction-form-modal';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listAttractionsAdmin } from '@/lib/tourism';
import type { AttractionKind } from '@/lib/tourism/types';
import {
  assignAttractionOwnerAction,
  reorderFeaturedAttractionsAction,
  upsertAttractionAction,
} from './actions';

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    owner?: string;
    page?: string;
  }>;
};

const attractionKinds: AttractionKind[] = [
  'balneario',
  'mirante',
  'cachoeira',
  'trilha',
  'igreja',
  'museu',
  'parque',
  'praia',
  'lago',
  'historico',
];

const statusLabels: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  pending: 'Pendente',
  rejected: 'Rejeitado',
  archived: 'Arquivado',
};

const statusClasses: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-50 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  archived: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default async function AtracoesAdminPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const filters = await searchParams;
  const page = Number(filters.page ?? '1');
  const status =
    filters.status === 'all' || !filters.status
      ? undefined
      : filters.status === 'draft' ||
          filters.status === 'pending' ||
          filters.status === 'published' ||
          filters.status === 'rejected' ||
          filters.status === 'archived'
        ? filters.status
        : undefined;
  const { items: attractions, count } = await listAttractionsAdmin({
    city_id: city.id,
    q: filters.q,
    status,
    type: attractionKinds.includes(filters.type as AttractionKind)
      ? (filters.type as AttractionKind)
      : undefined,
    withoutOwner: filters.owner === 'none',
    page,
    pageSize: 30,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Atrações</h1>
          <p className="text-muted-foreground">
            Catálogo gerenciável com ownership, filtros e moderação.
          </p>
        </div>
        <AttractionFormModal cityId={city.id} action={upsertAttractionAction} />
      </header>

      <form className="bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-5">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="q">Busca</Label>
          <Input id="q" name="q" defaultValue={filters.q} placeholder="Nome da atração" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? 'all'}
            className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="rejected">Rejeitado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner">Owner</Label>
          <select
            id="owner"
            name="owner"
            defaultValue={filters.owner ?? ''}
            className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="none">Sem owner</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit">Filtrar</Button>
        </div>
      </form>

      <form action={reorderFeaturedAttractionsAction} className="bg-card rounded-xl border p-5">
        <input type="hidden" name="city_id" value={city.id} />
        <Label htmlFor="ordered_ids">Destaques por IDs</Label>
        <Input
          id="ordered_ids"
          name="ordered_ids"
          defaultValue={attractions
            .filter((item) => item.featured)
            .map((item) => item.id)
            .join(',')}
        />
        <Button className="mt-3" type="submit" variant="secondary">
          Aplicar destaques
        </Button>
      </form>

      <section className="bg-card overflow-hidden rounded-xl border">
        <div className="text-muted-foreground grid grid-cols-[1.6fr_.8fr_.7fr_.7fr_1fr] gap-3 border-b px-4 py-3 text-sm font-semibold">
          <span>Nome</span>
          <span>Tipo</span>
          <span>Status</span>
          <span>Owner</span>
          <span className="text-right">Ações</span>
        </div>
        {attractions.map((item) => (
          <article
            key={item.id}
            className="grid grid-cols-[1.6fr_.8fr_.7fr_.7fr_1fr] items-center gap-3 border-b px-4 py-3 text-sm last:border-0 hover:bg-muted/30"
          >
            <div className="min-w-0">
              <strong className="block truncate">{item.name}</strong>
              <p className="text-muted-foreground m-0 text-xs">
                {item.featured ? '⭐ destaque' : 'normal'}
                {item.slug && ` · ${item.slug}`}
              </p>
            </div>
            <span className="text-xs capitalize">{item.type}</span>
            <span className="w-fit">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses[item.status ?? 'draft'] ?? statusClasses.draft}`}
              >
                {statusLabels[item.status ?? 'draft'] ?? item.status}
              </span>
            </span>
            <span className="text-xs">
              {item.ownerProfileId ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  atribuído
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  sem dono
                </span>
              )}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                className="text-primary text-xs underline"
                href={`/painel/cidade/turismo/atracoes/${item.id}`}
              >
                Editar
              </Link>
              <Link
                className="text-primary text-xs underline"
                href={`/turismo/o-que-fazer/${item.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver
              </Link>
              {!item.ownerProfileId ? (
                <form
                  action={assignAttractionOwnerAction}
                  className="flex items-center gap-1"
                >
                  <input type="hidden" name="attraction_id" value={item.id} />
                  <Input
                    name="owner_profile_id"
                    placeholder="profile_id"
                    className="h-7 w-28 text-xs"
                  />
                  <Button size="sm" type="submit" variant="secondary" className="h-7 text-xs">
                    Owner
                  </Button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <p className="text-muted-foreground text-sm">{count} atrações encontradas.</p>
    </div>
  );
}
