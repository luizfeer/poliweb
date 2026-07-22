'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

const favoriteBusinessSchema = z.object({
  businessId: z.string().uuid(),
  businessSlug: z.string().min(1),
});

export async function toggleBusinessFavoriteAction(input: unknown) {
  const parsed = favoriteBusinessSchema.parse(input);
  const [auth, city] = await Promise.all([getProfile(), getCurrentCity()]);

  if (!auth) {
    redirect(`/entrar?next=/comercio/negocio/${parsed.businessSlug}`);
  }

  if (!city) return { favorited: false };

  const supabase = await createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('id', parsed.businessId)
    .eq('slug', parsed.businessSlug)
    .eq('city_id', city.id)
    .eq('status', 'published')
    .maybeSingle();

  if (!business) return { favorited: false };

  const { data: existing } = await supabase
    .from('business_favorites')
    .select('business_id')
    .eq('business_id', parsed.businessId)
    .eq('profile_id', auth.profile.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('business_favorites')
      .delete()
      .eq('business_id', parsed.businessId)
      .eq('profile_id', auth.profile.id);
  } else {
    await supabase.from('business_favorites').insert({
      business_id: parsed.businessId,
      profile_id: auth.profile.id,
    });
  }

  revalidatePath(`/comercio/negocio/${business.slug}`);
  revalidatePath('/turismo/onde-ficar');
  revalidatePath('/painel/favoritos');

  return { favorited: !existing };
}
