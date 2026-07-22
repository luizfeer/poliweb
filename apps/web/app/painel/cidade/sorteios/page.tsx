import { Link } from '@/components/navigation/link';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listAllRafflesForAdmin } from '@/lib/raffles';
import type { Database } from '@/lib/supabase/database.types';

type RaffleStatus = Database['public']['Tables']['raffles']['Row']['status'];

const STATUS_LABEL: Record<RaffleStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  drawn: 'Sorteado',
  cancelled: 'Cancelado',
};

const STATUS_CLASSES: Record<RaffleStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  drawn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

export const dynamic = 'force-dynamic';

export default async function SorteiosAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const raffles = await listAllRafflesForAdmin(city.id);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sorteios</h1>
          <p className="text-muted-foreground">Crie, ative e sorteie prêmios para os cidadãos.</p>
        </div>
        <Link
          href="/painel/cidade/sorteios/novo"
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          + Novo sorteio
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Status</th>
              <th className="p-3">Prêmio</th>
              <th className="p-3">Custo</th>
              <th className="p-3">Sorteio em</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {raffles.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  Nenhum sorteio criado ainda.
                </td>
              </tr>
            )}
            {raffles.map((raffle) => (
              <tr key={raffle.id} className="border-t">
                <td className="p-3 font-medium">{raffle.title}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASSES[raffle.status]}`}>
                    {STATUS_LABEL[raffle.status]}
                  </span>
                </td>
                <td className="p-3 max-w-xs truncate text-muted-foreground">{raffle.prizeDescription}</td>
                <td className="p-3 tabular-nums">{raffle.entryCostPoints} pts</td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {new Date(raffle.drawAt).toLocaleString('pt-BR', { timeZone: city.timezone })}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/painel/cidade/sorteios/${raffle.id}`}
                    className="text-sm text-amber-700 hover:underline dark:text-amber-300"
                  >
                    Gerenciar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
