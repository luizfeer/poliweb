"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import {
  ArrowRight,
  Check,
  PlayCircle,
  TrendingUp,
  Tag,
  MapPin,
  Store,
  CalendarDays,
  MountainSnow,
  Landmark,
  Users,
  Trash2,
  Droplet,
  Heart,
  MessageCircle,
  Share2,
  Globe,
  Fish,
  UtensilsCrossed,
  ExternalLink,
  ShieldCheck,
  CalendarCheck,
  Smartphone,
} from "lucide-react";
import { BrandMark } from "./_components/brand-mark";
import { MarketingFooter } from "./_components/marketing-footer";
import { MarketingNav } from "./_components/marketing-nav";
import { CARMELITANO_URL } from "../lib/marketing-constants";
import { leadFormInitialState, submitLeadAction } from "./actions";

const furnasImages = {
  hero:
    "https://hail-mary-crc.b-cdn.net/carmo-do-rio-claro/attraction/98bf2248-8b63-4f1a-aedc-feb8d9f4ca4c/gallery/dea3916e-b17f-4bb2-b630-07b868ac5099.jpg",
  turismoA:
    "https://hail-mary-crc.b-cdn.net/carmo-do-rio-claro/attraction/98bf2248-8b63-4f1a-aedc-feb8d9f4ca4c/gallery/ad9310b5-f025-4160-a82d-f9c10d2d5117.jpg",
  turismoB:
    "https://hail-mary-crc.b-cdn.net/carmo-do-rio-claro/attraction/98bf2248-8b63-4f1a-aedc-feb8d9f4ca4c/gallery/41180cf9-e440-4716-b554-a95be36b8027.jpg",
  turismoC:
    "https://hail-mary-crc.b-cdn.net/carmo-do-rio-claro/attraction/98bf2248-8b63-4f1a-aedc-feb8d9f4ca4c/gallery/3e80e1f8-89a4-4265-abb0-a21330ed5b85.jpg",
  showcase:
    "https://hail-mary-crc.b-cdn.net/carmo-do-rio-claro/attraction/98bf2248-8b63-4f1a-aedc-feb8d9f4ca4c/gallery/140355b4-398d-4133-baa1-98c52e840666.jpg",
};

/* =====================================================================
   Cidade Viva — Landing
   Todas as seções estão inline aqui. Procure por REPLACE_ME pra trocar
   os links das imagens.
   ===================================================================== */

// Estrela cheia para ratings/depoimentos
function Star() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1z" />
    </svg>
  );
}

