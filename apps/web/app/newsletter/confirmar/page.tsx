import Link from 'next/link';
import { NewsletterConfirmAnalytics } from '@/components/analytics/newsletter-confirm-analytics';
import { confirmNewsletter } from '@/lib/newsletter/confirm';

export const metadata = { title: 'Confirmar newsletter - Portal Carmelitano' };

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await confirmNewsletter(token) : { ok: false };

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      {result.ok ? <NewsletterConfirmAnalytics /> : null}
      <h1 className="text-3xl font-bold">{result.ok ? 'Inscricao confirmada' : 'Link invalido'}</h1>
      <p className="mt-3 text-muted-foreground">
        {result.ok ? 'Voce recebera os principais destaques da cidade.' : 'Solicite um novo link de confirmacao.'}
      </p>
      <Link href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        Voltar para a home
      </Link>
    </main>
  );
}
