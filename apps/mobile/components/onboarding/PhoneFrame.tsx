import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

type Props = {
  children: ReactNode;
  /** Cor sob o gradiente de fade no rodapé (combina com o fundo do slide). */
  fadeColor?: string;
  width?: number;
  height?: number;
};

/**
 * Frame de iPhone estilizado para mockups do onboarding.
 * Mostra apenas a parte superior do app — o fundo desaparece num gradiente.
 */
export function PhoneFrame({
  children,
  fadeColor = palette.paper,
  width = 240,
  height = 320,
}: Props) {
  return (
    <View style={[styles.wrap, { width, height }]}>
      <View style={styles.frame}>
        <View style={styles.screen}>
          <View style={styles.island} />
          <View style={styles.content}>{children}</View>
          <LinearGradient
            colors={[`${fadeColor}00`, fadeColor]}
            locations={[0, 1]}
            style={styles.fadeInner}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  frame: {
    width: '100%',
    height: '145%',
    backgroundColor: '#0E0E0F',
    borderRadius: 36,
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 32,
    elevation: 14,
  },
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
    borderRadius: 32,
    overflow: 'hidden',
  },
  island: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 88,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#0E0E0F',
    zIndex: 2,
  },
  content: {
    flex: 1,
    paddingTop: 38,
    paddingBottom: 10,
  },
  fadeInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
  },
});
