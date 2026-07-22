import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/lib/theme/tokens';

type Props = {
  showHeader?: boolean;
};

const CHIP_WIDTHS = [78, 96, 84, 110, 72, 92];
const CARD_HEIGHTS = [180, 120, 96, 96, 120];

/**
 * Placeholder mostrado enquanto a página web ainda não terminou de carregar pela 1ª vez.
 * Espelha o layout do SmartWebView (header laranja + chips) e blocos de conteúdo abaixo,
 * pra dar sensação de progresso em vez de uma tela chapada.
 */
export function WebViewSkeleton({ showHeader = true }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.host} pointerEvents="none">
      {showHeader ? (
        <SafeAreaView style={styles.headerSafe} edges={['top']}>
          <View style={styles.headerInner}>
            <View style={styles.headerTop}>
              <View style={styles.iconPlaceholder} />
              <View style={styles.searchPlaceholder}>
                <View style={styles.logoBubble} />
                <View style={styles.searchLine} />
              </View>
              <View style={styles.iconPlaceholder} />
            </View>
            <View style={styles.chipsRow}>
              {CHIP_WIDTHS.map((w, i) => (
                <View key={i} style={[styles.chip, { width: w }]} />
              ))}
            </View>
          </View>
        </SafeAreaView>
      ) : null}

      <Animated.View style={[styles.content, { opacity }]}>
        {CARD_HEIGHTS.map((h, i) => (
          <View key={i} style={[styles.card, { height: h }]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.paper,
  },
  headerSafe: { backgroundColor: palette.clay500 },
  headerInner: {
    backgroundColor: palette.clay500,
    paddingHorizontal: 10,
    paddingBottom: 8,
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  searchPlaceholder: {
    flex: 1,
    minWidth: 0,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
  },
  logoBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  searchLine: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.ink100,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 6,
  },
  chip: {
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: palette.paperDeep,
  },
});
