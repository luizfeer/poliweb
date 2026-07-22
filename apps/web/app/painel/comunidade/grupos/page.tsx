import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SubmitOnceButton, SubmitOnceForm } from '@/components/admin/forms/submit-once-form';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listManagedCommunityGroups } from '@/lib/community/queries';
import { archiveCommunityGroupAction } from '@/lib/community/actions';

export const metadata = { title: 'Meus grupos - Carmo Local' };

export default async function MyCommunityGroupsPage() {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('community')) notFound();

  const groups = await listManagedCommunityGroups(city.id, auth.profile.id);

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border bg-card p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Minha comunidade</p>
          <h1 className="text-3xl font-bold">Grupos e coletivos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cadastre grupos, revise contatos e publique avisos práticos.</p>
        </div>
        <Link href="/painel/comunidade/grupos/novo" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Novo grupo
        </Link>
      </header>

      <section className="space-y-3">
        {groups.map((group) => (
          <article key={group.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{group.category}</p>
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tipo: {group.type} / status: {group.status}
                </p>
                {group.shortDescription ? <p className="mt-2 text-sm">{group.shortDescription}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/painel/comunidade/grupos/${group.id}`} className="rounded-md border px-3 py-2 text-sm">
                  Gerenciar
                </Link>
                <SubmitOnceForm action={archiveCommunityGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <SubmitOnceButton
                    label="Arquivar"
                    pendingLabel="Arquivando..."
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-75"
                  />
                </SubmitOnceForm>
              </div>
            </div>
          </article>
        ))}
        {groups.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Voce ainda nao gerencia grupos nesta cidade.
          </p>
        ) : null}
      </section>
    </main>
  );
}
