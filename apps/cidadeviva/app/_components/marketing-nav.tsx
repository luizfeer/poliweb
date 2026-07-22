"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { CARMELITANO_URL } from "../../lib/marketing-constants";

export function MarketingNav() {
  return (
    <nav className="nav">
      <div className="container nav__inner">
        <Link href="/" className="brand">
          <BrandMark />
          <span className="brand__name">Cidade Viva</span>
        </Link>
        <div className="nav__links">
          <Link href="/#produto">Produto</Link>
          <Link href="/#funcionalidades">Funcionalidades</Link>
          <Link href="/#cidades">Cidades</Link>
          <Link href="/#carmelitano">Carmelitano</Link>
        </div>
        <div className="nav__cta">
          <a href={CARMELITANO_URL} className="btn btn--text">
            Abrir Carmelitano
          </a>
          <Link href="/#cta" className="btn btn--primary">
            <span className="nav-cta__full">Cadastrar meu comércio</span>
            <span className="nav-cta__short">Cadastrar</span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </nav>
  );
}
