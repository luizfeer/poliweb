import Link from 'next/link';
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Gift,
  XCircle,
} from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { getBusinessLeadsClient } from '@/lib/business-leads/client';
import { formatPlanPrice } from '@/lib/plans';
import { getPlanBySlug } from '@/lib/plans/queries';
import {
  getAsaasConfig,
  listPaymentsForSubscription,
  type AsaasPaymentSummary,
} from '@/lib/asaas';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BusinessLead } from '@/lib/business-leads/types';

export const metadata = { title: 'Assinatura — Painel do Comércio' };

const PAYMENT_STATUS_LABEL: Record<string, { label: string; tone: 'paid' | 'pending' | 'late' | 'cancelled' }> = {
  PENDING: { label: 'Aguardando pagamento', tone: 'pending' },
  AWAITING_RISK_ANALYSIS: { label: 'Em análise', tone: 'pending' },
  CONFIRMED: { label: 'Pago', tone: 'paid' },
  RECEIVED: { label: 'Recebido', tone: 'paid' },
  RECEIVED_IN_CASH: { label: 'Recebido em dinheiro', tone: 'paid' },
  REFUNDED: { label: 'Estornado', tone: 'cancelled' },
  REFUND_REQUESTED: { label: 'Estorno solicitado', tone: 'cancelled' },
  OVERDUE: { label: 'Em atraso', tone: 'late' },
  DUNNING_REQUESTED: { label: 'Cobrança iniciada', tone: 'late' },
  CANCELLED: { label: 'Cancelado', tone: 'cancelled' },
  DELETED: { label: 'Removido', tone: 'cancelled' },
};

const BILLING_TYPE_LABEL: Record<string, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão',
  UNDEFINED: 'Pix · Boleto · Cartão',
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
}

