import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, shadows } from '@/lib/theme/tokens';

type Suggestion = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  query: string;
  iconBg: string;
  iconColor: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: 'boat-outline',
    title: 'Horários da balsa',
    subtitle: 'Travessias do dia',
    query: 'Quais os horários da balsa hoje?',
    iconBg: palette.sky100,
    iconColor: palette.sky700,
  },
  {
    icon: 'business-outline',
    title: 'Conheça o Carmo',
    subtitle: 'História e atrações',
    query: 'Me conta sobre Carmo do Rio Claro: o que conhecer e principais atrações.',
    iconBg: palette.cerrado100,
    iconColor: palette.cerrado700,
  },
  {
    icon: 'map-outline',
    title: 'Conheça Itaci',
    subtitle: 'Distrito da serra',
    query: 'Me conta sobre o distrito de Itaci: o que tem pra fazer e como chegar.',
    iconBg: palette.sun100,
    iconColor: palette.clay600,
  },
  {
    icon: 'restaurant-outline',
    title: 'Restaurantes',
    subtitle: 'Onde comer hoje',
    query: 'Quais restaurantes recomendados pra comer hoje?',
    iconBg: palette.clay50,
    iconColor: palette.clay600,
  },
];

type Props = {
  cityName: string;
  disabled?: boolean;
  onPick: (query: string) => void;
};

export function ChatWelcome({ cityName, disabled, onPick }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={styles.wrap}>
      {step >= 1 ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            Oi! Sou a <Text style={styles.brand}>TormentaIA</Text>
            {'\n'}
            Sua assistente do <Text style={styles.bold}>{cityName}</Text>.
          </Text>
        </View>
      ) : (
        <TypingDots />
      )}

      {step >= 2 ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            Posso te ajudar com roteiros, pousadas, restaurantes, pesca, eventos e o que mais
            rolar por aqui. Quer começar por algum desses?
          </Text>
        </View>
      ) : null}

      {step >= 3 ? (
        <View style={styles.grid}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.query}
              onPress={() => onPick(s.query)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.card,
                shadows.card,
                { opacity: disabled ? 0.5 : pressed ? 0.92 : 1 },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: s.iconBg }]}>
                <Ionicons name={s.icon} size={18} color={s.iconColor} />
              </View>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardSub}>{s.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TypingDots() {
  return (
    <View style={styles.bubble}>
      <Text style={styles.typing}>● ● ●</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingHorizontal: 4, paddingVertical: 8 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadows.card,
  },
  bubbleText: { fontSize: 15, lineHeight: 22, color: palette.ink900 },
  brand: { fontWeight: '800', color: palette.cerrado700 },
  bold: { fontWeight: '800' },
  typing: { color: palette.ink400, letterSpacing: 2, fontSize: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 12,
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  cardSub: { fontSize: 12, fontWeight: '600', color: palette.ink600 },
});
