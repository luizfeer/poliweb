import { Band, SectionHeader } from '@/components/carmo';
import { NewsletterCTA } from '@/components/marketing/newsletter-cta';
import type { NewsletterCtaConfig } from '@/lib/home';

type Props = {
  config: NewsletterCtaConfig;
  title: string | null;
  citySlug: string;
};

export function NewsletterCtaBlock({ config, title, citySlug }: Props) {
  return (
    <>
      <SectionHeader title={title ?? 'Resumo semanal'} kicker="Newsletter" />
      <Band variant="paper-card" className="px-4 py-5">
        <p className="text-ink-600 mb-3 text-sm">
          {config.description ??
            'Receba os principais destaques da cidade por email. Confirmacao obrigatoria.'}
        </p>
        <NewsletterCTA citySlug={citySlug} source={config.source ?? 'home'} />
      </Band>
    </>
  );
}
