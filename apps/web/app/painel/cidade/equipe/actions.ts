'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const grantRoleSchema = z.object({
  profile_id: z.string().uuid(),
  role: z.enum(['city_admin', 'moderator', 'merchant']),
});

const revokeRoleSchema = z.object({
  role_id: z.string().uuid(),
});

export async function grantRoleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = grantRoleSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  await supabase.from('profile_roles').insert({
    profile_id: parsed.profile_id,
    city_id: city.id,
    role: parsed.role,
    granted_by: auth.profile.id,
  });

  revalidatePath('/painel/cidade/equipe');
}

export async function revokeRoleAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = revokeRoleSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { data: role } = await supabase
    .from('profile_roles')
    .select('*')
    .eq('id', parsed.role_id)
    .maybeSingle();

  if (!role) return;

  if (role.role === 'city_admin' && role.city_id) {
    const { count } = await supabase
      .from('profile_roles')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', role.city_id)
      .eq('role', 'city_admin');

    if ((count ?? 0) <= 1) {
      return;
    }
  }

  await supabase.from('profile_roles').delete().eq('id', parsed.role_id);
  revalidatePath('/painel/cidade/equipe');
}
