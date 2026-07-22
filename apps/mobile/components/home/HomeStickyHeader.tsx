import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ONDE_FICAR_ROUTE } from '@/lib/navigation/onde-ficar';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const CHIPS: { label: string; href: string }[] = [
  { label: 'Mais buscados', href: '/buscar' },
  { label: 'Saúde', href: '/webview/servicos-saude' },
  { label: 'Comida', href: '/webview/turismo-onde-comer' },
  { label: 'Pousadas', href: ONDE_FICAR_ROUTE as string },
  { label: 'Eventos', href: '/agenda' },
  { label: 'Comércio', href: '/buscar' },
];

type Props = {
  cityName?: string;
};

/**
 * Header fixo laranja-telha (clay), espelhando AppHeader do apps/web.
 */
export function HomeStickyHeader({ cityName }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.inner}>
        {cityName ? (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.locationText} numberOfLines={1}>
              {cityName}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push('/buscar-nativo')}
          style={({ pressed }) => [styles.search, { opacity: pressed ? 0.92 : 1 }]}
          accessibilityRole="search"
          accessibilityLabel="Buscar no portal"
        >
          <Ionicons name="search" size={18} color={palette.ink600} />
          <Text style={styles.searchPlaceholder}>Buscar comércio, serviços, turismo…</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CHIPS.map((chip) => (
            <Pressable
              key={chip.label}
              onPress={() => router.push(chip.href as never)}
              style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.chipText}>{chip.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: palette.clay500,
    zIndex: 20,
    ...shadows.banner,
  },
  inner: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  locationText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.white,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: palette.ink600,
    fontWeight: '500',
  },
  chipsRow: {
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.ink900,
  },
});
