import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

type PostingTipProps = {
  title: string;
  children: ReactNode;
};

export function PostingTip({ title, children }: PostingTipProps) {
  return (
    <aside className="border-primary/20 bg-primary/5 rounded-xl border p-4 text-sm shadow-sm">
      <div className="flex gap-3">
        <span className="bg-primary text-primary-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
          <Info className="size-4" />
        </span>
        <div>
          <h2 className="text-foreground font-semibold">{title}</h2>
          <div className="text-muted-foreground mt-1 leading-relaxed">{children}</div>
        </div>
      </div>
    </aside>
  );
}
