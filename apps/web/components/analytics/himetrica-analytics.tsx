'use client';

import Script from 'next/script';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getHighestRole } from '@/lib/auth/roles';
import type { ProfileRole } from '@/lib/auth/types';
import { himetricaIdentify } from '@/lib/analytics/himetrica';
import { hasConsentPurpose } from '@/lib/privacy/client-consent';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/client';

const TRACKER_SRC = 'https://cdn.himetrica.com/tracker.js';
const API_KEY = 'hm_c2f2fd25d50eef09169b1d24a7f952a9575ba9b1e5043fc9';

function canLoadExternalTracker(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.dataset.embeddedApp === 'true') return false;

  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local') ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    return false;
  }

  return window.location.protocol === 'https:';
}

async function identifySession(
  supabase: SupabaseClient<Database>,
  session: Session | null,
) {
  if (!session?.user) return;

  const user = session.user;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, created_at, default_city_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('profile_roles').select('*').eq('profile_id', user.id),
  ]);

  const roles = (roleRows ?? []) as ProfileRole[];
  const highestRole = getHighestRole(roles, profile?.default_city_id ?? undefined);

  const name =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined);

  himetricaIdentify({
    ...(name ? { name } : {}),
    ...(user.email ? { email: user.email } : {}),
    metadata: {
      profileId: user.id,
      createdAt: profile?.created_at ?? user.created_at,
      ...(highestRole ? { role: highestRole } : {}),
    },
  });
}

export function HimetricaAnalytics() {
  const [scriptReady, setScriptReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(canLoadExternalTracker() && hasConsentPurpose('analytics'));
    sync();
    window.addEventListener('carmo:consent', sync);
    return () => window.removeEventListener('carmo:consent', sync);
  }, []);

  useEffect(() => {
    if (!enabled || !scriptReady) return;

    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void identifySession(supabase, session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void identifySession(supabase, session);
    });

    return () => subscription.unsubscribe();
  }, [enabled, scriptReady]);

  if (!enabled) return null;

  return (
    <Script
      src={TRACKER_SRC}
      strategy="afterInteractive"
      data-api-key={API_KEY}
      onLoad={() => setScriptReady(true)}
    />
  );
}
