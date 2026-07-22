import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { AuthContext, Profile, ProfileRole } from './types';

async function hasSupabaseAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'));
}

export const getProfile = cache(async (): Promise<AuthContext | null> => {
  if (!(await hasSupabaseAuthCookie())) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('profile_roles').select('*').eq('profile_id', user.id),
    ]);

  if (profileError || rolesError || !profile) {
    return null;
  }

  return {
    profile: profile as Profile,
    roles: (roles ?? []) as ProfileRole[],
  };
});
