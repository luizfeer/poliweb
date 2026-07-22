import { NewsletterCTA } from '@/components/marketing/newsletter-cta';
import type { ContactSubmissionType } from '@/lib/contact/types';
import { ContactForm } from './contact-form';

export const metadata = {
  title: 'Contato',
  description: 'Fale com o Portal Carmelitano.',
};

type ContactPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const sourcePage = textParam(params?.pagina) ?? '';
  const subject = textParam(params?.assunto) ?? 'Contato pelo portal';
  const selectedType = textParam(params?.tipo) ?? inferContactType(subject) ?? 'correcao';

  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-[#f5f7f4] px-4 py-10">
      <header>
        <p className="m-0 text-[12px] font-bold uppercase text-cerrado-700">Portal Carmelitano</p>
        <h1 className="m-0 mt-2 text-3xl font-bold text-ink-900">Contato</h1>
        <p className="m-0 mt-2 text-ink-700">
          Use este canal para pauta, correção, parceria ou interesse comercial.
        </p>
      </header>

      <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="text-xl font-semibold text-ink-900">Enviar mensagem</h2>
        <ContactForm selectedType={selectedType} sourcePage={sourcePage} subject={subject} />
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="text-xl font-semibold">Email direto</h2>
        <p className="mt-2 text-muted-foreground">contato@carmolocal.com.br</p>
      </section>
      <NewsletterCTA source="contato" />
    </main>
  );
}

function textParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function inferContactType(subject: string): ContactSubmissionType | null {
  const normalized = subject
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (normalized.includes('imprensa')) return 'imprensa';
  if (normalized.includes('assinatura') || normalized.includes('cobranca')) return 'assinatura';
  if (normalized.includes('pesca')) return 'pesca';
  if (normalized.includes('anuncio') || normalized.includes('anunciar')) return 'anuncio';
  if (normalized.includes('comercio') || normalized.includes('comercial')) return 'comercio';
  if (normalized.includes('turismo')) return 'turismo';
  if (normalized.includes('passagem')) return 'passagens';
  return null;
}
