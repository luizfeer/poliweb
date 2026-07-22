import { BedDouble, MapPinned } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { Band } from '@/components/carmo';
import type { Business } from '@/lib/businesses';

type Props = {
  cityName: string;
  lodgings: Business[];
};

export function LodgingMapWidget({ cityName, lodgings }: Props) {
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
                  Abra a tela com lista e mapa lado a lado para comparar localizacao, fotos e
                  detalhes.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/14 px-3 py-1.5 text-[12px] font-bold text-white">
                <BedDouble className="size-3.5" aria-hidden="true" />
                {lodgings.length || 'Novas'} opcoes
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/14 px-3 py-1.5 text-[12px] font-bold text-white">
                <MapPinned className="size-3.5" aria-hidden="true" />
                {withLocation.length || 'Mapa'} com localizacao
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
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.coverUrl ?? item.logoUrl ?? undefined}
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
