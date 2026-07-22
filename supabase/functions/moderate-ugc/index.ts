type EntityType =
  | 'event'
  | 'classified'
  | 'lost_pet'
  | 'lost_and_found'
  | 'community_group'
  | 'community_group_post'
  | 'business_review';

type ModerateRequest = {
  entity_type?: EntityType;
  entity_id?: string;
  review_id?: string;
};

type EntityPayload = {
  city_id: string | null;
  title: string;
  description: string;
  table: string;
  statusColumn: 'status' | 'moderation_status';
};

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

function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function restGet<T>(url: string, headers: Record<string, string>): Promise<T[]> {
  const response = await fetch(url, { headers });
  return asRows<T>(await response.json());
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!supabaseUrl || !serviceRoleKey || !anthropicKey) return json({ error: 'missing_env' }, 500);

  const payload = (await request.json()) as ModerateRequest;
  const entityType = payload.entity_type ?? (payload.review_id ? 'business_review' : undefined);
  const entityId = payload.entity_id ?? payload.review_id;
  if (!entityType || !entityId) return json({ error: 'entity_required' }, 400);

  const authHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  const entity = await loadEntity(supabaseUrl, authHeaders, entityType, entityId);
  if (!entity) return json({ error: 'entity_not_found' }, 404);

  const jobResponse = await fetch(`${supabaseUrl}/rest/v1/ai_jobs`, {
    method: 'POST',
    headers: { ...authHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      city_id: entity.city_id,
      job_type: 'moderate_ugc',
      status: 'running',
      model: 'claude-haiku-4-5-20251001',
      input_ref: { entity_type: entityType, entity_id: entityId },
      started_at: new Date().toISOString(),
    }),
  });
  const jobs = asRows<{ id: string }>(await jobResponse.json());
  const jobId = jobs[0]?.id;

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: 'Classifique UGC hiperlocal em portugues. Responda apenas safe, borderline ou unsafe.',
      messages: [
        {
          role: 'user',
          content: `Tipo: ${entityType}\nTitulo: ${entity.title}\nDescricao: ${entity.description}`,
        },
      ],
    }),
  });
  const result = (await anthropicResponse.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const label = result.content?.find((item) => item.type === 'text')?.text?.toLowerCase().trim() ?? 'borderline';
  const status = label === 'safe' ? 'published' : label === 'unsafe' ? 'rejected' : 'pending';

  await fetch(`${supabaseUrl}/rest/v1/${entity.table}?id=eq.${entityId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ [entity.statusColumn]: status }),
  });

  if (jobId) {
    await fetch(`${supabaseUrl}/rest/v1/ai_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'completed',
        output_ref: { label, entity_status: status },
        tokens_input: result.usage?.input_tokens ?? null,
        tokens_output: result.usage?.output_tokens ?? null,
        finished_at: new Date().toISOString(),
      }),
    });
  }

  return json({ entity_type: entityType, entity_id: entityId, label, status });
});

async function loadEntity(
  supabaseUrl: string,
  headers: Record<string, string>,
  entityType: EntityType,
  entityId: string,
): Promise<EntityPayload | null> {
  if (entityType === 'event') {
    const rows = await restGet<{ city_id: string; title: string; description: string | null }>(
      `${supabaseUrl}/rest/v1/events?id=eq.${entityId}&select=city_id,title,description`,
      headers,
    );
    const row = rows[0];
    return row ? { city_id: row.city_id, title: row.title, description: row.description ?? '', table: 'events', statusColumn: 'status' } : null;
  }
  if (entityType === 'classified') {
    const rows = await restGet<{ city_id: string; title: string; description: string | null }>(
      `${supabaseUrl}/rest/v1/classifieds?id=eq.${entityId}&select=city_id,title,description`,
      headers,
    );
    const row = rows[0];
    return row ? { city_id: row.city_id, title: row.title, description: row.description ?? '', table: 'classifieds', statusColumn: 'status' } : null;
  }
  if (entityType === 'lost_pet') {
    const rows = await restGet<{ city_id: string; pet_name: string | null; species: string | null; description: string | null }>(
      `${supabaseUrl}/rest/v1/lost_pets?id=eq.${entityId}&select=city_id,pet_name,species,description`,
      headers,
    );
    const row = rows[0];
    return row ? { city_id: row.city_id, title: row.pet_name ?? row.species ?? 'Pet', description: row.description ?? '', table: 'lost_pets', statusColumn: 'moderation_status' } : null;
  }
  if (entityType === 'lost_and_found') {
    const rows = await restGet<{ city_id: string; item_description: string; category: string | null }>(
      `${supabaseUrl}/rest/v1/lost_and_found?id=eq.${entityId}&select=city_id,item_description,category`,
      headers,
    );
    const row = rows[0];
    return row ? { city_id: row.city_id, title: row.item_description, description: row.category ?? '', table: 'lost_and_found', statusColumn: 'moderation_status' } : null;
  }
  if (entityType === 'community_group') {
    const rows = await restGet<{ city_id: string; name: string; description: string | null }>(
      `${supabaseUrl}/rest/v1/community_groups?id=eq.${entityId}&select=city_id,name,description`,
      headers,
    );
    const row = rows[0];
    return row ? { city_id: row.city_id, title: row.name, description: row.description ?? '', table: 'community_groups', statusColumn: 'status' } : null;
  }
  if (entityType === 'community_group_post') {
    const rows = await restGet<{ city_id: string; title: string; body: string | null }>(
      `${supabaseUrl}/rest/v1/community_group_posts?id=eq.${entityId}&select=city_id,title,body`,
      headers,
    );
    const row = rows[0];
    return row ? { city_id: row.city_id, title: row.title, description: row.body ?? '', table: 'community_group_posts', statusColumn: 'status' } : null;
  }
  const rows = await restGet<{ business_id: string; title: string | null; comment: string | null }>(
    `${supabaseUrl}/rest/v1/business_reviews?id=eq.${entityId}&select=business_id,title,comment`,
    headers,
  );
  const row = rows[0];
  return row ? { city_id: null, title: row.title ?? 'Review', description: row.comment ?? '', table: 'business_reviews', statusColumn: 'status' } : null;
}
