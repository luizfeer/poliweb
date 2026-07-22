import { type NextRequest, NextResponse } from 'next/server';
import { finalizeSignupRewards, getPanelHome, grantCitizen } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import {
  applyReferralOnSignup,
  OAUTH_SIGNUP_PENDING_COOKIE_NAME,
  REF_COOKIE_MAX_AGE,
  REF_COOKIE_NAME,
} from '@/lib/referral';
import { createClient } from '@/lib/supabase/server';

const FRESH_SIGNUP_WINDOW_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=oauth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/entrar?erro=oauth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const city = await getCurrentCity();

  if (!city || !user) {
    return NextResponse.redirect(`${origin}/painel`);
  }

  try {
    await grantCitizen(city.id);
  } catch {
    // non-blocking
  }

  const isFreshSignup = isFreshUser(user.created_at);
  const refCode = request.cookies.get(REF_COOKIE_NAME)?.value;
  const fullName = getStringMetadata(user.user_metadata, ['full_name', 'name']);
  const avatarUrl = getStringMetadata(user.user_metadata, ['avatar_url', 'picture']);

  await supabase
    .from('profiles')
    .update({
      default_city_id: city.id,
      ...(fullName ? { full_name: fullName } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', user.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, birth_date')
    .eq('id', user.id)
    .maybeSingle();
  const hasSignupBonus = await hasSignupBonusTransaction(user.id, city.id);
  const shouldFinalizeSignup = isFreshSignup || !hasSignupBonus;

  let referralApplied = false;
  if (refCode && shouldFinalizeSignup) {
    try {
      const result = await applyReferralOnSignup({
        rawCode: decodeURIComponent(refCode),
        newProfileId: user.id,
        cityId: city.id,
      });
      referralApplied = result.applied;
      console.log('[auth/callback] referral result', {
        profileId: user.id,
        rawReferralCode: refCode,
        ...result,
      });
    } catch (err) {
      console.error('[auth/callback] applyReferralOnSignup failed', err);
    }
  }

  if (!profile?.phone || !profile.birth_date) {
    const response = NextResponse.redirect(`${origin}/painel/perfil?complete=1`);
    if (shouldFinalizeSignup) {
      response.cookies.set(OAUTH_SIGNUP_PENDING_COOKIE_NAME, '1', {
        maxAge: REF_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }
    if (refCode && (referralApplied || !shouldFinalizeSignup)) {
      response.cookies.delete(REF_COOKIE_NAME);
    }
    return response;
  }

  if (shouldFinalizeSignup) {
    // Referral já foi aplicado acima; passa null pra não tentar de novo (idempotente, mas evita noise no log).
    await finalizeOAuthSignupRewards(user.id, city.id, referralApplied ? undefined : refCode);
  }

  if (next && next.startsWith('/')) {
    const response = NextResponse.redirect(`${origin}${next}`);
    if (refCode) response.cookies.delete(REF_COOKIE_NAME);
    return response;
  }

  const { data: roles } = await supabase
    .from('profile_roles')
    .select('*')
    .eq('profile_id', user.id);

  const panelPath = getPanelHome(roles ?? [], city.id);
  const sep = panelPath.includes('?') ? '&' : '?';
  const response = NextResponse.redirect(`${origin}${panelPath}${sep}login=ok`);
  if (refCode) response.cookies.delete(REF_COOKIE_NAME);
  return response;
}

async function hasSignupBonusTransaction(profileId: string, cityId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('point_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('city_id', cityId)
      .eq('reason', 'signup_bonus');

    return (count ?? 0) > 0;
  } catch {
    return true;
  }
}

async function finalizeOAuthSignupRewards(
  profileId: string,
  cityId: string,
  refCode: string | undefined,
) {
  try {
    await finalizeSignupRewards({
      profileId,
      cityId,
      rawReferralCode: refCode ? decodeURIComponent(refCode) : null,
    });
  } catch {
    // Pontos e indicacao nao devem bloquear login.
  }
}

function isFreshUser(createdAt: string | undefined): boolean {
  if (!createdAt) return false;

  const createdAtMs = Date.parse(createdAt);
  if (!Number.isFinite(createdAtMs)) return false;

  const ageMs = Date.now() - createdAtMs;
  return ageMs >= 0 && ageMs <= FRESH_SIGNUP_WINDOW_MS;
}

function getStringMetadata(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}
