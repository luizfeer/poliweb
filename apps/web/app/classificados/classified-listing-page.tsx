import type { LucideIcon } from 'lucide-react';
import { Filter } from 'lucide-react';
import { AppFrame, AppHeader, Band, TabBar } from '@/components/carmo';
import { ClassifiedCard, FreeBadge } from '@/components/public/classifieds/cards';
import { PublicHero, PublicHeroPill } from '@/components/public/page-hero';
import type { listClassifiedsByType } from '@/lib/classifieds/queries';

type ClassifiedListingItem = Awaited<ReturnType<typeof listClassifiedsByType>>[number];

export function ClassifiedListingPage({
  icon,
  title,
  description,
  placeholder,
  q,
  items,
  free,
  emptyText,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  placeholder: string;
  q?: string;
  items: ClassifiedListingItem[];
  free?: boolean;
  emptyText: string;
}) {
  return (
    <AppFrame className="bg-paper">
      <AppHeader chips={['Classificados', title, 'Buscar']} />
      <PublicHero
        icon={icon}
        kicker="Classificados"
        title={title}
        description={description}
        tone="clay"
        action={free ? <FreeBadge /> : undefined}
        meta={<PublicHeroPill tone="clay">{items.length} anúncios</PublicHeroPill>}
      />
      <Band className="px-3.5 pb-3 md:px-6 lg:px-8">
        <form className="border-ink-100 shadow-card grid gap-2 rounded-2xl border bg-white p-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder={placeholder}
            className="border-ink-100 bg-paper focus:border-clay-300 min-h-11 rounded-md border px-3 text-[14px] font-semibold outline-none"
          />
          <button
            className="bg-clay-500 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-extrabold text-white"
            type="submit"
          >
            <Filter size={16} aria-hidden="true" />
            Filtrar
          </button>
        </form>
      </Band>
      <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:grid-cols-3 lg:px-8">
        {items.map((item) => (
          <ClassifiedCard key={item.id} classified={item} />
        ))}
        {items.length === 0 ? (
          <p className="border-ink-100 text-ink-700 shadow-card rounded-2xl border bg-white p-4 text-sm">
            {emptyText}
          </p>
        ) : null}
      </Band>
      <TabBar active="comunidade" />
    </AppFrame>
  );
}
