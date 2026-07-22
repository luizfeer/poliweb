import Link from 'next/link';

export const metadata = {
  title: 'Excluir conta | Portal Carmelitano',
  description: 'Solicitação de exclusão de conta do Portal Carmelitano.',
};

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay-600">
          Conta
        </p>
        <h1 className="text-3xl font-bold md:text-5xl">Solicitar exclusão de conta</h1>
        <p className="max-w-2xl text-muted-foreground">
          Use esta página para pedir a exclusão de conta criada no Portal Carmelitano,
          inclusive contas criadas com login social (Apple, Google ou email).
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border bg-card p-5 md:p-7">
        <Block title="Pelo painel (recomendado)">
          <p>
            Faça login e acesse{' '}
            <Link href="/painel/perfil/privacidade" className="font-medium underline">
              Painel → Perfil → Privacidade
            </Link>
            . Preencha o motivo (opcional) e envie. O pedido entra em uma fila de revisão e
            você pode acompanhar ou cancelar enquanto estiver pendente.
          </p>
        </Block>

        <Block title="Por email (alternativa)">
          <p>
            Se você não consegue acessar a conta, envie um email para{' '}
            <a href="mailto:contato@cidadeviva.com.br" className="font-medium underline">
              contato@cidadeviva.com.br
            </a>{' '}
            com o assunto &quot;Excluir minha conta&quot; e informe o email usado no cadastro
            e a cidade/portal relacionado. Confirmamos sua identidade antes de prosseguir.
          </p>
        </Block>

        <Block title="Como funciona a aprovação">
          <p>
            Todo pedido passa por revisão manual de um administrador, em conformidade com a
            LGPD. Isso evita exclusões acidentais e permite verificar se há obrigações
            pendentes (pagamentos, contratos publicitários, conteúdos sob moderação).
            Quando aprovado, anonimizamos seu perfil, removemos identificadores pessoais e
            cancelamos a newsletter associada.
          </p>
        </Block>

        <Block title="O que é excluído">
          <p>
            Nome, telefone, foto, bio, preferências de marketing e identificadores de login
            são removidos ou anonimizados. Mantemos somente os registros necessários por
            obrigação legal, segurança, prevenção a fraude ou cumprimento contratual
            (ex.: notas fiscais de anúncios pagos).
          </p>
        </Block>

        <Block title="Prazo">
          <p>
            Até 15 dias corridos após a confirmação de identidade e o recebimento das
            informações necessárias.
          </p>
        </Block>
      </section>
    </main>
  );
}

function Block({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-2 border-b pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
