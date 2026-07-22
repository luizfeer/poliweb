import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { HomeVideoAd } from '@/lib/api/home';
import { palette } from '@/lib/theme/tokens';

import { VideoAd } from './VideoAd';

type Props = { ads: HomeVideoAd[]; sectionVisible?: boolean };

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;
const PEEK = 24; // mostra um pedacinho do próximo card

export function VideoAdHero({ ads, sectionVisible = true }: Props) {
  const [index, setIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const cardWidth = SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - (ads.length > 1 ? PEEK : 0);
  const snapInterval = cardWidth + GAP;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const next = Math.round(offset / snapInterval);
      if (next !== lastIndexRef.current) {
        lastIndexRef.current = next;
        setIndex(next);
      }
    },
    [snapInterval],
  );

  if (ads.length === 0) return null;

  if (ads.length === 1 && ads[0]) {
    return (
      <View style={styles.singleWrap}>
        <VideoAd ad={ads[0]} active={sectionVisible} width={SCREEN_WIDTH - HORIZONTAL_PADDING * 2} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, gap: GAP }}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {ads.map((ad, i) => (
          <VideoAd
            key={ad.id}
            ad={ad}
            active={sectionVisible && i === index}
            width={cardWidth}
          />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {ads.map((ad, i) => (
          <View
            key={ad.id}
            style={[styles.dot, i === index ? styles.dotActive : null]}
            accessibilityElementsHidden
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  singleWrap: { paddingHorizontal: HORIZONTAL_PADDING, paddingVertical: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.ink100,
  },
  dotActive: { backgroundColor: palette.clay500, width: 16 },
});
