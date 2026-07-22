import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker, type Region } from 'react-native-maps';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreListingCard } from '@/components/explore/ExploreListingCard';
import { MapPinCallout } from '@/components/explore/MapPinCallout';
import { MapMyLocationButton } from '@/components/maps/MapMyLocationButton';
import { TabsScreen } from '@/components/ui/TabsScreen';
import { useTabBarScrollPadding } from '@/lib/ui/tab-bar-inset';
import { BusinessCard } from '@/components/home/BusinessCard';
import {
  fetchMapLayers,
  type MapLayersPayload,
  type MapPin,
} from '@/lib/api/map-layers';
import { cachedJson } from '@/lib/api/cached-json';
import { prefetchBusinessDetail } from '@/lib/api/business-detail';
import { env } from '@/lib/env';
import {
  EXPLORE_TOP_CATEGORIES,
  cacheKeyForCategory,
  findCategory,
  type ExploreCategory,
} from '@/lib/explore/categories';
import { fetchTopBusinessCategories } from '@/lib/api/business-categories';
import { ioniconForCategory } from '@/lib/explore/category-icon-map';
import { openDirections } from '@/lib/maps/navigation';
import { useMapUserLocation } from '@/lib/maps/use-map-user-location';
import { palette, radius, shadows } from '@/lib/theme/tokens';
import {
  LISTING_GRID_GAP,
  LISTING_GRID_PADDING,
  useListingGridColumns,
} from '@/lib/ui/listing-grid';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAP_HEIGHT_MIN = SCREEN_HEIGHT * 0.32;
const MAP_HEIGHT_MAX = SCREEN_HEIGHT * 0.85;
const SNAPS = [SCREEN_HEIGHT * 0.42, SCREEN_HEIGHT * 0.62, SCREEN_HEIGHT * 0.85];
const TAP_THRESHOLD = 6;
const THUMB_MARKER_DELTA = 0.035;
const MAP_OVERLAY_CLEARANCE = 38;
const MAP_TOP_BAR_HEIGHT = 38;
const MAP_TOP_BAR_GAP = 10;

function nearestSnap(value: number): number {
  return SNAPS.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a));
}

type SortKey = 'destaques' | 'avaliacao' | 'nome';

const DEFAULT_DELTA = { latitudeDelta: 0.12, longitudeDelta: 0.12 };

