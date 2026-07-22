import Link from 'next/link';
import { BedDouble, Waves } from 'lucide-react';
import type { Accommodation } from '@/lib/tourism';

function money(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AccommodationCard({ item }: { item: Accommodation }) {
  return (
    <Link href={`/turismo/onde-ficar/${item.slug}`} className="block rounded-md border border-ink-100 bg-white p-3 no-underline">
      <div className="flex aspect-[16/9] items-center justify-center rounded-xs bg-cerrado-100">
        <BedDouble size={34} className="text-cerrado-700" />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="m-0 font-sans text-[15px] font-extrabold text-ink-900">{item.name}</h2>
          <p className="m-0 mt-1 text-[13px] text-ink-700">{item.shortDescription ?? item.type}</p>
        </div>
        {item.nearLake && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700">
            <Waves size={13} />
            Pé na água
          </span>
        )}
      </div>
      <p className="m-0 mt-2 text-[12px] text-ink-600">
        {money(item.priceMin) ? `A partir de ${money(item.priceMin)}` : 'Preço sob consulta'}
      </p>
    </Link>
  );
}
