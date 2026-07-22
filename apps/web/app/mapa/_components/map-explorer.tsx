'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePathname, useRouter } from 'next/navigation';
import maplibregl, {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type MapLayerMouseEvent,
  type Map as MapLibreMap,
  type Popup,
} from 'maplibre-gl';
import { Layers, LocateFixed, PanelBottomClose, PanelBottomOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAP_CATEGORY_BY_ID, type MapCategoryId, type MapPoint } from '@/lib/maps/categories';
import { cn } from '@/lib/utils';
import { CategoryFilterBar, type SerializableCategory } from './category-filter-bar';
import { MapPopup } from './map-popup';

type MapExplorerProps = {
  city: {
    name: string;
    lat: number | null;
    lng: number | null;
  };
  categories: SerializableCategory[];
  points: MapPoint[];
  selectedCategories: MapCategoryId[];
  initialQuery: string;
  initialZoom?: number;
  initialCenter: { lat: number; lng: number } | null;
  initialPointId?: string;
};

type PointProperties = {
  id: string;
  category: MapCategoryId;
};

type PointFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: PointProperties;
};

type PointFeatureCollection = {
  type: 'FeatureCollection';
  features: PointFeature[];
};

const DEFAULT_CENTER = { lat: -20.9719, lng: -46.1189 };
const DEFAULT_ZOOM = 13;
const MAP_THEMES = [
  {
    id: 'voyager',
    label: 'Voyager',
    tiles: [
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    ],
    attribution: '© OpenStreetMap © CARTO',
  },
  {
    id: 'osm',
    label: 'OSM',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenStreetMap',
  },
  {
    id: 'dark',
    label: 'Escuro',
    tiles: [
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    ],
    attribution: '© OpenStreetMap © CARTO',
  },
] as const;

type MapThemeId = (typeof MAP_THEMES)[number]['id'];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toFeatureCollection(points: MapPoint[]): PointFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point): PointFeature => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
      properties: {
        id: point.id,
        category: point.category,
      },
    })),
  };
}

function getPointBounds(points: MapPoint[]): LngLatBoundsLike | null {
  if (points.length === 0) return null;

  const bounds = new maplibregl.LngLatBounds();
  for (const point of points) {
    bounds.extend([point.lng, point.lat]);
  }

  return bounds;
}

function mapStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: Object.fromEntries(
      MAP_THEMES.map((theme) => [
        `base-${theme.id}`,
        {
          type: 'raster',
          tiles: [...theme.tiles],
          tileSize: 256,
          attribution: theme.attribution,
        },
      ]),
    ) as maplibregl.StyleSpecification['sources'],
    layers: MAP_THEMES.map((theme) => ({
      id: `base-${theme.id}`,
      type: 'raster' as const,
      source: `base-${theme.id}`,
      layout: {
        visibility: theme.id === 'voyager' ? ('visible' as const) : ('none' as const),
      },
    })),
  };
}

function getMapPointFromEvent(
  event: MapLayerMouseEvent,
  pointsById: Map<string, MapPoint>,
): MapPoint | null {
  const feature = event.features?.[0];
  const id = typeof feature?.properties?.id === 'string' ? feature.properties.id : null;
  return id ? pointsById.get(id) ?? null : null;
}

