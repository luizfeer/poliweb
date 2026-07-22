import { HScroll, RoundCat, SectionHeader } from '@/components/carmo';
import type { CategoryGridConfig, CategoryTone } from '@/lib/home';
import { getIcon } from '../icon-map';

type Props = {
  config: CategoryGridConfig;
  title: string | null;
};

const DEFAULT_TONE: CategoryTone = 'paper-deep';

export function CategoryGridBlock({ config, title }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  return (
    <>
      {title ? <SectionHeader title={title} /> : null}
      <HScroll className="px-3.5">
        {items.map((item, index) => (
          <RoundCat
            key={`${item.label}-${index}`}
            label={item.label}
            icon={getIcon(item.icon)}
            bg={item.tone ?? DEFAULT_TONE}
            href={item.href}
          />
        ))}
      </HScroll>
    </>
  );
}
