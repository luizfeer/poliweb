import { SectionSkeleton } from '@/components/public/section-skeleton';

export default function Loading() {
  return <SectionSkeleton title="imoveis" cards={8} columns={4} />;
}
