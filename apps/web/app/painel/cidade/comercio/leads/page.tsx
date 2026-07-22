import { CheckCircle2, Clock3, Gift, XCircle } from 'lucide-react';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { getBusinessLeadsClient } from '@/lib/business-leads/client';
import { listVisiblePlans } from '@/lib/plans/queries';
import { buttonVariants } from '@/components/ui/button';
import type { BusinessLead, BusinessLeadStatus } from '@/lib/business-leads/types';
import {
  cancelAsaasSubscriptionAction,
  changeLeadPlanAction,
  grantFreeSubscriptionAction,
  rejectBusinessLeadAction,
  retryAsaasSubscriptionAction,
} from './actions';

export const metadata = { title: 'Leads de comércio — Painel' };

const STATUS_FILTERS: Array<{ value: 'all' | BusinessLeadStatus; label: string }> = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'converted', label: 'Assinantes' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'all', label: 'Todos' },
];

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const params = await searchParams;
  const filter = STATUS_FILTERS.find((option) => option.value === params.status)?.value ?? 'pending';

  const supabase = await getBusinessLeadsClient();
  let query = supabase
    .from('business_leads')
    .select('*')
    .eq('city_id', city.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (filter !== 'all') {
    query = query.eq('status', filter);
  }
  const [{ data, error }, plans] = await Promise.all([query, listVisiblePlans()]);
  if (error) throw error;
  const leads = (data ?? []) as BusinessLead[];
  const activePlans = plans.filter((plan) => plan.status === 'active');

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">Leads de comércio</h1>
        <p className="text-sm text-ink-600">
          Solicitações para entrar no portal. Aprove para liberar o trial de 30 dias e o checkout.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <a
              key={option.value}
              href={`/painel/cidade/comercio/leads?status=${option.value}`}
              className={
                active
                  ? 'rounded-pill bg-clay-500 px-3 py-1 text-sm text-white'
                  : 'rounded-pill border border-ink-200 bg-paper-card px-3 py-1 text-sm text-ink-600 hover:bg-paper-deep'
              }
            >
              {option.label}
            </a>
          );
        })}
      </nav>

      {leads.length === 0 ? (
        <div className="rounded-xl bg-paper-card p-8 text-center text-sm text-ink-600 shadow-card">
          Nenhum lead aqui ainda.
        </div>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-xl bg-paper-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{lead.business_name}</h2>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="text-sm text-ink-600">
                    {lead.contact_name} • {lead.email} • {lead.phone}
                    {lead.whatsapp ? ` • WhatsApp ${lead.whatsapp}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    Recebido em {formatDateTime(lead.created_at)}
                    {lead.approved_at ? ` • Aprovado em ${formatDateTime(lead.approved_at)}` : ''}
                    {lead.trial_ends_at ? ` • Trial até ${formatDateTime(lead.trial_ends_at)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.status === 'pending' ? (
                    <>
                      <a
                        href={`/painel/cidade/comercio/leads/${lead.id}/aprovar`}
                        className={buttonVariants({ size: 'sm' })}
                      >
                        Aprovar e configurar
                      </a>
                      <SubmitOnceForm action={rejectBusinessLeadAction} className="flex items-center gap-2">
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <input
                          name="reason"
                          placeholder="Motivo (opcional)"
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          maxLength={500}
                        />
                        <SubmitOnceButton
                          label="Rejeitar"
                          pendingLabel="Rejeitando..."
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                        />
                      </SubmitOnceForm>
                    </>
                  ) : null}

                  {(lead.status === 'approved' || lead.status === 'converted') && !lead.free_forever ? (
                    <SubmitOnceForm action={grantFreeSubscriptionAction} className="flex items-center gap-2">
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <input
                        name="reason"
                        placeholder="Motivo da cortesia"
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        maxLength={500}
                      />
                      <SubmitOnceButton
                        label="Liberar grátis"
                        pendingLabel="Liberando..."
                        icon={<Gift className="size-3.5" aria-hidden="true" />}
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:cursor-wait disabled:opacity-75"
                      />
                    </SubmitOnceForm>
                  ) : null}

                  {lead.status === 'approved' && !lead.asaas_subscription_id && !lead.free_forever ? (
                    <SubmitOnceForm action={retryAsaasSubscriptionAction}>
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <SubmitOnceButton
                        label="Criar assinatura ASAAS"
                        pendingLabel="Criando..."
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                      />
                    </SubmitOnceForm>
                  ) : null}

                  {lead.asaas_subscription_id && lead.asaas_subscription_status !== 'CANCELLED' ? (
                    <SubmitOnceForm action={cancelAsaasSubscriptionAction}>
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <SubmitOnceButton
                        label="Cancelar assinatura"
                        pendingLabel="Cancelando..."
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                      />
                    </SubmitOnceForm>
                  ) : null}

                  {(lead.status === 'approved' || lead.status === 'converted') && activePlans.length > 1 ? (
                    <SubmitOnceForm action={changeLeadPlanAction} className="flex items-center gap-2">
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <select
                        name="plan_slug"
                        defaultValue={lead.plan_slug ?? ''}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                      >
                        {activePlans.map((plan) => (
                          <option key={plan.slug} value={plan.slug}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                      <SubmitOnceButton
                        label="Trocar plano"
                        pendingLabel="Trocando..."
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                      />
                    </SubmitOnceForm>
                  ) : null}
                </div>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-[15px] md:grid-cols-2">
                {lead.category_hint ? <Row label="Categoria" value={lead.category_hint} /> : null}
                {lead.address ? <Row label="Endereço" value={lead.address} /> : null}
                {lead.website ? <Row label="Site" value={lead.website} /> : null}
                {lead.instagram ? <Row label="Instagram" value={lead.instagram} /> : null}
                {lead.rejected_reason ? (
                  <Row label="Motivo da rejeição" value={lead.rejected_reason} />
                ) : null}
                {lead.plan_slug ? <Row label="Plano" value={lead.plan_slug} /> : null}
                {lead.document ? <Row label="CNPJ/CPF" value={lead.document} /> : null}
                {lead.asaas_subscription_status ? (
                  <Row label="ASAAS" value={lead.asaas_subscription_status} />
                ) : null}
                {lead.asaas_next_due_date ? (
                  <Row label="Próxima cobrança" value={lead.asaas_next_due_date} />
                ) : null}
                {lead.free_forever ? (
                  <Row label="Cortesia" value={lead.free_reason ?? 'Sim — sem cobrança'} />
                ) : null}
                {lead.notes ? <Row label="Notas" value={lead.notes} /> : null}
              </dl>
              {lead.message ? (
                <p className="mt-3 whitespace-pre-line rounded-md bg-paper-deep p-3 text-sm text-ink-600">
                  {lead.message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-ink-900">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: BusinessLeadStatus }) {
  if (status === 'approved' || status === 'converted') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-cerrado-500/30 bg-cerrado-50 px-2 py-0.5 text-xs text-cerrado-700">
        <CheckCircle2 className="size-3" /> {status === 'converted' ? 'Assinante' : 'Aprovado'}
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-destructive/30 bg-[#fbebeb] px-2 py-0.5 text-xs text-destructive">
        <XCircle className="size-3" /> Rejeitado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-ink-200 bg-paper-card px-2 py-0.5 text-xs text-ink-600">
      <Clock3 className="size-3" /> Pendente
    </span>
  );
}
