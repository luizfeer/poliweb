import { router } from 'expo-router';
import { closeOverlay } from '@/lib/navigation/close-overlay';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { TextField } from '@/components/ui/TextField';
import { openLegalDoc } from '@/lib/auth/open-legal-doc';
import { signUp } from '@/lib/auth/actions';
import { palette, spacing } from '@/lib/theme/tokens';

export default function CadastroScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const result = await signUp({ name, email, password, acceptTerms });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successWrap}>
          <Text style={styles.successEmoji}>📧</Text>
          <Text style={styles.title}>Confirme seu email</Text>
          <Text style={styles.subtitle}>
            Enviamos um link de confirmação para {email}. Abra o email para ativar sua conta.
          </Text>
          <Button onPress={() => router.replace('/(auth)/entrar')} fullWidth>
            Voltar para login
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size={28} />
            <Pressable hitSlop={12} onPress={() => closeOverlay()}>
              <Text style={styles.close}>Voltar</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>Criar conta grátis</Text>
            <Text style={styles.subtitle}>
              Sua conta funciona em todas as cidades do Portal. Comece em Carmo do Rio Claro.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Nome completo"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
            />
            <TextField
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
            />
            <TextField
              label="Senha"
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              hint="Mínimo 8 caracteres."
            />

            <View style={styles.termsRow}>
              <Switch
                value={acceptTerms}
                onValueChange={setAcceptTerms}
                trackColor={{ true: palette.cerrado500, false: palette.ink100 }}
              />
              <Text style={styles.termsText}>
                Li e aceito os{' '}
                <Text style={styles.link} onPress={() => void openLegalDoc('/termos')}>
                  Termos de uso
                </Text>{' '}
                e a{' '}
                <Text style={styles.link} onPress={() => void openLegalDoc('/privacidade')}>
                  Política de privacidade
                </Text>
                .
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button onPress={handleSubmit} loading={loading} fullWidth>
              Criar conta
            </Button>

            <SocialAuthButtons
              onSuccess={() => router.replace('/(tabs)/index')}
              onError={setError}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { color: palette.ink600, fontWeight: '700' },
  hero: { gap: 8 },
  title: { fontSize: 26, fontWeight: '900', color: palette.ink900, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: palette.ink600, lineHeight: 20 },
  form: { gap: spacing.md },
  termsRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  termsText: { flex: 1, fontSize: 13, color: palette.ink700, lineHeight: 18 },
  link: { color: palette.cerrado700, fontWeight: '700', textDecorationLine: 'underline' },
  error: {
    color: palette.clay600,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#FBE5DA',
    padding: 10,
    borderRadius: 10,
  },
  successWrap: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: { fontSize: 64 },
});
