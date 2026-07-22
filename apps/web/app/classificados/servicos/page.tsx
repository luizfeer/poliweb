import { notFound } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { ClassifiedListingPage } from '../classified-listing-page';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedsByType } from '@/lib/classifieds/queries';

export const metadata = { title: 'Serviços - Classificados' };
export const revalidate = 60;

export default async function ServiceClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const params = await searchParams;
  const items = await listClassifiedsByType({ cityId: city.id, type: 'service', q: params.q });

  return (
    <ClassifiedListingPage
      icon={Wrench}
      title="Serviços"
      description="Autônomos, pequenos prestadores e serviços locais anunciados para a cidade."
      placeholder="Buscar área ou prestador"
      q={params.q}
      items={items}
      emptyText="Nenhum serviço publicado."
    />
  );
}
