import Link from 'next/link';
import { Send } from 'lucide-react';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

const suggestions = ['almoçar perto da praça', 'pousada com piscina', 'encanador', 'eventos no fim de semana'];

type SearchEmptyStateProps = {
  query?: string;
};

export function SearchEmptyState({ query = '' }: SearchEmptyStateProps) {
  const searchedTerm = query.trim();
  const cadastroUrl = `${resolvePublicSiteOrigin()}/comercio/cadastro`;
  const whatsappText = encodeURIComponent(
    [
      'Conhece algum serviço ou negócio que deveria estar no Carmo Local?',
      '',
      `Envie este convite para o cadastro: ${cadastroUrl}`,
    ].join('\n'),
  );

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">
        {searchedTerm ? 'Não encontramos o termo pesquisado' : 'Não encontramos nada por enquanto'}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchedTerm
          ? `Ainda não temos resultado para "${searchedTerm}".`
          : 'Tente uma busca mais direta ou procure por uma necessidade do dia a dia.'}
      </p>

      {!searchedTerm ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion}
              href={`/buscar?q=${encodeURIComponent(suggestion)}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          Conhece algum serviço ou negócio que deveria estar aqui?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie um convite agora para a pessoa cadastrar gratuitamente no portal.
        </p>
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Send className="size-4" aria-hidden="true" />
          Compartilhar convite
        </a>
      </div>
    </section>
  );
}
