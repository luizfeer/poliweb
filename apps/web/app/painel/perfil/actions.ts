'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { finalizeSignupRewards, requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { OAUTH_SIGNUP_PENDING_COOKIE_NAME, REF_COOKIE_NAME } from '@/lib/referral';
import { createClient } from '@/lib/supabase/server';

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().min(10, 'Informe DDD + número.').max(13)),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
  bio: z.string().max(1000).nullable(),
  consent_marketing: z.coerce.boolean().default(false),
});

function nullableString(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : null;
}

export type ProfileActionState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const auth = await requireProfile();

  const result = updateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: String(formData.get('phone') ?? ''),
    birth_date: String(formData.get('birth_date') ?? '').trim(),
    bio: nullableString(formData.get('bio')),
    consent_marketing: formData.get('consent_marketing') === 'on',
  });

  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const wasIncomplete = !auth.profile.phone || !auth.profile.birth_date;

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(result.data).eq('id', auth.profile.id);

  if (error) {
    console.error('[updateProfileAction] failed', {
      profileId: auth.profile.id,
      payload: result.data,
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });
    const debug = `[${error.code ?? '??'}] ${error.message}${error.details ? ` — ${error.details}` : ''}`;
    return {
      ok: false,
      message:
        process.env.NODE_ENV === 'production' ? 'Erro ao salvar. Tente novamente.' : debug,
    };
  }

  const [city, cookieStore] = await Promise.all([getCurrentCity(), cookies()]);
  const hasPendingOAuthSignup = cookieStore.get(OAUTH_SIGNUP_PENDING_COOKIE_NAME)?.value === '1';
  const refCode = cookieStore.get(REF_COOKIE_NAME)?.value;

  // Roda recompensas se:
  //  - veio do fluxo OAuth pendente (cookie marcador), OU
  //  - existe cookie ref_code (referral é separado do signup_bonus, ambos idempotentes).
  if (city && (hasPendingOAuthSignup || refCode)) {
    try {
      await finalizeSignupRewards({
        profileId: auth.profile.id,
        cityId: city.id,
        rawReferralCode: refCode,
      });
    } catch (rewardsError) {
      console.error('[updateProfileAction] finalizeSignupRewards failed', rewardsError);
    }

    if (hasPendingOAuthSignup) cookieStore.delete(OAUTH_SIGNUP_PENDING_COOKIE_NAME);
    if (refCode) cookieStore.delete(REF_COOKIE_NAME);
  }

  revalidatePath('/painel');
  revalidatePath('/painel/perfil');

  if (wasIncomplete) {
    redirect('/painel?cadastro=ok');
  }

  return { ok: true, message: 'Perfil salvo com sucesso.' };
}

export async function exportMyDataAction() {
  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from('newsletter_consent_history').insert({
    city_id: city.id,
    email: userData.user?.email ?? auth.profile.id,
    event: 'export',
    source: 'painel_perfil',
    consent_text_version: '2026-05-01',
  });
  redirect('/painel/perfil/privacidade?export=solicitado');
}

const deletionRequestSchema = z.object({
  reason: z.string().max(1000).nullable(),
});

export async function requestAccountDeletionAction(formData: FormData) {
  await requireProfile();
  const { reason } = deletionRequestSchema.parse({
    reason: nullableString(formData.get('reason')),
  });

  const supabase = await createClient();
  const { error } = await supabase.rpc('request_account_deletion', { p_reason: reason ?? '' });

  if (error) {
    const code =
      error.message?.includes('pending_request_exists')
        ? 'pendente'
        : 'erro';
    redirect(`/painel/perfil/privacidade?delete=${code}`);
  }

  revalidatePath('/painel/perfil/privacidade');
  redirect('/painel/perfil/privacidade?delete=solicitado');
}

export async function cancelAccountDeletionAction(formData: FormData) {
  await requireProfile();
  const requestId = z.string().uuid().parse(formData.get('request_id'));

  const supabase = await createClient();
  await supabase.rpc('cancel_account_deletion', { p_request_id: requestId });

  revalidatePath('/painel/perfil/privacidade');
  redirect('/painel/perfil/privacidade?delete=cancelado');
}
