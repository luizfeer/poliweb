import { Link } from '@/components/navigation/link';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { upsertPromotionAction } from '../../actions';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessPromotionsPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) return null;

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();
  const [{ data: business }, { data: promotions }] = await Promise.all([
    supabase.from('businesses').select('id, name').eq('id', id).eq('city_id', city.id).single(),
    supabase
      .from('business_promotions')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!business) return null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-6">
        <Link className="text-sm text-muted-foreground hover:underline" href={`/painel/comercio/${business.id}`}>
          ← Voltar para ficha
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Promoções de {business.name}</h1>
      </header>

      <form action={upsertPromotionAction} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
        <input type="hidden" name="business_id" value={business.id} />
        <label className="grid gap-2 text-sm font-medium">
          Título
          <input className="rounded-lg border px-3 py-2" name="title" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Cupom
          <input className="rounded-lg border px-3 py-2" name="coupon_code" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Desconto %
          <input className="rounded-lg border px-3 py-2" name="discount_percent" type="number" min="0" max="100" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Início
          <input className="rounded-lg border px-3 py-2" name="valid_from" type="datetime-local" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Fim
          <input className="rounded-lg border px-3 py-2" name="valid_until" type="datetime-local" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="active" type="checkbox" defaultChecked />
          Ativa
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Descrição
          <textarea className="min-h-24 rounded-lg border px-3 py-2" name="description" />
        </label>
        <div className="md:col-span-2">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
            Criar promoção
          </button>
        </div>
      </form>

      <div className="grid gap-3">
        {(promotions ?? []).map((promotion) => (
          <article key={promotion.id} className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">{promotion.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {promotion.active ? 'Ativa' : 'Inativa'} · {promotion.coupon_code ?? 'sem cupom'}
            </p>
            {promotion.description && <p className="mt-2 text-sm">{promotion.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
