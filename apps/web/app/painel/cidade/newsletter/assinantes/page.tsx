import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listSubscribers } from '@/lib/newsletter/queries';

export const metadata = { title: 'Assinantes da newsletter - Portal Carmelitano' };

export default async function NewsletterSubscribersPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const subscribers = await listSubscribers(city.id);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Assinantes</h1>
      <section className="space-y-2">
        {subscribers.map((subscriber) => (
          <article key={subscriber.id} className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">{subscriber.email}</h2>
            <p className="text-sm text-muted-foreground">
              {subscriber.unsubscribed_at ? 'cancelado' : subscriber.confirmed_at ? 'confirmado' : 'pendente'} / {subscriber.source}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
