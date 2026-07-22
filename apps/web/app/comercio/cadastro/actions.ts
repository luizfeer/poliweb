'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { getProfile } from '@/lib/auth';
import { getBusinessLeadsClient } from '@/lib/business-leads/client';
import { getPlanBySlug } from '@/lib/plans/queries';
import { isValidBrazilianDocument } from '@/lib/asaas';
import { notifyCityAdmins } from '@/lib/notifications';

const nullableString = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length > 0 ? value : null))
  .nullable();

const leadSchema = z.object({
  plan_slug: z.string().trim().min(2, 'Escolha um plano.').max(40),
  business_name: z.string().trim().min(2, 'Informe o nome do comércio.').max(160),
  contact_name: z.string().trim().min(2, 'Informe seu nome completo.').max(160),
  email: z.string().email('Informe um email válido.').max(320),
  phone: z.string().trim().min(8, 'Informe um telefone válido.').max(40),
  document: z
    .string()
    .trim()
    .min(11, 'Informe seu CPF ou CNPJ.')
    .max(20)
    .refine((value) => isValidBrazilianDocument(value), 'CPF ou CNPJ inválido.'),
  whatsapp: nullableString,
  category_hint: nullableString,
  address: nullableString,
  website: nullableString,
  instagram: nullableString,
  message: nullableString,
  consent: z.literal('on', { message: 'É preciso concordar com os termos.' }),
});

export type LeadActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof leadSchema>, string>>;
};

export async function submitBusinessLeadAction(
  _previousState: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const auth = await getProfile();
  if (!auth) {
    redirect('/entrar?next=/comercio/cadastro');
  }

  const city = await getCurrentCity();
  if (!city) {
    return { ok: false, message: 'Cidade atual não encontrada. Tente novamente.' };
  }

  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: LeadActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key as keyof z.infer<typeof leadSchema>] = issue.message;
      }
    }
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Confira os dados do formulário.',
      fieldErrors,
    };
  }

  const plan = await getPlanBySlug(parsed.data.plan_slug);
  if (!plan || plan.status !== 'active') {
    return {
      ok: false,
      message: 'Plano indisponível no momento. Escolha outro.',
      fieldErrors: { plan_slug: 'Plano indisponível.' },
    };
  }

  const supabase = await getBusinessLeadsClient();
  const { data: existing } = await supabase
    .from('business_leads')
    .select('id, status')
    .eq('profile_id', auth.profile.id)
    .eq('city_id', city.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    redirect(`/comercio/cadastro/obrigado?id=${existing.id}`);
  }

  const document = parsed.data.document.replace(/\D/g, '');

  const { data: inserted, error } = await supabase
    .from('business_leads')
    .insert({
      city_id: city.id,
      profile_id: auth.profile.id,
      business_name: parsed.data.business_name,
      contact_name: parsed.data.contact_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      category_hint: parsed.data.category_hint,
      address: parsed.data.address,
      website: parsed.data.website,
      instagram: parsed.data.instagram,
      message: parsed.data.message,
      consent: true,
      status: 'pending',
      plan_slug: plan.slug,
      document,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      message: 'Não foi possível salvar agora. Tente novamente em instantes.',
    };
  }

  try {
    await notifyCityAdmins({
      cityId: city.id,
      type: 'lead.received',
      priority: 'normal',
      title: `Novo lead de comércio: ${parsed.data.business_name}`,
      body: `${parsed.data.contact_name} solicitou cadastro no plano ${plan.name}. Avalie e aprove para liberar o trial de 30 dias.`,
      targetUrl: '/painel/cidade/comercio/leads?status=pending',
      entityType: 'business_lead',
      entityId: inserted.id,
      sendEmail: false,
    });
  } catch (notifyError) {
    console.error('[business_lead] notifyCityAdmins falhou', notifyError);
  }

  revalidatePath('/painel/cidade/comercio/leads');
  redirect(`/comercio/cadastro/obrigado?id=${inserted.id}`);
}
