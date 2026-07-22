import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ONDE_FICAR_ROUTE } from '@/lib/navigation/onde-ficar';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = { cityName: string; attractionsCount: number };

/**
 * Widget de turismo — card branco + faixa cerrado, como TourismGatewayWidget no web.
 */
export function TourismGateway({ cityName, attractionsCount }: Props) {
  return (
    <View style={{ paddingHorizontal: 12 }}>
      <View style={styles.card}>
        <Pressable
          onPress={() => router.push('/webview/turismo' as never)}
          style={({ pressed }) => [styles.header, { opacity: pressed ? 0.95 : 1 }]}
        >
          <View style={styles.headerIcon}>
            <Ionicons name="boat-outline" size={20} color={palette.sun500} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerKicker}>Turismo em {cityName}</Text>
            <Text style={styles.headerTitle}>
              Planeje passeios, avalie lugares e siga roteiros reais.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.sun500} />
        </Pressable>

        <View style={styles.links}>
          <Pressable
            onPress={() => router.push('/webview/turismo-o-que-fazer' as never)}
            style={styles.linkRow}
          >
            <View style={[styles.linkIcon, { backgroundColor: palette.cerrado100 }]}>
              <Ionicons name="map-outline" size={18} color={palette.cerrado700} />
            </View>
            <Text style={styles.linkText}>
              {attractionsCount > 0 ? `${attractionsCount} atrações` : 'O que fazer'}
            </Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            onPress={() => router.push(ONDE_FICAR_ROUTE as never)}
            style={styles.linkRow}
          >
            <View style={[styles.linkIcon, { backgroundColor: palette.cerrado100 }]}>
              <Ionicons name="bed-outline" size={18} color={palette.cerrado700} />
            </View>
            <Text style={styles.linkText}>Onde ficar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.cerrado100,
    backgroundColor: palette.white,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: palette.cerrado700,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKicker: {
    color: palette.sun500,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: palette.white,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 2,
  },
  links: { paddingVertical: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { fontSize: 14, fontWeight: '700', color: palette.ink900, flex: 1 },
  divider: { height: 1, backgroundColor: palette.ink100, marginHorizontal: 14 },
});
