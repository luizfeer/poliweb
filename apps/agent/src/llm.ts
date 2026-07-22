import { google } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import type { AgentEnv } from './config.js';

type GenerateTextArgs = Parameters<typeof generateText>[0];
type GenerateTextResult = Awaited<ReturnType<typeof generateText>>;
type LanguageModel = GenerateTextArgs['model'];
type BaseArgs = Omit<GenerateTextArgs, 'model'>;

type ProviderId = 'google' | 'groq';

const MAX_RETRIES_PER_MODEL = 3;
const BASE_BACKOFF_MS = 500;

function parseSpec(spec: string): { provider: ProviderId; modelId: string } {
  if (spec.includes(':')) {
    const [provider, ...rest] = spec.split(':');
    const modelId = rest.join(':');
    if (provider === 'google' || provider === 'groq') {
      return { provider, modelId };
    }
  }
  return { provider: 'google', modelId: spec };
}

function buildModel(spec: string, env: AgentEnv): LanguageModel | null {
  const { provider, modelId } = parseSpec(spec);
  if (provider === 'google') {
    return google(modelId);
  }
  if (provider === 'groq') {
    if (!env.groqApiKey) return null;
    const groq = createGroq({ apiKey: env.groqApiKey });
    return groq(modelId);
  }
  return null;
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as Record<string, unknown>;
  const status =
    typeof anyErr.statusCode === 'number'
      ? anyErr.statusCode
      : typeof anyErr.status === 'number'
        ? anyErr.status
        : null;
  if (status === 429 || status === 503) return true;
  const message =
    typeof anyErr.message === 'string'
      ? anyErr.message
      : err instanceof Error
        ? err.message
        : '';
  return /RESOURCE_EXHAUSTED|quota|rate.?limit|overloaded|too many requests/i.test(message);
}

function isRetryableError(err: unknown): boolean {
  if (isQuotaError(err)) return true;
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as Record<string, unknown>;
  const status =
    typeof anyErr.statusCode === 'number'
      ? anyErr.statusCode
      : typeof anyErr.status === 'number'
        ? anyErr.status
        : null;
  return status === 500 || status === 502 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ResolvedModel = {
  result: GenerateTextResult;
  modelSpec: string;
  modelId: string;
};

/**
 * Tenta gerar texto encadeando modelos: para cada um, tenta MAX_RETRIES_PER_MODEL
 * vezes com backoff exponencial em erros de cota/transientes. Em quota persistente
 * passa pro próximo. Outros erros estouram na hora.
 */
export async function generateTextWithFallback(
  baseArgs: BaseArgs,
  env: AgentEnv,
  preferredModelSpec?: string,
): Promise<ResolvedModel> {
  const primary = preferredModelSpec ?? env.model;
  const sequence = [primary, ...env.fallbackModels.filter((m) => m !== primary)];

  let lastError: unknown = new Error('No models available');

  for (const spec of sequence) {
    const model = buildModel(spec, env);
    if (!model) continue;

    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const result = await generateText({ ...baseArgs, model } as GenerateTextArgs);
        const { modelId } = parseSpec(spec);
        return { result, modelSpec: spec, modelId };
      } catch (err) {
        lastError = err;
        const quota = isQuotaError(err);
        const retryable = isRetryableError(err);

        if (quota && attempt === MAX_RETRIES_PER_MODEL - 1) {
          console.warn(
            `[llm] quota exhausted on ${spec} after ${attempt + 1} attempts, falling back`,
          );
          break;
        }
        if (!retryable) {
          throw err;
        }

        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 200);
        await sleep(backoff + jitter);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All LLM providers failed without raising an Error');
}
