'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { finalizeSignupRewards } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { REF_COOKIE_NAME } from '@/lib/referral';

const signUpSchema = z.object({
  full_name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().email('Informe um email valido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  phone: z.string().trim().min(8, 'Informe seu telefone.').max(20),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
  accept_terms: z.boolean().refine((value) => value, 'Aceite os termos para criar sua conta.'),
  consent_marketing: z.coerce.boolean().default(false),
});

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13);
}

export type SignUpActionState = {
  ok: boolean;
  message: string;
};

export async function signUpAction(
  _previousState: SignUpActionState,
  formData: FormData,
): Promise<SignUpActionState> {
  const parsed = signUpSchema.safeParse({
    ...Object.fromEntries(formData),
    accept_terms: formData.get('accept_terms') === 'on',
    consent_marketing: formData.get('consent_marketing') === 'on',
    phone: formData.get('phone') ?? undefined,
    birth_date: formData.get('birth_date') ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  }

  const supabase = await createClient();
  const city = await getCurrentCity();
  const { full_name, email, password, phone, birth_date, consent_marketing } = parsed.data;
  const phoneDigits = normalizePhone(phone);

  if (phoneDigits.length < 8) {
    return { ok: false, message: 'Telefone inválido. Informe DDD + número.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data.user) {
    return { ok: false, message: 'Não foi possível concluir o cadastro. Tente novamente.' };
  }

  if (!data.session) {
    return {
      ok: false,
      message:
        'Confirme o email enviado para concluir o cadastro. Depois, atualize telefone e data de nascimento no painel.',
    };
  }

  if (city) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
        default_city_id: city.id,
        phone: phoneDigits,
        birth_date,
        consent_marketing,
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('[signUpAction] profile update failed', updateError);
      return { ok: false, message: 'Conta criada, mas falhou ao salvar perfil. Acesse o painel para completar.' };
    }

    const cookieStore = await cookies();
    const refCode = cookieStore.get(REF_COOKIE_NAME)?.value;

    try {
      await finalizeSignupRewards({
        profileId: data.user.id,
        cityId: city.id,
        rawReferralCode: refCode,
      });
    } catch (rewardsError) {
      console.error('[signUpAction] finalizeSignupRewards failed', rewardsError);
    }

    if (refCode) {
      cookieStore.delete(REF_COOKIE_NAME);
    }
  }

  redirect('/painel?cadastro=ok');
}
