import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { prefetchBusinessDetail } from '@/lib/api/business-detail';
import { palette, radius } from '@/lib/theme/tokens';

type Props = {
  slug?: string;
  name: string;
  category?: string | null;
  district?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  coverUrl?: string | null;
  fullWidth?: boolean;
  selected?: boolean;
  selectedColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onPressIn?: () => void;
};

function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function formatReviewsCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')}k`;
  return String(value);
}

export function BusinessCard({
  slug,
  name,
  category,
  district,
  rating,
  reviewsCount,
  coverUrl,
  fullWidth = false,
  selected = false,
  selectedColor = palette.cerrado700,
  style,
  onPress,
  onPressIn,
}: Props) {
  const ratingLabel = typeof rating === 'number' ? formatRating(rating) : null;
  const reviewsLabel =
    typeof reviewsCount === 'number' && reviewsCount > 0 ? formatReviewsCount(reviewsCount) : null;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (slug) {
      router.push(`/comercio/${encodeURIComponent(slug)}` as never);
    }
  };

  const handlePressIn = () => {
    if (onPressIn) {
      onPressIn();
      return;
    }
    if (slug) prefetchBusinessDetail(slug);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        fullWidth && styles.cardFullWidth,
        style,
        { opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
    >
      <View
        style={[
          styles.imageWrap,
          selected && { borderColor: selectedColor, borderWidth: 2 },
        ]}
      >
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="bed-outline" size={28} color={palette.ink400} />
          </View>
        )}
        {ratingLabel ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color={palette.sun500} />
            <Text style={styles.ratingBadgeText}>{ratingLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {category || district ? (
          <Text style={styles.meta} numberOfLines={1}>
            {[category, district].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {ratingLabel ? (
          <View style={styles.ratingRow}>
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
    width: 140,
  },
  cardFullWidth: {
    flex: 1,
    width: undefined,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: palette.paperDeep,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0,0,0,0.64)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: '900', color: palette.white },
  body: { paddingHorizontal: 2, paddingTop: 8, paddingBottom: 4, gap: 2 },
  name: { fontSize: 14, fontWeight: '800', lineHeight: 18, color: palette.ink900 },
  meta: { fontSize: 12, color: palette.ink600 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 12, fontWeight: '800', color: palette.ink900 },
  reviews: { fontSize: 12, fontWeight: '600', color: palette.ink600 },
});
