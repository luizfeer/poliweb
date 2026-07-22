import { ExternalLink, TrendingUp } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getSuperPaymentHistory, type PaymentHistoryRow } from '@/lib/payments/history';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Super: pagamentos - Portal Carmelitano' };

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Em atraso',
  failed: 'Falhou',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export default async function SuperPagamentosPage() {
  await requireRole({ kinds: ['super_admin'] });
  const payments = await getSuperPaymentHistory();
  const paidCents = sumByStatus(payments, ['paid']);
  const paidNetCents = payments
    .filter((payment) => payment.status === 'paid')
    .reduce((total, payment) => total + (payment.net_amount_cents ?? payment.amount_cents), 0);
  const pendingCents = sumByStatus(payments, ['pending']);
  const overdueCents = sumByStatus(payments, ['overdue']);
  const failedCount = payments.filter((payment) => ['failed', 'cancelled', 'refunded'].includes(payment.status)).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Super admin</p>
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Visão global do ledger local sincronizado com eventos do Asaas.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryBox label="Entrada bruta paga" value={formatCurrency(paidCents)} />
        <SummaryBox label="Entrada líquida estimada" value={formatCurrency(paidNetCents)} />
        <SummaryBox label="Pendente" value={formatCurrency(pendingCents)} />
        <SummaryBox label="Em atraso" value={formatCurrency(overdueCents)} />
        <SummaryBox label="Falhas/estornos" value={String(failedCount)} />
      </section>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <TrendingUp className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold">Cobranças recentes</h2>
        </div>
        {payments.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cobrança</th>
                  <th className="px-4 py-3 font-semibold">Usuário</th>
                  <th className="px-4 py-3 font-semibold">Cidade</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Datas</th>
                  <th className="px-4 py-3 font-semibold">Logs</th>
                  <th className="px-4 py-3 font-semibold">Asaas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => {
                  const events = [...(payment.portal_payment_events ?? [])].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                  );
                  return (
                    <tr key={payment.id} className="align-top">
                      <td className="max-w-72 px-4 py-3">
                        <p className="font-medium">{payment.description ?? payment.source_type}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {payment.entity_type ?? 'sem entidade'}
                          {payment.provider_payment_id ? ` · ${payment.provider_payment_id}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{payment.profiles?.full_name ?? payment.profile_id ?? 'Sem perfil'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {payment.cities ? `${payment.cities.name}/${payment.cities.state}` : 'Global'}
                      </td>
                      <td className="px-4 py-3">{STATUS_LABEL[payment.status] ?? payment.status}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{formatCurrency(payment.amount_cents)}</p>
                        {payment.net_amount_cents != null ? (
                          <p className="text-xs text-muted-foreground">Líquido {formatCurrency(payment.net_amount_cents)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p>Vence {formatDate(payment.due_date)}</p>
                        <p>{payment.paid_at ? `Pago ${formatDate(payment.paid_at)}` : `Criado ${formatDate(payment.created_at)}`}</p>
                      </td>
                      <td className="min-w-64 px-4 py-3">
                        {events.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Sem webhook</span>
                        ) : (
                          <ul className="space-y-1.5">
                            {events.slice(0, 3).map((event) => (
                              <li key={event.id} className="text-xs">
                                <span className="font-medium">{event.event_type}</span>
                                <span className="text-muted-foreground"> · {formatDateTime(event.created_at)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {payment.invoice_url ? (
                          <a
                            href={payment.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1.5')}
                          >
                            Fatura <ExternalLink className="size-3.5" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem link</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function sumByStatus(payments: PaymentHistoryRow[], statuses: string[]): number {
  return payments
    .filter((payment) => statuses.includes(payment.status))
    .reduce((total, payment) => total + payment.amount_cents, 0);
}
