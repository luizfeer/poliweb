'use client';

import { useActionState, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { purchaseFeatureAction, type PurchaseFeatureResult } from '@/lib/community/featured';

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export type FeaturePurchaseDialogProps = {
  cityId: string;
  targetType: 'classified' | 'community_group';
  targetId: string;
  targetTitle: string;
  planSlug: string;
  amountCents: number;
  durationDays: number;
  defaultFullName?: string | null;
  defaultPhone?: string | null;
  currentFeaturedUntil?: string | null;
};

export function FeaturePurchaseDialog(props: FeaturePurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<PurchaseFeatureResult | null, FormData>(
    purchaseFeatureAction,
    null,
  );

  const isFeatured = props.currentFeaturedUntil
    ? new Date(props.currentFeaturedUntil).getTime() > Date.now()
    : false;

  return (
    <>
      {isFeatured ? (
        <span className="bg-sun-100 text-ink-900 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Destaque ativo até {dateFormatter.format(new Date(props.currentFeaturedUntil!))}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-sun-300 text-ink-900 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-extrabold hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Destacar por {moneyFormatter.format(props.amountCents / 100)}
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink-500 absolute right-4 top-4 rounded-md p-1 hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-extrabold">Destacar &quot;{props.targetTitle}&quot;</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {moneyFormatter.format(props.amountCents / 100)} por {props.durationDays} dias no topo da
              listagem, com selo Destaque.
            </p>

            {state?.ok ? (
              <PaymentResult result={state} onClose={() => setOpen(false)} />
            ) : (
              <PurchaseForm
                {...props}
                formAction={formAction}
                pending={pending}
                error={state?.ok === false ? state.error : null}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PurchaseForm(
  props: FeaturePurchaseDialogProps & {
    formAction: (formData: FormData) => void;
    pending: boolean;
    error: string | null;
  },
) {
  return (
    <form action={props.formAction} className="mt-4 space-y-3">
      <input type="hidden" name="city_id" value={props.cityId} />
      <input type="hidden" name="target_type" value={props.targetType} />
      <input type="hidden" name="target_id" value={props.targetId} />
      <input type="hidden" name="plan_slug" value={props.planSlug} />

      <label className="block text-sm">
        <span className="font-semibold">Nome completo</span>
        <input
          name="full_name"
          defaultValue={props.defaultFullName ?? ''}
          required
          minLength={3}
          className="border-ink-100 mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-semibold">CPF ou CNPJ</span>
        <input
          name="cpf_cnpj"
          required
          inputMode="numeric"
          placeholder="000.000.000-00"
          className="border-ink-100 mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">
          Necessário para emitir a cobrança pelo Asaas. Não exibimos publicamente.
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-semibold">Telefone (opcional)</span>
        <input
          name="phone"
          defaultValue={props.defaultPhone ?? ''}
          inputMode="tel"
          className="border-ink-100 mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </label>

      <fieldset className="space-y-1 text-sm">
        <legend className="font-semibold">Forma de pagamento</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="billing_type" value="PIX" defaultChecked /> PIX (libera na hora)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="billing_type" value="CREDIT_CARD" /> Cartão de crédito
        </label>
      </fieldset>

      {props.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {props.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={props.pending}
        className="bg-ink-900 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {props.pending ? 'Gerando cobrança...' : 'Gerar cobrança'}
      </button>
      <p className="text-xs text-muted-foreground">
        Ao confirmar você concorda com os termos do portal. O destaque é ativado automaticamente
        quando o pagamento for confirmado pelo Asaas.
      </p>
    </form>
  );
}

function PaymentResult({
  result,
  onClose,
}: {
  result: Extract<PurchaseFeatureResult, { ok: true }>;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        Pedido criado. {result.billingType === 'PIX'
          ? 'Pague o PIX abaixo para ativar o destaque imediatamente.'
          : 'Conclua o pagamento no link da Asaas. O destaque ativa após confirmação.'}
      </p>

      {result.pixQrCode ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${result.pixQrCode}`}
            alt="QR Code PIX"
            className="h-56 w-56"
          />
          {result.pixPayload ? (
            <>
              <p className="text-xs text-muted-foreground">Ou copie o código PIX:</p>
              <textarea
                readOnly
                value={result.pixPayload}
                className="border-ink-100 h-24 w-full rounded-md border p-2 text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(result.pixPayload ?? '')}
                className="border-ink-100 rounded-md border px-3 py-1 text-xs font-semibold"
              >
                Copiar
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {result.invoiceUrl ? (
        <a
          href={result.invoiceUrl}
          target="_blank"
          rel="noreferrer"
          className="border-ink-100 inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold"
        >
          Abrir página de pagamento Asaas
        </a>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="bg-ink-900 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-extrabold text-white"
      >
        Fechar
      </button>
    </div>
  );
}
