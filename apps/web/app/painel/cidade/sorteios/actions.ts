'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { awardPoints } from '@/lib/points/award';

const slugRegex = /^[a-z0-9-]+$/;

const raffleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3).max(120).regex(slugRegex, 'Use apenas letras minúsculas, números e hífen.'),
  title: z.string().min(3).max(200),
  description: z.string().max(4000).nullable(),
  prize_description: z.string().min(3).max(1000),
  prize_value_cents: z.coerce.number().int().nonnegative().nullable(),
  cover_url: z.string().url().nullable(),
  sponsor_business_id: z.string().uuid().nullable(),
  entry_cost_points: z.coerce.number().int().min(1).max(10_000),
  max_entries_per_profile: z.coerce.number().int().min(1).max(1000),
  draw_at: z.string().min(10),
});

function nullable(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export async function upsertRaffleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = raffleSchema.parse({
    id: formData.get('id') || undefined,
    slug: formData.get('slug'),
    title: formData.get('title'),
    description: nullable(formData.get('description')),
    prize_description: formData.get('prize_description'),
    prize_value_cents: nullable(formData.get('prize_value_cents')),
    cover_url: nullable(formData.get('cover_url')),
    sponsor_business_id: nullable(formData.get('sponsor_business_id')),
    entry_cost_points: formData.get('entry_cost_points'),
    max_entries_per_profile: formData.get('max_entries_per_profile'),
    draw_at: formData.get('draw_at'),
  });

  const supabase = await createClient();

  const drawAtIso = new Date(parsed.draw_at).toISOString();

  if (parsed.id) {
    await supabase
      .from('raffles')
      .update({
        slug: parsed.slug,
        title: parsed.title,
        description: parsed.description,
        prize_description: parsed.prize_description,
        prize_value_cents: parsed.prize_value_cents,
        cover_url: parsed.cover_url,
        sponsor_business_id: parsed.sponsor_business_id,
        entry_cost_points: parsed.entry_cost_points,
        max_entries_per_profile: parsed.max_entries_per_profile,
        draw_at: drawAtIso,
      })
      .eq('id', parsed.id)
      .eq('city_id', city.id);
  } else {
    await supabase.from('raffles').insert({
      city_id: city.id,
      slug: parsed.slug,
      title: parsed.title,
      description: parsed.description,
      prize_description: parsed.prize_description,
      prize_value_cents: parsed.prize_value_cents,
      cover_url: parsed.cover_url,
      sponsor_business_id: parsed.sponsor_business_id,
      entry_cost_points: parsed.entry_cost_points,
      max_entries_per_profile: parsed.max_entries_per_profile,
      draw_at: drawAtIso,
      status: 'draft',
      created_by_profile_id: auth.profile.id,
    });
  }

  revalidatePath('/painel/cidade/sorteios');
  revalidatePath('/sorteios');
  redirect('/painel/cidade/sorteios');
}

export async function activateRaffleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));

  const supabase = await createClient();
  await supabase
    .from('raffles')
    .update({ status: 'active' })
    .eq('id', id)
    .eq('city_id', city.id)
    .eq('status', 'draft');

  revalidatePath('/painel/cidade/sorteios');
  revalidatePath('/sorteios');
}

export async function drawRaffleWinnerAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));

  const supabase = await createClient();

  const { error } = await supabase.rpc('draw_raffle_winner', { p_raffle_id: id });
  if (error) {
    throw new Error(`Falha ao sortear: ${error.message}`);
  }

  revalidatePath('/painel/cidade/sorteios');
  revalidatePath(`/painel/cidade/sorteios/${id}`);
  revalidatePath('/sorteios');
}

export async function cancelRaffleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));

  const supabase = await createClient();

  // Reembolsa pontos das entradas existentes
  const { data: entries } = await supabase
    .from('raffle_entries')
    .select('id, profile_id, points_spent')
    .eq('raffle_id', id);

  for (const entry of entries ?? []) {
    try {
      await awardPoints({
        profileId: entry.profile_id,
        cityId: city.id,
        delta: entry.points_spent,
        reason: 'admin_adjustment',
        referenceId: entry.id,
        useServiceRole: true,
      });
    } catch {
      // continua reembolsando os outros
    }
  }

  await supabase
    .from('raffles')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('city_id', city.id);

  revalidatePath('/painel/cidade/sorteios');
  revalidatePath('/sorteios');
}
