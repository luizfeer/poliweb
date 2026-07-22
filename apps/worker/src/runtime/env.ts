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
  brevoApiKey: string | null
  brevoFromEmail: string
  brevoFromName: string
  brevoDefaultService: string
  brevoServices: Record<string, BrevoServiceEnv>
  appUrl: string
  emailPollIntervalMs: number
  emailBatchSize: number
  mediaProcessorUrl: string | null
  mediaProcessorSecret: string | null
  expoAccessToken: string | null
  vapidPublicKey: string
  vapidPrivateKey: string
  vapidSubject: string
  pushPollIntervalMs: number
  pushBatchSize: number
}

export type BrevoServiceEnv = {
  apiKey: string
  fromEmail: string
  fromName: string
  appUrl: string
  defaultTags: string[]
}

export function readEnv(): WorkerEnv {
  const supabaseUrl = requireEnv("SUPABASE_URL")
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const brevoFromEmail = process.env["BREVO_FROM_EMAIL"] ?? "contato@cidadeviva.app"
  const brevoFromName = process.env["BREVO_FROM_NAME"] ?? "Portal Carmelitano"
  const appUrl = (process.env["APP_URL"] ?? "https://portalcarmelitano.com.br").replace(/\/$/, "")
  const brevoDefaultService = process.env["BREVO_DEFAULT_SERVICE"] ?? "hail_mary"
  const brevoApiKey = process.env["BREVO_API_KEY"] ?? null

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
    brevoApiKey,
    brevoFromEmail,
    brevoFromName,
    brevoDefaultService,
    brevoServices: readBrevoServicesEnv({
      defaultService: brevoDefaultService,
      apiKey: brevoApiKey,
      fromEmail: brevoFromEmail,
      fromName: brevoFromName,
      appUrl,
    }),
    appUrl,
    emailPollIntervalMs: readNumberEnv("EMAIL_POLL_INTERVAL_MS", 15000),
    emailBatchSize: readNumberEnv("EMAIL_BATCH_SIZE", 25),
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

function readBrevoServicesEnv(defaults: {
  defaultService: string
  apiKey: string | null
  fromEmail: string
  fromName: string
  appUrl: string
}): Record<string, BrevoServiceEnv> {
  const services: Record<string, BrevoServiceEnv> = {}
  if (defaults.apiKey) {
    services[defaults.defaultService] = {
      apiKey: defaults.apiKey,
      fromEmail: defaults.fromEmail,
      fromName: defaults.fromName,
      appUrl: defaults.appUrl,
      defaultTags: [defaults.defaultService],
    }
  }

  const raw = process.env["BREVO_SERVICES_JSON"]
  if (!raw) return services

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("Invalid JSON env BREVO_SERVICES_JSON")
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("BREVO_SERVICES_JSON must be a JSON object")
  }

  for (const [service, value] of Object.entries(parsed)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Invalid Brevo service config for ${service}`)
    }
    const row = value as Record<string, unknown>
    const apiKey = readString(row, "apiKey")
    if (!apiKey) throw new Error(`Missing apiKey in BREVO_SERVICES_JSON.${service}`)
    services[service] = {
      apiKey,
      fromEmail: readString(row, "fromEmail") ?? defaults.fromEmail,
      fromName: readString(row, "fromName") ?? defaults.fromName,
      appUrl: (readString(row, "appUrl") ?? defaults.appUrl).replace(/\/$/, ""),
      defaultTags: readStringArray(row, "defaultTags") ?? [service],
    }
  }

  return services
}

function readString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function readStringArray(row: Record<string, unknown>, key: string): string[] | null {
  const value = row[key]
  if (!Array.isArray(value)) return null
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
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
