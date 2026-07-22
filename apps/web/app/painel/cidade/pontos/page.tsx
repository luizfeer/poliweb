import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getCityPointsSummary, getTopCitizensByBalance, getRecentTransactions } from '@/lib/points/admin-queries';

export const dynamic = 'force-dynamic';

function medal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}º`;
}

export default async function PontosCityAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const [summary, ranking, recent] = await Promise.all([
    getCityPointsSummary(city.id),
    getTopCitizensByBalance(city.id, 50),
    getRecentTransactions(city.id, 30),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Pontos da cidade</h1>
        <p className="text-muted-foreground">
          Visão geral da economia de pontos em {city.name}.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cidadãos com saldo</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalCitizensWithBalance}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo em circulação</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalBalanceInCirculation.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total acumulado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalLifetimeEarned.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-100 p-5 dark:from-emerald-950/30 dark:to-teal-950/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Indicações totais</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalReferralConversions}</p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-100 p-5 dark:from-amber-950/30 dark:to-orange-950/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Entradas em sorteios</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalRaffleEntries}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/40 p-4">
            <div>
              <h2 className="text-lg font-semibold">Top 50 — saldo</h2>
              <p className="text-xs text-muted-foreground">Ordenado pelo saldo atual</p>
            </div>
            <button
              type="button"
              className="rounded-lg border bg-background px-3 py-1.5 text-xs hover:bg-muted"
              disabled
              title="Ajuste manual estará disponível em breve"
            >
              + Ajuste manual
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3">Cidadão</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3 text-right">Acumulado</th>
                <th className="p-3 text-right">Indicações</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, idx) => (
                <tr key={row.profileId} className="border-t">
                  <td className="p-3 text-center font-bold">{medal(idx)}</td>
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3 text-right font-mono tabular-nums">{row.balance.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">
                    {row.lifetimeEarned.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {row.referralConversionsCount > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {row.referralConversionsCount}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/40 p-4">
            <h2 className="text-lg font-semibold">Atividade recente</h2>
            <p className="text-xs text-muted-foreground">Últimas transações</p>
          </div>
          <ul className="divide-y">
            {recent.map((tx) => {
              const isCredit = tx.delta > 0;
              const whenText = new Intl.DateTimeFormat('pt-BR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: city.timezone,
              }).format(new Date(tx.createdAt));
              return (
                <li key={tx.id} className="flex items-start gap-3 p-3 text-sm">
                  <span
                    className={`mt-0.5 inline-flex h-7 w-12 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      isCredit
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {isCredit ? '+' : ''}
                    {tx.delta}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tx.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tx.reason}</p>
                    <p className="text-xs text-muted-foreground/80">{whenText}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

    </div>
  );
}
