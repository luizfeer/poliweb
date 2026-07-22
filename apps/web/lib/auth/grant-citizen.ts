import 'server-only';

import { createClient } from '@/lib/supabase/server';

export async function grantCitizen(cityId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('grant_citizen_role', {
    p_city_id: cityId,
  });

  return !error;
}
