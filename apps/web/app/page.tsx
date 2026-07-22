import type { Metadata } from 'next';
import { Link } from '@/components/navigation/link';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Portal Carmelitano — Carmo do Rio Claro/MG, Furnas e Canastra',
  description:
    'Portal hiperlocal de Carmo do Rio Claro/MG: comércio, turismo na região de Furnas e Canastra, eventos, imóveis, classificados, serviços públicos e transparência municipal.',
  path: '/',
  keywords: [
    'Carmo do Rio Claro',
    'Furnas',
    'Canastra',
    'turismo Furnas',
    'pousadas Carmo do Rio Claro',
    'comércio Carmo do Rio Claro',
  ],
});

export const revalidate = 60;

import {
  BookOpen,
  BedDouble,
  Calendar,
  CalendarDays,
  Church,
  CloudSun,
  Droplet,
  Fish,
  HeartPulse,
  House,
  Landmark,
  MapPinned,
  MessageCircleQuestion,
  PhoneCall,
  Pill,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';

import {
  AppFrame,
  Band,
  CupomCard,
  Divider,
  EmptyCta,
  HScroll,
  ListItem,
  PousadaCard,
  RoundCat,
  SectionHeader,
  TileCard,
} from '@/components/carmo';
import { BusinessCard } from '@/components/carmo/business';
import { BusinessPromoHero } from '@/components/marketing/business-promo-hero';
import { NewsletterCTA } from '@/components/marketing/newsletter-cta';
import { AssistantCtaBlock } from '@/components/public/home/blocks/AssistantCtaBlock';
import { TourismGatewayWidget } from '@/components/public/tourism/tourism-gateway-widget';
import { TransparencyPulseWidget } from '@/components/public/transparency/transparency-pulse-widget';
import { WeatherWidget } from '@/components/public/weather/weather-widget';
import {
  listActiveFeaturedBusinesses,
  listBusinesses,
  listByCategory,
  listCityPromotions,
  type Business,
  type CityPromotion,
} from '@/lib/businesses';
import {
  getChurchNameBySlug,
  listChurches,
  listChurchSchedule,
  weekdayLabels,
} from '@/lib/churches';
import type { WeekdayKey } from '@/lib/churches';
import { getCurrentCity } from '@/lib/cities';
import { getHomeLayoutForRender } from '@/lib/home/queries';
import { HomeRenderer } from '@/components/public/home/HomeRenderer';
import { getTransparencySnapshot } from '@/lib/transparency';
import { listAttractions, listGuides, listTourPackages } from '@/lib/tourism';
import {
  getPharmacyOnDuty,
  listActiveAlerts,
  listEmergencyContacts,
} from '@/lib/utilities/queries';
import { getWeatherForHome } from '@/lib/weather';

const latestFeatures = [
  {
    title: 'Igrejas e horários',
    text: 'Missas, cultos e encontros da semana.',
    href: '/comunidade/igrejas',
    icon: Church,
    bg: 'bg-cerrado-100',
    fg: 'text-cerrado-700',
  },
  {
    title: 'Transparência pública',
    text: 'Prefeitura, câmara e licitações.',
    href: '/transparencia',
    icon: Landmark,
    bg: 'bg-sky-100',
    fg: 'text-sky-700',
  },
  {
    title: 'Serviços de hoje',
    text: 'Coleta, plantão e telefones úteis.',
    href: '/servicos',
    icon: Sparkles,
    bg: 'bg-clay-50',
    fg: 'text-clay-600',
  },
  {
    title: 'Sorteios locais',
    text: 'Campanhas e prêmios dos parceiros.',
    href: '/sorteios',
    icon: Tag,
    bg: 'bg-sun-100',
    fg: 'text-ink-900',
  },
];

const assistantQuestions = [
  'Qual farmácia está de plantão hoje à noite?',
  'Tem missa ou culto esta semana? Qual horário?',
  'Que eventos acontecem neste fim de semana?',
  'Quando passa o caminhão de lixo no Jardim América?',
  'Onde alugar barco pra pescar tilápia na represa?',
  'O que a câmara aprovou nas últimas duas semanas?',
];

const weekdayShortLabels = {
  segunda: 'seg',
  terca: 'ter',
  quarta: 'qua',
  quinta: 'qui',
  sexta: 'sex',
  sabado: 'sáb',
  domingo: 'dom',
} satisfies Record<WeekdayKey, string>;

function HomeLodgingMapWidget({ cityName, lodgings }: { cityName: string; lodgings: Business[] }) {
  const withLocation = lodgings.filter((item) => item.lat && item.lng);
  const previewItems = lodgings.slice(0, 3);

  return (
    <Band className="bg-paper px-3.5 pb-3 md:px-6 lg:px-8">
      <Link
        href="/turismo/onde-ficar?visualizacao=dividida"
        className="border-sky-500/40 bg-sky-700 shadow-pop relative block overflow-hidden rounded-lg border text-white hover:no-underline hover:brightness-[1.03]"
      >
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_85%_at_10%_-20%,rgba(255,255,255,0.14),transparent_52%)]"
          aria-hidden="true"
        />
        <MapPinned
          className="pointer-events-none absolute -right-2 top-1/2 size-[min(48vw,200px)] -translate-y-1/2 text-white/[0.07]"
          aria-hidden="true"
          strokeWidth={1}
        />
        <div className="relative grid min-h-[210px] md:grid-cols-[minmax(0,1fr)_240px]">
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/16 text-sky-100 ring-1 ring-white/25">
                <MapPinned className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-sky-100">
                  Mapa de hospedagens
                </p>
                <h2 className="font-display m-0 mt-1 text-[24px] font-extrabold leading-tight">
                  Encontre pousadas em {cityName}
                </h2>
                <p className="m-0 mt-2 max-w-xl text-[13px] font-medium leading-relaxed text-white/85">
                  Abra a tela com lista e mapa lado a lado para comparar localização, fotos e
                  detalhes.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/14 px-3 py-1.5 text-[12px] font-bold text-white">
                <BedDouble className="size-3.5" aria-hidden="true" />
                {lodgings.length || 'Novas'} opções
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/14 px-3 py-1.5 text-[12px] font-bold text-white">
                <MapPinned className="size-3.5" aria-hidden="true" />
                {withLocation.length || 'Mapa'} com localização
              </span>
            </div>

            {previewItems.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
                {previewItems.map((item) => (
                  <span
                    key={item.id}
                    className="flex min-h-0 min-w-0 w-full items-center gap-3 rounded-md bg-white/12 p-3 ring-1 ring-white/12"
                  >
                    <span className="relative block size-10 shrink-0 overflow-hidden rounded-md bg-white/15 ring-1 ring-white/18">
                      {item.coverUrl || item.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverUrl ?? item.logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <LodgingMapThumbPlaceholder />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-extrabold">{item.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium text-white/75">
                        {item.district ?? 'Hospedagem local'}
                      </span>
                    </span>
                  </span>
                ))}
              </div>
            ) : null}

            <span className="text-ink-900 mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 text-[13px] font-extrabold">
              Abrir mapa de pousadas
            </span>
          </div>

          <div className="relative hidden overflow-hidden border-sky-500/35 bg-sky-700 md:block md:border-l">
            <span
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]"
              aria-hidden="true"
            />
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <MapPinned
              className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 text-white/[0.06]"
              aria-hidden="true"
              strokeWidth={1}
            />
            <span className="bg-sun-500 shadow-pop absolute left-[22%] top-[26%] flex size-8 items-center justify-center rounded-full border-4 border-white" />
            <span className="bg-clay-500 shadow-pop absolute right-[26%] top-[46%] flex size-9 items-center justify-center rounded-full border-4 border-white" />
            <span className="shadow-pop absolute bottom-[22%] left-[42%] flex size-7 items-center justify-center rounded-full border-4 border-white bg-sky-500" />
            <span className="absolute bottom-3 left-3 right-3 rounded-md bg-white/14 p-3 text-[12px] font-extrabold text-white backdrop-blur">
              Lista + mapa lado a lado
            </span>
          </div>
        </div>
      </Link>
    </Band>
  );
}

