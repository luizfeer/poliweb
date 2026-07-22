import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

/**
 * Catch-all para deep links/rotas que não casam (ex.: carmelitano:// bare).
 * Redireciona pra home das tabs ao invés de mostrar a tela "Unmatched Route".
 */
export default function NotFoundScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)' as never);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={palette.cerrado700} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
});
