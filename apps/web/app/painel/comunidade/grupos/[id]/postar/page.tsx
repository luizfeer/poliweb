import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CommunityGroupEditor } from '@/components/admin/community/community-group-editor';
import { hasRole, requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getManagedCommunityGroupById, listCommunityGroupPosts } from '@/lib/community/queries';

export const metadata = { title: 'Publicar postagem - Carmo Local' };

export default async function PostInCommunityGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();
  const { id } = await params;

  const group = await getManagedCommunityGroupById({
    city_id: city.id,
    id,
    profile_id: auth.profile.id,
    can_manage_city: hasRole(auth.roles, ['city_admin', 'super_admin'], city.id),
  });
  if (!group) notFound();

  const posts = await listCommunityGroupPosts({
    city_id: city.id,
    groupId: group.id,
    includePending: true,
    limit: 20,
  });

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link
          href={`/painel/comunidade/grupos/${group.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para o grupo
        </Link>
        <h1 className="text-3xl font-bold">Publicar em {group.name}</h1>
        <p className="text-sm text-muted-foreground">
          Avisos, pedidos e oportunidades que aparecem na página pública do grupo.
        </p>
      </header>

      <CommunityGroupEditor cityId={city.id} group={group} posts={posts} mode="post" />
    </main>
  );
}
