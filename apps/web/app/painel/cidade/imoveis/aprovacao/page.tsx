import {
  approvePropertyAction,
  rejectPropertyAction,
  requestChangesAction,
  waivePaymentAction,
} from '@/app/painel/cidade/imoveis/actions';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export default async function PropertyApprovalQueuePage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, listing_type, property_type, payment_status, payment_amount_cents, review_status, created_at')
    .eq('city_id', city.id)
    .in('review_status', ['pending', 'needs_changes'])
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Fila de aprovação</h1>
        <p className="text-muted-foreground">Revise imóveis antes da publicação em {city.name}.</p>
      </header>

      <div className="space-y-3">
        {(properties ?? []).map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle>{property.title}</CardTitle>
              <CardDescription>
                {property.listing_type} / {property.property_type} · pagamento {property.payment_status}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <SubmitOnceForm action={approvePropertyAction}>
                  <input type="hidden" name="property_id" value={property.id} />
                  <SubmitOnceButton
                    label="Aprovar"
                    pendingLabel="Aprovando..."
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-75"
                  />
                </SubmitOnceForm>
                <SubmitOnceForm action={waivePaymentAction}>
                  <input type="hidden" name="property_id" value={property.id} />
                  <input type="hidden" name="reason" value="Cortesia manual do admin" />
                  <SubmitOnceButton
                    label="Liberar cortesia"
                    pendingLabel="Liberando..."
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                  />
                </SubmitOnceForm>
              </div>

              <SubmitOnceForm action={requestChangesAction} className="flex flex-col gap-2 md:flex-row">
                <input type="hidden" name="property_id" value={property.id} />
                <input name="reason" placeholder="Motivo para pedir mudanças" className="h-8 flex-1 rounded-md border px-2 text-sm" />
                <SubmitOnceButton
                  label="Pedir mudanças"
                  pendingLabel="Enviando..."
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                />
              </SubmitOnceForm>

              <SubmitOnceForm action={rejectPropertyAction} className="flex flex-col gap-2 md:flex-row">
                <input type="hidden" name="property_id" value={property.id} />
                <input name="reason" placeholder="Motivo da rejeição" className="h-8 flex-1 rounded-md border px-2 text-sm" />
                <SubmitOnceButton
                  label="Rejeitar"
                  pendingLabel="Rejeitando..."
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-75"
                />
              </SubmitOnceForm>
            </CardContent>
          </Card>
        ))}
        {(properties ?? []).length === 0 && (
          <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">Nenhum imóvel na fila.</p>
        )}
      </div>
    </div>
  );
}
