import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="megaphone" size={size * 0.52} color={palette.white} />
      </View>
      <Text style={[styles.wordmark, { fontSize: size * 0.6 }]}>Portal Carmelitano</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: {
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { color: palette.ink900, fontWeight: '900', letterSpacing: -0.3 },
});
