import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Cliente Supabase com service role.
 *
 * Use APENAS em fluxos onde a autenticação do usuário não é suficiente:
 * - Lookup cross-usuário (ex: buscar código de indicação de outro)
 * - Operações em background (cron, webhooks)
 *
 * NUNCA expor para o cliente. NUNCA usar em rotas públicas sem validação manual.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
