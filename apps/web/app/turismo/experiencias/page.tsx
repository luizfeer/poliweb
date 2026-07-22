import { Link } from '@/components/navigation/link';
import { Camera, Clock, MapPin, Star } from 'lucide-react';
import {
  AppFrame,
  AppHeader,
  Band,
  Divider,
  Pill,
  SectionHeader,
  TabBar,
} from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

type ExperienceRow = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photo_url: string | null;
  reply_owner: string | null;
  reply_at: string | null;
  created_at: string | null;
  attractions?: {
    slug: string;
    name: string;
    type: string | null;
  } | null;
};

const ATTRACTION_FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'cachoeira', label: 'Cachoeiras' },
  { id: 'mirante', label: 'Mirantes' },
  { id: 'lago', label: 'Lago de Furnas' },
  { id: 'trilha', label: 'Trilhas' },
  { id: 'museu', label: 'Cultura' },
];

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export const metadata = {
  title: 'Experiências - Portal Carmelitano',
  description: 'Relatos publicados por visitantes das atrações turísticas de Carmo do Rio Claro.',
};

export default async function ExperienciasPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  if (!city.modules.includes('tourism')) {
    return (
      <AppFrame>
        <AppHeader chips={['Turismo']} />
        <TourismAdminEditBar href="/painel/cidade/turismo/aprovacoes" />
        <Band className="px-3.5 py-5">
          <h1 className="font-display m-0 text-[28px] font-extrabold">Experiências</h1>
          <p className="text-ink-700 m-0 mt-2 rounded-md border bg-white p-4 text-[14px]">
            O módulo de turismo ainda não está ativo nesta cidade.
          </p>
        </Band>
      </AppFrame>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('attraction_reviews')
    .select(
      'id, rating, title, comment, photo_url, reply_owner, reply_at, created_at, attractions!inner(slug, name, type)',
    )
    .eq('city_id', city.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30);

  const experiences = ((data ?? []) as unknown as ExperienceRow[]).filter(
    (item) => item.attractions,
  );

  return (
    <AppFrame>
      <AppHeader chips={['Experiências', 'Avaliações', 'Fotos']} />
      <TourismAdminEditBar href="/painel/cidade/turismo/aprovacoes" />

      <PublicHero
        icon={Camera}
        kicker="Comunidade viajante"
        title="Experiências em Carmo do Rio Claro"
        description="Relatos publicados por visitantes ajudam a entender acesso, estrutura, tempo de visita e melhores horários antes de montar o roteiro."
        tone="green"
        action={
          <Link
            href="/turismo/o-que-fazer"
            className="bg-ink-900 inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-[13px] font-extrabold text-white no-underline"
          >
            <Camera className="h-4 w-4" /> Avaliar uma atração
          </Link>
        }
        meta={<PublicHeroPill tone="green">{experiences.length} relatos</PublicHeroPill>}
      />

      <Divider />

      <Band className="px-3.5 py-4">
        <SectionHeader title="Filtrar por tipo" />
        <div className="mt-2 flex flex-wrap gap-2">
          {ATTRACTION_FILTERS.map((filter, index) => (
            <Link
              key={filter.id}
              href={
                filter.id === 'todas'
                  ? '/turismo/o-que-fazer'
                  : `/turismo/o-que-fazer?tipo=${filter.id}`
              }
              className="no-underline"
            >
              <Pill active={index === 0} label={filter.label} />
            </Link>
          ))}
        </div>
      </Band>

      <Band className="space-y-3 px-3.5 py-4">
        <SectionHeader
          title="Relatos publicados"
          kicker={`${experiences.length} ${experiences.length === 1 ? 'avaliação aprovada' : 'avaliações aprovadas'}`}
        />
        {experiences.length > 0 ? (
          experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))
        ) : (
          <EmptyExperiences />
        )}
      </Band>

      <TabBar active="home" />
    </AppFrame>
  );
}

function ExperienceCard({ experience }: { experience: ExperienceRow }) {
  const attraction = experience.attractions;
  const publishedAt = experience.created_at
    ? dateFormatter.format(new Date(experience.created_at))
    : 'data não informada';

  return (
    <article className="border-ink-100 shadow-card rounded-lg border bg-white p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-brand-100 text-brand-700 flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold">
            V
          </div>
          <div>
            <p className="text-ink-900 m-0 text-[14px] font-semibold">Visitante verificado</p>
            <p className="text-ink-600 m-0 text-[12px]">
              <Clock className="-mt-0.5 mr-1 inline h-3 w-3" /> Publicado em {publishedAt}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">
          Aprovado
        </span>
      </header>

      {attraction ? (
        <Link
          href={`/turismo/o-que-fazer/${attraction.slug}`}
          className="text-brand-700 mt-3 inline-flex items-center gap-1 text-[12px] font-bold no-underline"
        >
          <MapPin className="h-3.5 w-3.5" /> {attraction.name}
          {attraction.type ? ` · ${formatType(attraction.type)}` : ''}
        </Link>
      ) : null}

      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < experience.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'
            }`}
          />
        ))}
      </div>

      <h3 className="text-ink-900 mt-2 text-[15px] font-extrabold">
        {experience.title ?? 'Relato de visita'}
      </h3>
      {experience.comment ? (
        <p className="text-ink-700 m-0 mt-1 text-[13px] leading-relaxed">{experience.comment}</p>
      ) : null}

      {experience.photo_url ? (
        <div
          className="mt-3 aspect-[4/3] rounded-md bg-cover bg-center"
          style={{ backgroundImage: `url(${experience.photo_url})` }}
        />
      ) : null}

      {experience.reply_owner ? (
        <footer className="bg-paper text-ink-700 mt-3 rounded-md p-3 text-[12px]">
          <strong className="text-ink-900">Resposta do responsável:</strong>{' '}
          {experience.reply_owner}
        </footer>
      ) : null}
    </article>
  );
}

function EmptyExperiences() {
  return (
    <div className="border-ink-200 rounded-lg border border-dashed bg-white p-4">
      <h2 className="text-ink-900 m-0 text-[16px] font-extrabold">
        Ainda não há relatos publicados.
      </h2>
      <p className="text-ink-700 m-0 mt-2 text-[13px] leading-relaxed">
        As primeiras avaliações aprovadas das atrações de Carmo aparecerão aqui. Para contribuir,
        abra uma atração e envie sua avaliação pela ficha pública.
      </p>
      <Link
        href="/turismo/o-que-fazer"
        className="bg-ink-900 mt-3 inline-flex rounded-full px-4 py-2 text-[13px] font-bold text-white no-underline"
      >
        Ver atrações
      </Link>
    </div>
  );
}

function formatType(type: string) {
  return type.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}
