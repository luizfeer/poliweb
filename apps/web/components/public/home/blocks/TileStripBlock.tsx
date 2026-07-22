import { HScroll, SectionHeader, TileCard } from '@/components/carmo';
import type { TileStripConfig } from '@/lib/home';

type Props = { config: TileStripConfig; title: string | null };

export function TileStripBlock({ config, title }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  return (
    <>
      {title ? <SectionHeader title={title} /> : null}
      <HScroll>
        {items.map((item, index) => (
          <TileCard
            key={`${item.href}-${index}`}
            title={item.title}
            subtitle={item.subtitle}
            illo={item.illo}
            href={item.href}
          />
        ))}
      </HScroll>
    </>
  );
}
