import { requireRole } from '@/lib/auth';

export const metadata = { title: 'Saude tecnica - Portal Carmelitano' };

export default async function TechnicalHealthPage() {
  await requireRole({ kinds: ['super_admin'] });

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Super admin</p>
        <h1 className="text-3xl font-bold">Saude tecnica</h1>
        <p className="mt-2 text-muted-foreground">Base para acompanhar Lighthouse, build size, erros e scrapers.</p>
      </header>
      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Lighthouse" value="pendente" />
        <Metric label="Build size" value="pendente" />
        <Metric label="Erros 4xx/5xx" value="pendente" />
        <Metric label="Scrapers" value="pendente" />
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </article>
  );
}
