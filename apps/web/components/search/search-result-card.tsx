'use client';

import Image from 'next/image';
import Link from 'next/link';
import { startTransition } from 'react';
import { CalendarDays, FileText, Home, MapPin, MessageCircle, Phone, Search, Store, Utensils, BookOpen } from 'lucide-react';
import { himetricaTrack } from '@/lib/analytics/himetrica';
import { HI_METRICA_EVENTS } from '@/lib/analytics/himetrica-events';
import { trackSearchClickAction } from '@/app/buscar/actions';
import type { SearchHit } from '@/lib/search/types';
import { cn } from '@/lib/utils';

type SearchResultCardProps = {
  hit: SearchHit;
  queryId: string | null;
};

export function SearchResultCard({ hit, queryId }: SearchResultCardProps) {
  const Icon = iconByType[hit.entityType] ?? Search;

  function trackClick() {
    himetricaTrack(HI_METRICA_EVENTS.search_result_clicked, {
      source: 'results_page',
      entity_type: hit.entityType,
      entity_id: hit.entityId,
    });
    if (!queryId) return;
    startTransition(() => {
      void trackSearchClickAction({
        queryId,
        entityType: hit.entityType,
        entityId: hit.entityId,
      });
    });
  }

  const hasBusinessContact = hit.entityType === 'business' && (hit.phone || hit.whatsapp);

  return (
    <article className="rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:bg-accent">
      <Link
        href={hit.url}
        onClick={trackClick}
        className="grid grid-cols-[56px_1fr] gap-3 md:grid-cols-[72px_1fr_auto] md:items-center"
      >
        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-muted md:h-16 md:w-16">
          {hit.coverUrl ? (
            <Image src={hit.coverUrl} alt="" fill unoptimized sizes="72px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold leading-tight md:text-base">{hit.title}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {labelByType[hit.entityType] ?? 'Resultado'}
            </span>
          </div>
          {hit.subtitle ? <p className="mt-1 truncate text-sm text-muted-foreground">{hit.subtitle}</p> : null}
          {hit.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{hit.description}</p>
          ) : null}
        </div>

        <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-1 md:block md:text-right">
          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium',
              hit.source === 'semantic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {hit.source === 'semantic' ? `${Math.round(hit.score * 100)}%` : 'texto'}
          </span>
          <span className="text-xs font-medium text-primary md:mt-2 md:block">Ver detalhes</span>
        </div>
      </Link>

      {hasBusinessContact && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          {hit.whatsapp ? (
            <a
              href={`https://wa.me/55${hit.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-cerrado-500 px-3 text-sm font-semibold text-white"
              onClick={() =>
                himetricaTrack(HI_METRICA_EVENTS.contact_whatsapp_click, {
                  entity_type: hit.entityType,
                  entity_id: hit.entityId,
                  source: 'search_results',
                })
              }
            >
              <MessageCircle size={17} strokeWidth={2.3} />
              WhatsApp
            </a>
          ) : null}
          {hit.phone ? (
            <a
              href={`tel:${hit.phone.replace(/\D/g, '')}`}
              className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-clay-500 px-3 text-sm font-semibold text-white"
              onClick={() =>
                himetricaTrack(HI_METRICA_EVENTS.contact_phone_click, {
                  entity_type: hit.entityType,
                  entity_id: hit.entityId,
                  source: 'search_results',
                })
              }
            >
              <Phone size={17} strokeWidth={2.3} />
              Ligar
            </a>
          ) : null}
        </div>
      )}
    </article>
  );
}

const iconByType: Partial<Record<SearchHit['entityType'], typeof Search>> = {
  business: Store,
  accommodation: Home,
  restaurant: Utensils,
  tourism_guide: BookOpen,
  fishing_guide: MapPin,
  event: CalendarDays,
  classified: Search,
  property: Home,
  attraction: MapPin,
  tour_package: MapPin,
  site_page: FileText,
};

const labelByType: Partial<Record<SearchHit['entityType'], string>> = {
  business: 'Comércio',
  accommodation: 'Hospedagem',
  restaurant: 'Restaurante',
  tourism_guide: 'Guia',
  fishing_guide: 'Pesca',
  event: 'Evento',
  classified: 'Classificado',
  property: 'Imóvel',
  attraction: 'Turismo',
  tour_package: 'Passeio',
  site_page: 'Página',
};
