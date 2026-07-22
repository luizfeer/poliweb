import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

import { recoverSchema, signInSchema, signUpSchema } from './schemas';

export type AuthResult = { ok: true } | { ok: false; message: string };

export type OAuthProvider = 'google' | 'apple';

function mapAuthError(message: string | undefined): string {
  if (!message) return 'Não foi possível concluir. Tente novamente.';
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme o email antes de entrar.';
  if (m.includes('user already registered')) return 'Já existe conta com este email.';
  if (m.includes('rate limit')) return 'Muitas tentativas. Tente novamente em alguns minutos.';
  return message;
}

export async function signIn(raw: unknown): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }
  const { email, password } = parsed.data;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true };
}

export async function signUp(raw: unknown): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }
  const { email, password, name } = parsed.data;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${env.webBaseUrl}/auth/callback`,
    },
  });
  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true };
}

export async function signInWithProvider(provider: OAuthProvider): Promise<AuthResult> {
  if (provider === 'apple' && Platform.OS === 'ios') {
    return signInWithAppleNative();
  }
  try {
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { ok: false, message: mapAuthError(error.message) };
    if (!data?.url) return { ok: false, message: 'Não foi possível iniciar o login.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, message: 'Login cancelado.' };
    }
    if (result.type !== 'success' || !result.url) {
      return { ok: false, message: 'Não foi possível concluir o login.' };
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const errorDescription = url.searchParams.get('error_description');
    if (errorDescription) return { ok: false, message: mapAuthError(errorDescription) };

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) return { ok: false, message: mapAuthError(exchangeError.message) };
      return { ok: true };
    }

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : '';
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) return { ok: false, message: mapAuthError(sessionError.message) };
      return { ok: true };
    }

    return { ok: false, message: 'Resposta de autenticação inválida.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado no login.';
    return { ok: false, message: mapAuthError(message) };
  }
}

async function signInWithAppleNative(): Promise<AuthResult> {
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { ok: false, message: 'Sign in with Apple não disponível neste dispositivo.' };
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const identityToken = credential.identityToken;
    if (!identityToken) {
      return { ok: false, message: 'Não foi possível obter o token da Apple.' };
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });
    if (error) return { ok: false, message: mapAuthError(error.message) };
    return { ok: true };
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
      return { ok: false, message: 'Login cancelado.' };
    }
    const message = err instanceof Error ? err.message : 'Erro no login Apple.';
    return { ok: false, message: mapAuthError(message) };
  }
}

export async function recoverPassword(raw: unknown): Promise<AuthResult> {
  const parsed = recoverSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Email inválido' };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.webBaseUrl}/auth/recuperar-senha`,
  });
  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true };
}
