import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { unifiedSearch } from '@/lib/search/semantic';
import type { SearchEntityType } from '@/lib/search/types';
import { SearchBar } from '@/components/search/search-bar';
import { SearchEmptyState } from '@/components/search/search-empty-state';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResultsList } from '@/components/search/search-results-list';

export const metadata: Metadata = {
  title: 'Buscar | Portal Carmelitano',
  description: 'Busca unificada no Portal Carmelitano.',
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
  }>;
};

const allowedTypes: SearchEntityType[] = [
  'business',
  'accommodation',
  'restaurant',
  'tourism_guide',
  'fishing_guide',
  'event',
  'classified',
  'property',
  'attraction',
  'tour_package',
  'site_page',
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const selectedTypes = parseTypes(params.tipo);
  const city = await getCurrentCity();
  const result = city && query.length >= 2
    ? await unifiedSearch(query, city.id, { types: selectedTypes, limit: 24 })
    : { queryId: null, hits: [], latencyMs: 0, usedFallback: false };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-6 md:px-6 md:py-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Buscar em {city?.name ?? 'Portal Carmelitano'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encontre comércio, turismo, eventos, classificados e imóveis em uma busca só.
          </p>
        </div>

        <div className="rounded-2xl bg-clay-500 p-3.5">
          <SearchBar initialQuery={query} />
        </div>

        <section className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">Quer perguntar do seu jeito?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A TormentaIA entende perguntas sobre clima, balsas, turismo, comércio, eventos e serviços da cidade.
              </p>
            </div>
          </div>
          <Link
            href={`/assistente${query.length >= 2 ? `?q=${encodeURIComponent(query)}` : ''}`}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Usar IA
          </Link>
        </section>

        <SearchFilters query={query} selectedTypes={selectedTypes} />
      </section>

      <section className="mt-6">
        {query.length < 2 ? (
          <SearchEmptyState />
        ) : result.hits.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <p>
                {result.hits.length} resultado{result.hits.length === 1 ? '' : 's'} para{' '}
                <strong className="text-foreground">{query}</strong>
              </p>
              <p>{result.usedFallback ? 'Busca por texto' : `Busca semântica em ${result.latencyMs}ms`}</p>
            </div>
            <SearchResultsList hits={result.hits} queryId={result.queryId} />
          </div>
        ) : (
          <SearchEmptyState query={query} />
        )}
      </section>
    </main>
  );
}

function parseTypes(value: string | undefined): SearchEntityType[] {
  if (!value) return [];
  return value
    .split(',')
    .filter((type): type is SearchEntityType => allowedTypes.includes(type as SearchEntityType));
}
