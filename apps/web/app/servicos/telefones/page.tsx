import {
  AlertTriangle,
  Building2,
  HeartPulse,
  Landmark,
  MessageSquareWarning,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { PhoneCard } from '@/components/public/utilities/phone-card';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import { listEmergencyContacts } from '@/lib/utilities/queries';
import type { EmergencyContact } from '@/lib/utilities/types';

const categoryLabels: Record<string, string> = {
  emergencia: 'Emergência',
  denuncia: 'Denúncias',
  seguranca: 'Segurança',
  prefeitura: 'Prefeitura e atendimento ao cidadão',
  secretarias: 'Secretarias municipais',
  saude: 'Saúde',
  'assistencia-social': 'Assistência social',
  'seguranca-publica': 'Segurança pública',
  'servicos-estaduais': 'Serviços estaduais e concessionárias',
  'turismo-cultura': 'Turismo, cultura e museu',
  utilidade: 'Utilidade pública',
};

const categoryDescriptions: Record<string, string> = {
  emergencia: 'Números oficiais para risco imediato. Em emergência, ligue.',
  prefeitura: 'Contatos gerais da Prefeitura Municipal e departamentos administrativos.',
  secretarias: 'Contatos das principais secretarias municipais.',
  saude: 'Unidades de saúde, ESFs, UBS, CAPS e serviços municipais.',
  'assistencia-social': 'CRAS, Bolsa Família, CadÚnico e benefícios sociais.',
  'seguranca-publica': 'Polícia Militar, Polícia Civil e canais de denúncia.',
  'servicos-estaduais': 'Energia, água, documentos, denúncias e serviços estaduais.',
  'turismo-cultura': 'Visitantes, eventos, turismo local e patrimônio cultural.',
};

export const metadata = {
  title: 'Telefones úteis de Carmo do Rio Claro - Portal Carmelitano',
  description:
    'Telefones úteis de Carmo do Rio Claro: Prefeitura, saúde, assistência social, emergência, segurança, Cemig, Copasa e serviços públicos.',
  keywords: [
    'telefones úteis Carmo do Rio Claro',
    'prefeitura Carmo do Rio Claro telefone',
    'secretaria de saúde Carmo do Rio Claro',
    'CRAS Carmo do Rio Claro',
    'Polícia Militar Carmo do Rio Claro',
    'Copasa telefone',
    'Cemig telefone',
  ],
};

export default async function TelefonesPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const contacts = await listEmergencyContacts({ city_id: city.id });
  const categories = Array.from(new Set(contacts.map((contact) => contact.category)));
  const emergency = contacts.filter((contact) =>
    ['emergencia', 'denuncia', 'seguranca'].includes(contact.category),
  );
  const quickCards = [
    {
      title: 'Emergência',
      description: 'Polícia, SAMU, Bombeiros e Defesa Civil.',
      phones: [
        { label: 'PM', phone: '190' },
        { label: 'SAMU', phone: '192' },
        { label: 'Bombeiros', phone: '193' },
        { label: 'Defesa Civil', phone: '199' },
      ],
      icon: ShieldAlert,
    },
    {
      title: 'Prefeitura',
      description: 'Atendimento geral ao cidadão.',
      phones: [{ label: 'Prefeitura', phone: '(35) 3561-2000' }],
      icon: Building2,
    },
    {
      title: 'Saúde',
      description: 'Secretaria de Saúde e unidades municipais.',
      phones: [
        { label: 'Secretaria', phone: '(35) 93618-0923' },
        { label: 'Adjunto', phone: '(35) 3561-2162' },
      ],
      icon: HeartPulse,
    },
    {
      title: 'Serviços',
      description: 'Cemig, Copasa, INSS e Governo de Minas.',
      phones: [
        { label: 'Cemig', phone: '116' },
        { label: 'Copasa', phone: '115' },
        { label: 'INSS', phone: '135' },
        { label: 'LigMinas', phone: '155' },
      ],
      icon: Landmark,
    },
  ];
  const heroEmergencyPhones = [
    { label: 'Polícia Militar', phone: '190' },
    { label: 'SAMU', phone: '192' },
    { label: 'Bombeiros', phone: '193' },
    { label: 'Defesa Civil', phone: '199' },
  ];

  return (
    <AppFrame className="bg-[#f5f7f4]">
      <AppHeader chips={['190', '192', 'Prefeitura', 'Saúde']} searchHref="/servicos" />

      <Band className="px-3.5 py-4 md:px-6 lg:px-8">
        <UtilityHero
          icon={PhoneCall}
          kicker="Utilidade pública"
          title="Telefones úteis de Carmo do Rio Claro"
          description="Contatos importantes da Prefeitura, saúde, assistência social, emergência, segurança, serviços públicos e atendimento ao cidadão."
          stat={`${contacts.length} contatos ativos na agenda.`}
          tone="sky"
          footer={
            <p className="text-ink-800 m-0 flex gap-2 text-[13px] font-semibold leading-relaxed">
              <AlertTriangle
                className="text-clay-700 mt-0.5 shrink-0"
                size={18}
                aria-hidden="true"
              />
              Antes de ligar, confira se o número ainda está ativo. Telefones públicos podem mudar
              sem aviso.
            </p>
          }
        >
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {heroEmergencyPhones.map((item) => (
              <a
                key={item.phone}
                href={`tel:${item.phone}`}
                className="inline-flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-white px-3 py-3 text-sky-950 no-underline hover:bg-sky-50"
              >
                <span className="min-w-0 text-[12px] font-bold leading-tight">{item.label}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[17px] font-extrabold text-sky-700">
                  <PhoneCall size={18} aria-hidden="true" />
                  {item.phone}
                </span>
              </a>
            ))}
          </div>
        </UtilityHero>
      </Band>

      <Divider />
      <Band className="grid gap-3 px-3.5 py-4 md:grid-cols-4 md:px-6 lg:px-8">
        {quickCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="border-ink-200 shadow-card rounded-lg border bg-white p-3"
            >
              <div className="flex items-start gap-2">
                <span className="bg-cerrado-100 text-cerrado-800 flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-ink-900 m-0 font-sans text-[15px] font-extrabold">
                    {card.title}
                  </h2>
                  <p className="text-ink-600 m-0 mt-1 text-[12px] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.phones.map((item) => (
                  <a
                    key={`${item.label}-${item.phone}`}
                    href={`tel:${digits(item.phone)}`}
                    className="bg-cerrado-100 text-cerrado-900 hover:bg-cerrado-200 rounded-md px-2.5 py-1.5 text-[12px] font-bold no-underline"
                  >
                    {item.label}: <span className="font-extrabold">{item.phone}</span>
                  </a>
                ))}
              </div>
            </article>
          );
        })}
      </Band>

      <Divider />
      <Band className="space-y-4 bg-[#eef4ec] px-3.5 py-5 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Em caso de emergência" title="Ligue para os números oficiais" />
        <p className="text-ink-700 m-0 text-[14px] leading-relaxed">
          Para situações de risco imediato, use os números oficiais de emergência. Não dependa
          apenas de mensagens ou WhatsApp.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {emergency.map((contact) => (
            <PhoneCard key={contact.id} contact={contact} />
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-6 px-3.5 py-5 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Agenda" title="Toque no número para ligar" />
        {categories
          .filter((category) => !['emergencia', 'denuncia', 'seguranca'].includes(category))
          .map((category) => {
            const categoryContacts = contacts.filter((contact) => contact.category === category);
            return (
              <section
                key={category}
                className="border-ink-200 shadow-card space-y-3 rounded-xl border bg-white p-3"
              >
                <SectionTitle
                  eyebrow="Telefones úteis"
                  title={categoryLabels[category] ?? category}
                />
                {categoryDescriptions[category] ? (
                  <p className="text-ink-600 m-0 text-[13px] leading-relaxed">
                    {categoryDescriptions[category]}
                  </p>
                ) : null}
                <div className="grid gap-3">
                  {categoryContacts.map((contact) => (
                    <PhoneCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </section>
            );
          })}
      </Band>

      <Divider />
      <Band className="text-ink-700 space-y-4 bg-[#eef4ec] px-3.5 py-5 text-[12px] leading-relaxed md:px-6 lg:px-8">
        <a
          href="/contato?tipo=erro-telefone&pagina=%2Fservicos%2Ftelefones&assunto=Informar%20erro%20em%20telefone"
          target="_blank"
          rel="noreferrer"
          className="border-clay-300 text-clay-800 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[13px] font-extrabold no-underline hover:bg-[#f5f7f4]"
        >
          <MessageSquareWarning size={17} aria-hidden="true" />
          Informar erro em telefone
        </a>
        <p className="m-0">
          Contatos marcados como fonte oficial foram retirados de portais públicos oficiais. Alguns
          números locais podem exigir confirmação antes da publicação definitiva.
        </p>
        <p className="m-0 mt-2">
          Última verificação informada: {formatLatestVerification(contacts)}.
        </p>
      </Band>

      <TabBar active="servicos" />
    </AppFrame>
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

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatLatestVerification(contacts: EmergencyContact[]): string {
  const latest = contacts
    .map((contact) => contact.lastVerifiedAt)
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
