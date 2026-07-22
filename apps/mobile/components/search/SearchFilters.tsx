import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

import type { SearchEntityType } from '@/lib/chat/types';
import { SEARCH_FILTERS } from '@/lib/search/constants';
import { palette, radius } from '@/lib/theme/tokens';

type Props = {
  selectedTypes: SearchEntityType[];
  onToggle: (type: SearchEntityType | null) => void;
};

export function SearchFilters({ selectedTypes, onToggle }: Props) {
  const allSelected = selectedTypes.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <FilterChip
        label="Tudo"
        selected={allSelected}
        onPress={() => onToggle(null)}
      />
      {SEARCH_FILTERS.map((filter) => (
        <FilterChip
          key={filter.type}
          label={filter.label}
          selected={selectedTypes.includes(filter.type)}
          onPress={() => onToggle(filter.type)}
        />
      ))}
    </ScrollView>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        { opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
  },
  chipSelected: {
    backgroundColor: palette.clay500,
    borderColor: palette.clay500,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: palette.ink700 },
  chipTextSelected: { color: palette.white },
});
