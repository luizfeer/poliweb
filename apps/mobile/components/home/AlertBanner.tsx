import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius } from '@/lib/theme/tokens';

type Props = { title: string; affectedArea?: string | null };

export function AlertBanner({ title, affectedArea }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => router.push('/webview/servicos-alertas' as never)}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle" size={20} color={palette.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {affectedArea ? (
          <Text style={styles.area} numberOfLines={1}>
            {affectedArea}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.clay500,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.white, fontWeight: '800', fontSize: 14 },
  area: { color: 'rgba(255,255,255,0.92)', fontSize: 12, marginTop: 2 },
});