export default function Page() {
  const ctaRef = useRef<HTMLElement | null>(null);
  const [formState, formAction, isPending] = useActionState(
    submitLeadAction,
    leadFormInitialState,
  );

  const scrollToCta = () => {
    if (ctaRef.current) {
      window.scrollTo({ top: ctaRef.current.offsetTop - 60, behavior: "smooth" });
    }
  };

  return (
    <>
      <MarketingNav />

      {/* ============== HERO ============== */}
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <span className="eyebrow">
              <span className="eyebrow__dot" />
              Tecnologia hiperlocal · feito no interior de Minas
            </span>
            <p className="hero__app-soon">
              <Smartphone size={16} aria-hidden />
              Nosso app está quase pronto — em breve na App Store e Google Play.
            </p>
            <h1 className="hero__title">
              A cidade inteira, <em>viva</em> no celular do seu cliente.
            </h1>
            <p className="hero__lead">
              A Cidade Viva é a plataforma que reúne turismo, comércio, eventos, serviços públicos e
              comunidade em um portal local — feito sob medida pra cada cidade. Seu comércio aparece
              pra quem mora, pra quem visita e pra quem está chegando.
            </p>
            <div className="hero__ctas">
              <a
                href="#cta"
                className="btn btn--primary btn--lg"
                onClick={(e) => { e.preventDefault(); scrollToCta(); }}
              >
                Cadastrar meu comércio <ArrowRight size={17} />
              </a>
              <a href="#carmelitano" className="btn btn--ghost btn--lg">
                <PlayCircle size={17} /> Conhecer o Carmelitano
              </a>
            </div>
            <div className="hero__trust">
              <span><span className="check"><Check size={12} /></span> Sem mensalidade pros 50 primeiros</span>
              <span><span className="check"><Check size={12} /></span> Painel próprio do comerciante</span>
              <span><span className="check"><Check size={12} /></span> Suporte humano, em português</span>
            </div>
          </div>

          <div className="hero__stage">
            <div className="float-card float-card--a">
              <div className="float-card__icon" style={{ background: "var(--carmo-cerrado-100)", color: "var(--carmo-cerrado-700)" }}>
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="float-card__t">+312 visitas</div>
                <div className="float-card__s">Pousada Mirante · 7 dias</div>
              </div>
            </div>
            <div className="float-card float-card--b">
              <div className="float-card__icon" style={{ background: "var(--carmo-clay-50)", color: "var(--carmo-clay-600)" }}>
                <Tag size={16} />
              </div>
              <div>
                <div className="float-card__t">Cupom 15% off</div>
                <div className="float-card__s">Café Arara · 47 resgates</div>
              </div>
            </div>
            <div className="float-card float-card--c">
              <div className="float-card__icon" style={{ background: "var(--carmo-sky-100)", color: "var(--carmo-sky-700)" }}>
                <MapPin size={16} />
              </div>
              <div>
                <div className="float-card__t">No bairro</div>
                <div className="float-card__s">28 comércios ativos</div>
              </div>
            </div>

            <PortalPhoneMock heroImage={furnasImages.hero} thumbImage={furnasImages.turismoA} />
          </div>
        </div>
      </section>

      {/* ============== MANIFESTO ============== */}
      <section className="section section--tight manifesto">
        <div className="container manifesto__inner">
          <span className="eyebrow"><span className="eyebrow__dot" /> Manifesto</span>
          <p className="manifesto__quote">
            &ldquo;Toda cidade tem alma. Falta tecnologia que enxergue isso.&rdquo; <span>—</span> A
            Cidade Viva existe pra fortalecer o comércio, organizar o turismo e aproximar a
            comunidade. Uma plataforma só, com a cara de cada cidade.
          </p>
          <span className="manifesto__sig">do interior de Minas, pro Brasil</span>
        </div>
      </section>

      {/* ============== COMO FUNCIONA ============== */}
      <section className="section" id="produto">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow"><span className="eyebrow__dot" /> Como funciona</span>
            <h2 className="section-head__title">Três passos pra entrar no mapa da cidade.</h2>
            <p className="section-head__lead">
              A Cidade Viva opera o portal local da sua cidade. Você só cuida do que sabe fazer:
              atender bem o cliente que chegou.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step__num">01</div>
              <h3 className="step__title">Você cadastra seu comércio</h3>
              <p className="step__copy">
                Em poucos minutos: nome, endereço, fotos, horário e o que você vende. Sem taxa de
                adesão pros 50 primeiros de cada cidade.
              </p>
            </div>
            <div className="step">
              <div className="step__num">02</div>
              <h3 className="step__title">A cidade encontra você</h3>
              <p className="step__copy">
                Moradores e turistas usam o portal pra achar onde comer, dormir, comprar e passear.
                Você aparece em buscas, categorias e na vitrine local.
              </p>
            </div>
            <div className="step">
              <div className="step__num">03</div>
              <h3 className="step__title">Você acompanha resultados</h3>
              <p className="step__copy">
                Painel próprio com visitas, contatos por WhatsApp, cupons resgatados e os termos
                mais buscados na sua categoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FUNCIONALIDADES ============== */}
      <section className="section section--paper-deep" id="funcionalidades">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow"><span className="eyebrow__dot" /> O que tem dentro</span>
            <h2 className="section-head__title">Tudo que a cidade precisa, num portal só.</h2>
            <p className="section-head__lead">
              Cinco camadas que conversam entre si: comércio, turismo, agenda, serviços públicos e
              comunidade. Sua loja entra junto com tudo que faz a cidade acontecer.
            </p>
          </div>

          <div className="features">
            {/* Feature 1 — Vitrine */}
            <div className="feature">
              <div className="feature__preview" style={{ background: "linear-gradient(135deg, #FFF1E8 0%, #FFE6CF 100%)" }}>
                <div className="mini mini-card mini-store">
                  <div className="mini-store__thumb">P</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mini-store__name">Pousada Mirante das Furnas</div>
                    <div className="mini-store__sub">
                      <span className="mini-store__stars"><Star /><Star /><Star /><Star /><Star /></span>
                      <span>4,9 · 132 avaliações</span>
                    </div>
                  </div>
                  <div className="mini-store__chip">ABERTO</div>
                </div>
              </div>
              <div className="feature__body">
                <div className="feature__head">
                  <div className="feature__icon" style={{ background: "var(--carmo-clay-50)", color: "var(--carmo-clay-600)" }}>
                    <Store size={18} />
                  </div>
                  <h3 className="feature__title">Vitrine pro seu comércio</h3>
                </div>
                <p className="feature__copy">
                  Página própria com fotos, cardápio, horário, WhatsApp direto e localização.
                  Aparece em buscas e na home do portal.
                </p>
                <div className="feature__foot">
                  <div className="feature__metric">
                    <div className="feature__metric-val">+312</div>
                    <div className="feature__metric-lbl">visitas / 7 dias</div>
                  </div>
                  <ul className="feature__list"><li>Página</li><li>WhatsApp</li></ul>
                </div>
              </div>
            </div>

            {/* Feature 2 — Cupons */}
            <div className="feature">
              <div className="feature__preview" style={{ background: "linear-gradient(135deg, #FCE5EC 0%, #F8D8E2 100%)" }}>
                <div className="mini mini-cupom">
                  <div className="mini-cupom__off">15% OFF</div>
                  <div className="mini-cupom__brand">Café Arara · torrefação</div>
                  <div className="mini-cupom__code">ARARA15</div>
                </div>
              </div>
              <div className="feature__body">
                <div className="feature__head">
                  <div className="feature__icon" style={{ background: "#FCE5EC", color: "var(--carmo-discount)" }}>
                    <Tag size={18} />
                  </div>
                  <h3 className="feature__title">Cupons e promoções</h3>
                </div>
                <p className="feature__copy">
                  Lance ofertas relâmpago, cupons e combos. O portal divulga, o cliente resgata,
                  você acompanha pelo painel.
                </p>
                <div className="feature__foot">
                  <div className="feature__metric">
                    <div className="feature__metric-val">47</div>
                    <div className="feature__metric-lbl">cupons resgatados</div>
                  </div>
                  <ul className="feature__list"><li>Push</li><li>Métricas</li></ul>
                </div>
              </div>
            </div>

            {/* Feature 3 — Agenda */}
            <div className="feature">
              <div className="feature__preview" style={{ background: "linear-gradient(135deg, #FFF8E5 0%, #FFEFC8 100%)" }}>
                <div className="mini mini-card mini-agenda">
                  <div className="mini-agenda__row">
                    <div className="mini-agenda__date is-today">
                      <div className="mini-agenda__d">12</div>
                      <div className="mini-agenda__m">MAI</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="mini-agenda__t">Feira livre da Praça</div>
                      <div className="mini-agenda__s">Hoje · 7h–13h</div>
                    </div>
                  </div>
                  <div className="mini-agenda__row">
                    <div className="mini-agenda__date">
                      <div className="mini-agenda__d">18</div>
                      <div className="mini-agenda__m">MAI</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="mini-agenda__t">Festa do Padroeiro</div>
                      <div className="mini-agenda__s">Sáb · novena às 19h</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature__body">
                <div className="feature__head">
                  <div className="feature__icon" style={{ background: "var(--carmo-sun-100)", color: "var(--carmo-clay-700)" }}>
                    <CalendarDays size={18} />
                  </div>
                  <h3 className="feature__title">Agenda da cidade</h3>
                </div>
                <p className="feature__copy">
                  Festa do padroeiro, feira livre, shows na praça, torneios de pesca. Tudo num só
                  calendário, sincronizado.
                </p>
                <div className="feature__foot">
                  <div className="feature__metric">
                    <div className="feature__metric-val">23</div>
                    <div className="feature__metric-lbl">eventos no mês</div>
                  </div>
                  <ul className="feature__list"><li>Festas</li><li>Lembretes</li></ul>
                </div>
              </div>
            </div>

            {/* Feature 4 — Turismo (3 imagens) */}
            <div className="feature">
              <div className="feature__preview" style={{ background: "linear-gradient(135deg, #E8F1E2 0%, #D8E7CF 100%)" }}>
                <div className="mini mini-turismo">
                  <div
                    className="mini-turismo__img a"
                    style={{ backgroundImage: `url(${furnasImages.turismoA})` }}
                  >
                    <div className="mini-turismo__cap">Tormenta</div>
                  </div>
                  <div
                    className="mini-turismo__img b"
                    style={{ backgroundImage: `url(${furnasImages.turismoB})` }}
                  >
                    <div className="mini-turismo__cap">Furnas</div>
                  </div>
                  <div
                    className="mini-turismo__img c"
                    style={{ backgroundImage: `url(${furnasImages.turismoC})` }}
                  >
                    <div className="mini-turismo__cap">Pesca</div>
                  </div>
                </div>
              </div>
              <div className="feature__body">
                <div className="feature__head">
                  <div className="feature__icon" style={{ background: "var(--carmo-cerrado-100)", color: "var(--carmo-cerrado-700)" }}>
                    <MountainSnow size={18} />
                  </div>
                  <h3 className="feature__title">Turismo organizado</h3>
                </div>
                <p className="feature__copy">
                  Pousadas, passeios, gastronomia, atrações naturais. A camada turística que vende
                  a cidade pra quem está chegando.
                </p>
                <div className="feature__foot">
                  <div className="feature__metric">
                    <div className="feature__metric-val">14</div>
                    <div className="feature__metric-lbl">pontos mapeados</div>
                  </div>
                  <ul className="feature__list"><li>Furnas</li><li>Canastra</li></ul>
                </div>
              </div>
            </div>

            {/* Feature 5 — Serviços públicos */}
            <div className="feature">
              <div className="feature__preview" style={{ background: "linear-gradient(135deg, #DCEAF7 0%, #C7DCEF 100%)" }}>
                <div className="mini mini-card mini-svc">
                  <div className="mini-svc__row">
                    <div className="mini-svc__icon" style={{ background: "var(--carmo-cerrado-100)", color: "var(--carmo-cerrado-700)" }}>
                      <Trash2 size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="mini-svc__t">Coleta · rua das Acácias</div>
                      <div className="mini-svc__s">Amanhã, terça · 18h</div>
                    </div>
                    <div className="mini-svc__pill green">AMANHÃ</div>
                  </div>
                  <div className="mini-svc__row">
                    <div className="mini-svc__icon" style={{ background: "var(--carmo-sky-100)", color: "var(--carmo-sky-700)" }}>
                      <Droplet size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="mini-svc__t">Manutenção Copasa</div>
                      <div className="mini-svc__s">Sex 9h · b. Tiradentes</div>
                    </div>
                    <div className="mini-svc__pill">SEX</div>
                  </div>
                </div>
              </div>
              <div className="feature__body">
                <div className="feature__head">
                  <div className="feature__icon" style={{ background: "var(--carmo-sky-100)", color: "var(--carmo-sky-700)" }}>
                    <Landmark size={18} />
                  </div>
                  <h3 className="feature__title">Serviços públicos integrados</h3>
                </div>
                <p className="feature__copy">
                  Coleta de lixo, manutenções, vacinação, telefones úteis. A prefeitura entra como
                  camada — e o cidadão volta toda semana.
                </p>
                <div className="feature__foot">
                  <div className="feature__metric">
                    <div className="feature__metric-val">82%</div>
                    <div className="feature__metric-lbl">retenção semanal</div>
                  </div>
                  <ul className="feature__list"><li>Coleta</li><li>Saúde</li></ul>
                </div>
              </div>
            </div>

            {/* Feature 6 — Comunidade */}
            <div className="feature">
              <div className="feature__preview" style={{ background: "linear-gradient(135deg, #F2EEE7 0%, #E8E2D6 100%)" }}>
                <div className="mini mini-card mini-com">
                  <div className="mini-com__head">
                    <div className="mini-com__avatar">DM</div>
                    <span>Dona Marlene · há 2h</span>
                    <span className="mini-com__bairro">Centro</span>
                  </div>
                  <div>
                    <div className="mini-com__title">Bidu sumiu na rua das Acácias</div>
                    <div className="mini-com__copy">Cachorrinho caramelo, coleira azul. Quem vir, avise por favor.</div>
                  </div>
                  <div className="mini-com__react">
                    <span><Heart size={11} /> 28</span>
                    <span><MessageCircle size={11} /> 12</span>
                    <span><Share2 size={11} /> 6</span>
                  </div>
                </div>
              </div>
              <div className="feature__body">
                <div className="feature__head">
                  <div className="feature__icon" style={{ background: "var(--carmo-paper-deep)", color: "var(--carmo-ink-700)" }}>
                    <Users size={18} />
                  </div>
                  <h3 className="feature__title">Comunidade ativa</h3>
                </div>
                <p className="feature__copy">
                  Classificados, achados e perdidos, pets, comunicados de bairro. O portal vira o
                  lugar onde a cidade se encontra.
                </p>
                <div className="feature__foot">
                  <div className="feature__metric">
                    <div className="feature__metric-val">1.4k</div>
                    <div className="feature__metric-lbl">posts no mês</div>
                  </div>
                  <ul className="feature__list"><li>Bairro</li><li>Pets</li></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== SHOWCASE / CARMELITANO ============== */}
      <section className="section showcase" id="carmelitano">
        <div className="container showcase__inner">
          <div className="showcase__copy">
            <span className="eyebrow"><span className="eyebrow__dot" /> Caso real · ao vivo</span>
            <h2 className="section-head__title" style={{ marginTop: 14 }}>
              O Carmelitano é o jeito de Carmo do Rio Claro estar online.
            </h2>
            <div className="showcase__url">
              <Globe size={14} />
              <span>carmelitano.<span className="domain">cidadeviva.com.br</span></span>
            </div>
            <p style={{ fontSize: 16, color: "var(--carmo-ink-700)", lineHeight: 1.6, margin: 0 }}>
              Furnas, pousadas, pesca, restaurantes, agenda, classificados e o que a prefeitura tá
              fazendo essa semana. Identidade própria, alma da cidade — operado pela infraestrutura
              da Cidade Viva.
            </p>
            <ul className="showcase__bullets">
              <li>
                <span className="bullet-icon"><Fish size={16} /></span>
                <span>
                  <strong>Turismo de Furnas em destaque</strong>
                  Praias, pesca esportiva, passeios de barco, pousadas com vista — tudo num lugar só.
                </span>
              </li>
              <li>
                <span className="bullet-icon"><UtensilsCrossed size={16} /></span>
                <span>
                  <strong>Comércio local em primeiro plano</strong>
                  Restaurantes, mercados, padarias e prestadores aparecem antes de qualquer rede nacional.
                </span>
              </li>
              <li>
                <span className="bullet-icon"><CalendarDays size={16} /></span>
                <span>
                  <strong>Agenda da cidade integrada</strong>
                  Festa do Padroeiro, feira livre, torneios de pesca, missas e shows — em um calendário só.
                </span>
              </li>
            </ul>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={CARMELITANO_URL} className="btn btn--primary">
                Visitar o Carmelitano <ExternalLink size={15} />
              </a>
              <a
                href="#cta"
                className="btn btn--ghost"
                onClick={(e) => { e.preventDefault(); scrollToCta(); }}
              >
                Quero o modelo na minha cidade
              </a>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <PortalPhoneMock heroImage={furnasImages.showcase} thumbImage={furnasImages.turismoC} compact />
          </div>
        </div>
      </section>

      {/* ============== CIDADES ============== */}
      <section className="section cidades" id="cidades">
        <div className="container cidades__grid">
          <div>
            <span className="eyebrow"><span className="eyebrow__dot" /> Onde a Cidade Viva está</span>
            <h2 className="section-head__title" style={{ marginTop: 14, textAlign: "left" }}>
              Começou em Carmo. Tá indo pro sul de Minas inteiro.
            </h2>
            <p style={{ fontSize: 17, color: "var(--carmo-ink-600)", margin: "12px 0 0", maxWidth: 540, lineHeight: 1.55 }}>
              Cada portal é independente, com identidade própria — mas roda na mesma infraestrutura.
              Painel pro comerciante, painel pra prefeitura, app pro morador.
            </p>
            <div className="cidades__list">
              <div className="cidade-card cidade-card--live">
                <div className="cidade-card__pin"><MapPin size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div className="cidade-card__name">Carmo do Rio Claro</div>
                  <div className="cidade-card__sub">MG · 22 mil hab · ao vivo desde 2026</div>
                </div>
                <div className="live-dot">Ao vivo</div>
              </div>
              {[
                ["Capitólio", "MG · em conversa"],
                ["Passos", "MG · em conversa"],
                ["Alfenas", "MG · em conversa"],
                ["Varginha", "MG · em conversa"],
                ["Guaxupé", "MG · em conversa"],
              ].map(([name, sub]) => (
                <div key={name} className="cidade-card cidade-card--soon">
                  <div className="cidade-card__pin"><MapPin size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="cidade-card__name">{name}</div>
                    <div className="cidade-card__sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="map-wrap">
            <div className="map-wrap__bg" />
            <svg className="map-art" viewBox="0 0 400 380" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
              <path
                d="M60 110 Q90 60 160 50 Q230 40 290 70 Q350 90 360 150 Q370 220 320 270 Q280 310 220 320 Q160 330 110 300 Q70 270 55 220 Q45 160 60 110 Z"
                fill="#fff"
                stroke="rgba(31, 74, 44, 0.15)"
                strokeWidth="1.5"
              />
              <path
                d="M150 200 Q170 195 185 205 Q200 215 215 210 Q230 205 245 215 Q255 220 250 230 Q245 240 230 238 Q215 236 200 240 Q185 244 170 240 Q155 236 148 226 Q142 215 150 200 Z"
                fill="rgba(46, 120, 194, 0.18)"
              />
              <text x="200" y="225" fontFamily="Fraunces, serif" fontSize="9" fontWeight="600" fill="rgba(15, 76, 129, 0.7)" textAnchor="middle" fontStyle="italic">Furnas</text>
              <text x="200" y="80" fontFamily="Fraunces, serif" fontSize="13" fontWeight="600" fill="rgba(31, 74, 44, 0.55)" textAnchor="middle" letterSpacing="0.04em">SUL DE MINAS</text>
            </svg>

            <div className="map-pin map-pin--live" style={{ left: "45%", top: "60%" }}>
              <span className="dot" /><span>Carmo</span>
            </div>
            <div className="map-pin map-pin--soon" style={{ left: "32%", top: "52%" }}>
              <span className="dot" /><span>Capitólio</span>
            </div>
            <div className="map-pin map-pin--soon" style={{ left: "28%", top: "38%" }}>
              <span className="dot" /><span>Passos</span>
            </div>
            <div className="map-pin map-pin--soon" style={{ left: "58%", top: "47%" }}>
              <span className="dot" /><span>Alfenas</span>
            </div>
            <div className="map-pin map-pin--soon" style={{ left: "70%", top: "62%" }}>
              <span className="dot" /><span>Varginha</span>
            </div>
            <div className="map-pin map-pin--soon" style={{ left: "55%", top: "72%" }}>
              <span className="dot" /><span>Guaxupé</span>
            </div>
          </div>
        </div>

        <div className="container">
          <div
            className="cidade-strip-marquee"
            role="region"
            aria-label="Cidades ao vivo e em breve na rede Cidade Viva"
          >
            <div className="cidade-strip-marquee__track">
              {[0, 1].map((dup) => (
                <div
                  key={dup}
                  className="cidade-strip-marquee__group"
                  aria-hidden={dup === 1}
                >
                  <div className="cidade-strip__item active">
                    Carmo do Rio Claro <span className="badge">Ao vivo</span>
                  </div>
                  <div className="cidade-strip__item">
                    Capitólio <span className="badge">Em breve</span>
                  </div>
                  <div className="cidade-strip__item">
                    Passos <span className="badge">Em breve</span>
                  </div>
                  <div className="cidade-strip__item">
                    Alfenas <span className="badge">Em breve</span>
                  </div>
                  <div className="cidade-strip__item">
                    Varginha <span className="badge">Em breve</span>
                  </div>
                  <div className="cidade-strip__item">
                    Guaxupé <span className="badge">Em breve</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== DEPOIMENTOS ============== */}
      <section className="section" hidden>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow"><span className="eyebrow__dot" /> Quem já tá dentro</span>
            <h2 className="section-head__title">Comerciantes que entraram cedo, e não saíram mais.</h2>
          </div>
          <div className="testimonials">
            {/* Depoimento 1 */}
            <div className="testimonial">
              <div className="testimonial__quote-mark">&ldquo;</div>
              <div className="testimonial__stars"><Star /><Star /><Star /><Star /><Star /></div>
              <p className="testimonial__quote">
                Em duas semanas o pessoal de Belo Horizonte tava reservando direto pelo portal.
                Antes era só boca a boca da pousada vizinha. Mudou de patamar.
              </p>
              <div className="testimonial__metric">
                <CalendarCheck size={14} />
                <span><strong>14</strong> reservas extras / mês</span>
              </div>
              <div className="testimonial__person">
                <div
                  className="testimonial__avatar"
                  style={{ background: "linear-gradient(135deg, #E0561B 0%, #C84810 100%)" }}
                >LP</div>
                <div>
                  <div className="testimonial__name">Lucas Pereira</div>
                  <div className="testimonial__role">Pousada Mirante das Furnas · Carmo do Rio Claro · MG</div>
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="testimonial">
              <div className="testimonial__quote-mark">&ldquo;</div>
              <div className="testimonial__stars"><Star /><Star /><Star /><Star /><Star /></div>
              <p className="testimonial__quote">
                O cliente abre o portal pra ver a coleta de lixo, e acaba achando o cardápio do
                almoço. É tráfego que eu nunca consegui no Instagram.
              </p>
              <div className="testimonial__metric">
                <TrendingUp size={14} />
                <span><strong>3×</strong> mais delivery aos domingos</span>
              </div>
              <div className="testimonial__person">
                <div
                  className="testimonial__avatar"
                  style={{ background: "linear-gradient(135deg, #1F4A2C 0%, #3C6B36 100%)" }}
                >MS</div>
                <div>
                  <div className="testimonial__name">Dona Marlene</div>
                  <div className="testimonial__role">Restaurante Sabor da Roça · Carmo do Rio Claro · MG</div>
                </div>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div className="testimonial">
              <div className="testimonial__quote-mark">&ldquo;</div>
              <div className="testimonial__stars"><Star /><Star /><Star /><Star /><Star /></div>
              <p className="testimonial__quote">
                Cupom de 15%, 47 resgates em três dias. E o melhor: dá pra ver de onde o pessoal tá
                vindo, qual horário, o que buscam. Nunca tive isso antes.
              </p>
              <div className="testimonial__metric">
                <Tag size={14} />
                <span><strong>47</strong> cupons resgatados em 3 dias</span>
              </div>
              <div className="testimonial__person">
                <div
                  className="testimonial__avatar"
                  style={{ background: "linear-gradient(135deg, #0F4C81 0%, #2E78C2 100%)" }}
                >RA</div>
                <div>
                  <div className="testimonial__name">Rafael Andrade</div>
                  <div className="testimonial__role">Café Arara · torrefação · Carmo do Rio Claro · MG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="section final-cta" id="cta" ref={ctaRef}>
        <div className="container final-cta__inner">
          <div>
            <span className="eyebrow"><span className="eyebrow__dot" /> Vagas pros 50 primeiros</span>
            <h2 className="final-cta__title">Coloque seu comércio no mapa da cidade.</h2>
            <p className="final-cta__lead">
              Cadastro grátis pros 50 primeiros comerciantes de cada cidade. Sem mensalidade no
              primeiro ano. Suporte humano, em português, com gente que entende de cidade pequena.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="#cta"
                className="btn btn--primary btn--lg"
                onClick={(e) => { e.preventDefault(); scrollToCta(); }}
              >
                Cadastrar meu comércio agora <ArrowRight size={17} />
              </a>
              <a href={CARMELITANO_URL} className="btn btn--ghost btn--lg">
                Ver Carmelitano ao vivo
              </a>
            </div>
          </div>

          <div className="cta-form">
            <span className="cta-form__label">Receber contato sobre o Carmelitano</span>
            {formState.ok ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, color: "var(--carmo-cerrado-700)", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--carmo-cerrado-100)", display: "grid", placeItems: "center", flex: "0 0 36px" }}>
                  <Check size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--carmo-ink-900)" }}>Recebido!</div>
                  <div style={{ fontSize: 13, color: "var(--carmo-ink-600)" }}>{formState.message}</div>
                </div>
              </div>
            ) : (
              <form className="cta-form__stack" action={formAction}>
                <input type="hidden" name="source" value="cidadeviva_lp_carmelitano" />
                <input type="hidden" name="page_path" value="/" />
                <input name="name" type="text" placeholder="Seu nome" autoComplete="name" />
                <input name="business_name" type="text" placeholder="Comércio, pousada ou órgão" autoComplete="organization" />
                <div className="cta-form__row">
                  <input name="email" type="email" placeholder="seu@email.com.br" autoComplete="email" required />
                  <input name="phone" type="tel" placeholder="WhatsApp" autoComplete="tel" />
                </div>
                <input name="city" type="text" placeholder="Cidade" autoComplete="address-level2" />
                <textarea name="message" placeholder="Me conte o que quer cadastrar ou implantar" rows={3} />
                <label className="cta-form__check">
                  <input name="consent" type="checkbox" required />
                  <span>
                    Aceito receber contato da CidadeViva e li a <Link href="/privacidade">Politica de Privacidade</Link>.
                  </span>
                </label>
                {formState.message ? <p className="cta-form__error">{formState.message}</p> : null}
                <button type="submit" className="btn btn--primary" disabled={isPending}>
                  {isPending ? "Enviando..." : "Quero falar sobre o Carmelitano"}
                </button>
              </form>
            )}
            <div className="cta-form__hint">
              <ShieldCheck size={14} />
              <span>A gente não envia spam. Promessa de mineiro.</span>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

function PortalPhoneMock({
  heroImage,
  thumbImage,
  compact = false,
}: {
  heroImage: string;
  thumbImage: string;
  compact?: boolean;
}) {
  return (
    <div className="phone-frame" aria-label="Previa do Carmelitano no celular">
      <div className="phone-screen">
        <div className="phone-status">
          <span>9:41</span>
          <span />
        </div>
        <div className="phone-app-head">
          <BrandMark size={28} />
          <div>
            <strong>Carmelitano</strong>
            <small>Carmo do Rio Claro</small>
          </div>
        </div>
        <div className="phone-search">Buscar pousada, restaurante, pesca</div>
        <div className="phone-chip-row">
          <span><MountainSnow size={13} /> Turismo</span>
          <span><Store size={13} /> Comercio</span>
          <span><CalendarDays size={13} /> Agenda</span>
        </div>
        <article className="phone-hero-card">
          <div className="phone-hero-thumb" style={{ backgroundImage: `url(${heroImage})` }} />
          <div>
            <small>Lago de Furnas</small>
            <strong>Mapa-guia com pontos perto de voce</strong>
          </div>
        </article>
        <div className="phone-list">
          <article>
            <span className="phone-list-thumb" style={{ backgroundImage: `url(${thumbImage})` }} />
            <div>
              <strong>Pousadas com vista</strong>
              <small>Hospedagem, pesca e natureza</small>
            </div>
          </article>
          <article>
            <span className="phone-list-icon"><UtensilsCrossed size={15} /></span>
            <div>
              <strong>Onde comer</strong>
              <small>Restaurantes e bares locais</small>
            </div>
          </article>
          {!compact ? (
            <article>
              <span className="phone-list-icon green"><MapPin size={15} /></span>
              <div>
                <strong>Ver no mapa</strong>
                <small>17 pontos visiveis agora</small>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}
