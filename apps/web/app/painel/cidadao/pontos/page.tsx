import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getMyBalance, getMyTransactions } from '@/lib/points';
import { REASON_LABELS, type PointReason } from '@/lib/points/economy';

const PAGE_SIZE = 30;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function PontosPage({ searchParams }: Props) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return null;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [balance, history] = await Promise.all([
    getMyBalance(city.id),
    getMyTransactions(city.id, { limit: PAGE_SIZE, offset }),
  ]);

  const totalPages = Math.max(1, Math.ceil(history.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Meus pontos</h1>
        <p className="text-muted-foreground">
          Olá, {auth.profile.full_name?.split(' ')[0] ?? 'cidadão'}. Aqui está seu extrato em {city.name}.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-100 p-6 dark:from-amber-950/30 dark:to-orange-950/30">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo atual</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{balance.balance.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">pontos disponíveis</p>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total acumulado</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{balance.lifetimeEarned.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">desde sempre</p>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Próximo passo</p>
          <p className="mt-2 text-sm">Ganhe mais pontos indicando amigos.</p>
          <Link
            href="/painel/cidadao/indicar"
            className="mt-3 inline-block rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Pegar meu link
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Histórico</h2>
        </div>

        {history.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Você ainda não tem transações. Comece indicando alguém!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Quando</th>
                <th className="p-3">Motivo</th>
                <th className="p-3 text-right">Pontos</th>
                <th className="p-3 text-right">Saldo após</th>
              </tr>
            </thead>
            <tbody>
              {history.items.map((tx) => {
                const isCredit = tx.delta > 0;
                return (
                  <tr key={tx.id} className="border-t">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString('pt-BR', { timeZone: city.timezone })}
                    </td>
                    <td className="p-3">{REASON_LABELS[tx.reason as PointReason] ?? tx.reason}</td>
                    <td className={`p-3 text-right font-mono tabular-nums ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isCredit ? '+' : ''}{tx.delta}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-muted-foreground">
                      {tx.balanceAfter}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {totalPages} ({history.total} transações)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}`} className="rounded-lg border px-3 py-1.5 hover:bg-muted">
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
