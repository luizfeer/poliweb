import Link from 'next/link';
import {
  BedDouble,
  BookOpen,
  Camera,
  Compass,
  Fish,
  Home,
  Landmark,
  Mountain,
  Sailboat,
  Utensils,
  UsersRound,
  Anchor,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, HScroll, SectionHeader } from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { AccommodationCard } from '@/components/public/tourism/accommodation-card';
import { AttractionCoverCard } from '@/components/public/tourism/attraction-card';
import { GuideCard } from '@/components/public/tourism/guide-card';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { listAccommodations, listAttractions, listGuides, listTourPackages } from '@/lib/tourism';

export const metadata = {
  title: 'Turismo - Portal Carmelitano',
  description:
    'Roteiros, Lago de Furnas, Serra da Tormenta, cachoeiras e cultura em Carmo do Rio Claro.',
};

export const revalidate = 60;

const PILLARS = [
  {
    href: '/turismo/o-que-fazer?tipo=trilha',
    title: 'Ecoturismo e aventura',
    text: 'Serra da Tormenta, trilhas, mirantes, voo livre e cachoeiras.',
    icon: Mountain,
  },
  {
    href: '/turismo/o-que-fazer?tipo=lago',
    title: 'Mar de Minas',
    text: 'Lago de Furnas, passeios náuticos, pesca e pôr do sol no Aterro.',
    icon: Sailboat,
  },
  {
    href: '/turismo/o-que-fazer?tipo=museu',
    title: 'História e arqueologia',
    text: 'MUARI, Igreja Matriz e memória indígena no centro da cidade.',
    icon: Landmark,
  },
  {
    href: '/turismo/roteiros',
    title: 'Sabores e artesanato',
    text: 'Doces, teares, cozinha mineira e compras em roteiros curados.',
    icon: Compass,
  },
];

const QUICK_LINKS = [
  { href: '/turismo/onde-ficar', title: 'Onde ficar', icon: BedDouble },
  { href: '/turismo/o-que-fazer', title: 'O que fazer', icon: Mountain },
  { href: '/turismo/onde-comer', title: 'Onde comer', icon: Utensils },
  { href: '/turismo/pesca', title: 'Pesca', icon: Fish },
  { href: '/balsas', title: 'Balsas', icon: Anchor },
  { href: '/turismo/guias', title: 'Guias', icon: BookOpen },
];

