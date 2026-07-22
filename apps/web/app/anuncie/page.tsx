import { NewsletterCTA } from '@/components/marketing/newsletter-cta';

export const metadata = {
  title: 'Anuncie',
  description: 'Anuncie no Portal Carmelitano e alcance moradores e visitantes de Carmo do Rio Claro.',
};

type AdvertisePageProps = {
  searchParams?: Promise<{ produto?: string; grupo?: string }>;
};

export default async function AdvertisePage({ searchParams }: AdvertisePageProps) {
  const params = await searchParams;
  const isCommunityBoost = params?.produto === 'destaque-comunidade';

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Anuncie</h1>
      <p className="text-muted-foreground">
        O portal prepara formatos de destaque para negocios, turismo, imoveis e classificados locais.
      </p>
      {isCommunityBoost ? (
        <section className="rounded-lg border border-cerrado-200 bg-cerrado-50 p-5">
          <p className="text-sm font-semibold text-cerrado-700">Destaque da Comunidade</p>
          <h2 className="mt-1 text-xl font-semibold">Impulsionar grupo por 30 dias</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Valor sugerido: <strong>R$ 49,90</strong>. O destaque pode colocar o grupo em
            posições melhores no diretório e em chamadas da home, sempre identificado como destaque.
          </p>
          {params?.grupo ? (
            <p className="mt-2 text-xs text-muted-foreground">Grupo solicitado: {params.grupo}</p>
          ) : null}
        </section>
      ) : null}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-xl font-semibold">Contato comercial</h2>
        <p className="mt-2 text-muted-foreground">Envie sua proposta pelo canal de contato enquanto o painel de ads nao estiver ativo.</p>
        <a className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" href="/contato?tipo=anuncio&pagina=%2Fanuncie&assunto=Anunciar%20no%20portal">
          Falar com o Portal Carmelitano
        </a>
      </section>
      <NewsletterCTA source="anuncie" />
    </main>
  );
}
