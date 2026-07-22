import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';

type Tone = 'sun' | 'clay' | 'cerrado' | 'sky';
type Item = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  tone: Tone;
};

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  sun: { bg: palette.sun500, fg: palette.ink900 },
  clay: { bg: palette.clay500, fg: palette.white },
  cerrado: { bg: palette.cerrado500, fg: palette.white },
  sky: { bg: palette.sky700, fg: palette.white },
};

const DEFAULT_ITEMS: Item[] = [
  {
    title: 'Tem um evento?',
    description: 'Festas, feiras, encontros e shows da cidade',
    icon: 'calendar',
    href: '/webview/comunidade-agenda',
    tone: 'sun',
  },
  {
    title: 'Achados e perdidos',
    description: 'Mural pra reunir quem perdeu e quem encontrou',
    icon: 'search',
    href: '/webview/comunidade-achados',
    tone: 'clay',
  },
  {
    title: 'Grupos e coletivos',
    description: 'Associações, ONGs, esportes e iniciativas locais',
    icon: 'people',
    href: '/webview/comunidade-grupos',
    tone: 'cerrado',
  },
  {
    title: 'Sua igreja já está aqui?',
    description: 'Horários de missa, culto e encontros',
    icon: 'business',
    href: '/webview/comunidade-igrejas',
    tone: 'sky',
  },
];

export function CommunityGrid({ items }: { items?: Item[] }) {
  const list = items ?? DEFAULT_ITEMS;
  return (
    <View style={styles.wrap}>
      {list.map((item, idx) => {
        const t = toneMap[item.tone];
        return (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as never)}
            style={({ pressed }) => [
              styles.row,
              idx < list.length - 1 && styles.divider,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
              <Ionicons name={item.icon} size={22} color={t.fg} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.ink400} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.ink100,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { color: palette.ink900, fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  description: { color: palette.ink600, fontSize: 12.5, fontWeight: '500', lineHeight: 16 },
});
