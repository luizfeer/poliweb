'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const createCitySchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  state: z.string().length(2),
  status: z.enum(['active', 'coming_soon', 'paused']),
  timezone: z.string().min(3).default('America/Sao_Paulo'),
});

export async function createCityAction(formData: FormData) {
  await requireRole({ kinds: ['super_admin'] });
  const parsed = createCitySchema.parse({
    slug: formData.get('slug'),
    name: formData.get('name'),
    state: formData.get('state'),
    status: formData.get('status'),
    timezone: formData.get('timezone') || 'America/Sao_Paulo',
  });
  const supabase = await createClient();

  await supabase.from('cities').insert(parsed);
  revalidatePath('/painel/super/cidades');
}
