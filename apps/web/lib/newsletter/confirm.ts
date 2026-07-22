import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { hashToken } from './tokens';
import { logConsent } from './subscribe';

export async function confirmNewsletter(token: string, request?: Request) {
  const supabase = await createClient();
  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ confirmed_at: new Date().toISOString(), confirmation_token_hash: null })
    .eq('confirmation_token_hash', tokenHash)
    .select('city_id, email')
    .maybeSingle();
  if (error || !data) return { ok: false };

  await logConsent({ cityId: data.city_id, email: data.email, event: 'confirm', source: 'email', request });
  return { ok: true };
}

export async function unsubscribeNewsletter(token: string, request?: Request) {
  const supabase = await createClient();
  const tokenHash = hashToken(token);
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token_hash', tokenHash)
    .select('city_id, email')
    .maybeSingle();
  if (error || !data) return { ok: false };

  await logConsent({ cityId: data.city_id, email: data.email, event: 'unsubscribe', source: 'email', request });
  return { ok: true };
}
