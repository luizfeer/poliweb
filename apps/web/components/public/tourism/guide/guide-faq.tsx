'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { GuideFaqItem } from '@/lib/tourism/types';

export function GuideFaq({ items }: { items: GuideFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <h2 className="m-0 mb-4 font-display text-[22px] font-extrabold tracking-tight text-ink-900 md:text-[26px]">
        Perguntas frequentes
      </h2>
      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
        {items.map((item, index) => (
          <FaqItem
            key={item.question}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ item, isLast }: { item: GuideFaqItem; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={!isLast ? 'border-b border-ink-100' : ''}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold leading-snug text-ink-900">
          {item.question}
        </span>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-ink-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-0">
          <p className="m-0 text-[13px] leading-relaxed text-ink-600">{item.answer}</p>
        </div>
      ) : null}
    </div>
  );
}
