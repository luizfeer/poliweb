import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { TourismGuide } from '@/lib/tourism';

const KIND_LABELS: Record<string, string> = {
  distrito: 'Distrito',
  cidade: 'Cidade',
  tematico: 'Guia temático',
  roteiro: 'Roteiro',
};

export function GuideCard({ guide }: { guide: TourismGuide }) {
  return (
    <Link
      href={`/turismo/guias/${guide.slug}`}
      className="group flex gap-3 rounded-xl border border-ink-100 bg-white p-3 no-underline transition hover:border-clay-300 hover:shadow-sm"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-cerrado-50 text-cerrado-700">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-clay-600">
          {KIND_LABELS[guide.kind] ?? 'Guia'}
        </p>
        <h3 className="m-0 mt-0.5 truncate text-[14px] font-extrabold text-ink-900">
          {guide.name}
        </h3>
        <p className="m-0 mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-600">
          {guide.tagline}
        </p>
      </div>
      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-clay-600" />
    </Link>
  );
}

export function GuideCardCompact({ guide }: { guide: TourismGuide }) {
  return (
    <Link
      href={`/turismo/guias/${guide.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-ink-100 bg-white px-3 py-2.5 no-underline transition hover:border-clay-300"
    >
      <BookOpen className="h-4 w-4 shrink-0 text-cerrado-700" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink-900">
        {guide.name}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
