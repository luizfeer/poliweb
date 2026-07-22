import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type NewsletterStats = {
  active: number;
  pending: number;
  unsubscribed: number;
  campaigns: number;
};

export async function getNewsletterStats(cityId: string): Promise<NewsletterStats> {
  const supabase = await createClient();
  const [subscribers, campaigns] = await Promise.all([
    supabase.from('newsletter_subscribers').select('confirmed_at, unsubscribed_at').eq('city_id', cityId),
    supabase.from('newsletter_campaigns').select('id', { count: 'exact', head: true }).eq('city_id', cityId),
  ]);

  const rows = subscribers.data ?? [];
  return {
    active: rows.filter((row) => row.confirmed_at && !row.unsubscribed_at).length,
    pending: rows.filter((row) => !row.confirmed_at && !row.unsubscribed_at).length,
    unsubscribed: rows.filter((row) => row.unsubscribed_at).length,
    campaigns: campaigns.count ?? 0,
  };
}

export async function listSubscribers(cityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, source, confirmed_at, unsubscribed_at, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function listCampaigns(cityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('newsletter_campaigns')
    .select('id, subject, sent_at, recipients_count, opens_count, clicks_count, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function listConsentHistory(cityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('newsletter_consent_history')
    .select('id, email, event, source, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}
