'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const toggleModuleSchema = z.object({
  module_key: z.string().min(1),
  enabled: z.coerce.boolean(),
});

export async function toggleCityModuleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = toggleModuleSchema.parse({
    module_key: formData.get('module_key'),
    enabled: formData.get('enabled') === 'on',
  });

  const supabase = await createClient();
  await supabase.from('city_modules').upsert({
    city_id: city.id,
    module_key: parsed.module_key,
    enabled: parsed.enabled,
  });

  revalidatePath('/painel/cidade/modulos');
}
