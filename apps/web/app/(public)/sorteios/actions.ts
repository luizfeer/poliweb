'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { awardPoints } from '@/lib/points/award';
import { getMyBalance } from '@/lib/points';

const enterSchema = z.object({
  raffleId: z.string().uuid(),
  entriesCount: z.coerce.number().int().min(1).max(100),
});

export type EnterRaffleResult = {
  ok: boolean;
  message: string;
};

export async function enterRaffleAction(
  _prev: EnterRaffleResult,
  formData: FormData,
): Promise<EnterRaffleResult> {
  const parsed = enterSchema.safeParse({
    raffleId: formData.get('raffle_id'),
    entriesCount: formData.get('entries_count'),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const auth = await requireProfile();
  const city = await getCurrentCity();
  if (!city) return { ok: false, message: 'Cidade não encontrada.' };

  const supabase = await createClient();

  // Carrega o sorteio (RLS garante que está active)
  const { data: raffle } = await supabase
    .from('raffles')
    .select('id, slug, status, draw_at, entry_cost_points, max_entries_per_profile')
    .eq('id', parsed.data.raffleId)
    .eq('city_id', city.id)
    .maybeSingle();

  if (!raffle) return { ok: false, message: 'Sorteio não encontrado.' };
  if (raffle.status !== 'active') return { ok: false, message: 'Esse sorteio não está aceitando entradas no momento.' };
  if (new Date(raffle.draw_at).getTime() <= Date.now()) {
    return { ok: false, message: 'O prazo de inscrição já passou.' };
  }

  // Quantas entradas o usuário já tem
  const { data: existing } = await supabase
    .from('raffle_entries')
    .select('entries_count')
    .eq('raffle_id', raffle.id)
    .eq('profile_id', auth.profile.id);

  const usedEntries = (existing ?? []).reduce((sum, r) => sum + r.entries_count, 0);
  const remaining = raffle.max_entries_per_profile - usedEntries;
  if (parsed.data.entriesCount > remaining) {
    return {
      ok: false,
      message: remaining > 0
        ? `Você ainda pode adicionar até ${remaining} ${remaining === 1 ? 'entrada' : 'entradas'}.`
        : 'Você já atingiu o limite de entradas neste sorteio.',
    };
  }

  // Saldo suficiente?
  const totalCost = raffle.entry_cost_points * parsed.data.entriesCount;
  const balance = await getMyBalance(city.id);
  if (balance.balance < totalCost) {
    return {
      ok: false,
      message: `Saldo insuficiente. Você tem ${balance.balance} pts e precisa de ${totalCost} pts.`,
    };
  }

  // Insere entry
  const { data: entry, error: entryErr } = await supabase
    .from('raffle_entries')
    .insert({
      raffle_id: raffle.id,
      profile_id: auth.profile.id,
      city_id: city.id,
      points_spent: totalCost,
      entries_count: parsed.data.entriesCount,
    })
    .select('id')
    .single();

  if (entryErr || !entry) {
    return { ok: false, message: 'Não foi possível registrar sua entrada.' };
  }

  // Debita pontos
  try {
    await awardPoints({
      profileId: auth.profile.id,
      cityId: city.id,
      delta: -totalCost,
      reason: 'raffle_entry',
      referenceId: entry.id,
    });
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Falha ao debitar pontos.',
    };
  }

  revalidatePath(`/sorteios/${raffle.slug}`);
  revalidatePath('/painel/cidadao/pontos');

  return {
    ok: true,
    message: `Pronto! Você adicionou ${parsed.data.entriesCount} ${parsed.data.entriesCount === 1 ? 'entrada' : 'entradas'}. Boa sorte!`,
  };
}
