import {
  AlertTriangle,
  Building2,
  HeartPulse,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Phone,
  ShieldAlert,
  Syringe,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import {
  listEmergencyContacts,
  listHealthCampaigns,
  listHealthFacilities,
} from '@/lib/utilities/queries';
import type { EmergencyContact, HealthFacility } from '@/lib/utilities/types';

export const metadata = {
  title: 'Postos de saúde em Carmo do Rio Claro - Portal Carmelitano',
  description:
    'Contatos de ESFs, UBS, CAPS, Farmácia Municipal, Sala de Vacinas, Vigilâncias e atendimento médico em Carmo do Rio Claro.',
  keywords: [
    'postos de saúde Carmo do Rio Claro',
    'ESF Carmo do Rio Claro',
    'UBS Geralda Carielo',
    'CAPS Carmo do Rio Claro',
    'Farmácia Municipal Carmo do Rio Claro',
    'Sala de Vacinas Carmo do Rio Claro',
  ],
};

const typeLabels: Record<string, string> = {
  secretaria: 'Secretaria',
  ubs: 'UBS',
  psf: 'ESF',
  caps: 'CAPS',
  odonto: 'Odontologia',
  'farmacia-publica': 'Farmácia',
  vacinacao: 'Vacinas',
  vigilancia: 'Vigilância',
  hospital: 'Hospital',
  upa: 'UPA',
};

const guidance = [
  {
    title: 'Quando procurar o ESF ou UBS',
    description:
      'Consultas de rotina, acompanhamento de gestantes, crianças, idosos, hipertensos, diabéticos, renovação de receitas, curativos, injeções, retirada de pontos e encaminhamentos.',
  },
  {
    title: 'Quando procurar o pronto atendimento',
    description:
      'Dor intensa, piora rápida, falta de ar, suspeita de AVC ou infarto, acidentes, febre persistente com sinais de alerta ou risco imediato.',
  },
  {
    title: 'Quando ligar para o SAMU',
    description:
      'Ligue 192 quando a pessoa não puder se deslocar com segurança ou houver risco imediato à vida.',
  },
];

type QuickPhoneItem = {
  id: string;
  title: string;
  subtitle: string;
  phone: string;
  whatsapp: string | null;
  urgent?: boolean;
};

export default async function SaudePage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const [facilities, campaigns, emergencyContacts] = await Promise.all([
    listHealthFacilities({ city_id: city.id }),
    listHealthCampaigns({ city_id: city.id }),
    listEmergencyContacts({ city_id: city.id }),
  ]);
  const emergencyUnits = facilities.filter((facility) =>
    ['hospital', 'upa'].includes(facility.type),
  );
  const primaryCare = facilities.filter((facility) => ['ubs', 'psf'].includes(facility.type));
  const supportUnits = facilities.filter(
    (facility) => !['hospital', 'upa', 'ubs', 'psf'].includes(facility.type),
  );
  const quickPhones = buildQuickPhones(facilities, emergencyContacts);

  return (
    <AppFrame className="bg-[#f5f7f4]">
      <AppHeader chips={['192', 'ESF', 'UBS', 'Vacinas']} searchHref="/servicos" />

      <Band className="px-3.5 py-4 md:px-6 lg:px-8">
        <UtilityHero
          icon={HeartPulse}
          kicker="Saúde pública"
          title="Postos de saúde e atendimento médico em Carmo"
          description="Encontre ESFs, UBS, CAPS, Farmácia Municipal, Sala de Vacinas, Vigilâncias e orientações sobre onde procurar atendimento."
          stat={`${facilities.length} unidades e serviços cadastrados.`}
          tone="cerrado"
          footer={
            <p className="text-cerrado-50 m-0 flex gap-2 text-[13px] font-semibold leading-relaxed">
              <AlertTriangle
                className="text-cerrado-100 mt-0.5 shrink-0"
                size={18}
                aria-hidden="true"
              />
              Em caso de risco imediato à vida, ligue 192 ou procure o pronto atendimento. Confirme
              horários da unidade antes do deslocamento.
            </p>
          }
        >
          {quickPhones.slice(0, 3).map((item) => (
            <HeroPhone key={item.id} item={item} />
          ))}
        </UtilityHero>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-5 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Telefones rápidos" title="Ligue direto para saúde" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickPhones.map((item) => (
            <QuickPhoneTile key={item.id} item={item} />
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="grid gap-3 bg-[#eef4ec] px-3.5 py-4 md:grid-cols-5 md:px-6 lg:px-8">
        <InfoCard
          icon={ShieldAlert}
          title="Emergência médica"
          text="SAMU 192 e pronto atendimento."
        />
        <InfoCard
          icon={Building2}
          title="Atendimento básico"
          text="ESF do seu território ou UBS."
        />
        <InfoCard icon={HeartPulse} title="Saúde mental" text="CAPS e equipe multiprofissional." />
        <InfoCard icon={Syringe} title="Vacinas" text="Sala de Vacinas e calendário nacional." />
        <InfoCard icon={Phone} title="Medicamentos" text="Farmácia Municipal e orientações." />
      </Band>

      <Divider />
      <Band className="space-y-4 bg-[#eef4ec] px-3.5 py-5 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Orientação" title="Onde procurar atendimento" />
        <div className="grid gap-3 md:grid-cols-3">
          {guidance.map((item) => (
            <article
              key={item.title}
              className="border-ink-200 shadow-card rounded-lg border bg-white p-3"
            >
              <h2 className="text-ink-900 m-0 font-sans text-[15px] font-extrabold">
                {item.title}
              </h2>
              <p className="text-ink-700 m-0 mt-2 text-[13px] leading-relaxed">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-6 px-3.5 py-5 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Agenda de saúde" title="Toque no nome ou número para ligar" />
        <FacilitySection
          title="ESFs e UBS"
          description="Atendimento básico, acompanhamento e encaminhamentos."
          facilities={primaryCare}
        />
        <FacilitySection
          title="Serviços de apoio"
          description="CAPS, farmácia, vacinas, odontologia e vigilâncias."
          facilities={supportUnits}
        />
        {emergencyUnits.length > 0 ? (
          <FacilitySection
            title="Hospital e pronto atendimento"
            description="Para casos graves ou que não podem aguardar."
            facilities={emergencyUnits}
          />
        ) : null}
      </Band>

      <Divider />
      <Band className="space-y-3 bg-[#eef4ec] px-3.5 py-5 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Campanhas" title="Campanhas ativas" />
        {campaigns.length === 0 ? (
          <p className="border-ink-200 text-ink-700 shadow-card m-0 rounded-lg border bg-white p-3 text-[13px]">
            Nenhuma campanha ativa no momento.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="border-ink-200 shadow-card rounded-lg border bg-white p-3"
              >
                <h2 className="text-ink-900 m-0 font-sans text-[15px] font-extrabold">
                  {campaign.title}
                </h2>
                {campaign.description ? (
                  <p className="text-ink-700 m-0 mt-1 text-[13px]">{campaign.description}</p>
                ) : null}
                {campaign.location ? (
                  <p className="text-ink-600 m-0 mt-1 text-[12px] font-semibold">
                    {campaign.location}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Band>

      <Divider />
      <Band className="text-ink-700 space-y-4 bg-[#eef4ec] px-3.5 py-5 text-[12px] leading-relaxed md:px-6 lg:px-8">
        <a
          href="/contato?tipo=erro-telefone&pagina=%2Fservicos%2Fsaude&assunto=Informar%20erro%20em%20posto%20de%20saude"
          target="_blank"
          rel="noreferrer"
          className="border-clay-300 text-clay-800 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[13px] font-extrabold no-underline hover:bg-[#f5f7f4]"
        >
          <MessageSquareWarning size={17} aria-hidden="true" />
          Informar erro em saúde
        </a>
        <p className="m-0">
          Esta página não substitui atendimento médico. Horários e agendas podem mudar; confirme com
          a unidade antes de sair.
        </p>
        <p className="m-0">Última verificação informada: {formatLatestVerification(facilities)}.</p>
      </Band>

      <TabBar active="servicos" />
    </AppFrame>
  );
}

function FacilitySection({
  title,
  description,
  facilities,
}: {
  title: string;
  description: string;
  facilities: HealthFacility[];
}) {
  if (facilities.length === 0) return null;

  return (
    <section className="border-ink-200 shadow-card space-y-3 rounded-xl border bg-white p-3">
      <SectionTitle eyebrow={description} title={title} />
      <div className="grid gap-3">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>
    </section>
  );
}

function FacilityCard({ facility }: { facility: HealthFacility }) {
  const primaryPhone = facility.phone ?? facility.secondaryPhone;
  const phoneHref = primaryPhone ? `tel:${digits(primaryPhone)}` : null;
  const whatsappUrl = whatsappHref(facility.whatsapp ?? primaryPhone);
  const initials = facility.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="border-ink-200 shadow-card rounded-lg border bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[13px] font-extrabold text-sky-700">
            {initials}
          </span>
          <div className="min-w-0">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="text-ink-900 hover:text-clay-700 block font-sans text-[15px] font-extrabold leading-snug no-underline hover:underline"
              >
                {facility.name}
              </a>
            ) : (
              <h2 className="text-ink-900 m-0 font-sans text-[15px] font-extrabold leading-snug">
                {facility.name}
              </h2>
            )}
            <p className="text-ink-600 m-0 mt-0.5 text-[12px] font-semibold">
              {typeLabels[facility.type] ?? facility.type} ·{' '}
              {facility.neighborhood ?? facility.districtName ?? 'Carmo do Rio Claro'}
            </p>
          </div>
        </div>
        {phoneHref ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <a
              href={phoneHref}
              className="border-cerrado-400 text-cerrado-900 hover:bg-cerrado-50 inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-[14px] font-extrabold no-underline"
            >
              <Phone size={16} aria-hidden="true" />
              <span className="whitespace-nowrap">{primaryPhone}</span>
            </a>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#1f8f4d] bg-[#e7f7ee] px-3 py-2 text-[13px] font-extrabold text-[#126c37] no-underline hover:bg-[#d8f1e2]"
              >
                <MessageCircle size={17} aria-hidden="true" />
                WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-2 space-y-2 sm:pl-[60px]">
        {facility.address ? (
          <p className="text-ink-600 m-0 flex gap-1.5 text-[12px] font-medium">
            <MapPin className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
            {facility.address}
          </p>
        ) : null}
        {facility.hoursLegacyText ? (
          <p className="text-ink-600 m-0 text-[12px] font-semibold">{facility.hoursLegacyText}</p>
        ) : null}
        {facility.services.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {facility.services.slice(0, 6).map((service) => (
              <span
                key={service}
                className="text-ink-700 rounded-full bg-[#eef4ec] px-2 py-1 text-[11px] font-bold"
              >
                {service}
              </span>
            ))}
          </div>
        ) : null}
        {facility.requirements.length > 0 ? (
          <p className="text-ink-600 m-0 text-[12px] font-medium">
            Levar: {facility.requirements.join(', ')}.
          </p>
        ) : null}
      </div>
    </article>
  );
}

function HeroPhone({ item }: { item: QuickPhoneItem }) {
  const urgentClasses = item.urgent
    ? 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100'
    : 'border-cerrado-200 bg-white text-cerrado-900 hover:bg-cerrado-50';

  return (
    <a
      href={`tel:${digits(item.phone)}`}
      className={`grid gap-2 rounded-lg border px-3 py-3 no-underline ${urgentClasses}`}
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold leading-snug">{item.title}</span>
        <span className="block text-[11px] font-semibold leading-snug opacity-80">
          {item.subtitle}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[16px] font-extrabold">
        <Phone size={17} aria-hidden="true" />
        {item.phone}
      </span>
    </a>
  );
}

function QuickPhoneTile({ item }: { item: QuickPhoneItem }) {
  const phoneHref = `tel:${digits(item.phone)}`;
  const whatsappUrl = whatsappHref(item.whatsapp ?? item.phone);

  return (
    <article className="border-ink-200 shadow-card rounded-xl border bg-white p-3">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            item.urgent ? 'bg-red-50 text-red-700' : 'bg-sky-100 text-sky-700'
          }`}
        >
          {item.urgent ? (
            <ShieldAlert size={21} aria-hidden="true" />
          ) : (
            <Phone size={21} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <a
            href={phoneHref}
            className="text-ink-900 hover:text-clay-700 block font-sans text-[15px] font-extrabold leading-snug no-underline hover:underline"
          >
            {item.title}
          </a>
          <p className="text-ink-600 m-0 mt-0.5 text-[12px] font-medium leading-relaxed">
            {item.subtitle}
          </p>
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${whatsappUrl ? 'sm:grid-cols-[minmax(0,1fr)_140px]' : ''}`}>
        <a
          href={phoneHref}
          className="border-cerrado-400 text-cerrado-900 inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 py-2 text-[13px] font-extrabold no-underline hover:bg-[#f5f7f4]"
        >
          <Phone size={16} aria-hidden="true" />
          <span className="whitespace-nowrap">{item.phone}</span>
        </a>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1f8f4d] bg-[#e7f7ee] px-3 py-2 text-[13px] font-extrabold text-[#126c37] no-underline hover:bg-[#d8f1e2]"
          >
            <MessageCircle size={17} aria-hidden="true" />
            WhatsApp
          </a>
        ) : null}
      </div>
    </article>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof HeartPulse;
  title: string;
  text: string;
}) {
  return (
    <article className="border-ink-200 shadow-card rounded-lg border bg-white p-3">
      <span className="bg-cerrado-100 text-cerrado-800 flex size-9 items-center justify-center rounded-lg">
        <Icon size={20} aria-hidden="true" />
      </span>
      <h2 className="text-ink-900 m-0 mt-2 font-sans text-[15px] font-extrabold">{title}</h2>
      <p className="text-ink-600 m-0 mt-1 text-[12px] leading-relaxed">{text}</p>
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

function buildQuickPhones(
  facilities: HealthFacility[],
  emergencyContacts: EmergencyContact[],
): QuickPhoneItem[] {
  const findContact = (terms: string[]) =>
    emergencyContacts.find((contact) =>
      terms.every((term) => normalize(contact.name).includes(normalize(term))),
    );
  const findFacility = (terms: string[]) =>
    facilities.find((facility) =>
      terms.every((term) => normalize(facility.name).includes(normalize(term))),
    );

  const samu =
    findContact(['samu']) ?? emergencyContacts.find((contact) => digits(contact.phone) === '192');
  const prontoAtendimento = findContact(['pronto', 'atendimento']);
  const secretaria = findFacility(['secretaria', 'saude']);
  const caps = findFacility(['caps']);
  const vacinas = findFacility(['vacinas']);
  const farmacia = findFacility(['farmacia']);
  const ubs = findFacility(['ubs', 'geralda']);

  const items = [
    samu
      ? fromContact(samu, 'SAMU', 'Emergência médica', true)
      : {
          id: 'samu-192',
          title: 'SAMU',
          subtitle: 'Emergência médica',
          phone: '192',
          whatsapp: null,
          urgent: true,
        },
    prontoAtendimento
      ? fromContact(prontoAtendimento, 'Pronto atendimento', 'Hospital São Vicente de Paulo', true)
      : null,
    secretaria
      ? fromFacility(secretaria, 'Secretaria de Saúde', 'Atendimento administrativo')
      : null,
    caps ? fromFacility(caps, 'CAPS', 'Saúde mental') : null,
    vacinas ? fromFacility(vacinas, 'Sala de Vacinas', 'Imunização') : null,
    farmacia ? fromFacility(farmacia, 'Farmácia Municipal', 'Medicamentos do SUS') : null,
    ubs ? fromFacility(ubs, 'UBS Geralda Carielo', 'Atenção básica') : null,
  ].filter((item): item is QuickPhoneItem => Boolean(item));

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${digits(item.phone)}:${normalize(item.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fromContact(
  contact: EmergencyContact,
  title: string,
  subtitle: string,
  urgent = false,
): QuickPhoneItem {
  return {
    id: `contact-${contact.id}`,
    title,
    subtitle,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    urgent,
  };
}

function fromFacility(
  facility: HealthFacility,
  title: string,
  subtitle: string,
): QuickPhoneItem | null {
  const phone = facility.phone ?? facility.secondaryPhone;
  if (!phone) return null;

  return {
    id: `facility-${facility.id}`,
    title,
    subtitle,
    phone,
    whatsapp: facility.whatsapp,
  };
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

function whatsappHref(value: string | null): string | null {
  const raw = value ? digits(value) : '';
  const local = raw.startsWith('55') ? raw.slice(2) : raw;
  if (!(local.length === 11 && local[2] === '9')) return null;
  return `https://wa.me/${raw.startsWith('55') ? raw : `55${raw}`}`;
}

function formatLatestVerification(facilities: HealthFacility[]): string {
  const latest = facilities
    .map((facility) => facility.lastVerifiedAt)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);
  if (!latest) return 'não informada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(`${latest}T12:00:00`));
}
