import type { JsonValue } from "../types.js"
import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { PostgrestClient } from "../persistence/postgrest.js"

type RouteTarget = {
  key: string
  name: string
  label: string
  googleDestination: string
  derRoads: string[]
}

type ArcgisFeature = {
  attributes?: {
    objectid?: number
    rodovia?: string | null
    trecho?: string | null
    municipio?: string | null
    trafegabilidade?: string | null
    trafeg_variante?: string | null
    status_final?: string | null
    data_prevista?: number | null
    last_edited_date?: number | null
    latitude?: string | number | null
    longitude?: string | number | null
  }
}

type DerAlertDetail = {
  objectId: number | null
  road: string | null
  segment: string | null
  city: string | null
  trafficability: string | null
  variant: string | null
  status: string | null
  expectedDate: string | null
  lastEditedAt: string | null
  lat: number | null
  lng: number | null
  distanceFromOriginKm: number | null
  mapUrl: string | null
  summary: string
}

type ArcgisResponse = {
  features?: ArcgisFeature[]
  error?: { message?: string }
}

type GoogleRouteResponse = {
  routes?: Array<{
    duration?: string
    staticDuration?: string
    distanceMeters?: number
    routeToken?: string
    polyline?: {
      encodedPolyline?: string
    }
  }>
  error?: { message?: string }
}

type DerSummary = {
  status: string
  level: "clear" | "attention" | "blocked" | "unknown"
  alertCount: number
  alerts: ArcgisFeature[]
  details: DerAlertDetail[]
  mainAlert: DerAlertDetail | null
}

type GoogleSummary = {
  status: string
  durationSeconds: number | null
  staticDurationSeconds: number | null
  delaySeconds: number | null
  distanceMeters: number | null
  durationText: string | null
  staticDurationText: string | null
  delayText: string | null
  distanceText: string | null
  routeToken: string | null
  encodedPolyline: string | null
  mapsUrl: string
  raw: JsonValue
}

const DER_ENDPOINT =
  "https://observatorio.infraestrutura.mg.gov.br/server/rest/services/00_PUBLICACOES/pontos_criticos_publico/FeatureServer/0/query"

const ORIGIN = "Carmo do Rio Claro, MG, Brasil"
const ORIGIN_COORDS = { lat: -20.9719, lng: -46.1189 }
const DER_SOURCE_URL = "https://observatorio.infraestrutura.mg.gov.br/"
const LOCAL_DER_ALERT_RADIUS_KM = 90

const ROUTES: RouteTarget[] = [
  {
    key: "licinea",
    name: "Licinea",
    label: "Carmo para Licinea",
    googleDestination: "Licinea, Carmo do Rio Claro, MG, Brasil",
    derRoads: ["MG184"],
  },
  {
    key: "bh",
    name: "Belo Horizonte",
    label: "Carmo para BH",
    googleDestination: "Belo Horizonte, MG, Brasil",
    derRoads: ["MG184", "MG050", "CMG050", "CMG381"],
  },
  {
    key: "alfenas",
    name: "Alfenas",
    label: "Carmo para Alfenas",
    googleDestination: "Alfenas, MG, Brasil",
    derRoads: ["MG184", "MG491", "LMG879"],
  },
  {
    key: "passos",
    name: "Passos",
    label: "Carmo para Passos",
    googleDestination: "Passos, MG, Brasil",
    derRoads: ["MG184", "MG050", "CMG050"],
  },
  {
    key: "guaxupe",
    name: "Guaxupe",
    label: "Carmo para Guaxupe",
    googleDestination: "Guaxupe, MG, Brasil",
    derRoads: ["MG184", "MG491", "MG450"],
  },
  {
    key: "campinas",
    name: "Campinas",
    label: "Carmo para Campinas",
    googleDestination: "Campinas, SP, Brasil",
    derRoads: ["MG184", "MG050", "CMG050", "MG491"],
  },
]

