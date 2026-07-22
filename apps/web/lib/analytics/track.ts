import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type BusinessEventType =
  | 'view'
  | 'phone_click'
  | 'whatsapp_click'
  | 'website_click'
  | 'directions_click'
  | 'share'
  | 'favorite_add';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type BusinessTrackAfterContext = {
  supabase: SupabaseServerClient;
  sessionHash: string;
  source: string;
  referrer: string | null;
};

async function sessionHashFromHeaders(h: Headers): Promise<string> {
  const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown';
  const ua = h.get('user-agent') ?? 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  const raw = `${ip}:${ua}:${today}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 64);
}

function detectSourceFromHeaders(h: Headers): string {
  const referrer = h.get('referer') ?? '';
  const host = h.get('host') ?? '';

  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    if (url.host === host) return 'internal';
    if (url.host.includes('google')) return 'search';
    if (url.host.includes('instagram')) return 'social';
    if (url.host.includes('facebook')) return 'social';
    if (url.host.includes('whatsapp')) return 'social';
    return 'external';
  } catch {
    return 'unknown';
  }
}

function referrerHostFromHeaders(h: Headers): string | null {
  const ref = h.get('referer');
  if (!ref) return null;
  try {
    return new URL(ref).hostname;
  } catch {
    return null;
  }
}

/**
 * Use before `after()` in Server Components: `headers()` / `cookies()` (via createClient)
 * are not allowed inside the `after` callback there.
 */
export async function captureBusinessTrackAfterContext(): Promise<BusinessTrackAfterContext> {
  const [h, supabase] = await Promise.all([headers(), createClient()]);
  const sessionHash = await sessionHashFromHeaders(h);
  return {
    supabase,
    sessionHash,
    source: detectSourceFromHeaders(h),
    referrer: referrerHostFromHeaders(h),
  };
}

export async function detectSource(): Promise<string> {
  const h = await headers();
  return detectSourceFromHeaders(h);
}

export async function trackBusinessEvent(input: {
  businessId: string;
  cityId: string;
  eventType: BusinessEventType;
  source?: string;
  referrer?: string | null;
  /** When calling from `after()` in a Server Component, pass the result of `captureBusinessTrackAfterContext()`. */
  afterContext?: BusinessTrackAfterContext;
}) {
  const afterContext = input.afterContext;
  const supabase = afterContext?.supabase ?? (await createClient());

  let sessionHash: string;
  let detectedSource: string;
  let referrer: string | null;

  if (afterContext) {
    sessionHash = afterContext.sessionHash;
    detectedSource = input.source ?? afterContext.source;
    referrer = input.referrer !== undefined ? input.referrer : afterContext.referrer;
  } else {
    const h = await headers();
    sessionHash = await sessionHashFromHeaders(h);
    detectedSource = input.source ?? detectSourceFromHeaders(h);
    referrer = input.referrer !== undefined ? input.referrer : referrerHostFromHeaders(h);
  }

  const { error } = await (supabase as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message: string } | null }>;
    };
  }).from('business_page_events').insert({
    business_id: input.businessId,
    city_id: input.cityId,
    event_type: input.eventType,
    session_hash: sessionHash,
    source: detectedSource,
    referrer,
    occurred_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[business-analytics] failed to track event', {
      businessId: input.businessId,
      cityId: input.cityId,
      eventType: input.eventType,
      code: error.code,
      message: error.message,
    });
  }
}
