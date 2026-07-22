import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchBarProps = {
  /** Rota destino do form. */
  action?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Barra de busca server-side: submit faz GET com `?q=...`.
 * Não precisa de JS no cliente — funciona como form clássico.
 */
export function SearchBar({
  action = '/comercio/buscar',
  defaultValue,
  placeholder = 'Buscar negócios em Carmo do Rio Claro',
  className,
}: SearchBarProps) {
  return (
    <form action={action} method="get" className={cn('px-3.5', className)}>
      <label className="flex items-center gap-2.5 bg-white rounded-full px-3.5 py-2.5 border border-ink-200 focus-within:border-clay-500 focus-within:shadow-[0_0_0_3px_var(--carmo-clay-50)] transition-shadow">
        <Search size={18} strokeWidth={2.4} className="text-ink-600 shrink-0" />
        <input
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 outline-none text-[14px] text-ink-900 placeholder:text-ink-400"
          autoComplete="off"
          aria-label="Buscar negócios"
        />
      </label>
    </form>
  );
}
