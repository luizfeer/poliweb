import { Link } from '@/components/navigation/link';
import { notFound } from 'next/navigation';
import { PostsPanel } from '@/components/admin/posts/posts-panel';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { listEntityPosts } from '@/lib/posts/queries';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ChurchNovidadesPage({ params }: PageProps) {
  const [{ slug }, city] = await Promise.all([params, getCurrentCity()]);
  if (!city || !city.modules.includes('community')) notFound();

  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });

  const supabase = await createClient();
  const { data: church } = await supabase
    .from('churches')
    .select('id, name, slug')
    .eq('city_id', city.id)
    .eq('slug', slug)
    .maybeSingle();

  if (!church) notFound();

  const posts = await listEntityPosts('church', church.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-6">
        <div>
          <Link
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
            href={`/painel/cidade/comunidade/igrejas/${slug}`}
          >
            ← {church.name}
          </Link>
          <h1 className="text-3xl font-bold">Novidades</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Publique avisos, eventos e atualizações para a comunidade.
          </p>
        </div>
        <Link
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          href={`/comunidade/igrejas/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver página pública ↗
        </Link>
      </header>

      <PostsPanel posts={posts} entityType="church" entityId={church.id} />
    </div>
  );
}
