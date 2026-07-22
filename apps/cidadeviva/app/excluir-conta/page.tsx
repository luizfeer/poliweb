import Link from "next/link";

export const metadata = {
  title: "Excluir conta - CidadeViva",
  description: "Solicitacao de exclusao de conta da CidadeViva.",
};

export default function DeleteAccountPage() {
  return (
    <main>
      <nav className="nav">
        <div className="container nav__inner">
          <Link href="/" className="brand">
            <span className="brand__mark" />
            <span className="brand__name">CidadeViva</span>
          </Link>
          <div className="nav__links">
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/lgpd">LGPD</Link>
          </div>
        </div>
      </nav>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <span className="eyebrow">
            <span className="eyebrow__dot" />
            Conta e Apple
          </span>
          <h1 className="section-head__title" style={{ marginTop: 14, textAlign: "left" }}>
            Solicitar exclusao de conta
          </h1>
          <article className="step" style={{ marginTop: 28 }}>
            <p>
              Esta pagina atende solicitacoes de exclusao de conta da CidadeViva, incluindo
              contas criadas por login social como Apple, Google ou email.
            </p>
            <h2>Como pedir</h2>
            <p>
              Envie um email para contato@cidadeviva.com.br com o assunto &quot;Excluir minha conta&quot;.
              Inclua o email usado no cadastro e, se houver, a cidade/portal relacionado.
            </p>
            <h2>O que acontece depois</h2>
            <p>
              Confirmaremos a identidade do solicitante, removeremos ou anonimizaremos dados
              pessoais da conta e manteremos apenas registros exigidos por lei, seguranca,
              prevencao a fraude ou cumprimento contratual.
            </p>
            <p>
              Prazo estimado: ate 15 dias corridos apos confirmacao de identidade e recebimento
              das informacoes necessarias.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
