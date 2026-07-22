import { Link } from '@/components/navigation/link';
import { ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  AppFrame,
  AppHeader,
  Band,
  Divider,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import { BusinessListItem, SearchBar } from '@/components/carmo/business';
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  listByCategory,
  listDistrictsWithBusinesses,
  resolveCategory,
} from '@/lib/businesses';

type PageProps = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ q?: string; bairro?: string; sort?: string; whatsapp?: string }>;
};

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { categoria } = await params;
  const cat = CATEGORY_BY_SLUG[categoria];
  if (!cat) return { title: 'Categoria não encontrada' };
  return {
    title: `${cat.name} em Carmo do Rio Claro — Portal Carmelitano`,
    description: cat.blurb ?? `Negócios da categoria ${cat.name} em Carmo do Rio Claro/MG.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categoria } = await params;
  const sp = await searchParams;
  const { category, children, parent } = resolveCategory(categoria);
  if (!category) notFound();

  const [list, districts] = await Promise.all([
    listByCategory(categoria, {
      q: sp.q,
      district: sp.bairro,
      hasWhatsapp: sp.whatsapp === '1',
      sort: (sp.sort as 'rating' | 'name' | 'recent' | 'featured' | undefined) ?? 'rating',
      limit: 100,
    }),
    listDistrictsWithBusinesses(),
  ]);

  return (
    <AppFrame>
      <AppHeader chips={children.slice(0, 6).map((c) => c.name)} />

      <Band variant="paper-card" className="pt-3 pb-2">
        {/* Breadcrumb */}
        <nav className="px-3.5 text-[12px] text-ink-600 mb-1 flex items-center gap-1 flex-wrap">
          <Link href="/comercio" className="hover:underline">
            Guia comercial
          </Link>
          <ChevronRight size={12} />
          {parent && (
            <>
              <Link href={`/comercio/${parent.slug}`} className="hover:underline">
                {parent.name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-ink-900 font-medium">{category.name}</span>
        </nav>

        <div className="px-3.5">
          <h1 className="font-display font-extrabold text-[24px] leading-tight m-0">
            {category.name}
          </h1>
          {category.blurb && (
            <p className="text-[13px] text-ink-700 m-0 mt-0.5">{category.blurb}</p>
          )}
          <div className="text-[12px] text-clay-600 font-semibold mt-1">
            {list.length} {list.length === 1 ? 'negócio' : 'negócios'}
          </div>
        </div>

        <div className="mt-3">
          <SearchBar
            action={`/comercio/${categoria}`}
            defaultValue={sp.q}
            placeholder={`Buscar em ${category.name.toLowerCase()}`}
          />
        </div>
      </Band>

      {/* Subcategorias */}
      {children.length > 0 && (
        <>
          <Divider />
          <SectionHeader title="Refinar categoria" />
          <ul className="flex gap-1.5 overflow-x-auto no-scrollbar px-3.5 pb-2 list-none m-0 p-0">
            {children.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/comercio/${c.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full bg-white border border-ink-200 text-[13px] font-medium text-ink-900 whitespace-nowrap hover:border-clay-500 hover:text-clay-600 transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Filtros */}
      {districts.length > 1 && (
        <>
          <Divider />
          <form action={`/comercio/${categoria}`} method="get" className="px-3.5">
            <div className="text-[11px] uppercase tracking-wide text-ink-600 font-semibold mb-1.5">
              Filtrar por bairro
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="submit"
                name="bairro"
                value=""
                className={
                  !sp.bairro
                    ? 'px-3 py-1 rounded-full bg-clay-500 text-white text-[13px] font-medium'
                    : 'px-3 py-1 rounded-full bg-white border border-ink-200 text-[13px] font-medium hover:border-clay-500'
                }
              >
                Todos
              </button>
              {districts.map((d) => {
                const active = sp.bairro === d;
                return (
                  <button
                    key={d}
                    type="submit"
                    name="bairro"
                    value={d}
                    className={
                      active
                        ? 'px-3 py-1 rounded-full bg-clay-500 text-white text-[13px] font-medium'
                        : 'px-3 py-1 rounded-full bg-white border border-ink-200 text-[13px] font-medium hover:border-clay-500'
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            {sp.q && <input type="hidden" name="q" value={sp.q} />}
          </form>
        </>
      )}

      <Divider />

      {/* Lista */}
      <Band variant="paper-card">
        {list.length === 0 ? (
          <div className="px-3.5 py-8 text-center">
            <p className="text-[14px] text-ink-700 m-0">
              Nada encontrado em <strong>{category.name}</strong> com esses filtros.
            </p>
            <p className="text-[12px] text-ink-600 m-0 mt-1">Tente outras palavras ou remova os filtros.</p>
          </div>
        ) : (
          list.map((b) => <BusinessListItem key={b.id} business={b} hideCategory={!parent} />)
        )}
      </Band>

      <TabBar active="comercio" />
    </AppFrame>
  );
}
