import { SectionSkeleton } from '@/components/public/section-skeleton';

export default function Loading() {
  return <SectionSkeleton title="agenda" cards={6} columns={2} />;
}
