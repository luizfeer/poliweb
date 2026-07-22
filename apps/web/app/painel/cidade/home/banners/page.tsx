import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Link } from '@/components/navigation/link';
import { Check, Hourglass, X } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { approveBannerRequestAction, rejectBannerRequestAction } from '@/lib/studio/actions';

type BannerRequest = {
  id: string;
  business_id: string;
  image_url: string;
  title: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  businesses: { name: string; slug: string } | null;
};

export default async function HomeBannerRequestsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('home_banner_requests' as any) as any)
    .select('id, business_id, image_url, title, status, created_at, businesses(name, slug)')
    .eq('city_id', city.id)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  const requests = (data ?? []) as BannerRequest[];
  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  async function approve(formData: FormData) {
    'use server';
    await approveBannerRequestAction(formData);
  }
  async function reject(formData: FormData) {
    'use server';
    await rejectBannerRequestAction(formData);
  }

  return (
    <div className="space-y-6">
      <header>
        <Link className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground" href="/painel/cidade/home">
          ← Home da cidade
        </Link>
        <h1 className="text-2xl font-bold">Pedidos de banner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Artes que os comerciantes querem colocar na home. Aprovar adiciona ao carrossel de banners.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Hourglass className="size-4" /> Aguardando ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Nenhum pedido na fila.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {pending.map((r) => (
            <article key={r.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="relative aspect-[4/5] bg-muted">
                <Image src={r.image_url} alt={r.title ?? ''} fill unoptimized className="object-cover" sizes="400px" />
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="font-semibold">{r.title ?? 'Sem título'}</p>
                  <p className="text-sm text-muted-foreground">{r.businesses?.name ?? 'Negócio'}</p>
                </div>
                <div className="flex gap-2">
                  <form action={approve}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                      <Check className="size-4" /> Aprovar e publicar
                    </button>
                  </form>
                  <form action={reject}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                      <X className="size-4" /> Recusar
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {decided.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Decididos</h2>
          <div className="grid gap-2">
            {decided.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={r.image_url} alt="" fill unoptimized className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title ?? 'Sem título'}</p>
                  <p className="text-xs text-muted-foreground">{r.businesses?.name}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    r.status === 'approved' ? 'bg-cerrado-100 text-cerrado-700' : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {r.status === 'approved' ? 'Aprovado' : 'Recusado'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
