import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeBusiness } from '@/lib/api/home';
import { openOndeFicar } from '@/lib/navigation/onde-ficar';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = { cityName: string; lodgings: HomeBusiness[] };

export function LodgingMapPreview({ cityName, lodgings }: Props) {
  const previews = lodgings.slice(0, 3);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Pressable
        onPress={() => openOndeFicar()}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
      >
        <LinearGradient
          colors={['#1F6798', '#0B3A57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.gridBg} pointerEvents="none" />

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="map" size={20} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Mapa de pousadas</Text>
            <Text style={styles.title}>Onde ficar em {cityName}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Lista e mapa lado a lado — compare localização, fotos e diárias.
        </Text>

        {previews.length > 0 ? (
          <View style={styles.previewsRow}>
            {previews.map((p) => (
              <View key={p.id} style={styles.previewChip}>
                {p.coverUrl ? (
                  <Image source={{ uri: p.coverUrl }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons name="bed" size={14} color={palette.white} />
                  </View>
                )}
                <Text style={styles.previewText} numberOfLines={1}>
                  {p.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Abrir mapa</Text>
          <Ionicons name="arrow-forward" size={14} color={palette.ink900} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 16,
    gap: 8,
    ...shadows.pop,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.06,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: { color: palette.white, fontSize: 18, fontWeight: '900', marginTop: 2 },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  previewsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  previewChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  thumb: { width: 26, height: 26, borderRadius: 6 },
  thumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: { color: palette.white, fontSize: 11, fontWeight: '800', flexShrink: 1 },
  cta: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  ctaText: { color: palette.ink900, fontWeight: '900', fontSize: 13 },
});
