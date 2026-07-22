import 'server-only';

import { awardPoints } from '@/lib/points/award';
import { POINTS } from '@/lib/points/economy';
import { applyReferralOnSignup } from '@/lib/referral';
import { createServiceRoleClient } from '@/lib/supabase/service';

type FinalizeSignupRewardsArgs = {
  profileId: string;
  cityId: string;
  rawReferralCode?: string | null;
};

export async function finalizeSignupRewards({
  profileId,
  cityId,
  rawReferralCode,
}: FinalizeSignupRewardsArgs): Promise<void> {
  const supabase = createServiceRoleClient();

  const { count, error: countError } = await supabase
    .from('point_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('city_id', cityId)
    .eq('reason', 'signup_bonus');

  if (countError) {
    console.error('[finalizeSignupRewards] count signup_bonus failed', countError);
  }

  if ((count ?? 0) === 0) {
    try {
      const balance = await awardPoints({
        profileId,
        cityId,
        delta: POINTS.signup_bonus,
        reason: 'signup_bonus',
        useServiceRole: true,
      });
      console.log('[finalizeSignupRewards] signup_bonus awarded', { profileId, balance });
    } catch (err) {
      console.error('[finalizeSignupRewards] signup_bonus failed', err);
    }
  } else {
    console.log('[finalizeSignupRewards] signup_bonus already exists, skipping', { profileId });
  }

  if (rawReferralCode) {
    const result = await applyReferralOnSignup({
      rawCode: rawReferralCode,
      newProfileId: profileId,
      cityId,
    });
    console.log('[finalizeSignupRewards] referral result', {
      profileId,
      rawReferralCode,
      ...result,
    });
  } else {
    console.log('[finalizeSignupRewards] no referral code present', { profileId });
  }
}
