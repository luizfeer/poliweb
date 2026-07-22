const DEFAULT_FALLBACK_MODELS = [
    'google:gemini-2.5-flash-lite',
    'groq:llama-3.3-70b-versatile',
    'groq:llama-3.1-8b-instant',
    'google:gemini-2.0-flash-lite',
];
export function readEnv() {
    const primary = process.env.CITY_AGENT_MODEL ?? 'gemini-2.5-flash-lite';
    const fallbackRaw = process.env.CITY_AGENT_FALLBACK_MODELS;
    const fallbackModels = fallbackRaw
        ? fallbackRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : DEFAULT_FALLBACK_MODELS;
    return {
        port: Number(process.env.PORT ?? 8787),
        supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
        supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
        openAiApiKey: required('OPENAI_API_KEY'),
        googleGenerativeAiApiKey: required('GOOGLE_GENERATIVE_AI_API_KEY'),
        groqApiKey: process.env.GROQ_API_KEY ?? null,
        agentApiToken: process.env.AGENT_API_TOKEN ?? null,
        provider: 'google',
        model: primary,
        fallbackModels,
    };
}
function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
}