export async function runRoadRoutesUpdate(env: WorkerEnv): Promise<void> {
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const fetchedAt = new Date()
  const expiresAt = new Date(fetchedAt.getTime() + 1000 * 60 * 60).toISOString()
  let updated = 0
  const localDerFetch = await fetchLocalDerAlerts()
  const localDer = summarizeDerAlerts(localDerFetch.features)

  if (localDer.alertCount > 0) {
    await upsertLocalDerFeedItem(db, city.id, localDer, localDerFetch.url, fetchedAt, expiresAt)
  } else {
    await archiveLocalDerFeedItem(db, city.id, fetchedAt)
  }

  for (const route of ROUTES) {
    const derFetch = await fetchDerAlerts(route)
    const der = summarizeDerAlerts(filterLocalDerFeatures(derFetch.features))
    const google = env.googleRoutesApiKey
      ? await fetchGoogleRoute(route, env.googleRoutesApiKey)
      : null

    const sourceSummary = google
      ? "DER-MG + Google Routes"
      : "DER-MG"

    await db.upsertRows("road_route_snapshots", [
      {
        city_id: city.id,
        destination_key: route.key,
        destination_name: route.name,
        origin_label: "Carmo do Rio Claro",
        route_label: route.label,
        der_status: der.status,
        der_status_level: der.level,
        der_alert_count: der.alertCount,
        traffic_status: google?.status ?? null,
        duration_seconds: google?.durationSeconds ?? null,
        static_duration_seconds: google?.staticDurationSeconds ?? null,
        distance_meters: google?.distanceMeters ?? null,
        source_summary: sourceSummary,
        fetched_at: fetchedAt.toISOString(),
        expires_at: expiresAt,
        raw_der: {
          sourceUrl: DER_SOURCE_URL,
          queryUrl: derFetch.url,
          roads: route.derRoads,
          radiusKm: LOCAL_DER_ALERT_RADIUS_KM,
          alerts: der.alerts,
          details: der.details,
          fetchedAt: fetchedAt.toISOString(),
        },
        raw_google: google
          ? {
              ...asRecord(google.raw),
              summary: {
                status: google.status,
                durationSeconds: google.durationSeconds,
                staticDurationSeconds: google.staticDurationSeconds,
                delaySeconds: google.delaySeconds,
                distanceMeters: google.distanceMeters,
                durationText: google.durationText,
                staticDurationText: google.staticDurationText,
                delayText: google.delayText,
                distanceText: google.distanceText,
                routeToken: google.routeToken,
                encodedPolyline: google.encodedPolyline,
                mapsUrl: google.mapsUrl,
              },
            }
          : undefined,
      },
    ], "city_id,destination_key")

    const href = google?.mapsUrl ?? der.mainAlert?.mapUrl ?? "/servicos"
    await db.upsertRows("live_feed_items", [
      {
        city_id: city.id,
        source_kind: "traffic",
        dedupe_key: `road-route-${route.key}`,
        label: `${route.name}:`,
        title: buildTickerTitle(route, der, google),
        suffix: null,
        href,
        source_name: sourceSummary,
        tone: toneFor(der, google),
        priority: priorityFor(der, google),
        status: "published",
        starts_at: fetchedAt.toISOString(),
        expires_at: expiresAt,
        published_at: fetchedAt.toISOString(),
        payload: {
          destinationKey: route.key,
          derStatus: der.status,
          derStatusLevel: der.level,
          trafficStatus: google?.status ?? null,
          alertCount: der.alertCount,
          alert: der.mainAlert,
          alerts: der.details,
          durationSeconds: google?.durationSeconds ?? null,
          staticDurationSeconds: google?.staticDurationSeconds ?? null,
          delaySeconds: google?.delaySeconds ?? null,
          distanceMeters: google?.distanceMeters ?? null,
          durationText: google?.durationText ?? null,
          delayText: google?.delayText ?? null,
          distanceText: google?.distanceText ?? null,
          mapsUrl: google?.mapsUrl ?? null,
          derSourceUrl: DER_SOURCE_URL,
          href,
        },
      },
    ], "city_id,dedupe_key")

    updated += 1
    logger.info("road route updated", {
      city: city.slug,
      route: route.key,
      der: der.status,
      der_alert_count: der.alertCount,
      traffic: google?.status ?? "disabled",
    })
  }

  logger.info("road routes job finished", {
    city: city.slug,
    updated,
    googleRoutesEnabled: Boolean(env.googleRoutesApiKey),
  })
}

