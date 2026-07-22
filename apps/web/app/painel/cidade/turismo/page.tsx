import { Link } from '@/components/navigation/link';
import { BookOpen, Camera, MapPinned, MessageSquare, Route, UserRoundCheck } from 'lucide-react';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const ITEMS = [
  ['/painel/cidade/turismo/guias', 'Guias editoriais', 'Distritos, páginas tipo Conheça Itaci e roteiros longos', BookOpen],
  ['/painel/cidade/turismo/atracoes', 'Atrações', 'Catálogo, owners, Google, serviços e avaliações', MapPinned],
  ['/painel/cidade/turismo/pesca', 'Pesca', 'Pontos e verificação de guias', Route],
  ['/painel/cidade/turismo/pacotes', 'Roteiros', 'Roteiros curados e ofertas turísticas', Route],
  ['/painel/cidade/turismo/aprovacoes', 'Aprovações', 'Fila de merchants, reviews e fotos', MessageSquare],
] as const;

async function getTourismKpis(cityId: string) {
  const supabase = await createClient();
  const [published, pendingReviews, pendingPhotos, owned] = await Promise.all([
    supabase.from('attractions').select('id', { count: 'exact', head: true }).eq('city_id', cityId).eq('status', 'published'),
    supabase.from('attraction_reviews').select('id', { count: 'exact', head: true }).eq('city_id', cityId).eq('status', 'pending'),
    supabase.from('attraction_photos').select('id', { count: 'exact', head: true }).eq('city_id', cityId).eq('status', 'pending'),
    supabase.from('attractions').select('id', { count: 'exact', head: true }).eq('city_id', cityId).not('owner_profile_id', 'is', null),
  ]);

  return [
    ['Atrações publicadas', published.count ?? 0, MapPinned],
    ['Reviews pendentes', pendingReviews.count ?? 0, MessageSquare],
    ['Fotos pendentes', pendingPhotos.count ?? 0, Camera],
    ['Owners atribuídos', owned.count ?? 0, UserRoundCheck],
  ] as const;
}

export default async function CidadeTurismoPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const kpis = await getTourismKpis(city.id);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Admin da cidade</p>
        <h1 className="text-3xl font-bold">Turismo</h1>
        <p className="mt-2 text-muted-foreground">Gestão do módulo tourism com atrações, roteiros e moderação UGC.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        {kpis.map(([label, value, Icon]) => (
          <article key={label} className="rounded-xl border bg-card p-4">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <strong className="mt-3 block text-2xl">{value}</strong>
            <p className="m-0 text-sm text-muted-foreground">{label}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map(([href, title, text, Icon]) => (
          <Link key={href} href={href} className="rounded-xl border bg-card p-5 hover:bg-muted/40">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
