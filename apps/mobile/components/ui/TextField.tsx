import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { palette, radius } from '@/lib/theme/tokens';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, hint, error, onFocus, onBlur, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={palette.ink400}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor: error
              ? palette.clay500
              : focused
                ? palette.cerrado500
                : palette.ink100,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.ink700,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: palette.ink900,
  },
  hint: { fontSize: 12, color: palette.ink600 },
  error: { fontSize: 12, color: palette.clay600, fontWeight: '700' },
});
