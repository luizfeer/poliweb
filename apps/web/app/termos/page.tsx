export const metadata = {
  title: 'Termos de uso | Portal Carmelitano',
  description: 'Termos de uso do Portal Carmelitano e da CidadeViva.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <LegalHeader title="Termos de uso" eyebrow="Termos" />
      <section className="space-y-5 rounded-2xl border bg-card p-5 md:p-7">
        <PolicyBlock title="Responsavel">
          <p>
            O Portal Carmelitano e operado pela CidadeViva, nome fantasia de LUIZ
            FERNANDO FERREIRA DE ALMEIDA, CNPJ 65.205.651/0001-63.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Uso permitido">
          <p>
            O usuario deve fornecer informacoes verdadeiras, respeitar terceiros e usar o
            portal apenas para fins licitos. Conteudos enviados podem passar por revisao
            automatica ou humana antes de publicacao.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Moderacao e denuncias">
          <p>
            Grupos, postagens e outros conteudos sociais podem ser denunciados por usuarios.
            A equipe pode revisar, ocultar, rejeitar ou remover conteudos com spam, golpe,
            informacao falsa, discurso ofensivo, dados pessoais indevidos ou violacao destes
            termos. Denuncias repetidas podem enviar o conteudo para nova moderacao.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Destaques pagos">
          <p>
            Alguns grupos, negocios ou conteudos podem contratar destaque pago por periodo
            definido, como exibicao prioritaria no diretorio ou chamadas na home. O destaque
            aumenta visibilidade, mas nao dispensa moderacao nem garante aprovacao,
            resultado comercial ou permanencia se houver violacao das regras.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Aceite dos termos">
          <p>
            Ao criar uma conta, entrar ou usar o portal, o usuario declara que leu e aceita
            estes Termos de uso e a Politica de Privacidade vigente.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Conteudo publico">
          <p>
            Informacoes de negocios, turismo, hospedagens, eventos, comunidade e servicos
            podem ser exibidas publicamente quando enviadas pelo responsavel, obtidas de
            fontes publicas ou aprovadas pela administracao.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Informacoes locais">
          <p>
            Buscamos manter dados atualizados, mas horarios, precos, disponibilidade,
            eventos e rotas podem mudar. O visitante deve confirmar informacoes criticas
            diretamente com o estabelecimento ou responsavel.
          </p>
        </PolicyBlock>
        <PolicyBlock title="Conta e privacidade">
          <p>
            O tratamento de dados segue a Politica de Privacidade. Solicitações LGPD e
            exclusao de conta podem ser feitas pelas paginas /lgpd e /excluir-conta.
          </p>
        </PolicyBlock>
      </section>
    </main>
  );
}

function LegalHeader({ title, eyebrow }: Readonly<{ title: string; eyebrow: string }>) {
  return (
    <header className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay-600">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
      <p className="max-w-2xl text-muted-foreground">
        Texto em linguagem direta para orientar usuarios, comerciantes e visitantes do
        Portal Carmelitano.
      </p>
    </header>
  );
}

function PolicyBlock({
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
