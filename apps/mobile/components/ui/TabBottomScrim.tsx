import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Altura aproximada da tab bar nativa (fora safe area). */
export const TAB_BAR_HEIGHT = 56;

const FADE_EXTRA = 36;

/**
 * Degradê escuro no rodapé — substitui o wash claro do scroll edge do iOS
 * quando o conteúdo passa por baixo da tab bar.
 */
export function TabBottomScrim() {
  const insets = useSafeAreaInsets();
  const height = TAB_BAR_HEIGHT + insets.bottom + FADE_EXTRA;

  if (Platform.OS === 'web') return null;

  return (
    <View pointerEvents="none" style={[styles.host, { height }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.58)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
});
