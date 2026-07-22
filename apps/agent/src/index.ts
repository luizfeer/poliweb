import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { z } from 'zod';
import { guardQuery } from './context-guard.js';
import { readEnv } from './config.js';
import { runCityAgent } from './city-agent.js';
import { getCityBySlug } from './entities.js';
import { checkRateLimit } from './rate-limit.js';
import { initRouter } from './router.js';
import { cacheKey, dedupeInflight, getCached, isCacheable, setCached } from './response-cache.js';
import { createServiceClient } from './supabase.js';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
});

const requestSchema = z.object({
  query: z.string().min(2).max(500).trim(),
  profileId: z.string().uuid().nullable().optional(),
  channel: z.enum(['web', 'whatsapp', 'n8n']).optional(),
  conversation: z.array(messageSchema).max(20).optional(),
  pageContext: z.string().max(200).nullable().optional(),
  isFirstMessage: z.boolean().optional(),
});

const env = readEnv();
const supabase = createServiceClient(env);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    const match = url.pathname.match(/^\/v1\/cities\/([^/]+)\/ask$/);
    if (req.method !== 'POST' || !match) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    if (env.agentApiToken && req.headers.authorization !== `Bearer ${env.agentApiToken}`) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    const body = requestSchema.safeParse(await readJson(req));
    if (!body.success) {
      sendJson(res, 400, { error: 'Invalid request' });
      return;
    }

    const city = await getCityBySlug(supabase, decodeURIComponent(match[1] ?? ''));
    if (!city) {
      sendJson(res, 404, { error: 'City not found' });
      return;
    }

    // Rate limit por IP (ou profileId como fallback)
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown';
    const rateId = body.data.profileId ? `prof:${body.data.profileId}` : `ip:${clientIp}`;
    const rateResult = checkRateLimit(rateId);
    if (!rateResult.allowed) {
      sendJson(res, 429, {
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: rateResult.retryAfterSeconds,
      });
      return;
    }

    // Context guard
    const guard = guardQuery(body.data.query, city.name);
    if (!guard.allowed) {
      sendJson(res, 200, {
        blocks: [{ type: 'fallback', text: guard.reason }],
        fallback: true,
        intent: 'off_topic',
        model: env.model,
      });
      return;
    }

    const conversation = body.data.conversation ?? [];
    const isFirstMessage = body.data.isFirstMessage ?? conversation.length === 0;
    const cacheable = isCacheable({
      query: body.data.query,
      isFirstMessage,
      hasConversation: conversation.length > 0,
    });
    const key = cacheKey(city.slug, body.data.query);

    if (cacheable) {
      const hit = getCached(key);
      if (hit) {
        sendJson(res, 200, hit);
        return;
      }
    }

    const result = cacheable
      ? await dedupeInflight(key, () =>
          runCityAgent({
            supabase,
            env,
            query: body.data.query,
            cityId: city.id,
            cityName: city.name,
            profileId: body.data.profileId ?? null,
            channel: body.data.channel ?? 'web',
            conversation,
            pageContext: body.data.pageContext ?? null,
            isFirstMessage,
          }),
        )
      : await runCityAgent({
          supabase,
          env,
          query: body.data.query,
          cityId: city.id,
          cityName: city.name,
          profileId: body.data.profileId ?? null,
          channel: body.data.channel ?? 'web',
          conversation,
          pageContext: body.data.pageContext ?? null,
          isFirstMessage,
        });

    if (cacheable) setCached(key, result);

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Internal error' });
  }
});

// Pre-carrega embeddings do FAQ no startup (assíncrono, não bloqueia)
initRouter(env).catch((e) => console.error('[router] failed to init embeddings:', e));

server.listen(env.port, () => {
  console.log(`city agent listening on :${env.port}`);
});

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
