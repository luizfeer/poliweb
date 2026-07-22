import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedReports } from '@/lib/classifieds/queries';
import { ReportInbox } from '@/components/admin/classifieds/approval-queue';

export const metadata = { title: 'Denuncias de classificados - Portal Carmelitano' };

export default async function ClassifiedReportsPage() {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const reports = await listClassifiedReports(city.id);

  return (
    <main className="space-y-6">
      <header className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Classificados</p>
        <h1 className="text-3xl font-bold">Denuncias</h1>
      </header>
      <ReportInbox reports={reports} />
    </main>
  );
}