function LodgingMapThumbPlaceholder() {
  return (
    <span className="relative flex h-full w-full items-center justify-center">
      <MapPinned
        className="pointer-events-none absolute size-11 text-white/22"
        aria-hidden="true"
        strokeWidth={1.25}
      />
      <BedDouble className="relative z-[1] size-5 text-white/80" aria-hidden="true" />
    </span>
  );
}

function lodgingDistanceLabel(business: Business): string | undefined {
  const district = business.district;
  if (district && business.address) return `${district} · ${business.address.split(',')[0]}`;
  return district ?? business.address ?? undefined;
}

const LODGING_AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi',
  estacionamento: 'Estacionamento',
  ar_condicionado: 'Ar-condicionado',
  acessivel: 'Acessível',
  aceita_pet: 'Aceita pet',
  area_infantil: 'Área infantil',
  reserva: 'Reserva',
  piscina: 'Piscina',
  cafe_da_manha: 'Café da manhã',
};

function formatLodgingAmenities(amenities: string[] | null | undefined): string[] {
  return (amenities ?? [])
    .map((slug) => LODGING_AMENITY_LABELS[slug])
    .filter((label): label is string => Boolean(label))
    .slice(0, 2);
}

const PROMO_ILLO_FALLBACKS = ['🛍️', '🎁', '🏷️', '✨', '💸', '⭐'];

