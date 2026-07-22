import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { MarketingFooter } from "../../_components/marketing-footer";
import { MarketingNav } from "../../_components/marketing-nav";
import { CARMELITANO_URL } from "../../../lib/marketing-constants";

type PersonaSlug = "comerciantes" | "prefeituras" | "associacoes-comerciais" | "moradores";

type Persona = {
  slug: PersonaSlug;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  lead: string;
  benefits: string[];
  sections: { heading: string; body: string }[];
};

const personaNavLabel: Record<PersonaSlug, string> = {
  comerciantes: "Comerciantes",
  prefeituras: "Prefeituras",
  "associacoes-comerciais": "Associações comerciais",
  moradores: "Moradores",
};

const personas: Record<PersonaSlug, Persona> = {
  comerciantes: {
    slug: "comerciantes",
    title: "Portal hiperlocal para comerciantes | Cidade Viva",
    description:
      "Cadastre restaurante, pousada ou loja no portal da sua cidade: vitrine, WhatsApp, cupons e métricas. Modelo Carmelitano em Carmo do Rio Claro — implante na sua região.",
    keywords: [
      "portal para comerciantes",
      "vitrine digital cidade pequena",
      "cadastro comércio Carmo do Rio Claro",
      "marketing local interior",
      "hiperlocal Brasil",
    ],
    h1: "Para comerciantes que querem aparecer onde o cliente já busca",
    lead:
      "O Carmelitano mostra como um portal único concentra turismo, cupons e busca local. Na Cidade Viva, seu negócio ganha página própria, destaque em categorias e painel com visitas e contatos — sem depender só de rede social.",
    benefits: [
      "Página pública com fotos, horário e mapa",
      "Botão direto para WhatsApp e telefone",
      "Cupons e ofertas com resgates mensuráveis",
      "Prioridade para negócio local em buscas da cidade",
    ],
    sections: [
      {
        heading: "Por que não basta só Instagram ou Google genérico",
        body:
          "Em cidades menores, as pessoas costumam abrir o portal da cidade para agenda, turismo e serviços. Estar listado ali é estar no hábito do morador e do turista. A Cidade Viva organiza categorias e geolocalização para o seu tipo de negócio aparecer no momento certo.",
      },
      {
        heading: "Programa dos 50 primeiros por cidade",
        body:
          "Sem mensalidade para os primeiros cadastros em cada implantação. Você entra cedo, ajuda a popular o mapa da cidade e consolidar o hábito de uso antes da monetização futura — sempre com transparência.",
      },
    ],
  },
  prefeituras: {
    slug: "prefeituras",
    title: "Portal cívico e hiperlocal para prefeituras | Cidade Viva",
    description:
      "Plataforma multi-módulo por cidade: transparência leve, utilidades, turismo e agenda cívica no mesmo endereço que o comércio local — engajamento real sem substituir o site institucional.",
    keywords: [
      "portal municipal cidade pequena",
      "transparência participação cidadã",
      "turismo prefeitura interior",
      "comunicação municipal digital",
    ],
    h1: "Para prefeituras que querem um canal digital que a cidade realmente usa",
    lead:
      "Um único portal hiperlocal reúne o que o cidadão busca no dia a dia — eventos, turismo, utilidades e espaço para comunicação oficial. Módulos ligam ou desligam por cidade; dados ficam isolados por município com governança clara.",
    benefits: [
      "Módulos opcionais: utilidades, eventos, turismo, transparência",
      "Mesmo hábito de uso que atrai o comércio local",
      "Identidade visual da cidade no portal (marca local)",
      "Infraestrutura pensada para LGPD e escala multi-cidade",
    ],
    sections: [
      {
        heading: "Complemento ao site institucional",
        body:
          "O portal não substitui o domínio oficial da administração: ele é o lugar onde morador e visitante já estão por causa de agenda, mapa e comércio. A prefeitura ganha uma camada de serviços e proximidade com audiência orgânica.",
      },
      {
        heading: "Implantação regional",
        body:
          "O caso Carmelitano em Carmo do Rio Claro serve como referência operacional. Falamos sobre rollout para municípios vizinhos no Sul de Minas com mesma base tecnológica e políticas por cidade.",
      },
    ],
  },
  "associacoes-comerciais": {
    slug: "associacoes-comerciais",
    title: "Portal hiperlocal para associações comerciais | Cidade Viva",
    description:
      "Central digital para associados: vitrine, campanhas e métricas por loja. Fortaleça o comércio local com um endereço único que moradores e turistas já consultam.",
    keywords: [
      "associação comercial digital",
      "portal lojistas cidade pequena",
      "campanhas comércio local",
      "CDL digital interior Minas",
    ],
    h1: "Para associações comerciais que precisam entregar valor mensurável aos associados",
    lead:
      "Em vez de PDFs espalhados e grupos de WhatsApp perdidos, um portal hiperlocal dá a cada associado presença na busca da cidade, cupons coordenados e números de visitas. A Cidade Viva opera a infraestrutura; a associação articula adesão e campanhas.",
    benefits: [
      "Onboarding em massa para associados",
      "Relatórios agregados por categoria (sem expor dados sensíveis)",
      "Campanhas sazonais (festas, feriados, turismo)",
      "Marca da cidade em evidência — não de rede nacional",
    ],
    sections: [
      {
        heading: "Parceria com adesão dos lojistas",
        body:
          "O modelo dos 50 primeiros sem mensalidade reduz fricção para encher o portal rápido. A associação comunica o benefício coletivo: tráfego que volta toda semana para agenda e serviços, não só para uma loja isolada.",
      },
      {
        heading: "Expansão Sul de Minas",
        body:
          "Cidades em pipeline aparecem na landing como em breve; Carmo está ao vivo com o Carmelitano. Podemos alinhar roadmap com diretoria e secretarias parceiras.",
      },
    ],
  },
  moradores: {
    slug: "moradores",
    title: "Portal da cidade para moradores | Carmelitano e Cidade Viva",
    description:
      "Um só lugar para agenda, turismo, classificados, comércio local e utilidades — pensado para cidade do interior. Carmelitano em Carmo do Rio Claro; mais cidades em breve.",
    keywords: [
      "portal Carmo do Rio Claro",
      "agenda eventos cidade pequena",
      "classificados locais",
      "turismo Furnas",
      "comércio local Minas Gerais",
    ],
    h1: "Para moradores que querem a cidade no bolso, sem apps genéricos",
    lead:
      "O Carmelitano concentra o que importa em Carmo do Rio Claro: onde comer, dormir, o que rolar no fim de semana e achados da comunidade. É pensado para rotina real — não para capital genérica.",
    benefits: [
      "Busca e categorias pensadas para negócios da região",
      "Agenda e turismo alinhados ao calendário local",
      "Participação comunitária com moderação",
      "Privacidade e LGPD descritos em política clara",
    ],
    sections: [
      {
        heading: "Por que usar o portal da cidade",
        body:
          "Grandes marketplaces priorizam anúncios e cidades grandes. Um portal hiperlocal prioriza quem está na sua rua, na praça e na estrada regional — com mapa e linguagem do lugar.",
      },
      {
        heading: "Outras cidades",
        body:
          "Capitólio, Passos, Alfenas, Varginha e Guaxupé estão no roadmap Sul de Minas. Enquanto isso, o Carmelitano já está ao vivo para você acompanhar o modelo.",
      },
    ],
  },
};

