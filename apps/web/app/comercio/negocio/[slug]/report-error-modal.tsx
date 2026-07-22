'use client';

import { useState } from 'react';
import { ChevronRight, Flag, X } from 'lucide-react';
import { reportBusinessAction } from './actions';

type ReportErrorModalProps = {
  businessId: string;
  businessName: string;
};

const reportReasons = [
  { value: 'closed', label: 'Não existe mais' },
  { value: 'outdated_info', label: 'Informações desatualizadas' },
  { value: 'wrong_contact', label: 'Telefone ou WhatsApp errado' },
  { value: 'wrong_address', label: 'Endereço errado' },
  { value: 'duplicate', label: 'Anúncio duplicado' },
  { value: 'inappropriate', label: 'Conteúdo inadequado' },
  { value: 'other', label: 'Outro erro' },
] as const;

export function ReportErrorModal({ businessId, businessName }: ReportErrorModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mx-3.5 mt-3 rounded-md bg-paper-deep px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-600">
              <Flag size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-bold text-ink-800">Encontrou algum erro?</span>
              <span className="block truncate text-[11px] text-ink-500">Avise a equipe para revisar este anúncio</span>
            </span>
          </span>
          <ChevronRight size={17} className="shrink-0 text-ink-500" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-10 sm:items-center">
          <div className="w-full max-w-md rounded-md bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-paper-deep text-ink-700">
                  <Flag size={18} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="m-0 text-[18px] font-bold text-ink-900">Relatar erro</h2>
                  <p className="m-0 mt-1 text-[12px] leading-snug text-ink-600">
                    Avise a equipe sobre dados incorretos em {businessName}. O relato vai para revisão antes de qualquer
                    alteração.
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

            <form action={reportBusinessAction} className="grid gap-3 p-4">
              <input type="hidden" name="business_id" value={businessId} />
              <label className="grid gap-1.5 text-[12px] font-semibold text-ink-800">
                O que está errado?
                <select name="reason" required className="h-10 rounded-md border border-ink-200 px-3 text-[14px] font-normal">
                  {reportReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-[12px] font-semibold text-ink-800">
                Detalhes
                <textarea
                  name="notes"
                  placeholder="Ex.: mudou de endereço, fechou há alguns meses, telefone não atende..."
                  className="min-h-24 rounded-md border border-ink-200 px-3 py-2 text-[14px] font-normal"
                />
              </label>
              <button type="submit" className="rounded-md bg-ink-900 px-3 py-2.5 text-[13px] font-semibold text-white">
                Enviar relato
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
