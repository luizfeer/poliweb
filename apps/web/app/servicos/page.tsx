import { Link } from '@/components/navigation/link';
import {
  Anchor,
  Bell,
  CloudSun,
  Droplets,
  HeartPulse,
  Landmark,
  Phone,
  Pill,
  Trash2,
  Zap,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider } from '@/components/carmo';
import { TransparencyPulseWidget } from '@/components/public/transparency/transparency-pulse-widget';
import { AlertBanner } from '@/components/public/utilities/alert-banner';
import { UtilityHero } from '@/components/public/utilities/utility-hero';
import { getCurrentCity } from '@/lib/cities';
import { getTransparencySnapshot } from '@/lib/transparency';
import {
  listActiveAlerts,
  getPharmacyOnDuty,
  listEmergencyContacts,
} from '@/lib/utilities/queries';

export const metadata = {
  title: 'Serviços públicos - Portal Carmelitano',
  description: 'Coleta de lixo, telefones úteis, farmácias de plantão, saúde e alertas da cidade.',
};

const CARDS = [
  { href: '/servicos/coleta', title: 'Coleta de lixo', text: 'Rotas por bairro', icon: Trash2 },
  {
    href: '/servicos/telefones',
    title: 'Telefones úteis',
    text: 'Emergência e prefeitura',
    icon: Phone,
  },
  { href: '/servicos/farmacias', title: 'Farmácias', text: 'Plantão de hoje', icon: Pill },
  { href: '/servicos/saude', title: 'Saúde', text: 'UBS e campanhas', icon: HeartPulse },
  { href: '/servicos/energia', title: 'Energia', text: 'Cemig, 2a via e falta de luz', icon: Zap },
  {
    href: '/servicos/agua',
    title: 'Água e esgoto',
    text: 'Copasa, 2a via e vazamentos',
    icon: Droplets,
  },
  { href: '/servicos/alertas', title: 'Alertas', text: 'Água, energia e clima', icon: Bell },
  { href: '/servicos/clima', title: 'Clima', text: 'Previsão e época do ano', icon: CloudSun },
  { href: '/balsas', title: 'Balsas', text: 'Horários e valores', icon: Anchor },
];

export default async function ServicosPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const enabled = city.modules.includes('utilities');
  const transparencyEnabled = city.modules.includes('transparency');
  const [alerts, duty, contacts, transparencySnapshot] = await Promise.all([
    enabled ? listActiveAlerts({ city_id: city.id }) : Promise.resolve([]),
    enabled ? getPharmacyOnDuty({ city_id: city.id }) : Promise.resolve([]),
    enabled ? listEmergencyContacts({ city_id: city.id }) : Promise.resolve([]),
    transparencyEnabled ? getTransparencySnapshot(city.id) : Promise.resolve(null),
  ]);
  const critical = alerts.find((alert) => alert.severity === 'critical');

  return (
    <AppFrame>
      <AppHeader chips={['Coleta', 'Plantão', '190', 'Saúde']} searchHref="/servicos" />

      {critical && <AlertBanner alert={critical} />}

      <Band className="px-3.5 py-4">
        <UtilityHero
          icon={Landmark}
          kicker="Serviços públicos"
          title={`Utilidades de ${city.name}`}
          description="Telefones, coleta, saúde, farmácias, alertas, água, energia e clima em uma tela prática para resolver o dia."
          stat={
            enabled
              ? `${alerts.filter((alert) => alert.active).length} alertas ativos · ${contacts.length} telefones úteis`
              : 'Módulo ainda não ativo'
          }
        >
          <section className="border-clay-200 bg-clay-50 rounded-xl border p-3">
            <p className="text-clay-700 m-0 text-[12px] font-bold uppercase">Plantão hoje</p>
            <h2 className="text-ink-900 m-0 mt-1 font-sans text-[16px] font-extrabold">
              {duty[0]?.name ?? 'Escala não informada'}
            </h2>
          </section>
          <section className="rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="m-0 text-[12px] font-bold uppercase text-sky-700">Atalhos</p>
            <p className="text-ink-800 m-0 mt-1 text-[13px] font-semibold leading-relaxed">
              {contacts
                .slice(0, 2)
                .map((contact) => `${contact.name}: ${contact.shortDial ?? contact.phone}`)
                .join(' · ') || 'Telefones em atualização'}
            </p>
          </section>
        </UtilityHero>
      </Band>

      {!enabled ? (
        <Band className="px-3.5 py-5">
          <p className="text-ink-700 m-0 rounded-md border bg-white p-4 text-[14px]">
            O módulo de serviços públicos ainda não está ativo nesta cidade.
          </p>
        </Band>
      ) : (
        <>
          <Band className="grid grid-cols-2 gap-3 px-3.5 py-3 md:grid-cols-3">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="border-ink-100 shadow-card hover:border-clay-200 group relative overflow-hidden rounded-2xl border bg-white p-4 no-underline transition hover:shadow-sm"
                >
                  <Icon
                    className="text-clay-700/10 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
                    aria-hidden="true"
                  />
                  <span className="bg-clay-50 text-clay-700 grid h-10 w-10 place-items-center rounded-full">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-ink-900 m-0 mt-3 text-[16px] font-extrabold">
                    {card.title}
                  </h2>
                  <p className="text-ink-600 m-0 mt-0.5 text-[12px]">{card.text}</p>
                </Link>
              );
            })}
          </Band>

          {transparencySnapshot ? (
            <>
              <Divider />
              <Band className="px-3.5 py-3">
                <TransparencyPulseWidget
                  snapshot={transparencySnapshot}
                  cityName={city.name}
                  variant="services"
                />
              </Band>
            </>
          ) : null}
        </>
      )}
    </AppFrame>
  );
}
