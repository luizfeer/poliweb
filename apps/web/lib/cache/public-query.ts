import 'server-only';

import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

type PublicSupabase = ReturnType<typeof createPublicClient>;

type Options = {
  /** Chave base — vira parte da chave de cache. */
  key: string;
  /** Tags para `revalidateTag` quando os dados mudam. */
  tags: string[];
  /** Em segundos. Default: 10 minutos. */
  revalidate?: number;
  /** Variantes que entram na chave de cache (cityId, filtros, etc). */
  parts?: Array<string | number | boolean | null | undefined>;
};

/**
 * Helper para cachear leituras públicas no Postgrest.
 *
 * Usa o cliente anônimo (sem cookies) — RLS continua aplicando.
 * `unstable_cache` proíbe `cookies()`/`headers()` no callback, então
 * o cliente padrão de `lib/supabase/server.ts` não funciona aqui.
 *
 * Para invalidar, chame `revalidateTag(tag, 'max')` na Server Action que edita.
 */
export function publicCached<T>(
  options: Options,
  fn: (supabase: PublicSupabase) => Promise<T>,
): Promise<T> {
  const keyParts = [options.key, ...(options.parts ?? [])].map((p) => String(p ?? ''));
  return unstable_cache(async () => fn(createPublicClient()), keyParts, {
    revalidate: options.revalidate ?? 600,
    tags: options.tags,
  })();
}