function promotionIlloFor(promo: CityPromotion): string {
  const key = promo.businessName.toLowerCase();
  if (/restaur|comida|lanch|pizz|burger/.test(key)) return '🍽️';
  if (/pousada|hotel|hosped/.test(key)) return '🛏️';
  if (/padar|confeit/.test(key)) return '🥖';
  if (/farm|drogaria/.test(key)) return '💊';
  if (/auto|mec|pneu/.test(key)) return '🔧';
  if (/sal[aã]o|beleza|barbe/.test(key)) return '💇';
  if (/mercado|sacol|hortifr/.test(key)) return '🛒';
  const fallback = PROMO_ILLO_FALLBACKS[promo.id.charCodeAt(0) % PROMO_ILLO_FALLBACKS.length];
  return fallback ?? '🏷️';
}

function getTodayKey(): WeekdayKey {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  }).format(new Date());

  const map: Record<string, WeekdayKey> = {
    Sunday: 'domingo',
    Monday: 'segunda',
    Tuesday: 'terca',
    Wednesday: 'quarta',
    Thursday: 'quinta',
    Friday: 'sexta',
    Saturday: 'sabado',
  };

  return map[weekday] ?? 'domingo';
}

export default async function Home() {
  const city = await getCurrentCity();

  const customLayout = city ? await getHomeLayoutForRender(city.id) : null;
  if (city && customLayout) {
    const topMarginClass = {
      none: '',
      sm: 'mt-3',
      md: 'mt-6',
      lg: 'mt-10',
    }[customLayout.config.topMargin ?? 'none'];

    return (
      <AppFrame>
        {customLayout.config.headerFade ? (
          <div
            aria-hidden="true"
            className="pointer-events-none h-16 w-full bg-gradient-to-b from-primary/95 via-primary/40 to-transparent"
          />
        ) : null}
        <div className={topMarginClass}>
          <HomeRenderer blocks={customLayout.blocks} city={city} />
        </div>
      </AppFrame>
    );
  }

  const utilitiesEnabled = city?.modules.includes('utilities') ?? false;
  const communityEnabled = city?.modules.includes('community') ?? false;
  const transparencyEnabled = city?.modules.includes('transparency') ?? false;
  const tourismEnabled = city?.modules.includes('tourism') ?? false;
  const businessesEnabled = city?.modules.includes('businesses') ?? false;

  const [
    homeBusinesses,
    featuredBusinesses,
    lodgingBusinesses,
    tourismAttractions,
    tourismPackages,
    tourismGuides,
    weather,
    alerts,
    dutyPharmacies,
    contacts,
    churches,
    churchSchedule,
    transparencySnapshot,
    cityPromotions,
  ] = await Promise.all([
    businessesEnabled
      ? listBusinesses({ city_id: city?.id, sort: 'recent', limit: 10 })
      : Promise.resolve([]),
    businessesEnabled && city
      ? listActiveFeaturedBusinesses({ city_id: city.id, limit: 8 })
      : Promise.resolve([]),
    city
      ? listByCategory('pousadas', { city_id: city.id, sort: 'rating', limit: 6 })
      : Promise.resolve([]),
    tourismEnabled && city ? listAttractions({ city_id: city.id, limit: 3 }) : Promise.resolve([]),
    tourismEnabled && city ? listTourPackages({ city_id: city.id, limit: 2 }) : Promise.resolve([]),
    tourismEnabled && city ? listGuides({ city_id: city.id, limit: 3 }) : Promise.resolve([]),
    city ? getWeatherForHome(city) : Promise.resolve(null),
    utilitiesEnabled && city ? listActiveAlerts({ city_id: city.id }) : Promise.resolve([]),
    utilitiesEnabled && city ? getPharmacyOnDuty({ city_id: city.id }) : Promise.resolve([]),
    utilitiesEnabled && city ? listEmergencyContacts({ city_id: city.id }) : Promise.resolve([]),
    communityEnabled ? listChurches() : Promise.resolve([]),
    communityEnabled ? listChurchSchedule() : Promise.resolve([]),
    transparencyEnabled && city ? getTransparencySnapshot(city.id) : Promise.resolve(null),
    businessesEnabled && city
      ? listCityPromotions({ city_id: city.id, limit: 8 })
      : Promise.resolve([]),
  ]);

  const todayKey = getTodayKey();
  const todayChurchSchedule = churchSchedule
    .filter((item) => item.weekday === todayKey)
    .slice(0, 3);
  const featuredChurches = churches.slice(0, 2);
  const alert = alerts[0];
  const firstContact = contacts[0];
  const dutyPharmacy = dutyPharmacies[0];

  return (
    <AppFrame>
      <BusinessPromoHero />

      <Divider />

      <SectionHeader title="Categorias" />
      <HScroll className="px-3.5">
        <RoundCat label="Lixo" icon={Trash2} bg="clay" href="/servicos/coleta" />
        <RoundCat label="Saúde" icon={HeartPulse} bg="cerrado" href="/servicos/saude" />
        <RoundCat label="Telefones" icon={PhoneCall} bg="sky" href="/servicos/telefones" />
        <RoundCat label="Clima" icon={CloudSun} bg="sky" href="/servicos/clima" />
        <RoundCat label="Igrejas" icon={Church} bg="paper-deep" href="/comunidade/igrejas" />
        <RoundCat label="Assistente" icon={MessageCircleQuestion} bg="sky" href="/assistente" />
        <RoundCat label="Transparência" icon={Landmark} bg="sky" href="/transparencia" />
        <RoundCat label="Energia" icon={Zap} bg="sun" href="/servicos/energia" />
        <RoundCat label="Água" icon={Droplet} bg="paper-deep" href="/servicos/agua" />
        <RoundCat label="Guias" icon={BookOpen} bg="cerrado" href="/turismo/guias" />
        <RoundCat label="Pesca" icon={Fish} bg="cerrado" href="/turismo/pesca" />
        <RoundCat label="Comércio" icon={Store} bg="clay" href="/comercio" />
        <RoundCat label="Imóveis" icon={House} bg="sky" href="/imoveis" />
        <RoundCat label="Eventos" icon={CalendarDays} bg="sun" href="/agenda" />
      </HScroll>

      <Divider />
      <SectionHeader title="Novidades no Portal Carmelitano" kicker="Últimas funções" />
      <Band className="grid grid-cols-2 gap-2.5 px-3.5 pb-3">
        {latestFeatures.map((feature) => {
          const Icon = feature.icon;

          return (
            <Link
              key={feature.href}
              href={feature.href}
              className="rounded-xs border-ink-100 shadow-card border bg-white p-3 hover:no-underline"
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${feature.bg} ${feature.fg}`}
              >
                <Icon size={19} strokeWidth={2.1} aria-hidden="true" />
              </div>
              <h2 className="text-ink-900 m-0 text-[14px] font-extrabold leading-snug">
                {feature.title}
              </h2>
              <p className="text-ink-600 m-0 mt-1 text-[12px] leading-snug">{feature.text}</p>
            </Link>
          );
        })}
      </Band>

      {businessesEnabled ? (
        <>
          <Divider />
          <SectionHeader
            title="Negócios em destaque"
            kicker="Plano de destaque ativo"
            action={
              featuredBusinesses.length > 0
                ? { label: 'Ver tudo', href: '/comercio/buscar?sort=featured' }
                : { label: 'Ser parceiro', href: '/comercio/cadastro' }
            }
          />
          {featuredBusinesses.length > 0 ? (
            <HScroll>
              {featuredBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </HScroll>
          ) : (
            <Band className="px-3.5 pb-3">
              <EmptyCta
                icon={Store}
                tone="clay"
                title="Seu negócio pode aparecer aqui"
                description="Planos de destaque ativos ganham vitrine logo no começo da home."
                cta="Cadastrar meu negócio"
                href="/comercio/cadastro"
              />
            </Band>
          )}
        </>
      ) : null}

      {city && tourismEnabled ? (
        <>
          <Divider />
          <TourismGatewayWidget
            cityName={city.name}
            attractions={tourismAttractions}
            packages={tourismPackages}
            guides={tourismGuides}
          />
        </>
      ) : null}

      {city && tourismEnabled ? (
        <>
          <Divider />
          <HomeLodgingMapWidget cityName={city.name} lodgings={lodgingBusinesses} />
        </>
      ) : null}

      <AssistantCtaBlock
        config={{ href: '/assistente', questions: assistantQuestions }}
        title={null}
        cityName={city?.name}
      />

      <Divider />

      <SectionHeader
        title="Ofertas dos parceiros"
        action={
          cityPromotions.length > 0
            ? { label: 'Ver tudo', href: '/comercio?promo=1' }
            : { label: 'Ser parceiro', href: '/comercio/cadastro' }
        }
      />
      {cityPromotions.length > 0 ? (
        <HScroll>
          {cityPromotions.map((promo) => (
            <Link
              key={promo.id}
              href={`/comercio/negocio/${promo.businessSlug}`}
              className="hover:no-underline"
            >
              <CupomCard
                brand={promo.businessName}
                off={
                  promo.discountPercent !== null && promo.discountPercent > 0
                    ? `${promo.discountPercent}%`
                    : promo.title
                }
                illo={promotionIlloFor(promo)}
              />
            </Link>
          ))}
        </HScroll>
      ) : (
        <Band className="px-3.5 pb-3">
          <EmptyCta
            icon={Tag}
            tone="clay"
            title="Sua promoção pode aparecer aqui"
            description="Comércios cadastrados publicam cupons e descontos pra moradores e turistas verem na home."
            cta="Cadastrar meu comércio · 1 mês grátis"
            href="/comercio/cadastro"
          />
        </Band>
      )}

      <Divider />

      <SectionHeader title="Aproveite a cidade" />
      <HScroll>
        <TileCard
          title="Coleta na sua rua"
          subtitle="Ver calendário do bairro"
          illo="🗑ï¸"
          href="/servicos/coleta"
        />
        <TileCard
          title="Farmácia hoje"
          subtitle={dutyPharmacy ? `${dutyPharmacy.name} de plantão` : 'Escala em atualização'}
          illo="💊"
          href="/servicos/farmacias"
        />
        <TileCard
          title="Eventos do fim de semana"
          subtitle="Agenda da cidade"
          illo="🎉"
          href="/agenda"
        />
        <TileCard
          title="Igrejas da cidade"
          subtitle={`${churches.length || 'Novas'} páginas no guia`}
          illo="⛪"
          href="/comunidade/igrejas"
        />
      </HScroll>

      <Divider />

      <SectionHeader
        title="Pousadas em destaque"
        kicker="Furnas · Canastra"
        action={
          lodgingBusinesses.length > 0
            ? { label: 'Ver tudo', href: '/turismo/onde-ficar' }
            : { label: 'Cadastrar', href: '/comercio/cadastro' }
        }
      />
      {lodgingBusinesses.length > 0 ? (
        <HScroll>
          {lodgingBusinesses.map((lodging) => (
            <PousadaCard
              key={lodging.id}
              name={lodging.name}
              dist={lodgingDistanceLabel(lodging)}
              rating={lodging.rating}
              tags={formatLodgingAmenities(lodging.amenities)}
              photo={lodging.coverUrl}
              illo={lodging.coverUrl ? undefined : '🏞️'}
              href={`/comercio/negocio/${lodging.slug}`}
            />
          ))}
        </HScroll>
      ) : (
        <Band className="px-3.5 pb-3">
          <EmptyCta
            icon={BedDouble}
            tone="cerrado"
            title="Sua pousada no Portal Carmelitano"
            description="Apareça pra quem busca onde ficar em Carmo e na região de Furnas. Ficha completa com fotos, preço e mapa."
            cta="Cadastrar minha pousada · 1 mês grátis"
            href="/comercio/cadastro"
          />
        </Band>
      )}

      <Divider />

      <SectionHeader title="Serviços públicos" action={{ label: 'Ver tudo', href: '/servicos' }} />
      <Band variant="paper-card">
        <ListItem
          icon={Trash2}
          iconBg="clay-50"
          iconFg="clay-600"
          title="Coleta de lixo"
          when="Veja o calendário por bairro"
          href="/servicos/coleta"
        />
        <ListItem
          icon={Pill}
          iconBg="cerrado-100"
          iconFg="cerrado-700"
          title="Farmácia de plantão"
          sub={dutyPharmacy ? dutyPharmacy.name : 'Escala aguardando atualização'}
          href="/servicos/farmacias"
        />
        <ListItem
          icon={Droplet}
          iconBg="sky-100"
          iconFg="sky-700"
          title={alert?.title ?? 'Alertas da cidade'}
          sub={alert?.affectedArea ?? 'Água, energia, clima e trânsito'}
          href="/servicos/alertas"
        />
        <ListItem
          icon={PhoneCall}
          iconBg="paper"
          title="Telefones úteis"
          sub={
            firstContact
              ? `${firstContact.name}: ${firstContact.shortDial ?? firstContact.phone}`
              : 'SAMU 192 · Bombeiros 193 · Defesa Civil 199'
          }
          href="/servicos/telefones"
          divider={false}
        />
      </Band>

      <Divider />

      <SectionHeader
        title="Igrejas e programação"
        kicker="Comunidade"
        action={{ label: 'Ver guia', href: '/comunidade/igrejas' }}
      />
      <Band variant="paper-card">
        {todayChurchSchedule.length > 0 ? (
          todayChurchSchedule.map((item, index) => (
            <ListItem
              key={item.id}
              icon={Church}
              iconBg={index === 0 ? 'cerrado-100' : 'paper'}
              iconFg={index === 0 ? 'cerrado-700' : 'ink-900'}
              title={`${item.time} · ${item.title}`}
              sub={`${weekdayShortLabels[item.weekday]} · ${getChurchNameBySlug(item.churchSlug)}`}
              href={`/comunidade/igrejas/${item.churchSlug}`}
              divider={index < todayChurchSchedule.length - 1 || featuredChurches.length > 0}
            />
          ))
        ) : (
          <ListItem
            icon={Church}
            iconBg="cerrado-100"
            iconFg="cerrado-700"
            title={`Sem horários publicados para ${weekdayLabels[todayKey]}`}
            sub="Abra o guia para ver a programação da semana."
            href="/comunidade/igrejas"
            divider={featuredChurches.length > 0}
          />
        )}
        {featuredChurches.map((church, index) => (
          <ListItem
            key={church.id}
            icon={Church}
            iconBg="paper"
            title={church.name}
            sub={
              church.neighborhood
                ? `${church.neighborhood} · ${church.shortDescription}`
                : church.shortDescription
            }
            href={`/comunidade/igrejas/${church.slug}`}
            divider={index < featuredChurches.length - 1}
          />
        ))}
      </Band>

      <Divider />

      <SectionHeader
        title="Comércios locais"
        kicker="Comércio local"
        action={{ label: 'Guia completo', href: '/comercio' }}
      />
      <HScroll>
        {homeBusinesses.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </HScroll>

      <Divider />

      {transparencySnapshot && city ? (
        <>
          <SectionHeader
            title="Transparência em destaque"
            kicker="Transparência"
            action={{ label: 'Abrir', href: '/transparencia' }}
          />
          <Band className="px-3.5 pb-3">
            <TransparencyPulseWidget snapshot={transparencySnapshot} cityName={city.name} />
          </Band>
          <Divider />
        </>
      ) : null}

      <SectionHeader
        title="Comunidade"
        kicker="Perto de você"
        action={{ label: 'Abrir comunidade', href: '/comunidade' }}
      />
      <Band className="grid grid-cols-1 gap-2.5 px-3.5 pb-3 md:grid-cols-2">
        <EmptyCta
          icon={Calendar}
          tone="sun"
          title="Tem um evento pra divulgar?"
          description="Festas, feiras, encontros e shows da cidade aparecem na agenda pública."
          cta="Abrir agenda"
          href="/comunidade/agenda"
        />
        <EmptyCta
          icon={Tag}
          tone="clay"
          title="Achados e perdidos"
          description="Mural para reunir quem perdeu e quem encontrou itens, documentos e objetos."
          cta="Ver mural"
          href="/comunidade/achados"
        />
        <EmptyCta
          icon={Users}
          tone="cerrado"
          title="Grupos e coletivos"
          description="Associações, ONGs, esportes, clubes, grupos de bairro e iniciativas locais."
          cta="Ver grupos"
          href="/comunidade/grupos"
        />
        <EmptyCta
          icon={Church}
          tone="sky"
          title="Sua igreja já está aqui?"
          description="Horários de missa, culto e encontros. Se faltar a sua, manda mensagem que cadastramos."
          cta="Ver guia de igrejas"
          href="/comunidade/igrejas"
        />
      </Band>

      <Divider />

      <SectionHeader title="Resumo semanal" kicker="Newsletter" />
      <Band variant="paper-card" className="px-4 py-5">
        <p className="text-ink-600 mb-3 text-sm">
          Receba os principais destaques da cidade por email. Confirmação obrigatória.
        </p>
        <NewsletterCTA citySlug={city?.slug ?? 'carmo-do-rio-claro'} source="home" />
      </Band>

      <Divider />

      {city && weather ? (
        <>
          <WeatherWidget cityName={city.name} weather={weather} />
          <Divider />
        </>
      ) : null}

    </AppFrame>
  );
}
