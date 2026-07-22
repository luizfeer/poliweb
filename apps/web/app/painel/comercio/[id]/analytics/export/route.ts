import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

type StatRow = {
  date: string;
  views: number | null;
  total_events: number | null;
  phone_clicks: number | null;
  whatsapp_clicks: number | null;
  website_clicks: number | null;
  map_clicks: number | null;
};

type StatsQueryBuilder = {
  eq: (col: string, value: unknown) => StatsQueryBuilder;
  gte: (col: string, value: unknown) => StatsQueryBuilder;
  order: (col: string, opts: { ascending: boolean }) => Promise<{ data: StatRow[] | null }>;
};

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const city = await getCurrentCity();
  if (!city) return NextResponse.json({ error: 'no city' }, { status: 400 });

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });

  const { searchParams } = new URL(request.url);
  const range = Math.min(Math.max(Number(searchParams.get('range')) || 30, 7), 90);

  const since = new Date();
  since.setDate(since.getDate() - range);

  const supabase = await createClient();
  const { data } = await (
    supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => StatsQueryBuilder;
      };
    }
  )
    .from('business_daily_stats')
    .select('date, views, total_events, phone_clicks, whatsapp_clicks, website_clicks, map_clicks')
    .eq('business_id', id)
    .eq('city_id', city.id)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  const rows: StatRow[] = (data ?? []) as StatRow[];
  const header = 'date,views,total_events,phone_clicks,whatsapp_clicks,website_clicks,map_clicks\n';
  const body = rows
    .map(
      (r: StatRow) =>
        `${r.date},${r.views ?? 0},${r.total_events ?? 0},${r.phone_clicks ?? 0},${r.whatsapp_clicks ?? 0},${r.website_clicks ?? 0},${r.map_clicks ?? 0}`,
    )
    .join('\n');

  return new NextResponse(header + body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="analytics-${id}-${range}d.csv"`,
    },
  });
}