export function generateStaticParams(): { slug: string }[] {
  return (Object.keys(personas) as PersonaSlug[]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = personas[slug as PersonaSlug];
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    openGraph: {
      title: p.title,
      description: p.description,
      type: "article",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description,
    },
    alternates: {
      canonical: `/para-quem/${p.slug}`,
    },
  };
}

function siteOrigin(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cidadeviva.com.br";
  return base.replace(/\/$/, "");
}

function JsonLd({ persona }: { persona: Persona }) {
  const origin = siteOrigin();
  const payload = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: persona.h1,
    description: persona.description,
    url: `${origin}/para-quem/${persona.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Cidade Viva",
      url: origin,
    },
    publisher: {
      "@type": "Organization",
      name: "CidadeViva",
      url: origin,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export default async function ParaQuemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const persona = personas[slug as PersonaSlug];
  if (!persona) notFound();

  return (
    <>
      <JsonLd persona={persona} />
      <MarketingNav />
      <main className="para-quem">
        <header className="para-quem__hero">
          <div className="container para-quem__hero-inner">
            <p className="para-quem__eyebrow">Cidade Viva · Pra quem</p>
            <h1>{persona.h1}</h1>
            <p className="para-quem__lead">{persona.lead}</p>
            <div className="para-quem__actions">
              <Link href="/#cta" className="btn btn--primary">
                Falar com a equipe <ArrowRight size={16} aria-hidden />
              </Link>
              <a href={CARMELITANO_URL} className="btn btn--ghost">
                Ver Carmelitano ao vivo
              </a>
            </div>
          </div>
        </header>

        <section className="para-quem__section">
          <div className="container">
            <h2 className="para-quem__h2">O que você ganha</h2>
            <ul className="para-quem__benefits">
              {persona.benefits.map((line) => (
                <li key={line}>
                  <span className="para-quem__check" aria-hidden>
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {persona.sections.map((block) => (
          <section key={block.heading} className="para-quem__section para-quem__section--alt">
            <div className="container para-quem__prose">
              <h2>{block.heading}</h2>
              <p>{block.body}</p>
            </div>
          </section>
        ))}

        <section className="para-quem__section">
          <div className="container para-quem__related">
            <h2 className="para-quem__h2">Outros perfis</h2>
            <nav className="para-quem__related-links" aria-label="Páginas para outros públicos">
              {(Object.keys(personas) as PersonaSlug[])
                .filter((s) => s !== persona.slug)
                .map((s) => (
                  <Link key={s} href={`/para-quem/${s}`}>
                    {personaNavLabel[s]}
                  </Link>
                ))}
            </nav>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
