import { Link } from '@/components/navigation/link';
import { Clock, Compass, MapPinned, Route, ShieldCheck } from 'lucide-react';
import { AppFrame, AppHeader, Band, Divider, Pill, TabBar } from '@/components/carmo';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import { TourismAdminEditBar } from '@/components/public/tourism/tourism-admin-edit-link';
import { getCurrentCity } from '@/lib/cities';
import { listTourPackages } from '@/lib/tourism';

export const metadata = {
  title: 'Roteiros de Carmo - Portal Carmelitano',
  description:
    'Roteiros reais de Carmo do Rio Claro com Lago de Furnas, Serra da Tormenta, MUARI e Aterro Santa Quitéria.',
};

export default async function RoteirosPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  const packages = await listTourPackages({ city_id: city.id, limit: 50 });

  return (
    <AppFrame>
      <AppHeader chips={['Roteiros', 'Furnas', 'Serra', 'Cultura']} />
      <TourismAdminEditBar href="/painel/cidade/turismo/pacotes" />

      <PublicHero
        icon={Route}
        kicker="Planeje o passeio"
        title="Roteiros de Carmo"
        description="Sugestões curadas com dados reais de Carmo do Rio Claro, combinando Furnas, serra, cultura e paradas locais."
        tone="green"
        meta={
          <>
            <PublicHeroPill tone="green" icon={Route}>
              {packages.length} roteiros
            </PublicHeroPill>
            <PublicHeroPill tone="paper" icon={MapPinned}>
              Furnas
            </PublicHeroPill>
            <PublicHeroPill tone="sun" icon={Clock}>
              Serra · 1.287 m
            </PublicHeroPill>
          </>
        }
      />

      <Divider />

      <Band className="grid gap-3 px-3.5 py-4">
        {packages.length > 0 ? (
          packages.map((item) => (
            <Link
              key={item.id}
              href={`/turismo/roteiros/${item.slug}`}
              className="border-ink-100 text-ink-700 shadow-card overflow-hidden rounded-lg border bg-white no-underline"
            >
              <div className="bg-cerrado-700 flex min-h-[112px] items-start gap-3 p-4 text-white">
                <div className="bg-white/14 grid h-11 w-11 shrink-0 place-items-center rounded-full">
                  <Compass className="text-sun-200 h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="m-0 text-[18px] font-extrabold leading-tight">{item.title}</h2>
                  <p className="text-white/84 m-0 mt-2 line-clamp-3 text-[13px] leading-relaxed">
                    {item.description ?? 'Roteiro em curadoria.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <Pill label={item.difficulty ?? 'Livre'} />
                  <Pill label={`${item.totalDurationHours ?? item.durationHours ?? '-'}h`} />
                  {item.totalDistanceKm ? <Pill label={`${item.totalDistanceKm} km`} /> : null}
                  {item.featured ? <Pill active label="Destaque" /> : null}
                </div>

                {item.includes.length > 0 ? (
                  <div className="text-ink-700 grid gap-1.5 text-[12px]">
                    {item.includes.slice(0, 4).map((include) => (
                      <span key={include} className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="text-cerrado-700 h-3.5 w-3.5" aria-hidden="true" />
                        {include}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))
        ) : (
          <p className="border-ink-200 text-ink-700 m-0 rounded-md border border-dashed bg-white p-4 text-[13px]">
            Nenhum roteiro publicado ainda.
          </p>
        )}
      </Band>
      <TabBar active="home" />
    </AppFrame>
  );
}