export default async function AssinaturaPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  const auth = await requireRole({
    cityId: city.id,
    kinds: ['merchant', 'city_admin', 'super_admin'],
  });

  const supabase = await getBusinessLeadsClient();
  const { data } = await supabase
    .from('business_leads')
    .select('*')
    .eq('city_id', city.id)
    .eq('profile_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const lead = (data ?? null) as BusinessLead | null;

  if (!lead) {
    return (
      <main className="space-y-6">
        <header>
          <p className="text-sm text-muted-foreground">Comércio</p>
          <h1 className="text-2xl font-bold">Assinatura</h1>
        </header>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-muted-foreground">
            Você ainda não cadastrou seu comércio no portal. Comece agora e ganhe 30 dias grátis.
          </p>
          <Link
            href="/comercio/cadastro"
            className={cn('mt-4 inline-flex', buttonVariants({}))}
          >
            Cadastrar meu comércio
          </Link>
        </div>
      </main>
    );
  }

  const plan = lead.plan_slug ? await getPlanBySlug(lead.plan_slug) : null;

  let payments: AsaasPaymentSummary[] = [];
  let paymentsError: string | null = null;
  if (lead.asaas_subscription_id) {
    const config = getAsaasConfig();
    if (config) {
      try {
        payments = await listPaymentsForSubscription(config, lead.asaas_subscription_id, 24);
      } catch (caught) {
        paymentsError = caught instanceof Error ? caught.message : 'Falha ao carregar cobranças.';
      }
    } else {
      paymentsError = 'Integração ASAAS ainda não configurada.';
    }
  }

  const nextOpenPayment = payments.find((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-6">
        <div>
          <p className="text-sm text-muted-foreground">Comércio</p>
          <h1 className="text-3xl font-bold">Assinatura · {lead.business_name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe seu plano, próximas cobranças e histórico de pagamentos.
          </p>
        </div>
        <StatusBadge lead={lead} />
      </header>

      {lead.status === 'approved' && !lead.free_forever ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Você está no trial gratuito — aproveite a visibilidade do portal.</p>
          <p className="mt-1">
            A primeira cobrança será gerada em{' '}
            <strong>{formatDate(lead.trial_ends_at)}</strong>. Você vai receber emails de aviso a partir do
            sétimo dia antes do vencimento, com link direto pra pagar via Pix, boleto ou cartão. Em caso de
            atraso, a ficha continua publicada por <strong>5 dias</strong> antes de ser despublicada
            automaticamente.
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano atual</p>
              <h2 className="mt-1 text-xl font-bold">{plan?.name ?? '—'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan?.description ?? 'Plano não definido ainda.'}
              </p>
            </div>
            <div className="text-right">
              {lead.free_forever ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Gift className="size-3.5" /> Cortesia
                </span>
              ) : plan ? (
                <>
                  <div className="text-2xl font-extrabold">
                    {formatPlanPrice(plan.monthlyValueCents)}
                  </div>
                  <div className="text-xs text-muted-foreground">/mês</div>
                </>
              ) : null}
            </div>
          </div>
          {plan ? (
            <ul className="mt-4 space-y-1.5 text-sm">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold">Próxima cobrança</h3>
              <p className="text-sm text-muted-foreground">
                {lead.free_forever
                  ? 'Você está em modalidade cortesia. Não há cobranças programadas.'
                  : lead.asaas_next_due_date
                    ? `Vence em ${formatDate(lead.asaas_next_due_date)}`
                    : lead.trial_ends_at
                      ? `Trial até ${formatDate(lead.trial_ends_at)}`
                      : 'Em definição.'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 size-5 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold">Pagamento</h3>
              <p className="text-sm text-muted-foreground">
                {lead.asaas_subscription_id
                  ? 'Você escolhe Pix, boleto ou cartão na hora de pagar. As cobranças chegam por email com link direto.'
                  : 'Sua assinatura ASAAS ainda não foi criada. A equipe configura quando o cadastro for aprovado.'}
              </p>
              {nextOpenPayment?.invoiceUrl ? (
                <a
                  href={nextOpenPayment.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'mt-3 inline-flex items-center gap-1.5',
                    buttonVariants({ size: 'sm' }),
                  )}
                >
                  Abrir cobrança atual <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 size-5 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold">Quer trocar de plano ou cancelar?</h3>
              <p className="text-sm text-muted-foreground">
                Mande mensagem pelo{' '}
                <Link href="/contato?tipo=assinatura&assunto=Assinatura" className="text-primary underline underline-offset-2">
                  contato do portal
                </Link>
                . A gente ajusta na hora — sem fidelidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico de cobranças</h2>
          {lead.asaas_subscription_id ? (
            <span className="text-xs text-muted-foreground">Assinatura {lead.asaas_subscription_id}</span>
          ) : null}
        </header>

        {paymentsError ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {paymentsError}
          </p>
        ) : null}

        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma cobrança gerada até agora.
            {lead.trial_ends_at
              ? ` A primeira está prevista para ${formatDate(lead.trial_ends_at)}.`
              : ''}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {payments.map((payment) => {
              const meta = PAYMENT_STATUS_LABEL[payment.status] ?? {
                label: payment.status,
                tone: 'pending' as const,
              };
              return (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div className="space-y-0.5">
                    <div className="font-medium">
                      {formatDate(payment.dueDate)} · {formatBRL(payment.value)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {BILLING_TYPE_LABEL[payment.billingType] ?? payment.billingType}
                      {payment.paymentDate ? ` • Pago em ${formatDate(payment.paymentDate)}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentBadge tone={meta.tone} label={meta.label} />
                    {payment.invoiceUrl ? (
                      <a
                        href={payment.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                      >
                        Ver fatura
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ lead }: { lead: BusinessLead }) {
  if (lead.free_forever) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
        <Gift className="size-3.5" /> Cortesia ativa
      </span>
    );
  }
  if (lead.status === 'converted') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-3.5" /> Assinatura ativa
      </span>
    );
  }
  if (lead.status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Clock3 className="size-3.5" /> Trial em andamento
      </span>
    );
  }
  if (lead.status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
        <XCircle className="size-3.5" /> Cadastro recusado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
      <Clock3 className="size-3.5" /> Em análise
    </span>
  );
}

function PaymentBadge({
  tone,
  label,
}: {
  tone: 'paid' | 'pending' | 'late' | 'cancelled';
  label: string;
}) {
  const classes =
    tone === 'paid'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
      : tone === 'late'
        ? 'border-destructive/30 bg-destructive/10 text-destructive'
        : tone === 'cancelled'
          ? 'border-muted bg-muted/40 text-muted-foreground'
          : 'border-primary/30 bg-primary/10 text-primary';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        classes,
      )}
    >
      {label}
    </span>
  );
}
