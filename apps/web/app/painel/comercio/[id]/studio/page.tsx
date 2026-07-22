import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ArtPiece } from '@/lib/studio/types';
import { gatherBusinessContext } from '@/lib/studio/business-context';
import { StudioEditor } from './studio-editor';

type PageProps = { params: Promise<{ id: string }> };

export default async function BusinessStudioPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city) notFound();

  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] });
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug, owner_profile_id')
    .eq('id', id)
    .eq('city_id', city.id)
    .maybeSingle();
  if (!business) notFound();

  const canManageAll = hasRole(auth.roles, ['city_admin', 'super_admin'], city.id);
  if (!canManageAll) {
    const isOwner = business.owner_profile_id === auth.profile.id;
    if (!isOwner) {
      const { data: manager } = await supabase
        .from('entity_managers')
        .select('id')
        .eq('profile_id', auth.profile.id)
        .eq('entity_type', 'business')
        .eq('entity_id', id)
        .maybeSingle();
      if (!manager) notFound();
    }
  }

  // art_pieces ainda não está no database.types gerado — cast permissivo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase.from('art_pieces' as any) as any)
    .select('id, city_id, business_id, name, ramo, format, document, created_at, updated_at')
    .eq('business_id', id)
    .eq('city_id', city.id)
    .order('updated_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pieces: ArtPiece[] = ((rows ?? []) as any[]).map((r) => ({
    id: r.id,
    cityId: r.city_id,
    businessId: r.business_id,
    name: r.name,
    ramo: r.ramo,
    format: r.format,
    document: r.document ?? { slides: [] },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const context = await gatherBusinessContext(city.id, city.slug, city.name, business.id);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link className="mb-1 inline-block text-sm text-muted-foreground hover:text-foreground" href={`/painel/comercio/${id}`}>
            ← {business.name}
          </Link>
          <h1 className="text-2xl font-bold">Studio de Artes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monte uma arte, baixe pro Instagram, publique nas Novidades ou peça um banner na home.
          </p>
        </div>
      </header>

      <StudioEditor businessId={business.id} businessName={business.name} pieces={pieces} context={context} />
    </div>
  );
}
