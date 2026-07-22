import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { getBusinessLeadsClient } from '@/lib/business-leads/client';
import { createClient } from '@/lib/supabase/server';
import { getPlanBySlug } from '@/lib/plans/queries';
import type { BusinessLead } from '@/lib/business-leads/types';
import { ApproveLeadForm } from './approve-lead-form';

export const metadata = { title: 'Aprovar lead — Painel' };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApproveLeadPage({ params }: PageProps) {
  const { id } = await params;
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const leadsClient = await getBusinessLeadsClient();
  const supabase = await createClient();

  const [{ data: leadData }, { data: categoriesData }] = await Promise.all([
    leadsClient
      .from('business_leads')
      .select('*')
      .eq('id', id)
      .eq('city_id', city.id)
      .maybeSingle(),
    supabase
      .from('business_categories')
      .select('id, name, slug, parent_id, display_order')
      .or(`city_id.is.null,city_id.eq.${city.id}`)
      .eq('active', true)
      .order('display_order'),
  ]);

  if (!leadData) notFound();
  const lead = leadData as BusinessLead;

  if (lead.status !== 'pending') {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Link
          href="/painel/cidade/comercio/leads"
          className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
        >
          <ChevronLeft className="size-4" /> Voltar
        </Link>
        <div className="rounded-xl bg-paper-card p-6 shadow-card">
          <h1 className="font-display text-2xl font-semibold">Este lead já foi processado</h1>
          <p className="mt-2 text-sm text-ink-600">
            Status atual: <strong>{lead.status}</strong>. Apenas leads pendentes podem ser aprovados por aqui.
          </p>
        </div>
      </main>
    );
  }

  const plan = lead.plan_slug ? await getPlanBySlug(lead.plan_slug) : null;
  const categories = categoriesData ?? [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/painel/cidade/comercio/leads"
        className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
      >
        <ChevronLeft className="size-4" /> Voltar para a fila
      </Link>

      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">Aprovar e configurar ficha</h1>
        <p className="text-sm text-ink-600">
          Revise os dados do lead, ajuste o que precisar e selecione a categoria principal. Ao salvar, a ficha é
          publicada imediatamente e o merchant passa a poder editá-la.
        </p>
      </header>

      <section className="rounded-xl bg-paper-card p-5 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Dados do solicitante</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Contato" value={lead.contact_name} />
          <Row label="Email" value={lead.email} />
          <Row label="Telefone" value={lead.phone} />
          {lead.whatsapp ? <Row label="WhatsApp" value={lead.whatsapp} /> : null}
          {lead.document ? <Row label="CPF/CNPJ" value={lead.document} /> : null}
          {plan ? <Row label="Plano" value={`${plan.name} — R$ ${(plan.monthlyValueCents / 100).toFixed(2)}/mês`} /> : null}
          {lead.category_hint ? <Row label="Sugestão de categoria" value={lead.category_hint} /> : null}
        </dl>
        {lead.message ? (
          <p className="mt-3 whitespace-pre-line rounded-md bg-paper-deep p-3 text-sm text-ink-700">
            “{lead.message}”
          </p>
        ) : null}
      </section>

      <ApproveLeadForm lead={lead} categories={categories} />

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Após aprovação: o merchant ganha papel <strong>merchant</strong> nesta cidade e a ficha entra publicada com
        trial de 30 dias. <strong>Nenhum pagamento é exigido agora</strong> — o ASAAS enviará por email os avisos de
        cobrança a partir do dia 23 do trial, e a primeira cobrança será no dia 30.
      </p>
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
