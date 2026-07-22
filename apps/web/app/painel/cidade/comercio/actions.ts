'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentCity } from '@/lib/cities';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import { scrapeCliqueiachei } from '@/lib/scrapers/cliqueiachei';
import type { Json } from '@/lib/supabase/database.types';
import { convertBusinessToAttractionAction as convertBusinessToAttractionImpl } from '../../turismo/actions';

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  city_id: z.string().uuid().nullable(),
  parent_id: z.string().uuid().nullable(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  icon: z.string().max(80).nullable(),
  display_order: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

async function insertAudit(action: string, cityId: string, entityType: string, entityId: string | null, diff: Json) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    city_id: cityId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff,
  });
}

export async function approveBusinessAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const businessId = z.string().uuid().parse(formData.get('business_id'));
  const supabase = await createClient();

  const { error } = await supabase
    .from('businesses')
    .update({ status: 'published' })
    .eq('id', businessId)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business.approve', city.id, 'business', businessId, {});
  revalidatePath('/painel/cidade/comercio');
  revalidatePath('/comercio');
}

export async function rejectBusinessAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      business_id: z.string().uuid(),
      reason: z.string().min(2).max(1000),
    })
    .parse({
      business_id: formData.get('business_id'),
      reason: formData.get('reason'),
    });
  const supabase = await createClient();

  const { error } = await supabase
    .from('businesses')
    .update({ status: 'draft' })
    .eq('id', parsed.business_id)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit('business.reject', city.id, 'business', parsed.business_id, { reason: parsed.reason });
  revalidatePath('/painel/cidade/comercio');
}

export async function reviewClaimAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const parsed = z
    .object({
      claim_id: z.string().uuid(),
      action: z.enum(['approve', 'reject']),
      reason: z.string().max(1000).nullable(),
    })
    .parse({
      claim_id: formData.get('claim_id'),
      action: formData.get('action'),
      reason: formData.get('reason') || null,
    });
  const supabase = await createClient();
  const { data: claim, error: claimError } = await supabase
    .from('business_claims')
    .select('id, business_id, profile_id, businesses(city_id)')
    .eq('id', parsed.claim_id)
    .single();
  if (claimError || !claim) throw claimError;

  const businessCityId = (claim.businesses as { city_id?: string } | null)?.city_id;
  if (businessCityId !== city.id) return;

  if (parsed.action === 'approve') {
    await supabase.from('entity_managers').upsert({
      profile_id: claim.profile_id,
      entity_type: 'business',
      entity_id: claim.business_id,
      role: 'owner',
      invited_by: auth.profile.id,
      accepted_at: new Date().toISOString(),
    });
    await supabase
      .from('businesses')
      .update({ owner_profile_id: claim.profile_id, claimed: true })
      .eq('id', claim.business_id)
      .eq('city_id', city.id);
    await supabase.from('profile_roles').upsert({
      profile_id: claim.profile_id,
      city_id: city.id,
      role: 'merchant',
      granted_by: auth.profile.id,
    });
  }

  await supabase
    .from('business_claims')
    .update({
      status: parsed.action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: auth.profile.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: parsed.action === 'reject' ? parsed.reason : null,
    })
    .eq('id', parsed.claim_id);

  await insertAudit(`business.claim.${parsed.action}`, city.id, 'business_claim', parsed.claim_id, {
    business_id: claim.business_id,
    reason: parsed.reason,
  });
  await createNotification({
    recipientProfileId: claim.profile_id,
    cityId: city.id,
    type: parsed.action === 'approve' ? 'approval.approved' : 'approval.rejected',
    priority: 'high',
    title: parsed.action === 'approve' ? 'Pedido de página aprovado' : 'Pedido de página recusado',
    body: parsed.action === 'approve' ? 'Você já pode gerenciar a página no painel.' : (parsed.reason ?? 'A equipe recusou o pedido de vínculo.'),
    targetUrl: '/painel/comercio',
    entityType: 'business_claim',
    entityId: parsed.claim_id,
    metadata: { business_id: claim.business_id },
  });
  revalidatePath('/painel/cidade/comercio/claims');
  revalidatePath('/painel/cidade/comercio');
}

export async function resolveBusinessReportAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['moderator', 'city_admin', 'super_admin'] });
  const parsed = z
    .object({
      report_id: z.string().uuid(),
      status: z.enum(['reviewed', 'dismissed']),
    })
    .parse({
      report_id: formData.get('report_id'),
      status: formData.get('status'),
    });
  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from('business_reports')
    .select('id, business_id, reason')
    .eq('id', parsed.report_id)
    .eq('city_id', city.id)
    .single();
  if (reportError || !report) throw reportError;

  const { error } = await supabase
    .from('business_reports')
    .update({
      status: parsed.status,
      reviewed_by: auth.profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.report_id)
    .eq('city_id', city.id);
  if (error) throw error;

  await insertAudit(`business.report.${parsed.status}`, city.id, 'business_report', parsed.report_id, {
    business_id: report.business_id,
    reason: report.reason,
  });
  revalidatePath('/painel/cidade/comercio/reports');
}

