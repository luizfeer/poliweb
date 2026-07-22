'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAP_CATEGORY_BY_ID, type MapCategoryId } from '@/lib/maps/categories';
import { cn } from '@/lib/utils';

type SerializableCategory = {
  id: MapCategoryId;
  label: string;
  shortLabel: string;
  color: string;
};

type CategoryFilterBarProps = {
  categories: SerializableCategory[];
  selectedCategories: MapCategoryId[];
  counts: Record<MapCategoryId, number>;
  query: string;
  onQueryChange: (value: string) => void;
  onToggleCategory: (id: MapCategoryId) => void;
  className?: string;
  isDark?: boolean;
};

export type { SerializableCategory };

export function CategoryFilterBar({
  categories,
  selectedCategories,
  counts,
  query,
  onQueryChange,
  onToggleCategory,
  className,
  isDark = false,
}: CategoryFilterBarProps) {
  const selected = new Set(selectedCategories);

  return (
    <div className={cn('space-y-3', className)}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar no mapa"
          className={cn(
            'h-10 rounded-md pl-9 pr-9',
            isDark
              ? 'border-sky-500/25 bg-slate-900/95 text-white placeholder:text-slate-400'
              : 'bg-white',
          )}
          aria-label="Buscar pontos no mapa"
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
            onClick={() => onQueryChange('')}
            aria-label="Limpar busca"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </label>
      <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {categories.map((category) => {
          const Icon = MAP_CATEGORY_BY_ID[category.id].icon;
          const isActive = selected.has(category.id);

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggleCategory(category.id)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-extrabold transition-all',
                isActive
                  ? isDark
                    ? 'border-sky-400/40 bg-sky-500 text-white shadow-sm'
                    : 'border-transparent bg-ink-900 text-white shadow-sm'
                  : isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-ink-200 bg-white text-ink-700',
              )}
            >
              <Icon className="size-3.5" style={{ color: isActive ? '#ffffff' : category.color }} aria-hidden="true" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.shortLabel}</span>
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px]',
                  isActive
                    ? 'bg-white/18 text-white'
                    : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-paper-deep text-ink-600',
                )}
              >
                {counts[category.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
