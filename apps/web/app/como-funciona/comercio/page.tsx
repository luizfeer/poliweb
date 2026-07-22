import type { Metadata } from 'next';
import { Link } from '@/components/navigation/link';
import {
  BadgeCheck,
  BarChart3,
  Eye,
  Megaphone,
  MessageSquare,
  Pencil,
  Search,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { NewsletterCTA } from '@/components/marketing/newsletter-cta';

export const metadata: Metadata = {
  title: 'Para Comerciantes — Como Funciona | Portal Carmelitano',
  description:
    'Cadastre seu negócio no Portal Carmelitano gratuitamente. Apareça para moradores e visitantes de Carmo do Rio Claro com página própria, promoções, cupons e avaliações.',
  openGraph: {
    title: 'Para Comerciantes — Como Funciona | Portal Carmelitano',
    description:
      'Divulgue seu negócio gratuitamente no portal que todo morador de Carmo do Rio Claro acessa.',
    type: 'website',
  },
};

const steps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Cadastre-se em menos de 1 minuto com e-mail ou Google.',
    icon: Users,
  },
  {
    number: '02',
    title: 'Solicite acesso de comerciante',
    description:
      'No painel, peça a promoção para comerciante. A equipe aprova em até 24h.',
    icon: BadgeCheck,
  },
  {
    number: '03',
    title: 'Monte sua página',
    description:
      'Adicione fotos, descrição, horários, endereço e categorias. Tudo pelo painel.',
    icon: Pencil,
  },
  {
    number: '04',
    title: 'Publique e atraia clientes',
    description:
      'Seu negócio aparece na busca, no mapa e nas listagens da cidade. Comece a receber visitas.',
    icon: Eye,
  },
];

const features = [
  {
    title: 'Página própria do negócio',
    description:
      'Vitrine completa com fotos, mapa, horários de funcionamento e dados de contato.',
    icon: ShoppingBag,
  },
  {
    title: 'Promoções e cupons',
    description:
      'Crie ofertas especiais que aparecem em destaque para todos os usuários do portal.',
    icon: Tag,
  },
  {
    title: 'Avaliações de clientes',
    description:
      'Receba e responda avaliações — construa reputação e confiança online.',
    icon: Star,
  },
  {
    title: 'Busca inteligente com IA',
    description:
      'Quando alguém perguntar "onde comprar X?" ao assistente, seu negócio pode ser recomendado.',
    icon: Search,
  },
  {
    title: 'Estatísticas de acesso',
    description:
      'Veja quantas pessoas visitaram sua página, clicaram no telefone ou pediram rota.',
    icon: BarChart3,
  },
  {
    title: 'Destaque nos resultados',
    description:
      'Negócios com fotos, descrição completa e boas avaliações sobem naturalmente no ranking.',
    icon: TrendingUp,
  },
];

const faqs = [
  {
    q: 'É gratuito?',
    a: 'Sim. O cadastro básico e a página do negócio são 100% gratuitos. No futuro ofereceremos planos opcionais de destaque.',
  },
  {
    q: 'Preciso instalar algum app?',
    a: 'Não. O painel funciona pelo navegador do celular ou computador.',
  },
  {
    q: 'Quem vê minha página?',
    a: 'Moradores de Carmo do Rio Claro, visitantes e qualquer pessoa que pesquisar na internet — a página é pública e indexada pelo Google.',
  },
  {
    q: 'Posso ter mais de uma pessoa gerenciando?',
    a: 'Sim. Você pode adicionar funcionários como gerentes da página pelo painel.',
  },
  {
    q: 'Quanto tempo leva para aparecer?',
    a: 'Após a aprovação (até 24h), sua página já fica visível imediatamente.',
  },
];

export default function ComercioComoFuncionaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-clay-50 px-4 py-1.5 text-sm font-medium text-clay-700">
          <ShoppingBag className="h-4 w-4" />
          Para comerciantes
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Coloque seu negócio no mapa digital de Carmo
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          O Portal Carmelitano é onde moradores e visitantes buscam comércio, serviços e produtos
          na cidade. Tenha uma presença digital completa sem custo e sem complicação.
        </p>
      </section>

      {/* Steps */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Comece em 4 passos</h2>
        <div className="mt-8 space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-4 rounded-xl border bg-card p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">O que você ganha</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <div className="inline-flex rounded-lg bg-clay-50 p-2 text-clay-700">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="mt-16 rounded-2xl bg-paper-deep p-8 text-center">
        <Megaphone className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-4 text-2xl font-semibold">
          Mais de 200 negócios já estão no portal
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Restaurantes, lojas, oficinas, salões, clínicas e prestadores de serviço de
          Carmo do Rio Claro já aparecem para quem busca na região.
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Perguntas frequentes</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border bg-card p-5 [&[open]]:pb-4"
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                {faq.q}
                <Zap className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-semibold">Pronto para começar?</h2>
        <p className="mt-2 text-muted-foreground">
          Crie sua conta e solicite acesso de comerciante — leva menos de 2 minutos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Criar conta gratuita
          </Link>
          <Link
            href="/contato?tipo=comercio&pagina=%2Fcomo-funciona%2Fcomercio&assunto=Com%C3%A9rcio%20local"
            className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" />
            Falar com a equipe
          </Link>
        </div>
      </section>

      <div className="mt-16">
        <NewsletterCTA source="como-funciona-comercio" />
      </div>

      {/* JSON-LD FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </main>
  );
}
