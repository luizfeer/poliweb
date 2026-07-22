import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { FerryRouteForm } from '../_form';

export default async function NovaBalsaPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  return (
    <div className="space-y-4">
      <Link
        href="/painel/cidade/servicos/balsas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>
      <header>
        <h1 className="text-3xl font-bold">Nova rota de balsa</h1>
        <p className="text-muted-foreground">Após criar a rota você poderá adicionar horários e avisos.</p>
      </header>
      <FerryRouteForm cityId={city.id} />
    </div>
  );
}
