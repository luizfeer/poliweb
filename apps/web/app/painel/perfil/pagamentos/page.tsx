import Link from 'next/link';
import { ExternalLink, ReceiptText } from 'lucide-react';
import { requireProfile } from '@/lib/auth';
import { getUserPaymentHistory, type PaymentHistoryRow } from '@/lib/payments/history';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Meus pagamentos - Portal Carmelitano' };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'border-amber-500/30 bg-amber-500/10 text-amber-800' },
  paid: { label: 'Pago', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  overdue: { label: 'Em atraso', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  failed: { label: 'Falhou', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelado', className: 'border-muted bg-muted/40 text-muted-foreground' },
  refunded: { label: 'Estornado', className: 'border-muted bg-muted/40 text-muted-foreground' },
};

const SOURCE_LABEL: Record<string, string> = {
  business_subscription: 'Assinatura comercial',
  feature_order: 'Destaque pago',
  publication: 'Publicação',
  manual: 'Manual',
  unknown: 'Pagamento',
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

export default async function PerfilPagamentosPage() {
  const auth = await requireProfile();
  const payments = await getUserPaymentHistory(auth.profile.id);
  const paidCents = sumByStatus(payments, ['paid']);
  const pendingCents = sumByStatus(payments, ['pending', 'overdue']);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Perfil</p>
          <h1 className="text-3xl font-bold">Meus pagamentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Histórico local das cobranças geradas no portal e dos eventos recebidos pelo Asaas.
          </p>
        </div>
        <Link href="/painel/perfil" className={cn(buttonVariants({ variant: 'outline' }))}>
          Voltar ao perfil
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryBox label="Pagos" value={formatCurrency(paidCents)} />
        <SummaryBox label="Pendentes ou atrasados" value={formatCurrency(pendingCents)} />
        <SummaryBox label="Cobranças registradas" value={String(payments.length)} />
      </section>

      {payments.length === 0 ? (
        <section className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma cobrança foi registrada no seu perfil ainda.
        </section>
      ) : (
        <section className="space-y-3">
          {payments.map((payment) => (
            <PaymentArticle key={payment.id} payment={payment} />
          ))}
        </section>
      )}
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

function PaymentArticle({ payment }: { payment: PaymentHistoryRow }) {
  const status = STATUS_LABEL[payment.status] ?? STATUS_LABEL.pending;
  const events = [...(payment.portal_payment_events ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ReceiptText className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-semibold">{payment.description ?? SOURCE_LABEL[payment.source_type] ?? 'Pagamento'}</h2>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {SOURCE_LABEL[payment.source_type] ?? payment.source_type}
            {payment.cities ? ` · ${payment.cities.name}/${payment.cities.state}` : ''}
            {payment.provider_payment_id ? ` · Asaas ${payment.provider_payment_id}` : ''}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xl font-bold">{formatCurrency(payment.amount_cents)}</p>
          <p className="text-xs text-muted-foreground">
            Vence {formatDate(payment.due_date)}
            {payment.paid_at ? ` · pago em ${formatDate(payment.paid_at)}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {payment.invoice_url ? (
          <a
            href={payment.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1.5')}
          >
            Abrir cobrança <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
        {payment.billing_type ? <span className="text-muted-foreground">Forma: {payment.billing_type}</span> : null}
      </div>

      <div className="mt-4 border-t pt-3">
        <h3 className="text-sm font-semibold">Logs do pagamento</h3>
        {events.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nenhum webhook registrado para esta cobrança ainda.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {events.map((event) => (
              <li key={event.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{event.event_type}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.provider_status ? `Status Asaas: ${event.provider_status}` : 'Evento sem status informado'}
                  {event.message ? ` · ${event.message}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function sumByStatus(payments: PaymentHistoryRow[], statuses: string[]): number {
  return payments
    .filter((payment) => statuses.includes(payment.status))
    .reduce((total, payment) => total + payment.amount_cents, 0);
}
