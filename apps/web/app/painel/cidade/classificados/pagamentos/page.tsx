import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getClassifiedsConfig } from '@/lib/classifieds/queries';
import { calculateFee } from '@/lib/classifieds/pricing';
import type { ClassifiedType } from '@/lib/classifieds/types';

const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const metadata = { title: 'Pagamentos de classificados - Portal Carmelitano' };

export default async function ClassifiedPaymentsPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const config = await getClassifiedsConfig(city.id);

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Classificados</p>
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <p className="mt-2 text-muted-foreground">Paywall preparado. Ativacao depende de city_modules.config.</p>
      </header>
      <section className="grid gap-3 md:grid-cols-4">
        {(['job', 'service', 'vehicle', 'item'] as ClassifiedType[]).map((type) => (
          <article key={type} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{type}</p>
            <p className="mt-2 text-2xl font-bold">{moneyFormatter.format(calculateFee(type, config) / 100)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
