import Link from 'next/link';
import { submitForReviewAction, requestRemovalAction } from '@/app/painel/imobiliaria/actions';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

export default async function MyPropertiesPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  const auth = await requireProfile();
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, status, review_status, payment_status, rejection_reason, created_at')
    .eq('city_id', city.id)
    .eq('owner_profile_id', auth.profile.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus imóveis</h1>
          <p className="text-muted-foreground">Rascunhos, pendências e publicados.</p>
        </div>
        <Link href="/painel/imobiliaria/imoveis/novo" className={buttonVariants()}>
          Novo imóvel
        </Link>
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
            <CardContent className="flex flex-wrap gap-2">
              {(property.status === 'draft' || property.review_status === 'needs_changes') && (
                <SubmitOnceForm action={submitForReviewAction}>
                  <input type="hidden" name="property_id" value={property.id} />
                  <SubmitOnceButton
                    label="Enviar para aprovação"
                    pendingLabel="Enviando..."
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-75"
                  />
                </SubmitOnceForm>
              )}
              <SubmitOnceForm action={requestRemovalAction}>
                <input type="hidden" name="property_id" value={property.id} />
                <SubmitOnceButton
                  label="Arquivar"
                  pendingLabel="Arquivando..."
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                />
              </SubmitOnceForm>
              {property.rejection_reason && (
                <p className="basis-full text-sm text-muted-foreground">Motivo: {property.rejection_reason}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {(properties ?? []).length === 0 && (
          <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">Nenhum imóvel cadastrado.</p>
        )}
      </div>
    </div>
  );
}
