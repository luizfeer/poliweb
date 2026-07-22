'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { convertBusinessToAttractionAction } from '@/app/painel/turismo/actions';

const attractionKinds = [
  { value: 'balneario', label: 'Balneário' },
  { value: 'mirante', label: 'Mirante' },
  { value: 'cachoeira', label: 'Cachoeira' },
  { value: 'trilha', label: 'Trilha' },
  { value: 'igreja', label: 'Igreja' },
  { value: 'museu', label: 'Museu' },
  { value: 'parque', label: 'Parque' },
  { value: 'praia', label: 'Praia' },
  { value: 'lago', label: 'Lago' },
  { value: 'historico', label: 'Histórico' },
] as const;

type Props = {
  businessId: string;
  variant?: 'inline' | 'card' | 'modal';
};

export function ConvertBusinessToAttractionForm({ businessId, variant = 'inline' }: Props) {
  const [state, formAction, pending] = useActionState(convertBusinessToAttractionAction, undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? 'Conversão realizada com sucesso.');
      window.setTimeout(() => setOpen(false), 0);
    } else {
      toast.error(state.message ?? 'Erro ao converter comércio.');
    }
  }, [state]);

  if (variant === 'card') {
    return (
      <form action={formAction} className="bg-card grid gap-3 rounded-xl border p-4 md:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor={`business_id-${businessId}`} className="text-sm font-medium">
            Converter comércio em atração
          </label>
          <input type="hidden" name="business_id" value={businessId} />
          <select
            id={`business_id-${businessId}`}
            name="type"
            required
            className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Selecione o tipo</option>
            {attractionKinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-lg border bg-background px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50"
          >
            {pending ? 'Convertendo…' : 'Converter'}
          </button>
        </div>
      </form>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-medium hover:bg-clay-50"
          onClick={() => setOpen(true)}
        >
          Converter em atração
        </button>
        {open ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
            role="dialog"
            aria-modal="true"
            aria-label="Converter comércio em atração"
          >
            <div className="w-full max-w-md rounded-xl border border-ink-100 bg-white p-4 shadow-pop">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-ink-900">
                    Converter em atração turística
                  </h2>
                  <p className="m-0 mt-1 text-sm leading-relaxed text-ink-600">
                    Crie uma ficha de turismo reaproveitando os dados deste comércio.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-ink-600 hover:bg-paper"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
              <form action={formAction} className="mt-4 grid gap-3">
                <input type="hidden" name="business_id" value={businessId} />
                <label className="grid gap-2 text-sm font-medium">
                  Tipo de atração
                  <select
                    name="type"
                    required
                    className="min-h-10 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecione o tipo</option>
                    {attractionKinds.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-3">
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-semibold hover:bg-paper"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="min-h-10 rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
                  >
                    {pending ? 'Convertendo...' : 'Converter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="business_id" value={businessId} />
      <select
        name="type"
        required
        className="h-9 rounded-lg border border-ink-100 bg-white px-2 text-xs"
      >
        <option value="">Converter em atração...</option>
        {attractionKinds.map((kind) => (
          <option key={kind.value} value={kind.value}>
            {kind.label}
          </option>
        ))}
      </select>
      <button
        className="h-9 rounded-lg border border-ink-100 bg-white px-3 text-xs font-semibold hover:bg-clay-50 disabled:opacity-50"
        type="submit"
        disabled={pending}
      >
        {pending ? '…' : 'Converter'}
      </button>
    </form>
  );
}
