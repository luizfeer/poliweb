'use client';

import { type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import maplibregl, { type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import { BedDouble, ChevronLeft, ChevronRight, Compass, Fish, Heart, Heart as HeartFilled, LayoutGrid, LifeBuoy, List, LogIn, LogOut, Map as MapIcon, MapPin, Menu, Mountain, Search, SlidersHorizontal, Star, UserPlus, UserRound, UtensilsCrossed, Waves, X } from 'lucide-react';
import { toggleBusinessFavoriteAction } from '@/app/comercio/actions';
import { cn } from '@/lib/utils';

export type AccommodationExplorerItem = {
  id: string;
  slug: string;
  href: string;
  name: string;
  kind: string;
  subtitle: string;
  description: string | null;
  districtName: string | null;
  lat: number | null;
  lng: number | null;
  coverUrl: string | null;
  photos: string[];
  rating: number | null;
  reviewsCount: number | null;
  featured: boolean;
  verified: boolean;
  priceLabel: string;
  markerLabel: string;
};

type AccommodationExplorerProps = {
  city: {
    name: string;
    lat: number | null;
    lng: number | null;
  };
  items: AccommodationExplorerItem[];
  category: {
    slug: string;
    name: string;
  };
  categoryOptions: Array<{
    slug: string;
    name: string;
    parent: string | null;
  }>;
  viewMode: ViewMode;
  user: { email: string | null; name: string | null } | null;
  favoriteBusinessIds: string[];
};

type MappableAccommodation = AccommodationExplorerItem & {
  lat: number;
  lng: number;
};

const DEFAULT_CENTER = { lat: -20.9719, lng: -46.1189 };
const MOBILE_SHEET_MIN = 38;
const MOBILE_SHEET_MAX = 82;

type MapThemeId = 'voyager' | 'osm' | 'dark';
type ViewMode = 'dividida' | 'lista' | 'mapa';

const MAP_THEMES: Array<{ id: MapThemeId; label: string }> = [
  { id: 'voyager', label: 'Mapa' },
  { id: 'osm', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
];

const VIEW_OPTIONS: Array<{ id: ViewMode; label: string; description: string }> = [
  { id: 'dividida', label: 'Dividida', description: 'Lista e mapa lado a lado.' },
  { id: 'lista', label: 'Lista', description: 'Cards em destaque, sem mapa.' },
  { id: 'mapa', label: 'Mapa', description: 'Mapa amplo com os pins.' },
];

const TOURISM_LINKS = [
  { href: '/turismo/onde-ficar', label: 'Onde ficar', icon: BedDouble },
  { href: '/turismo/onde-comer', label: 'Onde comer', icon: UtensilsCrossed },
  { href: '/turismo/o-que-fazer', label: 'O que fazer', icon: Mountain },
  { href: '/turismo/pesca', label: 'Pesca', icon: Fish },
  { href: '/turismo/guias', label: 'Guias', icon: Compass },
];

function getImages(item: AccommodationExplorerItem): string[] {
  return Array.from(new Set([item.coverUrl, ...item.photos].filter((value): value is string => Boolean(value))));
}

function getMapStyle(theme: MapThemeId): maplibregl.StyleSpecification {
  if (theme === 'dark') {
    return {
      version: 8,
      sources: {
        cartoDark: {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: 'OpenStreetMap / CARTO',
        },
      },
      layers: [{ id: 'cartoDark', type: 'raster', source: 'cartoDark' }],
    };
  }

  if (theme === 'osm') {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: 'OpenStreetMap',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    };
  }

  return {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap © CARTO',
      },
    },
    layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
  };
}

const BED_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>';

