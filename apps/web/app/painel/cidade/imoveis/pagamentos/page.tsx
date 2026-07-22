import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { formatCentsAsCurrency } from '@/lib/real-estate';
import { createClient } from '@/lib/supabase/server';

export default async function RealEstatePaymentsPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('properties')
    .select('payment_status, payment_amount_cents')
    .eq('city_id', city.id);

  const totalCents = (rows ?? []).reduce((sum, row) => sum + (row.payment_amount_cents ?? 0), 0);
  const paidCents = (rows ?? [])
    .filter((row) => row.payment_status === 'paid' || row.payment_status === 'waived')
    .reduce((sum, row) => sum + (row.payment_amount_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <p className="text-muted-foreground">Resumo preparado para a futura API de pagamento.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{formatCentsAsCurrency(totalCents)}</CardTitle>
            <CardDescription>Cobranças geradas</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatCentsAsCurrency(paidCents)}</CardTitle>
            <CardDescription>Pago ou liberado por cortesia</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
