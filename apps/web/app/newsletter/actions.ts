'use server';

import { revalidatePath } from 'next/cache';
import { subscribeToNewsletter } from '@/lib/newsletter/subscribe';

export async function subscribeNewsletterAction(formData: FormData) {
  await subscribeToNewsletter({
    email: String(formData.get('email') ?? ''),
    city_slug: String(formData.get('city_slug') ?? 'carmo-do-rio-claro'),
    source: String(formData.get('source') ?? 'site'),
  });
  revalidatePath('/');
}
