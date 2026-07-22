import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  name: string;
  subtitle?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  photoUrls?: string[];
  rating?: number | null;
  reviewsCount?: number | null;
  featured?: boolean;
  selected?: boolean;
  accentColor: string;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  onPressIn?: () => void;
};

function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function formatReviewsCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')}k`;
  return String(value);
}

export function ExploreListingCard({
  name,
  subtitle,
  description,
  coverUrl,
  photoUrls = [],
  rating,
  reviewsCount,
  featured,
  selected,
  accentColor,
  style,
  onPress,
  onPressIn,
}: Props) {
  const gallery = photoUrls.length > 0 ? photoUrls : coverUrl ? [coverUrl] : [];
  const [photoIndex, setPhotoIndex] = useState(0);
  const [mediaWidth, setMediaWidth] = useState(0);
  const activePhoto = gallery[photoIndex] ?? coverUrl ?? null;

  const ratingLabel = typeof rating === 'number' ? formatRating(rating) : null;
  const reviewsLabel =
    typeof reviewsCount === 'number' && reviewsCount > 0 ? formatReviewsCount(reviewsCount) : null;

  const onGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (width <= 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== photoIndex) setPhotoIndex(index);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [styles.card, style, { opacity: pressed ? 0.94 : 1 }]}
    >
      <View
        onLayout={(event) => setMediaWidth(event.nativeEvent.layout.width)}
        style={[styles.media, selected && { borderColor: accentColor, borderWidth: 2 }]}
      >
        {gallery.length > 1 && mediaWidth > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled
            style={styles.galleryScroll}
          >
            {gallery.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{ width: mediaWidth, height: '100%' }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : activePhoto ? (
          <Image source={{ uri: activePhoto }} style={styles.image} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="map-outline" size={28} color={palette.clay500} />
          </View>
        )}

        {featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Em destaque</Text>
          </View>
        ) : null}

        {gallery.length > 1 ? (
          <View style={styles.dots}>
            {gallery.slice(0, 5).map((uri, index) => (
              <View
                key={`${uri}-${index}`}
                style={[styles.dot, index === photoIndex && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.meta} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {description ? (
          <Text style={styles.desc} numberOfLines={1}>
            {description}
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
    flex: 1,
  },
  media: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.paperDeep,
    borderWidth: 1,
    borderColor: palette.ink100,
    ...shadows.card,
  },
  galleryScroll: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
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
  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    backgroundColor: palette.white,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    paddingTop: 8,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    color: palette.ink900,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.ink600,
  },
  desc: {
    fontSize: 11,
    fontWeight: '500',
    color: palette.ink600,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: '900',
    color: palette.ink900,
  },
  reviews: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.ink600,
  },
});
