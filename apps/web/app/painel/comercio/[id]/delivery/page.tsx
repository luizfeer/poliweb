import { notFound } from 'next/navigation'
import { ArrowLeft, Power, Save, Sparkles, Trash2 } from 'lucide-react'

import { Link } from '@/components/navigation/link'
import { requireRole } from '@/lib/auth'
import { getCurrentCity } from '@/lib/cities'
import { getDeliveryPlan } from '@/lib/delivery/plan'
import { createClient } from '@/lib/supabase/server'

import { BusinessTabs } from '../business-tabs'
import {
  deleteOperatorAction,
  setOnlineAction,
  startDeliveryTrialAction,
  upsertDeliverySettingsAction,
  upsertOperatorAction,
} from './actions'
import { SubscribePro } from './subscribe-pro'

type PageProps = { params: Promise<{ id: string }> }

export default async function BusinessDeliveryPage({ params }: PageProps) {
  const [{ id }, city] = await Promise.all([params, getCurrentCity()])
  if (!city) return null

  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })
  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: id })

  const db = supabase
  const { data: business } = await db
    .from('businesses')
    .select(
      'id, name, slug, delivery_enabled, pickup_enabled, table_service_enabled, delivery_fee, delivery_min_order, delivery_time_min, pickup_time_min, delivery_radius_km, pix_key, accepts_card_on_delivery, order_instructions',
    )
    .eq('id', id)
    .eq('city_id', city.id)
    .single()
  if (!business || !can) notFound()
  const [{ data: presence }, { data: operators }] = await Promise.all([
    db.from('business_delivery_status').select('is_online, auto_offline_at').eq('business_id', id).maybeSingle(),
    db.from('business_wa_operators').select('id, phone_number, display_name, role, verified_at').eq('business_id', id),
  ])

  const isOnline = presence?.is_online ?? false
  const b = business as Record<string, unknown>
  const plan = await getDeliveryPlan(business.id)

  const { data: proPlan } = await supabase
    .from('business_plans')
    .select('monthly_value_cents')
    .eq('slug', 'delivery-pro')
    .maybeSingle()
  const proPriceLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    ((proPlan?.monthly_value_cents as number | undefined) ?? 3900) / 100,
  )

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-clay-700 hover:no-underline"
          href={`/painel/comercio/${business.id}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para ficha
        </Link>
        <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Delivery e pedidos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Configure entrega, retirada, formas de pagamento e quem opera os pedidos pelo WhatsApp de {business.name}.
        </p>
      </header>

      <BusinessTabs businessId={business.id} active="delivery" />

      {/* Plano */}
      {plan.isPro ? (
        <section className="rounded-xl border border-clay-200 bg-clay-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-clay-700">
              <Sparkles className="mr-1.5 inline size-4" aria-hidden="true" />
              {plan.inTrial
                ? `Plano Pro — teste grátis, ${plan.trialDaysLeft} dia(s) restante(s)`
                : plan.subscriptionStatus === 'overdue'
                  ? 'Plano Pro — pagamento em atraso'
                  : 'Plano Pro ativo'}
            </p>
            <Link href={`/painel/comercio/${business.id}/relatorios`} className="text-sm font-semibold text-clay-700 underline hover:no-underline">
              Ver relatórios
            </Link>
          </div>
          {/* Em teste e ainda sem assinatura paga: oferecer assinatura pra não perder o Pro ao fim do teste. */}
          {plan.inTrial && !plan.hasSubscription ? (
            <div className="mt-3">
              <SubscribePro businessId={business.id} priceLabel={proPriceLabel} />
              <p className="mt-1 text-xs text-clay-700/80">Assine agora e continue no Pro quando o teste acabar.</p>
            </div>
          ) : null}
          {plan.subscriptionStatus === 'overdue' ? (
            <div className="mt-3">
              <SubscribePro businessId={business.id} priceLabel={proPriceLabel} />
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-xl border border-clay-200 bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">Plano Grátis</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No grátis o cliente pede pelo WhatsApp. No <strong>Pro</strong>, os pedidos chegam com botões no seu zap,
            aparecem na fila ao vivo e viram relatórios de venda.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!plan.trialUsed ? (
              <form action={startDeliveryTrialAction}>
                <input type="hidden" name="business_id" value={business.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-clay-300 bg-white px-4 py-2 text-sm font-bold text-clay-700 hover:bg-clay-50"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Testar 1 mês grátis
                </button>
              </form>
            ) : null}
            <SubscribePro businessId={business.id} priceLabel={proPriceLabel} />
          </div>
          {plan.trialUsed ? (
            <p className="mt-2 text-xs text-muted-foreground">Seu teste grátis já foi usado — assine para voltar ao Pro.</p>
          ) : null}
        </section>
      )}

      {/* Status online */}
      <section className="rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              Sua loja está{' '}
              <span className={isOnline ? 'text-green-600' : 'text-ink-500'}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isOnline
                ? 'Aparece na lista "Faça Pedidos" e aceita pedidos. Você também pode abrir/fechar pelo WhatsApp com /abrir e /fechar.'
                : 'Clientes não conseguem finalizar pedidos enquanto estiver offline.'}
            </p>
          </div>
          <form action={setOnlineAction}>
            <input type="hidden" name="business_id" value={business.id} />
            <input type="hidden" name="online" value={isOnline ? 'false' : 'true'} />
            <button
              type="submit"
              className={
                isOnline
                  ? 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold hover:bg-muted'
                  : 'inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700'
              }
            >
              <Power className="size-4" aria-hidden="true" />
              {isOnline ? 'Fechar loja' : 'Abrir loja'}
            </button>
          </form>
        </div>
      </section>

      {/* Configurações */}
      <form
        action={upsertDeliverySettingsAction}
        className="grid gap-4 rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5"
      >
        <input type="hidden" name="business_id" value={business.id} />
        <p className="text-sm font-semibold">Modalidades</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm">
            <input type="checkbox" name="delivery_enabled" defaultChecked={Boolean(b.delivery_enabled)} />
            Aceita entrega
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm">
            <input type="checkbox" name="pickup_enabled" defaultChecked={Boolean(b.pickup_enabled)} />
            Aceita retirada
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm">
            <input type="checkbox" name="table_service_enabled" defaultChecked={Boolean(b.table_service_enabled)} />
            Serviço de mesa
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field name="delivery_fee" label="Taxa de entrega (R$)" defaultValue={b.delivery_fee} placeholder="5,00" />
          <Field name="delivery_min_order" label="Pedido mínimo (R$)" defaultValue={b.delivery_min_order} placeholder="30,00" />
          <Field name="delivery_time_min" label="Tempo de entrega (min)" defaultValue={b.delivery_time_min} placeholder="40" />
          <Field name="pickup_time_min" label="Tempo de retirada (min)" defaultValue={b.pickup_time_min} placeholder="20" />
          <Field name="delivery_radius_km" label="Raio de entrega (km)" defaultValue={b.delivery_radius_km} placeholder="5" />
          <Field name="pix_key" label="Chave Pix" defaultValue={b.pix_key} placeholder="email/telefone/CPF" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accepts_card_on_delivery" defaultChecked={Boolean(b.accepts_card_on_delivery)} />
          Aceita cartão na entrega
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Instruções do pedido
          <textarea
            className="min-h-20 rounded-lg border border-ink-200 bg-white px-3 py-2"
            name="order_instructions"
            defaultValue={(b.order_instructions as string) ?? ''}
            placeholder="Ex.: informe o endereço completo com número e bairro."
          />
        </label>

        <div>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600"
          >
            <Save className="size-4" aria-hidden="true" />
            Salvar configurações
          </button>
        </div>
      </form>

      {/* Operadores WhatsApp */}
      <section className="grid gap-4 rounded-xl border border-ink-100 bg-card p-4 shadow-card md:p-5">
        <div>
          <p className="text-sm font-semibold">Operadores do WhatsApp</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Números que recebem os pedidos e podem operar pelo WhatsApp (comandos /abrir, /lista, etc.). Cadastre só
            números que você controla.
          </p>
        </div>

        <div className="grid gap-2">
          {(operators ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum operador cadastrado ainda.</p>
          ) : (
            (operators ?? []).map((op) => (
              <div
                key={op.id as string}
                className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{(op.display_name as string) || (op.phone_number as string)}</span>{' '}
                  <span className="text-muted-foreground">· {op.phone_number as string}</span>{' '}
                  <span className="text-xs text-muted-foreground">({op.role as string})</span>
                </span>
                <form action={deleteOperatorAction}>
                  <input type="hidden" name="business_id" value={business.id} />
                  <input type="hidden" name="operator_id" value={op.id as string} />
                  <button type="submit" className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remover
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        <form action={upsertOperatorAction} className="grid gap-3 rounded-lg border border-dashed border-ink-200 p-3 md:grid-cols-[1fr_1fr_140px_auto] md:items-end">
          <input type="hidden" name="business_id" value={business.id} />
          <label className="grid gap-1 text-xs font-medium">
            Telefone (com DDD)
            <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="phone_number" placeholder="35 99999-8888" required />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Nome (opcional)
            <input className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="display_name" placeholder="Maria (caixa)" />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Papel
            <select className="rounded-lg border border-ink-200 px-3 py-2 text-sm" name="role" defaultValue="operator">
              <option value="owner">Dono</option>
              <option value="operator">Operador</option>
            </select>
          </label>
          <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600">
            Adicionar
          </button>
        </form>
      </section>
    </div>
  )
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string
  label: string
  defaultValue: unknown
  placeholder?: string
}) {
  const value = defaultValue == null ? '' : String(defaultValue)
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="rounded-lg border border-ink-200 bg-white px-3 py-2"
        name={name}
        defaultValue={value}
        placeholder={placeholder}
      />
    </label>
  )
}
