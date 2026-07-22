import { cn } from '@/lib/utils';

type CoverCardRowProps = {
  children: React.ReactNode;
  className?: string;
};

/** Cards capa 4:5 — carrossel horizontal no mobile, grade a partir de `sm`. */
export function CoverCardRow({ children, className }: CoverCardRowProps) {
  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-2',
        '[-webkit-overflow-scrolling:touch]',
        'sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:snap-none md:grid-cols-3 md:px-6 lg:px-8',
        className,
      )}
      style={{ scrollPaddingLeft: 16 }}
    >
      {children}
    </div>
  );
}

export function CoverCardRowItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-[min(200px,70vw)] shrink-0 snap-start',
        'sm:w-auto sm:min-w-0 sm:shrink',
        className,
      )}
    >
      {children}
    </div>
  );
}
