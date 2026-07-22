import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme/tokens';

type BubbleProps = {
  side: 'left' | 'right';
  children: React.ReactNode;
  time: string;
  visible: boolean;
};

function Bubble({ side, children, time, visible }: BubbleProps) {
  if (!visible) return null;
  const isUser = side === 'right';
  return (
    <View style={[styles.bubbleWrap, { alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        {children}
        <View style={styles.bubbleMeta}>
          <Text style={[styles.time, isUser ? styles.timeUser : styles.timeBot]}>
            {time}
          </Text>
          {isUser ? (
            <Ionicons name="checkmark-done" size={9} color="rgba(255,255,255,0.85)" />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function TypingDots() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 3), 280);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.typingWrap}>
      <View style={styles.typing}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { opacity: tick === i ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const STEPS = [
  { at: 200, type: 'user' as const },
  { at: 900, type: 'typing' as const },
  { at: 2000, type: 'bot' as const },
  { at: 2600, type: 'user2' as const },
  { at: 3300, type: 'typing2' as const },
  { at: 4400, type: 'bot2' as const },
];

export function ChatMock() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((s, i) => setTimeout(() => setStep(i + 1), s.at));
    // Reinicia após 7s
    const loop = setTimeout(() => setStep(0), 7000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loop);
    };
  }, [step === 0]);

  const showUser1 = step >= 1;
  const showTyping1 = step === 2;
  const showBot1 = step >= 3;
  const showUser2 = step >= 4;
  const showTyping2 = step === 5;
  const showBot2 = step >= 6;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={11} color={palette.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>TormentaIA</Text>
          <Text style={styles.online}>online · digitando...</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={11} color={palette.ink400} />
      </View>

      <View style={styles.chat}>
        <Bubble side="right" time="08:42" visible={showUser1}>
          <Text style={styles.userText}>Bom dia! Tem missa essa semana?</Text>
        </Bubble>

        {showTyping1 ? <TypingDots /> : null}

        <Bubble side="left" time="08:42" visible={showBot1}>
          <Text style={styles.botText}>
            Sim! <Text style={styles.botBold}>Quinta às 19h</Text> na Matriz, e domingo 9h e 19h.
          </Text>
        </Bubble>

        <Bubble side="right" time="08:43" visible={showUser2}>
          <Text style={styles.userText}>Restaurante aberto domingo?</Text>
        </Bubble>

        {showTyping2 ? <TypingDots /> : null}

        <Bubble side="left" time="08:43" visible={showBot2}>
          <Text style={styles.botText}>
            Tem 3 abertos: <Text style={styles.botBold}>Tempero da Roça</Text>, Cantinho e Sabor Mineiro.
          </Text>
        </Bubble>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.ink100,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.sky700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 11, fontWeight: '900', color: palette.ink900 },
  online: { fontSize: 8, fontWeight: '700', color: palette.cerrado500 },
  chat: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  bubbleWrap: { maxWidth: '82%' },
  bubble: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 50,
  },
  bubbleUser: {
    backgroundColor: palette.clay500,
    borderTopRightRadius: 3,
  },
  bubbleBot: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 3,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  userText: { fontSize: 10, color: palette.white, fontWeight: '600', lineHeight: 13 },
  botText: { fontSize: 10, color: palette.ink900, fontWeight: '500', lineHeight: 13 },
  botBold: { fontWeight: '900', color: palette.sky700 },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 1,
  },
  time: { fontSize: 7, fontWeight: '600' },
  timeUser: { color: 'rgba(255,255,255,0.85)' },
  timeBot: { color: palette.ink400 },
  typingWrap: { alignSelf: 'flex-start' },
  typing: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: palette.white,
    borderRadius: 12,
    borderTopLeftRadius: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: palette.ink400,
  },
});
