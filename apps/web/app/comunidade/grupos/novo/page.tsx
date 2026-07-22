import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { CommunityGroupEditor } from '@/components/admin/community/community-group-editor';
import { PostingTip } from '@/components/public/forms/posting-tip';

export const metadata = { title: 'Cadastrar grupo - Carmo Local' };

export default async function NewCommunityGroupPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <p className="text-muted-foreground text-sm">Comunidade</p>
        <h1 className="text-3xl font-bold">Cadastrar grupo ou coletivo</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Envie grupos locais, coletivos ativos e links publicos de WhatsApp para a cidade.
        </p>
      </header>
      <PostingTip title="O que é um grupo no portal">
        <p>
          É uma página pública para grupos de bairro, coletivos, projetos, associações e grupos de
          WhatsApp. O nome gera o endereço automaticamente; você só precisa explicar quem participa,
          como entrar e qual contato deve aparecer.
        </p>
      </PostingTip>
      <CommunityGroupEditor cityId={city.id} />
    </main>
  );
}
