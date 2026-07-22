import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';
import { ClassifiedListingPage } from '../classified-listing-page';
import { getCurrentCity } from '@/lib/cities';
import { listClassifiedsByType } from '@/lib/classifieds/queries';

export const metadata = { title: 'Itens - Classificados' };
export const revalidate = 60;

export default async function ItemClassifiedsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const params = await searchParams;
  const items = await listClassifiedsByType({ cityId: city.id, type: 'item', q: params.q });

  return (
    <ClassifiedListingPage
      icon={Package}
      title="Itens"
      description="Móveis, eletros, usados, doações e oportunidades anunciadas por moradores."
      placeholder="Buscar móveis, eletros ou usados"
      q={params.q}
      items={items}
      emptyText="Nenhum item publicado."
    />
  );
}
