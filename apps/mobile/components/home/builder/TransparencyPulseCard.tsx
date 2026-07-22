import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TransparencyPulseData } from '@/lib/home/block-data';
import { portalHrefToMobile } from '@/lib/home/portal-href';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  cityName: string;
  snapshot: TransparencyPulseData;
};

export function TransparencyPulseCard({ cityName, snapshot }: Props) {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Pressable
        onPress={() => router.push(portalHrefToMobile('/transparencia') as never)}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="library-outline" size={22} color={palette.sky700} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Transparência</Text>
          <Text style={styles.title}>O que mudou no poder público</Text>
          <Text style={styles.body}>
            Resumo de notícias oficiais, câmara e licitações de {cityName}.
          </Text>
          <View style={styles.highlight}>
            <Text style={styles.highlightTitle} numberOfLines={2}>
              {snapshot.highlightTitle}
            </Text>
            <Text style={styles.highlightMeta}>{snapshot.highlightMeta}</Text>
          </View>
          <Text style={styles.counts}>
            {snapshot.newsCount} notícias · {snapshot.officialCount} documentos recentes
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.ink400} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.sky100,
    ...shadows.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.sky100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.sky700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink900,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 13,
    color: palette.ink600,
    marginTop: 4,
    lineHeight: 18,
  },
  highlight: {
    marginTop: 10,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: palette.paperDeep,
  },
  highlightTitle: { fontSize: 13, fontWeight: '700', color: palette.ink900 },
  highlightMeta: { fontSize: 11, color: palette.ink600, marginTop: 2 },
  counts: { fontSize: 11, color: palette.ink400, marginTop: 8 },
});
