import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { CATEGORIES } from '@/lib/businesses';
import { MOCK_BUSINESSES } from '@/lib/businesses/mock';
import { getCurrentCity } from '@/lib/cities';

export const metadata = {
  title: 'Mocks de referência — Portal Carmelitano',
  description: 'Referência visual dos dados mock do guia comercial.',
};

function formatCategoryLabel(slug: string): string {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

export default async function MocsPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const published = MOCK_BUSINESSES.filter((business) => business.status === 'published');
  const featured = published.filter((business) => business.featured);
  const claimed = published.filter((business) => business.claimed);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Referência interna</p>
          <h1 className="text-3xl font-bold">Mocks do guia comercial</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Página estática para comparar os dados mock de `apps/web/lib/businesses/mock.ts` com o
            conteúdo que entrar pelo Supabase e pelo import Cliqueiachei.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Alias: <code>/mocks</code> redireciona para esta rota.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ['Total publicado', published.length],
            ['Destaques', featured.length],
            ['Reivindicados', claimed.length],
            ['Categorias', CATEGORIES.length],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Negócios mock</h2>
          <div className="mt-4 grid gap-3">
            {published.map((business) => (
              <article key={business.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{business.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {business.shortDescription ?? 'Sem descrição curta'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {business.district ?? 'Sem bairro'} · {business.categories.map(formatCategoryLabel).join(' / ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {business.featured && <span className="rounded-full bg-primary px-2 py-1 text-primary-foreground">Destaque</span>}
                    {business.verified && <span className="rounded-full border px-2 py-1">Verificado</span>}
                    <span className="rounded-full border px-2 py-1">{business.claimed ? 'Claimed' : 'Sem dono'}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <Link className="text-primary hover:underline" href={`/comercio/negocio/${business.slug}`}>
                    Ver ficha pública
                  </Link>
                  <span className="text-muted-foreground">slug: {business.slug}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
