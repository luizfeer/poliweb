import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import type { BusinessLead, BusinessLeadInsert, BusinessLeadUpdate } from './types';

type ExtendedDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Database['public']['Tables'] & {
      business_leads: {
        Row: BusinessLead;
        Insert: BusinessLeadInsert;
        Update: BusinessLeadUpdate;
        Relationships: [];
      };
    };
  };
};

export async function getBusinessLeadsClient(): Promise<SupabaseClient<ExtendedDatabase>> {
  const supabase = await createClient();
  return supabase as unknown as SupabaseClient<ExtendedDatabase>;
}
