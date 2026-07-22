import { notFound } from 'next/navigation';
import { getCurrentCity } from '@/lib/cities';
import { getClassifiedBySlug } from '@/lib/classifieds/queries';
import { buildSocialImages } from '@/lib/seo/social-images';
import { ClassifiedDetails, ClassifiedHeader } from '@/components/public/classifieds/cards';
import { ReportButton } from '@/components/public/classifieds/report-button';

export default async function VehicleClassifiedPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ClassifiedDetail params={params} expectedType="vehicle" />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) return {};
  const { slug } = await params;
  const classified = await getClassifiedBySlug({ cityId: city.id, slug });
  if (!classified || classified.type !== 'vehicle') return { title: 'Veículo - Classificados' };
  return {
    title: `${classified.title} - Classificados`,
    description: classified.description ?? undefined,
    ...buildSocialImages({
      ogImageUrl: classified.ogImageUrl,
      ogSquareImageUrl: classified.ogSquareImageUrl,
      alt: classified.title,
    }),
  };
}

async function ClassifiedDetail({ params, expectedType }: { params: Promise<{ slug: string }>; expectedType: 'vehicle' }) {
  const city = await getCurrentCity();
  if (!city || !city.modules.includes('classifieds')) notFound();
  const { slug } = await params;
  const classified = await getClassifiedBySlug({ cityId: city.id, slug });
  if (!classified || classified.type !== expectedType) notFound();

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <ClassifiedHeader classified={classified} />
      <ClassifiedDetails classified={classified} />
      <ReportButton classifiedId={classified.id} />
    </main>
  );
}
