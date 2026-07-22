import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AICalloutProps = {
  title: string;
  body: string;
  source: { label: string; href: string };
  className?: string;
};

/**
 * Callout para conteúdo gerado por IA (Diário Oficial, atas).
 * Sempre vem com badge "Resumido por IA" + link para fonte original.
 */
export function AICallout({ title, body, source, className }: AICalloutProps) {
  return (
    <div
      className={cn(
        'mx-3.5 bg-white rounded-xs p-3.5 border border-ink-100 border-l-[3px] border-l-sky-500',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
          Resumido por IA
        </span>
        <span className="text-[11px] text-ink-400">verifique a fonte</span>
      </div>
      <div className="text-[14px] font-bold text-ink-900 mb-1">{title}</div>
      <div className="text-[13px] text-ink-700 leading-relaxed">{body}</div>
      <Link
        href={source.href}
        className="text-[13px] font-medium text-sky-700 mt-2 inline-flex items-center gap-0.5 hover:underline"
      >
        {source.label}
        <ChevronRight size={14} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
