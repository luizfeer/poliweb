import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../runtime/env.js';
import { logger } from '../runtime/logger.js';
import { buildSupabase } from './email/supabase-client.js';

const OVERDUE_TOLERANCE_DAYS = 5;

type LeadRow = {
  id: string;
  city_id: string;
  profile_id: string;
  business_id: string | null;
  business_name: string;
  email: string;
  trial_ends_at: string | null;
  nudge_d7_sent_at: string | null;
  nudge_d2_sent_at: string | null;
  overdue_unpublished_at: string | null;
  asaas_subscription_status: string | null;
  asaas_next_due_date: string | null;
  asaas_payment_link: string | null;
};

const LEAD_SELECT =
  'id, city_id, profile_id, business_id, business_name, email, trial_ends_at, nudge_d7_sent_at, nudge_d2_sent_at, overdue_unpublished_at, asaas_subscription_status, asaas_next_due_date, asaas_payment_link';

type Summary = {
  d7_nudges: number;
  d2_nudges: number;
  overdue_unpublished: number;
  errors: string[];
};

export async function runBusinessTrialNudges(env: WorkerEnv): Promise<void> {
  const supabase = buildSupabase(env);
  const summary: Summary = {
    d7_nudges: 0,
    d2_nudges: 0,
    overdue_unpublished: 0,
    errors: [],
  };
  const now = Date.now();

  await processNudgeBucket(supabase, summary, {
    label: 'd7',
    column: 'nudge_d7_sent_at',
    type: 'subscription.trial_ending_d7',
    priority: 'normal',
    title: 'Seu trial termina em 7 dias',
    bodyFor: (lead) =>
      `O trial gratuito de "${lead.business_name}" termina em uma semana. Cadastre sua forma de pagamento para manter a ficha publicada.`,
    rangeLowMs: now + 6 * 86400_000,
    rangeHighMs: now + 7 * 86400_000,
    countKey: 'd7_nudges',
  });

  await processNudgeBucket(supabase, summary, {
    label: 'd2',
    column: 'nudge_d2_sent_at',
    type: 'subscription.trial_ending_d2',
    priority: 'high',
    title: 'Último aviso: trial termina em 2 dias',
    bodyFor: (lead) =>
      `O trial gratuito de "${lead.business_name}" termina em 2 dias. Se não cadastrar pagamento, a ficha pode ser despublicada após 5 dias de atraso.`,
    rangeLowMs: now + 1 * 86400_000,
    rangeHighMs: now + 2 * 86400_000,
    countKey: 'd2_nudges',
  });

  await processOverdue(supabase, summary, now);

  logger.info('business:trial-nudges summary', summary);
}

type NudgeBucket = {
  label: string;
  column: 'nudge_d7_sent_at' | 'nudge_d2_sent_at';
  type: string;
  priority: 'normal' | 'high';
  title: string;
  bodyFor: (lead: LeadRow) => string;
  rangeLowMs: number;
  rangeHighMs: number;
  countKey: 'd7_nudges' | 'd2_nudges';
};

