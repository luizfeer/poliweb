import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SignUpForm } from '@/components/auth/auth-forms';
import { LoginAside } from '@/components/auth/sign-in-experience';
import { getCurrentCity } from '@/lib/cities';

export const metadata = { title: 'Criar conta — Portal Carmelitano' };

export default async function CadastroPage() {
  const city = await getCurrentCity();
  const cityName = city?.name ?? 'Carmo do Rio Claro';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[480px_1fr]">
      <LoginAside mode="visitante" cityName={cityName} />

      <section className="relative flex min-h-screen flex-col px-4 py-8 md:px-10 lg:py-12">
        <div>
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-clay-600"
          >
            <ArrowLeft className="size-3.5" /> Voltar pro portal
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-clay-600">
            <span className="size-1.5 rounded-full bg-clay-500" />
            Criar conta no portal
          </span>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 md:text-4xl">
            Boas-vindas a <em className="italic text-clay-500">{cityName}</em>.
          </h1>

          <div className="mt-7">
            <SignUpForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink-600">
            Já tem conta?{' '}
            <Link href="/entrar" className="font-semibold text-clay-600 hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-xs text-ink-400">
          <span>Portal Carmelitano</span>
          <span className="flex gap-4">
            <Link href="/privacidade" className="hover:text-ink-600">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-ink-600">
              Termos
            </Link>
          </span>
        </div>
      </section>
    </div>
  );
}
