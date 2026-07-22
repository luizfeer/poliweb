import { createClient } from '@supabase/supabase-js';
export function createServiceClient(env) {
    return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
