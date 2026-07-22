import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TRENDING_QUERIES } from '@/lib/search/constants';
import { palette, radius } from '@/lib/theme/tokens';

type Props = {
  query?: string;
  onPickQuery: (q: string) => void;
};

export function SearchEmptyState({ query = '', onPickQuery }: Props) {
  const searched = query.trim();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {searched
          ? 'Não encontramos o termo pesquisado'
          : 'Busque comércio, turismo, eventos e mais'}
      </Text>
      <Text style={styles.sub}>
        {searched
          ? `Ainda não temos resultado para "${searched}". Tente outras palavras ou use a TormentaIA.`
          : 'Digite pelo menos 2 caracteres ou toque em uma sugestão abaixo.'}
      </Text>

      {!searched ? (
        <View style={styles.chips}>
          {TRENDING_QUERIES.map((term) => (
            <Pressable
              key={term}
              onPress={() => onPickQuery(term)}
              style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.chipText}>{term}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.ink900,
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: palette.ink600,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  chipText: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
});
