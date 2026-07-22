import { NewsletterCTA } from '@/components/marketing/newsletter-cta';

export const metadata = {
  title: 'Sobre',
  description: 'Conheca a missao do Portal Carmelitano em Carmo do Rio Claro/MG.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Sobre o Portal Carmelitano</h1>
      <p className="text-muted-foreground">
        O Portal Carmelitano reune informacao util, comercio, turismo, comunidade e transparencia em um unico portal hiperlocal.
      </p>
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-xl font-semibold">Missao</h2>
        <p className="mt-2 text-muted-foreground">
          Facilitar a vida de quem mora, trabalha ou visita Carmo do Rio Claro, com informacao clara e verificavel.
        </p>
      </section>
      <NewsletterCTA source="sobre" />
    </main>
  );
}
