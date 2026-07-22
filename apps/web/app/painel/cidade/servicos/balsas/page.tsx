import Link from 'next/link';
import { Anchor, Plus } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { listFerriesAdmin } from '@/lib/ferries';

export default async function BalsasAdminListPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const routes = await listFerriesAdmin(city.id);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Anchor size={28} /> Balsas
          </h1>
          <p className="text-muted-foreground">
            Travessias do Lago de Furnas. Cadastre rotas, horários e avisos.
          </p>
        </div>
        <Link
          href="/painel/cidade/servicos/balsas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus size={16} /> Nova rota
        </Link>
      </header>

      <div className="grid gap-3">
        {routes.length === 0 && (
          <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            Nenhuma rota cadastrada ainda.
          </p>
        )}
        {routes.map((r) => (
          <Link
            key={r.id}
            href={`/painel/cidade/servicos/balsas/${r.id}`}
            className="flex items-center justify-between rounded-2xl border bg-card p-4 hover:border-primary"
          >
            <div className="min-w-0">
              <p className="m-0 font-semibold">{r.name}</p>
              <p className="m-0 text-sm text-muted-foreground">
                /{r.slug} · status: {r.status} · ordem {r.display_order}
                {r.featured && ' · destaque'}
                {!r.active && ' · INATIVO'}
              </p>
            </div>
            <span className="text-sm text-primary">Editar →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
