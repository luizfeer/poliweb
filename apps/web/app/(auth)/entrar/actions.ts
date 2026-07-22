'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { getPanelHome } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { resolvePublicSiteOrigin } from '@/lib/seo/site-origin';

const signInSchema = z.object({
  email: z.string().email('Informe um email válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

const emailSchema = z.object({
  email: z.string().email('Informe um email válido.'),
});

export type AuthActionState = {
  ok: boolean;
  message: string;
};

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: 'Email ou senha inválidos.' };
  }

  const city = await getCurrentCity();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!city || !user) {
    redirect('/painel');
  }

  const { data: roles } = await supabase.from('profile_roles').select('*').eq('profile_id', user.id);
  const panelPath = getPanelHome(roles ?? [], city.id);
  const sep = panelPath.includes('?') ? '&' : '?';
  redirect(`${panelPath}${sep}login=ok`);
}

export async function signInWithMagicLinkAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  return {
    ok: false,
    message: 'Magic link fica para pós-MVP. Use email e senha por enquanto.',
  };
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const origin = resolvePublicSiteOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data?.url) {
    redirect('/entrar?erro=oauth');
  }

  redirect(data.url);
}
