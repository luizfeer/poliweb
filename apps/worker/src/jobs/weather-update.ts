import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"

type CityRow = {
  id: string
  slug: string
  timezone: string | null
  lat: number | null
  lng: number | null
}

type OpenMeteoResponse = {
  timezone?: string
  latitude?: number
  longitude?: number
  current?: {
    temperature_2m?: number
    apparent_temperature?: number
    weather_code?: number
    wind_speed_10m?: number
  }
  daily?: {
    time?: string[]
    weather_code?: Array<number | null>
    temperature_2m_max?: Array<number | null>
    temperature_2m_min?: Array<number | null>
    precipitation_probability_max?: Array<number | null>
  }
}

const FORECAST_DAYS = 7
const WEATHER_TTL_HOURS = 30

export async function runWeatherUpdate(env: WorkerEnv): Promise<void> {
  const restUrl = env.supabaseUrl.replace(/\/$/, "") + "/rest/v1"
  const headers = {
    apikey: env.supabaseServiceRoleKey,
    authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    "content-type": "application/json",
  }

  const citiesRes = await fetch(
    `${restUrl}/cities?status=eq.active&select=id,slug,timezone,lat,lng`,
    { headers },
  )
  if (!citiesRes.ok) throw new Error(`cities fetch failed: HTTP ${citiesRes.status}`)
  const cities = (await citiesRes.json()) as CityRow[]

  let updated = 0
  const errors: string[] = []

  for (const city of cities) {
    try {
      const lat = city.lat ?? -20.9747
      const lng = city.lng ?? -46.1158
      const tz = city.timezone ?? "America/Sao_Paulo"

      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        timezone: tz,
        forecast_days: String(FORECAST_DAYS),
        current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      })

      const meteoRes = await fetchWithRetry(`https://api.open-meteo.com/v1/forecast?${params}`, 3)
      if (!meteoRes.ok) throw new Error(`Open-Meteo HTTP ${meteoRes.status}`)
      const raw = (await meteoRes.json()) as OpenMeteoResponse

      const fetchedAt = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * WEATHER_TTL_HOURS).toISOString()

      const daily = (raw.daily?.time ?? []).slice(0, FORECAST_DAYS).map((date, i) => ({
        date,
        weatherCode: raw.daily?.weather_code?.[i] ?? null,
        temperatureMax: raw.daily?.temperature_2m_max?.[i] ?? null,
        temperatureMin: raw.daily?.temperature_2m_min?.[i] ?? null,
        precipitationProbabilityMax: raw.daily?.precipitation_probability_max?.[i] ?? null,
      } satisfies Record<string, string | number | null>))

      const upsertRes = await fetch(
        `${restUrl}/weather_snapshots?on_conflict=city_id,provider`,
        {
          method: "POST",
          headers: { ...headers, prefer: "resolution=merge-duplicates" },
          body: JSON.stringify([{
            city_id: city.id,
            provider: "open-meteo",
            fetched_at: fetchedAt,
            expires_at: expiresAt,
            timezone: raw.timezone ?? tz,
            latitude: raw.latitude ?? lat,
            longitude: raw.longitude ?? lng,
            current_temperature: raw.current?.temperature_2m ?? null,
            apparent_temperature: raw.current?.apparent_temperature ?? null,
            weather_code: raw.current?.weather_code ?? null,
            wind_speed: raw.current?.wind_speed_10m ?? null,
            precipitation_probability: raw.daily?.precipitation_probability_max?.[0] ?? null,
            daily,
            raw,
          }]),
        },
      )

      if (!upsertRes.ok) {
        throw new Error(`upsert failed: HTTP ${upsertRes.status} ${await upsertRes.text()}`)
      }

      updated += 1
      logger.info("weather updated", { city: city.slug, temp: raw.current?.temperature_2m ?? null })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      errors.push(`${city.slug}: ${msg}`)
      logger.error("weather update failed", { city: city.slug, error: msg })
    }
  }

  logger.info("weather job finished", { processed: cities.length, updated, errors })
}

async function fetchWithRetry(url: string, attempts: number): Promise<Response> {
  let lastResponse: Response | null = null
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response
      }
      lastResponse = response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }

    if (attempt < attempts) {
      await sleep(600 * attempt)
    }
  }

  if (lastResponse) return lastResponse
  throw lastError ?? new Error("Open-Meteo request failed")
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
