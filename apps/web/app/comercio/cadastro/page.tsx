import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock,
  ExternalLink,
  Gift,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { getProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { listVisiblePlans } from '@/lib/plans/queries';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BusinessPlan } from '@/lib/plans';
import { formatPlanPrice } from '@/lib/plans';
import { LeadForm } from './_components/lead-form';

export const metadata = {
  title: 'Cadastre seu comércio — 1 mês grátis | Portal Carmelitano',
  description:
    'Coloque seu comércio no Portal Carmelitano e ganhe 1 mês grátis. Apareça para moradores e turistas que buscam o que você oferece em Carmo do Rio Claro.',
};

type PageProps = {
  searchParams: Promise<{ plano?: string }>;
};

const AD_KEYWORDS = ['anúncio', 'anuncio', 'patrocin', 'banner', 'destaque pago', 'push pra'];

function isAdPlan(plan: BusinessPlan): boolean {
  const haystack = [plan.slug, plan.name, plan.description, ...plan.features]
    .join(' ')
    .toLowerCase();
  return AD_KEYWORDS.some((kw) => haystack.includes(kw));
}

export default async function BusinessOnboardingPage({ searchParams }: PageProps) {
  const [city, auth, allPlans, params] = await Promise.all([
    getCurrentCity(),
    getProfile(),
    listVisiblePlans(),
    searchParams,
  ]);
  const plans = allPlans.filter((p) => !isAdPlan(p));
  const cityName = city?.name ?? 'Carmo do Rio Claro';
  const isLoggedIn = Boolean(auth);
  const requestedPlan =
    params.plano && plans.some((p) => p.slug === params.plano && p.status === 'active')
      ? params.plano
      : undefined;
  let userEmail: string | null = null;
  if (auth) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    userEmail = userData.user?.email ?? null;
  }

  return (
    <main className="bg-paper">
      <Hero cityName={cityName} />
      <Manifesto />
      <Benefits />
      <PreviewBand />
      <Plans plans={plans} />
      <Steps />
      <section id="cadastrar" className="border-t border-ink-200 bg-paper-card">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Cadastre seu comércio</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
              Pronto pra entrar no mapa de {cityName}?
            </h2>
            <p className="mt-3 text-ink-600">
              2 minutos pra preencher. 30 dias grátis garantidos. Cancele quando quiser.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border-l-4 border-clay-500 bg-paper-card shadow-card">
            {isLoggedIn && auth ? (
              <LeadForm
                plans={plans}
                defaults={{
                  contact_name: auth.profile.full_name ?? null,
                  email: userEmail,
                  plan_slug: requestedPlan,
                }}
              />
            ) : (
              <div className="space-y-4 p-6 md:p-8">
                <h3 className="font-display text-lg font-semibold text-ink-900">
                  Entre antes de cadastrar
                </h3>
                <p className="text-sm text-ink-600">
                  Já tem conta no portal? Entre para vincular o cadastro ao seu perfil. Se ainda
                  não tem, crie em 30 segundos — é grátis.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/entrar?next=/comercio/cadastro%23cadastrar"
                    className={cn(buttonVariants({ size: 'lg' }))}
                  >
                    Entrar para continuar
                  </Link>
                  <Link
                    href="/cadastro?next=/comercio/cadastro%23cadastrar"
                    className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
                  >
                    Criar conta grátis
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Faq />
      <FinalStripe cityName={cityName} />
    </main>
  );
}

function Eyebrow({
  children,
  tone = 'clay',
}: {
  children: React.ReactNode;
  tone?: 'clay' | 'sun';
}) {
  const dot = tone === 'sun' ? 'bg-sun-500' : 'bg-clay-500';
  const text = tone === 'sun' ? 'text-sun-500' : 'text-clay-600';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em]',
        text,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {children}
    </span>
  );
}

