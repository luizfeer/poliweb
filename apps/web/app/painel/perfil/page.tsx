import { requireProfile } from '@/lib/auth';
import { PerfilForm } from './perfil-form';

type PerfilPageProps = {
  searchParams?: Promise<{ complete?: string }>;
};

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const auth = await requireProfile();
  const params = await searchParams;
  const isCompletionStep = params?.complete === '1';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">
          {isCompletionStep ? 'Complete seu cadastro' : 'Perfil'}
        </h1>
        <p className="text-muted-foreground">
          {isCompletionStep
            ? 'Informe telefone e data de nascimento para liberar sua conta, pontos e indicacoes.'
            : 'Dados basicos usados no painel e nas interacoes publicas.'}
        </p>
      </header>

      <PerfilForm profile={auth.profile} />
    </div>
  );
}
