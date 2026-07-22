import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function HScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.row}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', gap: 12 },
});
