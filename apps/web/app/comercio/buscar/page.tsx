import {
  AppFrame,
  AppHeader,
  Band,
  Divider,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import { BusinessListItem, SearchBar } from '@/components/carmo/business';
import { listBusinesses, searchBusinesses } from '@/lib/businesses';

type PageProps = {
  searchParams: Promise<{ q?: string; sort?: string; whatsapp?: string }>;
};

export const metadata = {
  title: 'Buscar negócios — Portal Carmelitano',
};

export default async function BuscarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const sort = (sp.sort as 'rating' | 'name' | 'recent' | 'featured' | undefined) ?? 'rating';
  const onlyWhatsapp = sp.whatsapp === '1';

  const results = q
    ? await searchBusinesses(q, { hasWhatsapp: onlyWhatsapp, sort, limit: 100 })
    : await listBusinesses({ hasWhatsapp: onlyWhatsapp, sort, limit: 100 });

  return (
    <AppFrame>
      <AppHeader />

      <Band variant="paper-card" className="pt-3 pb-2">
        <SearchBar defaultValue={q} action="/comercio/buscar" />
      </Band>

      <Divider />

      <form action="/comercio/buscar" method="get" className="px-4 md:px-6 lg:px-8">
        <div className="text-[11px] uppercase tracking-wide text-ink-600 font-semibold mb-1.5">
          Ordenar
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['rating', 'Mais bem avaliados'],
              ['featured', 'Em destaque'],
              ['name', 'Nome (A-Z)'],
              ['recent', 'Mais recentes'],
            ] as const
          ).map(([value, label]) => {
            const active = sort === value;
            return (
              <button
                key={value}
                type="submit"
                name="sort"
                value={value}
                className={
                  active
                    ? 'px-3 py-1 rounded-full bg-clay-500 text-white text-[13px] font-medium'
                    : 'px-3 py-1 rounded-full bg-white border border-ink-200 text-[13px] font-medium hover:border-clay-500'
                }
              >
                {label}
              </button>
            );
          })}
          {q && <input type="hidden" name="q" value={q} />}
          {onlyWhatsapp && <input type="hidden" name="whatsapp" value="1" />}
        </div>
      </form>

      <Divider />

      <SectionHeader
        title={q ? `Resultados para "${q}"` : 'Todos os negócios'}
        kicker={`${results.length} ${results.length === 1 ? 'encontrado' : 'encontrados'}`}
      />

      <div className="space-y-2 px-4 md:px-6 lg:px-8">
        {results.length === 0 ? (
          <div className="rounded-md bg-white px-4 py-8 text-center">
            <p className="text-[14px] text-ink-700 m-0">
              Nada encontrado{q ? ` para "${q}"` : ''}. Tente outras palavras.
            </p>
          </div>
        ) : (
          results.map((b) => (
            <BusinessListItem
              key={b.id}
              business={b}
              className="rounded-md border border-ink-100 shadow-card last:border-ink-100"
            />
          ))
        )}
      </div>

      <TabBar active="home" />
    </AppFrame>
  );
}
