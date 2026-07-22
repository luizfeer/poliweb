'use server';

import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { recordPortalPayment } from '@/lib/payments/ledger';
import type { Json } from '@/lib/supabase/database.types';
import {
  AsaasError,
  createOrUpdateCustomer,
  createPayment,
  dueDateFromNow,
  getAsaasConfig,
  getPaymentPixQrCode,
  isValidBrazilianDocument,
  type AsaasBillingType,
} from '@/lib/asaas';

const uuid = z.string().uuid();

const purchaseSchema = z.object({
  city_id: uuid,
  target_type: z.enum(['classified', 'community_group']),
  target_id: uuid,
  plan_slug: z.string().trim().min(2).max(60),
  cpf_cnpj: z.string().trim().min(11).max(20),
  full_name: z.string().trim().min(3).max(160),
  phone: z.string().trim().max(32).optional().transform((value) => value || undefined),
  billing_type: z.enum(['PIX', 'CREDIT_CARD']).default('PIX'),
});

export type PurchaseFeatureResult =
  | {
      ok: true;
      orderId: string;
      paymentId: string;
      invoiceUrl: string | null;
      pixQrCode: string | null;
      pixPayload: string | null;
      pixExpiresAt: string | null;
      amountCents: number;
      durationDays: number;
      billingType: AsaasBillingType;
    }
  | { ok: false; error: string };

type FeaturePlanRow = {
  slug: string;
  name: string;
  amount_cents: number;
  duration_days: number;
  applies_to: string[];
  status: string;
};

async function assertOwnsTarget(
  targetType: 'classified' | 'community_group',
  targetId: string,
  cityId: string,
  profileId: string,
): Promise<void> {
  const supabase = await createClient();
  if (targetType === 'classified') {
    const { data, error } = await supabase
      .from('classifieds')
      .select('id, author_profile_id, city_id, status')
      .eq('id', targetId)
      .eq('city_id', cityId)
      .maybeSingle();
    if (error || !data) throw new Error('Anúncio não encontrado.');
    if (data.author_profile_id !== profileId) throw new Error('Apenas o autor pode destacar este anúncio.');
    if (data.status === 'archived' || data.status === 'rejected') {
      throw new Error('Este anúncio não pode ser destacado no momento.');
    }
    return;
  }

  // community_group: aceita owner ou manager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: owned } = await (supabase.from('community_groups' as any) as any)
    .select('id, owner_profile_id, status')
    .eq('id', targetId)
    .eq('city_id', cityId)
    .eq('owner_profile_id', profileId)
    .maybeSingle();
  if (owned) return;

  const { data: manages } = await supabase.rpc('manages_entity', {
    p_entity_type: 'community_group',
    p_entity_id: targetId,
  });
  if (!manages) throw new Error('Apenas o dono ou administrador pode destacar este grupo.');
}

