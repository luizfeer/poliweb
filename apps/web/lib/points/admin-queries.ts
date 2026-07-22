import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

type PointTransactionRow = Database['public']['Tables']['point_transactions']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Resumo agregado da economia de pontos de uma cidade.
 */
export type PointsSummary = {
  totalCitizensWithBalance: number;
  totalBalanceInCirculation: number;
  totalLifetimeEarned: number;
  totalReferralConversions: number;
  totalRaffleEntries: number;
};

/**
 * Um cidadão no ranking de pontos.
 */
export type CitizenPointsRank = {
  profileId: string;
  name: string;
  balance: number;
  lifetimeEarned: number;
  referralConversionsCount: number;
};

/**
 * Uma transação de pontos recente com nome do usuário.
 */
export type RecentPointTransaction = {
  id: string;
  profileId: string;
  name: string;
  delta: number;
  reason: string;
  createdAt: string;
};

/**
 * Resumo agregado: count de cidadãos, sum de saldos, lifetime, referrals, raffle entries.
 */
export async function getCityPointsSummary(cityId: string): Promise<PointsSummary> {
  const supabase = await createClient();

  // Resumo de citizen_points
  const { data: summaryData } = await supabase
    .from('citizen_points')
    .select('balance, lifetime_earned', { count: 'exact' })
    .eq('city_id', cityId)
    .gt('balance', 0); // Apenas cidadãos com saldo > 0

  const citizensCount = summaryData?.length ?? 0;
  const totalBalance = (summaryData ?? []).reduce((sum, row) => sum + (row.balance ?? 0), 0);
  const totalLifetime = (summaryData ?? []).reduce((sum, row) => sum + (row.lifetime_earned ?? 0), 0);

  // Count de referral_conversions
  const { count: referralsCount } = await supabase
    .from('referral_conversions')
    .select('id', { count: 'exact', head: true })
    .eq('city_id', cityId);

  // Count de raffle_entries
  const { count: raffleEntriesCount } = await supabase
    .from('raffle_entries')
    .select('id', { count: 'exact', head: true })
    .eq('city_id', cityId);

  return {
    totalCitizensWithBalance: citizensCount,
    totalBalanceInCirculation: totalBalance,
    totalLifetimeEarned: totalLifetime,
    totalReferralConversions: referralsCount ?? 0,
    totalRaffleEntries: raffleEntriesCount ?? 0,
  };
}

/**
 * Top N cidadãos por saldo, com contagem de indicações.
 */
export async function getTopCitizensByBalance(
  cityId: string,
  limit = 50,
): Promise<CitizenPointsRank[]> {
  const supabase = await createClient();

  // Busca top por balance
  const { data: pointsData } = await supabase
    .from('citizen_points')
    .select('profile_id, balance, lifetime_earned')
    .eq('city_id', cityId)
    .order('balance', { ascending: false })
    .limit(limit);

  if (!pointsData || pointsData.length === 0) return [];

  const profileIds = pointsData.map((p) => p.profile_id);

  // Busca nomes dos profiles em batch
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', profileIds);

  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // Busca count de referrals por profile
  const { data: referralCounts } = await supabase
    .from('referral_conversions')
    .select('referrer_profile_id', { count: 'exact' })
    .eq('city_id', cityId)
    .in('referrer_profile_id', profileIds);

  const referralsByProfile = new Map<string, number>();
  if (referralCounts) {
    // Agrupa manualmente (o count: 'exact' retorna count total, não por grupo)
    // Vamos fazer queries individuais ou uma query com GROUP BY
    // Por enquanto, vamos fazer requests em lote com RPC ou raw SQL
    // Alternativa: fazer para cada profile
    for (const profileId of profileIds) {
      const { count } = await supabase
        .from('referral_conversions')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', cityId)
        .eq('referrer_profile_id', profileId);

      referralsByProfile.set(profileId, count ?? 0);
    }
  }

  return pointsData.map((p) => ({
    profileId: p.profile_id,
    name: profilesById.get(p.profile_id) ?? 'Cidadão',
    balance: p.balance ?? 0,
    lifetimeEarned: p.lifetime_earned ?? 0,
    referralConversionsCount: referralsByProfile.get(p.profile_id) ?? 0,
  }));
}

/**
 * Transações recentes de pontos com nomes de usuários.
 */
export async function getRecentTransactions(
  cityId: string,
  limit = 30,
): Promise<RecentPointTransaction[]> {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('id, profile_id, delta, reason, created_at')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!transactions || transactions.length === 0) return [];

  const profileIds = [...new Set(transactions.map((t) => t.profile_id))];

  // Busca nomes em batch
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', profileIds);

  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // Mapeamento de reason para label PT-BR
  const reasonLabels: Record<string, string> = {
    signup_bonus: 'Bônus de boas-vindas',
    referral_earned: 'Indicou alguém que se cadastrou',
    referral_received: 'Foi indicado e se cadastrou',
    classified_posted: 'Classificado publicado',
    event_submitted: 'Evento submetido',
    lost_found_resolved: 'Achado/Perdido resolvido',
    review_written: 'Avaliação escrita',
    raffle_entry: 'Entrada em sorteio',
    admin_adjustment: 'Ajuste do administrador',
  };

  return transactions.map((t) => ({
    id: t.id,
    profileId: t.profile_id,
    name: profilesById.get(t.profile_id) ?? 'Cidadão',
    delta: t.delta ?? 0,
    reason: reasonLabels[t.reason as string] ?? t.reason,
    createdAt: t.created_at ?? '',
  }));
}
