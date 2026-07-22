import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listCampaigns } from '@/lib/newsletter/queries';

export const metadata = { title: 'Campanhas da newsletter - Portal Carmelitano' };

export default async function NewsletterCampaignsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const campaigns = await listCampaigns(city.id);

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Campanhas</h1>
      <section className="space-y-2">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">{campaign.subject}</h2>
            <p className="text-sm text-muted-foreground">
              {campaign.sent_at ?? 'rascunho'} / {campaign.recipients_count} destinatarios
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
