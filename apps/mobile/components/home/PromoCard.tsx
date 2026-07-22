import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { prefetchBusinessDetail } from '@/lib/api/business-detail';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  title: string;
  brand: string;
  businessSlug: string;
  discountPercent?: number | null;
  illo?: string;
};

/** Cupom quadrado clay — padrão CupomCard do web. */
export function PromoCard({ title, brand, businessSlug, discountPercent, illo = '🏷️' }: Props) {
  const off = discountPercent && discountPercent > 0 ? `${discountPercent}%` : title;
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.85 : 1 }]}
      onPressIn={() => prefetchBusinessDetail(businessSlug)}
      onPress={() => router.push(`/comercio/${encodeURIComponent(businessSlug)}` as never)}
    >
      <View style={styles.square}>
        <Text style={styles.illo}>{illo}</Text>
      </View>
      <Text style={styles.copy}>
        <Text style={styles.off}>{off} off</Text>
        {' em\n'}
        {brand}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 130, alignItems: 'center' },
  square: {
    width: 130,
    height: 130,
    borderRadius: radius.xs,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  illo: { fontSize: 52, lineHeight: 56 },
  copy: {
    marginTop: 8,
    fontSize: 13,
    color: palette.ink900,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  off: { fontWeight: '800' },
});
