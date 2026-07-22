import { BookOpen } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

type GuideListRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  featured: boolean;
  kind: string;
  updated_at: string | null;
};

export default async function CidadeTurismoGuiasPage() {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data, error } = await (
    supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            order: (
              col: string,
              o: { ascending: boolean },
            ) => Promise<{ data: unknown; error: { message?: string } | null }>;
          };
        };
      };
    }
  )
    .from('tourism_guides')
    .select('id, slug, name, status, featured, kind, updated_at')
    .eq('city_id', city.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Guias editoriais</h1>
        <p className="text-destructive text-sm">Não foi possível listar os guias. Tente de novo.</p>
      </div>
    );
  }

  const rows = (data ?? []) as unknown as GuideListRow[];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted-foreground text-sm">Admin da cidade</p>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <BookOpen className="size-8" aria-hidden="true" />
          Guias editoriais
        </h1>
        <p className="text-muted-foreground mt-2">
          Páginas longas (ex.: &quot;Conheça Itaci&quot;), distritos e roteiros. Abra um guia para ver
          o atalho da página pública.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">Nenhum guia cadastrado.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {rows.map((g) => (
            <li key={g.id}>
              <Link
                href={`/painel/cidade/turismo/guias/${g.id}`}
                className="hover:bg-muted/50 block p-4"
                prefetch={false}
              >
                <span className="font-semibold">{g.name}</span>
                <span className="text-muted-foreground ml-2 text-sm">
                  {g.slug} · {g.kind} · {g.status}
                  {g.featured ? ' · destaque' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
