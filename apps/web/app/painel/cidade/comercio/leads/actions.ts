'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getBusinessLeadsClient } from '@/lib/business-leads/client';
import { getPlanBySlug } from '@/lib/plans/queries';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';
import {
  AsaasError,
  cancelSubscription,
  createOrUpdateCustomer,
  createSubscription,
  getAsaasConfig,
  trialEndDateFromNow,
  updateSubscription,
} from '@/lib/asaas';
import type { Json } from '@/lib/supabase/database.types';

const TRIAL_DAYS = 30;

function asaasSubscriptionReturnCallback(leadId: string) {
  return {
    successUrl: new URL(
      `/painel/comercio/assinatura?pagamento=sucesso&lead=${leadId}`,
      resolvePublicSiteOrigin(),
    ).toString(),
    autoRedirect: true,
  };
}

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null))
    .nullable()
    .optional();

const approveSchema = z.object({
  lead_id: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífen.'),
  category_id: z.string().uuid('Selecione uma categoria.'),
  short_description: optionalString(160),
  description: optionalString(4000),
  phone: optionalString(40),
  whatsapp: optionalString(40),
  email: z
    .string()
    .trim()
    .max(320)
    .email('Email inválido.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  website: optionalString(500),
  instagram: optionalString(500),
  address: optionalString(500),
});

export type ApproveLeadActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof approveSchema>, string>>;
};

async function insertAudit(action: string, cityId: string, entityId: string, diff: Json) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    city_id: cityId,
    action,
    entity_type: 'business_lead',
    entity_id: entityId,
    diff,
  });
}