export function MapExplorer({
  city,
  categories,
  points,
  selectedCategories,
  initialQuery,
  initialZoom,
  initialCenter,
  initialPointId,
}: MapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<{ popup: Popup; root: Root } | null>(null);
  const pointRefs = useRef({ points, selectedCategories });
  const visiblePointsRef = useRef<MapPoint[]>(points);
  const categoriesRef = useRef(categories);
  const initialStateRef = useRef({ city, initialCenter, initialZoom, initialPointId });
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [mapTheme, setMapTheme] = useState<MapThemeId>('voyager');

  const categoryIds = useMemo(() => categories.map((category) => category.id), [categories]);
  const queryNeedle = normalizeText(query.trim());
  const visiblePoints = useMemo(() => {
    if (!queryNeedle) return points;

    return points.filter((point) => {
      const haystack = normalizeText([point.name, point.badge ?? ''].join(' '));
      return haystack.includes(queryNeedle);
    });
  }, [points, queryNeedle]);

  const pointsByCategory = useMemo(() => {
    const buckets = new Map<MapCategoryId, MapPoint[]>();
    for (const category of categoryIds) buckets.set(category, []);
    for (const point of visiblePoints) buckets.get(point.category)?.push(point);
    return buckets;
  }, [categoryIds, visiblePoints]);

  const counts = useMemo(() => {
    return categoryIds.reduce(
      (acc, id) => {
        acc[id] = points.filter((point) => point.category === id).length;
        return acc;
      },
      {} as Record<MapCategoryId, number>,
    );
  }, [categoryIds, points]);

  const replaceUrl = useCallback(
    (updates: Record<string, string | null>, options: { server: boolean }) => {
      const nextParams = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value.length === 0) nextParams.delete(key);
        else nextParams.set(key, value);
      }

      const nextUrl = `${pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ''}`;
      if (options.server) {
        startTransition(() => router.replace(nextUrl, { scroll: false }));
        return;
      }

      window.history.replaceState(null, '', nextUrl);
    },
    [pathname, router],
  );

  const openPopup = useCallback((point: MapPoint, map: MapLibreMap) => {
    popupRef.current?.root.unmount();
    popupRef.current?.popup.remove();

    const popupNode = document.createElement('div');
    const root = createRoot(popupNode);
    root.render(<MapPopup point={point} />);

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 18,
      maxWidth: '280px',
      className: 'carmo-map-popup',
    })
      .setLngLat([point.lng, point.lat])
      .setDOMContent(popupNode)
      .addTo(map);

    popup.on('close', () => {
      root.unmount();
      if (popupRef.current?.popup === popup) popupRef.current = null;
    });

    popupRef.current = { popup, root };
    replaceUrl({ id: point.id }, { server: false });
  }, [replaceUrl]);

  const focusPoint = useCallback(
    (point: MapPoint) => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), 15), duration: 450 });
      openPopup(point, map);
    },
    [openPopup],
  );

  const updateViewportUrl = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    replaceUrl(
      {
        z: map.getZoom().toFixed(2),
        c: `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`,
      },
      { server: false },
    );
  }, [replaceUrl]);

  useEffect(() => {
    pointRefs.current = { points, selectedCategories };
  }, [points, selectedCategories]);

  useEffect(() => {
    visiblePointsRef.current = visiblePoints;
  }, [visiblePoints]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      replaceUrl({ q: query.trim() || null }, { server: false });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, replaceUrl]);

  useEffect(() => {
    const previousPaddingBottom = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '0px';

    return () => {
      document.body.style.paddingBottom = previousPaddingBottom;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialState = initialStateRef.current;
    const initialCategories = categoriesRef.current;
    const fallbackCenter = {
      lat: initialState.city.lat ?? DEFAULT_CENTER.lat,
      lng: initialState.city.lng ?? DEFAULT_CENTER.lng,
    };
    const center = initialState.initialCenter ?? fallbackCenter;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle(),
      center: [center.lng, center.lat],
      zoom: initialState.initialZoom ?? DEFAULT_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      for (const category of initialCategories) {
        const sourceId = `points-${category.id}`;
        const clusterLayerId = `${sourceId}-clusters`;
        const clusterCountLayerId = `${sourceId}-cluster-count`;
        const unclusteredLayerId = `${sourceId}-single`;

        map.addSource(sourceId, {
          type: 'geojson',
          data: toFeatureCollection(
            visiblePointsRef.current.filter((point) => point.category === category.id),
          ),
          cluster: true,
          clusterRadius: 42,
          clusterMaxZoom: 14,
        });

        map.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': category.color,
            'circle-radius': ['step', ['get', 'point_count'], 17, 12, 21, 40, 26],
            'circle-opacity': 0.9,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.addLayer({
          id: unclusteredLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': category.color,
            'circle-radius': 8,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.94,
          },
        });

        map.on('click', unclusteredLayerId, (event) => {
          const point = getMapPointFromEvent(event, new Map(pointRefs.current.points.map((item) => [item.id, item])));
          if (point) openPopup(point, map);
        });

        map.on('click', clusterLayerId, async (event) => {
          const features = map.queryRenderedFeatures(event.point, { layers: [clusterLayerId] });
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource(sourceId) as GeoJSONSource | undefined;
          if (typeof clusterId !== 'number' || !source) return;
          const zoom = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({ center: event.lngLat, zoom, duration: 350 });
        });

        map.on('mouseenter', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', clusterLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', clusterLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      if (!initialState.initialCenter) {
        const bounds = getPointBounds(pointRefs.current.points);
        if (bounds) map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 0 });
      }

      const targetPoint = initialState.initialPointId
        ? pointRefs.current.points.find((point) => point.id === initialState.initialPointId)
        : null;
      if (targetPoint) {
        map.jumpTo({
          center: [targetPoint.lng, targetPoint.lat],
          zoom: Math.max(initialState.initialZoom ?? 15, 15),
        });
        openPopup(targetPoint, map);
      }
    });

    let viewportTimeout: number | null = null;
    map.on('moveend', () => {
      if (viewportTimeout) window.clearTimeout(viewportTimeout);
      viewportTimeout = window.setTimeout(updateViewportUrl, 250);
    });

    return () => {
      if (viewportTimeout) window.clearTimeout(viewportTimeout);
      popupRef.current?.root.unmount();
      popupRef.current?.popup.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [openPopup, updateViewportUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    for (const category of categories) {
      const source = map.getSource(`points-${category.id}`) as GeoJSONSource | undefined;
      source?.setData(toFeatureCollection(pointsByCategory.get(category.id) ?? []));
    }
  }, [categories, pointsByCategory]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    for (const theme of MAP_THEMES) {
      map.setLayoutProperty(
        `base-${theme.id}`,
        'visibility',
        theme.id === mapTheme ? 'visible' : 'none',
      );
    }
  }, [mapTheme]);

  const toggleCategory = useCallback(
    (id: MapCategoryId) => {
      const current = new Set(selectedCategories);
      if (current.size === categoryIds.length) {
        current.clear();
        current.add(id);
      } else if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }

      const nextCategories = categoryIds.filter((categoryId) => current.has(categoryId));
      replaceUrl(
        {
          cats:
            nextCategories.length === categoryIds.length
              ? null
              : nextCategories.length === 0
                ? 'none'
                : nextCategories.join(','),
          id: null,
        },
        { server: true },
      );
    },
    [categoryIds, replaceUrl, selectedCategories],
  );

  return (
    <main
      className="relative min-h-[620px] overflow-hidden bg-paper"
      style={{ height: '100svh' }}
    >
      <div
        ref={mapContainerRef}
        aria-label={`Mapa de ${city.name}`}
        style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
      />
      <div className="absolute right-14 top-3 z-10 rounded-md border border-white/80 bg-white/95 p-1 shadow-pop backdrop-blur">
        <div className="flex items-center gap-1" aria-label="Tema do mapa">
          <span className="flex size-8 items-center justify-center text-ink-600">
            <Layers className="size-4" aria-hidden="true" />
          </span>
          {MAP_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setMapTheme(theme.id)}
              className={cn(
                'h-8 rounded-sm px-2 text-[11px] font-extrabold transition-colors',
                mapTheme === theme.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-paper-deep',
              )}
              aria-pressed={mapTheme === theme.id}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>
      <aside
        className={cn(
          'absolute left-4 top-4 z-10 hidden w-[360px] max-w-[calc(100vw-32px)] rounded-lg border p-3 shadow-pop backdrop-blur md:block',
          mapTheme === 'dark'
            ? 'border-sky-500/25 bg-slate-950/88 text-white'
            : 'border-white/70 bg-paper/94 text-ink-900',
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                'm-0 text-[12px] font-bold uppercase',
                mapTheme === 'dark' ? 'text-sky-300' : 'text-clay-700',
              )}
            >
              Guia interativo
            </p>
            <h1 className="m-0 mt-1 font-display text-[22px] font-extrabold">{city.name} no mapa</h1>
          </div>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => mapRef.current?.resize()} aria-label="Reajustar mapa">
            <LocateFixed className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <CategoryFilterBar
          categories={categories}
          selectedCategories={selectedCategories}
          counts={counts}
          query={query}
          onQueryChange={setQuery}
          onToggleCategory={toggleCategory}
          isDark={mapTheme === 'dark'}
        />
        <div className="mt-3 max-h-[42vh] overflow-y-auto pr-1">
          <PointList points={visiblePoints.slice(0, 80)} onSelect={focusPoint} isDark={mapTheme === 'dark'} />
        </div>
      </aside>
      <section
        className={cn(
          'absolute inset-x-2 bottom-3 z-10 rounded-lg border shadow-pop backdrop-blur transition-all md:hidden',
          mapTheme === 'dark'
            ? 'border-sky-500/25 bg-slate-950/90 text-white [&_p.text-ink-800]:text-slate-100'
            : 'border-white/70 bg-paper/96 text-ink-900',
          isSheetOpen ? 'max-h-[52svh]' : 'max-h-[74px]',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <div>
            <p
              className={cn(
                'm-0 text-[11px] font-bold uppercase',
                mapTheme === 'dark' ? 'text-sky-300' : 'text-clay-700',
              )}
            >
              Mapa de {city.name}
            </p>
            <p className="m-0 text-[13px] font-semibold text-ink-800">{visiblePoints.length} pontos visíveis</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setIsSheetOpen((value) => !value)}
            aria-label={isSheetOpen ? 'Recolher filtros' : 'Abrir filtros'}
          >
            {isSheetOpen ? <PanelBottomClose className="size-4" /> : <PanelBottomOpen className="size-4" />}
          </Button>
        </div>
        {isSheetOpen ? (
          <div className="space-y-3 overflow-y-auto px-3 pb-3">
            <CategoryFilterBar
              categories={categories}
              selectedCategories={selectedCategories}
              counts={counts}
              query={query}
              onQueryChange={setQuery}
              onToggleCategory={toggleCategory}
              isDark={mapTheme === 'dark'}
            />
            <PointList
              points={visiblePoints.slice(0, 60)}
              onSelect={focusPoint}
              compact
              isDark={mapTheme === 'dark'}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function PointList({
  points,
  onSelect,
  compact = false,
  isDark = false,
}: {
  points: MapPoint[];
  onSelect: (point: MapPoint) => void;
  compact?: boolean;
  isDark?: boolean;
}) {
  if (points.length === 0) {
    return (
      <p
        className={cn(
          'm-0 rounded-md p-3 text-[13px] font-medium',
          isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-ink-700',
        )}
      >
        Nenhum ponto encontrado com os filtros atuais.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', compact && 'pb-1')}>
      {points.map((point) => {
        const category = MAP_CATEGORY_BY_ID[point.category];
        const Icon = category.icon;

        return (
          <button
            key={`${point.category}-${point.id}`}
            type="button"
            onClick={() => onSelect(point)}
              className={cn(
                'group flex w-full items-stretch gap-0 overflow-hidden rounded-md border text-left shadow-sm transition-all',
                isDark
                ? 'border-slate-700 bg-slate-900/95 hover:border-sky-400/50 hover:bg-slate-800'
                : 'border-ink-100 bg-white hover:border-ink-200 hover:shadow-pop',
            )}
          >
            <span
              className="w-1.5 shrink-0"
              style={{ backgroundColor: isDark ? '#38bdf8' : category.color }}
              aria-hidden="true"
            />
            {point.thumb ? (
              <span className="m-2 block size-12 shrink-0 overflow-hidden rounded-md bg-paper-deep shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={point.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
            ) : (
              <span
                className={cn(
                  'm-2 flex size-10 shrink-0 items-center justify-center rounded-md text-white shadow-sm',
                  isDark ? 'bg-sky-500' : '',
                )}
                style={{ backgroundColor: isDark ? undefined : category.color }}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0 flex-1 py-2.5 pr-3">
              <span
                className={cn(
                  'block truncate text-[13px] font-extrabold leading-tight',
                  isDark ? 'text-white' : 'text-ink-900',
                )}
              >
                {point.name}
              </span>
              <span
                className={cn(
                  'mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold leading-tight',
                  isDark ? 'text-sky-100/80' : 'text-ink-600',
                )}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: isDark ? '#38bdf8' : category.color }}
                  aria-hidden="true"
                />
                <span className="truncate">{point.badge ?? category.label}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
