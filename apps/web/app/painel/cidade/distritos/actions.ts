'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const districtSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  zone: z.string().max(40).nullable(),
  display_order: z.coerce.number().int().default(0),
});

export async function upsertDistrictAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = districtSchema.parse({
    id: formData.get('id') || undefined,
    slug: formData.get('slug'),
    name: formData.get('name'),
    zone: formData.get('zone') || null,
    display_order: formData.get('display_order') || 0,
  });
  const supabase = await createClient();

  await supabase.from('districts').upsert({
    ...parsed,
    city_id: city.id,
  });

  revalidatePath('/painel/cidade/distritos');
}

export async function deleteDistrictAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const id = z.string().uuid().parse(formData.get('id'));
  const supabase = await createClient();

  await supabase.from('districts').delete().eq('id', id).eq('city_id', city.id);
  revalidatePath('/painel/cidade/distritos');
}
