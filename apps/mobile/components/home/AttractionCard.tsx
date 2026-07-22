import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';
import { attractionKindLabel } from '@/lib/tourism/attraction-kind';

type Props = {
  slug: string;
  name: string;
  shortDescription?: string | null;
  coverUrl?: string | null;
  kind?: string | null;
  cityName?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  featured?: boolean;
};

function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function formatReviewsCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')}k`;
  return String(value);
}

export function AttractionCard({
  slug,
  name,
  shortDescription,
  coverUrl,
  kind,
  cityName,
  rating,
  reviewsCount,
  featured = false,
}: Props) {
  const kindLabel = attractionKindLabel(kind);
  const ratingLabel = typeof rating === 'number' ? formatRating(rating) : null;
  const reviewsLabel =
    typeof reviewsCount === 'number' && reviewsCount > 0 ? formatReviewsCount(reviewsCount) : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => router.push(`/webview/turismo-o-que-fazer-${encodeURIComponent(slug)}` as never)}
    >
      <View style={styles.imageWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="map-outline" size={30} color={palette.clay500} />
          </View>
        )}
        {featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Em destaque</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[kindLabel, cityName].filter(Boolean).join(' · ')}
        </Text>
        {shortDescription ? (
          <Text style={styles.desc} numberOfLines={1}>
            {shortDescription}
          </Text>
        ) : null}
        {ratingLabel ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={palette.ink900} />
            <Text style={styles.rating}>{ratingLabel}</Text>
            {reviewsLabel ? <Text style={styles.reviews}>({reviewsLabel})</Text> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 178,
  },
  imageWrap: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.paperDeep,
    borderWidth: 1,
    borderColor: palette.ink100,
    ...shadows.card,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cerrado100,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(25,25,25,0.08)',
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.ink900,
  },
  body: { paddingTop: 8, gap: 3 },
  name: { color: palette.ink900, fontSize: 15, fontWeight: '800', lineHeight: 19 },
  meta: { color: palette.ink600, fontSize: 12, fontWeight: '600' },
  desc: { color: palette.ink600, fontSize: 12, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  rating: { fontSize: 12, fontWeight: '900', color: palette.ink900 },
  reviews: { fontSize: 12, fontWeight: '600', color: palette.ink600 },
});
