import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { countClassifiedsByType, listClassifiedReports, listClassifiedsForReview } from '@/lib/classifieds/queries';

export const metadata = { title: 'Classificados da cidade - Portal Carmelitano' };

export default async function CityClassifiedsPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const [counts, queue, reports] = await Promise.all([
    countClassifiedsByType(city.id),
    listClassifiedsForReview(city.id),
    listClassifiedReports(city.id),
  ]);

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Classificados</h1>
        <p className="mt-2 text-muted-foreground">Aprovacao, denuncias e receita futura por tipo.</p>
      </header>
      <section className="grid gap-3 md:grid-cols-4">
        {Object.entries(counts).filter(([type]) => type !== 'other').map(([type, count]) => (
          <Link key={type} href="/painel/cidade/classificados/aprovacao" className="rounded-lg border bg-card p-4 hover:bg-muted/40">
            <p className="text-sm text-muted-foreground">{type}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
          </Link>
        ))}
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/painel/cidade/classificados/aprovacao" className="rounded-lg border bg-card p-4 font-medium hover:bg-muted/40">
          Fila de aprovacao ({queue.length})
        </Link>
        <Link href="/painel/cidade/classificados/reports" className="rounded-lg border bg-card p-4 font-medium hover:bg-muted/40">
          Denuncias ({reports.length})
        </Link>
        <Link href="/painel/cidade/classificados/pagamentos" className="rounded-lg border bg-card p-4 font-medium hover:bg-muted/40">
          Pagamentos
        </Link>
      </section>
    </main>
  );
}
