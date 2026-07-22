'use client';

import { useState } from 'react';
import { ArrowRight, ShieldCheck, X } from 'lucide-react';
import { submitClaimAction } from './actions';

type ClaimModalProps = {
  businessId: string;
  businessName: string;
};

export function ClaimModal({ businessId, businessName }: ClaimModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-3.5 my-3 rounded-md border border-sky-200 bg-sky-50/80 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-700 text-white">
          <ShieldCheck size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-sky-800">Esta ficha ainda não foi reivindicada</div>
          <p className="m-0 mt-1 text-[12px] leading-snug text-ink-700">
            Se este negócio é seu, envie seu WhatsApp para validarmos o vínculo e liberar a administração da página.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-2 text-[13px] font-semibold text-white"
          >
            Reivindicar agora
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-10 sm:items-center">
          <div className="w-full max-w-md rounded-md bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                  <ShieldCheck size={18} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="m-0 text-[18px] font-bold text-ink-900">Reivindicar página</h2>
                  <p className="m-0 mt-1 text-[12px] leading-snug text-ink-600">
                    Envie seus dados para a equipe entrar em contato e validar o vínculo com {businessName}. Seu login
                    atual será vinculado à solicitação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-deep text-ink-700"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>

            <form action={submitClaimAction} className="grid gap-3 p-4">
              <input type="hidden" name="business_id" value={businessId} />
              <label className="grid gap-1.5 text-[12px] font-semibold text-ink-800">
                WhatsApp para contato
                <input
                  name="whatsapp"
                  required
                  inputMode="tel"
                  placeholder="(35) 9 9999-9999"
                  className="h-10 rounded-md border border-ink-200 px-3 text-[14px] font-normal"
                />
              </label>
              <label className="grid gap-1.5 text-[12px] font-semibold text-ink-800">
                Como você comprova que administra este negócio?
                <textarea
                  name="evidence_text"
                  required
                  placeholder="Ex.: sou proprietário, gerente ou responsável pelo atendimento. Informe CNPJ, Instagram oficial ou outro dado que ajude na validação."
                  className="min-h-28 rounded-md border border-ink-200 px-3 py-2 text-[14px] font-normal"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-700 px-3 py-2.5 text-[13px] font-semibold text-white"
              >
                Enviar reivindicação
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
