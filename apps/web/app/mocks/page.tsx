import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';

export default async function MocksAliasPage() {
  const city = await getCurrentCity();
  if (!city) notFound();
  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  redirect('/mocs');
}
