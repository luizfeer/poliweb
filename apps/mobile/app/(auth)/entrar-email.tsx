import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
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
import { signIn } from '@/lib/auth/actions';
import { palette, spacing } from '@/lib/theme/tokens';

export default function EntrarEmailScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const result = await signIn({ email, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/(tabs)/index');
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
            <Pressable hitSlop={12} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={palette.ink900} />
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>Entrar com email</Text>
            <Text style={styles.subtitle}>
              Use o email e a senha que você cadastrou no Portal Carmelitano.
            </Text>
          </View>

          <View style={styles.form}>
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
              autoComplete="password"
              textContentType="password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
            />

            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Text style={styles.linkSmall}>
                {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button onPress={handleSubmit} loading={loading} fullWidth>
              Entrar
            </Button>

            <Link href="/(auth)/recuperar-senha" asChild>
              <Pressable hitSlop={8}>
                <Text style={[styles.linkSmall, { textAlign: 'center' }]}>
                  Esqueci a senha
                </Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta?</Text>
            <Link href="/(auth)/cadastro" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Criar conta grátis</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center' },
  hero: { gap: 8 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.ink900,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 14, color: palette.ink600, lineHeight: 20 },
  form: { gap: spacing.md },
  linkSmall: { color: palette.cerrado700, fontWeight: '700', fontSize: 13 },
  error: {
    color: palette.clay600,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#FBE5DA',
    padding: 10,
    borderRadius: 10,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.lg,
  },
  footerText: { color: palette.ink600, fontSize: 13 },
  footerLink: { color: palette.cerrado700, fontSize: 15, fontWeight: '800' },
});
