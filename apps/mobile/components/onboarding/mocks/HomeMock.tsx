import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

const CHIPS = [
  'Qual farmácia está de plantão?',
  'Tem missa esta semana?',
  'Eventos do fim de semana',
];

export function HomeMock() {
  return (
    <View style={styles.wrap}>
      {/* Header tipo AppHeader real */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Ionicons name="megaphone" size={11} color={palette.white} />
          </View>
          <View>
            <Text style={styles.wordmark}>Portal Carmelitano</Text>
            <Text style={styles.cityLine}>Carmo do Rio Claro</Text>
          </View>
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name="search" size={11} color={palette.ink900} />
        </View>
      </View>

      {/* Saudação */}
      <Text style={styles.greeting}>Bom dia em Carmo!</Text>

      {/* AssistantPrompt real */}
      <View style={styles.assistantCard}>
        <LinearGradient
          colors={['#DEEEF7', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.assistantRow}>
          <View style={styles.assistantIcon}>
            <Ionicons name="sparkles" size={12} color={palette.sky700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.assistantLabel}>ASSISTENTE IA</Text>
            <Text style={styles.assistantTitle}>O que você precisa saber hoje?</Text>
          </View>
        </View>
        <View style={styles.chips}>
          {CHIPS.map((c) => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {c}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 11, fontWeight: '900', color: palette.ink900, letterSpacing: -0.2 },
  cityLine: { fontSize: 8, fontWeight: '700', color: palette.ink600 },
  iconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.ink900,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  assistantCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 10,
    gap: 8,
  },
  assistantRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assistantIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.sky100,
  },
  assistantLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: palette.sky700,
    letterSpacing: 0.8,
  },
  assistantTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.ink900,
    letterSpacing: -0.2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    backgroundColor: palette.white,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  chipText: { fontSize: 8, fontWeight: '700', color: palette.ink900 },
});