function createPriceMarker(item: AccommodationExplorerItem, isActive: boolean) {
  const element = document.createElement('button');
  element.type = 'button';
  element.setAttribute('aria-label', item.name);

  const rawLabel = item.markerLabel?.trim() ?? '';
  const isPriceLabel = /r\$|\$|^\d/i.test(rawLabel);
  const textLabel = isActive ? item.name : isPriceLabel ? rawLabel : '';

  element.className = [
    'flex items-center gap-1.5 rounded-full border shadow-md transition-all',
    textLabel ? 'px-2 py-1' : 'p-1.5',
    isActive
      ? 'border-ink-900 bg-ink-900 text-white scale-110 max-w-[180px]'
      : 'border-ink-200 bg-white text-ink-900 hover:bg-paper',
  ].join(' ');

  const icon = document.createElement('span');
  icon.className = 'flex size-4 shrink-0 items-center justify-center';
  icon.innerHTML = BED_ICON_SVG;
  element.appendChild(icon);

  if (textLabel) {
    const text = document.createElement('span');
    text.className = 'truncate text-[12px] font-extrabold leading-none';
    text.textContent = textLabel;
    element.appendChild(text);
  }

  return element;
}

export function AccommodationExplorer({
  city,
  items,
  category,
  categoryOptions,
  viewMode,
  user,
  favoriteBusinessIds,
}: AccommodationExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const cardRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [mapTheme, setMapTheme] = useState<MapThemeId>('voyager');
  const [sheetHeight, setSheetHeight] = useState(58);
  const showList = viewMode !== 'mapa';
  const showMap = viewMode !== 'lista';

  const mappableItems = useMemo(
    () =>
      items.filter(
        (item): item is MappableAccommodation =>
          typeof item.lat === 'number' && Number.isFinite(item.lat) && typeof item.lng === 'number' && Number.isFinite(item.lng),
      ),
    [items],
  );

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const activeId = selectedItem?.id ?? null;

  useEffect(() => {
    const previousPaddingBottom = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '0px';

    return () => {
      document.body.style.paddingBottom = previousPaddingBottom;
    };
  }, []);

  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapRef.current) return;
    const markerMap = markersRef.current;

    const center = {
      lat: city.lat ?? DEFAULT_CENTER.lat,
      lng: city.lng ?? DEFAULT_CENTER.lng,
    };
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(mapTheme),
      center: [center.lng, center.lat],
      zoom: 11.8,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      if (mappableItems.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const item of mappableItems) bounds.extend([item.lng, item.lat]);
        map.fitBounds(bounds, { padding: 72, maxZoom: 13.8, duration: 0 });
      }
    });

    return () => {
      markerMap.forEach((marker) => marker.remove());
      markerMap.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [city.lat, city.lng, mapTheme, mappableItems, showMap]);

  useEffect(() => {
    if (showMap || !mapRef.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    mapRef.current.remove();
    mapRef.current = null;
  }, [showMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const item of mappableItems) {
      const element = createPriceMarker(item, item.id === activeId);
      element.addEventListener('click', () => {
        setSelectedId(item.id);
        map.easeTo({ center: [item.lng, item.lat], zoom: Math.max(map.getZoom(), 14), duration: 400 });
        cardRefs.current.get(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([item.lng, item.lat])
        .addTo(map);
      markersRef.current.set(item.id, marker);
    }
  }, [activeId, mappableItems]);

  function focusItem(item: AccommodationExplorerItem) {
    setSelectedId(item.id);
    if (typeof item.lat === 'number' && typeof item.lng === 'number') {
      mapRef.current?.easeTo({
        center: [item.lng, item.lat],
        zoom: Math.max(mapRef.current.getZoom(), 14),
        duration: 400,
      });
    }
  }

  function startSheetResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const startY = event.clientY;
    const startHeight = sheetHeight;

    function move(moveEvent: PointerEvent) {
      const delta = ((startY - moveEvent.clientY) / window.innerHeight) * 100;
      const nextHeight = Math.min(MOBILE_SHEET_MAX, Math.max(MOBILE_SHEET_MIN, startHeight + delta));
      setSheetHeight(nextHeight);
      window.requestAnimationFrame(() => mapRef.current?.resize());
    }

    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }

  const layoutStyle = { '--mobile-sheet-height': `${sheetHeight}svh` } as CSSProperties;

  return (
    <main className="min-h-svh bg-white text-ink-900" style={layoutStyle}>
      <AccommodationTopNav
        cityName={city.name}
        mapTheme={mapTheme}
        onMapThemeChange={setMapTheme}
        category={category}
        categoryOptions={categoryOptions}
        viewMode={viewMode}
        user={user}
        resultsCount={items.length}
      />
      <div
        className={cn(
          'grid min-h-svh pt-[176px] lg:pt-[124px]',
          viewMode === 'lista'
            ? 'lg:grid-cols-1'
            : viewMode === 'mapa'
              ? 'lg:grid-cols-1'
              : 'lg:grid-cols-[minmax(560px,52vw)_1fr]',
        )}
      >
        {showList ? (
        <section
          className={cn(
            'order-2 h-[var(--mobile-sheet-height)] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-3 shadow-[0_-10px_30px_rgba(25,25,25,0.12)] lg:order-1 lg:!h-[calc(100svh-124px)] lg:rounded-none lg:px-8 lg:pt-7 lg:shadow-none',
            viewMode === 'lista' && 'lg:mx-auto lg:w-full lg:max-w-[1180px]',
          )}
        >
          <button
            type="button"
            onPointerDown={startSheetResize}
            className="mx-auto mb-3 block h-6 w-24 touch-none rounded-full bg-transparent lg:hidden"
            aria-label="Ajustar altura da lista"
          >
            <span className="mx-auto block h-1 w-12 rounded-full bg-ink-300" aria-hidden="true" />
          </button>
          <header className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="m-0 text-[13px] font-bold uppercase text-clay-700">{category.name}</p>
              <h1 className="m-0 mt-1 font-display text-[24px] font-extrabold lg:text-[28px]">
                {items.length} resultados em {city.name}
              </h1>
            </div>
            <Link
              href="/mapa?cats=pousada"
              className="hidden rounded-full border border-ink-200 px-3 py-2 text-[12px] font-extrabold text-ink-900 no-underline lg:inline-flex"
            >
              Ver guia
            </Link>
          </header>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:gap-x-5 lg:gap-y-8">
            {items.map((item) => (
              <AccommodationTile
                key={item.id}
                item={item}
                selected={activeId === item.id}
                initialFavorited={favoriteBusinessIds.includes(item.id)}
                onFocus={() => focusItem(item)}
                setRef={(node) => {
                  if (node) cardRefs.current.set(item.id, node);
                  else cardRefs.current.delete(item.id);
                }}
              />
            ))}
          </div>
          {items.length === 0 ? (
            <p className="m-0 rounded-md border border-ink-100 bg-paper p-4 text-[14px] font-medium text-ink-700">
              Nada publicado nessa categoria.
            </p>
          ) : null}
        </section>
        ) : null}

        {showMap ? (
        <section
          className={cn(
            'order-1 h-[calc(100svh-176px-var(--mobile-sheet-height))] overflow-hidden lg:sticky lg:top-[124px] lg:order-2 lg:!h-[calc(100svh-124px)]',
            viewMode === 'mapa' && 'h-[calc(100svh-176px)] lg:!h-[calc(100svh-124px)]',
          )}
        >
          <div ref={mapContainerRef} className="h-full w-full" aria-label={`Mapa de hospedagens em ${city.name}`} />
          {selectedItem ? (
            <div className="absolute left-4 top-4 hidden max-w-[300px] rounded-lg bg-white/95 p-3 shadow-pop backdrop-blur lg:block">
              <p className="m-0 text-[12px] font-bold uppercase text-clay-700">Selecionado</p>
              <p className="m-0 mt-1 line-clamp-2 text-[15px] font-extrabold">{selectedItem.name}</p>
              <p className="m-0 mt-1 text-[13px] font-semibold text-ink-700">
                {selectedItem.priceLabel}
              </p>
              <Link
                href={selectedItem.href}
                className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md bg-ink-900 px-3 text-[12px] font-extrabold text-white no-underline hover:bg-ink-800 hover:no-underline"
              >
                Ver detalhes
              </Link>
            </div>
          ) : null}
        </section>
        ) : null}
      </div>
    </main>
  );
}

function AccommodationTopNav({
  cityName,
  mapTheme,
  onMapThemeChange,
  category,
  categoryOptions,
  viewMode,
  user,
  resultsCount,
}: {
  cityName: string;
  mapTheme: MapThemeId;
  onMapThemeChange: (theme: MapThemeId) => void;
  category: { slug: string; name: string };
  categoryOptions: Array<{ slug: string; name: string; parent: string | null }>;
  viewMode: ViewMode;
  user: { email: string | null; name: string | null } | null;
  resultsCount: number;
}) {
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const currentQuery = searchParams.get('q') ?? '';
  const currentDistrict = searchParams.get('bairro') ?? '';
  const currentSort = searchParams.get('sort') ?? 'rating';
  const currentWhatsapp = searchParams.get('whatsapp') === '1';
  const categories = categoryOptions;
  const activeFilterCount =
    (currentDistrict ? 1 : 0) +
    (currentWhatsapp ? 1 : 0) +
    (currentSort && currentSort !== 'rating' ? 1 : 0);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onDocClick(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  function hrefFor(next: { categoria?: string; visualizacao?: ViewMode }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.categoria) params.set('categoria', next.categoria);
    if (next.visualizacao) params.set('visualizacao', next.visualizacao);
    const query = params.toString();
    return query ? `/turismo/onde-ficar?${query}` : '/turismo/onde-ficar';
  }

  const userInitial = (user?.name ?? user?.email ?? '?').trim().charAt(0).toUpperCase();
  const resultLabel = `${resultsCount} ${resultsCount === 1 ? 'resultado' : 'resultados'}`;

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-ink-100 bg-white/95 px-4 py-2 shadow-[0_1px_10px_rgba(25,25,25,0.06)] backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0 no-underline hover:no-underline">
          <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-clay-700 lg:text-[12px]">
            Portal Carmelitano
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[15px] font-extrabold text-ink-900 lg:text-[17px]">
            <BedDouble className="size-4 shrink-0 text-cerrado-700" aria-hidden="true" />
            <span className="truncate">Onde ficar</span>
          </span>
        </Link>

        <div className="hidden min-w-0 items-center gap-2 rounded-full bg-paper px-3 py-2 text-[12px] font-bold text-ink-700 md:flex">
          <MapPin className="size-4 shrink-0 text-clay-700" aria-hidden="true" />
          <span className="truncate">{cityName}</span>
          <span className="h-1 w-1 rounded-full bg-ink-300" aria-hidden="true" />
          <span className="shrink-0">{resultLabel}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 max-md:hidden lg:max-w-[560px]">
          <form action="/turismo/onde-ficar" className="flex min-w-0 flex-1">
            <label className="flex h-11 w-full min-w-0 items-center gap-3 rounded-full border border-ink-200 bg-white px-4 shadow-sm">
              <input type="hidden" name="categoria" value={category.slug} />
              <input type="hidden" name="visualizacao" value={viewMode} />
              {currentDistrict ? <input type="hidden" name="bairro" value={currentDistrict} /> : null}
              {currentWhatsapp ? <input type="hidden" name="whatsapp" value="1" /> : null}
              {currentSort && currentSort !== 'rating' ? <input type="hidden" name="sort" value={currentSort} /> : null}
              <button
                type="submit"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-700 hover:bg-paper"
                aria-label="Buscar"
              >
                <Search className="size-4" aria-hidden="true" />
              </button>
              <input
                name="q"
                defaultValue={currentQuery}
                placeholder={`Buscar em ${category.name.toLowerCase()}`}
                className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-semibold outline-none placeholder:text-ink-500"
              />
            </label>
          </form>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative flex h-11 shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] font-extrabold text-ink-900 shadow-sm hover:border-ink-300"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span>Filtros</span>
            {activeFilterCount > 0 ? (
              <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-clay-500 text-[11px] font-extrabold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden rounded-full border border-ink-200 bg-white p-1 lg:flex" aria-label="Visualização">
            {VIEW_OPTIONS.map((option) => (
              <Link
                key={option.id}
                href={hrefFor({ visualizacao: option.id })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold no-underline transition-colors hover:no-underline',
                  viewMode === option.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-paper',
                )}
              >
                {option.id === 'dividida' ? <LayoutGrid className="size-3.5" aria-hidden="true" /> : null}
                {option.id === 'lista' ? <List className="size-3.5" aria-hidden="true" /> : null}
                {option.id === 'mapa' ? <MapIcon className="size-3.5" aria-hidden="true" /> : null}
                {option.label}
              </Link>
            ))}
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              className="flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white pl-3 pr-1.5 text-ink-900 shadow-sm hover:border-ink-300"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-label="Abrir menu do usuário"
            >
              <Menu className="size-4" aria-hidden="true" />
              {user ? (
                <span className="flex size-9 items-center justify-center rounded-full bg-ink-900 text-[13px] font-extrabold text-white">
                  {userInitial}
                </span>
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-paper text-ink-700">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
              )}
            </button>
            {userMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-40 w-[240px] overflow-hidden rounded-2xl border border-ink-100 bg-white py-2 text-[14px] shadow-pop"
              >
                {user ? (
                  <>
                    <div className="px-4 py-2 text-[12px]">
                      <p className="m-0 font-extrabold text-ink-900">{user.name ?? 'Sua conta'}</p>
                      {user.email ? (
                        <p className="m-0 mt-0.5 truncate font-medium text-ink-600">{user.email}</p>
                      ) : null}
                    </div>
                    <div className="my-1 h-px bg-ink-100" />
                    <UserMenuItem href="/painel" icon={<LayoutGrid className="size-4" aria-hidden="true" />}>
                      Painel
                    </UserMenuItem>
                    <UserMenuItem href="/painel/favoritos" icon={<HeartFilled className="size-4" aria-hidden="true" />}>
                      Favoritos
                    </UserMenuItem>
                    <UserMenuItem href="/painel/perfil" icon={<UserRound className="size-4" aria-hidden="true" />}>
                      Perfil
                    </UserMenuItem>
                    <UserMenuItem href="/ajuda" icon={<LifeBuoy className="size-4" aria-hidden="true" />}>
                      Ajuda
                    </UserMenuItem>
                    <div className="my-1 h-px bg-ink-100" />
                    <form action="/sair" method="post" role="none">
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-bold text-ink-800 hover:bg-paper"
                      >
                        <LogOut className="size-4" aria-hidden="true" />
                        Sair
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <UserMenuItem href="/entrar" icon={<LogIn className="size-4" aria-hidden="true" />}>
                      Entrar
                    </UserMenuItem>
                    <UserMenuItem href="/cadastro" icon={<UserPlus className="size-4" aria-hidden="true" />} emphasis>
                      Criar conta
                    </UserMenuItem>
                    <div className="my-1 h-px bg-ink-100" />
                    <UserMenuItem href="/turismo" icon={<MapIcon className="size-4" aria-hidden="true" />}>
                      Explorar turismo
                    </UserMenuItem>
                    <UserMenuItem href="/painel/comercio/cadastro" icon={<UserPlus className="size-4" aria-hidden="true" />}>
                      Cadastrar negócio
                    </UserMenuItem>
                    <UserMenuItem href="/ajuda" icon={<LifeBuoy className="size-4" aria-hidden="true" />}>
                      Ajuda
                    </UserMenuItem>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 md:hidden">
        <form action="/turismo/onde-ficar" className="flex min-w-0 flex-1">
          <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-3 shadow-sm">
            <input type="hidden" name="categoria" value={category.slug} />
            <input type="hidden" name="visualizacao" value={viewMode} />
            {currentDistrict ? <input type="hidden" name="bairro" value={currentDistrict} /> : null}
            {currentWhatsapp ? <input type="hidden" name="whatsapp" value="1" /> : null}
            {currentSort && currentSort !== 'rating' ? <input type="hidden" name="sort" value={currentSort} /> : null}
            <Search className="size-4 shrink-0 text-ink-600" aria-hidden="true" />
            <input
              name="q"
              defaultValue={currentQuery}
              placeholder={`Buscar em ${category.name.toLowerCase()}`}
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-semibold outline-none placeholder:text-ink-500"
            />
          </label>
        </form>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="relative flex h-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white px-3 text-[13px] font-extrabold text-ink-900 shadow-sm"
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-clay-500 text-[11px] font-extrabold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 overflow-x-auto">
        <nav className="flex min-w-max items-center gap-1 rounded-full bg-paper p-1" aria-label="Turismo">
          {TOURISM_LINKS.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/turismo/onde-ficar';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold no-underline hover:no-underline',
                  active ? 'bg-clay-500 text-white' : 'text-ink-700 hover:bg-white',
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-max gap-1 rounded-full bg-paper p-1 md:ml-auto" aria-label="Tema do mapa">
          {MAP_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onMapThemeChange(theme.id)}
              className={cn(
                'h-8 rounded-full px-3 text-[12px] font-extrabold',
                mapTheme === theme.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-white',
              )}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[90] bg-ink-900/35 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
          <div className="mx-auto mt-10 max-w-[640px] rounded-2xl bg-white p-5 shadow-pop">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[12px] font-bold uppercase text-clay-700">Filtros</p>
                <h2 className="m-0 mt-1 text-[22px] font-extrabold">Refine a busca</h2>
                <p className="m-0 mt-1 text-[13px] font-medium text-ink-600">
                  {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'} com os filtros atuais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex size-10 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-900"
                aria-label="Fechar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form action="/turismo/onde-ficar" className="mt-5 space-y-5">
              <input type="hidden" name="categoria" value={category.slug} />
              <input type="hidden" name="visualizacao" value={viewMode} />
              <input type="hidden" name="q" value={currentQuery} />

              <fieldset>
                <legend className="mb-2 text-[13px] font-extrabold text-ink-900">Categoria</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((item) => (
                    <Link
                      key={item.slug}
                      href={hrefFor({ categoria: item.slug })}
                      onClick={() => setFiltersOpen(false)}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-[13px] font-extrabold no-underline',
                        category.slug === item.slug
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-200 bg-white text-ink-800',
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-[13px] font-extrabold text-ink-900">Visualização</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {VIEW_OPTIONS.map((option) => (
                    <Link
                      key={option.id}
                      href={hrefFor({ visualizacao: option.id })}
                      onClick={() => setFiltersOpen(false)}
                      className={cn(
                        'rounded-xl border p-3 no-underline',
                        viewMode === option.id
                          ? 'border-clay-500 bg-clay-50 text-clay-700'
                          : 'border-ink-200 bg-white text-ink-800',
                      )}
                    >
                      <span className="flex items-center gap-2 text-[13px] font-extrabold">
                        {option.id === 'dividida' ? <LayoutGrid className="size-4" aria-hidden="true" /> : null}
                        {option.id === 'lista' ? <List className="size-4" aria-hidden="true" /> : null}
                        {option.id === 'mapa' ? <MapIcon className="size-4" aria-hidden="true" /> : null}
                        {option.label}
                      </span>
                      <span className="mt-1 block text-[12px] font-medium text-ink-600">{option.description}</span>
                    </Link>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-extrabold text-ink-900">Bairro</span>
                  <input
                    name="bairro"
                    defaultValue={currentDistrict}
                    placeholder="Centro, Furnas, …"
                    className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-[14px] font-semibold outline-none focus:border-ink-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-extrabold text-ink-900">Ordenar por</span>
                  <select
                    name="sort"
                    defaultValue={currentSort}
                    className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-[14px] font-semibold outline-none focus:border-ink-400"
                  >
                    <option value="rating">Melhor avaliados</option>
                    <option value="featured">Em destaque</option>
                    <option value="recent">Mais recentes</option>
                    <option value="name">Nome A–Z</option>
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-3">
                <input
                  type="checkbox"
                  name="whatsapp"
                  value="1"
                  defaultChecked={currentWhatsapp}
                  className="size-4 accent-clay-500"
                />
                <span className="text-[13px] font-extrabold text-ink-900">Só com WhatsApp</span>
                <span className="ml-auto text-[12px] font-medium text-ink-600">Fala direto com o anfitrião</span>
              </label>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Link
                  href={`/turismo/onde-ficar?categoria=${category.slug}&visualizacao=${viewMode}`}
                  onClick={() => setFiltersOpen(false)}
                  className="text-[13px] font-extrabold text-ink-700 underline-offset-2 hover:underline"
                >
                  Limpar filtros
                </Link>
                <button
                  type="submit"
                  className="rounded-full bg-ink-900 px-5 py-3 text-[14px] font-extrabold text-white"
                >
                  Aplicar filtros
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function UserMenuItem({
  href,
  icon,
  children,
  emphasis,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-paper',
        emphasis ? 'font-extrabold text-clay-700' : 'font-bold text-ink-800',
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function AccommodationTile({
  item,
  selected,
  initialFavorited,
  onFocus,
  setRef,
}: {
  item: AccommodationExplorerItem;
  selected: boolean;
  initialFavorited: boolean;
  onFocus: () => void;
  setRef: (node: HTMLAnchorElement | null) => void;
}) {
  const images = getImages(item);
  const [activeImage, setActiveImage] = useState(0);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isFavoritePending, startFavoriteTransition] = useTransition();
  const metaLine = [item.kind, item.districtName].filter(Boolean).join(' · ');
  const hasGallery = images.length > 1;

  function step(delta: number) {
    if (!hasGallery) return;
    setActiveImage((index) => (index + delta + images.length) % images.length);
  }

  function handleNavClick(event: ReactMouseEvent<HTMLButtonElement>, delta: number) {
    event.preventDefault();
    event.stopPropagation();
    step(delta);
  }

  function toggleFavorite(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFavorited((value) => !value);
    startFavoriteTransition(async () => {
      try {
        const result = await toggleBusinessFavoriteAction({
          businessId: item.id,
          businessSlug: item.slug,
        });
        setFavorited(result.favorited);
      } catch (error) {
        setFavorited((value) => !value);
        throw error;
      }
    });
  }

  return (
    <Link
      ref={setRef}
      href={item.href}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={cn(
        'group block rounded-lg no-underline outline-none transition-transform hover:no-underline',
        selected && 'lg:-translate-y-0.5',
      )}
    >
      <div
        className={cn(
          'relative aspect-[1.18/1] overflow-hidden rounded-lg bg-paper-deep',
          selected && 'ring-2 ring-ink-900 ring-offset-2',
        )}
      >
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={images[activeImage]}
            src={images[activeImage]}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-cerrado-100">
            <BedDouble className="size-9 text-cerrado-700" aria-hidden="true" />
          </div>
        )}
        {item.featured ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-extrabold text-ink-900 shadow-sm">
            Destaque
          </span>
        ) : null}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={favorited}
          disabled={isFavoritePending}
          className={cn(
            'absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/85 text-ink-700 shadow-sm transition hover:bg-white',
            isFavoritePending && 'opacity-70',
          )}
        >
          <Heart
            className={cn('size-4 transition', favorited && 'fill-clay-500 text-clay-500')}
            aria-hidden="true"
          />
        </button>
        {hasGallery ? (
          <>
            <button
              type="button"
              onClick={(event) => handleNavClick(event, -1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-900 opacity-0 shadow-md transition group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(event) => handleNavClick(event, 1)}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-900 opacity-0 shadow-md transition group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <span className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.slice(0, 5).map((image, index) => (
                <span
                  key={`${image}-${index}`}
                  className={cn(
                    'size-1.5 rounded-full transition',
                    index === activeImage ? 'bg-white' : 'bg-white/60',
                  )}
                />
              ))}
            </span>
          </>
        ) : null}
      </div>
      <div className="mt-2 space-y-0.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="m-0 line-clamp-2 text-[14px] font-extrabold leading-snug text-ink-900">
            {item.name}
          </p>
          {item.rating ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-ink-800">
              <Star className="size-3 fill-ink-900 text-ink-900" aria-hidden="true" />
              {item.rating.toFixed(1).replace('.', ',')}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-ink-800">
              <Star className="size-3 fill-ink-900 text-ink-900" aria-hidden="true" />
              Novo
            </span>
          )}
        </div>
        <p className="m-0 line-clamp-1 text-[13px] text-ink-500">{metaLine}</p>
        {item.description ? (
          <p className="m-0 line-clamp-1 text-[13px] text-ink-600">{item.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[13px] font-extrabold text-ink-900">{item.priceLabel}</span>
          {item.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
              <Waves className="size-3" aria-hidden="true" />
              Verificado
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
