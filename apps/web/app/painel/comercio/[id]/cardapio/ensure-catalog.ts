'use server'

// Cria sob demanda o catálogo padrão (food_menu) de um negócio e retorna o id.
// Chamado pela página do cardápio quando o negócio ainda não tem catálogo.

import { requireRole } from '@/lib/auth'
import { getCurrentCity } from '@/lib/cities'
import { createClient } from '@/lib/supabase/server'

export async function ensureCatalogAction(businessId: string): Promise<string | undefined> {
  const city = await getCurrentCity()
  if (!city) return undefined
  await requireRole({ cityId: city.id, kinds: ['merchant', 'city_admin', 'super_admin'] })

  const supabase = await createClient()
  const { data: can } = await supabase.rpc('manages_business', { p_business_id: businessId })
  if (!can) return undefined

  const db = supabase
  const { data: existing } = await db
    .from('business_catalogs')
    .select('id')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (existing?.id) return existing.id as string

  const { data: created } = await db
    .from('business_catalogs')
    .insert({ business_id: businessId, name: 'Cardápio', catalog_type: 'food_menu' })
    .select('id')
    .single()
  return created?.id as string | undefined
}
