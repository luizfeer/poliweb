declare const process: {
  env: Record<string, string | undefined>
  argv: string[]
  exit(code?: number): never
}

export type WorkerEnv = {
  supabaseUrl: string
  supabaseServiceRoleKey: string
  citySlug: string
  googlePlacesApiKey: string | null
  googleRoutesApiKey: string | null
  r2Endpoint: string | null
  r2Bucket: string | null
  r2AccessKeyId: string | null
  r2SecretAccessKey: string | null
  r2PublicBaseUrl: string | null
  openAiApiKey: string | null
  openAiSummaryModel: string
  openAiEmbeddingModel: string
  aiMonthlyBudgetUsd: number
  httpTimeoutMs: number
  maxRetries: number
  appUrl: string
  mediaProcessorUrl: string | null
  mediaProcessorSecret: string | null
  expoAccessToken: string | null
  vapidPublicKey: string
  vapidPrivateKey: string
  vapidSubject: string
  pushPollIntervalMs: number
  pushBatchSize: number
}

export function readEnv(): WorkerEnv {
  const supabaseUrl = requireEnv("SUPABASE_URL")
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const appUrl = (process.env["APP_URL"] ?? "https://portalcarmelitano.com.br").replace(/\/$/, "")

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    citySlug: process.env["WORKER_CITY_SLUG"] ?? "carmo-do-rio-claro",
    googlePlacesApiKey: process.env["GOOGLE_PLACES_API_KEY"] ?? process.env["GOOGLE_MAPS_API_KEY"] ?? null,
    googleRoutesApiKey: process.env["GOOGLE_ROUTES_API_KEY"] ?? process.env["GOOGLE_MAPS_API_KEY"] ?? null,
    r2Endpoint: process.env["R2_ENDPOINT"] ?? null,
    r2Bucket: process.env["R2_BUCKET"] ?? null,
    r2AccessKeyId: process.env["R2_ACCESS_KEY_ID"] ?? null,
    r2SecretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] ?? null,
    r2PublicBaseUrl: process.env["R2_PUBLIC_BASE_URL"] ?? null,
    openAiApiKey: process.env["OPENAI_API_KEY"] ?? null,
    openAiSummaryModel: process.env["OPENAI_SUMMARY_MODEL"] ?? "gpt-5.4-nano",
    openAiEmbeddingModel: process.env["OPENAI_EMBEDDING_MODEL"] ?? "text-embedding-3-small",
    aiMonthlyBudgetUsd: readNumberEnv("AI_MONTHLY_BUDGET_USD", 5),
    httpTimeoutMs: readNumberEnv("WORKER_HTTP_TIMEOUT_MS", 15000),
    maxRetries: readNumberEnv("WORKER_MAX_RETRIES", 2),
    appUrl,
    mediaProcessorUrl: process.env["MEDIA_PROCESSOR_URL"] ?? null,
    mediaProcessorSecret: process.env["MEDIA_PROCESSOR_SECRET"] ?? null,
    expoAccessToken: process.env["EXPO_ACCESS_TOKEN"] ?? null,
    vapidPublicKey: process.env["VAPID_PUBLIC_KEY"] ?? "",
    vapidPrivateKey: process.env["VAPID_PRIVATE_KEY"] ?? "",
    vapidSubject: process.env["VAPID_SUBJECT"] ?? "mailto:contato@cidadeviva.app",
    pushPollIntervalMs: readNumberEnv("PUSH_POLL_INTERVAL_MS", 5000),
    pushBatchSize: readNumberEnv("PUSH_BATCH_SIZE", 50),
  }
}

export function readArgv(): string[] {
  return process.argv.slice(2)
}

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env ${key}`)
  }
  return value
}

function readNumberEnv(key: string, fallback: number): number {
  const value = process.env[key]
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric env ${key}`)
  }
  return parsed
}
