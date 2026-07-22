import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';

type FeatureTone = 'clay' | 'cerrado' | 'sky' | 'sun';

type Feature = {
  title: string;
  text: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: FeatureTone;
};

const TONE: Record<FeatureTone, { bg: string; fg: string }> = {
  clay: { bg: palette.clay50, fg: palette.clay600 },
  cerrado: { bg: palette.cerrado100, fg: palette.cerrado700 },
  sky: { bg: palette.sky100, fg: palette.sky700 },
  sun: { bg: palette.sun100, fg: palette.ink900 },
};

const DEFAULT_FEATURES: Feature[] = [
  {
    title: 'Igrejas e horários',
    text: 'Missas, cultos e encontros da semana.',
    href: '/webview/comunidade-igrejas',
    icon: 'business-outline',
    tone: 'cerrado',
  },
  {
    title: 'Transparência pública',
    text: 'Prefeitura, câmara e licitações.',
    href: '/webview/transparencia',
    icon: 'library-outline',
    tone: 'sky',
  },
  {
    title: 'Serviços de hoje',
    text: 'Coleta, plantão e telefones úteis.',
    href: '/webview/servicos',
    icon: 'sparkles-outline',
    tone: 'clay',
  },
  {
    title: 'Sorteios locais',
    text: 'Campanhas e prêmios dos parceiros.',
    href: '/webview/sorteios',
    icon: 'pricetag-outline',
    tone: 'sun',
  },
];

export function LatestFeaturesGrid({ items }: { items?: Feature[] }) {
  const list = items ?? DEFAULT_FEATURES;
  return (
    <View style={styles.grid}>
      {list.map((feature) => {
        const tone = TONE[feature.tone];
        return (
          <Pressable
            key={feature.href}
            onPress={() => router.push(feature.href as never)}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
              <Ionicons name={feature.icon} size={19} color={tone.fg} />
            </View>
            <Text style={styles.tileTitle}>{feature.title}</Text>
            <Text style={styles.tileText}>{feature.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 14,
    overflow: 'hidden',
    ...shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.ink900,
    lineHeight: 18,
  },
  tileText: {
    fontSize: 12,
    color: palette.ink600,
    marginTop: 4,
    lineHeight: 16,
  },
});
