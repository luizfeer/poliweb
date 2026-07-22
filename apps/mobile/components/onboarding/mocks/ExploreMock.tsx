import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

const CATEGORIES: Array<{ label: string; icon: keyof typeof Ionicons.glyphMap; active?: boolean }> = [
  { label: 'Restaurantes', icon: 'restaurant', active: true },
  { label: 'Pousadas', icon: 'bed' },
  { label: 'Atrações', icon: 'leaf' },
  { label: 'Comércios', icon: 'storefront' },
];

const PINS = [
  { top: 14, left: 24, color: palette.clay500, icon: 'restaurant' as const },
  { top: 36, left: 86, color: palette.clay500, icon: 'restaurant' as const },
  { top: 22, left: 140, color: palette.cerrado700, icon: 'bed' as const },
  { top: 62, left: 56, color: palette.sky700, icon: 'water' as const },
  { top: 70, left: 132, color: palette.clay500, icon: 'restaurant' as const },
];

const RESULTS: Array<{
  title: string;
  meta: string;
  tag: string;
  thumb: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    title: 'Tempero da Roça',
    meta: '★ 4.9 · 380 m · Aberto',
    tag: 'Mineira',
    thumb: palette.clay500,
    icon: 'restaurant',
  },
  {
    title: 'Cantinho do Pescador',
    meta: '★ 4.7 · 1,1 km · Aberto',
    tag: 'Peixaria',
    thumb: palette.sky700,
    icon: 'fish',
  },
];

export function ExploreMock() {
  return (
    <View style={styles.wrap}>
      {/* Top bar: menu + search + filtro */}
      <View style={styles.topBar}>
        <View style={styles.iconBtn}>
          <Ionicons name="menu" size={12} color={palette.ink900} />
        </View>
        <View style={styles.searchPill}>
          <Ionicons name="search" size={10} color={palette.ink400} />
          <Text style={styles.searchText}>Buscar em Carmo</Text>
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name="options" size={12} color={palette.ink900} />
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <View
            key={c.label}
            style={[styles.chip, c.active ? styles.chipActive : null]}
          >
            <Ionicons
              name={c.icon}
              size={9}
              color={c.active ? palette.white : palette.ink600}
            />
            <Text style={[styles.chipText, c.active ? styles.chipTextActive : null]}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Mapa estilizado */}
      <View style={styles.mapWrap}>
        <LinearGradient
          colors={['#DDE8D5', '#B9D2BD']}
          style={styles.map}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.road, { top: 26, left: -20, width: 240, transform: [{ rotate: '-10deg' }] }]} />
          <View style={[styles.road, { top: 60, left: -10, width: 240, transform: [{ rotate: '4deg' }] }]} />
          <View style={[styles.road, { top: 0, left: 78, width: 4, height: 110 }]} />
          <View style={[styles.water, { top: 78, left: 88, width: 80, height: 24 }]} />

          {PINS.map((p, i) => (
            <View
              key={i}
              style={[styles.pin, { top: p.top, left: p.left, backgroundColor: p.color }]}
            >
              <Ionicons name={p.icon} size={8} color={palette.white} />
            </View>
          ))}
        </LinearGradient>
      </View>

      {/* Cards de resultado */}
      <View style={{ gap: 6 }}>
        {RESULTS.map((r) => (
          <View key={r.title} style={styles.card}>
            <View style={[styles.thumb, { backgroundColor: r.thumb }]}>
              <Ionicons name={r.icon} size={12} color={palette.white} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {r.title}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {r.meta}
              </Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{r.tag}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.white,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  searchText: { fontSize: 9, color: palette.ink400, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: palette.white,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  chipActive: {
    backgroundColor: palette.clay500,
    borderColor: palette.clay500,
  },
  chipText: { fontSize: 8, fontWeight: '800', color: palette.ink900 },
  chipTextActive: { color: palette.white },
  mapWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 108,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  map: { flex: 1, position: 'relative' },
  road: {
    position: 'absolute',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 2,
  },
  water: {
    position: 'absolute',
    backgroundColor: '#9EC7E1',
    borderRadius: 8,
    opacity: 0.85,
  },
  pin: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: palette.white,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  thumb: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 10, fontWeight: '900', color: palette.ink900 },
  cardMeta: { fontSize: 8, color: palette.ink600, fontWeight: '600' },
  tag: {
    backgroundColor: palette.clay50,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 7, fontWeight: '800', color: palette.clay600, letterSpacing: 0.3 },
});
