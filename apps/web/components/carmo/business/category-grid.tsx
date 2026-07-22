import Link from 'next/link';
import type { BusinessCategory } from '@/lib/businesses/types';
import { getCategoryIcon } from '@/lib/businesses/icon-map';
import { cn } from '@/lib/utils';

type CategoryGridProps = {
  categories: BusinessCategory[];
  /** Mapa de contagens por slug — quando definido, mostra "N negócios" embaixo. */
  counts?: Record<string, number>;
  /** Prefixo de URL. Default: "/comercio". */
  hrefPrefix?: string;
  className?: string;
};

/**
 * Grid 2-col de macro categorias com ícone, nome e contagem.
 * Usado no hub do `/comercio`.
 */
export function CategoryGrid({
  categories,
  counts,
  hrefPrefix = '/comercio',
  className,
}: CategoryGridProps) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-2 px-3.5 list-none m-0 p-0 [&>li]:m-0',
        className,
      )}
    >
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.icon);
        const count = counts?.[cat.slug];
        return (
          <li key={cat.slug}>
            <Link
              href={`${hrefPrefix}/${cat.slug}`}
              className="block bg-white rounded-md border border-ink-100 p-3 hover:bg-paper-tint transition-colors h-full"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-md bg-clay-50 text-clay-600 flex items-center justify-center shrink-0">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-ink-900 leading-tight">
                    {cat.name}
                  </div>
                  {cat.blurb && (
                    <p className="text-[11px] text-ink-600 leading-snug m-0 mt-0.5 line-clamp-2">
                      {cat.blurb}
                    </p>
                  )}
                  {count !== undefined && (
                    <div className="text-[11px] text-clay-600 font-medium mt-1">
                      {count} {count === 1 ? 'negócio' : 'negócios'}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
