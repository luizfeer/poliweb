import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CommunityGroupEditor } from '@/components/admin/community/community-group-editor';
import { hasRole, requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { getManagedCommunityGroupById } from '@/lib/community/queries';

export const metadata = { title: 'Editar grupo - Carmo Local' };

export default async function EditCommunityGroupPage({
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

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <Link
          href={`/painel/comunidade/grupos/${group.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para o grupo
        </Link>
        <h1 className="text-3xl font-bold">Editar {group.name}</h1>
        <p className="text-sm text-muted-foreground">
          Atualize os dados públicos, contatos, regras e configurações.
        </p>
      </header>

      <CommunityGroupEditor cityId={city.id} group={group} mode="edit" />
    </main>
  );
}
