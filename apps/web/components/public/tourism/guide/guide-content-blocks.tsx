import { ArrowRight, Quote } from 'lucide-react';
import Link from 'next/link';
import type { GuideContentBlock } from '@/lib/tourism/types';

export function GuideContentBlocks({ blocks }: { blocks: GuideContentBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4 px-4 md:px-6 lg:px-8">
      {blocks.map((block) => {
        if (block.type === 'quote') return <QuoteBlock key={block.title} block={block} />;
        return <BannerBlock key={block.title} block={block} />;
      })}
    </div>
  );
}

function QuoteBlock({ block }: { block: GuideContentBlock }) {
  return (
    <blockquote className="relative overflow-hidden rounded-xl border-l-4 border-clay-500 bg-white p-5 pl-6">
      <Quote
        className="absolute -right-2 -top-2 size-20 text-clay-100 opacity-50"
        strokeWidth={1}
        aria-hidden="true"
      />
      <p className="relative m-0 font-display text-[18px] font-bold italic leading-snug text-ink-800 md:text-[20px]">
        {block.text}
      </p>
    </blockquote>
  );
}

function BannerBlock({ block }: { block: GuideContentBlock }) {
  return (
    <div className="overflow-hidden rounded-xl bg-clay-500 p-5 text-white md:p-6">
      <h3 className="m-0 font-display text-[20px] font-extrabold leading-tight md:text-[24px]">
        {block.title}
      </h3>
      <p className="m-0 mt-2 text-[14px] leading-relaxed text-white/85">{block.text}</p>
      {block.button ? (
        <Link
          href={block.button.href}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-clay-600 no-underline transition-colors hover:bg-clay-50"
        >
          {block.button.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
