import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { RaffleForm } from '@/components/admin/raffle-form';
import { Button } from '@/components/ui/button';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getRaffleById, getRaffleStats } from '@/lib/raffles';
import {
  activateRaffleAction,
  cancelRaffleAction,
  drawRaffleWinnerAction,
} from '../actions';

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default async function RaffleAdminEditPage({ params }: Props) {
  const { id } = await params;
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const raffle = await getRaffleById(city.id, id);
  if (!raffle) notFound();

  const stats = await getRaffleStats(raffle.id);

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link href="/painel/cidade/sorteios" className="text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
      </nav>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{raffle.title}</h1>
          <p className="text-muted-foreground">Status: <strong>{raffle.status}</strong></p>
        </div>
        <Link
          href={`/sorteios/${raffle.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-700 hover:underline dark:text-amber-300"
        >
          Ver página pública →
        </Link>
      </header>

      <section className="grid gap-3 rounded-2xl border bg-card p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Entradas</p>
          <p className="text-2xl font-bold tabular-nums">{stats.totalEntries}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Pessoas</p>
          <p className="text-2xl font-bold tabular-nums">{stats.uniqueProfiles}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Receita em pts</p>
          <p className="text-2xl font-bold tabular-nums">{stats.totalEntries * raffle.entryCostPoints}</p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3 rounded-2xl border bg-muted/40 p-6">
        {raffle.status === 'draft' && (
          <form action={activateRaffleAction}>
            <input type="hidden" name="id" value={raffle.id} />
            <Button type="submit">Ativar sorteio</Button>
          </form>
        )}
        {raffle.status === 'active' && (
          <>
            <form action={drawRaffleWinnerAction}>
              <input type="hidden" name="id" value={raffle.id} />
              <Button type="submit">Sortear ganhador agora</Button>
            </form>
            <form action={cancelRaffleAction}>
              <input type="hidden" name="id" value={raffle.id} />
              <Button type="submit" variant="outline">Cancelar e reembolsar</Button>
            </form>
          </>
        )}
        {raffle.status === 'drawn' && raffle.winnerProfileId && (
          <p className="text-sm">
            Ganhador (UUID): <code className="rounded bg-background px-2 py-0.5 text-xs">{raffle.winnerProfileId}</code>
          </p>
        )}
      </section>

      <RaffleForm raffle={raffle} />
    </div>
  );
}
