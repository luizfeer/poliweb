import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import {
  CalendarDays,
  Church,
  HeartHandshake,
  Megaphone,
  Mountain,
  PawPrint,
  Search,
  Tag,
  UsersRound,
} from 'lucide-react';
import {
  AppFrame,
  AppHeader,
  Band,
  Divider,
  HScroll,
  ListItem,
  SectionHeader,
  TileCard,
} from '@/components/carmo';
import {
  ClassifiedCard,
  CommunityGroupCard,
  EventCard,
  LostAndFoundCard,
  ObituaryCard,
  PetCard,
} from '@/components/public/community/cards';
import { CommunityHero, CommunityPill } from '@/components/public/community/community-hero';
import { TourismGatewayWidget } from '@/components/public/tourism/tourism-gateway-widget';
import { getChurchNameBySlug, listChurches, listChurchSchedule } from '@/lib/churches';
import { getCurrentCity } from '@/lib/cities';
import {
  listClassifieds,
  listCommunityGroups,
  listEvents,
  listLostAndFound,
  listLostPets,
  listObituaries,
} from '@/lib/community/queries';
import { listAttractions, listTourPackages } from '@/lib/tourism';

export const metadata = {
  title: 'Comunidade - Portal Carmelitano',
  description: 'Agenda, classificados, pets, achados, igrejas e comunicados da comunidade local.',
};

export const revalidate = 60;

type Shortcut = {
  href: string;
  label: string;
  text: string;
  icon: typeof CalendarDays;
  tone: string;
};

const baseShortcuts: Shortcut[] = [
  {
    href: '/comunidade/agenda',
    label: 'Agenda',
    text: 'Eventos e encontros',
    icon: CalendarDays,
    tone: 'bg-clay-50 text-clay-700',
  },
  {
    href: '/comunidade/igrejas',
    label: 'Igrejas',
    text: 'Missas e cultos',
    icon: Church,
    tone: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    href: '/comunidade/classificados',
    label: 'Classificados',
    text: 'Venda, troca e serviços',
    icon: Tag,
    tone: 'bg-sun-100 text-ink-900',
  },
  {
    href: '/comunidade/pets',
    label: 'Pets',
    text: 'Perdidos e encontrados',
    icon: PawPrint,
    tone: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/comunidade/achados',
    label: 'Achados',
    text: 'Objetos e documentos',
    icon: Search,
    tone: 'bg-paper-deep text-ink-900',
  },
  {
    href: '/comunidade/obituarios',
    label: 'Obituários',
    text: 'Comunicados sensíveis',
    icon: HeartHandshake,
    tone: 'bg-white text-ink-900',
  },
  {
    href: '/comunidade/grupos',
    label: 'Grupos',
    text: 'Coletivos e WhatsApp',
    icon: UsersRound,
    tone: 'bg-sky-100 text-sky-700',
  },
];

const tourismShortcut: Shortcut = {
  href: '/turismo',
  label: 'Turismo',
  text: 'Atrações, roteiros e dicas',
  icon: Mountain,
  tone: 'bg-cerrado-50 text-cerrado-700',
};

