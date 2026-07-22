const PRICE_USD_PER_MTOK = {
    'gemini-2.5-flash-lite': { in: 0.1, out: 0.4 },
    'gemini-2.0-flash-lite': { in: 0.075, out: 0.3 },
    'gemini-1.5-flash-8b': { in: 0.0375, out: 0.15 },
    'llama-3.3-70b-versatile': { in: 0.59, out: 0.79 },
    'llama-3.1-8b-instant': { in: 0.05, out: 0.08 },
};
export function costUsd(model, usage) {
    const key = model.includes(':') ? model.split(':')[1] : model;
    const price = key ? PRICE_USD_PER_MTOK[key] : undefined;
    if (!price)
        return 0;
    return ((usage.inputTokens ?? 0) * price.in + (usage.outputTokens ?? 0) * price.out) / 1_000_000;
}
