import Link from "next/link";

export const metadata = {
  title: "Privacidade - CidadeViva",
  description: "Politica de privacidade da CidadeViva.",
};

export default function PrivacyPage() {
  return (
    <main>
      <LegalNav />
      <LegalShell eyebrow="Privacidade" title="Politica de privacidade">
        <p>
          A CidadeViva trata dados pessoais para operar seus sites, responder contatos,
          administrar portais locais e oferecer recursos para moradores, turistas,
          comerciantes e gestores publicos.
        </p>
        <h2>Responsavel pelo tratamento</h2>
        <p>
          Pessoa juridica: LUIZ FERNANDO FERREIRA DE ALMEIDA. CNPJ:
          65.205.651/0001-63. Nome fantasia: CidadeViva.
        </p>
        <h2>Dados coletados</h2>
        <ul>
          <li>Dados de contato enviados em formularios, como nome, email, telefone e cidade.</li>
          <li>Dados comerciais enviados por negocios, pousadas, restaurantes e prestadores.</li>
          <li>Dados tecnicos de navegacao, seguranca, dispositivo, navegador e paginas acessadas.</li>
          <li>Dados de conta quando houver cadastro, login ou painel do usuario.</li>
        </ul>
        <h2>Uso dos dados</h2>
        <p>
          Usamos os dados para responder solicitacoes, operar o Carmelitano e outros portais,
          publicar informacoes aprovadas, proteger a plataforma, medir desempenho e cumprir
          obrigacoes legais.
        </p>
        <h2>Compartilhamento</h2>
        <p>
          Nao vendemos dados pessoais. Podemos compartilhar dados com provedores de hospedagem,
          banco de dados, email, analytics, pagamentos, autenticacao e suporte quando necessario
          para prestar o servico.
        </p>
        <h2>Seus direitos</h2>
        <p>
          Voce pode solicitar acesso, correcao, exclusao, portabilidade, informacoes sobre
          compartilhamento ou revogacao de consentimento. Para pedir exclusao de conta, acesse
          {" "}<Link href="/excluir-conta">/excluir-conta</Link>.
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
