import { Band, EmptyCta, SectionHeader } from '@/components/carmo';
import type { CtaGridConfig } from '@/lib/home';
import { getIcon } from '../icon-map';

type Props = { config: CtaGridConfig; title: string | null };

export function CtaGridBlock({ config, title }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  const columns = config.columns ?? 2;
  const gridClass = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';

  return (
    <>
      {title ? <SectionHeader title={title} /> : null}
      <Band className={`grid gap-2.5 px-3.5 pb-3 ${gridClass}`}>
        {items.map((item, index) => (
          <EmptyCta
            key={`${item.href}-${index}`}
            icon={getIcon(item.icon)}
            tone={item.tone}
            title={item.title}
            description={item.description}
            cta={item.cta}
            href={item.href}
          />
        ))}
      </Band>
    </>
  );
}
