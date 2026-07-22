import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapPinCallout } from '@/components/explore/MapPinCallout';
import { MapMyLocationButton } from '@/components/maps/MapMyLocationButton';
import { BusinessCard } from '@/components/home/BusinessCard';
import { prefetchBusinessDetail } from '@/lib/api/business-detail';
import {
  fetchAccommodations,
  type AccommodationItem,
  type AccommodationsPayload,
} from '@/lib/api/accommodations';
import {
  fetchMapLayers,
  type MapPin,
  type MapPinKind,
} from '@/lib/api/map-layers';
import { palette, radius, shadows } from '@/lib/theme/tokens';
import {
  LISTING_GRID_GAP,
  LISTING_GRID_PADDING,
  useListingGridColumns,
} from '@/lib/ui/listing-grid';
import { openDirections } from '@/lib/maps/navigation';
import { useMapUserLocation } from '@/lib/maps/use-map-user-location';

type MappableItem = AccommodationItem & { lat: number; lng: number };

const DEFAULT_DELTA = { latitudeDelta: 0.12, longitudeDelta: 0.12 };

function withCoordinates(items: AccommodationItem[]): MappableItem[] {
  return items.filter(
    (item): item is MappableItem =>
      typeof item.lat === 'number' &&
      typeof item.lng === 'number' &&
      Number.isFinite(item.lat) &&
      Number.isFinite(item.lng),
  );
}

