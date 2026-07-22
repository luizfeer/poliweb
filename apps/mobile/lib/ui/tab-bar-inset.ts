import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/ui/TabBottomScrim';

/** Respiro extra acima da tab bar (além da altura da barra + safe area). */
const DEFAULT_EXTRA = 20;

/**
 * Padding inferior para ScrollView / FlatList nas abas com tab bar nativa.
 */
export function useTabBarScrollPadding(extra = DEFAULT_EXTRA): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + extra;
}
