import { createClient } from '@supabase/supabase-js';
import type { AgentEnv } from './config.js';

export function createServiceClient(env: AgentEnv) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
