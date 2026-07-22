import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
} from 'lucide-react';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getBusinessLeadsClient } from '@/lib/business-leads/client';
import { formatPlanPrice } from '@/lib/plans';
import { getPlanBySlug } from '@/lib/plans/queries';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Cadastro recebido — Portal Carmelitano',
};

const STATUS_LABEL: Record<
  string,
  { title: string; description: string; tone: 'pending' | 'approved' | 'rejected' }
> = {
  pending: {
    title: 'Você só começa a pagar daqui 30 dias',
    description:
      'Seu cadastro foi enviado. Enquanto a cobrança fica para depois, a gente confere os dados e prepara sua página para você já aproveitar o portal.',
    tone: 'pending',
  },
  approved: {
    title: 'Você já está aproveitando seus 30 dias grátis',
    description:
      'Seu comércio já está no portal. A primeira cobrança só acontece depois do período gratuito.',
    tone: 'approved',
  },
  converted: {
    title: 'Assinatura ativa. Seu comércio segue em destaque',
    description: 'Seu comércio já está ativo no Portal Carmelitano. Bons negócios!',
    tone: 'approved',
  },
  rejected: {
    title: 'Precisamos ajustar seu cadastro',
    description: 'Fale com a gente para entender os próximos passos.',
    tone: 'rejected',
  },
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
}

export default async function ObrigadoPage({ searchParams }: PageProps) {
  const auth = await requireProfile('/entrar?next=/comercio/cadastro');
  const params = await searchParams;
  const idResult = z.string().uuid().safeParse(params.id);
  if (!idResult.success) redirect('/comercio/cadastro');

  const supabase = await getBusinessLeadsClient();
  const { data: lead } = await supabase
    .from('business_leads')
    .select('*')
    .eq('id', idResult.data)
    .maybeSingle();

  if (!lead || lead.profile_id !== auth.profile.id) notFound();

  const status = STATUS_LABEL[lead.status] ?? STATUS_LABEL.pending;
  const plan = lead.plan_slug ? await getPlanBySlug(lead.plan_slug) : null;
  const nextDue = lead.asaas_next_due_date ?? lead.trial_ends_at;
  const isApproved = lead.status === 'approved' || lead.status === 'converted';

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:py-12">
      <header className="overflow-hidden rounded-3xl border border-cerrado-200 bg-cerrado-50 shadow-card">
        <div className="grid gap-0 md:grid-cols-[1fr_260px]">
          <div className="space-y-5 p-6 md:p-8">
            <div
              className={
                status.tone === 'approved'
                  ? 'inline-flex items-center gap-2 rounded-pill border border-cerrado-500/30 bg-white px-3 py-1 text-xs font-semibold text-cerrado-700'
                  : status.tone === 'rejected'
                    ? 'inline-flex items-center gap-2 rounded-pill border border-destructive/30 bg-[#fbebeb] px-3 py-1 text-xs font-semibold text-destructive'
                    : 'inline-flex items-center gap-2 rounded-pill border border-cerrado-500/20 bg-white px-3 py-1 text-xs font-semibold text-cerrado-700'
              }
            >
              {status.tone === 'approved' ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {lead.status === 'pending' ? 'Conquista enviada' : lead.status}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cerrado-700">
                <Trophy className="size-4" />
                30 dias grátis liberados
              </p>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
                {status.title}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-700">
                {status.description}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">
                Comércio cadastrado
              </p>
              <p className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold text-ink-900">
                <Store className="size-6 text-clay-600" />
                {lead.business_name}
              </p>
              <p className="mt-2 text-sm text-ink-600">
                Sua vitrine local começou aqui. Você só paga depois do período gratuito, mas já
                pode aproveitar os próximos passos de divulgação.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center bg-cerrado-700 p-6 text-white">
            <div className="text-center">
              <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-white text-cerrado-700">
                {isApproved ? <Rocket className="size-12" /> : <Trophy className="size-12" />}
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-wide text-cerrado-100">
                Sem cobrança agora
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                Pague só em 30 dias
              </p>
            </div>
          </div>
        </div>
      </header>

      {plan ? (
        <section className="rounded-xl bg-paper-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-400">Plano escolhido</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-ink-600">{plan.description}</p>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-extrabold text-ink-900">
                {formatPlanPrice(plan.monthlyValueCents)}
              </div>
              <div className="text-xs text-ink-600">/mês</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-xl bg-paper-card p-5 shadow-card">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-cerrado-700">
            Já pode aproveitar
          </p>
          <h2 className="mt-1 font-display text-xl font-bold text-ink-900">
            Benefícios do seu cadastro no portal
          </h2>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill bg-cerrado-50 text-cerrado-700">
            <Calendar className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900">
              Só paga daqui 30 dias
            </h3>
            <p className="mt-0.5 text-sm text-ink-600">
              {isApproved
                ? `Você fica grátis até ${formatDate(nextDue)}. A primeira cobrança só é gerada nessa data.`
                : 'Depois da aprovação, seu período gratuito começa. A primeira cobrança só é gerada 30 dias depois.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill bg-cerrado-50 text-cerrado-700">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900">
              Página do comércio preparada
            </h3>
            <p className="mt-0.5 text-sm text-ink-600">
              A gente confere os dados, organiza sua vitrine local e deixa tudo pronto para a
              cidade encontrar seu negócio com confiança.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill bg-cerrado-50 text-cerrado-700">
            <Rocket className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900">
              Divulgação no guia da cidade
            </h3>
            <p className="mt-0.5 text-sm text-ink-600">
              Seu negócio pode aparecer no guia de comércios, nas buscas locais e nos caminhos que
              levam moradores e visitantes até você.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-paper-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill bg-sky-100 text-sky-700">
            <CreditCard className="size-5" />
          </span>
          <div className="space-y-3">
            <h2 className="font-display text-base font-semibold text-ink-900">Pagamento</h2>
            {lead.asaas_subscription_id ? (
              <>
                <p className="text-sm text-ink-600">
                  Você escolhe na hora de pagar: <strong>Pix</strong>, <strong>boleto</strong> ou{' '}
                  <strong>cartão</strong>. Nada é cobrado durante o mês grátis.
                </p>
                <ul className="space-y-1 text-sm text-ink-600">
                  <li>
                    Próxima cobrança:{' '}
                    <strong className="text-ink-900">{formatDate(lead.asaas_next_due_date)}</strong>
                  </li>
                  {lead.asaas_payment_link ? (
                    <li>
                      <a
                        href={lead.asaas_payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sky-700 underline underline-offset-2"
                      >
                        Abrir cobrança atual
                      </a>
                    </li>
                  ) : null}
                </ul>
              </>
            ) : lead.status === 'pending' ? (
              <p className="text-sm text-ink-600">
                Quando o cadastro for aprovado, a gente prepara tudo. Você recebe um email com o
                link da primeira cobrança quando o mês grátis acabar.
              </p>
            ) : (
              <p className="text-sm text-ink-600">
                Em breve a gente prepara sua cobrança. Se demorar, fale com a gente pelo WhatsApp.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/comercio" className={cn(buttonVariants({ variant: 'outline' }))}>
          Ver guia de comércios
        </Link>
        <Link href="/painel" className={cn(buttonVariants({ variant: 'default' }))}>
          Ir para meu painel
        </Link>
      </div>
    </main>
  );
}
