import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import type { PointReason } from './economy';

type AwardArgs = {
  profileId: string;
  cityId: string;
  delta: number;
  reason: PointReason;
  referenceId?: string | null;
  /** Use true em fluxos onde o caller não é o `profileId` (ex: signup awards referrer). */
  useServiceRole?: boolean;
};

/**
 * Crédita ou debita pontos atomicamente.
 * Wrapper sobre a RPC `award_points` (SECURITY DEFINER + audit em point_transactions).
 *
 * @returns saldo final após a operação
 */
export async function awardPoints(args: AwardArgs): Promise<number> {
  const { profileId, cityId, delta, reason, referenceId, useServiceRole } = args;

  if (delta === 0) return 0;

  const supabase = useServiceRole ? createServiceRoleClient() : await createClient();

  const { data, error } = await supabase.rpc('award_points', {
    p_profile_id: profileId,
    p_city_id: cityId,
    p_delta: delta,
    p_reason: reason,
    p_reference: referenceId ?? undefined,
  });

  if (error) {
    throw new Error(`Falha ao registrar pontos: ${error.message}`);
  }

  return data ?? 0;
}
