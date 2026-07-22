import Link from 'next/link';
import { Waves } from 'lucide-react';
import type { FishingSpot } from '@/lib/tourism';

export function FishingSpotCard({ item }: { item: FishingSpot }) {
  return (
    <Link href={`/turismo/pesca/pontos/${item.slug}`} className="block rounded-md border border-ink-100 bg-white p-3 no-underline">
      <Waves size={24} className="text-sky-700" />
      <h2 className="m-0 mt-2 font-sans text-[15px] font-extrabold text-ink-900">{item.name}</h2>
      <p className="m-0 mt-1 text-[13px] text-ink-700">{item.description ?? 'Ponto de pesca em Furnas.'}</p>
      <p className="m-0 mt-2 text-[12px] text-ink-600">{item.species.join(' · ')}</p>
    </Link>
  );
}
