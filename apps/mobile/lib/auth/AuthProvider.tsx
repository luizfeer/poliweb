import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { clearHomeScreenCacheFully } from '@/lib/home/fetch-home-screen';
import { setGuestMode } from '@/lib/onboarding/state';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const authTimeout = setTimeout(() => {
      if (!mountedRef.current) return;
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    }, 8_000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mountedRef.current) return;
        const user = data.session?.user ? await hydrateProfileMetadata(data.session.user) : null;
        if (!mountedRef.current) return;
        setState({ session: data.session, user, loading: false });
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setState({ session: null, user: null, loading: false });
      })
      .finally(() => {
        clearTimeout(authTimeout);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setState({ session, user: session?.user ?? null, loading: false });
      if (session?.user) {
        void hydrateProfileMetadata(session.user).then((user) => {
          if (!mountedRef.current) return;
          setState((prev) => {
            if (prev.session?.user.id !== user.id) return prev;
            return { ...prev, user };
          });
        });
      }
    });

    const onAppStateChange = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
      onAppStateChange.remove();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signOut: async () => {
        await supabase.auth.signOut();
        await setGuestMode(false);
        await clearHomeScreenCacheFully();
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function hydrateProfileMetadata(user: User): Promise<User> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (!data?.full_name && !data?.avatar_url) return user;

  return {
    ...user,
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: data.full_name ?? user.user_metadata?.full_name,
      avatar_url: data.avatar_url ?? user.user_metadata?.avatar_url,
    },
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
