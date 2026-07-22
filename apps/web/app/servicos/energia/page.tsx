import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Headphones,
  Landmark,
  Map,
  MessageCircle,
  PhoneCall,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Smartphone,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { cemigInfoSeed, type CemigService } from '@/lib/utilities/cemig-info';
import { cn } from '@/lib/utils';

const featuredServiceSlugs = [
  'segunda-via-conta',
  'estou-sem-luz',
  'religacao',
  'consultar-debitos',
  'tarifa-social',
  'desligamento-programado',
] as const;

const serviceIcons: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  'segunda-via-conta': FileText,
  'estou-sem-luz': Zap,
  religacao: RotateCcw,
  'consultar-debitos': Search,
  'tarifa-social': BadgeDollarSign,
  'desligamento-programado': AlertTriangle,
  'mapa-fornecimento': Map,
  'alteracao-titularidade': Landmark,
  'ligacao-nova': CheckCircle2,
  'informar-leitura': Smartphone,
  'informar-conta-paga': FileText,
  'equipamentos-vitais': ShieldAlert,
};

function serviceTone(service: CemigService) {
  if (
    service.slug === 'estou-sem-luz' ||
    service.slug === 'desligamento-programado' ||
    service.slug === 'equipamentos-vitais'
  ) {
    return {
      card: 'border-red-100 bg-red-50/70 text-red-950 hover:border-red-200',
      icon: 'bg-white text-red-800',
      title: 'text-red-950',
      action: 'text-red-800',
      cta: 'bg-red-700 text-white',
      ghost: 'text-red-900/10',
      tag: 'bg-red-100 text-red-800',
    };
  }

  if (service.slug === 'tarifa-social') {
    return {
      card: 'border-cerrado-100 bg-cerrado-100/45 text-cerrado-700 hover:border-cerrado-700/30',
      icon: 'bg-white text-cerrado-700',
      title: 'text-cerrado-700',
      action: 'text-cerrado-700',
      cta: 'bg-cerrado-700 text-white',
      ghost: 'text-cerrado-700/10',
      tag: 'bg-white text-cerrado-700',
    };
  }

  if (service.slug === 'segunda-via-conta' || service.slug === 'consultar-debitos') {
    return {
      card: 'border-clay-200 bg-clay-50/55 text-clay-900 hover:border-clay-300',
      icon: 'bg-white text-clay-700',
      title: 'text-clay-900',
      action: 'text-clay-700',
      cta: 'bg-ink-900 text-white',
      ghost: 'text-clay-700/10',
      tag: 'bg-white text-clay-700',
    };
  }

  return {
    card: 'border-sun-100 bg-sun-100/75 text-ink-900 hover:border-sun-500/35',
    icon: 'bg-white text-ink-900',
    title: 'text-ink-900',
    action: 'text-clay-700',
    cta: 'bg-ink-900 text-white',
    ghost: 'text-ink-900/10',
    tag: 'bg-white text-ink-800',
  };
}

const quickActions = [
  {
    label: 'Ligar 116',
    href: 'tel:116',
    icon: PhoneCall,
    tone: 'bg-ink-900 text-white',
  },
  {
    label: 'WhatsApp',
    href: 'https://api.whatsapp.com/send/?phone=553135061160',
    icon: MessageCircle,
    tone: 'bg-cerrado-600 text-white',
  },
  {
    label: 'Telegram',
    href: 'https://t.me/cemigbot',
    icon: Send,
    tone: 'bg-sky-700 text-white',
  },
  {
    label: 'Atende Web',
    href: 'https://atende.cemig.com.br/',
    icon: ExternalLink,
    tone: 'bg-white text-ink-900 border border-ink-100',
  },
] as const;

export const metadata = {
  title: cemigInfoSeed.seo.title,
  description: cemigInfoSeed.seo.description,
};

