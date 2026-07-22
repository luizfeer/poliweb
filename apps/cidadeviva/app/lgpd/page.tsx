import Link from "next/link";

export const metadata = {
  title: "LGPD - CidadeViva",
  description: "Canal LGPD da CidadeViva.",
};

export default function LgpdPage() {
  return (
    <main>
      <LegalNav />
      <LegalShell eyebrow="LGPD" title="Direitos do titular de dados">
        <p>
          A CidadeViva atende solicitacoes de titulares conforme a Lei Geral de Protecao de
          Dados. O controlador e LUIZ FERNANDO FERREIRA DE ALMEIDA, CNPJ 65.205.651/0001-63,
          nome fantasia CidadeViva.
        </p>
        <h2>O que voce pode solicitar</h2>
        <ul>
          <li>Confirmacao de tratamento e acesso aos dados.</li>
          <li>Correcao de dados incompletos, inexatos ou desatualizados.</li>
          <li>Exclusao, anonimizacao, bloqueio ou portabilidade quando aplicavel.</li>
          <li>Informacoes sobre compartilhamento e revogacao de consentimento.</li>
        </ul>
        <h2>Como solicitar</h2>
        <p>
          Envie um email para contato@cidadeviva.com.br com o assunto &quot;Solicitacao LGPD&quot;.
          Para exclusao de conta, use tambem a pagina <Link href="/excluir-conta">/excluir-conta</Link>.
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
          <Link href="/termos">Termos</Link>
          <Link href="/privacidade">Privacidade</Link>
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
