import Link from 'next/link';
import { Pencil } from 'lucide-react';

type AdminEditLinkProps = {
  href: string;
  label?: string;
};

export function AdminEditLink({ href, label = 'Editar no admin' }: AdminEditLinkProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-clay-200 bg-white px-3 text-[12px] font-bold text-clay-700 shadow-sm hover:bg-clay-50 hover:no-underline"
    >
      <Pencil size={14} aria-hidden="true" />
      {label}
    </Link>
  );
}