function regionForItems(items: MappableItem[], fallback: { lat: number; lng: number }): Region {
  if (items.length === 0) {
    return {
      latitude: fallback.lat,
      longitude: fallback.lng,
      ...DEFAULT_DELTA,
    };
  }
  const first = items[0];
  if (!first) {
    return {
      latitude: fallback.lat,
      longitude: fallback.lng,
      ...DEFAULT_DELTA,
    };
  }

  if (items.length === 1) {
    return {
      latitude: first.lat,
      longitude: first.lng,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }

  let minLat = first.lat;
  let maxLat = first.lat;
  let minLng = first.lng;
  let maxLng = first.lng;
  for (const item of items) {
    minLat = Math.min(minLat, item.lat);
    maxLat = Math.max(maxLat, item.lat);
    minLng = Math.min(minLng, item.lng);
    maxLng = Math.max(maxLng, item.lng);
  }

  const latPad = Math.max((maxLat - minLat) * 0.2, 0.02);
  const lngPad = Math.max((maxLng - minLng) * 0.2, 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat + latPad,
    longitudeDelta: maxLng - minLng + lngPad,
  };
}

type LayerToggle = Exclude<MapPinKind, 'pousada'>;

const LAYER_LABEL: Record<LayerToggle, string> = {
  comercio: 'Comércios',
  atracao: 'Atrações',
};

const PIN_COLOR: Record<MapPinKind, string> = {
  pousada: palette.cerrado700,
  comercio: palette.sky500,
  atracao: palette.cerrado500,
};

const TAB_BAR_CLEARANCE = 56;
const THUMB_MARKER_DELTA = 0.035;
const MAP_OVERLAY_CLEARANCE = 38;
const MAP_TOP_BAR_HEIGHT = 34;
const MAP_TOP_BAR_GAP = 10;

export function AccommodationMapScreen() {
  const insets = useSafeAreaInsets();
  const { granted: showsUserLocation, centerMapOnUser } = useMapUserLocation();
  const numColumns = useListingGridColumns();
  const listBottomInset = insets.bottom + TAB_BAR_CLEARANCE;
  const mapRef = useRef<MapView>(null);
  const [payload, setPayload] = useState<AccommodationsPayload | null>(null);
  const [extraPins, setExtraPins] = useState<MapPin[]>([]);
  const [activeLayers, setActiveLayers] = useState<Record<LayerToggle, boolean>>({
    comercio: false,
    atracao: true,
  });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accommodations, layers] = await Promise.all([
        fetchAccommodations(),
        fetchMapLayers('carmo-do-rio-claro', ['comercio', 'atracao']),
      ]);
      setPayload(accommodations);
      setExtraPins(layers.pins);
      const firstMappable = withCoordinates(accommodations.items)[0];
      setSelectedId(firstMappable?.id ?? accommodations.items[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLayer = useCallback((kind: LayerToggle) => {
    setActiveLayers((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  const visibleExtraPins = useMemo(
    () => extraPins.filter((pin) => activeLayers[pin.kind as LayerToggle]),
    [extraPins, activeLayers],
  );

  const openPin = useCallback((pin: MapPin) => {
    // Atrações no WebView; comércios e pousadas no detalhe nativo.
    if (pin.kind === 'atracao') {
      router.push(`/webview/turismo-o-que-fazer-${encodeURIComponent(pin.slug)}` as never);
      return;
    }
    router.push(`/comercio/${encodeURIComponent(pin.slug)}` as never);
  }, []);

  const openDetail = useCallback((slug: string) => {
    router.push(`/comercio/${encodeURIComponent(slug)}` as never);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mappableItems = useMemo(
    () => (payload ? withCoordinates(payload.items) : []),
    [payload],
  );

  const cityCenter = useMemo(
    () => ({
      lat: payload?.city?.lat ?? -20.9719,
      lng: payload?.city?.lng ?? -46.1189,
    }),
    [payload],
  );

  const initialRegion = useMemo(
    () => regionForItems(mappableItems, cityCenter),
    [mappableItems, cityCenter],
  );

  const showPhotoMarkers = (mapRegion ?? initialRegion).latitudeDelta <= THUMB_MARKER_DELTA;

  useEffect(() => {
    if (!mapRef.current || mappableItems.length < 2) return;
    mapRef.current.fitToCoordinates(
      mappableItems.map((item) => ({ latitude: item.lat, longitude: item.lng })),
      {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: true,
      },
    );
  }, [mappableItems]);

  const focusItem = useCallback(
    (item: AccommodationItem) => {
      setSelectedId(item.id);
      prefetchBusinessDetail(item.slug);
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        const currentRegion = mapRegion ?? initialRegion;
        mapRef.current?.animateToRegion(
          {
            latitude: item.lat,
            longitude: item.lng,
            latitudeDelta: currentRegion.latitudeDelta,
            longitudeDelta: currentRegion.longitudeDelta,
          },
          280,
        );
      }
    },
    [initialRegion, mapRegion],
  );

  const focusPin = useCallback((pin: MapPin) => {
    setSelectedId(pin.id);
    const currentRegion = mapRegion ?? initialRegion;
    mapRef.current?.animateToRegion(
      {
        latitude: pin.lat,
        longitude: pin.lng,
        latitudeDelta: currentRegion.latitudeDelta,
        longitudeDelta: currentRegion.longitudeDelta,
      },
      280,
    );
  }, [initialRegion, mapRegion]);

  const openItemDirections = useCallback((item: MappableItem) => {
    void openDirections({ lat: item.lat, lng: item.lng, name: item.name });
  }, []);

  const openPinDirections = useCallback((pin: MapPin) => {
    void openDirections({ lat: pin.lat, lng: pin.lng, name: pin.name });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AccommodationItem }) => (
      <BusinessCard
        slug={item.slug}
        name={item.name}
        category="Pousada"
        district={item.district ?? item.subtitle}
        rating={item.rating}
        reviewsCount={item.reviewsCount}
        coverUrl={item.coverUrl}
        fullWidth
        selected={item.id === selectedId}
        selectedColor={PIN_COLOR.pousada}
        onPress={() => openDetail(item.slug)}
        onPressIn={() => focusItem(item)}
      />
    ),
    [focusItem, openDetail, selectedId],
  );

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={palette.cerrado700} />
        <Text style={styles.loadingText}>Carregando hospedagens…</Text>
      </View>
    );
  }

  const cityName = payload?.city?.name ?? 'sua cidade';
  const categoryName = payload?.category.name ?? 'Pousadas';
  const mapTopBarTop = insets.top + 8;
  const myLocationTop = mapTopBarTop + MAP_TOP_BAR_HEIGHT + MAP_TOP_BAR_GAP;

  return (
    <View style={styles.root}>
      <View style={[styles.mapWrap, { paddingTop: insets.top }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={false}
          mapType="standard"
          legalLabelInsets={{ top: 0, right: 0, bottom: MAP_OVERLAY_CLEARANCE, left: 12 }}
          mapPadding={{
            top: myLocationTop + MAP_TOP_BAR_HEIGHT + 8,
            right: 12,
            bottom: MAP_OVERLAY_CLEARANCE,
            left: 12,
          }}
          onRegionChangeComplete={setMapRegion}
        >
          {mappableItems.map((item) => {
            const selected = item.id === selectedId;
            const showThumb = showPhotoMarkers && !!item.coverUrl;

            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                pinColor={selected ? PIN_COLOR.pousada : palette.sky500}
                onPress={() => focusItem(item)}
              >
                {showThumb ? (
                  <View
                    style={[
                      styles.photoMarker,
                      selected && { borderColor: PIN_COLOR.pousada, transform: [{ scale: 1.08 }] },
                    ]}
                  >
                    <Image source={{ uri: item.coverUrl! }} style={styles.photoMarkerImage} contentFit="cover" />
                  </View>
                ) : undefined}
                <MapPinCallout
                  title={item.name}
                  subtitle={item.district ?? item.subtitle}
                  imageUrl={item.coverUrl}
                  accentColor={PIN_COLOR.pousada}
                  onOpen={() => openDetail(item.slug)}
                  onDirections={() => openItemDirections(item)}
                />
              </Marker>
            );
          })}
          {visibleExtraPins.map((pin) => {
            const selected = pin.id === selectedId;
            const showThumb = showPhotoMarkers && !!pin.coverUrl;

            return (
              <Marker
                key={pin.id}
                coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                pinColor={selected ? PIN_COLOR[pin.kind] : PIN_COLOR[pin.kind]}
                onPress={() => focusPin(pin)}
              >
                {showThumb ? (
                  <View
                    style={[
                      styles.photoMarker,
                      selected && { borderColor: PIN_COLOR[pin.kind], transform: [{ scale: 1.08 }] },
                    ]}
                  >
                    <Image source={{ uri: pin.coverUrl! }} style={styles.photoMarkerImage} contentFit="cover" />
                  </View>
                ) : undefined}
                <MapPinCallout
                  title={pin.name}
                  subtitle={pin.subtitle ?? pin.categoryLabel}
                  imageUrl={pin.coverUrl}
                  accentColor={PIN_COLOR[pin.kind]}
                  onOpen={() => openPin(pin)}
                  onDirections={() => openPinDirections(pin)}
                />
              </Marker>
            );
          })}
        </MapView>

        <View style={[styles.mapBadge, { top: mapTopBarTop }]}>
          <Ionicons name="map" size={14} color={palette.cerrado700} />
          <Text style={styles.mapBadgeText}>
            {categoryName} · {cityName}
          </Text>
        </View>

        <View style={[styles.layerChips, { top: mapTopBarTop }]}>
          {(Object.keys(LAYER_LABEL) as LayerToggle[]).map((kind) => {
            const active = activeLayers[kind];
            const count = extraPins.filter((p) => p.kind === kind).length;
            return (
              <Pressable
                key={kind}
                onPress={() => toggleLayer(kind)}
                style={[styles.layerChip, active && styles.layerChipActive]}
              >
                <View style={[styles.layerDot, { backgroundColor: PIN_COLOR[kind] }]} />
                <Text style={[styles.layerChipText, active && styles.layerChipTextActive]}>
                  {LAYER_LABEL[kind]}
                  {count > 0 ? ` · ${count}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <MapMyLocationButton
          mapRef={mapRef}
          granted={showsUserLocation}
          onCenter={centerMapOnUser}
          style={{ top: myLocationTop, right: 12 }}
        />

      </View>

      <View style={styles.listPanel}>
        <View style={styles.listHeader}>
          <Text style={styles.listHeading}>Onde ficar</Text>
          <Text style={styles.listCount}>
            {payload?.items.length ?? 0} opções
            {mappableItems.length > 0 ? ` · ${mappableItems.length} no mapa` : ''}
          </Text>
        </View>

        {payload && payload.items.length > 0 ? (
          <FlatList
            key={`lodging-grid-${numColumns}`}
            data={payload.items}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
            contentContainerStyle={[styles.listContent, { paddingBottom: listBottomInset }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nenhuma hospedagem publicada ainda. Tente de novo mais tarde.
            </Text>
            <Pressable onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryText}>Atualizar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.paper,
  },
  loadingText: { color: palette.ink600, fontWeight: '600' },
  mapWrap: { height: '42%', backgroundColor: palette.sky100 },
  photoMarker: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: palette.white,
    overflow: 'hidden',
    backgroundColor: palette.white,
    ...shadows.card,
  },
  photoMarkerImage: {
    width: '100%',
    height: '100%',
  },
  mapBadge: {
    position: 'absolute',
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    ...shadows.card,
  },
  mapBadgeText: { fontSize: 12, fontWeight: '800', color: palette.ink900 },
  layerChips: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  layerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    ...shadows.card,
  },
  layerChipActive: {
    backgroundColor: palette.cerrado100,
    borderColor: palette.cerrado500,
  },
  layerDot: { width: 8, height: 8, borderRadius: 4 },
  layerChipText: { fontSize: 11, fontWeight: '700', color: palette.ink600 },
  layerChipTextActive: { color: palette.cerrado700 },
  listPanel: {
    flex: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    marginTop: -12,
    backgroundColor: palette.paper,
    ...shadows.pop,
  },
  listHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  listHeading: { fontSize: 20, fontWeight: '900', color: palette.ink900 },
  listCount: { marginTop: 2, fontSize: 13, fontWeight: '600', color: palette.ink600 },
  listContent: {
    paddingHorizontal: LISTING_GRID_PADDING,
  },
  gridRow: {
    gap: LISTING_GRID_GAP,
    marginBottom: LISTING_GRID_GAP,
  },
  empty: { padding: 24, alignItems: 'center', gap: 12 },
  emptyText: { textAlign: 'center', color: palette.ink600, fontWeight: '600', lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.cerrado700,
  },
  retryText: { color: palette.white, fontWeight: '800' },
});