async function fetchDerAlerts(route: RouteTarget): Promise<{ features: ArcgisFeature[]; url: string }> {
  const where = route.derRoads
    .flatMap((road) => [`rodovia LIKE '%${road}%'`, `trecho LIKE '%${road}%'`])
    .join(" OR ")

  const params = new URLSearchParams({
    f: "json",
    where,
    outFields:
      "objectid,rodovia,trecho,municipio,trafegabilidade,trafeg_variante,status_final,data_prevista,last_edited_date,latitude,longitude",
    returnGeometry: "false",
    resultRecordCount: "50",
  })

  const url = `${DER_ENDPOINT}?${params.toString()}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`DER-MG ArcGIS HTTP ${response.status}`)
  }
  const data = (await response.json()) as ArcgisResponse
  if (data.error) {
    throw new Error(`DER-MG ArcGIS error: ${data.error.message ?? "unknown"}`)
  }
  return { features: data.features ?? [], url }
}

async function fetchLocalDerAlerts(): Promise<{ features: ArcgisFeature[]; url: string }> {
  const params = new URLSearchParams({
    f: "json",
    where: "1=1",
    outFields:
      "objectid,rodovia,trecho,municipio,trafegabilidade,trafeg_variante,status_final,data_prevista,last_edited_date,latitude,longitude",
    returnGeometry: "false",
    resultRecordCount: "2000",
  })

  const url = `${DER_ENDPOINT}?${params.toString()}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`DER-MG ArcGIS local HTTP ${response.status}`)
  }
  const data = (await response.json()) as ArcgisResponse
  if (data.error) {
    throw new Error(`DER-MG ArcGIS local error: ${data.error.message ?? "unknown"}`)
  }
  return { features: filterLocalDerFeatures(data.features ?? []), url }
}

async function upsertLocalDerFeedItem(
  db: PostgrestClient,
  cityId: string,
  der: DerSummary,
  queryUrl: string,
  fetchedAt: Date,
  expiresAt: string,
): Promise<void> {
  const href = der.mainAlert?.mapUrl ?? "/servicos"
  await db.upsertRows("live_feed_items", [
    {
      city_id: cityId,
      source_kind: "traffic",
      dedupe_key: "road-alerts-local",
      label: "Região de Carmo:",
      title: der.mainAlert ? buildDerTickerTitle(der.mainAlert) : "alertas oficiais próximos",
      suffix: null,
      href,
      source_name: "DER-MG",
      tone: toneFor(der, null),
      priority: Math.max(priorityFor(der, null), 80),
      status: "published",
      starts_at: fetchedAt.toISOString(),
      expires_at: expiresAt,
      published_at: fetchedAt.toISOString(),
      payload: {
        destinationKey: "local",
        derStatus: der.status,
        derStatusLevel: der.level,
        trafficStatus: null,
        alertCount: der.alertCount,
        alert: der.mainAlert,
        alerts: der.details,
        durationText: null,
        delayText: null,
        distanceText: null,
        mapsUrl: null,
        derSourceUrl: DER_SOURCE_URL,
        queryUrl,
        radiusKm: LOCAL_DER_ALERT_RADIUS_KM,
        href,
      },
    },
  ], "city_id,dedupe_key")
}

async function archiveLocalDerFeedItem(
  db: PostgrestClient,
  cityId: string,
  fetchedAt: Date,
): Promise<void> {
  await db.updateRows("live_feed_items", {
    city_id: cityId,
    dedupe_key: "road-alerts-local",
  }, {
    status: "archived",
    expires_at: fetchedAt.toISOString(),
  })
}

function summarizeDerAlerts(features: ArcgisFeature[]): DerSummary {
  const active = features.filter((feature) => {
    const status = normalize(feature.attributes?.status_final)
    return status !== "obra concluida" && status !== "concluido"
  })

  const blocked = active.filter((feature) => {
    const text = normalize(`${feature.attributes?.trafeg_variante ?? ""} ${feature.attributes?.trafegabilidade ?? ""}`)
    return text.includes("interrompida")
  })

  if (blocked.length > 0) {
    const details = blocked.map(describeDerAlert)
    return {
      status: "pista interrompida",
      level: "blocked",
      alertCount: blocked.length,
      alerts: blocked,
      details,
      mainAlert: details[0] ?? null,
    }
  }

  const attention = active.filter((feature) => {
    const text = normalize(`${feature.attributes?.trafeg_variante ?? ""} ${feature.attributes?.status_final ?? ""}`)
    return text.includes("meia") || text.includes("variante") || text.includes("obra")
  })

  if (attention.length > 0) {
    const details = attention.map(describeDerAlert)
    return {
      status: "alerta oficial na rota",
      level: "attention",
      alertCount: attention.length,
      alerts: attention,
      details,
      mainAlert: details[0] ?? null,
    }
  }

  return {
    status: "sem alertas oficiais conhecidos",
    level: "clear",
    alertCount: 0,
    alerts: [],
    details: [],
    mainAlert: null,
  }
}

