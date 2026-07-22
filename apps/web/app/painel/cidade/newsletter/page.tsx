import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getNewsletterStats } from '@/lib/newsletter/queries';

export const metadata = { title: 'Newsletter - Portal Carmelitano' };

export default async function CityNewsletterPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const stats = await getNewsletterStats(city.id);

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <p className="mt-2 text-muted-foreground">Audience com double opt-in e auditoria LGPD.</p>
      </header>
      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Ativos" value={stats.active} />
        <Metric label="Pendentes" value={stats.pending} />
        <Metric label="Cancelados" value={stats.unsubscribed} />
        <Metric label="Campanhas" value={stats.campaigns} />
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <AdminLink href="/painel/cidade/newsletter/assinantes" label="Assinantes" />
        <AdminLink href="/painel/cidade/newsletter/campanhas" label="Campanhas" />
        <AdminLink href="/painel/cidade/newsletter/consentimentos" label="Consentimentos" />
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-lg border bg-card p-4 font-medium hover:bg-muted/40">{label}</Link>;
}
