import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';

export const metadata = { title: 'Postar classificado - Portal Carmelitano' };

export default async function PostClassifiedPage() {
  await requireProfile();
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold">Postar classificado</h1>
      <p className="mt-2 text-muted-foreground">O formulario completo agora fica no painel do cidadao.</p>
      <Link href="/painel/cidadao/classificados/novo" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        Abrir formulario completo
      </Link>
    </main>
  );
}
