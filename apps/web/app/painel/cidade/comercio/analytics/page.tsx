import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

type TopBusiness = {
  business_id: string;
  name: string;
  views: number;
  unique_visitors: number;
  phone_clicks: number;
  whatsapp_clicks: number;
};

type DailyStatRow = {
  business_id: string;
  views: number | null;
  unique_visitors: number | null;
  phone_clicks: number | null;
  whatsapp_clicks: number | null;
  businesses: { name: string | null } | null;
};

export default async function CityCommerceAnalyticsPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data: raw } = await supabase
    .from('business_daily_stats')
    .select('business_id, views, unique_visitors, phone_clicks, whatsapp_clicks, businesses(name)')
    .eq('city_id', city.id)
    .gte('date', since.toISOString().slice(0, 10))
    .order('views', { ascending: false })
    .limit(50);

  const rows = (raw ?? []).map((r: unknown) => {
    const row = r as DailyStatRow;
    return {
      business_id: row.business_id,
      name: row.businesses?.name ?? '—',
      views: row.views ?? 0,
      unique_visitors: row.unique_visitors ?? 0,
      phone_clicks: row.phone_clicks ?? 0,
      whatsapp_clicks: row.whatsapp_clicks ?? 0,
    };
  }) as TopBusiness[];

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Analytics do comércio</h1>
        <p className="mt-2 text-muted-foreground">Top negócios por visualizações nos últimos 7 dias.</p>
      </header>

      <section className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Negócio</th>
              <th className="px-4 py-3 font-medium text-right">Views</th>
              <th className="px-4 py-3 font-medium text-right">Únicos</th>
              <th className="px-4 py-3 font-medium text-right">Ligações</th>
              <th className="px-4 py-3 font-medium text-right">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.business_id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-right">{row.views}</td>
                <td className="px-4 py-3 text-right">{row.unique_visitors}</td>
                <td className="px-4 py-3 text-right">{row.phone_clicks}</td>
                <td className="px-4 py-3 text-right">{row.whatsapp_clicks}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum dado agregado ainda. O cron de agregação roda toda madrugada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
