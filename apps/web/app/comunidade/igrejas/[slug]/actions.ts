'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';

const reviewSchema = z.object({
  church_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).nullable(),
  comment: z.string().trim().max(2000).nullable(),
});

export async function createChurchReviewAction(formData: FormData) {
  const [auth, city] = await Promise.all([requireProfile(), getCurrentCity()]);
  if (!city) return;

  const parsed = reviewSchema.parse({
    church_id: formData.get('church_id'),
    rating: formData.get('rating'),
    title: formData.get('title') || null,
    comment: formData.get('comment') || null,
  });

  const supabase = await createClient();
  const { data: church } = await supabase
    .from('churches')
    .select('id, slug')
    .eq('id', parsed.church_id)
    .eq('city_id', city.id)
    .eq('status', 'published')
    .single();
  if (!church) return;

  const { data: review, error } = await supabase
    .from('church_reviews')
    .upsert({
      church_id: parsed.church_id,
      city_id: city.id,
      author_profile_id: auth.profile.id,
      rating: parsed.rating,
      title: parsed.title,
      comment: parsed.comment,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !review) throw error;

  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'moderate_ugc',
    input_ref: { review_id: review.id, entity_type: 'church_review' },
  });

  revalidatePath(`/comunidade/igrejas/${church.slug}`);
  revalidatePath(`/painel/cidade/comunidade/igrejas/${church.slug}/avaliacoes`);
}
