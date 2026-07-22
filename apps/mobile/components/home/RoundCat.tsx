import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shadows } from '@/lib/theme/tokens';

type BgTone = 'cerrado' | 'sky' | 'clay' | 'sun' | 'paperDeep';

const bgMap: Record<BgTone, { bg: string; fg: string }> = {
  cerrado: { bg: palette.cerrado500, fg: palette.white },
  sky: { bg: palette.sky700, fg: palette.white },
  clay: { bg: palette.clay500, fg: palette.white },
  sun: { bg: palette.sun500, fg: palette.ink900 },
  paperDeep: { bg: palette.paperDeep, fg: palette.ink900 },
};

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: BgTone;
  href: string;
};

export function RoundCat({ label, icon, tone = 'cerrado', href }: Props) {
  const styleSet = bgMap[tone];
  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <View style={[styles.circle, { backgroundColor: styleSet.bg }, shadows.card]}>
        <Ionicons name={icon} size={30} color={styleSet.fg} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 76, gap: 8 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.ink900,
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: -0.1,
  },
});
