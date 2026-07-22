import {
  Anchor,
  BadgeCheck,
  ExternalLink,
  Fish,
  LifeBuoy,
  MapPin,
  Route,
  ShieldAlert,
} from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, TabBar } from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { FishingGuideCard } from '@/components/public/tourism/fishing-guide-card';
import { FishingSpotCard } from '@/components/public/tourism/fishing-spot-card';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import {
  pescaCarmoRioClaroSeed,
  type PescaFishInfo,
  type PescaSpotInfo,
} from '@/lib/tourism/fishing-info';
import { listFishingGuides, listFishingSpots } from '@/lib/tourism';

export const metadata = {
  title: pescaCarmoRioClaroSeed.seo.title,
  description: pescaCarmoRioClaroSeed.seo.description,
  keywords: pescaCarmoRioClaroSeed.seo.keywords,
};

export default async function PescaPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const [spots, guides] = await Promise.all([
    listFishingSpots({ city_id: city.id }),
    listFishingGuides({ city_id: city.id }),
  ]);

  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Tucunaré', 'Furnas', 'Guias', 'Piracema']} />
      <TourismAdminEditBar href="/painel/cidade/turismo/pesca" />

      <PublicHero
        icon={Fish}
        kicker={pescaCarmoRioClaroSeed.hero.eyebrow}
        title={pescaCarmoRioClaroSeed.hero.title}
        description={pescaCarmoRioClaroSeed.hero.description}
        tone="green"
        meta={
          <>
            <PublicHeroPill tone="green">{pescaCarmoRioClaroSeed.region}</PublicHeroPill>
            <PublicHeroPill tone="paper">{pescaCarmoRioClaroSeed.city}</PublicHeroPill>
            <PublicHeroPill tone="sun">
              Verificado em {formatDate(pescaCarmoRioClaroSeed.lastVerifiedAt)}
            </PublicHeroPill>
          </>
        }
      />

      <Band className="px-3.5 pb-4 md:px-6 lg:px-8">
        <section className="border-sun-100 bg-sun-100/75 text-ink-800 shadow-card rounded-2xl border p-4 text-[13px] font-semibold leading-relaxed">
          <ShieldAlert className="text-clay-700 mr-2 inline-block" size={18} aria-hidden="true" />
          Consulte licena, regras do IEF e perodo de piracema antes de sair para pescar.
        </section>
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle
          eyebrow={pescaCarmoRioClaroSeed.category}
          title={pescaCarmoRioClaroSeed.overview.title}
        />
        <p className="text-ink-700 m-0 text-[14px] leading-relaxed md:text-[15px]">
          {pescaCarmoRioClaroSeed.overview.content}
        </p>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Pontos e roteiros" title="Onde a pesca aparece na região" />
        <div className="grid gap-3 md:grid-cols-2">
          {pescaCarmoRioClaroSeed.mainSpots.map((spot) => (
            <FishingInfoSpotCard key={spot.slug} spot={spot} />
          ))}
        </div>
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Peixes comuns" title="Espécies citadas por pescadores" />
        <div className="grid gap-2 md:grid-cols-2">
          {pescaCarmoRioClaroSeed.fishGuide.map((fish) => (
            <FishCard key={fish.name} fish={fish} />
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Regras e segurança"
          title={pescaCarmoRioClaroSeed.rulesAndSafety.title}
        />
        <p className="text-ink-700 m-0 text-[14px] leading-relaxed">
          {pescaCarmoRioClaroSeed.rulesAndSafety.intro}
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {pescaCarmoRioClaroSeed.rulesAndSafety.items.map((item) => (
            <article
              key={item.title}
              className="border-sun-100 bg-sun-100 text-ink-900 shadow-card rounded-lg border p-3"
            >
              <h3 className="m-0 flex items-center gap-2 font-sans text-[15px] font-extrabold">
                <LifeBuoy size={17} aria-hidden="true" />
                {item.title}
              </h3>
              <p className="m-0 mt-1 text-[13px] font-medium leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Boas práticas" title="Pesca responsável em Furnas" />
        <div className="grid gap-2 md:grid-cols-2">
          {pescaCarmoRioClaroSeed.bestPractices.map((item) => (
            <article
              key={item.title}
              className="border-ink-100 shadow-card rounded-lg border bg-white p-3"
            >
              <h3 className="text-ink-900 m-0 flex items-center gap-2 font-sans text-[15px] font-extrabold">
                <BadgeCheck size={17} className="text-cerrado-700" aria-hidden="true" />
                {item.title}
              </h3>
              <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Guia rápido" title="Como aproveitar melhor a pescaria" />
        <div className="space-y-2">
          {pescaCarmoRioClaroSeed.contentSections.map((section) => (
            <article
              key={section.id}
              className="border-ink-100 shadow-card rounded-lg border bg-white p-3"
            >
              <h3 className="text-ink-900 m-0 font-sans text-[16px] font-extrabold">
                {section.title}
              </h3>
              <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Pontos cadastrados" title="Pontos verificados no portal" />
        {spots.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {spots.map((item) => (
              <FishingSpotCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyFishingList text="Ainda não há pontos publicados. A curadoria pode cadastrar pontos no painel da cidade." />
        )}
      </Band>

      <Divider />
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Guias e barqueiros" title="Guias de pesca publicados" />
        {guides.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {guides.map((item) => (
              <FishingGuideCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyFishingList text="Ainda não há guias publicados. Guias, barqueiros e pousadas podem ser cadastrados e verificados." />
        )}
      </Band>

      <Divider />
      <Band variant="paper-card" className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <SectionTitle eyebrow="Perguntas frequentes" title="Dúvidas rápidas" />
        <div className="space-y-2">
          {pescaCarmoRioClaroSeed.faq.map((item) => (
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
      <Band className="space-y-3 px-3.5 py-4 md:px-6 lg:px-8">
        <section className="border-cerrado-100 bg-cerrado-100 text-ink-900 shadow-card rounded-2xl border p-4">
          <p className="text-cerrado-700 m-0 text-[12px] font-bold uppercase">Comunidade</p>
          <h2 className="m-0 mt-1 font-sans text-[22px] font-extrabold">
            {pescaCarmoRioClaroSeed.callToAction.title}
          </h2>
          <p className="text-ink-700 m-0 mt-2 text-[14px] leading-relaxed">
            {pescaCarmoRioClaroSeed.callToAction.description}
          </p>
          <a
            href="/contato?tipo=pesca&pagina=%2Fturismo%2Fpesca&assunto=Pesca"
            className="bg-ink-900 mt-4 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
          >
            <Route size={17} aria-hidden="true" />
            {pescaCarmoRioClaroSeed.callToAction.buttonLabel}
          </a>
        </section>
      </Band>

      <Divider />
      <Band
        variant="paper-deep"
        className="text-ink-600 px-3.5 py-4 text-[12px] leading-relaxed md:px-6 lg:px-8"
      >
        <p className="m-0">
          Verificado em {formatDate(pescaCarmoRioClaroSeed.lastVerifiedAt)}. Este guia é educativo e
          turístico. Regras ambientais podem mudar por portaria; confirme sempre nos canais oficiais
          antes de pescar.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {pescaCarmoRioClaroSeed.sourcesToCheck.map((source) => (
            <article key={source.name} className="border-ink-100 rounded-md border bg-white p-2">
              <p className="text-ink-900 m-0 font-bold">{source.name}</p>
              <p className="text-ink-600 m-0 mt-1">{source.reason}</p>
            </article>
          ))}
        </div>
        <a
          href="https://www.mg.gov.br/servico/obter-licenca-para-pesca-amadora"
          target="_blank"
          rel="noreferrer"
          className="text-clay-700 mt-3 inline-flex items-center gap-1.5 font-bold underline"
        >
          Ver licença de pesca amadora no Portal MG
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </Band>

      <TabBar active="home" />
    </AppFrame>
  );
}

function FishingInfoSpotCard({ spot }: { spot: PescaSpotInfo }) {
  return (
    <article className="border-ink-100 shadow-card rounded-lg border bg-white p-3">
      <p className="m-0 flex items-center gap-1.5 text-[12px] font-bold uppercase text-sky-700">
        <MapPin size={15} aria-hidden="true" />
        {spot.city}
      </p>
      <h3 className="text-ink-900 m-0 mt-1 font-sans text-[17px] font-extrabold leading-tight">
        {spot.name}
      </h3>
      <p className="text-ink-700 m-0 mt-2 text-[13px] leading-relaxed">{spot.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {spot.commonFish.map((fish) => (
          <span
            key={fish}
            className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-700"
          >
            {fish}
          </span>
        ))}
      </div>
      <ul className="text-ink-700 m-0 mt-3 space-y-1 pl-5 text-[13px] leading-relaxed">
        {spot.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      {'caution' in spot && spot.caution ? (
        <p className="bg-sun-100 text-ink-800 m-0 mt-3 rounded-md p-2 text-[12px] font-semibold leading-relaxed">
          {spot.caution}
        </p>
      ) : null}
    </article>
  );
}

function FishCard({ fish }: { fish: PescaFishInfo }) {
  return (
    <article className="border-ink-100 shadow-card rounded-lg border bg-white p-3">
      <h3 className="text-ink-900 m-0 flex items-center gap-2 font-sans text-[16px] font-extrabold">
        <Anchor size={17} className="text-cerrado-700" aria-hidden="true" />
        {fish.name}
      </h3>
      <p className="text-cerrado-700 m-0 mt-1 text-[12px] font-bold uppercase">{fish.type}</p>
      <p className="text-ink-700 m-0 mt-2 text-[13px] leading-relaxed">{fish.description}</p>
      <p className="text-ink-600 m-0 mt-3 text-[12px] font-semibold leading-relaxed">
        Iscas: {fish.baitTips.join(', ')}.
      </p>
      <p className="bg-paper text-ink-700 m-0 mt-2 rounded-md p-2 text-[12px] font-semibold leading-relaxed">
        {fish.note}
      </p>
    </article>
  );
}

function EmptyFishingList({ text }: { text: string }) {
  return (
    <div className="border-ink-300 text-ink-600 rounded-lg border border-dashed bg-white p-4 text-[13px] font-semibold leading-relaxed">
      {text}
    </div>
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
