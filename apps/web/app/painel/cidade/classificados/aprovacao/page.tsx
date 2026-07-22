import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedsForReview } from '@/lib/classifieds/queries';
import { ApprovalQueueByType } from '@/components/admin/classifieds/approval-queue';

export const metadata = { title: 'Aprovacao de classificados - Portal Carmelitano' };

export default async function ClassifiedApprovalPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const items = await listClassifiedsForReview(city.id);

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Classificados</p>
        <h1 className="text-3xl font-bold">Fila de aprovacao</h1>
      </header>
      <ApprovalQueueByType items={items} />
    </main>
  );
}
