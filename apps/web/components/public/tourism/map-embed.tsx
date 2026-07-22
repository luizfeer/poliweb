'use client';

import { Car, Expand, Route } from 'lucide-react';
import Link from 'next/link';

import { CopyAddressButton } from '@/components/public/tourism/copy-address-button';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import type { MapCategoryId } from '@/lib/maps/categories';

export type MapEmbedAnalyticsContext = {
  entity_type: string;
  entity_slug: string;
  entity_id?: string;
};

export function MapEmbed({
  lat,
  lng,
  label,
  address,
  mapCategory,
  mapPointId,
  analyticsContext,
}: {
  lat: number | null;
  lng: number | null;
  label: string;
  address?: string | null;
  mapCategory?: MapCategoryId;
  mapPointId?: string;
  analyticsContext?: MapEmbedAnalyticsContext;
}) {
  const trimmedAddress = address?.trim() ?? '';

  function trackMapCta(action: string) {
    himetricaTrack(HI_METRICA_EVENTS.map_cta_click, {
      action,
      ...(analyticsContext ?? {}),
    });
  }

  if (lat === null || lng === null) {
    return (
      <div className="bg-paper text-ink-600 flex min-h-32 items-center justify-center rounded-md text-[13px]">
        Localização no mapa em atualização
      </div>
    );
  }

  /** Bbox um pouco mais largo ao sul: o pin do embed sobe na área visível e deixa de ficar atrás do card. */
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.022}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const wazeUrl = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const mapParams = new URLSearchParams({
    c: `${lat.toFixed(5)},${lng.toFixed(5)}`,
    z: '15',
  });
  if (mapCategory) mapParams.set('cats', mapCategory);
  if (mapPointId) mapParams.set('id', mapPointId);
  const localMapUrl = `/mapa?${mapParams.toString()}`;

  const copyAnalytics = analyticsContext
    ? {
        entity_type: analyticsContext.entity_type,
        entity_slug: analyticsContext.entity_slug,
        ...(analyticsContext.entity_id ? { entity_id: analyticsContext.entity_id } : {}),
      }
    : undefined;

  const ctaRow =
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-ink-200 bg-paper-deep px-3 text-center text-[12px] font-bold text-ink-900 shadow-sm no-underline transition-colors hover:bg-white';

  return (
    <div className="border-ink-100 overflow-hidden rounded-lg border bg-white shadow-card">
      <div className="relative h-44 overflow-hidden bg-ink-200 sm:h-52">
        <iframe
          title={`Mapa de ${label}`}
          src={embedUrl}
          className="pointer-events-none relative z-0 h-full w-full border-0 bg-transparent"
          loading="lazy"
          tabIndex={-1}
        />
        <Link
          href={localMapUrl}
          onClick={() => trackMapCta('preview_map')}
          aria-label={`Abrir ${label} no mapa da cidade`}
          className="absolute inset-0 z-[1]"
        />
        <Link
          href={localMapUrl}
          onClick={() => trackMapCta('local_map')}
          className="absolute right-3 top-3 z-[2] inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-white px-3 text-[12px] font-bold text-ink-900 no-underline shadow-pop ring-1 ring-ink-100"
        >
          <Expand className="size-4 shrink-0" aria-hidden="true" />
          Abrir mapa
        </Link>
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[2] max-w-[min(calc(100%-1.5rem),288px)] rounded-md bg-white/95 p-3 shadow-pop ring-1 ring-ink-100 backdrop-blur">
          <div className="min-w-0">
            <h3 className="text-ink-900 m-0 text-[14px] font-extrabold leading-tight">{label}</h3>
            <p className="text-ink-600 m-0 mt-1 line-clamp-3 text-[12px] leading-snug">
              {trimmedAddress || 'Ponto marcado no mapa da cidade.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-ink-100 p-3 sm:grid-cols-4">
        <Link
          href={localMapUrl}
          onClick={() => trackMapCta('local_map')}
          className={`${ctaRow} border-l-4 border-l-cerrado-500`}
        >
          <Expand className="size-4 shrink-0" aria-hidden="true" />
          Mapa
        </Link>
        <a
          href={googleDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackMapCta('google_directions')}
          className={`${ctaRow} border-l-4 border-l-[#4285F4]`}
        >
          <Route className="size-4 shrink-0" aria-hidden="true" />
          Google
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackMapCta('waze')}
          className={`${ctaRow} border-l-4 border-l-[#33CCFF]`}
        >
          <Car className="size-4 shrink-0" aria-hidden="true" />
          Waze
        </a>
        {trimmedAddress ? (
          <CopyAddressButton
            address={trimmedAddress}
            variant="compact"
            analytics={copyAnalytics}
            className={`${ctaRow} border-l-4 border-l-clay-500`}
          />
        ) : null}
      </div>
    </div>
  );
}
