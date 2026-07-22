import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { TabBottomScrim } from '@/components/ui/TabBottomScrim';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Container padrão das abas — inclui degradê escuro no rodapé. */
export function TabsScreen({ children, style }: Props) {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
      <TabBottomScrim />
    </View>
  );
}
