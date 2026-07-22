import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

const APP_ICON = require('@/assets/app-icon.webp');

/** Raio contínuo aproximado do ícone iOS (~22,37% do lado). */
export const IOS_APP_ICON_RADIUS_RATIO = 0.2237;

type Props = {
  size?: number;
  style?: ViewStyle;
};

export function AppIconMark({ size = 28, style }: Props) {
  const radius = size * IOS_APP_ICON_RADIUS_RATIO;

  return (
    <View style={[styles.shadow, { width: size, height: size, borderRadius: radius }, style]}>
      <Image
        source={APP_ICON}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        accessibilityLabel="Portal Carmelitano"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    overflow: 'hidden',
    backgroundColor: 'rgba(23,23,22,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
