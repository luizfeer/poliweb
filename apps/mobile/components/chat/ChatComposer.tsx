import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDictation } from '@/lib/chat/use-dictation';
import { palette, radius } from '@/lib/theme/tokens';

type Props = {
  placeholder: string;
  disabled?: boolean;
  onSend: (text: string) => void;
};

export function ChatComposer({ placeholder, disabled, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const { listening, toggle, stop, error, available } = useDictation({
    onAutoSend: (finalText) => {
      setText('');
      onSend(finalText.trim());
    },
    onPartial: (partial) => {
      setText(partial);
    },
  });

  const handleSend = useCallback(
    (overrideText?: string) => {
      const value = (overrideText ?? text).trim();
      if (!value || disabled) return;
      if (listening) stop();
      setText('');
      onSend(value);
    },
    [disabled, onSend, text, listening, stop],
  );

  const onMicPress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    toggle();
  }, [toggle]);

  const canSend = !disabled && text.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {listening ? (
          <View style={styles.listeningRow}>
            <View style={styles.pulse} />
            <Text style={styles.listeningText}>Ouvindo… pause para enviar</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.row}>
          {available ? (
            <Pressable
              onPress={onMicPress}
              disabled={disabled}
              style={({ pressed }) => [
                styles.actionBtn,
                listening ? styles.micActive : styles.micIdle,
                { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Parar ditado' : 'Ditar mensagem'}
            >
              <Ionicons
                name={listening ? 'stop' : 'mic'}
                size={22}
                color={listening ? palette.white : palette.cerrado700}
              />
            </Pressable>
          ) : null}

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={listening ? 'Fale agora…' : placeholder}
            placeholderTextColor={palette.ink400}
            multiline
            maxLength={500}
            editable={!disabled}
            style={[styles.input, listening && styles.inputListening]}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => handleSend()}
          />

          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.sendBtn,
              { opacity: canSend ? (pressed ? 0.85 : 1) : 0.4 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Ionicons name="arrow-up" size={22} color={palette.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: palette.ink100,
    backgroundColor: palette.paperDeep,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 88,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: palette.ink900,
  },
  inputListening: {
    borderColor: palette.cerrado500,
    backgroundColor: '#F4FBF1',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: { backgroundColor: palette.cerrado700 },
  micIdle: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  micActive: { backgroundColor: palette.clay500 },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.clay500,
  },
  listeningText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.ink700,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.destructive,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
});