export default async function ComunidadePage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  const [
    events,
    classifieds,
    pets,
    lostFound,
    obituaries,
    churches,
    churchSchedule,
    tourismAttractions,
    tourismPackages,
    groups,
  ] = await Promise.all([
    city.modules.includes('events')
      ? listEvents({ city_id: city.id, when: 'week', limit: 3 })
      : Promise.resolve([]),
    city.modules.includes('classifieds')
      ? listClassifieds({ city_id: city.id, limit: 3 })
      : Promise.resolve([]),
    listLostPets({ city_id: city.id }),
    listLostAndFound({ city_id: city.id }),
    listObituaries({ city_id: city.id, days: 30 }),
    listChurches(),
    listChurchSchedule(),
    city.modules.includes('tourism')
      ? listAttractions({ city_id: city.id, limit: 3 })
      : Promise.resolve([]),
    city.modules.includes('tourism')
      ? listTourPackages({ city_id: city.id, limit: 2 })
      : Promise.resolve([]),
    listCommunityGroups({ city_id: city.id, limit: 3 }),
  ]);

  const shortcuts = city.modules.includes('tourism')
    ? [...baseShortcuts, tourismShortcut]
    : baseShortcuts;

  const nextChurchItems = churchSchedule.slice(0, 3);
  const featuredChurch = churches[0];

  return (
    <AppFrame>
      <AppHeader chips={['Agenda', 'Igrejas', 'Pets', 'Achados']} />

      <CommunityHero
        icon={UsersRound}
        kicker={`${city.name}/${city.state}`}
        title="O mural vivo da cidade"
        description="Agenda, igrejas, achados, pets, classificados, grupos e comunicados em uma tela feita para abrir todo dia."
        tone="green"
        meta={
          <>
            <CommunityPill tone="green" icon={CalendarDays}>
              {events.length} eventos
            </CommunityPill>
            <CommunityPill tone="paper" icon={UsersRound}>
              {groups.length} grupos
            </CommunityPill>
            <CommunityPill tone="paper" icon={Search}>
              {pets.length + lostFound.length} avisos
            </CommunityPill>
          </>
        }
      />

      <Divider />

      <SectionHeader title="Atalhos da comunidade" />
      <Band className="grid grid-cols-2 gap-2.5 px-3.5 pb-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;

          return (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="border-ink-100 shadow-card hover:border-cerrado-100 group relative overflow-hidden rounded-2xl border bg-white p-4 hover:no-underline"
            >
              <Icon
                className="text-cerrado-700/10 pointer-events-none absolute -bottom-5 -right-5 h-20 w-20"
                aria-hidden="true"
              />
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-md ${shortcut.tone}`}
              >
                <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
              </div>
              <h2 className="text-ink-900 m-0 text-[15px] font-extrabold leading-tight">
                {shortcut.label}
              </h2>
              <p className="text-ink-600 m-0 mt-1 text-[12px] leading-snug">{shortcut.text}</p>
            </Link>
          );
        })}
      </Band>

      <Divider />

      <SectionHeader
        title="Grupos e coletivos"
        kicker="Novo diretorio"
        action={{ label: 'Ver tudo', href: '/comunidade/grupos' }}
      />
      <Band className="grid gap-3 px-3.5 pb-3 md:grid-cols-3">
        {groups.map((group) => (
          <CommunityGroupCard key={group.id} group={group} />
        ))}
      </Band>

      <Divider />

      <SectionHeader
        title="Igrejas e programação"
        kicker="Novo no guia"
        action={{ label: 'Ver tudo', href: '/comunidade/igrejas' }}
      />
      <Band variant="paper-card">
        {nextChurchItems.length > 0 ? (
          nextChurchItems.map((item, index) => (
            <ListItem
              key={item.id}
              icon={Church}
              iconBg={index === 0 ? 'cerrado-100' : 'paper'}
              iconFg={index === 0 ? 'cerrado-700' : 'ink-900'}
              title={`${item.time} · ${item.title}`}
              sub={getChurchNameBySlug(item.churchSlug)}
              href={`/comunidade/igrejas/${item.churchSlug}`}
              divider={index < nextChurchItems.length - 1 || Boolean(featuredChurch)}
            />
          ))
        ) : (
          <ListItem
            icon={Church}
            iconBg="cerrado-100"
            iconFg="cerrado-700"
            title="Programação aguardando confirmação"
            sub="Abra o guia para ver as igrejas cadastradas."
            href="/comunidade/igrejas"
            divider={Boolean(featuredChurch)}
          />
        )}
        {featuredChurch ? (
          <ListItem
            icon={Megaphone}
            iconBg="clay-50"
            iconFg="clay-600"
            title="Responsável por uma igreja?"
            sub={`A página de ${featuredChurch.name} já pode ser reivindicada.`}
            href={`/comunidade/igrejas/${featuredChurch.slug}`}
            divider={false}
          />
        ) : null}
      </Band>

      <Divider />

      <SectionHeader
        title="Hoje na comunidade"
        action={{ label: 'Agenda', href: '/comunidade/agenda' }}
      />
      <HScroll>
        <TileCard
          title="Postar evento"
          subtitle="Divulgue encontro, festa ou reunião"
          illo="📅"
          href="/comunidade/agenda/submeter"
        />
        <TileCard
          title="Achou alguma coisa?"
          subtitle="Ajude a devolver para o dono"
          illo="🔑"
          href="/comunidade/achados/postar"
        />
        <TileCard
          title="Pet perdido"
          subtitle="Publique um aviso rápido"
          illo="🐾"
          href="/comunidade/pets/postar"
        />
      </HScroll>

      <Divider />

      <SectionHeader
        title="Próximos eventos"
        action={{ label: 'Ver tudo', href: '/comunidade/agenda' }}
      />
      <Band className="space-y-3 px-3.5 pb-3">
        {events.length > 0 ? (
          events.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <EmptyLine text="Nada na agenda desta semana ainda." />
        )}
      </Band>

      <Divider />

      <SectionHeader
        title="Classificados recentes"
        action={{ label: 'Ver tudo', href: '/comunidade/classificados' }}
      />
      <Band className="space-y-3 px-3.5 pb-3">
        {classifieds.length > 0 ? (
          classifieds.map((classified) => (
            <ClassifiedCard key={classified.id} classified={classified} />
          ))
        ) : (
          <EmptyLine text="Nenhum classificado publicado por enquanto." />
        )}
      </Band>

      <Divider />

      <SectionHeader title="Pets, achados e avisos" />
      <Band className="space-y-3 px-3.5 pb-3">
        {pets.slice(0, 2).map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
        {lostFound.slice(0, 2).map((item) => (
          <LostAndFoundCard key={item.id} item={item} />
        ))}
        {pets.length === 0 && lostFound.length === 0 ? (
          <EmptyLine text="Sem avisos de pets ou achados agora." />
        ) : null}
      </Band>

      <Divider />

      <SectionHeader
        title="Obituários"
        action={{ label: 'Ver tudo', href: '/comunidade/obituarios' }}
      />
      <Band className="space-y-3 px-3.5 pb-3">
        {obituaries.length > 0 ? (
          obituaries
            .slice(0, 3)
            .map((obituary) => <ObituaryCard key={obituary.id} obituary={obituary} />)
        ) : (
          <EmptyLine text="Nenhum comunicado nos últimos 30 dias." />
        )}
      </Band>

      {city.modules.includes('tourism') ? (
        <>
          <Divider />
          <TourismGatewayWidget
            cityName={city.name}
            attractions={tourismAttractions}
            packages={tourismPackages}
            context="community"
          />
        </>
      ) : null}
    </AppFrame>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="border-ink-100 text-ink-600 m-0 rounded-md border bg-white p-3 text-[13px]">
      {text}
    </p>
  );
}
