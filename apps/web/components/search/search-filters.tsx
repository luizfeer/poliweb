import Link from 'next/link';
import type { SearchEntityType } from '@/lib/search/types';
import { cn } from '@/lib/utils';

type SearchFiltersProps = {
  query: string;
  selectedTypes: SearchEntityType[];
};

const filters: Array<{ type: SearchEntityType; label: string }> = [
  { type: 'business', label: 'Comércio' },
  { type: 'restaurant', label: 'Restaurantes' },
  { type: 'accommodation', label: 'Hospedagem' },
  { type: 'event', label: 'Eventos' },
  { type: 'classified', label: 'Classificados' },
  { type: 'property', label: 'Imóveis' },
  { type: 'attraction', label: 'Turismo' },
  { type: 'tourism_guide', label: 'Guias' },
  { type: 'site_page', label: 'Páginas' },
];

export function SearchFilters({ query, selectedTypes }: SearchFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <FilterLink query={query} selected={selectedTypes.length === 0} label="Tudo" />
      {filters.map((filter) => (
        <FilterLink
          key={filter.type}
          query={query}
          type={filter.type}
          selected={selectedTypes.includes(filter.type)}
          label={filter.label}
        />
      ))}
    </div>
  );
}

function FilterLink({
  query,
  type,
  selected,
  label,
}: {
  query: string;
  type?: SearchEntityType;
  selected: boolean;
  label: string;
}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (type) params.set('tipo', type);

  return (
    <Link
      href={`/buscar?${params.toString()}`}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-accent',
      )}
    >
      {label}
    </Link>
  );
}
