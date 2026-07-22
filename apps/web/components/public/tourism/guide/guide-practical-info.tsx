import { Info } from 'lucide-react';
import type { GuidePracticalItem } from '@/lib/tourism/types';

export function GuidePracticalInfo({
  title,
  items,
}: {
  title: string;
  items: GuidePracticalItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <h2 className="m-0 mb-4 font-display text-[22px] font-extrabold tracking-tight text-ink-900 md:text-[26px]">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex gap-3 rounded-lg border border-ink-100 bg-white p-4"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cerrado-50 text-cerrado-700">
              <Info className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="m-0 text-[14px] font-bold text-ink-900">{item.title}</h3>
              <p className="m-0 mt-1 text-[12px] leading-relaxed text-ink-600">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
