import { Link } from '@/components/navigation/link';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock, Compass, ExternalLink, MapPinned, ShieldCheck } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, Pill, TabBar } from '@/components/carmo';
import { TourismAdminEditLink } from '@/components/public/tourism/tourism-admin-edit-link';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { getCurrentCity } from '@/lib/cities';
import { getTourPackageBySlug, listAttractions } from '@/lib/tourism';
import type { Attraction } from '@/lib/tourism';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { breadcrumbJsonLd, touristTripJsonLd } from '@/lib/seo/structured-data';

type PageProps = { params: Promise<{ slug: string }> };

type StopRecord = {
  attraction_id?: string;
  business_id?: string;
  custom_title?: string;
  duration_minutes?: number;
  notes?: string;
};

function asStop(stop: unknown): StopRecord {
  if (!stop || typeof stop !== 'object' || Array.isArray(stop)) return {};
  const record = stop as Record<string, unknown>;
  return {
    attraction_id: typeof record.attraction_id === 'string' ? record.attraction_id : undefined,
    business_id: typeof record.business_id === 'string' ? record.business_id : undefined,
    custom_title: typeof record.custom_title === 'string' ? record.custom_title : undefined,
    duration_minutes:
      typeof record.duration_minutes === 'number' ? record.duration_minutes : undefined,
    notes: typeof record.notes === 'string' ? record.notes : undefined,
  };
}

function stopTitle(stop: StopRecord, index: number, attraction?: Attraction) {
  return stop.custom_title || attraction?.name || `Parada ${index + 1}`;
}

function formatStopDuration(minutes?: number) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = await getCurrentCity();
  if (!city) return { title: 'Roteiro' };
  const { slug } = await params;
  const item = await getTourPackageBySlug({ city_id: city.id, slug });
  if (!item) return { title: 'Roteiro não encontrado' };
  return buildMetadata({
    title: `${item.title} — Roteiro turístico em Carmo do Rio Claro/MG`,
    description:
      item.description ??
      `${item.title}: roteiro turístico na região de Furnas e Canastra. Veja paradas, duração e como reservar no Portal Carmelitano.`,
    path: `/turismo/roteiros/${slug}`,
    image: item.coverUrl ?? undefined,
    type: 'article',
  });
}

export default async function RoteiroDetailPage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  const { slug } = await params;

  const [item, attractions] = await Promise.all([
    getTourPackageBySlug({ city_id: city.id, slug }),
    listAttractions({ city_id: city.id, limit: 100 }),
  ]);
  if (!item) notFound();

  const attractionById = new Map(attractions.map((attraction) => [attraction.id, attraction]));
  const stops = item.itinerary.map(asStop);

  const site = resolvePublicSiteOrigin();
  const url = `${site}/turismo/roteiros/${slug}`;

  return (
    <>
      <JsonLdScript
        data={touristTripJsonLd({
          name: item.title,
          url,
          description: item.description,
          image: item.coverUrl,
          price: item.price,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: 'Início', url: site },
          { name: 'Turismo', url: `${site}/turismo` },
          { name: 'Roteiros', url: `${site}/turismo/roteiros` },
          { name: item.title, url },
        ])}
      />
    <AppFrame>
      <AppHeader chips={['Roteiro', item.difficulty ?? 'Livre']} />

      <Band className="px-3.5 py-4">
        <div className="mb-3 flex justify-end">
          <TourismAdminEditLink href={`/painel/cidade/turismo/pacotes?edit=${item.id}`} />
        </div>
        <section className="border-cerrado-100 shadow-card overflow-hidden rounded-lg border bg-white">
          <div className="bg-cerrado-700 p-5 text-white">
            <p className="text-sun-200 m-0 text-[12px] font-bold uppercase tracking-wide">
              Roteiro curado
            </p>
            <h1 className="font-display m-0 mt-2 text-[30px] font-extrabold leading-tight">
              {item.title}
            </h1>
            <p className="text-white/84 m-0 mt-3 text-[14px] leading-relaxed">{item.description}</p>
          </div>
          <div className="divide-ink-100 grid grid-cols-3 gap-0 divide-x">
            <Metric
              icon={<Clock className="h-4 w-4" />}
              value={`${item.totalDurationHours ?? item.durationHours ?? '-'}h`}
              label="duração"
            />
            <Metric
              icon={<Compass className="h-4 w-4" />}
              value={item.difficulty ?? 'Livre'}
              label="nível"
            />
            <Metric
              icon={<MapPinned className="h-4 w-4" />}
              value={item.totalDistanceKm ? `${item.totalDistanceKm} km` : '-'}
              label="distância"
            />
          </div>
        </section>
      </Band>

      <Divider />

      {item.includes.length > 0 ? (
        <Band className="px-3.5 py-3">
          <div className="flex flex-wrap gap-2">
            {item.includes.map((include) => (
              <Pill key={include} label={include} />
            ))}
          </div>
        </Band>
      ) : null}

      <Band className="space-y-3 px-3.5 py-4">
        <h2 className="m-0 text-[18px] font-bold">Linha do tempo</h2>
        {stops.length > 0 ? (
          stops.map((stop, index) => {
            const attraction = stop.attraction_id
              ? attractionById.get(stop.attraction_id)
              : undefined;
            const duration = formatStopDuration(stop.duration_minutes);
            return (
              <article
                key={`${index}-${stop.custom_title ?? stop.attraction_id ?? 'stop'}`}
                className="border-ink-100 shadow-card rounded-lg border bg-white p-4 text-[13px]"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-clay-50 text-clay-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-ink-900 text-[15px]">
                        {stopTitle(stop, index, attraction)}
                      </strong>
                      {duration ? (
                        <span className="bg-paper text-ink-600 rounded-full px-2 py-1 text-[11px] font-bold">
                          {duration}
                        </span>
                      ) : null}
                    </div>
                    {stop.notes ? (
                      <p className="text-ink-700 m-0 mt-1 leading-relaxed">{stop.notes}</p>
                    ) : null}
                    {attraction ? (
                      <Link
                        href={`/turismo/o-que-fazer/${attraction.slug}`}
                        className="text-brand-700 mt-3 inline-flex items-center gap-1 text-[12px] font-bold no-underline"
                      >
                        Abrir atração <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-ink-700 m-0 rounded-xl bg-white p-4 text-[13px]">
            Roteiro em curadoria.
          </p>
        )}
      </Band>

      <Divider />

      <Band className="px-3.5 py-4">
        <div className="border-ink-100 rounded-lg border bg-white p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-cerrado-700 mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-ink-900 m-0 text-[15px] font-extrabold">Dados conferidos</h2>
              <p className="text-ink-700 m-0 mt-1 text-[12px] leading-relaxed">
                Conteúdo baseado em informações públicas da Prefeitura de Carmo do Rio Claro, Minas
                Gerais Turismo e planejamento turístico local. Confirme horários, acessos e
                operadores antes da visita.
              </p>
            </div>
          </div>
        </div>
      </Band>

      <TabBar active="home" />
    </AppFrame>
    </>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white p-3 text-center">
      <div className="text-clay-600 flex items-center justify-center gap-1">
        {icon}
        <strong className="text-ink-900 text-[14px]">{value}</strong>
      </div>
      <span className="text-ink-600 mt-1 block text-[11px] font-semibold">{label}</span>
    </div>
  );
}
