import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const trackSchema = z.object({
  businessId: z.string().uuid(),
  cityId: z.string().uuid(),
  eventType: z.enum([
    'view',
    'phone_click',
    'whatsapp_click',
    'website_click',
    'directions_click',
    'share',
    'favorite_add',
  ]),
  source: z.string().optional(),
  referrer: z.string().optional(),
  sessionHash: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const { businessId, cityId, eventType, source, referrer, sessionHash } = parsed.data;

  const supabase = await createClient();
  // Analytics não pode derrubar a interação pública se o insert falhar.
  const { error } = await (supabase as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message: string } | null }>;
    };
  })
    .from('business_page_events')
    .insert({
      business_id: businessId,
      city_id: cityId,
      event_type: eventType,
      session_hash: sessionHash,
      source: source ?? null,
      referrer: referrer ?? null,
      occurred_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[business-analytics] failed to track client event', {
      businessId,
      cityId,
      eventType,
      code: error.code,
      message: error.message,
    });
  }

  return NextResponse.json({ ok: true });
}
