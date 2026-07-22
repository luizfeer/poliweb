import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RequestPasswordResetForm } from '@/components/auth/auth-forms';

export const metadata = { title: 'Recuperar senha — Portal Carmelitano' };

export default function RecuperarSenhaPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-10">
      <Link
        href="/entrar"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-clay-600"
      >
        <ArrowLeft className="size-3.5" /> Voltar pra entrar
      </Link>

      <div className="mt-10 flex-1 space-y-5">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-clay-600">
          <span className="size-1.5 rounded-full bg-clay-500" />
          Recuperar senha
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">
            Esqueceu? Acontece.
          </h1>
          <p className="mt-2 text-ink-600">
            Coloca seu email e a gente manda um link seguro pra você criar uma senha nova.
          </p>
        </div>

        <div className="rounded-2xl border-l-4 border-clay-500 bg-paper-card p-6 shadow-card">
          <RequestPasswordResetForm />
        </div>

        <p className="text-center text-sm text-ink-600">
          Lembrou a senha?{' '}
          <Link href="/entrar" className="font-semibold text-clay-600 hover:underline">
            Voltar pra entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
