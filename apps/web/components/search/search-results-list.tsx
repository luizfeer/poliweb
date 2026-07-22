import type { SearchHit } from '@/lib/search/types';
import { SearchResultCard } from './search-result-card';

type SearchResultsListProps = {
  hits: SearchHit[];
  queryId: string | null;
};

export function SearchResultsList({ hits, queryId }: SearchResultsListProps) {
  return (
    <div className="space-y-3">
      {hits.map((hit) => (
        <SearchResultCard key={`${hit.entityType}:${hit.entityId}`} hit={hit} queryId={queryId} />
      ))}
    </div>
  );
}