function regionForPins(pins: MapPin[], fallback: { lat: number; lng: number }): Region {
  if (pins.length === 0) {
    return { latitude: fallback.lat, longitude: fallback.lng, ...DEFAULT_DELTA };
  }
  const first = pins[0]!;
  if (pins.length === 1) {
    return { latitude: first.lat, longitude: first.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  }
  let minLat = first.lat, maxLat = first.lat, minLng = first.lng, maxLng = first.lng;
  for (const p of pins) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
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

type Props = {
  initialCategory?: string;
};

export function ExploreMapScreen({ initialCategory }: Props) {
  const insets = useSafeAreaInsets();
  const { granted: showsUserLocation, centerMapOnUser } = useMapUserLocation();
  const listBottomInset = useTabBarScrollPadding(12);
  const numColumns = useListingGridColumns();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{ cat?: string }>();
  const initialKey = params.cat ?? initialCategory ?? 'tudo';
  const [payload, setPayload] = useState<MapLayersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryKey, setCategoryKey] = useState<string>(initialKey);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapHeight = useSharedValue(SNAPS[0]!);
  const dragStart = useSharedValue(SNAPS[0]!);

  const mapWrapAnimatedStyle = useAnimatedStyle(() => ({ height: mapHeight.value }));

  useEffect(() => {
    if (params.cat && params.cat !== categoryKey) {
      setCategoryKey(params.cat);
    }
  }, [params.cat, categoryKey]);

  const [moreCategories, setMoreCategories] = useState<ExploreCategory[]>([]);
  const [moreCategoriesLoaded, setMoreCategoriesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTopBusinessCategories().then((rows) => {
      if (cancelled) return;
      if (__DEV__) console.log('[ExploreMap] fetchTopBusinessCategories rows:', rows.length);
      setMoreCategories(
        rows.map((row) => ({
          key: row.slug,
          label: row.name,
          short: row.name,
          icon: ioniconForCategory(row.icon),
          color: palette.cerrado700,
          kinds: ['comercio'],
          businessCategorySlug: row.slug,
        })),
      );
      setMoreCategoriesLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeDef = useMemo<ExploreCategory>(
    () => findCategory(categoryKey, moreCategories),
    [categoryKey, moreCategories],
  );

  const sheetGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .onBegin(() => {
        'worklet';
        dragStart.value = mapHeight.value;
      })
      .onUpdate((e) => {
        'worklet';
        const next = Math.max(
          MAP_HEIGHT_MIN,
          Math.min(MAP_HEIGHT_MAX, dragStart.value + e.translationY),
        );
        mapHeight.value = next;
      })
      .onEnd((e) => {
        'worklet';
        const moved = Math.abs(e.translationY) >= TAP_THRESHOLD;
        const clampedRaw = Math.max(
          MAP_HEIGHT_MIN,
          Math.min(MAP_HEIGHT_MAX, dragStart.value + e.translationY),
        );
        let target: number;
        if (moved) {
          let best = SNAPS[0]!;
          for (const s of SNAPS) {
            if (Math.abs(s - clampedRaw) < Math.abs(best - clampedRaw)) best = s;
          }
          target = best;
        } else {
          target = dragStart.value >= SNAPS[1]! ? SNAPS[0]! : SNAPS[2]!;
        }
        dragStart.value = target;
        mapHeight.value = withTiming(target, { duration: 220 });
      });
    return pan;
  }, [mapHeight, dragStart]);

  // Filtros (resetam ao trocar categoria)
  const [sort, setSort] = useState<SortKey>('destaques');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyWhatsapp, setOnlyWhatsapp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const citySlug = env.defaultCitySlug;
    const key = cacheKeyForCategory(citySlug, activeDef);
    cachedJson<MapLayersPayload>(
      key,
      () =>
        fetchMapLayers(citySlug, activeDef.kinds, {
          businessCategorySlug: activeDef.businessCategorySlug,
        }),
      { ttlMs: 2 * 60 * 1000 },
    )
      .then((data) => {
        if (cancelled) return;
        if (data) setPayload(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDef]);

  const categoryPins = useMemo(() => payload?.pins ?? [], [payload]);

  const hasNonAttraction = useMemo(
    () => activeDef.kinds.some((k) => k !== 'atracao'),
    [activeDef.kinds],
  );

  const filteredPins = useMemo(() => {
    let list = categoryPins;
    if (onlyFeatured) list = list.filter((p) => p.featured);
    if (onlyWhatsapp && hasNonAttraction) list = list.filter((p) => p.hasWhatsapp);
    const sorted = [...list];
    if (sort === 'avaliacao') {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === 'nome') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || (b.rating ?? 0) - (a.rating ?? 0));
    }
    return sorted;
  }, [categoryPins, onlyFeatured, onlyWhatsapp, sort, hasNonAttraction]);

  const cityCenter = useMemo(
    () => ({ lat: payload?.city?.lat ?? -20.9719, lng: payload?.city?.lng ?? -46.1189 }),
    [payload],
  );

  const initialRegion = useMemo(
    () => regionForPins(filteredPins, cityCenter),
    [filteredPins, cityCenter],
  );

  const showPhotoMarkers = (mapRegion ?? initialRegion).latitudeDelta <= THUMB_MARKER_DELTA;

  useEffect(() => {
    if (!mapRef.current || filteredPins.length < 2) return;
    mapRef.current.fitToCoordinates(
      filteredPins.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      { edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true },
    );
  }, [filteredPins]);

  // Limpa seleção quando troca categoria
  useEffect(() => {
    setSelectedId(filteredPins[0]?.id ?? null);
  }, [categoryKey, filteredPins]);

  const selectPin = useCallback((pin: MapPin) => {
    setSelectedId(pin.id);
  }, []);

  const focusPin = useCallback((pin: MapPin) => {
    setSelectedId(pin.id);
    if (pin.kind !== 'atracao') prefetchBusinessDetail(pin.slug);
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

  const openDetail = useCallback((pin: MapPin) => {
    // Atrações seguem no WebView; comércios e pousadas abrem o detalhe nativo.
    if (pin.kind === 'atracao') {
      router.push(`/webview/turismo-o-que-fazer-${encodeURIComponent(pin.slug)}` as never);
      return;
    }
    router.push(`/comercio/${encodeURIComponent(pin.slug)}` as never);
  }, []);

  const openPinDirections = useCallback((pin: MapPin) => {
    void openDirections({ lat: pin.lat, lng: pin.lng, name: pin.name });
  }, []);

  const resetFilters = useCallback(() => {
    setSort('destaques');
    setOnlyFeatured(false);
    setOnlyWhatsapp(false);
  }, []);

  const filterActiveCount = (sort !== 'destaques' ? 1 : 0) + (onlyFeatured ? 1 : 0) + (onlyWhatsapp ? 1 : 0);

  const renderItem = useCallback(
    ({ item }: { item: MapPin }) => {
      if (item.kind === 'atracao') {
        return (
          <ExploreListingCard
            name={item.name}
            subtitle={item.subtitle}
            description={item.description}
            coverUrl={item.coverUrl}
            photoUrls={item.photoUrls}
            rating={item.rating}
            reviewsCount={item.reviewsCount}
            featured={item.featured}
            selected={item.id === selectedId}
            accentColor={activeDef.color}
            onPress={() => openDetail(item)}
            onPressIn={() => focusPin(item)}
          />
        );
      }

      return (
        <BusinessCard
          slug={item.slug}
          name={item.name}
          category={item.categoryLabel}
          district={item.subtitle}
          rating={item.rating}
          reviewsCount={item.reviewsCount}
          coverUrl={item.coverUrl}
          fullWidth
          selected={item.id === selectedId}
          selectedColor={activeDef.color}
          onPress={() => openDetail(item)}
          onPressIn={() => focusPin(item)}
        />
      );
    },
    [activeDef, focusPin, openDetail, selectedId],
  );

  if (loading && !payload) {
    return (
      <TabsScreen style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={palette.cerrado700} />
        <Text style={styles.loadingText}>Carregando {activeDef.short.toLowerCase()}…</Text>
      </TabsScreen>
    );
  }

  const cityName = payload?.city?.name ?? 'Carmo do Rio Claro';
  const mapTopBarTop = insets.top + 8;
  const myLocationTop = mapTopBarTop + MAP_TOP_BAR_HEIGHT + MAP_TOP_BAR_GAP;

  return (
    <TabsScreen style={styles.root}>
      <Animated.View style={[styles.mapWrap, { paddingTop: insets.top }, mapWrapAnimatedStyle]}>
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
          {filteredPins.map((pin) => {
            const selected = pin.id === selectedId;
            const showThumb = showPhotoMarkers && !!pin.coverUrl;

            return (
              <Marker
                key={`${pin.id}-${showThumb ? 'thumb' : 'pin'}`}
                coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                pinColor={selected ? activeDef.color : palette.ink400}
                tracksViewChanges={showThumb}
                onPress={() => selectPin(pin)}
              >
                {showThumb ? (
                  <View
                    style={[
                      styles.photoMarker,
                      selected && { borderColor: activeDef.color, transform: [{ scale: 1.08 }] },
                    ]}
                  >
                    <Image source={{ uri: pin.coverUrl! }} style={styles.photoMarkerImage} contentFit="cover" />
                  </View>
                ) : undefined}
                <MapPinCallout
                  title={pin.name}
                  subtitle={pin.subtitle ?? pin.categoryLabel}
                  imageUrl={pin.coverUrl}
                  accentColor={activeDef.color}
                  onOpen={() => openDetail(pin)}
                  onDirections={() => openPinDirections(pin)}
                />
              </Marker>
            );
          })}
        </MapView>

        <View style={[styles.topBar, { top: mapTopBarTop }]}>
          <View style={styles.cityBadge}>
            {loading ? (
              <ActivityIndicator size="small" color={palette.cerrado700} />
            ) : (
              <Ionicons name="location" size={13} color={palette.cerrado700} />
            )}
            <Text style={styles.cityBadgeText}>{cityName}</Text>
          </View>

          <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options" size={16} color={palette.ink900} />
            {filterActiveCount > 0 ? (
              <View style={styles.filterDot}>
                <Text style={styles.filterDotText}>{filterActiveCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <MapMyLocationButton
          mapRef={mapRef}
          granted={showsUserLocation}
          onCenter={centerMapOnUser}
          style={{ top: myLocationTop, right: 12 }}
        />

      </Animated.View>

      <View style={styles.listPanel}>
        <GestureDetector gesture={sheetGesture}>
          <View style={styles.dragHandle}>
            <View style={styles.dragBar} />
          </View>
        </GestureDetector>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          {EXPLORE_TOP_CATEGORIES.map((c) => {
            const active = c.key === categoryKey;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategoryKey(c.key)}
                style={[styles.categoryChip, active && { backgroundColor: c.color, borderColor: c.color }]}
              >
                <Ionicons name={c.icon} size={14} color={active ? palette.white : palette.ink900} />
                <Text style={[styles.categoryChipText, active && { color: palette.white }]}>
                  {c.short}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setMoreOpen(true)}
            style={[
              styles.categoryChip,
              moreCategories.some((c) => c.key === categoryKey) && {
                backgroundColor: activeDef.color,
                borderColor: activeDef.color,
              },
            ]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={14}
              color={
                moreCategories.some((c) => c.key === categoryKey)
                  ? palette.white
                  : palette.ink900
              }
            />
            <Text
              style={[
                styles.categoryChipText,
                moreCategories.some((c) => c.key === categoryKey) && {
                  color: palette.white,
                },
              ]}
            >
              {moreCategories.find((c) => c.key === categoryKey)?.short ?? 'Mais'}
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listHeading}>{activeDef.label}</Text>
          <Text style={styles.listCount}>{filteredPins.length} no mapa</Text>
        </View>

        {filteredPins.length > 0 ? (
          <FlatList
            key={`explore-grid-${numColumns}`}
            data={filteredPins}
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
              Nada por aqui{filterActiveCount > 0 ? ' com esses filtros' : ''}.
            </Text>
            {filterActiveCount > 0 ? (
              <Pressable onPress={resetFilters} style={styles.retryBtn}>
                <Text style={styles.retryText}>Limpar filtros</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <FilterSheet
        topInset={insets.top}
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        category={activeDef}
        sort={sort}
        onChangeSort={setSort}
        onlyFeatured={onlyFeatured}
        onChangeOnlyFeatured={setOnlyFeatured}
        onlyWhatsapp={onlyWhatsapp}
        onChangeOnlyWhatsapp={setOnlyWhatsapp}
        onReset={resetFilters}
      />

      <MoreCategoriesSheet
        topInset={insets.top}
        visible={moreOpen}
        activeKey={categoryKey}
        categories={moreCategories}
        loaded={moreCategoriesLoaded}
        onClose={() => setMoreOpen(false)}
        onPick={(key) => {
          setCategoryKey(key);
          setMoreOpen(false);
        }}
      />
    </TabsScreen>
  );
}

type MoreSheetProps = {
  visible: boolean;
  activeKey: string;
  categories: ExploreCategory[];
  loaded: boolean;
  topInset: number;
  onClose: () => void;
  onPick: (key: string) => void;
};

function MoreCategoriesSheet({ visible, activeKey, categories, loaded, topInset, onClose, onPick }: MoreSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Mais categorias</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={palette.ink900} />
          </Pressable>
        </View>
        <ScrollView
          style={{ maxHeight: SCREEN_HEIGHT - topInset - 140 }}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {categories.length === 0 ? (
            <Text style={{ textAlign: 'center', color: palette.ink600, padding: 16 }}>
              {loaded ? 'Sem categorias cadastradas nesta cidade.' : 'Carregando categorias…'}
            </Text>
          ) : null}
          {categories.map((c) => {
            const active = c.key === activeKey;
            return (
              <Pressable
                key={c.key}
                onPress={() => onPick(c.key)}
                style={[styles.moreRow, active && { backgroundColor: palette.paperDeep, borderColor: c.color }]}
              >
                <View style={[styles.moreIcon, { backgroundColor: c.color }]}>
                  <Ionicons name={c.icon} size={18} color={palette.white} />
                </View>
                <Text style={styles.moreLabel}>{c.label}</Text>
                {active ? <Ionicons name="checkmark" size={20} color={c.color} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

type FilterSheetProps = {
  visible: boolean;
  topInset: number;
  onClose: () => void;
  category: ExploreCategory;
  sort: SortKey;
  onChangeSort: (s: SortKey) => void;
  onlyFeatured: boolean;
  onChangeOnlyFeatured: (b: boolean) => void;
  onlyWhatsapp: boolean;
  onChangeOnlyWhatsapp: (b: boolean) => void;
  onReset: () => void;
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'destaques', label: 'Destaques primeiro' },
  { key: 'avaliacao', label: 'Melhor avaliados' },
  { key: 'nome', label: 'Ordem alfabética' },
];

function FilterSheet({
  visible, topInset, onClose, category, sort, onChangeSort,
  onlyFeatured, onChangeOnlyFeatured, onlyWhatsapp, onChangeOnlyWhatsapp, onReset,
}: FilterSheetProps) {
  const showWhatsappFilter = category.kinds.some((k) => k !== 'atracao');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight: SCREEN_HEIGHT - topInset - 12 }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 4 }} showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filtrar {category.label.toLowerCase()}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={palette.ink900} />
          </Pressable>
        </View>

        <Text style={styles.sheetLabel}>Ordenar por</Text>
        <View style={styles.sortGroup}>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.key === sort;
            return (
              <Pressable
                key={opt.key}
                onPress={() => onChangeSort(opt.key)}
                style={[styles.sortOption, active && { borderColor: category.color, backgroundColor: palette.paperDeep }]}
              >
                <View style={[styles.radio, active && { borderColor: category.color }]}>
                  {active ? <View style={[styles.radioDot, { backgroundColor: category.color }]} /> : null}
                </View>
                <Text style={styles.sortOptionText}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sheetLabel}>Mais</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Ionicons name="star" size={15} color={palette.clay500} />
            <Text style={styles.switchText}>Somente destaques</Text>
          </View>
          <Switch
            value={onlyFeatured}
            onValueChange={onChangeOnlyFeatured}
            trackColor={{ false: palette.ink100, true: category.color }}
          />
        </View>
        {showWhatsappFilter ? (
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="logo-whatsapp" size={15} color={palette.cerrado500} />
              <Text style={styles.switchText}>Atende por WhatsApp</Text>
            </View>
            <Switch
              value={onlyWhatsapp}
              onValueChange={onChangeOnlyWhatsapp}
              trackColor={{ false: palette.ink100, true: category.color }}
            />
          </View>
        ) : null}

        <View style={styles.sheetActions}>
          <Pressable style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>Limpar</Text>
          </Pressable>
          <Pressable style={[styles.applyBtn, { backgroundColor: category.color }]} onPress={onClose}>
            <Text style={styles.applyBtnText}>Aplicar</Text>
          </Pressable>
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: palette.paper },
  loadingText: { color: palette.ink600, fontWeight: '600' },
  mapWrap: { backgroundColor: palette.sky100 },
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

  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    ...shadows.card,
  },
  cityBadgeText: { fontSize: 12, fontWeight: '800', color: palette.ink900 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    ...shadows.card,
  },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDotText: { fontSize: 10, fontWeight: '900', color: palette.white },

  listPanel: {
    flex: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    marginTop: -12,
    backgroundColor: palette.paper,
    ...shadows.pop,
  },
  dragHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.ink400,
    opacity: 0.5,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 4,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    minWidth: 96,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 6,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  moreIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreLabel: { flex: 1, fontSize: 15, fontWeight: '800', color: palette.ink900 },
  categoryChipText: { fontSize: 12, fontWeight: '800', color: palette.ink900 },

  listHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
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
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: palette.cerrado700 },
  retryText: { color: palette.white, fontWeight: '800' },

  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.ink100,
    marginBottom: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: palette.ink900 },
  sheetLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.ink600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  sortGroup: { gap: 6 },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.ink400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  sortOptionText: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    marginBottom: 6,
  },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchText: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  applyBtn: { flex: 2, paddingVertical: 13, borderRadius: radius.pill, alignItems: 'center' },
  applyBtnText: { fontSize: 14, fontWeight: '900', color: palette.white },
});
