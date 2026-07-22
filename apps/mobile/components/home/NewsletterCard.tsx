import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius } from '@/lib/theme/tokens';

export function NewsletterCard({
  citySlug,
  description,
}: {
  citySlug: string;
  description?: string;
}) {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Pressable
        onPress={() => router.push(`/webview/newsletter?city=${citySlug}` as never)}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="mail-open" size={22} color={palette.clay600} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Resumo semanal</Text>
          <Text style={styles.title}>Receba os destaques da cidade por email</Text>
          <Text style={styles.subtitle}>
            {description ?? 'Sem spam. Confirmação obrigatória.'}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={palette.ink400} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: palette.clay50,
    borderWidth: 1,
    borderColor: '#F0D5BD',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: palette.clay600,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: { color: palette.ink900, fontSize: 14, fontWeight: '900', marginTop: 2 },
  subtitle: { color: palette.ink600, fontSize: 12, fontWeight: '600', marginTop: 2 },
});
