'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BusinessCategoryIcon } from '@/lib/businesses/icon-map';

type IconPickerProps = {
  defaultValue?: string | null;
  icons: string[];
};

export function IconPicker({ defaultValue, icons }: IconPickerProps) {
  const initialIcon = defaultValue && icons.includes(defaultValue) ? defaultValue : 'Store';
  const [selectedIcon, setSelectedIcon] = useState(initialIcon);
  const [query, setQuery] = useState('');

  const filteredIcons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return icons;

    return icons.filter((icon) => icon.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  }, [icons, query]);

  return (
    <div className="grid gap-2">
      <input type="hidden" name="icon" value={selectedIcon} />

      <div className="flex min-h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm">
        <BusinessCategoryIcon name={selectedIcon} className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 truncate">{selectedIcon}</span>
      </div>

      <details className="group rounded-lg border bg-muted/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold">
          Escolher ícone
          <span className="text-xs font-medium text-muted-foreground group-open:hidden">Abrir galeria</span>
          <span className="hidden text-xs font-medium text-muted-foreground group-open:inline">Fechar</span>
        </summary>

        <div className="border-t p-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ícone"
              type="search"
            />
          </label>

          <div className="mt-3 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {filteredIcons.length > 0 ? (
              filteredIcons.map((icon) => {
                const selected = icon === selectedIcon;

                return (
                  <button
                    key={icon}
                    className={
                      selected
                        ? 'flex min-w-0 items-center gap-2 rounded-lg border border-primary bg-primary/10 px-2 py-2 text-left text-sm font-semibold text-primary'
                        : 'flex min-w-0 items-center gap-2 rounded-lg border bg-background px-2 py-2 text-left text-sm font-medium hover:bg-muted'
                    }
                    onClick={() => setSelectedIcon(icon)}
                    type="button"
                  >
                    <BusinessCategoryIcon name={icon} className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{icon}</span>
                  </button>
                );
              })
            ) : (
              <p className="col-span-full rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                Nenhum ícone encontrado.
              </p>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
