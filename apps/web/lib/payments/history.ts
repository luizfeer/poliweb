import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type PaymentHistoryEvent = {
  id: string;
  event_type: string;
  provider_status: string | null;
  message: string | null;
  created_at: string;
};

export type PaymentHistoryRow = {
  id: string;
  city_id: string | null;
  profile_id: string | null;
  provider_payment_id: string | null;
  provider_subscription_id: string | null;
  source_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  amount_cents: number;
  net_amount_cents: number | null;
  status: string;
  billing_type: string | null;
  invoice_url: string | null;
  due_date: string | null;
  paid_at: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  portal_payment_events?: PaymentHistoryEvent[];
  cities?: {
    name: string;
    state: string;
  } | null;
  profiles?: {
    full_name: string | null;
  } | null;
};

type LooseDbResult = {
  data: unknown;
  error: { message: string } | null;
};

type LooseQuery = {
  select(columns?: string): LooseQuery;
  eq(column: string, value: unknown): LooseQuery;
  order(column: string, options?: { ascending?: boolean; foreignTable?: string }): LooseQuery;
  limit(count: number): LooseQuery;
  then<TResult1 = LooseDbResult, TResult2 = never>(
    onfulfilled?: ((value: LooseDbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
};

type LooseClient = {
  from(table: string): LooseQuery;
};

function asLooseClient(client: Awaited<ReturnType<typeof createClient>>): LooseClient {
  return client as unknown as LooseClient;
}

const PAYMENT_HISTORY_SELECT = `
  id,
  city_id,
  profile_id,
  provider_payment_id,
  provider_subscription_id,
  source_type,
  entity_type,
  entity_id,
  description,
  amount_cents,
  net_amount_cents,
  status,
  billing_type,
  invoice_url,
  due_date,
  paid_at,
  external_reference,
  created_at,
  updated_at,
  cities(name, state),
  profiles(full_name),
  portal_payment_events(
    id,
    event_type,
    provider_status,
    message,
    created_at
  )
`;

export async function getUserPaymentHistory(profileId: string): Promise<PaymentHistoryRow[]> {
  const supabase = asLooseClient(await createClient());
  const { data, error } = await supabase
    .from('portal_payments')
    .select(PAYMENT_HISTORY_SELECT)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data as PaymentHistoryRow[] | null) ?? [];
}

export async function getSuperPaymentHistory(): Promise<PaymentHistoryRow[]> {
  const supabase = asLooseClient(await createClient());
  const { data, error } = await supabase
    .from('portal_payments')
    .select(PAYMENT_HISTORY_SELECT)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data as PaymentHistoryRow[] | null) ?? [];
}
