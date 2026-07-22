import { resolveGuideHighlightIcon } from '@/lib/tourism/guide-highlight-icons';
import type { GuideHighlight } from '@/lib/tourism/types';

export function GuideHighlights({ items }: { items: GuideHighlight[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6 lg:px-8">
      {items.map((item) => {
        const Icon = resolveGuideHighlightIcon(item.icon);
        return (
          <div
            key={item.title}
            className="group relative rounded-xl border border-ink-100 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-clay-50 text-clay-600 transition-colors group-hover:bg-clay-100">
              <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="m-0 text-[14px] font-bold leading-snug text-ink-900">
              {item.title}
            </h3>
            <p className="m-0 mt-1 text-[12px] leading-relaxed text-ink-600">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
