import Link from 'next/link';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { requestPublishAccommodationAction } from './actions';

export default async function PainelTurismoPage() {
  const city = await getCurrentCity();
  if (!city) return null;

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  const supabase = await createClient();
  const ownerFilter = canManageAll ? 'id.not.is.null' : `owner_profile_id.eq.${auth.profile.id}`;
  const [accommodations, restaurants, guides] = await Promise.all([
    supabase.from('accommodations').select('id, name, slug, status').eq('city_id', city.id).or(ownerFilter),
    supabase.from('restaurants').select('id, name, slug, status').eq('city_id', city.id).or(ownerFilter),
    supabase.from('fishing_guides').select('id, full_name, slug, status').eq('city_id', city.id).or(ownerFilter),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-6">
        <div>
          <p className="text-sm text-muted-foreground">Turismo</p>
          <h1 className="text-3xl font-bold">Minhas fichas turísticas</h1>
          <p className="mt-2 text-muted-foreground">Hospedagens, restaurantes e guias de pesca.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/painel/turismo/acomodacoes/novo">Nova hospedagem</Link>
          <Link className="rounded-lg border px-4 py-2 text-sm hover:bg-muted" href="/painel/turismo/restaurantes/novo">Novo restaurante</Link>
          <Link className="rounded-lg border px-4 py-2 text-sm hover:bg-muted" href="/painel/turismo/pesca/novo">Novo guia</Link>
        </div>
      </header>

      <div className="grid gap-3">
        {(accommodations.data ?? []).map((item) => (
          <article key={item.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-muted-foreground">Hospedagem · {item.status}</p>
              </div>
              <div className="flex gap-2">
                <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/turismo/acomodacoes/${item.id}`}>Editar</Link>
                {item.status === 'draft' && (
                  <SubmitOnceForm action={requestPublishAccommodationAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitOnceButton
                      label="Solicitar publicação"
                      pendingLabel="Enviando..."
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-wait disabled:opacity-75"
                    />
                  </SubmitOnceForm>
                )}
              </div>
            </div>
          </article>
        ))}
        {(restaurants.data ?? []).map((item) => (
          <article key={item.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-muted-foreground">Restaurante · {item.status}</p>
              </div>
              <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/turismo/restaurantes/${item.id}`}>Editar</Link>
            </div>
          </article>
        ))}
        {(guides.data ?? []).map((item) => (
          <article key={item.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.full_name}</h2>
                <p className="text-sm text-muted-foreground">Guia de pesca · {item.status}</p>
              </div>
              <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-muted" href={`/painel/turismo/pesca/${item.id}`}>Editar</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