function filterLocalDerFeatures(features: ArcgisFeature[]): ArcgisFeature[] {
  return features.filter((feature) => {
    const lat = parseCoordinate(feature.attributes?.latitude)
    const lng = parseCoordinate(feature.attributes?.longitude)
    if (lat === null || lng === null) return false
    return distanceKm(ORIGIN_COORDS, { lat, lng }) <= LOCAL_DER_ALERT_RADIUS_KM
  })
}

async function fetchGoogleRoute(route: RouteTarget, apiKey: string): Promise<GoogleSummary> {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
      "x-goog-fieldmask":
        "routes.duration,routes.staticDuration,routes.distanceMeters,routes.routeToken,routes.polyline.encodedPolyline",
    },
    body: JSON.stringify({
      origin: { address: ORIGIN },
      destination: { address: route.googleDestination },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      languageCode: "pt-BR",
      units: "METRIC",
    }),
  })

  if (!response.ok) {
    throw new Error(`Google Routes HTTP ${response.status}: ${await response.text()}`)
  }

  const raw = (await response.json()) as GoogleRouteResponse
  if (raw.error) {
    throw new Error(`Google Routes error: ${raw.error.message ?? "unknown"}`)
  }

  const first = raw.routes?.[0]
  const durationSeconds = parseGoogleDuration(first?.duration)
  const staticDurationSeconds = parseGoogleDuration(first?.staticDuration)
  const delaySeconds =
    durationSeconds !== null && staticDurationSeconds !== null
      ? Math.max(0, durationSeconds - staticDurationSeconds)
      : null
  const ratio =
    durationSeconds && staticDurationSeconds && staticDurationSeconds > 0
      ? durationSeconds / staticDurationSeconds
      : null

  return {
    status: trafficStatusForRatio(ratio),
    durationSeconds,
    staticDurationSeconds,
    delaySeconds,
    distanceMeters: first?.distanceMeters ?? null,
    durationText: formatDuration(durationSeconds),
    staticDurationText: formatDuration(staticDurationSeconds),
    delayText: formatDelay(delaySeconds),
    distanceText: formatDistance(first?.distanceMeters ?? null),
    routeToken: first?.routeToken ?? null,
    encodedPolyline: first?.polyline?.encodedPolyline ?? null,
    mapsUrl: buildGoogleMapsDirectionsUrl(route),
    raw: raw as JsonValue,
  }
}

function trafficStatusForRatio(ratio: number | null): string {
  if (ratio === null) return "tráfego consultado"
  if (ratio >= 1.35) return "congestionado"
  if (ratio >= 1.15) return "lento"
  return "tráfego normal"
}

function buildTickerTitle(route: RouteTarget, der: DerSummary, google: GoogleSummary | null): string {
  if (der.mainAlert) return buildDerTickerTitle(der.mainAlert)
  if (google?.status === "congestionado") {
    return withTripDetail("trânsito pesado agora; confira antes de sair", google)
  }
  if (google?.status === "lento") {
    return withTripDetail("fluxo mais lento que o normal", google)
  }
  if (google?.status === "tráfego normal") {
    return google.durationText
      ? `sem alerta; viagem em torno de ${google.durationText}`
      : "sem alerta; tráfego normal"
  }
  return `sem alerta oficial para ${route.name}`
}

function toneFor(der: DerSummary, google: GoogleSummary | null): "green" | "red" | "sun" | "sky" | "ink" {
  if (der.level === "blocked") return "red"
  if (der.level === "attention") return "sun"
  if (google?.status === "congestionado") return "red"
  if (google?.status === "lento") return "sun"
  if (google?.status === "tráfego normal") return "green"
  return "sky"
}

function priorityFor(der: DerSummary, google: GoogleSummary | null): number {
  if (der.level === "blocked") return 90
  if (der.level === "attention") return 70
  if (google?.status === "congestionado") return 60
  if (google?.status === "lento") return 45
  return 35
}

