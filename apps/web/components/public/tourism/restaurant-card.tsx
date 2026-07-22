import Link from 'next/link';
import { Utensils } from 'lucide-react';
import type { TourismRestaurant } from '@/lib/tourism';

export function RestaurantCard({ item }: { item: TourismRestaurant }) {
  return (
    <article className="rounded-md border border-ink-100 bg-white p-3">
      <Utensils size={22} className="text-clay-600" />
      <h2 className="m-0 mt-2 font-sans text-[15px] font-extrabold text-ink-900">{item.name}</h2>
      <p className="m-0 mt-1 text-[13px] text-ink-700">{item.description ?? item.cuisine.join(' · ')}</p>
      <div className="mt-3 flex gap-2">
        {item.phone && <a className="rounded-md bg-clay-500 px-3 py-2 text-[13px] font-bold text-white no-underline" href={`tel:${item.phone.replace(/\D/g, '')}`}>Ligar</a>}
        {item.whatsapp && <a className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline" href={`https://wa.me/55${item.whatsapp.replace(/\D/g, '')}`}>WhatsApp</a>}
        {item.ifoodUrl && <Link className="rounded-md border px-3 py-2 text-[13px] font-bold no-underline" href={item.ifoodUrl}>iFood</Link>}
      </div>
    </article>
  );
}
