import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { reviewClaimAction } from '../actions';

export default async function BusinessClaimsPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const supabase = await createClient();
  const { data: claims } = await supabase
    .from('business_claims')
    .select('id, status, evidence_text, created_at, profiles(full_name, phone), businesses(id, name, city_id)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const cityClaims = (claims ?? []).filter((claim) => {
    const business = claim.businesses as { city_id?: string } | null;
    return business?.city_id === city.id;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Claims pendentes</h1>
        <p className="text-muted-foreground">Entre em contato com a pessoa e aprove quando o vínculo for validado.</p>
      </header>

      <div className="grid gap-3">
        {cityClaims.map((claim) => {
          const profile = claim.profiles as { full_name?: string | null; phone?: string | null } | null;
          const business = claim.businesses as { name?: string | null } | null;
          return (
            <article key={claim.id} className="rounded-2xl border bg-card p-5">
              <h2 className="font-semibold">{business?.name ?? 'Negócio'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Solicitado por {profile?.full_name ?? 'usuário'}</p>
              {profile?.phone && <p className="mt-1 text-sm text-muted-foreground">Contato: {profile.phone}</p>}
              <p className="mt-3 text-sm">{claim.evidence_text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SubmitOnceForm action={reviewClaimAction}>
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="action" value="approve" />
                  <SubmitOnceButton
                    label="Aprovar"
                    pendingLabel="Aprovando..."
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-wait disabled:opacity-75"
                  />
                </SubmitOnceForm>
                <SubmitOnceForm action={reviewClaimAction} className="flex gap-2">
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="action" value="reject" />
                  <input className="rounded-lg border px-2 py-2 text-sm" name="reason" placeholder="Motivo" required />
                  <SubmitOnceButton
                    label="Rejeitar"
                    pendingLabel="Rejeitando..."
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:cursor-wait disabled:opacity-75"
                  />
                </SubmitOnceForm>
              </div>
            </article>
          );
        })}
        {cityClaims.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-muted-foreground">Nenhum claim pendente.</div>
        )}
      </div>
    </div>
  );
}
