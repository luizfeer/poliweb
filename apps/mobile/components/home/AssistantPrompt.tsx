import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openAssistant, openAssistantWithQuery } from '@/lib/navigation/open-assistant';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const DEFAULT_SAMPLES = [
  'Qual farmácia está de plantão hoje?',
  'Tem missa ou culto esta semana?',
  'Eventos do fim de semana',
];

export function AssistantPrompt({ questions }: { questions?: string[] }) {
  const samples = questions?.length ? questions : DEFAULT_SAMPLES;
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Pressable
        onPress={() => openAssistant()}
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.95 : 1 }]}
      >
        <LinearGradient
          colors={['#DEEEF7', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={22} color={palette.sky700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Assistente IA</Text>
            <Text style={styles.title}>O que você precisa saber hoje?</Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {samples.map((q) => (
            <Pressable
              key={q}
              onPress={() => openAssistantWithQuery(q)}
              style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {q}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 14,
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.sky100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: palette.sky700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: { color: palette.ink900, fontSize: 16, fontWeight: '900', marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.sky100,
  },
  chipText: { color: palette.ink700, fontSize: 12, fontWeight: '700' },
});
