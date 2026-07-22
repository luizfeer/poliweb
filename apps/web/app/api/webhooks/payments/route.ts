import { NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const gateway = getPaymentGateway();
  const payload = await gateway.parseWebhook(request);

  if (payload.entityType === 'classified') {
    const supabase = await createClient();
    await supabase
      .from('classifieds')
      .update({
        payment_status: payload.status === 'paid' ? 'paid' : 'pending',
        payment_provider_ref: payload.providerReference,
        status: payload.status === 'paid' ? 'pending' : 'draft',
        review_status: 'pending',
      })
      .eq('id', payload.entityId);

    return NextResponse.json({ ok: true });
  }

  if (payload.entityType !== 'property') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = await createClient();
  await supabase
    .from('properties')
    .update({
      payment_status: payload.status === 'paid' ? 'paid' : 'pending',
      payment_provider_ref: payload.providerReference,
      status: payload.status === 'paid' ? 'pending' : 'draft',
      review_status: 'pending',
    })
    .eq('id', payload.entityId);

  return NextResponse.json({ ok: true });
}
