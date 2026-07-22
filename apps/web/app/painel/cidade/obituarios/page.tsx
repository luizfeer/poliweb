import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { upsertObituaryAction } from '@/lib/community/actions';
import { listObituaries } from '@/lib/community/queries';
import { ObituaryCard } from '@/components/public/community/cards';

export const metadata = { title: 'Obituarios admin - Portal Carmelitano' };

export default async function ObituariesAdminPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const obituaries = await listObituaries({ city_id: city.id, days: 365 });

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Obituarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Publicacao restrita para comunicados sensiveis.</p>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <form action={upsertObituaryAction} className="grid gap-3 rounded-lg border bg-card p-4">
          <input type="hidden" name="city_id" value={city.id} />
          <input name="full_name" placeholder="Nome completo" required className="rounded-md border bg-background px-3 py-2" />
          <input name="age" placeholder="Idade" type="number" className="rounded-md border bg-background px-3 py-2" />
          <input name="death_date" type="date" required className="rounded-md border bg-background px-3 py-2" />
          <input name="wake_location" placeholder="Velorio" className="rounded-md border bg-background px-3 py-2" />
          <input name="wake_at" type="datetime-local" className="rounded-md border bg-background px-3 py-2" />
          <input name="burial_location" placeholder="Sepultamento" className="rounded-md border bg-background px-3 py-2" />
          <input name="burial_at" type="datetime-local" className="rounded-md border bg-background px-3 py-2" />
          <input name="funeral_home" placeholder="Funeraria" className="rounded-md border bg-background px-3 py-2" />
          <textarea name="family_message" rows={4} placeholder="Mensagem autorizada pela familia" className="rounded-md border bg-background px-3 py-2" />
          <select name="status" defaultValue="draft" className="rounded-md border bg-background px-3 py-2">
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" type="submit">Salvar</button>
        </form>
        <div className="space-y-3">
          {obituaries.map((obituary) => <ObituaryCard key={obituary.id} obituary={obituary} />)}
        </div>
      </section>
    </main>
  );
}