function parseGoogleDuration(value: string | undefined): number | null {
  if (!value) return null
  const match = value.match(/^(\d+)s$/)
  if (!match) return null
  return Number(match[1])
}

function describeDerAlert(feature: ArcgisFeature | undefined): DerAlertDetail {
  const attributes = feature?.attributes
  const road = formatRoad(attributes?.rodovia)
  const segment = cleanText(attributes?.trecho)
  const city = cleanText(attributes?.municipio)
  const trafficability = cleanText(attributes?.trafegabilidade)
  const variant = cleanText(attributes?.trafeg_variante)
  const status = cleanText(attributes?.status_final)
  const lat = parseCoordinate(attributes?.latitude)
  const lng = parseCoordinate(attributes?.longitude)
  const distanceFromOriginKm = lat !== null && lng !== null
    ? Math.round(distanceKm(ORIGIN_COORDS, { lat, lng }))
    : null
  const mapUrl = lat !== null && lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : null
  const expectedDate = formatArcgisDate(attributes?.data_prevista)
  const lastEditedAt = formatArcgisDate(attributes?.last_edited_date)
  const prefix = [road, city ? `em ${city}` : null].filter(Boolean).join(" ")
  let summary: string

  if (variant && normalize(variant).includes("interrompida")) {
    summary = [prefix, "com pista interrompida"].filter(Boolean).join(" ")
  } else if (variant && normalize(variant).includes("meia")) {
    summary = [prefix, "em meia pista"].filter(Boolean).join(" ")
  } else if (variant && normalize(variant).includes("variante")) {
    summary = [prefix, "com desvio sinalizado"].filter(Boolean).join(" ")
  } else if (status && normalize(status).includes("obra")) {
    summary = [prefix, "com obra na rota"].filter(Boolean).join(" ")
  } else {
    summary = [prefix, "com alerta oficial"].filter(Boolean).join(" ")
  }

  return {
    objectId: attributes?.objectid ?? null,
    road,
    segment,
    city,
    trafficability,
    variant,
    status,
    expectedDate,
    lastEditedAt,
    lat,
    lng,
    distanceFromOriginKm,
    mapUrl,
    summary,
  }
}

function buildDerTickerTitle(alert: DerAlertDetail): string {
  if (normalize(alert.summary).includes("pista interrompida")) {
    return `${alert.summary}; evite sair sem checar a rota`
  }
  if (normalize(alert.summary).includes("meia pista")) {
    return `${alert.summary}; reduza a velocidade`
  }
  if (normalize(alert.summary).includes("desvio")) {
    return `${alert.summary}; reserve mais tempo`
  }
  return `${alert.summary}; siga com atenção`
}

function withTripDetail(prefix: string, google: GoogleSummary): string {
  const parts = [prefix]
  if (google.delayText) parts.push(google.delayText)
  if (google.durationText) parts.push(`viagem ~${google.durationText}`)
  return parts.join("; ")
}

function buildGoogleMapsDirectionsUrl(route: RouteTarget): string {
  const params = new URLSearchParams({
    api: "1",
    origin: ORIGIN,
    destination: route.googleDestination,
    travelmode: "driving",
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function formatRoad(value: string | null | undefined): string | null {
  const text = cleanText(value)?.replace(/\s+/g, "")
  if (!text) return null
  return text.replace(/^([A-Z]{2,4})-?(\d+)$/i, (_, prefix: string, number: string) => {
    return `${prefix.toUpperCase()}-${number}`
  })
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null
  const minutes = Math.max(1, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours <= 0) return `${minutes} min`
  if (rest === 0) return `${hours}h`
  return `${hours}h${String(rest).padStart(2, "0")}`
}

function formatDelay(seconds: number | null): string | null {
  if (seconds === null || seconds < 5 * 60) return null
  return `+${formatDuration(seconds)} no trajeto`
}

function formatDistance(meters: number | null): string | null {
  if (meters === null) return null
  if (meters < 1000) return `${meters} m`
  return `${Math.round(meters / 1000)} km`
}

function formatArcgisDate(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null
  return new Date(value).toISOString()
}

function parseCoordinate(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (!value) return null
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const earthRadiusKm = 6371
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number): number {
  return value * Math.PI / 180
}

function asRecord(value: JsonValue): Record<string, JsonValue> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : { value }
}

function cleanText(value: string | null | undefined): string | null {
  const text = value?.trim()
  return text && text.length > 0 ? text : null
}

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}
