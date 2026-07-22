import { google } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
const MAX_RETRIES_PER_MODEL = 3;
const BASE_BACKOFF_MS = 500;
function parseSpec(spec) {
    if (spec.includes(':')) {
        const [provider, ...rest] = spec.split(':');
        const modelId = rest.join(':');
        if (provider === 'google' || provider === 'groq') {
            return { provider, modelId };
        }
    }
    return { provider: 'google', modelId: spec };
}
function buildModel(spec, env) {
    const { provider, modelId } = parseSpec(spec);
    if (provider === 'google') {
        return google(modelId);
    }
    if (provider === 'groq') {
        if (!env.groqApiKey)
            return null;
        const groq = createGroq({ apiKey: env.groqApiKey });
        return groq(modelId);
    }
    return null;
}
function isQuotaError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const anyErr = err;
    const status = typeof anyErr.statusCode === 'number'
        ? anyErr.statusCode
        : typeof anyErr.status === 'number'
            ? anyErr.status
            : null;
    if (status === 429 || status === 503)
        return true;
    const message = typeof anyErr.message === 'string'
        ? anyErr.message
        : err instanceof Error
            ? err.message
            : '';
    return /RESOURCE_EXHAUSTED|quota|rate.?limit|overloaded|too many requests/i.test(message);
}
function isRetryableError(err) {
    if (isQuotaError(err))
        return true;
    if (!err || typeof err !== 'object')
        return false;
    const anyErr = err;
    const status = typeof anyErr.statusCode === 'number'
        ? anyErr.statusCode
        : typeof anyErr.status === 'number'
            ? anyErr.status
            : null;
    return status === 500 || status === 502 || status === 504;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Tenta gerar texto encadeando modelos: para cada um, tenta MAX_RETRIES_PER_MODEL
 * vezes com backoff exponencial em erros de cota/transientes. Em quota persistente
 * passa pro próximo. Outros erros estouram na hora.
 */
export async function generateTextWithFallback(baseArgs, env, preferredModelSpec) {
    const primary = preferredModelSpec ?? env.model;
    const sequence = [primary, ...env.fallbackModels.filter((m) => m !== primary)];
    let lastError = new Error('No models available');
    for (const spec of sequence) {
        const model = buildModel(spec, env);
        if (!model)
            continue;
        for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
            try {
                const result = await generateText({ ...baseArgs, model });
                const { modelId } = parseSpec(spec);
                return { result, modelSpec: spec, modelId };
            }
            catch (err) {
                lastError = err;
                const quota = isQuotaError(err);
                const retryable = isRetryableError(err);
                if (quota && attempt === MAX_RETRIES_PER_MODEL - 1) {
                    console.warn(`[llm] quota exhausted on ${spec} after ${attempt + 1} attempts, falling back`);
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
