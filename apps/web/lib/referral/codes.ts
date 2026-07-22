import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { awardPoints } from '@/lib/points/award';
import { POINTS } from '@/lib/points/economy';
import { sanitizeReferralCode } from './cookie';

/**
 * Retorna o código de indicação do usuário atual na cidade.
 * Cria um se não existir (idempotente via RPC).
 */
export async function getOrCreateMyReferralCode(
  profileId: string,
  cityId: string,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('generate_referral_code', {
    p_profile_id: profileId,
    p_city_id: cityId,
  });

  if (error || !data) {
    throw new Error(`Falha ao gerar código de indicação: ${error?.message ?? 'desconhecido'}`);
  }

  return data;
}

/**
 * Conta quantas pessoas se cadastraram via meu código.
 */
export async function countMyReferrals(profileId: string, cityId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('referral_conversions')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_profile_id', profileId)
    .eq('city_id', cityId);
  return count ?? 0;
}

/**
 * Aplica o referral durante o signup. Idempotente (UNIQUE em referred_profile_id).
 * Roda com service role pois precisa ler o código de outro usuário (RLS bloqueia).
 *
 * Falha silenciosamente: código inválido, auto-referência ou já convertido = sem ação.
 */
export async function applyReferralOnSignup(args: {
  rawCode: string;
  newProfileId: string;
  cityId: string;
}): Promise<{ applied: boolean; reason?: string }> {
  const code = sanitizeReferralCode(args.rawCode);
  if (!code) {
    console.warn('[applyReferralOnSignup] invalid code format', { rawCode: args.rawCode });
    return { applied: false, reason: 'invalid_code' };
  }

  const supabase = createServiceRoleClient();

  const { data: refRow, error: refErr } = await supabase
    .from('referral_codes')
    .select('profile_id')
    .eq('code', code)
    .eq('city_id', args.cityId)
    .maybeSingle();

  if (refErr) {
    console.error('[applyReferralOnSignup] lookup error', refErr);
    return { applied: false, reason: 'code_not_found' };
  }
  if (!refRow) {
    console.warn('[applyReferralOnSignup] code not found', { code, cityId: args.cityId });
    return { applied: false, reason: 'code_not_found' };
  }
  if (refRow.profile_id === args.newProfileId) {
    return { applied: false, reason: 'self_referral' };
  }

  const { data: conv, error: convErr } = await supabase
    .from('referral_conversions')
    .insert({
      referral_code: code,
      referrer_profile_id: refRow.profile_id,
      referred_profile_id: args.newProfileId,
      city_id: args.cityId,
    })
    .select('id')
    .single();

  if (convErr || !conv) {
    console.warn('[applyReferralOnSignup] conversion insert failed (may already exist)', convErr);
    return { applied: false, reason: 'already_converted' };
  }

  try {
    await Promise.all([
      awardPoints({
        profileId: refRow.profile_id,
        cityId: args.cityId,
        delta: POINTS.referral_earned,
        reason: 'referral_earned',
        referenceId: conv.id,
        useServiceRole: true,
      }),
      awardPoints({
        profileId: args.newProfileId,
        cityId: args.cityId,
        delta: POINTS.referral_received,
        reason: 'referral_received',
        referenceId: conv.id,
        useServiceRole: true,
      }),
    ]);
  } catch (err) {
    console.error('[applyReferralOnSignup] awardPoints failed', err);
    throw err;
  }

  return { applied: true };
}
