import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export default async function CityRealtorsAdminPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: realtors } = await supabase
    .from('realtors')
    .select('id, name, status, verified, subscription_plan, created_at')
    .eq('city_id', city.id)
    .order('name', { ascending: true });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Imobiliárias</h1>
        <p className="text-muted-foreground">Empresas e planos do módulo imobiliário.</p>
      </header>
      <div className="space-y-3">
        {(realtors ?? []).map((realtor) => (
          <Card key={realtor.id}>
            <CardHeader>
              <CardTitle>{realtor.name}</CardTitle>
              <CardDescription>
                {realtor.status} · plano {realtor.subscription_plan} · {realtor.verified ? 'verificada' : 'não verificada'}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
