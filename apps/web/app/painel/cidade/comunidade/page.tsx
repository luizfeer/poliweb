import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { upsertEventCategoryAction } from '@/lib/community/actions';
import { listContentReports, listEventCategories, listModerationQueue } from '@/lib/community/queries';
import { createClient } from '@/lib/supabase/server';
import { ModerationQueue, ReportList } from '@/components/admin/community/moderation-queue';

export const metadata = { title: 'Moderacao da comunidade - Portal Carmelitano' };

export default async function CityCommunityPanelPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });

  const supabase = await createClient();
  const [queue, reports, categories, churchesResult] = await Promise.all([
    listModerationQueue(city.id),
    listContentReports(city.id),
    listEventCategories(city.id),
    supabase
      .from('churches')
      .select('id, name, slug, status, claimed')
      .eq('city_id', city.id)
      .order('name', { ascending: true }),
  ]);
  const churches = churchesResult.data ?? [];

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border bg-card p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Admin da cidade</p>
          <h1 className="text-3xl font-bold">Comunidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fila UGC, denuncias e categorias de agenda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/painel/cidade/obituarios" className="rounded-md border px-4 py-2 text-sm">
            Obituarios
          </Link>
          <Link href="/comunidade/grupos" className="rounded-md border px-4 py-2 text-sm">
            Diretorio de grupos
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Fila de pendentes</h2>
        <ModerationQueue items={queue} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Denuncias</h2>
          <ReportList reports={reports} />
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Categorias da agenda</h2>
          <form action={upsertEventCategoryAction} className="grid gap-3 rounded-lg border bg-card p-4">
            <input name="name" placeholder="Nome" className="rounded-md border bg-background px-3 py-2" />
            <input name="slug" placeholder="slug" className="rounded-md border bg-background px-3 py-2" />
            <input name="icon" placeholder="icone lucide" className="rounded-md border bg-background px-3 py-2" />
            <input name="display_order" type="number" defaultValue="0" className="rounded-md border bg-background px-3 py-2" />
            <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" type="submit">Salvar categoria</button>
          </form>
          <div className="space-y-2">
            {categories.map((category) => (
              <p key={category.id} className="rounded-md border bg-card px-3 py-2 text-sm">
                {category.name} <span className="text-muted-foreground">/{category.slug}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Igrejas</h2>
        <div className="grid gap-2">
          {churches.map((church) => (
            <Link
              key={church.id}
              href={`/painel/cidade/comunidade/igrejas/${church.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted hover:no-underline"
            >
              <span className="font-medium text-foreground">{church.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {church.status} - {church.claimed ? 'reivindicada' : 'nao reivindicada'}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
