"use client";

import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { CARMELITANO_URL } from "../../lib/marketing-constants";

export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link href="/" className="brand">
              <BrandMark />
              <span className="brand__name">Cidade Viva</span>
            </Link>
            <p>
              Infraestrutura digital pra cidades pequenas e médias do interior do Brasil. Uma rede
              de portais hiperlocais — turismo, comércio, comunidade. Feito em Minas.
            </p>
          </div>
          <div className="footer__col">
            <h4>Produto</h4>
            <ul>
              <li>
                <Link href="/#funcionalidades">Funcionalidades</Link>
              </li>
              <li>
                <Link href="/#produto">Como funciona</Link>
              </li>
              <li>
                <Link href="/#carmelitano">Carmelitano</Link>
              </li>
              <li>
                <Link href="/#cidades">Cidades</Link>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Pra quem</h4>
            <ul>
              <li>
                <Link href="/para-quem/comerciantes">Comerciantes</Link>
              </li>
              <li>
                <Link href="/para-quem/prefeituras">Prefeituras</Link>
              </li>
              <li>
                <Link href="/para-quem/associacoes-comerciais">Associações comerciais</Link>
              </li>
              <li>
                <Link href="/para-quem/moradores">Moradores</Link>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Empresa</h4>
            <ul>
              <li>
                <Link href="/#produto">Manifesto</Link>
              </li>
              <li>
                <Link href="/#cta">Trabalhe conosco</Link>
              </li>
              <li>
                <a href={CARMELITANO_URL}>Carmelitano ao vivo</a>
              </li>
              <li>
                <Link href="/#cta">Contato</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 CidadeViva · LUIZ FERNANDO FERREIRA DE ALMEIDA · CNPJ 65.205.651/0001-63</span>
          <span style={{ display: "flex", gap: 18 }}>
            <Link href="/termos" style={{ color: "#9C9388" }}>
              Termos
            </Link>
            <Link href="/privacidade" style={{ color: "#9C9388" }}>
              Privacidade
            </Link>
            <Link href="/lgpd" style={{ color: "#9C9388" }}>
              LGPD
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