export default function EnergiaPage() {
  const featuredServices = featuredServiceSlugs
    .map((slug) => cemigInfoSeed.services.find((service) => service.slug === slug))
    .filter((service): service is CemigService => Boolean(service));

  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Cemig', '116', 'WhatsApp', '2a via']} searchHref="/servicos" />

      <Band className="px-3.5 py-4 md:px-6 lg:px-8">
        <section className="border-ink-100 bg-ink-900 shadow-card relative overflow-hidden rounded-2xl border text-white">
          <Zap
            className="pointer-events-none absolute -bottom-12 -right-10 h-48 w-48 text-white/10"
            aria-hidden="true"
          />
          <div className="relative p-4 md:p-6 lg:p-8">
            <p className="text-sun-100 m-0 flex items-center gap-1.5 text-[12px] font-bold uppercase">
              <Zap size={15} aria-hidden="true" />
              {cemigInfoSeed.provider} em {cemigInfoSeed.state}
            </p>
            <h1 className="m-0 mt-3 max-w-2xl text-[34px] font-extrabold leading-none md:text-[46px]">
              {cemigInfoSeed.hero.title}
            </h1>
            <p className="text-white/82 m-0 mt-3 max-w-2xl text-[15px] font-medium leading-relaxed md:text-[17px]">
              {cemigInfoSeed.hero.subtitle}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <a
                    key={action.label}
                    href={action.href}
                    className={cn(
                      'flex min-h-12 items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-extrabold no-underline',
                      action.tone,
                    )}
                  >
                    <Icon size={17} aria-hidden="true" />
                    {action.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="border-white/12 border-t bg-red-950/35 p-4 md:px-6">
            <p className="m-0 flex gap-2 text-[13px] font-semibold leading-relaxed text-white">
              <ShieldAlert className="mt-0.5 shrink-0 text-red-100" size={18} aria-hidden="true" />
              {cemigInfoSeed.hero.alert}
            </p>
          </div>
        </section>
      </Band>

      <Divider />
      <Band className="grid gap-3 px-3.5 py-3 md:grid-cols-2 md:px-6 lg:px-8">
        {featuredServices.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Canais oficiais" title="Atendimento por telefone e mensagens" />
        <div className="grid gap-2">
          {cemigInfoSeed.mainContacts.map((contact) => (
            <article
              key={contact.label}
              className="border-ink-100 shadow-card rounded-lg border bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-ink-900 m-0 font-sans text-[15px] font-extrabold">
                    {contact.label}
                  </h3>
                  <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                    {contact.description}
                  </p>
                  {'note' in contact && contact.note ? (
                    <p className="bg-sun-100 text-ink-800 m-0 mt-2 rounded-md p-2 text-[12px] font-semibold leading-relaxed">
                      {contact.note}
                    </p>
                  ) : null}
                </div>
                <ContactAction type={contact.type} value={contact.value} />
              </div>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Apps e links" title="Atalhos digitais" />
        <div className="grid gap-2 md:grid-cols-2">
          {cemigInfoSeed.digitalChannels.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              className="border-ink-100 text-ink-900 shadow-card rounded-lg border bg-white p-3 no-underline"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 font-sans text-[16px] font-extrabold">{channel.name}</h3>
                  <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                    {channel.description}
                  </p>
                </div>
                <ExternalLink
                  className="text-clay-600 mt-0.5 shrink-0"
                  size={18}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {channel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-4 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Passo a passo" title="Outros serviços da Cemig" />
        <div className="space-y-2">
          {cemigInfoSeed.services
            .filter(
              (service) =>
                !featuredServiceSlugs.includes(
                  service.slug as (typeof featuredServiceSlugs)[number],
                ),
            )
            .map((service) => (
              <ServiceDetails key={service.slug} service={service} />
            ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Segurança" title="Quando não mexer e ligar 116" />
        <div className="grid gap-2 md:grid-cols-2">
          {cemigInfoSeed.safetyGuides.map((guide) => (
            <article
              key={guide.title}
              className={cn(
                'shadow-card rounded-lg border p-3',
                guide.priority === 'high'
                  ? 'border-red-100 bg-red-50 text-red-950'
                  : 'border-sun-100 bg-sun-100 text-ink-900',
              )}
            >
              <h3 className="m-0 font-sans text-[15px] font-extrabold">{guide.title}</h3>
              <p className="m-0 mt-1 text-[13px] font-medium leading-relaxed">{guide.text}</p>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Presencial" title={cemigInfoSeed.attendanceLocations.title} />
        <p className="text-ink-700 m-0 text-[14px] leading-relaxed">
          {cemigInfoSeed.attendanceLocations.description}
        </p>
        <div className="border-ink-100 bg-paper rounded-lg border p-3">
          <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">
            {cemigInfoSeed.attendanceLocations.localSearchHint}
          </p>
          <ol className="text-ink-700 m-0 mt-2 space-y-1 pl-5 text-[13px] leading-relaxed">
            {cemigInfoSeed.attendanceLocations.instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
        </div>
        <a
          href={cemigInfoSeed.attendanceLocations.url}
          className="bg-ink-900 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
        >
          <Map size={17} aria-hidden="true" />
          Consultar locais
        </a>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Perguntas frequentes" title="Dúvidas rápidas" />
        <div className="space-y-2">
          {cemigInfoSeed.faq.map((item) => (
            <details
              key={item.question}
              className="border-ink-100 shadow-card rounded-lg border bg-white p-3"
            >
              <summary className="text-ink-900 cursor-pointer text-[14px] font-extrabold">
                {item.question}
              </summary>
              <p className="text-ink-700 m-0 mt-2 text-[13px] leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </Band>

      <Divider />
      <Band
        variant="paper-deep"
        className="text-ink-600 px-3.5 py-4 text-[12px] leading-relaxed md:px-6 lg:px-8"
      >
        <p className="m-0">
          Verificado em {formatDate(cemigInfoSeed.lastVerifiedAt)}. Consulte sempre os canais
          oficiais para prazos, disponibilidade e eventuais mudanças nos serviços.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cemigInfoSeed.sources.map((source) => (
            <a key={source.url} href={source.url} className="text-clay-700 font-bold underline">
              {source.title}
            </a>
          ))}
        </div>
      </Band>

      <TabBar active="servicos" />
    </AppFrame>
  );
}

function ServiceCard({ service }: { service: CemigService }) {
  const Icon = serviceIcons[service.slug] ?? Headphones;
  const tone = serviceTone(service);

  return (
    <article
      className={cn(
        'shadow-card group relative overflow-hidden rounded-2xl border p-4 transition hover:shadow-sm',
        tone.card,
      )}
    >
      <Icon
        className={cn('pointer-events-none absolute -bottom-5 -right-4 h-24 w-24', tone.ghost)}
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full', tone.icon)}>
            <Icon size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              className={cn(
                'font-display m-0 text-[17px] font-extrabold leading-tight',
                tone.title,
              )}
            >
              {service.title}
            </h2>
            <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">{service.summary}</p>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <a
            href={service.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-extrabold no-underline',
              tone.cta,
            )}
          >
            Abrir serviço
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          {service.slug === 'estou-sem-luz' ? (
            <a
              href="tel:116"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-[12px] font-extrabold text-white no-underline"
            >
              Emergência 116
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ServiceDetails({ service }: { service: CemigService }) {
  const Icon = serviceIcons[service.slug] ?? Headphones;
  const tone = serviceTone(service);

  return (
    <details
      className="border-ink-100 shadow-card hover:border-clay-200 open:border-clay-200 group rounded-xl border bg-white transition focus:!outline-none focus-visible:!outline-none focus-visible:!ring-0"
      style={{ outline: 'none' }}
    >
      <summary
        className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-extrabold focus:!outline-none focus-visible:!outline-none focus-visible:!ring-0"
        style={{ outline: 'none' }}
      >
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', tone.icon)}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className={cn('min-w-0 flex-1', tone.title)}>{service.title}</span>
        <ChevronRight
          size={16}
          className={cn('shrink-0 transition group-open:rotate-90', tone.action)}
          aria-hidden="true"
        />
      </summary>
      <div className="border-ink-100 border-t px-3 pb-3 pt-3">
        <p className="text-ink-700 m-0 text-[13px] leading-relaxed">{service.summary}</p>
        {'howTo' in service && service.howTo.length > 0 ? (
          <ol className="text-ink-700 m-0 mt-3 grid gap-2 p-0 text-[13px] leading-relaxed">
            {service.howTo.map((step, index) => (
              <li key={`${index}-${step}`} className="flex gap-2">
                <span className="bg-paper-deep text-ink-700 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-extrabold">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {'requiredInfo' in service && service.requiredInfo ? (
          <div className="bg-paper mt-3 rounded-lg p-3">
            <p className="text-ink-600 m-0 text-[12px] font-bold uppercase">Tenha em mãos</p>
            <p className="text-ink-700 m-0 mt-1 text-[13px]">{service.requiredInfo.join(' · ')}</p>
          </div>
        ) : null}
        {'eligibility' in service && service.eligibility ? (
          <ul className="text-ink-700 m-0 mt-3 space-y-1 pl-5 text-[13px] leading-relaxed">
            {service.eligibility.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {'examples' in service && service.examples ? (
          <p className="text-ink-700 m-0 mt-3 text-[13px] leading-relaxed">
            Exemplos: {service.examples.join(', ')}.
          </p>
        ) : null}
        <a
          href={service.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[12px] font-extrabold underline',
            tone.action,
          )}
        >
          Fonte oficial
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </details>
  );
}

function ContactAction({ type, value }: { type: string; value: string }) {
  if (type === 'phone') {
    return (
      <a
        href={`tel:${value.replace(/\D/g, '')}`}
        className="bg-ink-900 shrink-0 rounded-md px-3 py-2 text-[13px] font-extrabold text-white no-underline"
      >
        {value}
      </a>
    );
  }

  if (type === 'whatsapp') {
    return (
      <a
        href="https://api.whatsapp.com/send/?phone=553135061160"
        className="bg-cerrado-600 shrink-0 rounded-md px-3 py-2 text-[13px] font-extrabold text-white no-underline"
      >
        WhatsApp
      </a>
    );
  }

  if (type === 'sms') {
    return (
      <a
        href={`sms:${value}`}
        className="shrink-0 rounded-md bg-sky-700 px-3 py-2 text-[13px] font-extrabold text-white no-underline"
      >
        SMS {value}
      </a>
    );
  }

  return <span className="text-ink-900 shrink-0 text-[13px] font-extrabold">{value}</span>;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">{eyebrow}</p>
      <h2 className="text-ink-900 m-0 mt-0.5 font-sans text-[20px] font-extrabold">{title}</h2>
    </div>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(`${date}T12:00:00`));
}
