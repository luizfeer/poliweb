import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeaturedPromoTone } from '@/lib/home/types';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  badge?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  tone: FeaturedPromoTone;
};

const TONE_BG: Record<FeaturedPromoTone, string> = {
  cerrado: palette.cerrado700,
  sky: palette.sky700,
  clay: palette.clay600,
  sun: palette.sun500,
};

const isDark = (t: FeaturedPromoTone) => t !== 'sun';

export function FeaturedPromoCard({ badge, title, subtitle, imageUrl, href, tone }: Props) {
  const bg = TONE_BG[tone];
  const textColor = isDark(tone) ? palette.white : palette.ink900;
  const subtitleColor = isDark(tone) ? 'rgba(255,255,255,0.85)' : palette.ink700;
  const badgeBg = isDark(tone) ? palette.sun500 : palette.ink900;
  const badgeFg = isDark(tone) ? palette.ink900 : palette.white;
  const arrowFg = isDark(tone) ? bg : palette.ink900;

  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={({ pressed }) => [styles.card, { backgroundColor: bg, opacity: pressed ? 0.92 : 1 }]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
      ) : null}
      {imageUrl ? <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, opacity: 0.7 }]} /> : null}

      <View style={styles.body}>
        <View style={{ gap: 8 }}>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: badgeFg }]} numberOfLines={1}>
                {badge.toUpperCase()}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: textColor }]} numberOfLines={3}>
            {title}
          </Text>
        </View>

        <View style={styles.footer}>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : <View style={{ flex: 1 }} />}
          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={18} color={arrowFg} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 170,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  body: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  subtitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
