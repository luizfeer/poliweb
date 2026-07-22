import 'server-only';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createToken, getSiteUrl, hashText, hashToken } from './tokens';
import { sendNewsletterEmail } from './email';

export const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  city_slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  source: z.string().trim().min(2).max(80).default('site'),
});

export async function subscribeToNewsletter(input: z.infer<typeof subscribeSchema>, request?: Request) {
  const parsed = subscribeSchema.parse(input);
  const supabase = await createClient();
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id, name, slug')
    .eq('slug', parsed.city_slug)
    .maybeSingle();
  if (cityError || !city) throw cityError ?? new Error('Cidade nao encontrada.');

  const confirmationToken = createToken();
  const unsubscribeToken = createToken();
  const payload = {
    city_id: city.id,
    email: parsed.email.toLowerCase(),
    source: parsed.source,
    consent_text_version: '2026-05-01',
    confirmation_token_hash: hashToken(confirmationToken),
    unsubscribe_token_hash: hashToken(unsubscribeToken),
    confirmed_at: null,
    unsubscribed_at: null,
  };

  const { error } = await supabase.from('newsletter_subscribers').insert(payload);
  if (error?.code === '23505') {
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update(payload)
      .eq('city_id', city.id)
      .eq('email', parsed.email.toLowerCase());
    if (updateError) throw updateError;
  } else if (error) {
    throw error;
  }

  await logConsent({
    cityId: city.id,
    email: parsed.email.toLowerCase(),
    event: 'subscribe',
    source: parsed.source,
    request,
  });

  const siteUrl = getSiteUrl();
  const confirmUrl = `${siteUrl}/newsletter/confirmar?token=${confirmationToken}`;
  const cancelUrl = `${siteUrl}/newsletter/cancelar?token=${unsubscribeToken}`;
  await sendNewsletterEmail({
    to: parsed.email,
    subject: `Confirme sua newsletter do ${city.name}`,
    html: `<p>Confirme sua inscricao na newsletter do Portal Carmelitano.</p><p><a href="${confirmUrl}">Confirmar inscricao</a></p><p>Se nao foi voce, cancele aqui: <a href="${cancelUrl}">cancelar</a>.</p>`,
    headers: {
      'List-Unsubscribe': `<${cancelUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  return { ok: true };
}

export async function logConsent({
  cityId,
  email,
  event,
  source,
  request,
}: {
  cityId: string;
  email: string;
  event: 'subscribe' | 'confirm' | 'unsubscribe' | 'export' | 'delete_request';
  source?: string | null;
  request?: Request;
}) {
  const supabase = await createClient();
  const ip = request?.headers.get('x-forwarded-for') ?? request?.headers.get('x-real-ip');
  const userAgent = request?.headers.get('user-agent');
  await supabase.from('newsletter_consent_history').insert({
    city_id: cityId,
    email,
    event,
    source,
    consent_text_version: '2026-05-01',
    ip_hash: hashText(ip ?? null),
    user_agent_hash: hashText(userAgent ?? null),
  });
}
