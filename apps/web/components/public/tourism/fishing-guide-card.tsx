import Link from 'next/link';
import { Anchor, BadgeCheck } from 'lucide-react';
import type { FishingGuide } from '@/lib/tourism';

export function FishingGuideCard({ item }: { item: FishingGuide }) {
  return (
    <Link href={`/turismo/pesca/guias/${item.slug}`} className="block rounded-md border border-ink-100 bg-white p-3 no-underline">
      <div className="flex items-center gap-2">
        <Anchor size={22} className="text-cerrado-700" />
        {item.verified && <BadgeCheck size={16} className="text-sky-700" />}
      </div>
      <h2 className="m-0 mt-2 font-sans text-[15px] font-extrabold text-ink-900">{item.fullName}</h2>
      <p className="m-0 mt-1 text-[13px] text-ink-700">{item.about ?? 'Guia de pesca esportiva.'}</p>
      <p className="m-0 mt-2 text-[12px] text-ink-600">{item.hasBoat ? 'Com barco' : 'Sem barco informado'}</p>
    </Link>
  );
}
