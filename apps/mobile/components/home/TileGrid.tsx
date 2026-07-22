import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';

type Tone = 'cerrado' | 'sky' | 'clay' | 'sun' | 'paper';
export type TileGridItem = {
  title: string;
  subtitle: string;
  href: string;
  icon?: keyof typeof Ionicons.glyphMap;
  illo?: string;
  tone?: Tone;
};

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  cerrado: { bg: palette.cerrado500, fg: palette.white },
  sky: { bg: palette.sky700, fg: palette.white },
  clay: { bg: palette.clay500, fg: palette.white },
  sun: { bg: palette.sun500, fg: palette.ink900 },
  paper: { bg: palette.paperDeep, fg: palette.ink900 },
};

export function TileGrid({ tiles }: { tiles: TileGridItem[] }) {
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => {
        const t = toneMap[tile.tone ?? 'paper'];
        return (
          <Pressable
            key={tile.href}
            onPress={() => router.push(tile.href as never)}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
              {tile.illo ? (
                <Text style={styles.illo}>{tile.illo}</Text>
              ) : (
                <Ionicons name={tile.icon ?? 'ellipse-outline'} size={22} color={t.fg} />
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {tile.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {tile.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    padding: 14,
    gap: 4,
    ...shadows.card,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { color: palette.ink900, fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },
  subtitle: { color: palette.ink600, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  illo: { fontSize: 22 },
});
