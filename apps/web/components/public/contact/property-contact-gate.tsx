'use client';

import { Loader2, MessageCircle, Phone } from 'lucide-react';
import { useState, useTransition } from 'react';
import { requestPropertyContactAction, type PropertyContactResult } from '@/app/imoveis/actions';
import { Button } from '@/components/ui/button';
import { ContactSafetyNotice } from './contact-safety-notice';

type PropertyContactGateProps = {
  propertyId: string;
  propertySlug: string;
  nextPath: string;
  contactName: string | null;
};

export function PropertyContactGate({
  propertyId,
  propertySlug,
  nextPath,
  contactName,
}: PropertyContactGateProps) {
  const [result, setResult] = useState<PropertyContactResult | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function requestContact() {
    setError('');
    startTransition(async () => {
      try {
        const contact = await requestPropertyContactAction({
          propertyId,
          propertySlug,
          nextPath,
        });
        setResult(contact);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível liberar o contato.');
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">Contato do anunciante</p>
      <p className="mt-1 text-sm text-muted-foreground">{contactName ?? 'Responsável pelo imóvel'}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Por segurança, WhatsApp e telefone só são liberados depois de login e ficam registrados
        como solicitação de contato.
      </p>
      <div className="mt-3">
        <ContactSafetyNotice />
      </div>

      {result ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {result.whatsappUrl ? (
            <a
              href={result.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
          {result.phoneUrl ? (
            <a
              href={result.phoneUrl}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Ligar
            </a>
          ) : null}
          {!result.whatsappUrl && !result.phoneUrl ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Este imóvel não tem telefone público vinculado. Use o formulário de interesse.
            </p>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          onClick={requestContact}
          disabled={pending}
          className="mt-3 min-h-11 w-full"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Solicitar WhatsApp e telefone
        </Button>
      )}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
