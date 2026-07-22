import { Band, ListItem, SectionHeader } from '@/components/carmo';
import type { ServiceListConfig } from '@/lib/home';
import { getIcon } from '../icon-map';

type Props = { config: ServiceListConfig; title: string | null };

export function ServiceListBlock({ config, title }: Props) {
  const items = config.items ?? [];
  if (items.length === 0) return null;

  const action = config.actionHref
    ? { label: config.actionLabel ?? 'Ver tudo', href: config.actionHref }
    : undefined;

  return (
    <>
      {title ? <SectionHeader title={title} action={action} /> : null}
      <Band variant="paper-card">
        {items.map((item, index) => (
          <ListItem
            key={`${item.href}-${index}`}
            icon={getIcon(item.icon)}
            title={item.title}
            sub={item.sub}
            when={item.when}
            iconBg={item.iconBg}
            iconFg={item.iconFg}
            href={item.href}
            divider={index < items.length - 1}
          />
        ))}
      </Band>
    </>
  );
}
