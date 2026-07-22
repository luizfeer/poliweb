import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

type Props = {
  title: string;
  kicker?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SectionHeader({ title, kicker, actionLabel, actionHref }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && actionHref ? (
        <Pressable hitSlop={8} onPress={() => router.push(actionHref as never)}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.ink400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: { fontSize: 22, fontWeight: '800', color: palette.ink900, letterSpacing: -0.5 },
  action: { fontSize: 14, fontWeight: '600', color: palette.clay500 },
});
