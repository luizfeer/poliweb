import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type DailyStatsRow = {
  business_id: string;
  city_id: string;
  date: string;
  views: number;
  map_clicks: number;
  phone_clicks: number;
  whatsapp_clicks: number;
  website_clicks: number;
  total_events: number;
};

export type WeeklyRankRow = {
  business_id: string;
  city_id: string;
  week_start: string;
  category_slug: string | null;
  district_id: string | null;
  rank: number;
  score: number;
};

export async function getBusinessDailyStats(
  businessId: string,
  cityId: string,
  rangeDays: number,
): Promise<DailyStatsRow[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const { data } = await supabase
    .from('business_daily_stats')
    .select('*')
    .eq('business_id', businessId)
    .eq('city_id', cityId)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  return (data ?? []) as DailyStatsRow[];
}

export async function getBusinessWeeklyRank(
  businessId: string,
  cityId: string,
): Promise<WeeklyRankRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('business_weekly_rank')
    .select('*')
    .eq('business_id', businessId)
    .eq('city_id', cityId)
    .order('week_start', { ascending: false })
    .limit(1);

  return (data ?? []) as WeeklyRankRow[];
}

export async function getTopBusinessesByViews(
  cityId: string,
  limit = 50,
): Promise<{ business_id: string; name: string; views: number }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data } = await supabase
    .from('business_daily_stats')
    .select('business_id, views, businesses(name)')
    .eq('city_id', cityId)
    .gte('date', since.toISOString().slice(0, 10))
    .order('views', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    business_id: row.business_id as string,
    name: (row.businesses as { name: string | null } | null)?.name ?? '—',
    views: (row.views as number) ?? 0,
  }));
}

export async function getCityAggregatedStats(cityId: string) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  await supabase.rpc('aggregate_business_daily_stats', {
    p_date: since.toISOString().slice(0, 10),
  });

  const { data: top } = await supabase
    .from('business_daily_stats')
    .select('business_id, views, businesses(name)')
    .eq('city_id', cityId)
    .gte('date', since.toISOString().slice(0, 10))
    .order('views', { ascending: false })
    .limit(20);

  return {
    top: (top ?? []).map((row) => ({
      business_id: row.business_id as string,
      name: (row.businesses as { name: string | null } | null)?.name ?? '—',
      views: (row.views as number) ?? 0,
    })),
  };
}
