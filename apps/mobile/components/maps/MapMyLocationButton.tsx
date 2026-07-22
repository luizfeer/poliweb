import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type MapView from 'react-native-maps';

import { palette, shadows } from '@/lib/theme/tokens';

type Props = {
  mapRef: React.RefObject<MapView | null>;
  granted: boolean;
  onCenter: (mapRef: React.RefObject<MapView | null>) => Promise<boolean>;
  style?: StyleProp<ViewStyle>;
};

export function MapMyLocationButton({ mapRef, granted, onCenter, style }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(async () => {
    setLoading(true);
    try {
      await onCenter(mapRef);
    } finally {
      setLoading(false);
    }
  }, [mapRef, onCenter]);

  return (
    <Pressable
      style={[styles.btn, style]}
      onPress={() => void handlePress()}
      accessibilityRole="button"
      accessibilityLabel="Ir para minha localização"
      accessibilityHint="Centraliza o mapa na sua posição atual"
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.cerrado700} />
      ) : (
        <Ionicons
          name="navigate"
          size={18}
          color={granted ? palette.cerrado700 : palette.ink600}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    ...shadows.card,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
});
