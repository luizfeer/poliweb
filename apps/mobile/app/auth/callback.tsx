import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { mobileDebug } from '@/lib/debug';
import { supabase } from '@/lib/supabase';
import { palette } from '@/lib/theme/tokens';

/**
 * Fallback route para o deep link OAuth (carmelitano://auth/callback?...).
 * Normalmente o WebBrowser.openAuthSessionAsync intercepta antes — esse arquivo
 * é a rede de segurança para cold start via link, push notification, etc.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    let cancelled = false;

    async function handle() {
      mobileDebug('auth-callback', 'received', {
        hasCode: Boolean(params.code),
        hasTokens: Boolean(params.access_token && params.refresh_token),
        error: params.error ?? null,
      });

      try {
        if (params.code) {
          await supabase.auth.exchangeCodeForSession(params.code);
        } else if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      } catch (err) {
        mobileDebug('auth-callback', 'exchange failed', { message: String(err) });
      }

      if (cancelled) return;
      router.replace('/(tabs)' as never);
    }

    void handle();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.access_token, params.refresh_token, params.error]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={palette.cerrado700} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
});