function Hero({ cityName }: { cityName: string }) {
  return (
    <section className="relative overflow-hidden bg-clay-50">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80 [background:radial-gradient(circle_at_85%_15%,#ffd9bf,transparent_55%),radial-gradient(circle_at_10%_90%,#e1eede,transparent_60%)]" />
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:grid md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:pt-20 md:pb-24">
        <div>
          <Eyebrow>1 mês grátis · sem fidelidade · sem letra miúda</Eyebrow>
          <h1 className="mt-5 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 md:text-[54px]">
            Seu comércio na vitrine da cidade —{' '}
            <em className="italic text-clay-500">encontrado</em> por quem mora e visita {cityName}.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-600">
            Coloca o nome, o WhatsApp, as fotos e o cardápio no Portal Carmelitano. A gente libera
            sua página em pouco tempo.{' '}
            <strong className="text-ink-900">30 dias grátis</strong>, depois você decide se vale a
            pena — cancela quando quiser.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#cadastrar" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
              Quero meu mês grátis
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#planos"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'gap-2 bg-paper-card',
              )}
            >
              <LayoutGrid className="size-4" />
              Ver planos
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-600">
            {[
              '30 dias sem cobrança',
              'Cancele quando quiser',
              'Atendimento humano',
              'Pix, boleto ou cartão',
            ].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-cerrado-500 text-white">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>
        <DashStage />
      </div>
    </section>
  );
}

function DashStage() {
  return (
    <div className="relative mt-12 hidden h-[420px] md:mt-0 md:block">
      <DashCard
        className="absolute right-2 top-0 -rotate-3"
        icon={TrendingUp}
        iconBg="bg-cerrado-100"
        iconFg="text-cerrado-700"
        title="+312 visitas"
        sub="Pousada Mirante · 7 dias"
      />
      <DashCard
        className="absolute left-0 top-24 rotate-2"
        icon={MessageCircle}
        iconBg="bg-clay-50"
        iconFg="text-clay-600"
        title="28 contatos no WhatsApp"
        sub="essa semana"
      />
      <DashCard
        className="absolute right-6 top-52 -rotate-1"
        icon={BarChart3}
        iconBg="bg-sun-100"
        iconFg="text-clay-700"
        title="Buscas pela sua página"
        sub={
          <span className="mt-1.5 flex items-end gap-0.5">
            {[10, 14, 9, 18, 22, 16, 26].map((h, i) => (
              <span
                key={i}
                className="block w-1.5 rounded-sm bg-clay-500"
                style={{ height: `${h * 0.9}px`, opacity: 0.5 + i / 14 }}
              />
            ))}
          </span>
        }
      />
      <DashCard
        className="absolute left-4 top-[316px] rotate-3"
        icon={BadgeCheck}
        iconBg="bg-sky-100"
        iconFg="text-sky-700"
        title="Selo de verificado"
        sub="liberado no plano Pro"
      />
    </div>
  );
}

function DashCard({
  className,
  icon: Icon,
  iconBg,
  iconFg,
  title,
  sub,
}: {
  className?: string;
  icon: typeof TrendingUp;
  iconBg: string;
  iconFg: string;
  title: string;
  sub: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex w-[260px] items-start gap-3 rounded-xl bg-paper-card p-3.5 shadow-pop',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-pill',
          iconBg,
          iconFg,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink-900">{title}</div>
        <div className="text-xs text-ink-600">{sub}</div>
      </div>
    </div>
  );
}

function Manifesto() {
  return (
    <section className="border-y border-ink-200 bg-paper-deep">
      <div className="mx-auto max-w-3xl px-4 py-14 text-center md:py-16">
        <Eyebrow>Pra quem é</Eyebrow>
        <p className="mt-5 font-display text-2xl italic leading-snug text-ink-900 md:text-[28px]">
          “Se a sua placa é vista por quem passa na rua —{' '}
          <span className="text-clay-500 not-italic">
            imagina ser vista por quem busca no celular antes de sair de casa.
          </span>
          ”
        </p>
        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink-400">
          Portal Carmelitano · feito em Carmo do Rio Claro
        </p>
      </div>
    </section>
  );
}

const BENEFITS = [
  {
    Icon: Search,
    iconBg: 'bg-clay-50',
    iconFg: 'text-clay-600',
    title: 'Apareça nas buscas locais',
    copy: 'Quem digita "pizzaria em Carmo", "pousada perto de Furnas" ou "manicure no centro" encontra você antes de qualquer rede nacional.',
    metric: '+312',
    metricLbl: 'visitas / 7 dias',
  },
  {
    Icon: MessageCircle,
    iconBg: 'bg-cerrado-100',
    iconFg: 'text-cerrado-700',
    title: 'WhatsApp e mapa integrados',
    copy: 'O cliente chama no zap e abre a rota no Google Maps direto da sua página. Sem complicação, sem perder venda.',
    metric: '1-clique',
    metricLbl: 'para falar com você',
  },
  {
    Icon: Tag,
    iconBg: 'bg-[#FCE5EC]',
    iconFg: 'text-discount',
    title: 'Promoções e cupons',
    copy: 'Lance cupons na vitrine da cidade. Cliente resgata pelo app, você acompanha quem veio e o que vendeu.',
    metric: '47',
    metricLbl: 'cupons resgatados em 3d',
  },
  {
    Icon: BarChart3,
    iconBg: 'bg-sky-100',
    iconFg: 'text-sky-700',
    title: 'Painel com métricas',
    copy: 'Visitas, contatos, cupons, horários de pico, termos buscados. Decisão com dado, não com achismo.',
    metric: '100%',
    metricLbl: 'transparência',
  },
];

function Benefits() {
  return (
    <section id="beneficios" className="mx-auto max-w-6xl px-4 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Por que entrar</Eyebrow>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          A vitrine que trabalha por você o dia inteiro.
        </h2>
        <p className="mt-3 text-ink-600">
          Quatro coisas que mudam de patamar quando seu comércio entra no portal — desde o primeiro
          mês grátis.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex flex-col rounded-2xl bg-paper-card p-5 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-pill',
                b.iconBg,
                b.iconFg,
              )}
            >
              <b.Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-[17px] font-semibold text-ink-900">{b.title}</h3>
            <p className="mt-1.5 flex-1 text-sm text-ink-600">{b.copy}</p>
            <div className="mt-4 flex items-baseline gap-2 border-t border-paper-deep pt-3">
              <span className="font-display text-xl font-extrabold text-clay-500">{b.metric}</span>
              <span className="text-xs text-ink-600">{b.metricLbl}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewBand() {
  const items = [
    { Icon: ImageIcon, title: 'Fotos em destaque', copy: 'Galeria que abre em tela cheia, com legenda e ordenação.' },
    { Icon: Clock, title: 'Horário ao vivo', copy: '“Aberto agora · fecha 22h” calculado automaticamente, dia a dia.' },
    { Icon: MapPin, title: 'Endereço e rota', copy: 'Pin no mapa da cidade + botão direto pro Google Maps.' },
    { Icon: MessageCircle, title: 'WhatsApp em destaque', copy: 'Botão flutuante que abre conversa com mensagem pronta.' },
    { Icon: Star, title: 'Avaliações reais', copy: 'Quem é morador verificado avalia — sem perfil fake.' },
  ];
  return (
    <section id="como-aparece" className="border-y border-ink-200 bg-paper-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <Eyebrow>Como sua página fica</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Uma página completa, com a cara da cidade — não um link sem graça no Google.
          </h2>
          <ul className="mt-8 space-y-4">
            {items.map((it) => (
              <li key={it.title} className="flex gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill bg-clay-50 text-clay-600">
                  <it.Icon className="size-4" />
                </span>
                <div>
                  <div className="font-semibold text-ink-900">{it.title}</div>
                  <p className="text-sm text-ink-600">{it.copy}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#cadastrar" className={cn(buttonVariants({}), 'gap-2')}>
              Cadastrar agora
              <ArrowRight className="size-4" />
            </a>
            <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
              <ExternalLink className="size-4" />
              Ver portal completo
            </Link>
          </div>
        </div>
        <FichaMockup />
      </div>
    </section>
  );
}

function FichaMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-paper-card shadow-pop">
        <div className="relative h-44 bg-gradient-to-br from-clay-300 via-clay-500 to-clay-700">
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cerrado-700">
            Aberto agora
          </span>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-paper-card/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-clay-600">
            <Sparkles className="size-3" /> Verificado
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink-900">Pousada Mirante de Furnas</h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-ink-600">
              <Star className="size-3 fill-sun-500 text-sun-500" />
              <span className="font-semibold text-ink-900">4,8</span>
              <span>· 132 avaliações · Pousada</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-pill bg-cerrado-100 px-2 py-0.5 text-cerrado-700">Vista pra Furnas</span>
            <span className="rounded-pill bg-clay-50 px-2 py-0.5 text-clay-600">Café da manhã</span>
            <span className="rounded-pill bg-sky-100 px-2 py-0.5 text-sky-700">Wi-Fi</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-clay-500 px-3 py-2 text-xs font-semibold text-white">
              <MessageCircle className="size-3.5" />
              WhatsApp
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-ink-200 bg-paper-card px-3 py-2 text-xs font-semibold text-ink-900">
              <MapPin className="size-3.5" />
              Rota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Plans({ plans }: { plans: BusinessPlan[] }) {
  return (
    <section id="planos" className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Planos</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Comece grátis. Escolha quando vale a pena pagar.
          </h2>
          <p className="mt-3 text-ink-600">
            <strong className="text-ink-900">30 dias grátis em qualquer plano.</strong> Depois,
            mensalidade por Pix, boleto ou cartão. Cancele quando quiser.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
          {plans.map((plan) => {
            const isActive = plan.status === 'active';
            const highlighted = plan.highlight && isActive;
            return (
              <div
                key={plan.slug}
                className={cn(
                  'relative flex flex-col rounded-2xl bg-paper-card p-6 shadow-card transition-transform',
                  highlighted && 'md:-translate-y-2 ring-2 ring-clay-500',
                  !isActive && 'opacity-70',
                )}
              >
                {highlighted ? (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill bg-clay-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-banner">
                    <Sparkles className="size-3" /> Mais popular
                  </span>
                ) : null}
                {!isActive ? (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill bg-paper-deep px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-600">
                    Em breve
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-bold text-ink-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-ink-600">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-ink-900">
                    {formatPlanPrice(plan.monthlyValueCents)}
                  </span>
                  <span className="text-sm text-ink-600">/mês</span>
                </div>
                <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-pill bg-cerrado-100 px-2.5 py-0.5 text-[11px] font-semibold text-cerrado-700">
                  <Gift className="size-3" /> Primeiros 30 dias grátis
                </div>
                <ul className="mt-5 space-y-2 text-sm text-ink-900">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-clay-500" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={isActive ? `/comercio/cadastro?plano=${plan.slug}#cadastrar` : '#planos'}
                  className={cn(
                    'mt-6 inline-flex items-center justify-center gap-1.5 text-center',
                    buttonVariants({
                      variant: highlighted ? 'default' : 'outline',
                    }),
                    !isActive && 'pointer-events-none opacity-60',
                  )}
                >
                  Quero este plano
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-600">
          {[
            'Sem fidelidade',
            'Sem taxa de adesão',
            'Cancele a qualquer momento',
            'Nota fiscal emitida',
          ].map((t, i, arr) => (
            <span key={t} className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-cerrado-500" strokeWidth={3} />
                {t}
              </span>
              {i < arr.length - 1 ? <span className="size-1 rounded-full bg-ink-300" /> : null}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    {
      n: '01',
      title: 'Você preenche o formulário',
      copy: 'Leva 2 minutos. Nome do comércio, contato e plano. Sem precisar mandar foto agora.',
    },
    {
      n: '02',
      title: 'A gente confere os dados',
      copy: 'Olhamos cada cadastro com cuidado pra manter o portal limpo. Liberamos sua página em pouco tempo.',
    },
    {
      n: '03',
      title: '30 dias grátis pra usar',
      copy: 'Você usa o portal sem pagar nada. Depois, mensalidade por Pix, boleto ou cartão. Cancele quando quiser.',
    },
  ];
  return (
    <section className="border-y border-ink-200 bg-paper-deep">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Passo a passo</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Em pouco tempo, sua página está no ar.
          </h2>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl bg-paper-card p-6 shadow-card"
            >
              <div className="font-display text-3xl font-extrabold text-clay-500">{s.n}</div>
              <h3 className="mt-3 font-display text-[17px] font-semibold text-ink-900">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-600">{s.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Quanto custa pra começar?',
    a: 'Nada. Os primeiros 30 dias são grátis em qualquer plano. Se decidir não continuar, é só não confirmar a cobrança.',
  },
  {
    q: 'Quanto tempo demora pra minha página aparecer?',
    a: 'Pouco tempo. A gente confere os dados pra evitar duplicidade e libera sua página. Você recebe um aviso por email assim que estiver no ar.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Pode. Sem multa, sem fidelidade, sem letra miúda. Você cancela direto pelo painel ou fala com a gente no WhatsApp.',
  },
  {
    q: 'Preciso ter CNPJ?',
    a: 'Não. Aceita CPF também — vários comerciantes locais começam como MEI ou autônomo. A gente emite a nota fiscal no nome correto.',
  },
  {
    q: 'Como é o pagamento depois do mês grátis?',
    a: 'Você escolhe: Pix, boleto ou cartão. A primeira cobrança só roda quando o mês grátis acabar.',
  },
  {
    q: 'E se eu não souber mexer no painel?',
    a: 'A gente ajuda. Suporte humano por WhatsApp, em português claro. No primeiro mês, marca uma chamada de 20 min e a gente configura junto.',
  },
];

function Faq() {
  return (
    <section id="faq" className="bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[0.85fr_1.15fr] md:py-24">
        <div>
          <Eyebrow>Perguntas frequentes</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            As dúvidas que aparecem antes de cadastrar.
          </h2>
          <p className="mt-4 text-ink-600">
            Não achou a resposta? Manda no WhatsApp — a gente responde rápido.
          </p>
          <a
            href="https://wa.me/"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-5 gap-2')}
          >
            <MessageCircle className="size-4" />
            Falar com a gente
          </a>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((it, i) => (
            <details
              key={it.q}
              className="group rounded-xl bg-paper-card p-4 shadow-card open:ring-1 open:ring-clay-500/30"
              open={i === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold text-ink-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{it.q}</span>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-clay-50 text-clay-600 transition-transform group-open:rotate-45">
                  <span className="text-lg leading-none">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalStripe({ cityName }: { cityName: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-paper">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_85%_20%,#e0561b,transparent_50%),radial-gradient(circle_at_10%_90%,#1f4a2c,transparent_55%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <Eyebrow tone="sun">Última parada antes do formulário</Eyebrow>
          <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight md:text-[42px]">
            Seu comércio no <em className="italic text-sun-500">mapa</em> da cidade — antes do
            próximo turista chegar.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] text-paper/80">
            {cityName} tem mais de 22 mil habitantes, é porta de entrada pra Furnas, e o número de
            buscas locais cresce todo mês. Quem entra agora pega 30 dias grátis e a janela de
            aparecer cedo, antes da concorrência.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#cadastrar" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
              Cadastrar meu comércio
              <ArrowRight className="size-4" />
            </a>
            <a
              href="https://wa.me/"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-paper/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-paper hover:bg-paper/10"
            >
              <MessageCircle className="size-4" />
              Tirar dúvida no WhatsApp
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: '30 dias', l: 'grátis em qualquer plano' },
            { v: 'Rápido', l: 'tempo pra liberar sua página' },
            { v: '+22k', l: `habitantes em ${cityName}` },
            { v: 'R$ 0', l: 'taxa de adesão · sem fidelidade' },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-xl border border-paper/10 bg-paper/5 p-4 backdrop-blur-sm"
            >
              <div className="font-display text-2xl font-extrabold text-sun-500">{s.v}</div>
              <div className="mt-1 text-xs leading-snug text-paper/80">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative border-t border-paper/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-paper/60">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-3.5" /> Aprovação manual · Cancele quando quiser · LGPD
          </span>
          <span>do interior de Minas, pro Brasil</span>
        </div>
      </div>
    </section>
  );
}
