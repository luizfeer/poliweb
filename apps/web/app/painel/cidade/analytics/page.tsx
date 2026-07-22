import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listAnalyticsEvents } from '@/lib/analytics/events';

export const metadata = { title: 'Analytics - Portal Carmelitano' };

export default async function CityAnalyticsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const events = await listAnalyticsEvents(city.id);
  const byName = new Map<string, number>();
  for (const event of events) byName.set(event.event_name, (byName.get(event.event_name) ?? 0) + 1);

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">Eventos proprios sem cookies de terceiros.</p>
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        {[...byName.entries()].map(([name, count]) => (
          <article key={name} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
