import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getBusinessDailyStats, getBusinessWeeklyRank } from '@/lib/analytics/queries';
import { AnalyticsDashboard } from './analytics-dashboard';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
};

export default async function BusinessAnalyticsPage({ params, searchParams }: PageProps) {
  const [{ id }, city, { range }] = await Promise.all([params, getCurrentCity(), searchParams]);
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });

  const rangeDays = Math.min(Math.max(Number(range) || 30, 7), 90) as 7 | 30 | 90;

  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, city_id, district_id, business_category_assignments(category_id, is_primary)')
    .eq('id', id)
    .eq('city_id', city.id)
    .single();

  if (!business) notFound();

  const [dailyStats, weeklyRank] = await Promise.all([
    getBusinessDailyStats(id, city.id, rangeDays),
    getBusinessWeeklyRank(id, city.id),
  ]);

  const primaryCategoryId = (business.business_category_assignments as Array<{ category_id: string; is_primary: boolean }> | null)?.find(
    (a) => a.is_primary,
  )?.category_id;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <Link className="text-sm text-muted-foreground hover:underline" href={`/painel/comercio/${id}`}>
          ← Voltar para ficha
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{business.name} — Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Métricas de visualização e engajamento da sua ficha.
        </p>
      </header>

      <AnalyticsDashboard
        businessId={id}
        initialRange={rangeDays}
        dailyStats={dailyStats}
        weeklyRank={weeklyRank}
        primaryCategoryId={primaryCategoryId}
      />
    </div>
  );
}
