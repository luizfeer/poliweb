import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronRight,
  Droplets,
  ExternalLink,
  FileText,
  Headphones,
  Home,
  Landmark,
  MessageCircle,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Waves,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { copasaCarmoDoRioClaroSeed, type CopasaService } from '@/lib/utilities/copasa-info';
import { cn } from '@/lib/utils';

const featuredServiceSlugs = [
  'segunda-via',
  'falta-de-agua',
  'vazamento-agua-rua',
  'vazamento-esgoto',
  'religacao-agua',
  'tarifa-social',
] as const;

const serviceIcons: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  'segunda-via': FileText,
  'falta-de-agua': Droplets,
  'vazamento-agua-rua': Waves,
  'vazamento-esgoto': ShieldAlert,
  'religacao-agua': RotateCcw,
  'tarifa-social': BadgeDollarSign,
  'troca-titularidade': Landmark,
  'parcelamento-debitos': FileText,
  'autoleitura-hidrometro': Smartphone,
  'conta-por-email': FileText,
  'certidao-negativa-debito': FileText,
};

function serviceTone(service: CopasaService) {
  const urgent = 'priority' in service && service.priority === 'high';

  if (urgent) {
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

  if (service.slug === 'segunda-via') {
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
    card: 'border-sky-200 bg-sky-50/60 text-sky-950 hover:border-sky-300',
    icon: 'bg-white text-sky-800',
    title: 'text-sky-950',
    action: 'text-sky-700',
    cta: 'bg-sky-800 text-white',
    ghost: 'text-sky-900/10',
    tag: 'bg-white text-sky-700',
  };
}

const quickActions = [
  { label: 'Ligar 115', href: 'tel:115', icon: PhoneCall, tone: 'bg-ink-900 text-white' },
  {
    label: '0800',
    href: 'tel:08000300115',
    icon: Headphones,
    tone: 'bg-white text-ink-900 border border-ink-100',
  },
  {
    label: 'WhatsApp',
    href: 'https://api.whatsapp.com/send?phone=5531997707000',
    icon: MessageCircle,
    tone: 'bg-cerrado-600 text-white',
  },
  {
    label: 'Agência Virtual',
    href: 'https://copasaportalprd.azurewebsites.net/Copasa.Portal/home/index',
    icon: ExternalLink,
    tone: 'bg-sky-700 text-white',
  },
] as const;

export const metadata = {
  title: copasaCarmoDoRioClaroSeed.seo.title,
  description: copasaCarmoDoRioClaroSeed.seo.description,
  keywords: copasaCarmoDoRioClaroSeed.seo.keywords,
};

export default function AguaPage() {
  const featuredServices = featuredServiceSlugs
    .map((slug) => copasaCarmoDoRioClaroSeed.services.find((service) => service.slug === slug))
    .filter((service): service is CopasaService => Boolean(service));

  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Copasa', '115', 'Água', '2a via']} searchHref="/servicos" />

      <Band className="px-3.5 py-4 md:px-6 lg:px-8">
        <section className="border-ink-100 shadow-card relative overflow-hidden rounded-2xl border bg-sky-950 text-white">
          <Droplets
            className="pointer-events-none absolute -bottom-12 -right-10 h-48 w-48 text-white/10"
            aria-hidden="true"
          />
          <div className="relative p-4 md:p-6 lg:p-8">
            <p className="m-0 flex items-center gap-1.5 text-[12px] font-bold uppercase text-sky-100">
              <Droplets size={15} aria-hidden="true" />
              {copasaCarmoDoRioClaroSeed.provider} em {copasaCarmoDoRioClaroSeed.city}
            </p>
            <h1 className="m-0 mt-3 max-w-2xl text-[34px] font-extrabold leading-none md:text-[46px]">
              {copasaCarmoDoRioClaroSeed.hero.title}
            </h1>
            <p className="text-white/82 m-0 mt-3 max-w-2xl text-[15px] font-medium leading-relaxed md:text-[17px]">
              {copasaCarmoDoRioClaroSeed.hero.subtitle}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <a
                    key={action.label}
                    href={action.href}
                    target={action.href.startsWith('http') ? '_blank' : undefined}
                    rel={action.href.startsWith('http') ? 'noreferrer' : undefined}
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
              {copasaCarmoDoRioClaroSeed.hero.alert}
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
        <SectionTitle eyebrow="Canais oficiais" title="Atendimento Copasa" />
        <div className="grid gap-2">
          {copasaCarmoDoRioClaroSeed.mainContacts.map((contact) => (
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
                  <p className="text-ink-600 m-0 mt-1 text-[12px] font-semibold">
                    {contact.availability}
                  </p>
                  {'important' in contact && contact.important ? (
                    <p className="bg-sun-100 text-ink-800 m-0 mt-2 rounded-md p-2 text-[12px] font-semibold leading-relaxed">
                      {contact.important}
                    </p>
                  ) : null}
                </div>
                <ContactAction
                  type={contact.type}
                  value={contact.value}
                  url={'url' in contact ? contact.url : undefined}
                />
              </div>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Apps e links" title="Atalhos digitais" />
        <div className="grid gap-2 md:grid-cols-2">
          {copasaCarmoDoRioClaroSeed.digitalChannels.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noreferrer"
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
        <SectionTitle eyebrow="Passo a passo" title="Outros serviços da Copasa" />
        <div className="space-y-2">
          {copasaCarmoDoRioClaroSeed.services
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
        <SectionTitle
          eyebrow="Atendimento presencial"
          title={copasaCarmoDoRioClaroSeed.localAgency.title}
        />
        <article className="border-sun-100 bg-sun-100 text-ink-900 shadow-card rounded-lg border p-3">
          <p className="m-0 flex gap-2 text-[13px] font-semibold leading-relaxed">
            <AlertTriangle className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
            {copasaCarmoDoRioClaroSeed.localAgency.note}
          </p>
        </article>
        <article className="border-ink-100 shadow-card rounded-lg border bg-white p-3">
          <h3 className="text-ink-900 m-0 flex items-center gap-2 font-sans text-[16px] font-extrabold">
            <Home size={17} aria-hidden="true" />
            {copasaCarmoDoRioClaroSeed.localAgency.address.street},{' '}
            {copasaCarmoDoRioClaroSeed.localAgency.address.number}
          </h3>
          <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
            {copasaCarmoDoRioClaroSeed.localAgency.address.neighborhood},{' '}
            {copasaCarmoDoRioClaroSeed.localAgency.address.city}/
            {copasaCarmoDoRioClaroSeed.localAgency.address.state} · CEP{' '}
            {copasaCarmoDoRioClaroSeed.localAgency.address.zipCode}
          </p>
          <p className="text-ink-700 m-0 mt-2 text-[13px] font-semibold">
            {copasaCarmoDoRioClaroSeed.localAgency.phone} ·{' '}
            {copasaCarmoDoRioClaroSeed.localAgency.openingHours}
          </p>
          <a
            href={copasaCarmoDoRioClaroSeed.localAgency.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-clay-700 mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-[12px] font-extrabold underline"
          >
            Fonte do endereço
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </article>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Saneamento"
          title={copasaCarmoDoRioClaroSeed.localSanitationData.title}
        />
        <div className="grid gap-2 md:grid-cols-3">
          <StatCard
            label="Água tratada"
            value={
              copasaCarmoDoRioClaroSeed.localSanitationData.waterSupply.publicWaterServiceCoverage
            }
          />
          <StatCard
            label="Esgoto atendido"
            value={copasaCarmoDoRioClaroSeed.localSanitationData.sewage.publicSewageServiceCoverage}
          />
          <StatCard
            label="Perdas na distribuição"
            value={copasaCarmoDoRioClaroSeed.localSanitationData.waterSupply.distributionLossIndex}
          />
          <StatCard
            label="Tarifa média"
            value={copasaCarmoDoRioClaroSeed.localSanitationData.waterSupply.averageWaterTariff}
          />
          <StatCard
            label="Tratamento coletado"
            value={
              copasaCarmoDoRioClaroSeed.localSanitationData.sewage.sewageTreatmentOfCollectedVolume
            }
          />
          <StatCard
            label="Hidrômetros"
            value={copasaCarmoDoRioClaroSeed.localSanitationData.waterSupply.hydrometerCoverage}
          />
        </div>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Cuidados" title="Antes de abrir chamado" />
        <div className="grid gap-2 md:grid-cols-2">
          {copasaCarmoDoRioClaroSeed.safetyAndUsefulGuides.map((guide) => (
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
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Perguntas frequentes" title="Dúvidas rápidas" />
        <div className="space-y-2">
          {copasaCarmoDoRioClaroSeed.faq.map((item) => (
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
          Verificado em {formatDate(copasaCarmoDoRioClaroSeed.lastVerifiedAt)}. Consulte sempre os
          canais oficiais para prazos, disponibilidade e eventuais mudanças nos serviços.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {copasaCarmoDoRioClaroSeed.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-clay-700 font-bold underline"
            >
              {source.title}
            </a>
          ))}
        </div>
      </Band>

      <TabBar active="servicos" />
    </AppFrame>
  );
}

function ServiceCard({ service }: { service: CopasaService }) {
  const Icon = serviceIcons[service.slug] ?? Headphones;
  const urgent = 'priority' in service && service.priority === 'high';
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
          {urgent ? (
            <a
              href="tel:115"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-[12px] font-extrabold text-white no-underline"
            >
              Emergência 115
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ServiceDetails({ service }: { service: CopasaService }) {
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
        <div className="bg-paper mt-3 rounded-lg p-3">
          <p className="text-ink-600 m-0 text-[12px] font-bold uppercase">Tenha em mãos</p>
          <p className="text-ink-700 m-0 mt-1 text-[13px]">{service.requiredInfo.join(' · ')}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {service.channels.map((channel) => (
            <span
              key={channel}
              className={cn('rounded-full px-2 py-1 text-[11px] font-bold', tone.tag)}
            >
              {channel}
            </span>
          ))}
        </div>
        {'currentRules2026' in service && service.currentRules2026 ? (
          <div className="bg-sun-100 text-ink-800 mt-3 rounded-md p-2 text-[12px] font-semibold leading-relaxed">
            <p className="m-0">{service.currentRules2026.socialTariff1}</p>
            <p className="m-0 mt-1">{service.currentRules2026.socialTariff2}</p>
          </div>
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

function ContactAction({ type, value, url }: { type: string; value: string; url?: string }) {
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
        href={url ?? 'https://api.whatsapp.com/send?phone=5531997707000'}
        target="_blank"
        rel="noreferrer"
        className="bg-cerrado-600 shrink-0 rounded-md px-3 py-2 text-[13px] font-extrabold text-white no-underline"
      >
        WhatsApp
      </a>
    );
  }

  return <span className="text-ink-900 shrink-0 text-[13px] font-extrabold">{value}</span>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border-ink-100 shadow-card rounded-lg border bg-white p-3">
      <p className="m-0 text-[12px] font-bold uppercase text-sky-700">{label}</p>
      <p className="text-ink-900 m-0 mt-1 text-[22px] font-extrabold leading-tight">{value}</p>
    </article>
  );
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
