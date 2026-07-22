import { ChevronLeft, Search, Share2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconMark } from '@/components/ui/AppIconMark';
import { palette } from '@/lib/theme/tokens';

export type HeaderChip = { id: string; label: string };

type Props = {
  chips: HeaderChip[];
  activeChipId: string | null;
  onChipPress: (id: string) => void;
  onShare: () => void;
};

/** Header da ficha — mesmo padrão do SmartWebView (logo + busca + compartilhar + chips). */
export function BusinessDetailHeader({ chips, activeChipId, onChipPress, onShare }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Voltar">
            <ChevronLeft size={24} color={palette.white} strokeWidth={2.2} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/buscar-nativo' as never)}
            style={styles.searchPill}
            accessibilityLabel="Buscar no portal"
          >
            <AppIconMark size={28} />
            <Search size={17} color={palette.ink700} strokeWidth={2.2} />
            <Text style={styles.searchText} numberOfLines={1}>
              Buscar em Carmo
            </Text>
          </Pressable>

          <Pressable onPress={onShare} style={styles.iconBtn} hitSlop={8} accessibilityLabel="Compartilhar">
            <Share2 size={21} color={palette.white} strokeWidth={2} />
          </Pressable>
        </View>

        {chips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {chips.map((chip) => {
              const active = chip.id === activeChipId;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => onChipPress(chip.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.clay500 },
  header: { backgroundColor: palette.clay500, paddingHorizontal: 10, paddingBottom: 8, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  searchPill: {
    flex: 1,
    minWidth: 0,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 8,
    paddingRight: 14,
  },
  searchText: { flex: 1, color: palette.ink600, fontSize: 14, fontWeight: '700' },
  chipsRow: { gap: 6, paddingRight: 6 },
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: palette.ink900 },
  chipText: { color: palette.ink900, fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: palette.white },
});
