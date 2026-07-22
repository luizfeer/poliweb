import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import type { BusinessPlan, PlanStatus } from './types';

type PlansRow = {
  slug: string;
  name: string;
  description: string;
  monthly_value_cents: number;
  features: string[] | null;
  highlight: boolean | null;
  display_order: number | null;
  status: PlanStatus | null;
};

type ExtendedDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Database['public']['Tables'] & {
      business_plans: {
        Row: PlansRow;
        Insert: PlansRow;
        Update: Partial<PlansRow>;
        Relationships: [];
      };
    };
  };
};

async function getPlansClient(): Promise<SupabaseClient<ExtendedDatabase>> {
  const supabase = await createClient();
  return supabase as unknown as SupabaseClient<ExtendedDatabase>;
}

function toPlan(row: PlansRow): BusinessPlan {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    monthlyValueCents: row.monthly_value_cents,
    features: Array.isArray(row.features) ? row.features.filter((f): f is string => typeof f === 'string') : [],
    highlight: row.highlight ?? false,
    displayOrder: row.display_order ?? 0,
    status: row.status ?? 'active',
  };
}

export async function listVisiblePlans(): Promise<BusinessPlan[]> {
  const supabase = await getPlansClient();
  const { data, error } = await supabase
    .from('business_plans')
    .select('*')
    .neq('status', 'archived')
    .order('display_order', { ascending: true });
  if (error || !data) return [];
  return data.map(toPlan);
}

export async function getPlanBySlug(slug: string): Promise<BusinessPlan | null> {
  const supabase = await getPlansClient();
  const { data, error } = await supabase
    .from('business_plans')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return toPlan(data);
}
