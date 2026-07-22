import { Link } from '@/components/navigation/link';
import { RaffleForm } from '@/components/admin/raffle-form';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';

export const dynamic = 'force-dynamic';

export default async function NovoSorteioPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link href="/painel/cidade/sorteios" className="text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
      </nav>

      <header>
        <h1 className="text-3xl font-bold">Novo sorteio</h1>
        <p className="text-muted-foreground">
          O sorteio começa como rascunho. Ative quando estiver pronto para receber inscrições.
        </p>
      </header>

      <RaffleForm />
    </div>
  );
}
