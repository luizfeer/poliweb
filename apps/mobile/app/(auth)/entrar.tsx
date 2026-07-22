import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { AuthLegalNotice } from '@/components/auth/AuthLegalNotice';
import { signInWithProvider } from '@/lib/auth/actions';
import { closeOverlay } from '@/lib/navigation/close-overlay';
import { resetOnboarding, setGuestMode } from '@/lib/onboarding/state';
import { palette, radius, spacing } from '@/lib/theme/tokens';

export default function EntrarScreen() {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApple() {
    setError(null);
    setLoading('apple');
    const result = await signInWithProvider('apple');
    setLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/(tabs)/index');
  }

  async function handleGoogle() {
    setError(null);
    setLoading('google');
    const result = await signInWithProvider('google');
    setLoading(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/(tabs)/index');
  }

  async function continueAsGuest() {
    await setGuestMode(true);
    closeOverlay('/(tabs)/index');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[palette.cerrado100, palette.paper]}
          style={styles.hero}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={styles.heroTop}>
            <Logo size={28} />
            <Pressable hitSlop={12} onPress={() => closeOverlay('/(tabs)/index')}>
              <Ionicons name="close" size={22} color={palette.ink600} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.badge}>
              <Ionicons name="location" size={12} color={palette.cerrado700} />
              <Text style={styles.badgeText}>Carmo do Rio Claro · MG</Text>
            </View>
            <Text style={styles.title}>Bem-vindo ao Portal Carmelitano</Text>
            <Text style={styles.subtitle}>
              Entre para acompanhar seu painel, favoritar lugares e receber alertas da cidade.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.actions}>
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.md}
              style={styles.appleButton}
              onPress={handleApple}
            />
          ) : (
            <Button
              variant="secondary"
              fullWidth
              loading={loading === 'google'}
              disabled={loading !== null}
              onPress={handleGoogle}
            >
              Continuar com Google
            </Button>
          )}

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/entrar-email')}
            style={({ pressed }) => [styles.emailRow, pressed && styles.emailRowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Entrar com email"
          >
            <Ionicons name="mail-outline" size={18} color={palette.ink900} />
            <Text style={styles.emailRowText} numberOfLines={1}>
              Entrar com email
            </Text>
            <Ionicons name="chevron-forward" size={16} color={palette.ink400} />
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Ainda não tem conta?</Text>
            <Link href="/(auth)/cadastro" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.signupLink}>Criar conta grátis</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.terms}>
          <AuthLegalNotice />
        </View>
      </ScrollView>

      <View style={styles.guestBar}>
        <Pressable
          onPress={continueAsGuest}
          accessibilityRole="button"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={styles.guestText}>Continuar como visitante</Text>
        </Pressable>

        {__DEV__ ? (
          <Pressable
            onPress={async () => {
              await resetOnboarding();
              router.replace('/onboarding');
            }}
            hitSlop={8}
            style={{ marginTop: 8 }}
          >
            <Text style={styles.devLink}>· dev · ver onboarding de novo</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  scroll: { paddingBottom: spacing.lg },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBody: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.cerrado700,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.ink900,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: palette.ink600,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  line: { flex: 1, height: 1, backgroundColor: palette.ink100 },
  dividerText: { color: palette.ink600, fontSize: 12, fontWeight: '700' },
  emailRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  emailRowPressed: { opacity: 0.85 },
  emailRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink900,
  },
  error: {
    color: palette.clay600,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#FBE5DA',
    padding: 10,
    borderRadius: radius.sm,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  signupText: { color: palette.ink600, fontSize: 13 },
  signupLink: { color: palette.cerrado700, fontSize: 14, fontWeight: '800' },
  terms: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  guestBar: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: palette.ink100,
    backgroundColor: palette.paper,
  },
  guestText: {
    color: palette.ink700,
    fontWeight: '800',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  devLink: {
    color: palette.ink400,
    fontSize: 11,
    fontWeight: '600',
  },
});