export async function approveLeadAndCreateBusinessAction(
  _previousState: ApproveLeadActionState,
  formData: FormData,
): Promise<ApproveLeadActionState> {
  const city = await getCurrentCity();
  if (!city) {
    return { ok: false, message: 'Cidade atual não encontrada.' };
  }
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = approveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: ApproveLeadActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key as keyof z.infer<typeof approveSchema>] = issue.message;
      }
    }
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Confira os dados do formulário.',
      fieldErrors,
    };
  }

  const input = parsed.data;
  const leadsClient = await getBusinessLeadsClient();
  const { data: lead, error: loadError } = await leadsClient
    .from('business_leads')
    .select('*')
    .eq('id', input.lead_id)
    .eq('city_id', city.id)
    .single();
  if (loadError || !lead) {
    return { ok: false, message: 'Lead não encontrado.' };
  }
  if (lead.status !== 'pending') {
    return { ok: false, message: 'Este lead não está mais pendente.' };
  }

  const service = createServiceRoleClient();

  const { data: slugCollision } = await service
    .from('businesses')
    .select('id')
    .eq('city_id', city.id)
    .eq('slug', input.slug)
    .maybeSingle();
  if (slugCollision) {
    return {
      ok: false,
      message: 'Já existe uma ficha com esse slug nesta cidade.',
      fieldErrors: { slug: 'Slug já utilizado — escolha outro.' },
    };
  }

  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: business, error: businessError } = await service
    .from('businesses')
    .insert({
      city_id: city.id,
      slug: input.slug,
      name: input.name,
      short_description: input.short_description,
      description: input.description,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email ?? null,
      website: input.website,
      instagram: input.instagram,
      address: input.address,
      owner_profile_id: lead.profile_id,
      claimed: true,
      verified: false,
      status: 'published',
      published_at: now,
      plan: lead.plan_slug,
    })
    .select('id')
    .single();

  if (businessError || !business) {
    console.error('[approveLead] business insert failed', businessError);
    return { ok: false, message: 'Falha ao criar a ficha. Tente novamente.' };
  }

  const { error: categoryError } = await service.from('business_category_assignments').insert({
    business_id: business.id,
    category_id: input.category_id,
    is_primary: true,
  });
  if (categoryError) {
    console.error('[approveLead] category assignment failed', categoryError);
  }

  const { data: existingRole } = await service
    .from('profile_roles')
    .select('id')
    .eq('profile_id', lead.profile_id)
    .eq('city_id', city.id)
    .eq('role', 'merchant')
    .maybeSingle();
  if (!existingRole) {
    const { error: roleError } = await service.from('profile_roles').insert({
      profile_id: lead.profile_id,
      city_id: city.id,
      role: 'merchant',
      granted_by: auth.profile.id,
    });
    if (roleError) {
      console.error('[approveLead] role grant failed', roleError);
    }
  }

  let asaasCustomerId = lead.asaas_customer_id;
  let asaasSubscriptionId = lead.asaas_subscription_id;
  let asaasSubscriptionStatus = lead.asaas_subscription_status;
  let asaasNote: string | null = null;
  const nextDueDate = trialEndDateFromNow(TRIAL_DAYS);

  const plan = lead.plan_slug ? await getPlanBySlug(lead.plan_slug) : null;
  const config = getAsaasConfig();

  if (!plan) {
    asaasNote = 'Lead sem plano selecionado — assinatura ASAAS não criada.';
  } else if (!config) {
    asaasNote = 'ASAAS_API_KEY não configurada — assinatura não criada agora.';
  } else if (!lead.document) {
    asaasNote = 'Lead sem CPF/CNPJ — assinatura ASAAS não criada.';
  } else if (!asaasSubscriptionId) {
    try {
      const customer = await createOrUpdateCustomer(config, {
        name: lead.contact_name,
        email: lead.email,
        cpfCnpj: lead.document,
        mobilePhone: lead.whatsapp ?? lead.phone,
        phone: lead.phone,
        externalReference: `lead:${lead.id}`,
      });
      asaasCustomerId = customer.id;

      const subscription = await createSubscription(config, {
        customer: customer.id,
        value: plan.monthlyValueCents / 100,
        nextDueDate,
        cycle: 'MONTHLY',
        billingType: 'UNDEFINED',
        description: `Portal Carmelitano — ${plan.name} (${input.name})`,
        externalReference: `lead:${lead.id}`,
        callback: asaasSubscriptionReturnCallback(lead.id),
      });
      asaasSubscriptionId = subscription.id;
      asaasSubscriptionStatus = subscription.status;
    } catch (caught) {
      if (caught instanceof AsaasError) {
        asaasNote = `Falha ASAAS (${caught.status}): ${caught.message}`;
      } else {
        asaasNote = caught instanceof Error ? caught.message : 'Erro desconhecido no ASAAS.';
      }
    }
  }

  const { error: updateError } = await leadsClient
    .from('business_leads')
    .update({
      status: 'approved',
      approved_at: now,
      approved_by: auth.profile.id,
      trial_ends_at: trialEndsAt,
      rejected_reason: null,
      business_id: business.id,
      asaas_customer_id: asaasCustomerId,
      asaas_subscription_id: asaasSubscriptionId,
      asaas_subscription_status: asaasSubscriptionStatus,
      asaas_next_due_date: asaasSubscriptionId ? nextDueDate : null,
      notes: asaasNote ?? lead.notes,
    })
    .eq('id', input.lead_id)
    .eq('city_id', city.id);
  if (updateError) {
    console.error('[approveLead] lead update failed', updateError);
    return { ok: false, message: 'Ficha criada, mas o lead não atualizou. Verifique a fila.' };
  }

  await insertAudit('business_lead.approve', city.id, input.lead_id, {
    business_id: business.id,
    trial_ends_at: trialEndsAt,
    asaas_customer_id: asaasCustomerId,
    asaas_subscription_id: asaasSubscriptionId,
    asaas_note: asaasNote,
  });

  revalidatePath('/painel/cidade/comercio/leads');
  revalidatePath('/painel/cidade/comercio');
  revalidatePath('/painel/comercio');
  redirect(`/painel/cidade/comercio/leads?status=approved`);
}

async function loadLead(leadId: string, cityId: string) {
  const supabase = await getBusinessLeadsClient();
  const { data, error } = await supabase
    .from('business_leads')
    .select('*')
    .eq('id', leadId)
    .eq('city_id', cityId)
    .single();
  if (error || !data) throw error ?? new Error('Lead não encontrado.');
  return { supabase, lead: data };
}

