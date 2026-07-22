import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SmartWebView } from '@/components/webview/SmartWebView';
import { palette, spacing } from '@/lib/theme/tokens';

import { PerfilDrawer } from './PerfilDrawer';

type Props = {
  path: string;
  title?: string;
};

export function PerfilWebViewShell({ path, title = 'Painel' }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil'))}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={24} color={palette.ink900} />
          </Pressable>

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <Pressable
            onPress={() => setDrawerOpen(true)}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
          >
            <Ionicons name="menu" size={26} color={palette.ink900} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.webHost}>
        <SmartWebView path={path} redirectTabs={false} hideHeader />
      </View>

      <PerfilDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.white },
  headerSafe: { backgroundColor: palette.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.ink100,
    gap: spacing.sm,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  pressed: { opacity: 0.6 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: palette.ink900 },
  webHost: { flex: 1, minHeight: 0 },
});
