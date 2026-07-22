import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { getSupabasePublicEnv } from './env';
import type { Database } from './database.types';

/**
 * Cliente Supabase anônimo, sem cookies/sessão.
 *
 * Use APENAS para leituras públicas que serão cacheadas com `unstable_cache`
 * — `unstable_cache` proíbe `cookies()`/`headers()` dentro do callback, então
 * o cliente padrão de `server.ts` não funciona ali. RLS continua aplicando
 * (role = anon), então apenas dados publicamente legíveis voltam.
 */
export const createPublicClient = cache(() => {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return createSupabaseClient<Database>(env.url, env.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
});
