import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/components/navigation/link';
import { GuideEditForm } from '@/components/admin/tourism/guide-edit-form';
import type { LinkedAttractionInitial } from '@/components/admin/tourism/guide-linked-attractions-picker';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: 'Editar guia turístico' };

export default async function EditGuidePage({ params }: PageProps) {
  const city = await getCurrentCity();
  if (!city) return null;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const { id } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: guide, error: guideError } = await sb
    .from('tourism_guides')
    .select('*')
    .eq('id', id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (guideError || !guide) notFound();

  const { data: linkedRows } = await sb
    .from('guide_linked_entities')
    .select('entity_type, entity_id, sort_order, label, description')
    .eq('guide_id', id)
    .order('sort_order', { ascending: true });

  const rows = (linkedRows ?? []) as Array<{
    entity_type: string;
    entity_id: string;
    sort_order: number | null;
    label: string | null;
    description: string | null;
  }>;
  const nonAttractionRows = rows.filter((r) => r.entity_type !== 'attraction');
  const attractionRows = rows.filter((r) => r.entity_type === 'attraction');

  let linkedAttractionsInitial: LinkedAttractionInitial[] = [];
  const attractionIds = attractionRows.map((r) => r.entity_id);
  if (attractionIds.length > 0) {
    const { data: attRows } = await supabase
      .from('attractions')
      .select('id, name, slug, type')
      .eq('city_id', city.id)
      .in('id', attractionIds);
    const byId = new Map(
      (attRows ?? []).map((a: { id: string; name: string; slug: string; type: string | null }) => [
        a.id,
        a,
      ]),
    );
    linkedAttractionsInitial = [...attractionRows]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((row) => {
        const a = byId.get(row.entity_id);
        return {
          entityId: row.entity_id,
          name: a?.name ?? 'Atração não encontrada',
          slug: a?.slug ?? '',
          type: a?.type ?? 'historico',
          label: row.label,
          description: row.description,
        };
      });
  }

  const nonAttractionEntitiesJson = JSON.stringify(
    nonAttractionRows.map((r) => ({
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      sort_order: r.sort_order,
      label: r.label,
      description: r.description,
    })),
  );

  const row = guide as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href={`/painel/cidade/turismo/guias/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para o guia
        </Link>
        <h1 className="text-3xl font-bold">Editar {String(row.name ?? 'guia')}</h1>
        <p className="text-sm text-muted-foreground">
          Conteúdo editorial, atrações vinculadas e estrutura da página pública.
        </p>
      </header>

      <GuideEditForm
        key={`${String(row.id)}-${String(row.updated_at ?? '')}`}
        cityId={city.id}
        guide={row}
        nonAttractionEntitiesJson={nonAttractionEntitiesJson}
        linkedAttractionsInitial={linkedAttractionsInitial}
      />
    </div>
  );
}
