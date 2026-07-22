import { Search } from 'lucide-react';
import {
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
} from '@/lib/real-estate';

type PropertyFiltersProps = {
  action?: string;
  defaults?: {
    q?: string;
    finalidade?: string;
    tipo?: string;
    min?: string;
    max?: string;
    quartos?: string;
  };
};

export function PropertyFilters({ action = '/imoveis/buscar', defaults }: PropertyFiltersProps) {
  return (
    <form action={action} className="space-y-2 rounded-md border border-ink-100 bg-white p-3 shadow-card">
      <label className="flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-paper px-3">
        <Search size={18} className="text-ink-600" />
        <input
          name="q"
          defaultValue={defaults?.q}
          placeholder="Buscar por bairro, rancho, casa..."
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <select name="finalidade" defaultValue={defaults?.finalidade ?? ''} className="h-9 rounded-md border border-ink-200 bg-white px-2 text-[13px]">
          <option value="">Finalidade</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {LISTING_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <select name="tipo" defaultValue={defaults?.tipo ?? ''} className="h-9 rounded-md border border-ink-200 bg-white px-2 text-[13px]">
          <option value="">Tipo</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input name="min" defaultValue={defaults?.min} inputMode="numeric" placeholder="Preço mínimo" className="h-9 rounded-md border border-ink-200 px-2 text-[13px]" />
        <input name="max" defaultValue={defaults?.max} inputMode="numeric" placeholder="Preço máximo" className="h-9 rounded-md border border-ink-200 px-2 text-[13px]" />
        <input name="quartos" defaultValue={defaults?.quartos} inputMode="numeric" placeholder="Quartos" className="h-9 rounded-md border border-ink-200 px-2 text-[13px]" />
        <button className="h-9 rounded-md bg-clay-500 px-3 text-[13px] font-bold text-white" type="submit">
          Buscar
        </button>
      </div>
    </form>
  );
}
