'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createServiceRoleClient } from '@/lib/supabase/service';

type QueryResult = Promise<{ error: { message: string } | null }>;

/** Tipagem estreita para evitar `unknown` no builder encadeado (tabela ainda não em Database types). */
type CityFaqTableBuilder = {
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => QueryResult;
  };
  insert: (row: Record<string, unknown>) => QueryResult;
  delete: () => {
    eq: (column: string, value: string) => QueryResult;
  };
};

type ServiceRoleForFaqs = {
  from: (table: 'city_faqs') => CityFaqTableBuilder;
};

const upsertSchema = z.object({
  id: z.uuid().optional(),
  question: z.string().min(5).max(500).trim(),
  answer: z.string().min(5).max(2000).trim(),
});

const toggleSchema = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
});

const deleteSchema = z.object({ id: z.uuid() });

export async function upsertFaqAction(input: unknown) {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos.' };

  const sb = createServiceRoleClient() as unknown as ServiceRoleForFaqs;

  if (parsed.data.id) {
    const { error } = await sb
      .from('city_faqs')
      .update({
        question: parsed.data.question,
        answer: parsed.data.answer,
      })
      .eq('id', parsed.data.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb.from('city_faqs').insert({
      city_id: city.id,
      question: parsed.data.question,
      answer: parsed.data.answer,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/painel/cidade/faq');
  return { ok: true };
}

export async function toggleFaqAction(input: unknown) {
  const city = await getCurrentCity();
  if (!city) return { ok: false };
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const sb = createServiceRoleClient() as unknown as ServiceRoleForFaqs;
  const { error } = await sb
    .from('city_faqs')
    .update({ is_active: parsed.data.isActive })
    .eq('id', parsed.data.id);
  if (error) return { ok: false };

  revalidatePath('/painel/cidade/faq');
  return { ok: true };
}

export async function deleteFaqAction(input: unknown) {
  const city = await getCurrentCity();
  if (!city) return { ok: false };
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const sb = createServiceRoleClient() as unknown as ServiceRoleForFaqs;
  const { error } = await sb.from('city_faqs').delete().eq('id', parsed.data.id);
  if (error) return { ok: false };

  revalidatePath('/painel/cidade/faq');
  return { ok: true };
}
