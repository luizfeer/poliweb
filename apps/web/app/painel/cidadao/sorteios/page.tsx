import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listMyEntries } from '@/lib/raffles/queries';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  active: {
    label: 'Aberto',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  drawn: {
    label: 'Sorteado',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  cancelled: {
    label: 'Cancelado',
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
};

export default async function MeusSorteiosPage() {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return null;

  const entries = await listMyEntries(auth.profile.id, city.id);

  const totals = entries.reduce(
    (acc, e) => ({
      total: acc.total + 1,
      pointsSpent: acc.pointsSpent + e.pointsSpent,
      wins: acc.wins + (e.isWinner ? 1 : 0),
      active: acc.active + (e.status === 'active' ? 1 : 0),
    }),
    { total: 0, pointsSpent: 0, wins: 0, active: 0 },
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Meus sorteios</h1>
        <p className="text-muted-foreground">
          Acompanhe sorteios em que você participou em {city.name}.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Participações</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{totals.total}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Em andamento</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{totals.active}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pontos investidos</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{totals.pointsSpent}</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-100 p-5 dark:from-amber-950/30 dark:to-orange-950/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Prêmios ganhos</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{totals.wins} 🏆</p>
        </div>
      </section>

      <section className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Você ainda não participou de nenhum sorteio.
            </p>
            <Link
              href="/sorteios"
              className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Ver sorteios abertos
            </Link>
          </div>
        ) : (
          entries.map((entry) => {
            const badge = STATUS_BADGE[entry.status] ?? STATUS_BADGE.active;
            return (
              <article
                key={entry.id}
                className={`overflow-hidden rounded-2xl border bg-card transition hover:shadow-md ${
                  entry.isWinner
                    ? 'ring-2 ring-amber-400 dark:ring-amber-600'
                    : ''
                }`}
              >
                <Link
                  href={`/sorteios/${entry.slug}`}
                  className="grid gap-4 p-5 sm:grid-cols-[auto,1fr,auto] sm:items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="hidden h-20 w-32 shrink-0 rounded-xl bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300 sm:block" />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{entry.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}>
                        {badge.label}
                      </span>
                      {entry.isWinner && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                          🎉 VOCÊ GANHOU
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      🎁 {entry.prizeDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.status === 'active'
                        ? `Sorteio em ${new Date(entry.drawAt).toLocaleDateString('pt-BR', { timeZone: city.timezone })}`
                        : `Sorteado ${entry.drawnAt ? new Date(entry.drawnAt).toLocaleDateString('pt-BR', { timeZone: city.timezone }) : ''}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase text-muted-foreground">Suas entradas</p>
                    <p className="text-2xl font-bold tabular-nums">{entry.myEntries}</p>
                    <p className="text-xs text-muted-foreground">{entry.pointsSpent} pts gastos</p>
                  </div>
                </Link>

                {entry.isWinner && (
                  <div className="border-t bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    Parabéns! A equipe da prefeitura entrará em contato para combinar a entrega do prêmio.
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

    </div>
  );
}
