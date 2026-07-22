'use client'

// Botão + diálogo para assinar o Delivery Pro. Coleta CPF/CNPJ e abre a cobrança
// recorrente no Asaas (subscribeProAction); mostra o QR PIX da primeira fatura.
// A confirmação do pagamento liga o Pro via webhook — aqui só geramos a cobrança.

import { useState, useTransition } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'

import { subscribeProAction, type SubscribeProResult } from './subscription-actions'

export function SubscribePro({ businessId, priceLabel }: { businessId: string; priceLabel: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<SubscribeProResult | null>(null)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      setResult(await subscribeProAction(formData))
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setResult(null)
          setOpen(true)
        }}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-clay-600 px-4 py-2 text-sm font-bold text-white hover:bg-clay-700"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Assinar Pro · {priceLabel}/mês
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Assinar Delivery Pro</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-ink-500 hover:text-ink-700">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {result?.ok ? (
              <div className="grid gap-3">
                <p className="text-sm text-ink-700">
                  Assinatura criada! Pague a primeira fatura para ativar o Pro. As próximas são cobradas automaticamente todo mês.
                </p>
                {result.pixQrCode ? (
                  <div className="grid justify-items-center gap-2 rounded-xl border border-ink-100 bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:image/png;base64,${result.pixQrCode}`} alt="QR Code PIX" className="size-48" />
                    {result.pixPayload ? (
                      <code className="block w-full break-all rounded bg-paper p-2 text-[10px] text-ink-600">
                        {result.pixPayload}
                      </code>
                    ) : null}
                  </div>
                ) : null}
                {result.invoiceUrl ? (
                  <a
                    href={result.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold hover:bg-muted hover:no-underline"
                  >
                    Abrir fatura completa
                  </a>
                ) : null}
              </div>
            ) : (
              <form action={onSubmit} className="grid gap-3">
                <input type="hidden" name="business_id" value={businessId} />
                <p className="text-sm text-muted-foreground">
                  {priceLabel}/mês · PIX recorrente · cancele quando quiser.
                </p>
                <label className="grid gap-1 text-xs font-medium">
                  Nome do responsável
                  <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="full_name" required />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  CPF ou CNPJ
                  <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="cpf_cnpj" inputMode="numeric" required />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Telefone (opcional)
                  <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="phone" inputMode="tel" />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Forma de pagamento
                  <select className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="billing_type" defaultValue="PIX">
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </label>

                {result && !result.ok ? <p className="text-sm font-medium text-discount">{result.error}</p> : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-clay-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-clay-700 disabled:bg-ink-300"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                  {pending ? 'Gerando cobrança…' : 'Gerar cobrança'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
