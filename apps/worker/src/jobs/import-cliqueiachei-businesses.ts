import { readFile, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import type { WorkerEnv } from "../runtime/env.js"
import { logger } from "../runtime/logger.js"
import { PostgrestClient } from "../persistence/postgrest.js"
import type { JsonValue } from "../types.js"

type ImportOptions = {
  sourceDir: string
  dryRun: boolean
  limit: number | null
  skipFetch: boolean
  publish: boolean
}

type SourceBusiness = {
  id_interno?: number | string | null
  url?: string | null
  nome?: string | null
  categoria?: string | null
  telefone?: string | null
  celular?: string | null
  endereco?: string | null
  cidade_texto?: string | null
  descricao?: string | null
  horarios?: string | null
  data_ativacao?: string | null
}

type BusinessPayload = {
  city_id: string
  slug: string
  name: string
  short_description: string | null
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  google_maps_url: string | null
  address: string | null
  hours: JsonValue
  cover_url: string | null
  logo_url: string | null
  photos: JsonValue
  amenities: JsonValue
  payment_methods: JsonValue
  status: "draft" | "published"
  featured: boolean
  verified: boolean
  claimed: boolean
  published_at?: string | null
  import_source: JsonValue
}

type BusinessRow = {
  id: string
  slug: string
}

type CategoryRow = {
  id: string
  slug: string
  city_id: string | null
}

type DetailData = {
  name: string | null
  categoryName: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  googleMapsUrl: string | null
  address: string | null
  description: string | null
  hours: Hours
  logoUrl: string | null
  photos: string[]
  paymentMethods: string[]
}

type Hours = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", Array<{ open: string; close: string }>>>

const DEFAULT_SOURCE_DIR = "cliqueiachei_scraper/empresas_por_cidade/MG/Carmo Do Rio Claro"
const DAY_MAP: Record<string, keyof Hours> = {
  Mo: "mon",
  Tu: "tue",
  We: "wed",
  Th: "thu",
  Fr: "fri",
  Sa: "sat",
  Su: "sun",
}

const CATEGORY_OVERRIDES: Record<string, string> = {
  "academia": "academia",
  "acougue": "acougue",
  "alimentos-e-bebidas": "restaurantes",
  "animais": "animais",
  "arte-e-cultura": "arte-cultura",
  "auto-eletrica": "auto-eletrica",
  "automoveis-e-veiculos": "mecanica",
  "bar": "bar",
  "beleza-e-estetica": "estetica",
  "borracheiro": "borracheiro",
  "cabeleireiro": "cabeleireiro",
  "calcados": "calcado",
  "casa-e-decoracao": "decoracao",
  "chocolateria": "chocolateria",
  "clinica-medica": "clinica",
  "clinica-de-estetica": "estetica",
  "clinicas-e-diagnosticos": "clinica-diagnostico",
  "construcao": "construcao",
  "conveniencia": "conveniencia",
  "dentista": "dentista",
  "disk-bebidas": "disk-bebidas",
  "disk-gas": "disk-gas",
  "educacao": "escola",
  "eletrodomesticos": "eletrodomestico",
  "eletronicos": "eletronico",
  "enderecos-empresariais": "enderecos-empresariais",
  "entretenimento-e-lazer": "festa-evento",
  "escola": "escola",
  "escola-de-idiomas": "idiomas",
  "farmacia-de-manipulacao": "farmacia-manipulacao",
  "farmacia-e-drogaria": "farmacia",
  "farmacias-e-drogarias": "farmacia",
  "festas-e-eventos": "festa-evento",
  "flores-presentes-e-datas-comemorativas": "flores-presentes",
  "floricultura": "floricultura",
  "funerarias-e-cemiterios": "funeraria",
  "hospedagem-e-turismo": "pousada",
  "hospitais-e-postos-de-saude": "hospital",
  "igreja": "igreja",
  "industria-e-comercio": "industria-comercio",
  "industria": "industria-comercio",
  "informatica": "informatica",
  "jardineiro": "jardineiro",
  "lanchonete": "lanchonete",
  "mecanico": "mecanica",
  "moda-e-acessorios": "roupa",
  "moda-feminina-e-masculina": "roupa",
  "moda-infantil-e-teen": "roupa",
  "padaria": "padaria",
  "papelaria-e-escritorio": "papelaria",
  "pastelaria": "lanchonete",
  "pescaria": "pesca",
  "pet-shop": "animais",
  "pizzaria": "pizzaria",
  "ponto-turistico": "passeio",
  "psicologo": "psicologia",
  "restaurantes": "restaurantes",
  "saude-e-terapia": "clinica",
  "servicos-advocaticios": "servicos-advocaticios",
  "servicos-de-engenharia-e-arquitetura": "engenharia-arquitetura",
  "servicos-de-limpeza": "servicos-limpeza",
  "servicos-em-agricultura-e-pecuaria": "agro-pecuaria",
  "servicos-em-geral": "assistencia-tecnica",
  "servicos-medicos-e-consultorios": "clinica",
  "servicos-odontologicos": "dentista",
  "sorveteria": "sorveteria",
  "transporte": "transporte",
  "veterinario": "veterinaria",
  "otica": "oftalmologia",
}

const DELIVERY_CATEGORY_SLUGS = new Set([
  "alimentacao",
  "restaurantes",
  "lanchonete",
  "pizzaria",
  "padaria",
  "acougue",
  "bar",
  "mercado",
  "sorveteria",
  "chocolateria",
  "disk-bebidas",
  "disk-gas",
  "conveniencia",
])

export async function runCliqueiAcheiBusinessesImport(env: WorkerEnv, argv: string[]): Promise<void> {
  const options = parseOptions(argv)
  const db = new PostgrestClient({
    supabaseUrl: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  })
  const city = await db.findCityBySlug(env.citySlug)
  const sourceItems = await readSourceBusinesses(options.sourceDir)
  const dedupedItems = dedupeSourceItems(sourceItems).slice(0, options.limit ?? undefined)

  logger.info("cliqueiachei import loaded", {
    city_slug: city.slug,
    source_dir: options.sourceDir,
    source_items: sourceItems.length,
    unique_items: dedupedItems.length,
    dry_run: options.dryRun,
  })

  const categories = options.dryRun ? new Map<string, string>() : await loadCategoryMap(db, city.id)
  let processed = 0
  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const item of dedupedItems) {
    try {
      const detail = options.skipFetch || !item.url ? emptyDetail() : await fetchDetail(item.url)
      const categorySlug = categorySlugFor(detail.categoryName ?? item.categoria ?? "Serviços em Geral")
      const payload = buildPayload(city.id, item, detail, categorySlug, options.publish)
      processed += 1

      if (options.dryRun) {
        continue
      }

      const existing = await db.selectRows<BusinessRow>("businesses", {
        city_id: city.id,
        slug: payload.slug,
      })
      const rows = await db.upsertRows<BusinessRow>("businesses", [payload as unknown as Record<string, JsonValue>], "city_id,slug")
      const business = rows[0]
      if (!business) {
        throw new Error("upsert did not return business")
      }

      if (existing.length > 0) {
        updated += 1
      } else {
        inserted += 1
      }

      const categoryId = categories.get(categorySlug) ?? categories.get("assistencia-tecnica") ?? categories.get("servicos")
      if (categoryId) {
        await db.deleteRows("business_category_assignments", { business_id: business.id })
        await db.insertRows("business_category_assignments", [
          { business_id: business.id, category_id: categoryId, is_primary: true },
        ])
      } else {
        skipped += 1
        errors.push(`${payload.slug}: nenhuma categoria de fallback cadastrada (${categorySlug})`)
      }
    } catch (error) {
      skipped += 1
      errors.push(`${item.url ?? item.nome ?? "sem-url"}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  logger.info("cliqueiachei import finished", {
    processed,
    inserted,
    updated,
    skipped,
    errors: errors.slice(0, 20),
  })
}

function parseOptions(argv: string[]): ImportOptions {
  let sourceDir = processValue("CLIQUEIACHEI_SOURCE_DIR") ?? DEFAULT_SOURCE_DIR
  let dryRun = true
  let limit: number | null = null
  let skipFetch = false
  let publish = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--apply") dryRun = false
    if (arg === "--dry-run") dryRun = true
    if (arg === "--skip-fetch") skipFetch = true
    if (arg === "--publish") publish = true
    if (arg === "--source-dir") {
      const next = argv[index + 1]
      if (!next) throw new Error("--source-dir requires a path")
      sourceDir = next
      index += 1
    }
    if (arg === "--limit") {
      const next = argv[index + 1]
      if (!next) throw new Error("--limit requires a number")
      const parsed = Number(next)
      if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("--limit must be a positive integer")
      limit = parsed
      index += 1
    }
  }

  return { sourceDir: resolve(sourceDir), dryRun, limit, skipFetch, publish }
}

async function readSourceBusinesses(sourceDir: string): Promise<SourceBusiness[]> {
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".json"))
  const items: SourceBusiness[] = []
  for (const file of files) {
    const content = await readFile(join(sourceDir, file), "utf8")
    const parsed = JSON.parse(content) as unknown
    if (!Array.isArray(parsed)) {
      continue
    }
    for (const row of parsed) {
      if (isRecord(row)) {
        items.push(normalizeSourceBusiness(row))
      }
    }
  }
  return items
}

function dedupeSourceItems(items: SourceBusiness[]): SourceBusiness[] {
  const byKey = new Map<string, SourceBusiness>()
  for (const item of items) {
    const key = item.id_interno ? `id:${item.id_interno}` : `url:${item.url ?? slugify(item.nome ?? "")}`
    const current = byKey.get(key)
    if (!current || scoreSourceItem(item) > scoreSourceItem(current)) {
      byKey.set(key, item)
    }
  }
  return Array.from(byKey.values()).sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"))
}

function scoreSourceItem(item: SourceBusiness): number {
  return [
    item.url,
    item.nome,
    item.telefone,
    item.celular,
    item.endereco,
    item.descricao,
    item.horarios,
  ].filter(Boolean).length
}

function normalizeSourceBusiness(row: Record<string, unknown>): SourceBusiness {
  return {
    id_interno: readOptionalId(row["id_interno"]),
    url: cleanText(readString(row["url"])),
    nome: cleanText(readString(row["nome"])),
    categoria: cleanText(readString(row["categoria"])),
    telefone: cleanText(readString(row["telefone"])),
    celular: cleanText(readString(row["celular"])),
    endereco: cleanText(readString(row["endereco"])),
    cidade_texto: cleanText(readString(row["cidade_texto"])),
    descricao: cleanText(readString(row["descricao"])),
    horarios: cleanText(readString(row["horarios"])),
    data_ativacao: cleanText(readString(row["data_ativacao"])),
  }
}

async function fetchDetail(url: string): Promise<DetailData> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; CarmoLocalImporter/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  })
  if (!response.ok) {
    throw new Error(`detail GET failed HTTP ${response.status}`)
  }
  const html = await response.text()
  return parseDetail(html, url)
}

function parseDetail(html: string, url: string): DetailData {
  const name = textFromMatch(html.match(/<h4[^>]*itemprop=["']name["'][^>]*>([\s\S]*?)<\/h4>/i))
  const categoryName = textFromMatch(html.match(/<h3>\s*<i[^>]*><\/i>\s*([^<]+?)\s+em\s+Carmo do Rio Claro/i))
  const phones = unique([...matchAll(html, /(?:href|data-call)=["']tel:([^"']+)["'][\s\S]*?<span>([^<]+)<\/span>|href=["']tel:[^"']+["'][^>]*>([^<]+)<\/a>/gi).map((match) => cleanPhone(match[2] ?? match[3] ?? match[1] ?? ""))]).filter(Boolean)
  const mobile = phones.find((phone) => /9\s*\d{4}|\(35\)\s*9/.test(phone))
  const email = textFromMatch(html.match(/mailto:([^"']+)/i))
  const logoUrl = attrFromMatch(html.match(/<img[^>]+itemprop=["']logo["'][^>]+src=["']([^"']+)["']/i))
    ?? metaContent(html, "og:image:secure_url")
  const photos = unique(matchAll(html, /data-src=["'](https:\/\/www\.cliqueiachei\.com\.br\/imagens-fotos-clientes-cliquei-achei\/[^"']+)["']/gi).map((match) => decodeHtml(match[1] ?? "")))
  const address = textFromMatch(html.match(/<p[^>]*itemprop=["']streetAddress["'][^>]*>([\s\S]*?)<\/p>/i))
  const description = textFromMatch(html.match(/<p[^>]*itemprop=["']description["'][^>]*>([\s\S]*?)<\/p>/i))
  const facebook = attrFromMatch(html.match(/<a[^>]+href=["'](https?:\/\/(?:www\.)?facebook\.com\/[^"']+)["'][^>]+class=["']icone_face/i))
  const instagram = attrFromMatch(html.match(/<a[^>]+href=["'](https?:\/\/(?:www\.)?instagram\.com\/[^"']+)["']/i))
  const website = findWebsite(html, url, facebook, instagram)
  const paymentMethods = mapPaymentMethods(textFromMatch(html.match(/itemprop=["']paymentAccepted["'][^>]*>([\s\S]*?)<\/p>/i)))
  const hours = parseHours(html)
  const whatsapp = html.includes("box_whatsapp") ? mobile ?? null : null

  return {
    name,
    categoryName,
    phone: phones[0] ?? null,
    whatsapp,
    email,
    website,
    instagram: normalizeInstagram(instagram),
    facebook,
    googleMapsUrl: name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, Carmo do Rio Claro, MG`)}` : null,
    address,
    description,
    hours,
    logoUrl: absoluteCliqueiUrl(logoUrl),
    photos,
    paymentMethods,
  }
}

function parseHours(html: string): Hours {
  const hours: Hours = {}
  for (const match of matchAll(html, /<time[^>]+datetime=["']([A-Z][a-z])\s+(\d{2}:\d{2})-(\d{2}:\d{2})["'][^>]*>/g)) {
    const day = DAY_MAP[match[1] ?? ""]
    const open = match[2]
    const close = match[3]
    if (day && open && close) {
      hours[day] = [...(hours[day] ?? []), { open, close }]
    }
  }
  return hours
}

async function loadCategoryMap(db: PostgrestClient, cityId: string): Promise<Map<string, string>> {
  const rows = await db.selectWithParams<CategoryRow>("business_categories", {
    select: "id,slug,city_id",
    or: `(city_id.is.null,city_id.eq.${cityId})`,
    active: "eq.true",
  })
  return new Map(rows.map((row) => [row.slug, row.id]))
}

function buildPayload(
  cityId: string,
  source: SourceBusiness,
  detail: DetailData,
  categorySlug: string,
  publish: boolean,
): BusinessPayload {
  const name = detail.name ?? source.nome ?? "Comércio sem nome"
  const description = detail.description ?? source.descricao ?? null
  const shortDescription = summarize(description ?? source.descricao ?? detail.categoryName ?? source.categoria ?? null)
  const sourceId = source.id_interno ? String(source.id_interno) : source.url ?? slugify(name)
  const sourceUrl = source.url ?? null
  return {
    city_id: cityId,
    slug: slugifyFromUrl(source.url) ?? slugify(name),
    name,
    short_description: shortDescription,
    description,
    phone: detail.phone ?? source.telefone ?? null,
    whatsapp: detail.whatsapp ?? whatsappFromSource(source.celular, detail.phone ?? source.telefone ?? null),
    email: detail.email,
    website: detail.website,
    instagram: detail.instagram,
    facebook: detail.facebook,
    google_maps_url: detail.googleMapsUrl,
    address: detail.address ?? source.endereco ?? null,
    hours: detail.hours,
    cover_url: detail.photos[0] ?? null,
    logo_url: detail.logoUrl,
    photos: detail.photos,
    amenities: canOfferDelivery(categorySlug) && (detail.whatsapp ?? source.celular) ? ["delivery"] : [],
    payment_methods: detail.paymentMethods,
    status: publish ? "published" : "draft",
    featured: false,
    verified: false,
    claimed: false,
    published_at: publish ? new Date().toISOString() : null,
    import_source: {
      source: "cliqueiachei",
      source_id: sourceId,
      raw_url: sourceUrl,
      imported_at: new Date().toISOString(),
      source_category: source.categoria ?? detail.categoryName,
      category_slug: categorySlug,
      activation_date: source.data_ativacao ?? null,
    },
  }
}

function categorySlugFor(categoryName: string): string {
  const rawSlug = slugify(categoryName)
  return CATEGORY_OVERRIDES[rawSlug] ?? rawSlug
}

function findWebsite(html: string, pageUrl: string, facebook: string | null, instagram: string | null): string | null {
  const urls = unique(matchAll(html, /<a[^>]+href=["'](https?:\/\/[^"']+)["']/gi).map((match) => decodeHtml(match[1] ?? "")))
  return urls.find((candidate) =>
    !candidate.includes("cliqueiachei.com") &&
    candidate !== pageUrl &&
    candidate !== facebook &&
    candidate !== instagram &&
    !candidate.includes("google.com") &&
    !candidate.includes("facebook.com") &&
    !candidate.includes("instagram.com")
  ) ?? null
}

function canOfferDelivery(categorySlug: string): boolean {
  return DELIVERY_CATEGORY_SLUGS.has(categorySlug)
}

function normalizeInstagram(value: string | null): string | null {
  if (!value) return null
  const withoutDomain = value.trim().replace(/^.*instagram\.com\//i, "")
  const handle = withoutDomain.replace(/^@/, "").split(/[/?#]/)[0]?.trim()
  return handle || null
}

function mapPaymentMethods(value: string | null): string[] {
  if (!value) return []
  const normalized = slugify(value)
  const methods: string[] = []
  if (normalized.includes("pix")) methods.push("pix")
  if (normalized.includes("dinheiro")) methods.push("dinheiro")
  if (normalized.includes("credito")) methods.push("credito")
  if (normalized.includes("debito")) methods.push("debito")
  if (normalized.includes("refeicao")) methods.push("vale_refeicao")
  if (normalized.includes("alimentacao")) methods.push("vale_alimentacao")
  return unique(methods)
}

function whatsappFromSource(celular: string | null | undefined, phone: string | null): string | null {
  if (!celular) return null
  const clean = cleanPhone(celular)
  if (clean) return clean
  return celular.toLowerCase().includes("whatsapp") ? phone : null
}

function slugifyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const parts = url.split("/").filter(Boolean)
  const last = parts.at(-1)
  return last ? slugify(last) : null
}

function summarize(value: string | null): string | null {
  if (!value) return null
  const normalized = value.replace(/\s+/g, " ").trim()
  if (!normalized) return null
  return normalized.length > 140 ? `${normalized.slice(0, 137).trim()}...` : normalized
}

function emptyDetail(): DetailData {
  return {
    name: null,
    categoryName: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    instagram: null,
    facebook: null,
    googleMapsUrl: null,
    address: null,
    description: null,
    hours: {},
    logoUrl: null,
    photos: [],
    paymentMethods: [],
  }
}

function cleanText(value: string | null): string | null {
  if (!value) return null
  const fixed = maybeFixMojibake(value)
  const cleaned = decodeHtml(fixed).replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim()
  return cleaned.length > 0 ? cleaned : null
}

function maybeFixMojibake(value: string): string {
  if (!/[ÃÂ]/.test(value)) {
    return value
  }
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff)))
  } catch {
    return value
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function textFromMatch(match: RegExpMatchArray | null): string | null {
  if (!match?.[1]) return null
  return cleanText(stripTags(match[1]))
}

function attrFromMatch(match: RegExpMatchArray | null): string | null {
  if (!match?.[1]) return null
  return cleanText(match[1])
}

function metaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return attrFromMatch(html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i")))
}

function stripTags(value: string): string {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
}

function cleanPhone(value: string): string {
  const text = decodeHtml(value).replace(/\s+/g, " ").trim()
  const match = text.match(/(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/)
  return match?.[0]?.trim() ?? ""
}

function absoluteCliqueiUrl(url: string | null): string | null {
  if (!url) return null
  if (url.includes("logotipo-logomarca-cliquei-achei/cliquei-achei-image-share")) return null
  if (url.startsWith("http")) return url
  if (url.startsWith("//")) return `https:${url}`
  if (url.startsWith("/")) return `https://www.cliqueiachei.com.br${url}`
  return url
}

function slugify(input: string): string {
  return maybeFixMojibake(input)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function matchAll(value: string, regex: RegExp): RegExpMatchArray[] {
  return Array.from(value.matchAll(regex))
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function readOptionalId(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function processValue(key: string): string | null {
  return globalThis.process?.env[key] ?? null
}
