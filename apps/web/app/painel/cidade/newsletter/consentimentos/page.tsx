import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listConsentHistory } from '@/lib/newsletter/queries';

export const metadata = { title: 'Consentimentos da newsletter - Portal Carmelitano' };

export default async function NewsletterConsentPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const events = await listConsentHistory(city.id);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Consentimentos</h1>
      <section className="space-y-2">
        {events.map((event) => (
          <article key={event.id} className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">{event.event}</h2>
            <p className="text-sm text-muted-foreground">{event.email} / {event.source ?? 'sem origem'} / {event.created_at}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
