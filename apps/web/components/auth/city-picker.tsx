import Link from 'next/link';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export async function CityPicker() {
  const [city, supabase] = await Promise.all([getCurrentCity(), createClient()]);
  const { data: cities } = await supabase
    .from('cities')
    .select('slug, name, state')
    .eq('status', 'active')
    .order('name');

  return (
    <details className="relative">
      <summary className="cursor-pointer rounded-full border px-3 py-1 text-sm">
        Você está em <strong>{city?.name ?? 'Carmo'}</strong>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border bg-card p-2 shadow-lg">
        {(cities ?? []).map((item) => (
          <Link
            key={item.slug}
            href={`/c/${item.slug}`}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
          >
            {item.name}/{item.state}
          </Link>
        ))}
      </div>
    </details>
  );
}
