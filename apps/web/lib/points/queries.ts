import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { PointReason } from './economy';

export type PointsBalance = {
  balance: number;
  lifetimeEarned: number;
  updatedAt: string | null;
};

export type PointTransaction = {
  id: string;
  delta: number;
  reason: PointReason;
  referenceId: string | null;
  balanceAfter: number;
  createdAt: string;
};

export async function getMyBalance(cityId: string): Promise<PointsBalance> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { balance: 0, lifetimeEarned: 0, updatedAt: null };
  }

  const { data } = await supabase
    .from('citizen_points')
    .select('balance, lifetime_earned, updated_at')
    .eq('city_id', cityId)
    .eq('profile_id', user.id)
    .maybeSingle();

  return {
    balance: data?.balance ?? 0,
    lifetimeEarned: data?.lifetime_earned ?? 0,
    updatedAt: data?.updated_at ?? null,
  };
}

export async function getMyTransactions(
  cityId: string,
  options?: { limit?: number; offset?: number },
): Promise<{ items: PointTransaction[]; total: number }> {
  const limit = options?.limit ?? 30;
  const offset = options?.offset ?? 0;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], total: 0 };
  }

  const { data, count } = await supabase
    .from('point_transactions')
    .select('id, delta, reason, reference_id, balance_after, created_at', { count: 'exact' })
    .eq('city_id', cityId)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const rows = data ?? [];

  return {
    items: rows.map((row) => ({
      id: row.id,
      delta: row.delta,
      reason: row.reason as PointReason,
      referenceId: row.reference_id,
      balanceAfter: row.balance_after,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
  };
}
