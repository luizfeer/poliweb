/** Token bucket em memória. 10 req/min, acumula até 30. */
const buckets = new Map();
const MAX_TOKENS = 30;
const REFILL_RATE = 10; // tokens por minuto
const REFILL_INTERVAL_MS = 60_000;
export function checkRateLimit(identifier) {
    const now = Date.now();
    let bucket = buckets.get(identifier);
    if (!bucket) {
        bucket = { tokens: MAX_TOKENS, lastRefill: now };
        buckets.set(identifier, bucket);
    }
    const elapsed = now - bucket.lastRefill;
    const intervals = Math.floor(elapsed / REFILL_INTERVAL_MS);
    if (intervals > 0) {
        bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + intervals * REFILL_RATE);
        bucket.lastRefill = now;
    }
    if (bucket.tokens > 0) {
        bucket.tokens--;
        return { allowed: true };
    }
    const retryAfterSeconds = Math.ceil((REFILL_INTERVAL_MS - (elapsed % REFILL_INTERVAL_MS)) / 1000);
    return { allowed: false, retryAfterSeconds };
}