export async function purchaseFeatureAction(
  _prev: PurchaseFeatureResult | null,
  formData: FormData,
): Promise<PurchaseFeatureResult> {
  try {
    const parsed = purchaseSchema.parse({
      city_id: formData.get('city_id'),
      target_type: formData.get('target_type'),
      target_id: formData.get('target_id'),
      plan_slug: formData.get('plan_slug'),
      cpf_cnpj: formData.get('cpf_cnpj'),
      full_name: formData.get('full_name'),
      phone: formData.get('phone') ?? undefined,
      billing_type: formData.get('billing_type') ?? 'PIX',
    });

    if (!isValidBrazilianDocument(parsed.cpf_cnpj)) {
      return { ok: false, error: 'CPF ou CNPJ inválido.' };
    }

    const config = getAsaasConfig();
    if (!config) {
      return {
        ok: false,
        error: 'Pagamentos não configurados. Defina ASAAS_API_KEY no ambiente.',
      };
    }

    const city = await getCurrentCity();
    if (!city || city.id !== parsed.city_id) {
      return { ok: false, error: 'Cidade inválida.' };
    }

    const auth = await requireProfile();
    await assertOwnsTarget(parsed.target_type, parsed.target_id, parsed.city_id, auth.profile.id);

    const service = createServiceRoleClient();
    const { data: planRow, error: planError } = await service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('feature_plans' as any)
      .select('slug, name, amount_cents, duration_days, applies_to, status')
      .eq('slug', parsed.plan_slug)
      .eq('status', 'active')
      .maybeSingle();
    const plan = (planRow as FeaturePlanRow | null) ?? null;
    if (planError || !plan) {
      return { ok: false, error: 'Plano de destaque indisponível.' };
    }
    if (!plan.applies_to.includes(parsed.target_type)) {
      return { ok: false, error: 'Este plano não se aplica ao item escolhido.' };
    }

    const { data: { user } } = await (await createClient()).auth.getUser();
    const email = user?.email ?? undefined;
    if (!email) return { ok: false, error: 'Email do usuário não encontrado.' };

    const customer = await createOrUpdateCustomer(config, {
      name: parsed.full_name,
      email,
      cpfCnpj: parsed.cpf_cnpj,
      mobilePhone: parsed.phone ?? auth.profile.phone ?? undefined,
      externalReference: `profile:${auth.profile.id}`,
    });

    // Cria a ordem primeiro pra ter id estável usado como externalReference no Asaas.
    const { data: orderInserted, error: insertError } = await service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('feature_orders' as any)
      .insert({
        city_id: parsed.city_id,
        profile_id: auth.profile.id,
        target_type: parsed.target_type,
        target_id: parsed.target_id,
        plan_slug: plan.slug,
        amount_cents: plan.amount_cents,
        duration_days: plan.duration_days,
        status: 'pending',
        billing_type: parsed.billing_type,
        asaas_customer_id: customer.id,
      })
      .select('id')
      .single();

    if (insertError || !orderInserted) {
      return { ok: false, error: 'Não foi possível registrar o pedido.' };
    }
    const order = orderInserted as unknown as { id: string };

    const successPath =
      parsed.target_type === 'community_group'
        ? `/painel/comunidade/grupos/${parsed.target_id}?destaque=sucesso`
        : '/painel/cidadao/classificados?destaque=sucesso';
    const paymentInput = {
      customer: customer.id,
      value: plan.amount_cents / 100,
      dueDate: dueDateFromNow(2),
      billingType: parsed.billing_type,
      description: `${plan.name} - ${parsed.target_type === 'classified' ? 'Classificado' : 'Grupo'}`,
      externalReference: `feature_order:${order.id}`,
      callback: {
        successUrl: new URL(successPath, resolvePublicSiteOrigin()).toString(),
        autoRedirect: true,
      },
    };
    const payment = await createPayment(config, paymentInput).catch(async (error: unknown) => {
      if (
        parsed.billing_type === 'PIX' &&
        error instanceof AsaasError &&
        error.message.toLowerCase().includes('pix')
      ) {
        return createPayment(config, { ...paymentInput, billingType: 'UNDEFINED' });
      }
      throw error;
    });

    let pixQrCode: string | null = null;
    let pixPayload: string | null = null;
    let pixExpiresAt: string | null = null;
    const paymentBillingType = payment.billingType as AsaasBillingType;
    if (paymentBillingType === 'PIX') {
      const qr = await getPaymentPixQrCode(config, payment.id);
      if (qr) {
        pixQrCode = qr.encodedImage;
        pixPayload = qr.payload;
        pixExpiresAt = qr.expirationDate;
      }
    }

    await service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('feature_orders' as any)
      .update({
        asaas_payment_id: payment.id,
        asaas_invoice_url: payment.invoiceUrl,
        asaas_pix_qr_code: pixQrCode,
        asaas_pix_payload: pixPayload,
        asaas_pix_expires_at: pixExpiresAt,
      })
      .eq('id', order.id);

    await recordPortalPayment({
      cityId: parsed.city_id,
      profileId: auth.profile.id,
      providerPaymentId: payment.id,
      providerCustomerId: customer.id,
      sourceType: 'feature_order',
      sourceId: order.id,
      entityType: parsed.target_type,
      entityId: parsed.target_id,
      description: paymentInput.description,
      amountCents: plan.amount_cents,
      netAmountCents: payment.netValue == null ? null : Math.round(payment.netValue * 100),
      status: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? 'paid' : 'pending',
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
      dueDate: payment.dueDate,
      paidAt: payment.paymentDate,
      externalReference: payment.externalReference,
      asaasRaw: payment as unknown as Json,
      metadata: { duration_days: plan.duration_days },
    });

    return {
      ok: true,
      orderId: order.id,
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      pixQrCode,
      pixPayload,
      pixExpiresAt,
      amountCents: plan.amount_cents,
      durationDays: plan.duration_days,
      billingType: paymentBillingType,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: 'Dados inválidos. Confira o formulário.' };
    }
    if (error instanceof AsaasError) {
      return { ok: false, error: `Falha no pagamento: ${error.message}` };
    }
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: 'Erro inesperado ao processar o destaque.' };
  }
}
