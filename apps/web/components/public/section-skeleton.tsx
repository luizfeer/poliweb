import { cn } from '@/lib/utils';

type Props = {
  title?: string;
  cards?: number;
  columns?: 2 | 3 | 4;
  hero?: boolean;
};

export function SectionSkeleton({
  title,
  cards = 8,
  columns = 3,
  hero = true,
}: Props) {
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div
      aria-busy
      aria-live="polite"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
    >
      <span className="sr-only">{title ? `Carregando ${title}…` : 'Carregando…'}</span>

      {hero && (
        <div className="page-enter mb-6 space-y-3">
          <div className="skeleton-shimmer h-7 w-2/3 max-w-md sm:h-9" />
          <div className="skeleton-shimmer h-4 w-1/2 max-w-sm" />
          <div className="mt-4 flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-9 w-24 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      )}

      <div className={cn('stagger-rise grid grid-cols-1 gap-4', gridCols)}>
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-[color:var(--carmo-paper-deep)] bg-white shadow-sm"
          >
            <div className="skeleton-shimmer aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <div className="skeleton-shimmer h-5 w-3/4" />
              <div className="skeleton-shimmer h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="skeleton-shimmer h-6 w-16 rounded-full" />
                <div className="skeleton-shimmer h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
