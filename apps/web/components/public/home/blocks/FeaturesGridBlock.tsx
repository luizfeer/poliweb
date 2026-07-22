import { Link } from '@/components/navigation/link';
import { Band, SectionHeader } from '@/components/carmo';
import type { FeatureTone, FeaturesGridConfig } from '@/lib/home';
import { getIcon } from '../icon-map';

const TONE: Record<FeatureTone, { bg: string; fg: string }> = {
  cerrado: { bg: 'bg-cerrado-100', fg: 'text-cerrado-700' },
  clay: { bg: 'bg-clay-50', fg: 'text-clay-600' },
  sky: { bg: 'bg-sky-100', fg: 'text-sky-700' },
  sun: { bg: 'bg-sun-100', fg: 'text-ink-900' },
  'paper-deep': { bg: 'bg-paper-deep', fg: 'text-ink-900' },
};

type Props = { config: FeaturesGridConfig; title: string | null };

export function FeaturesGridBlock({ config, title }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  const columns = config.columns ?? 2;
  const gridClass = columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';

  return (
    <>
      {title ? <SectionHeader title={title} kicker={config.kicker} /> : null}
      <Band className={`grid gap-2.5 px-3.5 pb-3 ${gridClass}`}>
        {items.map((item, index) => {
          const Icon = getIcon(item.icon);
          const tone = TONE[item.tone ?? 'cerrado'];
          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className="rounded-xs border-ink-100 shadow-card border bg-white p-3 hover:no-underline"
            >
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${tone.bg} ${tone.fg}`}>
                <Icon size={19} strokeWidth={2.1} aria-hidden="true" />
              </div>
              <h2 className="text-ink-900 m-0 text-[14px] font-extrabold leading-snug">
                {item.title}
              </h2>
              <p className="text-ink-600 m-0 mt-1 text-[12px] leading-snug">{item.text}</p>
            </Link>
          );
        })}
      </Band>
    </>
  );
}
