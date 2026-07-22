import { router } from 'expo-router';
import { closeOverlay } from '@/lib/navigation/close-overlay';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { recoverPassword } from '@/lib/auth/actions';
import { palette, spacing } from '@/lib/theme/tokens';

export default function RecuperarSenhaScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const result = await recoverPassword({ email });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSent(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable hitSlop={12} onPress={() => closeOverlay()}>
              <Text style={styles.close}>Voltar</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>
            Informe o email da sua conta — vamos enviar um link para criar uma nova senha.
          </Text>

          {sent ? (
            <View style={styles.success}>
              <Text style={styles.successTitle}>Pronto! 📨</Text>
              <Text style={styles.subtitle}>
                Se houver conta para {email}, você vai receber o link em instantes.
              </Text>
              <Button onPress={() => router.replace('/(auth)/entrar')} fullWidth>
                Voltar para login
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <TextField
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button onPress={handleSubmit} loading={loading} fullWidth>
                Enviar link
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'flex-start' },
  close: { color: palette.ink600, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '900', color: palette.ink900 },
  subtitle: { fontSize: 14, color: palette.ink600, lineHeight: 20 },
  form: { gap: spacing.md },
  success: { gap: spacing.md, paddingTop: spacing.lg },
  successTitle: { fontSize: 22, fontWeight: '900', color: palette.ink900 },
  error: {
    color: palette.clay600,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#FBE5DA',
    padding: 10,
    borderRadius: 10,
  },
});
