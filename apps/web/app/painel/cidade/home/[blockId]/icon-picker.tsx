'use client';

import { useState } from 'react';
import { ICON_MAP, ICON_NAMES, type IconName } from '@/components/public/home/icon-map';

type Props = {
  value: string | undefined;
  onChange: (name: string) => void;
};

export function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const currentName: IconName = value && value in ICON_MAP ? (value as IconName) : 'Tag';
  const Current = ICON_MAP[currentName];

  const filtered = ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-ink-200 flex h-9 w-full items-center gap-2 rounded-md border bg-white px-2 text-sm hover:bg-paper"
      >
        <Current className="h-4 w-4 text-ink-700" aria-hidden="true" />
        <span className="text-ink-900 truncate font-mono text-xs">{value ?? 'Tag'}</span>
        <span className="ml-auto text-[10px] text-ink-600">trocar</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-[280px] overflow-hidden rounded-md border bg-white shadow-lg">
          <input
            autoFocus
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar..."
            className="w-full border-b border-ink-100 px-2 py-1.5 text-xs outline-none"
          />
          <div className="grid max-h-[230px] grid-cols-6 gap-1 overflow-auto p-2">
            {filtered.map((name) => {
              const Icon = ICON_MAP[name];
              const selected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setFilter('');
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    selected
                      ? 'bg-primary/15 text-primary ring-2 ring-primary/40'
                      : 'text-ink-700 hover:bg-paper'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <p className="col-span-6 py-3 text-center text-xs text-ink-600">Nenhum icone.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