export async function grantFreeSubscriptionAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      lead_id: z.string().uuid(),
      reason: z.string().trim().max(500).optional(),
    })
    .parse({
      lead_id: formData.get('lead_id'),
      reason: formData.get('reason') ?? undefined,
    });

  const { supabase, lead } = await loadLead(parsed.lead_id, city.id);

  let cancelNote: string | null = null;
  const config = getAsaasConfig();
  if (config && lead.asaas_subscription_id) {
    try {
      await cancelSubscription(config, lead.asaas_subscription_id);
    } catch (caught) {
      cancelNote = caught instanceof AsaasError ? caught.message : 'Falha ao cancelar no ASAAS.';
    }
  }

  const { error } = await supabase
    .from('business_leads')
    .update({
      status: 'converted',
      free_forever: true,
      free_reason: parsed.reason ?? null,
      asaas_subscription_status: 'CANCELLED',
      asaas_next_due_date: null,
      notes: cancelNote ?? lead.notes,
    })
    .eq('id', parsed.lead_id)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business_lead.grant_free', city.id, parsed.lead_id, {
    reason: parsed.reason ?? null,
    asaas_subscription_id: lead.asaas_subscription_id,
    cancel_note: cancelNote,
  });
  revalidatePath('/painel/cidade/comercio/leads');
  revalidatePath('/painel/comercio/assinatura');
}

export async function retryAsaasSubscriptionAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const leadId = z.string().uuid().parse(formData.get('lead_id'));
  const { supabase, lead } = await loadLead(leadId, city.id);

  if (lead.free_forever) return;
  if (lead.asaas_subscription_id) return;
  if (!lead.plan_slug || !lead.document) {
    await supabase
      .from('business_leads')
      .update({ notes: 'Lead sem plano ou CNPJ/CPF — não é possível criar assinatura.' })
      .eq('id', leadId)
      .eq('city_id', city.id);
    return;
  }

  const plan = await getPlanBySlug(lead.plan_slug);
  if (!plan) return;
  const config = getAsaasConfig();
  if (!config) {
    await supabase
      .from('business_leads')
      .update({ notes: 'ASAAS_API_KEY não configurada.' })
      .eq('id', leadId)
      .eq('city_id', city.id);
    return;
  }

  const trialBaselineMs = lead.trial_ends_at ? new Date(lead.trial_ends_at).getTime() : Date.now() + TRIAL_DAYS * 86400_000;
  const remainingDays = Math.max(1, Math.ceil((trialBaselineMs - Date.now()) / 86400_000));
  const nextDueDate = trialEndDateFromNow(remainingDays);

  try {
    const customer = await createOrUpdateCustomer(config, {
      name: lead.contact_name,
      email: lead.email,
      cpfCnpj: lead.document,
      mobilePhone: lead.whatsapp ?? lead.phone,
      phone: lead.phone,
      externalReference: `lead:${lead.id}`,
    });
    const subscription = await createSubscription(config, {
      customer: customer.id,
      value: plan.monthlyValueCents / 100,
      nextDueDate,
      cycle: 'MONTHLY',
      billingType: 'UNDEFINED',
      description: `Portal Carmelitano — ${plan.name} (${lead.business_name})`,
      externalReference: `lead:${lead.id}`,
      callback: asaasSubscriptionReturnCallback(lead.id),
    });
    const { error } = await supabase
      .from('business_leads')
      .update({
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
        asaas_subscription_status: subscription.status,
        asaas_next_due_date: nextDueDate,
        notes: null,
      })
      .eq('id', leadId)
      .eq('city_id', city.id);
    if (error) throw error;
    await insertAudit('business_lead.asaas_retry', city.id, leadId, {
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription.id,
      next_due_date: nextDueDate,
    });
  } catch (caught) {
    const message = caught instanceof AsaasError ? caught.message : caught instanceof Error ? caught.message : 'Erro desconhecido.';
    await supabase
      .from('business_leads')
      .update({ notes: `Falha ASAAS: ${message}` })
      .eq('id', leadId)
      .eq('city_id', city.id);
  }
  revalidatePath('/painel/cidade/comercio/leads');
  revalidatePath('/painel/comercio/assinatura');
}

export async function cancelAsaasSubscriptionAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const leadId = z.string().uuid().parse(formData.get('lead_id'));
  const { supabase, lead } = await loadLead(leadId, city.id);
  if (!lead.asaas_subscription_id) return;

  const config = getAsaasConfig();
  let note: string | null = null;
  if (config) {
    try {
      await cancelSubscription(config, lead.asaas_subscription_id);
    } catch (caught) {
      note = caught instanceof AsaasError ? caught.message : 'Falha ao cancelar no ASAAS.';
    }
  } else {
    note = 'ASAAS_API_KEY não configurada — cancelamento só local.';
  }

  const { error } = await supabase
    .from('business_leads')
    .update({
      asaas_subscription_status: 'CANCELLED',
      asaas_next_due_date: null,
      notes: note ?? lead.notes,
    })
    .eq('id', leadId)
    .eq('city_id', city.id);
  if (error) throw error;
  await insertAudit('business_lead.asaas_cancel', city.id, leadId, {
    asaas_subscription_id: lead.asaas_subscription_id,
    note,
  });
  revalidatePath('/painel/cidade/comercio/leads');
  revalidatePath('/painel/comercio/assinatura');
}

export async function changeLeadPlanAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      lead_id: z.string().uuid(),
      plan_slug: z.string().min(2).max(40),
    })
    .parse({
      lead_id: formData.get('lead_id'),
      plan_slug: formData.get('plan_slug'),
    });

  const plan = await getPlanBySlug(parsed.plan_slug);
  if (!plan || plan.status !== 'active') return;
  const { supabase, lead } = await loadLead(parsed.lead_id, city.id);

  let note: string | null = null;
  const config = getAsaasConfig();
  if (config && lead.asaas_subscription_id) {
    try {
      const updated = await updateSubscription(config, lead.asaas_subscription_id, {
        value: plan.monthlyValueCents / 100,
        description: `Portal Carmelitano — ${plan.name} (${lead.business_name})`,
        updatePendingPayments: true,
      });
      await supabase
        .from('business_leads')
        .update({
          plan_slug: plan.slug,
          asaas_subscription_status: updated.status,
        })
        .eq('id', parsed.lead_id)
        .eq('city_id', city.id);
    } catch (caught) {
      note = caught instanceof AsaasError ? caught.message : 'Falha ao atualizar valor no ASAAS.';
      await supabase
        .from('business_leads')
        .update({ plan_slug: plan.slug, notes: note })
        .eq('id', parsed.lead_id)
        .eq('city_id', city.id);
    }
  } else {
    await supabase
      .from('business_leads')
      .update({ plan_slug: plan.slug })
      .eq('id', parsed.lead_id)
      .eq('city_id', city.id);
  }

  await insertAudit('business_lead.change_plan', city.id, parsed.lead_id, {
    from: lead.plan_slug,
    to: plan.slug,
    note,
  });
  revalidatePath('/painel/cidade/comercio/leads');
  revalidatePath('/painel/comercio/assinatura');
}

export async function rejectBusinessLeadAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      lead_id: z.string().uuid(),
      reason: z.string().trim().max(500).optional(),
    })
    .parse({
      lead_id: formData.get('lead_id'),
      reason: formData.get('reason') ?? undefined,
    });

  const supabase = await getBusinessLeadsClient();
  const { error } = await supabase
    .from('business_leads')
    .update({
      status: 'rejected',
      rejected_reason: parsed.reason ?? null,
    })
    .eq('id', parsed.lead_id)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business_lead.reject', city.id, parsed.lead_id, {
    reason: parsed.reason ?? null,
  });
  revalidatePath('/painel/cidade/comercio/leads');
}
