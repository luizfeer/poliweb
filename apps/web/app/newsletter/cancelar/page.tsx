import Link from 'next/link';
import { unsubscribeNewsletter } from '@/lib/newsletter/confirm';

export const metadata = { title: 'Cancelar newsletter - Portal Carmelitano' };

export default async function CancelNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await unsubscribeNewsletter(token) : { ok: false };

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">{result.ok ? 'Inscricao cancelada' : 'Link invalido'}</h1>
      <p className="mt-3 text-muted-foreground">
        {result.ok ? 'Voce nao recebera novas newsletters desta cidade.' : 'O link pode ter expirado ou ja ter sido usado.'}
      </p>
      <Link href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        Voltar para a home
      </Link>
    </main>
  );
}