export async function upsertCategoryAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const scope = formData.get('scope') === 'global' ? null : city.id;
  const parsed = categorySchema.parse({
    id: formData.get('id') || undefined,
    city_id: scope,
    parent_id: formData.get('parent_id') || null,
    slug: formData.get('slug'),
    name: formData.get('name'),
    icon: formData.get('icon') || null,
    display_order: formData.get('display_order') || 0,
    active: formData.get('active') === 'on',
  });

  const supabase = await createClient();
  const { data, error } = await supabase.from('business_categories').upsert(parsed).select('id').single();
  if (error || !data) throw error;

  await insertAudit('business.category.upsert', city.id, 'business_category', data.id, parsed as Json);
  revalidatePath('/painel/cidade/comercio/categorias');
  revalidatePath('/painel/comercio', 'layout');
  revalidatePath('/comercio', 'layout');
}

export async function convertBusinessToAttractionAction(
  ...args: Parameters<typeof convertBusinessToAttractionImpl>
): Promise<Awaited<ReturnType<typeof convertBusinessToAttractionImpl>>> {
  return convertBusinessToAttractionImpl(...args);
}

export async function importCliqueiacheiAction(formData: FormData) {
  const city = await getCurrentCity();
  if (!city) return;

  const auth = await requireRole({ cityId: city.id, kinds: ['city_admin', 'super_admin'] });
  const dryRun = formData.get('dry_run') === 'on';
  const supabase = await createClient();
  const items = await scrapeCliqueiachei();

  if (dryRun) {
    await insertAudit('businesses.import.cliqueiachei.dry_run', city.id, 'business_import', null, {
      count: items.length,
    });
    revalidatePath('/painel/cidade/comercio/import');
    return;
  }

  const { data: districts } = await supabase.from('districts').select('id, name').eq('city_id', city.id);
  const districtByName = new Map((districts ?? []).map((district) => [district.name, district.id]));
  const { data: categories } = await supabase
    .from('business_categories')
    .select('id, slug')
    .or(`city_id.is.null,city_id.eq.${city.id}`);
  const categoryBySlug = new Map((categories ?? []).map((category) => [category.slug, category.id]));

  let count = 0;
  const failures: Array<{ slug: string; message: string }> = [];
  for (const item of items) {
    const payload = {
      city_id: city.id,
      district_id: item.district ? districtByName.get(item.district) ?? null : null,
      slug: item.slug,
      name: item.name,
      short_description: item.shortDescription,
      description: item.description,
      phone: item.phone,
      whatsapp: item.whatsapp,
      email: item.email,
      website: item.website,
      instagram: item.instagram,
      facebook: item.facebook,
      google_maps_url: item.googleMapsUrl,
      address: item.address,
      cep: item.cep,
      lat: item.lat,
      lng: item.lng,
      hours: item.hours ?? {},
      amenities: item.amenities,
      payment_methods: item.paymentMethods,
      status: 'draft' as const,
      owner_profile_id: auth.profile.id,
      claimed: false,
      import_source: {
        source: 'cliqueiachei',
        source_id: item.sourceId,
        imported_at: new Date().toISOString(),
        raw_url: item.rawUrl,
      },
    };
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('city_id', city.id)
      .eq('slug', item.slug)
      .maybeSingle();
    const { data: business, error } = existing
      ? await supabase
          .from('businesses')
          .update(payload)
          .eq('id', existing.id)
          .eq('city_id', city.id)
          .select('id')
          .single()
      : await supabase.from('businesses').insert(payload).select('id').single();

    if (error || !business) {
      failures.push({
        slug: item.slug,
        message: error?.message ?? 'Upsert não retornou a ficha criada.',
      });
      continue;
    }

    const categoryIds = item.categorySlugs
      .map((slug) => categoryBySlug.get(slug))
      .filter((id): id is string => Boolean(id));
    if (categoryIds.length > 0) {
      const primaryCategoryId = categoryBySlug.get(item.primaryCategorySlug) ?? categoryIds[0];
      await supabase.from('business_category_assignments').delete().eq('business_id', business.id);
      const { error: categoryError } = await supabase.from('business_category_assignments').insert(
        categoryIds.map((categoryId) => ({
          business_id: business.id,
          category_id: categoryId,
          is_primary: categoryId === primaryCategoryId,
        })),
      );
      if (categoryError) {
        failures.push({ slug: item.slug, message: categoryError.message });
      }
    }
    count += 1;
  }

  await insertAudit('businesses.import.cliqueiachei', city.id, 'business_import', null, {
    count,
    failures_count: failures.length,
    failures: failures.slice(0, 5),
  });
  if (count === 0 && failures.length > 0) {
    throw new Error(`Import Cliqueiachei falhou: ${failures[0].slug} — ${failures[0].message}`);
  }
  revalidatePath('/painel/cidade/comercio/import');
  revalidatePath('/painel/cidade/comercio');
  revalidatePath('/comercio');
}
