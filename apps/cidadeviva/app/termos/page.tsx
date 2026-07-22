import Link from "next/link";

export const metadata = {
  title: "Termos de uso - CidadeViva",
  description: "Termos de uso da CidadeViva e dos portais locais.",
};

export default function TermsPage() {
  return (
    <main>
      <LegalNav />
      <LegalShell eyebrow="Termos" title="Termos de uso">
        <p>
          Estes termos regulam o uso da CidadeViva, do Carmelitano e de portais locais operados
          pela empresa LUIZ FERNANDO FERREIRA DE ALMEIDA, CNPJ 65.205.651/0001-63,
          nome fantasia CidadeViva.
        </p>
        <h2>Uso permitido</h2>
        <p>
          O usuario deve fornecer informacoes verdadeiras, respeitar terceiros e usar a plataforma
          apenas para fins licitos. Conteudos enviados podem passar por revisao automatica ou humana.
        </p>
        <h2>Conteudo publico</h2>
        <p>
          Informacoes de negocios, eventos, turismo, comunidade e servicos podem ser exibidas
          publicamente quando enviadas pelo responsavel, obtidas de fontes publicas ou aprovadas
          pela administracao do portal.
        </p>
        <h2>Responsabilidades</h2>
        <p>
          A CidadeViva busca manter dados atualizados, mas estabelecimentos, horarios, eventos,
          precos e disponibilidade podem mudar. O usuario deve confirmar informacoes criticas
          diretamente com o responsavel pelo servico.
        </p>
        <h2>Privacidade e conta</h2>
        <p>
          O tratamento de dados segue a <Link href="/privacidade">Politica de Privacidade</Link>.
          Solicitações LGPD e exclusao de conta podem ser feitas em <Link href="/lgpd">/lgpd</Link>
          {" "}e <Link href="/excluir-conta">/excluir-conta</Link>.
        </p>
      </LegalShell>
    </main>
  );
}

function LegalNav() {
  return (
    <nav className="nav">
      <div className="container nav__inner">
        <Link href="/" className="brand">
          <span className="brand__mark" />
          <span className="brand__name">CidadeViva</span>
        </Link>
        <div className="nav__links">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/lgpd">LGPD</Link>
          <Link href="/excluir-conta">Excluir conta</Link>
        </div>
      </div>
    </nav>
  );
}

function LegalShell({
  eyebrow,
  title,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <span className="eyebrow">
          <span className="eyebrow__dot" />
          {eyebrow}
        </span>
        <h1 className="section-head__title" style={{ marginTop: 14, textAlign: "left" }}>
          {title}
        </h1>
        <article className="step" style={{ marginTop: 28 }}>
          {children}
        </article>
      </div>
    </section>
  );
}
