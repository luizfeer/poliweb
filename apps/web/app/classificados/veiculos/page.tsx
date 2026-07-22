import { notFound } from 'next/navigation';
import { Car } from 'lucide-react';
import { ClassifiedListingPage } from '../classified-listing-page';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedsByType } from '@/lib/classifieds/queries';

export const metadata = { title: 'Veículos - Classificados' };
export const revalidate = 60;

export default async function VehicleClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const params = await searchParams;
  const items = await listClassifiedsByType({ cityId: city.id, type: 'vehicle', q: params.q });

  return (
    <ClassifiedListingPage
      icon={Car}
      title="Veículos"
      description="Carros, motos e utilitários anunciados na cidade."
      placeholder="Buscar marca, modelo ou título"
      q={params.q}
      items={items}
      emptyText="Nenhum veículo encontrado."
    />
  );
}
