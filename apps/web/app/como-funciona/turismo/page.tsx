import type { Metadata } from 'next';
import { Link } from '@/components/navigation/link';
import {
  BadgeCheck,
  BarChart3,
  Bed,
  Calendar,
  Camera,
  Eye,
  Fish,
  Globe,
  MapPin,
  MessageSquare,
  Pencil,
  Search,
  Star,
  Sun,
  TrendingUp,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';

import { NewsletterCTA } from '@/components/marketing/newsletter-cta';

export const metadata: Metadata = {
  title: 'Para Turismo — Como Funciona | Portal Carmelitano',
  description:
    'Cadastre sua pousada, restaurante, atrativo ou serviço de pesca no Portal Carmelitano. Apareça para visitantes que buscam hospedagem e lazer em Carmo do Rio Claro e região de Furnas.',
  openGraph: {
    title: 'Para Turismo — Como Funciona | Portal Carmelitano',
    description:
      'Atraia visitantes para sua pousada, restaurante ou atrativo na região de Furnas e Canastra.',
    type: 'website',
  },
};

const steps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Cadastre-se gratuitamente em menos de 1 minuto.',
    icon: Users,
  },
  {
    number: '02',
    title: 'Cadastre seu estabelecimento',
    description:
      'Pousada, restaurante, atrativo, barco, guia de pesca — escolha o tipo e preencha os dados.',
    icon: Pencil,
  },
  {
    number: '03',
    title: 'Aprovação e publicação',
    description:
      'A equipe revisa as informações em até 24h. Após aprovação, sua página fica visível.',
    icon: BadgeCheck,
  },
  {
    number: '04',
    title: 'Receba visitantes',
    description:
      'Turistas encontram seu estabelecimento pela busca, mapa e recomendações do assistente IA.',
    icon: Eye,
  },
];

const categories = [
  {
    title: 'Pousadas e hospedagem',
    description:
      'Ficha completa com fotos, comodidades, preços, mapa e link direto para reserva.',
    icon: Bed,
    color: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    title: 'Restaurantes e alimentação',
    description:
      'Cardápio, horário, ambiente e localização para turistas que buscam onde comer.',
    icon: Utensils,
    color: 'bg-clay-50 text-clay-700',
  },
  {
    title: 'Pesca esportiva',
    description:
      'Pontos de pesca, guias credenciados, barcos e pacotes para pescadores.',
    icon: Fish,
    color: 'bg-sky-100 text-sky-700',
  },
  {
    title: 'Atrativos e passeios',
    description:
      'Cachoeiras, mirantes, trilhas e experiências com informações práticas para o visitante.',
    icon: Camera,
    color: 'bg-sun-100 text-ink-900',
  },
  {
    title: 'Pacotes turísticos',
    description:
      'Monte e divulgue pacotes combinando hospedagem, passeios e refeições.',
    icon: Calendar,
    color: 'bg-cerrado-50 text-cerrado-700',
  },
  {
    title: 'Eventos e temporadas',
    description:
      'Divulgue eventos sazonais, festivais e temporadas de pesca com destaque no portal.',
    icon: Sun,
    color: 'bg-clay-50 text-clay-600',
  },
];

const benefits = [
  {
    title: 'Visibilidade na região de Furnas',
    description:
      'O portal é referência para quem planeja visitar Carmo do Rio Claro e cidades vizinhas.',
    icon: Globe,
  },
  {
    title: 'SEO otimizado',
    description:
      'Sua página é indexada pelo Google — turistas encontram você ao pesquisar a região.',
    icon: Search,
  },
  {
    title: 'Recomendação por IA',
    description:
      'O assistente inteligente recomenda seu estabelecimento quando visitantes fazem perguntas.',
    icon: Star,
  },
  {
    title: 'Estatísticas de visitantes',
    description:
      'Acompanhe visualizações, cliques no telefone e pedidos de rota pelo painel.',
    icon: BarChart3,
  },
  {
    title: 'Avaliações e reputação',
    description:
      'Receba avaliações de hóspedes e construa confiança com novos visitantes.',
    icon: TrendingUp,
  },
  {
    title: 'Posicionamento no mapa',
    description:
      'Apareça no mapa interativo da cidade com pin e informações resumidas.',
    icon: MapPin,
  },
];

const faqs = [
  {
    q: 'É gratuito para pousadas e restaurantes?',
    a: 'Sim. O cadastro e a página completa são gratuitos. No futuro haverá opções de destaque pagas, mas o básico sempre será gratuito.',
  },
  {
    q: 'Posso cadastrar mais de um estabelecimento?',
    a: 'Sim. Se você tem uma pousada e um restaurante, pode cadastrar ambos com a mesma conta.',
  },
  {
    q: 'Os turistas vão me encontrar pelo Google?',
    a: 'Sim. As páginas são otimizadas para SEO e indexadas automaticamente. Buscas como "pousada em Carmo do Rio Claro" podem mostrar sua página.',
  },
  {
    q: 'Como funciona a recomendação por IA?',
    a: 'O assistente do portal usa inteligência artificial para responder perguntas dos visitantes. Se alguém perguntar "onde pescar em Carmo?", ele pode recomendar seus serviços.',
  },
  {
    q: 'Posso adicionar preços e disponibilidade?',
    a: 'Sim. O painel permite gerenciar fotos, preços, comodidades, descrição e disponibilidade.',
  },
];

export default function TurismoComoFuncionaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      <section className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-cerrado-100 px-4 py-1.5 text-sm font-medium text-cerrado-700">
          <Fish className="h-4 w-4" />
          Para turismo
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Atraia visitantes para seu negócio na região de Furnas
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Carmo do Rio Claro recebe milhares de turistas por ano — pescadores, famílias
          e aventureiros. O Portal Carmelitano é onde eles pesquisam hospedagem, passeios e serviços.
        </p>
      </section>

      {/* Steps */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Como cadastrar seu negócio</h2>
        <div className="mt-8 space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-4 rounded-xl border bg-card p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cerrado-500 text-sm font-bold text-white">
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

      {/* Categories */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">O que você pode cadastrar</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-5">
              <div className={`inline-flex rounded-lg p-2 ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Vantagens para seu negócio</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border bg-card p-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cerrado-100">
                <b.icon className="h-5 w-5 text-cerrado-700" />
              </div>
              <h3 className="mt-3 font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats / Social proof */}
      <section className="mt-16 rounded-2xl bg-paper-deep p-8">
        <div className="grid gap-8 text-center sm:grid-cols-3">
          <div>
            <p className="text-3xl font-bold text-cerrado-700">50+</p>
            <p className="mt-1 text-sm text-muted-foreground">Pousadas e hotéis</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-cerrado-700">30+</p>
            <p className="mt-1 text-sm text-muted-foreground">Pontos de pesca</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-cerrado-700">20+</p>
            <p className="mt-1 text-sm text-muted-foreground">Atrativos cadastrados</p>
          </div>
        </div>
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
        <h2 className="text-2xl font-semibold">Cadastre seu negócio turístico</h2>
        <p className="mt-2 text-muted-foreground">
          Gratuito, rápido e sem burocracia. Comece a receber visitantes agora.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-lg bg-cerrado-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-cerrado-700"
          >
            Criar conta gratuita
          </Link>
          <Link
            href="/contato?tipo=turismo&pagina=%2Fcomo-funciona%2Fturismo&assunto=Turismo"
            className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" />
            Falar com a equipe
          </Link>
        </div>
      </section>

      <div className="mt-16">
        <NewsletterCTA source="como-funciona-turismo" />
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
