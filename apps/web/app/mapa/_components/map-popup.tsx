import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowUpRight, MapPinned, Star, X } from 'lucide-react';
import { MAP_CATEGORY_BY_ID, type MapPoint } from '@/lib/maps/categories';

export function MapPopup({ point }: { point: MapPoint }) {
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const category = MAP_CATEGORY_BY_ID[point.category];
  const Icon = category.icon;
  const encodedName = encodeURIComponent(point.name);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}&destination_place_id=&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes&q=${encodedName}`;

  return (
    <>
      <article className="w-[276px] overflow-hidden bg-white text-ink-900">
        {point.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={point.thumb} alt="" className="h-[118px] w-full object-cover" />
        ) : (
          <div className="flex h-[82px] w-full items-center justify-center bg-paper-deep">
            <Icon className="size-8 text-ink-400" aria-hidden="true" />
          </div>
        )}
        <div className="space-y-2.5 p-3">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-paper-deep px-2 py-1 text-[11px] font-extrabold text-ink-700">
              <Icon className="size-3.5 shrink-0" style={{ color: category.color }} aria-hidden="true" />
              <span className="truncate">{point.badge ?? category.label}</span>
            </span>
            {point.meta ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-ink-600">
                <Star className="size-3 fill-sun-500 text-sun-500" aria-hidden="true" />
                {point.meta.replace('Nota ', '')}
              </span>
            ) : null}
          </div>
          <h2 className="m-0 font-sans text-[16px] font-extrabold leading-snug">
            {point.name}
          </h2>
          {point.description ? (
            <p
              className="m-0 overflow-hidden text-[12px] font-medium leading-snug text-ink-600"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {point.description}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setIsRouteOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-3 py-2 text-[12px] font-bold text-ink-900"
            >
              <MapPinned className="size-3.5" aria-hidden="true" />
              Rota
            </button>
            <Link
              href={point.href}
              className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-3 py-2 text-[12px] font-bold text-white no-underline hover:no-underline"
            >
              Ver detalhes
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
      {isRouteOpen ? createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/42 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="m-0 w-full max-w-[340px] rounded-md border border-ink-100 bg-white p-0 text-ink-900 shadow-pop"
            aria-label="Abrir rota"
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-3">
              <div>
                <p className="m-0 text-[11px] font-bold uppercase text-clay-700">Abrir rota</p>
                <h2 className="m-0 mt-1 font-sans text-[16px] font-extrabold leading-tight">
                  {point.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsRouteOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-ink-100"
                aria-label="Fechar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2 p-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-ink-900 px-3 py-3 text-center text-[13px] font-extrabold text-white no-underline hover:no-underline"
              >
                Google Maps
              </a>
              <a
                href={wazeUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-ink-200 px-3 py-3 text-center text-[13px] font-extrabold text-ink-900 no-underline hover:no-underline"
              >
                Waze
              </a>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
