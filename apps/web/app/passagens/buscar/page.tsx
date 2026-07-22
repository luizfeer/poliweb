import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, ChevronLeft, Filter, MapPin, SlidersHorizontal, Wifi, Zap } from 'lucide-react';
import { AppFrame, Band, Pill, TabBar } from '@/components/carmo';
import { DESTINATIONS, formatBRL, formatDuration, listSchedulesFor } from '@/lib/passagens/mock';

export const metadata = {
  title: 'Buscar passagens — Portal Carmelitano',
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino = 'alfenas' } = await searchParams;
  const dest = DESTINATIONS.find((d) => d.slug === destino) ?? DESTINATIONS[0];
  const schedules = listSchedulesFor(dest.slug);

  return (
    <AppFrame>
      {/* Header com rota */}
      <div className="bg-clay-500 px-3.5 pt-3 pb-3 md:px-6 lg:px-8">
        <div className="flex items-center justify-between text-white">
          <Link
            href="/passagens"
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <ChevronLeft size={18} strokeWidth={2.6} />
          </Link>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-bold hover:bg-white/30"
          >
            <SlidersHorizontal size={13} strokeWidth={2.5} />
            Filtros
          </button>
        </div>

        {/* Rota visual */}
        <div className="mt-3 flex items-center gap-2 rounded-md bg-white/15 p-2 backdrop-blur-sm">
          <div className="flex flex-1 items-center gap-2">
            <MapPin size={14} className="text-white" strokeWidth={2.4} />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-white/80">
                De
              </div>
              <div className="truncate font-sans text-[13px] font-extrabold text-white">
                Carmo do Rio Claro/MG
              </div>
            </div>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <ArrowRightLeft size={12} strokeWidth={2.5} className="text-white" />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <MapPin size={14} className="text-white" strokeWidth={2.4} />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-white/80">
                Para
              </div>
              <div className="truncate font-sans text-[13px] font-extrabold text-white">
                {dest.city}/{dest.uf}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 text-[12px] font-medium text-white/90">
          Hoje, 4 mai · seg · 1 adulto · {schedules.length} horários
        </div>
      </div>

      {/* Filtros chip */}
      <Band className="border-b border-ink-100 px-3.5 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
          <Pill icon={Filter} label="Mais barata" active />
          <Pill label="Mais cedo" />
          <Pill label="Direto" />
          <Pill label="Sul Minas" />
          <Pill label="Executivo" />
          <Pill label="Wi-Fi" />
        </div>
      </Band>

      {/* Resultados */}
      <Band className="px-3.5 pb-4 pt-3">
        <div className="space-y-2.5">
          {schedules.map((s) => (
            <Link
              key={s.id}
              href={`/passagens/${s.id}`}
              className="block rounded-md border border-ink-100 bg-white no-underline transition-shadow hover:shadow-sm"
            >
              {/* Topo */}
              <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-extrabold uppercase tracking-wide ${
                      s.operator.slug === 'sul-minas'
                        ? 'bg-cerrado-100 text-cerrado-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {s.operator.name}
                  </span>
                  <span className="text-[11px] text-ink-500">{s.operator.badge}</span>
                </div>
                <span className="text-[11px] font-bold text-ink-700">{s.vehicleClass}</span>
              </div>

              {/* Corpo */}
              <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="font-display text-[22px] font-extrabold leading-none text-ink-900">
                      {s.departure}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                      Carmo
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col items-center text-ink-400">
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      {formatDuration(s.durationMin)}
                    </span>
                    <div className="my-1 flex w-full items-center gap-1">
                      <div className="h-px flex-1 bg-ink-200" />
                      <div className="h-1.5 w-1.5 rotate-45 border-r-2 border-t-2 border-clay-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide">direto</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-display text-[22px] font-extrabold leading-none text-ink-900">
                      {s.arrival}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                      {dest.city.slice(0, 5)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div>
                    <div className="text-right text-[10px] text-ink-500">a partir de</div>
                    <div className="font-display text-[20px] font-extrabold leading-none text-clay-600">
                      {formatBRL(s.price)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-clay-600">
                    Ver poltronas
                    <ArrowRight size={12} strokeWidth={2.6} />
                  </div>
                </div>
              </div>

              {/* Rodapé com amenities */}
              <div className="flex items-center justify-between border-t border-ink-100 bg-paper-deep px-3 py-2">
                <div className="flex items-center gap-3 text-[11px] text-ink-700">
                  {s.amenities.includes('Wi-Fi') && (
                    <span className="inline-flex items-center gap-1">
                      <Wifi size={11} strokeWidth={2.5} />
                      Wi-Fi
                    </span>
                  )}
                  {s.amenities.includes('Tomada') && (
                    <span className="inline-flex items-center gap-1">
                      <Zap size={11} strokeWidth={2.5} />
                      Tomada
                    </span>
                  )}
                  {s.amenities.includes('Ar') && <span>Ar-cond.</span>}
                  {s.amenities.includes('Manta') && <span>Manta</span>}
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wide ${
                    s.seatsLeft <= 5 ? 'text-clay-600' : 'text-ink-500'
                  }`}
                >
                  {s.seatsLeft <= 5 ? `Últimos ${s.seatsLeft} lugares` : `${s.seatsLeft} lugares`}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {schedules.length === 0 && (
          <div className="rounded-md border border-ink-100 bg-white p-6 text-center">
            <p className="m-0 text-[14px] text-ink-700">Nenhum horário encontrado pra esse destino.</p>
          </div>
        )}
      </Band>

      <Band variant="paper-deep" className="mx-3.5 mb-2 rounded-md px-4 py-3">
        <p className="m-0 text-[11px] text-ink-600">
          Horários parciais via parceiros afiliados. Preços incluem taxa de embarque do operador. Taxa de
          conveniência do portal: <strong>R$ 3,90</strong> por passagem.
        </p>
      </Band>

      <TabBar active="home" />
    </AppFrame>
  );
}
