import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { signInWithProvider, type OAuthProvider } from '@/lib/auth/actions';
import { palette, spacing } from '@/lib/theme/tokens';

type Props = {
  onSuccess: () => void;
  onError?: (message: string) => void;
};

export function SocialAuthButtons({ onSuccess, onError }: Props) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  async function handle(provider: OAuthProvider) {
    setLoading(provider);
    const result = await signInWithProvider(provider);
    setLoading(null);
    if (result.ok) {
      onSuccess();
      return;
    }
    onError?.(result.message);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>ou continue com</Text>
        <View style={styles.line} />
      </View>

      <Button
        variant="secondary"
        fullWidth
        loading={loading === 'google'}
        disabled={loading !== null}
        onPress={() => handle('google')}
      >
        Continuar com Google
      </Button>

      {Platform.OS === 'ios' ? (
        <Button
          variant="secondary"
          fullWidth
          loading={loading === 'apple'}
          disabled={loading !== null}
          onPress={() => handle('apple')}
        >
          Continuar com Apple
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: palette.ink100 },
  dividerText: { color: palette.ink600, fontSize: 12, fontWeight: '700' },
});
