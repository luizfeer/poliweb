import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

type RaffleRow = Database['public']['Tables']['raffles']['Row'];
type RaffleEntryRow = Database['public']['Tables']['raffle_entries']['Row'];
type RaffleStatus = RaffleRow['status'];

export type RaffleSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prizeDescription: string;
  prizeValueCents: number | null;
  coverUrl: string | null;
  entryCostPoints: number;
  maxEntriesPerProfile: number;
  drawAt: string;
  drawnAt: string | null;
  winnerProfileId: string | null;
  status: RaffleStatus;
  sponsorBusinessId: string | null;
};

function rowToSummary(row: RaffleRow): RaffleSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    prizeDescription: row.prize_description,
    prizeValueCents: row.prize_value_cents,
    coverUrl: row.cover_url,
    entryCostPoints: row.entry_cost_points,
    maxEntriesPerProfile: row.max_entries_per_profile,
    drawAt: row.draw_at,
    drawnAt: row.drawn_at,
    winnerProfileId: row.winner_profile_id,
    status: row.status,
    sponsorBusinessId: row.sponsor_business_id,
  };
}

export async function listActiveRaffles(cityId: string): Promise<RaffleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffles')
    .select('*')
    .eq('city_id', cityId)
    .eq('status', 'active')
    .order('draw_at', { ascending: true });
  return (data ?? []).map(rowToSummary);
}

export async function listEndedRaffles(cityId: string, limit = 10): Promise<RaffleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffles')
    .select('*')
    .eq('city_id', cityId)
    .eq('status', 'drawn')
    .order('drawn_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(rowToSummary);
}

export async function getRaffleBySlug(cityId: string, slug: string): Promise<RaffleSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffles')
    .select('*')
    .eq('city_id', cityId)
    .eq('slug', slug)
    .maybeSingle();
  return data ? rowToSummary(data) : null;
}

export async function getRaffleById(cityId: string, id: string): Promise<RaffleSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffles')
    .select('*')
    .eq('city_id', cityId)
    .eq('id', id)
    .maybeSingle();
  return data ? rowToSummary(data) : null;
}

export async function getMyEntriesCount(raffleId: string, profileId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffle_entries')
    .select('entries_count')
    .eq('raffle_id', raffleId)
    .eq('profile_id', profileId);
  return (data ?? []).reduce((sum, row) => sum + row.entries_count, 0);
}

export async function getRaffleStats(raffleId: string): Promise<{
  totalEntries: number;
  uniqueProfiles: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffle_entries')
    .select('profile_id, entries_count')
    .eq('raffle_id', raffleId);

  const rows = data ?? [];
  const totalEntries = rows.reduce((sum, r) => sum + r.entries_count, 0);
  const uniqueProfiles = new Set(rows.map((r) => r.profile_id)).size;
  return { totalEntries, uniqueProfiles };
}

export async function listAllRafflesForAdmin(cityId: string): Promise<RaffleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('raffles')
    .select('*')
    .eq('city_id', cityId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(rowToSummary);
}

/**
 * Lista todos os sorteios em que o usuário entrou, com número de entradas.
 * Ordenado por draw_at DESC (próximos sorteios primeiro).
 */
export type MyRaffleEntry = RaffleSummary & {
  myEntries: number;
  pointsSpent: number;
  isWinner: boolean;
};

export async function listMyEntries(
  profileId: string,
  cityId: string,
): Promise<MyRaffleEntry[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('raffle_entries')
    .select(
      `
      raffle_id,
      entries_count,
      points_spent,
      raffles:raffle_id (*)
    `,
    )
    .eq('profile_id', profileId)
    .eq('city_id', cityId);

  if (!data || data.length === 0) return [];

  // Agrupa por raffle_id (em caso de múltiplas entradas)
  const rafflesById = new Map<string, { raffle: RaffleRow; entries: number; pointsSpent: number }>();
  for (const entry of data) {
    const raffle = (entry.raffles as unknown as RaffleRow[])?.[0];
    if (!raffle) continue;

    const existing = rafflesById.get(raffle.id);
    rafflesById.set(raffle.id, {
      raffle,
      entries: (existing?.entries ?? 0) + (entry.entries_count ?? 0),
      pointsSpent: (existing?.pointsSpent ?? 0) + (entry.points_spent ?? 0),
    });
  }

  const results: MyRaffleEntry[] = [];
  for (const { raffle, entries, pointsSpent } of rafflesById.values()) {
    results.push({
      ...rowToSummary(raffle),
      myEntries: entries,
      pointsSpent,
      isWinner: raffle.winner_profile_id === profileId,
    });
  }

  // Ordena por draw_at DESC
  results.sort((a, b) => new Date(b.drawAt).getTime() - new Date(a.drawAt).getTime());

  return results;
}
