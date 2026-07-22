'use server'

// Assinatura recorrente do Delivery Pro via Asaas. Espelha o fluxo de
// lib/community/featured.ts: cria/atualiza customer, abre subscription MONTHLY,
// gera o QR PIX da primeira fatura e registra no ledger portal_payments.
// A confirmação do pagamento (webhook) é que vira o plano para 'pro' — aqui só
// abrimos a cobrança. Ver lib/payments/delivery-subscription.ts (webhook).

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireRole } from '@/lib/auth'
import {
  createOrUpdateCustomer,
  createSubscription,
  cancelSubscription,
  dueDateFromNow,
  getAsaasConfig,
  getPaymentPixQrCode,
  isValidBrazilianDocument,
  listPaymentsForSubscription,
} from '@/lib/asaas'
import { getCurrentCity } from '@/lib/cities'
import { recordPortalPayment } from '@/lib/payments/ledger'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

const PLAN_SLUG = 'delivery-pro'

const subscribeSchema = z.object({
  business_id: z.string().uuid(),
  full_name: z.string().min(2).max(120),
  cpf_cnpj: z.string().min(11).max(20),
  phone: z.string().max(20).optional(),
  billing_type: z.enum(['PIX', 'BOLETO']).default('PIX'),
})

export type SubscribeProResult =
  | {
      ok: true
      invoiceUrl: string | null
      pixQrCode: string | null
      pixPayload: string | null
    }
  | { ok: false; error: string }

export async function subscribeProAction(formData: FormData): Promise<SubscribeProResult> {
  const parsed = subscribeSchema.safeParse({
    business_id: formData.get('business_id'),
    full_name: formData.get('full_name'),
    cpf_cnpj: String(formData.get('cpf_cnpj') ?? '').replace(/\D/g, ''),
    phone: (formData.get('phone') as string) || undefined,
    billing_type: formData.get('billing_type') || 'PIX',
  })
  if (!parsed.success) return { ok: false, error: 'Dados inválidos.' }
  const input = parsed.data

  if (!isValidBrazilianDocument(input.cpf_cnpj)) {
    return { ok: false, error: 'CPF ou CNPJ inválido.' }
  }

  const config = getAsaasConfig()
  if (!config) return { ok: false, error: 'Pagamento indisponível no momento.' }

  const city = await getCurrentCity()
  if (!city) return { ok: false, error: 'Cidade não encontrada.' }
  const auth = await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })

  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: input.business_id })
  if (!can) return { ok: false, error: 'Sem permissão.' }

  const { data: biz } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', input.business_id)
    .eq('city_id', city.id)
    .single()
  if (!biz) return { ok: false, error: 'Negócio não encontrado.' }

  // Preço do plano vem do catálogo (business_plans).
  const { data: plan } = await supabase
    .from('business_plans')
    .select('monthly_value_cents, name')
    .eq('slug', PLAN_SLUG)
    .maybeSingle()
  const valueCents = (plan?.monthly_value_cents as number | undefined) ?? 3900
  const planName = (plan?.name as string | undefined) ?? 'Delivery Pro'

  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email ?? undefined
  if (!email) return { ok: false, error: 'Email do usuário não encontrado.' }

  try {
    const customer = await createOrUpdateCustomer(config, {
      name: input.full_name,
      email,
      cpfCnpj: input.cpf_cnpj,
      mobilePhone: input.phone ?? undefined,
      externalReference: `business:${biz.id}`,
    })

    const subscription = await createSubscription(config, {
      customer: customer.id,
      value: valueCents / 100,
      nextDueDate: dueDateFromNow(2),
      cycle: 'MONTHLY',
      billingType: input.billing_type,
      description: `${planName} — ${biz.name}`,
      externalReference: `delivery_pro:${biz.id}`,
    })

    // Guarda o vínculo no negócio (status fica 'pending' até o webhook confirmar).
    const admin = createServiceRoleClient()
    await admin
      .from('businesses')
      .update({
        delivery_asaas_customer_id: customer.id,
        delivery_asaas_subscription_id: subscription.id,
        delivery_subscription_status: 'pending',
      })
      .eq('id', biz.id)

    // Primeira fatura da assinatura → QR PIX imediato para o comerciante pagar.
    let invoiceUrl: string | null = null
    let pixQrCode: string | null = null
    let pixPayload: string | null = null
    const firstPayment = (await listPaymentsForSubscription(config, subscription.id, 1))[0]
    if (firstPayment) {
      invoiceUrl = firstPayment.invoiceUrl ?? null
      if (input.billing_type === 'PIX') {
        const qr = await getPaymentPixQrCode(config, firstPayment.id)
        if (qr) {
          pixQrCode = qr.encodedImage
          pixPayload = qr.payload
        }
      }
      await recordPortalPayment({
        cityId: city.id,
        profileId: auth.profile.id,
        providerPaymentId: firstPayment.id,
        providerSubscriptionId: subscription.id,
        providerCustomerId: customer.id,
        sourceType: 'business_subscription',
        sourceId: biz.id,
        entityType: 'business',
        entityId: biz.id,
        description: `${planName} — ${biz.name}`,
        amountCents: valueCents,
        status: 'pending',
        billingType: input.billing_type,
        invoiceUrl,
        dueDate: firstPayment.dueDate ?? null,
        externalReference: `delivery_pro:${biz.id}`,
      })
    }

    revalidatePath(`/painel/comercio/${biz.id}/delivery`)
    return { ok: true, invoiceUrl, pixQrCode, pixPayload }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Falha ao criar a assinatura.'
    return { ok: false, error: message }
  }
}

export async function cancelProAction(formData: FormData) {
  const businessId = String(formData.get('business_id'))
  z.string().uuid().parse(businessId)

  const city = await getCurrentCity()
  if (!city) throw new Error('cidade não encontrada')
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })

  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: businessId })
  if (!can) throw new Error('sem permissão')

  const admin = createServiceRoleClient()
  const { data: biz } = await admin
    .from('businesses')
    .select('delivery_asaas_subscription_id')
    .eq('id', businessId)
    .single()

  const subId = biz?.delivery_asaas_subscription_id
  const config = getAsaasConfig()
  if (subId && config) {
    await cancelSubscription(config, subId).catch(() => undefined)
  }

  // Mantém o Pro até o fim do período já pago; só marca o status.
  await admin.from('businesses').update({ delivery_subscription_status: 'cancelled' }).eq('id', businessId)
  revalidatePath(`/painel/comercio/${businessId}/delivery`)
}
