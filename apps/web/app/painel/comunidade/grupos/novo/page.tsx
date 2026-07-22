import { notFound } from 'next/navigation';
import { CommunityGroupEditor } from '@/components/admin/community/community-group-editor';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';

export const metadata = { title: 'Novo grupo - Carmo Local' };

export default async function NewManagedCommunityGroupPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Minha comunidade</p>
        <h1 className="text-3xl font-bold">Novo grupo</h1>
      </header>
      <CommunityGroupEditor cityId={city.id} />
    </main>
  );
}
