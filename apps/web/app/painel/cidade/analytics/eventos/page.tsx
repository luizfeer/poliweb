import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listAnalyticsEvents } from '@/lib/analytics/events';

export const metadata = { title: 'Eventos de analytics - Portal Carmelitano' };

export default async function AnalyticsEventsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const events = await listAnalyticsEvents(city.id);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Eventos</h1>
      <section className="space-y-2">
        {events.map((event) => (
          <article key={event.id} className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">{event.event_name}</h2>
            <p className="text-sm text-muted-foreground">{event.path} / {event.created_at}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
