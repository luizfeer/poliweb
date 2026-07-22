// Helpers de plano de delivery (free | pro) + estado do teste de 30 dias.
// Pro/trial libera pedidos nativos, bot, app e relatórios. Free usa wa.me.

import { createClient } from '@/lib/supabase/server'

export type DeliveryPlanState = {
  plan: 'free' | 'pro'
  isPro: boolean // pro OU trial ainda válido
  inTrial: boolean
  trialEndsAt: string | null
  trialUsed: boolean
  trialDaysLeft: number | null
  /** Status da assinatura Asaas: null (sem assinatura) | pending | active | overdue | cancelled. */
  subscriptionStatus: string | null
  hasSubscription: boolean
}

export async function getDeliveryPlan(businessId: string): Promise<DeliveryPlanState> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select(
      'delivery_plan, delivery_trial_started_at, delivery_trial_ends_at, delivery_subscription_status, delivery_asaas_subscription_id',
    )
    .eq('id', businessId)
    .single()

  const plan = (data?.delivery_plan ?? 'free') as 'free' | 'pro'
  const endsAt = data?.delivery_trial_ends_at ?? null
  const trialActive = endsAt != null && new Date(endsAt).getTime() > Date.now()
  const isPro = plan === 'pro' || trialActive
  const trialDaysLeft = trialActive
    ? Math.max(0, Math.ceil((new Date(endsAt!).getTime() - Date.now()) / 86_400_000))
    : null

  return {
    plan,
    isPro,
    inTrial: trialActive,
    trialEndsAt: endsAt,
    trialUsed: data?.delivery_trial_started_at != null,
    trialDaysLeft,
    subscriptionStatus: data?.delivery_subscription_status ?? null,
    hasSubscription: data?.delivery_asaas_subscription_id != null,
  }
}