async function processNudgeBucket(
  supabase: SupabaseClient,
  summary: Summary,
  bucket: NudgeBucket,
): Promise<void> {
  const { data, error } = await supabase
    .from('business_leads')
    .select(LEAD_SELECT)
    .eq('status', 'approved')
    .is(bucket.column, null)
    .gte('trial_ends_at', new Date(bucket.rangeLowMs).toISOString())
    .lt('trial_ends_at', new Date(bucket.rangeHighMs).toISOString());

  if (error) {
    summary.errors.push(`${bucket.label} query: ${error.message}`);
    return;
  }

  for (const lead of (data ?? []) as LeadRow[]) {
    try {
      await insertNotification(supabase, {
        recipientProfileId: lead.profile_id,
        cityId: lead.city_id,
        type: bucket.type,
        audience: 'user',
        priority: bucket.priority,
        title: bucket.title,
        body: bucket.bodyFor(lead),
        targetUrl: '/painel/comercio/assinatura',
        metadata: { email_to: lead.email },
        entityId: lead.id,
        enqueueEmail: true,
      });
      await supabase
        .from('business_leads')
        .update({ [bucket.column]: new Date().toISOString() })
        .eq('id', lead.id);
      summary[bucket.countKey] += 1;
    } catch (err) {
      summary.errors.push(
        `${bucket.label} ${lead.id}: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }
}

async function processOverdue(
  supabase: SupabaseClient,
  summary: Summary,
  now: number,
): Promise<void> {
  const overdueCutoff = new Date(now - OVERDUE_TOLERANCE_DAYS * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('business_leads')
    .select(LEAD_SELECT)
    .eq('status', 'approved')
    .is('overdue_unpublished_at', null)
    .eq('asaas_subscription_status', 'OVERDUE')
    .not('asaas_next_due_date', 'is', null)
    .lte('asaas_next_due_date', overdueCutoff);

  if (error) {
    summary.errors.push(`overdue query: ${error.message}`);
    return;
  }

  for (const lead of (data ?? []) as LeadRow[]) {
    if (!lead.business_id) continue;
    try {
      await supabase
        .from('businesses')
        .update({ status: 'draft' })
        .eq('id', lead.business_id)
        .eq('status', 'published');

      await supabase
        .from('business_leads')
        .update({ overdue_unpublished_at: new Date().toISOString() })
        .eq('id', lead.id);

      await insertNotification(supabase, {
        recipientProfileId: lead.profile_id,
        cityId: lead.city_id,
        type: 'subscription.overdue_unpublished',
        audience: 'user',
        priority: 'urgent',
        title: 'Ficha despublicada por pagamento em atraso',
        body: `"${lead.business_name}" saiu do ar após 5 dias de inadimplência. Regularize o pagamento para republicar.`,
        targetUrl: '/painel/comercio/assinatura',
        metadata: { email_to: lead.email },
        entityId: lead.id,
        enqueueEmail: true,
      });

      const { data: admins } = await supabase
        .from('profile_roles')
        .select('profile_id')
        .eq('city_id', lead.city_id)
        .in('role', ['city_admin', 'super_admin']);

      const recipientIds = new Set((admins ?? []).map((row) => row.profile_id as string));
      for (const adminId of recipientIds) {
        await insertNotification(supabase, {
          recipientProfileId: adminId,
          cityId: lead.city_id,
          type: 'subscription.overdue_unpublished',
          audience: 'city_admin',
          priority: 'high',
          title: `Ficha despublicada: ${lead.business_name}`,
          body: 'Despublicada automaticamente por 5 dias de pagamento em atraso.',
          targetUrl: '/painel/cidade/comercio/leads?status=approved',
          metadata: { lead_id: lead.id },
          entityId: lead.id,
          enqueueEmail: false,
        });
      }

      summary.overdue_unpublished += 1;
    } catch (err) {
      summary.errors.push(
        `overdue ${lead.id}: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }
}

type InsertNotificationArgs = {
  recipientProfileId: string;
  cityId: string;
  type: string;
  audience: 'user' | 'city_admin';
  priority: 'normal' | 'high' | 'urgent';
  title: string;
  body: string;
  targetUrl: string;
  metadata: Record<string, unknown>;
  entityId?: string;
  enqueueEmail?: boolean;
};

async function insertNotification(
  supabase: SupabaseClient,
  args: InsertNotificationArgs,
): Promise<void> {
  const { data: notif, error } = await supabase
    .from('notifications')
    .insert({
      recipient_profile_id: args.recipientProfileId,
      city_id: args.cityId,
      type: args.type,
      audience: args.audience,
      priority: args.priority,
      title: args.title,
      body: args.body,
      target_url: args.targetUrl,
      metadata: args.metadata,
      entity_type: 'business_lead',
      entity_id: args.entityId ?? null,
    })
    .select('id')
    .single();

  if (error || !notif) {
    throw new Error(`notifications insert failed: ${error?.message ?? 'unknown'}`);
  }

  await supabase.from('notification_deliveries').insert([
    { notification_id: notif.id, channel: 'in_app', status: 'sent' },
    {
      notification_id: notif.id,
      channel: 'email',
      status: args.enqueueEmail ? 'pending' : 'skipped',
      provider: 'brevo',
    },
    { notification_id: notif.id, channel: 'push', status: 'skipped', provider: 'firebase' },
  ]);
}
