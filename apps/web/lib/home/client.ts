import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * Cliente Supabase para as tabelas do home builder (home_layouts, home_blocks,
 * home_block_banners). Como o schema foi adicionado depois do ultimo
 * `supabase gen types`, usamos um cast permissivo aqui ate regenerar os tipos.
 */
export async function createHomeClient() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as unknown as { from: (table: string) => any; rpc: (fn: string, args?: unknown) => any };
}
