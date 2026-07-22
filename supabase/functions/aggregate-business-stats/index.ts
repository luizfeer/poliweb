const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'missing_env' }, 500);

  const authHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  try {
    // 1. Agregar eventos do dia anterior
    const aggregateRes = await fetch(`${supabaseUrl}/rest/v1/rpc/aggregate_business_daily_stats`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ p_date: dateStr }),
    });

    if (!aggregateRes.ok) {
      const err = await aggregateRes.text();
      return json({ error: 'aggregate_failed', details: err }, 500);
    }

    // 2. Limpar eventos com mais de 90 dias
    const purgeRes = await fetch(`${supabaseUrl}/rest/v1/rpc/purge_old_business_events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });

    let deletedCount = 0;
    if (purgeRes.ok) {
      const purgeResult = await purgeRes.json();
      deletedCount = purgeResult ?? 0;
    }

    return json({
      ok: true,
      date: dateStr,
      deleted_events: deletedCount,
    });
  } catch (err) {
    return json({ error: 'exception', message: String(err) }, 500);
  }
});
