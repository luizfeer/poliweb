'use client';

import { useState } from 'react';

type BusinessDescriptionProps = {
  text: string;
};

const COLLAPSE_LIMIT = 360;

export function BusinessDescription({ text }: BusinessDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text.length > COLLAPSE_LIMIT;

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <p
        className={
          expanded || !shouldCollapse
            ? 'm-0 text-[14px] leading-relaxed text-ink-700'
            : 'm-0 line-clamp-5 text-[14px] leading-relaxed text-ink-700'
        }
      >
        {text}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-[13px] font-semibold text-clay-600 hover:text-clay-700"
          aria-expanded={expanded}
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </div>
  );
}
