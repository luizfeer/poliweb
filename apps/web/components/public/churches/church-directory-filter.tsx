'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { ChurchCard } from './church-card';
import type { Church, ChurchScheduleItem, ChurchTradition } from '@/lib/churches/types';

type TraditionFilter = 'all' | Extract<ChurchTradition, 'catolica' | 'evangelica'>;

const storageKey = 'carmo-local:church-tradition-filter';

const filterLabels: Record<TraditionFilter, string> = {
  all: 'Todas',
  catolica: 'Católicas',
  evangelica: 'Evangélicas',
};

function readSavedFilter(): TraditionFilter {
  if (typeof window === 'undefined') return 'all';
  const saved = window.localStorage.getItem(storageKey);
  if (saved === 'catolica' || saved === 'evangelica' || saved === 'all') return saved;
  return 'all';
}

export function ChurchDirectoryFilter({
  churches,
  schedule,
}: {
  churches: Church[];
  schedule: ChurchScheduleItem[];
}) {
  const filter = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);
      return () => window.removeEventListener('storage', onStoreChange);
    },
    readSavedFilter,
    () => 'all',
  );

  function updateFilter(nextFilter: TraditionFilter) {
    window.localStorage.setItem(storageKey, nextFilter);
    window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: nextFilter }));
  }

  const filteredChurches = useMemo(() => {
    if (filter === 'all') return churches;
    return churches.filter((church) => church.tradition === filter);
  }, [churches, filter]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-normal text-clay-600">Diretório</p>
          <h2 className="text-[22px] font-extrabold text-ink-900">Igrejas cadastradas</h2>
        </div>
        <div className="inline-flex w-full rounded-lg border border-ink-100 bg-white p-1 shadow-card sm:w-auto">
          {(Object.keys(filterLabels) as TraditionFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => updateFilter(key)}
              className={
                filter === key
                  ? 'flex-1 rounded-md bg-clay-500 px-3 py-2 text-[13px] font-extrabold text-white sm:flex-none'
                  : 'flex-1 rounded-md px-3 py-2 text-[13px] font-bold text-ink-700 hover:bg-paper sm:flex-none'
              }
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <p className="max-w-xl text-[13px] leading-relaxed text-ink-600">
        Horários marcados como “a verificar” devem ser confirmados no Instagram ou contato oficial da igreja.
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredChurches.map((church) => (
          <ChurchCard
            key={church.id}
            church={church}
            schedule={schedule.filter((item) => item.churchSlug === church.slug)}
          />
        ))}
      </div>
    </section>
  );
}
