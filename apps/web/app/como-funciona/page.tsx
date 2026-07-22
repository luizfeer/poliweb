import type { Metadata } from 'next';
import { Link } from '@/components/navigation/link';
import {
  Bell,
  CalendarDays,
  Fish,
  Heart,
  House,
  MapPin,
  MessageCircleQuestion,
  Newspaper,
  Phone,
  Search,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Users,
} from 'lucide-react';

import { NewsletterCTA } from '@/components/marketing/newsletter-cta';

export const metadata: Metadata = {
  title: 'Como Funciona — Portal Carmelitano',
  description:
    'Descubra como o Portal Carmelitano conecta você a tudo que importa em Carmo do Rio Claro: comércio, turismo, serviços públicos, comunidade e muito mais.',
  openGraph: {
    title: 'Como Funciona — Portal Carmelitano',
    description:
      'O portal hiperlocal de Carmo do Rio Claro reúne comércio, turismo, serviços e comunidade em um só lugar.',
    type: 'website',
  },
};

const steps = [
  {
    number: '01',
    title: 'Acesse o portal',
    description:
      'Entre pelo navegador do celular ou computador. Sem app para baixar — funciona direto na web.',
    icon: MapPin,
  },
  {
    number: '02',
    title: 'Explore os módulos',
    description:
      'Comércio, turismo, imóveis, classificados, serviços públicos, comunidade — tudo organizado por categoria.',
    icon: Search,
  },
  {
    number: '03',
    title: 'Encontre o que precisa',
    description:
      'Busca inteligente com IA. Pergunte em linguagem natural ou navegue pelas categorias.',
    icon: MessageCircleQuestion,
  },
  {
    number: '04',
    title: 'Fique por dentro',
    description:
      'Assine a newsletter e receba alertas sobre o que acontece na cidade — eventos, promoções e utilidade pública.',
    icon: Bell,
  },
];

const features = [
  {
    title: 'Comércio local',
    description: 'Encontre lojas, restaurantes e prestadores com horários, promoções e avaliações.',
    icon: Store,
    color: 'bg-clay-50 text-clay-700',
  },
  {
    title: 'Turismo e lazer',
    description: 'Pousadas, atrativos, pesca esportiva, roteiros e pacotes para explorar a região.',
    icon: Fish,
    color: 'bg-cerrado-100 text-cerrado-700',
  },
  {
    title: 'Imóveis',
    description: 'Aluguel e venda de casas, terrenos e rurais com fotos, mapa e contato direto.',
    icon: House,
    color: 'bg-sky-100 text-sky-700',
  },
  {
    title: 'Classificados',
    description: 'Vagas de emprego, veículos, itens usados e serviços publicados pela comunidade.',
    icon: Tag,
    color: 'bg-sun-100 text-ink-900',
  },
  {
    title: 'Serviços públicos',
    description: 'Coleta de lixo, farmácias de plantão, telefones úteis e alertas em tempo real.',
    icon: Phone,
    color: 'bg-cerrado-50 text-cerrado-700',
  },
  {
    title: 'Comunidade',
    description: 'Igrejas, agenda de eventos, achados e perdidos, pets e muito mais.',
    icon: Users,
    color: 'bg-clay-50 text-clay-600',
  },
  {
    title: 'Transparência',
    description: 'Dados públicos municipais acessíveis e organizados para o cidadão acompanhar.',
    icon: Shield,
    color: 'bg-sky-100 text-sky-700',
  },
  {
    title: 'Assistente IA',
    description: 'Pergunte qualquer coisa sobre a cidade e receba respostas claras e atualizadas.',
    icon: MessageCircleQuestion,
    color: 'bg-sun-100 text-ink-900',
  },
];

const benefits = [
  {
    title: 'Gratuito para moradores',
    description: 'Sem taxas, sem assinatura. Acesse tudo de graça.',
    icon: Heart,
  },
  {
    title: 'Informação verificada',
    description: 'Dados conferidos e atualizados pela equipe e pela comunidade.',
    icon: Star,
  },
  {
    title: 'Feito para Carmo',
    description: 'Conteúdo 100% local — não é um portal genérico adaptado.',
    icon: MapPin,
  },
];

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tudo sobre Carmo do Rio Claro em um só lugar
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          O Portal Carmelitano é o portal hiperlocal que reúne comércio, turismo, serviços públicos,
          imóveis, classificados e comunidade — feito por quem conhece a cidade, para quem vive ela.
        </p>
      </section>

      {/* Steps */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">Como usar em 4 passos</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {steps.map((step) => (
            <div key={step.number} className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.number}
                </span>
                <step.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold">O que você encontra aqui</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <div className={`inline-flex rounded-lg p-2 ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-16 rounded-2xl bg-paper-deep p-8">
        <h2 className="text-center text-2xl font-semibold">Por que usar o Portal Carmelitano?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-3 font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-semibold">Tem um negócio ou pousada?</h2>
        <p className="mt-2 text-muted-foreground">
          Veja como o portal pode atrair mais clientes para você.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/como-funciona/comercio"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <ShoppingBag className="h-4 w-4" />
            Sou comerciante
          </Link>
          <Link
            href="/como-funciona/turismo"
            className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
          >
            <Fish className="h-4 w-4" />
            Sou do turismo
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <div className="mt-16">
        <NewsletterCTA source="como-funciona" />
      </div>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Como Funciona — Portal Carmelitano',
            description:
              'Descubra como o Portal Carmelitano conecta você a tudo que importa em Carmo do Rio Claro.',
            url: 'https://carmolocal.com.br/como-funciona',
            isPartOf: {
              '@type': 'WebSite',
              name: 'Portal Carmelitano',
              url: 'https://carmolocal.com.br',
            },
          }),
        }}
      />
    </main>
  );
}