export default async function TurismoPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  if (!city.modules.includes('tourism')) {
    return (
      <AppFrame>
        <AppHeader chips={['Turismo']} />
        <TourismAdminEditBar href="/painel/cidade/turismo" />
        <Band className="px-3.5 py-5">
          <h1 className="font-display m-0 text-[28px] font-extrabold">Turismo</h1>
          <p className="text-ink-700 m-0 mt-2 rounded-md border bg-white p-4 text-[14px]">
            O módulo de turismo ainda não está ativo nesta cidade.
          </p>
        </Band>
      </AppFrame>
    );
  }

  const [attractions, accommodations, packages, guides] = await Promise.all([
    listAttractions({ city_id: city.id, limit: 6 }),
    listAccommodations({ city_id: city.id, limit: 6 }),
    listTourPackages({ city_id: city.id, limit: 3 }),
    listGuides({ city_id: city.id, limit: 6 }),
  ]);

  return (
    <AppFrame>
      <AppHeader chips={['Furnas', 'Serra', 'Cachoeiras', 'Cultura']} />
      <TourismAdminEditBar href="/painel/cidade/turismo" />

      <PublicHero
        icon={Compass}
        kicker="Portal turístico"
        title="Carmo do Rio Claro"
        description="Raízes mineiras no coração do Mar de Minas, com roteiros, pousadas, pesca, comida e cultura local."
        tone="green"
        action={
          <>
            <Link
              className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
              href="/turismo/roteiros"
            >
              <Compass className="h-4 w-4" /> Ver roteiros
            </Link>
            <Link
              className="border-cerrado-100 text-cerrado-700 inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-4 py-2 text-[13px] font-extrabold no-underline"
              href="/turismo/experiencias"
            >
              <Camera className="h-4 w-4" /> Experiências
            </Link>
          </>
        }
        meta={
          <>
            <PublicHeroPill tone="green">Furnas</PublicHeroPill>
            <PublicHeroPill tone="paper">Serra da Tormenta</PublicHeroPill>
          </>
        }
      />

      <Band className="grid grid-cols-2 gap-2 px-3.5 pb-3">
        <Link
          href="/"
          className="border-ink-100 text-ink-900 inline-flex items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-[13px] font-bold no-underline"
        >
          <Home className="text-clay-600 h-4 w-4" /> Início
        </Link>
        <Link
          href="/comunidade"
          className="border-ink-100 text-ink-900 inline-flex items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-[13px] font-bold no-underline"
        >
          <UsersRound className="text-cerrado-700 h-4 w-4" /> Comunidade
        </Link>
      </Band>

      <Band className="grid gap-3 px-3.5 py-3 sm:grid-cols-2">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Link
              key={pillar.href}
              href={pillar.href}
              className="border-ink-100 shadow-card rounded-md border bg-white p-3 no-underline"
            >
              <Icon size={22} className="text-clay-600" />
              <h2 className="text-ink-900 m-0 mt-3 font-sans text-[15px] font-extrabold">
                {pillar.title}
              </h2>
              <p className="text-ink-700 m-0 mt-1 text-[12px] leading-relaxed">{pillar.text}</p>
            </Link>
          );
        })}
      </Band>

      <Divider />

      <Band className="grid grid-cols-2 gap-3 px-3.5 py-3">
        {QUICK_LINKS.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.href}
              href={category.href}
              className="border-ink-100 rounded-md border bg-white p-3 no-underline"
            >
              <Icon size={24} className="text-clay-600" />
              <h2 className="text-ink-900 m-0 mt-3 font-sans text-[15px] font-extrabold">
                {category.title}
              </h2>
            </Link>
          );
        })}
      </Band>

      <Divider />
      <SectionHeader
        title="Atrações reais de Carmo"
        action={{ label: 'Ver tudo', href: '/turismo/o-que-fazer' }}
      />
      <HScroll>
        {attractions.slice(0, 4).map((item) => (
          <div key={item.id} className="w-[min(240px,78vw)] shrink-0">
            <AttractionCoverCard item={item} cityName={city.name} />
          </div>
        ))}
      </HScroll>

      <Divider />
      <SectionHeader
        title="Onde ficar"
        action={{ label: 'Ver tudo', href: '/turismo/onde-ficar' }}
      />
      <Band className="space-y-3 px-3.5 pb-3">
        {accommodations.length > 0 ? (
          accommodations.slice(0, 3).map((item) => <AccommodationCard key={item.id} item={item} />)
        ) : (
          <p className="border-ink-200 text-ink-700 m-0 rounded-md border border-dashed bg-white p-4 text-[13px]">
            Hospedagens locais entram aqui conforme forem cadastradas e verificadas.
          </p>
        )}
      </Band>

      {guides.length > 0 && (
        <>
          <Divider />
          <SectionHeader
            title="Guias e roteiros"
            kicker="Conheça a fundo"
            action={{ label: 'Ver todos', href: '/turismo/guias' }}
          />
          <Band className="space-y-2 px-3.5 pb-3">
            {guides.slice(0, 4).map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </Band>
        </>
      )}

      <Divider />
      <Band variant="paper-deep" className="px-3.5 py-4">
        <h2 className="m-0 font-sans text-[17px] font-extrabold">Roteiros curados</h2>
        <p className="text-ink-700 m-0 mt-1 text-[13px]">
          {packages[0]?.title ?? 'Roteiros de Carmo em atualização.'}
        </p>
        <Link
          className="bg-clay-500 mt-3 inline-block rounded-md px-4 py-2 text-[13px] font-bold text-white no-underline"
          href="/turismo/roteiros"
        >
          Ver roteiros
        </Link>
      </Band>
    </AppFrame>
  );
}
