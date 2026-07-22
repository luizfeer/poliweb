import { notFound } from 'next/navigation';
import { BriefcaseBusiness } from 'lucide-react';
import { ClassifiedListingPage } from '../classified-listing-page';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedsByType } from '@/lib/classifieds/queries';

export const metadata = { title: 'Vagas - Classificados' };
export const revalidate = 60;

export default async function JobClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const params = await searchParams;
  const items = await listClassifiedsByType({ cityId: city.id, type: 'job', q: params.q });

  return (
    <ClassifiedListingPage
      icon={BriefcaseBusiness}
      title="Vagas"
      description="Oportunidades locais. Cadastrar vaga é grátis e sempre passa por aprovação."
      placeholder="Buscar cargo, empresa ou área"
      q={params.q}
      items={items}
      free
      emptyText="Nenhuma vaga publicada."
    />
  );
}
