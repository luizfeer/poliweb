import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMonthlyReport } from '@/lib/businesses/report-queries';
import { BusinessTabs } from '../business-tabs';
import { BoletimView } from './boletim-view';

type PageProps = { params: Promise<{ id: string }> };

function recentClosedMonths(count: number): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default async function BusinessReportPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) notFound();

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, owner_profile_id')
    .eq('id', id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (!business) notFound();

  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  if (!canManageAll) {
    const isOwner = business.owner_profile_id === auth.profile.id;
    if (!isOwner) {
      const { data: manager } = await supabase
        .from('entity_managers')
        .select('id')
        .eq('profile_id', auth.profile.id)
        .eq('entity_type', 'business')
        .eq('entity_id', id)
        .maybeSingle();
      if (!manager) notFound();
    }
  }

  const months = recentClosedMonths(6);
  const defaultMonth = months[0];
  const initialReport = await getMonthlyReport(business.id, `${defaultMonth}-01`);

  return (
    <div className="space-y-4">
      <BusinessTabs businessId={business.id} active="boletim" />
      <header>
        <Link
          className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground"
          href={`/painel/comercio/${id}`}
        >
          ← {business.name}
        </Link>
        <h1 className="text-2xl font-bold">Boletim mensal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Um resumo do desempenho do seu negócio a cada mês — pra acompanhar e compartilhar.
        </p>
      </header>

      <BoletimView
        businessId={business.id}
        businessName={business.name}
        months={months}
        defaultMonth={defaultMonth}
        initialReport={initialReport}
      />
    </div>
  );
}
