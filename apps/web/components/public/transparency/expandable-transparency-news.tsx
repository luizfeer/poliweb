'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Band } from '@/components/carmo';
import type { CivicNews } from '@/lib/transparency';
import { cn } from '@/lib/utils';
import { CityHallInstagramCard, CompactNewsCard, LeadNewsCard } from './transparency-cards';
import { useResponsiveNewsLimit } from './use-responsive-news-limit';

function VerMaisButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-[13px] font-bold text-ink-800 shadow-sm',
        'transition-colors hover:border-ink-300 hover:bg-paper active:bg-paper-deep',
      )}
    >
      Ver mais ({count})
      <ChevronDown size={16} className="text-ink-500" aria-hidden />
    </button>
  );
}

export function ExpandableCityHallNews({ news }: { news: CivicNews[] }) {
  const limit = useResponsiveNewsLimit();
  const [expanded, setExpanded] = useState(false);

  if (news.length === 0) return null;

  const visibleCount = expanded ? news.length : Math.min(limit, news.length);
  const slice = news.slice(0, visibleCount);
  const remaining = news.length - limit;

  return (
    <>
      <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:gap-4 md:px-6 lg:grid-cols-3 lg:px-8">
        {slice.map((item, index) => (
          <CityHallInstagramCard
            key={item.id}
            news={item}
            featured={index === 0}
            mobileLayout="instagram"
          />
        ))}
      </Band>
      {!expanded && remaining > 0 ? (
        <div className="flex justify-center px-3.5 pb-5 md:px-6 lg:px-8">
          <VerMaisButton count={remaining} onClick={() => setExpanded(true)} />
        </div>
      ) : null}
    </>
  );
}

export function ExpandableCouncilNews({ news }: { news: CivicNews[] }) {
  const limit = useResponsiveNewsLimit();
  const [expanded, setExpanded] = useState(false);

  if (news.length === 0) return null;

  const totalVisible = expanded ? news.length : Math.min(limit, news.length);
  const lead = news[0];
  const rest = news.slice(1, totalVisible);
  const remaining = news.length - limit;

  return (
    <>
      <Band className="grid gap-3 px-3.5 pb-4 md:grid-cols-2 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <LeadNewsCard news={lead} />
        <div className="grid gap-2">
          {rest.map((item) => (
            <CompactNewsCard key={item.id} news={item} />
          ))}
        </div>
      </Band>
      {!expanded && remaining > 0 ? (
        <div className="flex justify-center px-3.5 pb-5 md:px-6 lg:px-8">
          <VerMaisButton count={remaining} onClick={() => setExpanded(true)} />
        </div>
      ) : null}
    </>
  );
}
