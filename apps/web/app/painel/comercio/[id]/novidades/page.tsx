import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { PostsPanel } from '@/components/admin/posts/posts-panel';
import { getCurrentCity } from '@/lib/cities';
import { hasRole, requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { listEntityPosts } from '@/lib/posts/queries';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BusinessNovidadesPage({ params }: PageProps) {
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

  const posts = await listEntityPosts('business', id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-6">
        <div>
          <Link className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground" href={`/painel/comercio/${id}`}>
            ← {business.name}
          </Link>
          <h1 className="text-3xl font-bold">Novidades</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Publique atualizações, promoções e avisos para seus clientes.
          </p>
        </div>
        <Link
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          href={`/comercio/negocio/${business.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver página pública ↗
        </Link>
      </header>

      <PostsPanel posts={posts} entityType="business" entityId={id} />
    </div>
  );
}
