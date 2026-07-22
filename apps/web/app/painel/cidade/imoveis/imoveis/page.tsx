import { featurePropertyAction } from '@/app/painel/cidade/imoveis/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export default async function CityPropertiesPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, status, review_status, payment_status, featured, created_at')
    .eq('city_id', city.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Todos os imóveis</h1>
        <p className="text-muted-foreground">Visão operacional dos anúncios da cidade.</p>
      </header>

      <div className="space-y-3">
        {(properties ?? []).map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle>{property.title}</CardTitle>
              <CardDescription>
                {property.status} · revisão {property.review_status} · pagamento {property.payment_status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={featurePropertyAction} className="flex items-center gap-2">
                <input type="hidden" name="property_id" value={property.id} />
                <input name="duration_days" defaultValue="30" className="h-8 w-24 rounded-md border px-2 text-sm" />
                <Button type="submit" size="sm" variant="outline">
                  Destacar
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
