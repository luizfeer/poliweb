import type { JsonValue } from "../types.js"
import type { ContentRecord, IndexableEntityType } from "./types.js"

export function buildDocument(entityType: IndexableEntityType, content: ContentRecord): string {
  switch (entityType) {
    case "faq":
      return joinFields([
        field("Pergunta", text(content["question"])),
        field("Resposta", text(content["answer"])),
      ])
    case "business":
      return joinFields([
        field("Nome", text(content["name"])),
        field("Descricao", text(content["short_description"])),
        field("Detalhes", text(content["description"])),
        field("Endereco", text(content["address"])),
        field("Bairro", joinedName(content["districts"])),
        field("Comodidades", list(content["amenities"])),
        field("Pagamento", list(content["payment_methods"])),
        field("Servicos", relatedServices(content["entity_services"])),
        field("Atributos", attributesText(content["attributes"])),
        field("FAQ", relatedFaqQuestions(content["entity_faqs"])),
      ])
    case "accommodation":
      return joinFields([
        field("Nome", text(content["name"])),
        field("Tipo", text(content["type"])),
        field("Descricao", text(content["short_description"])),
        field("Detalhes", text(content["description"])),
        field("Bairro", joinedName(content["districts"])),
        field("Comodidades", list(content["amenities"])),
        booleanField("Perto do lago", content["near_lake"]),
        booleanField("Marina", content["has_marina"]),
        field("Preco", priceRange(content["price_min"], content["price_max"])),
        field("Servicos", relatedServices(content["entity_services"])),
        field("Atributos", attributesText(content["attributes"])),
        field("FAQ", relatedFaqQuestions(content["entity_faqs"])),
      ])
    case "restaurant":
      return joinFields([
        field("Nome", text(content["name"])),
        field("Descricao", text(content["description"])),
        field("Cozinha", list(content["cuisine"])),
        field("Faixa de preco", text(content["price_range"])),
        field("Endereco", text(content["address"])),
        field("Bairro", joinedName(content["districts"])),
        booleanField("Delivery", content["delivery"]),
        field("Servicos", relatedServices(content["entity_services"])),
        field("Atributos", attributesText(content["attributes"])),
        field("FAQ", relatedFaqQuestions(content["entity_faqs"])),
      ])
    case "fishing_guide":
      return joinFields([
        field("Guia de pesca", text(content["full_name"])),
        field("Sobre", text(content["about"])),
        field("Servicos oferecidos", list(content["services"])),
        field("Faixa de preco", text(content["price_range"])),
        booleanField("Possui barco proprio", content["has_boat"]),
        booleanField("Guia verificado", content["verified"]),
        text(content["has_boat"] ? "Passeio de barco e pesca no Lago de Furnas. Guia experiente para pescaria de tucunare, tilapia e outras especies da regiao." : "Guia de pesca local no Lago de Furnas. Experiencia em pescaria esportiva e ecoturismo na regiao de Carmo do Rio Claro."),
      ])
    case "event":
      return joinFields([
        field("Titulo", text(content["title"])),
        field("Descricao", text(content["description"])),
        field("Categoria", joinedName(content["event_categories"])),
        field("Local", text(content["location"])),
        field("Endereco", text(content["address"])),
        field("Organizacao", text(content["organizer_name"])),
        field("Data", text(content["start_at"])),
        booleanField("Gratuito", content["is_free"]),
      ])
    case "classified":
      return joinFields([
        field("Titulo", text(content["title"])),
        field("Descricao", text(content["description"])),
        field("Tipo", text(content["type"])),
        field("Categoria", text(content["category_label"])),
        field("Preco", money(content["price"])),
        booleanField("Negociavel", content["is_negotiable"]),
      ])
    case "property":
      return joinFields([
        field("Titulo", text(content["title"])),
        field("Descricao", text(content["description"])),
        field("Tipo", text(content["property_type"])),
        field("Negocio", text(content["listing_type"])),
        field("Preco", priceRange(content["price"], content["rent_price"])),
        field("Endereco", text(content["address_street"])),
        field("Bairro", joinedName(content["districts"])),
        field("Quartos", numberText(content["bedrooms"])),
        field("Banheiros", numberText(content["bathrooms"])),
        field("Area total", numberText(content["area_total_m2"])),
        field("Area util", numberText(content["area_useful_m2"])),
      ])
    case "attraction":
      return joinFields([
        field("Nome", text(content["name"])),
        field("Tipo", text(content["type"])),
        field("Descricao", text(content["description"])),
        field("Endereco", text(content["address"])),
        field("Dificuldade", text(content["difficulty"])),
        field("Duracao", numberText(content["duration_minutes"])),
        field("Melhor epoca", text(content["best_season"])),
        field("Servicos", relatedServices(content["entity_services"])),
        field("Atributos", attributesText(content["attributes"])),
        field("FAQ", relatedFaqQuestions(content["entity_faqs"])),
      ])
    case "tour_package":
      return joinFields([
        field("Titulo", text(content["title"])),
        field("Descricao", text(content["description"])),
        field("Duracao", numberText(content["duration_hours"])),
        field("Preco", money(content["price"])),
        field("Inclui", list(content["includes"])),
      ])
    case "emergency_contact":
      return joinFields([
        field("Telefone util", text(content["name"])),
        field("Categoria", text(content["category"])),
        field("Telefone", text(content["phone"])),
        field("WhatsApp", text(content["whatsapp"])),
        field("Discagem curta", text(content["short_dial"])),
        field("Email", text(content["email"])),
        field("Endereco", text(content["address"])),
        field("Descricao", text(content["description"])),
        field("Quando usar", text(content["when_to_use"])),
        field("Horario", text(content["hours_legacy_text"])),
        field("Fonte", text(content["source_type"])),
        field("Tags", list(content["tags"])),
        field("Nota", text(content["note"])),
      ])
    case "health_facility":
      return joinFields([
        field("Unidade de saude", text(content["name"])),
        field("Tipo", text(content["type"])),
        field("Bairro", text(content["neighborhood"])),
        field("Endereco", text(content["address"])),
        field("Telefone", text(content["phone"])),
        field("Telefone secundario", text(content["secondary_phone"])),
        field("WhatsApp", text(content["whatsapp"])),
        field("Horario", text(content["hours_legacy_text"])),
        field("Servicos", list(content["services"])),
        field("Requisitos", list(content["requirements"])),
        field("Fonte", text(content["source_type"])),
        field("Tags", list(content["tags"])),
        field("Nota", text(content["note"])),
      ])
    case "site_page":
      return joinFields([
        field("Pagina", text(content["title"])),
        field("Subtitulo", text(content["subtitle"])),
        field("Descricao", text(content["description"])),
        field("URL", text(content["url"])),
        field("Modulo", text(content["module_key"])),
        field("Palavras-chave", list(content["keywords"])),
        field("Conteudo", text(content["content"])),
      ])
  }
}

function joinFields(values: Array<string | null>): string {
  return values.filter((value): value is string => Boolean(value)).join("\n")
}

function field(label: string, value: string | null): string | null {
  return value ? `${label}: ${value}` : null
}

function booleanField(label: string, value: JsonValue | undefined): string | null {
  return typeof value === "boolean" ? `${label}: ${value ? "sim" : "nao"}` : null
}

function text(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function numberText(value: JsonValue | undefined): string | null {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : null
}

function money(value: JsonValue | undefined): string | null {
  return typeof value === "number" && Number.isFinite(value) ? `R$ ${value}` : null
}

function priceRange(min: JsonValue | undefined, max: JsonValue | undefined): string | null {
  const parts = [money(min), money(max)].filter((value): value is string => Boolean(value))
  return parts.length > 0 ? parts.join(" a ") : null
}

function list(value: JsonValue | undefined): string | null {
  if (!Array.isArray(value)) return null
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  return items.length > 0 ? items.join(", ") : null
}

function joinedName(value: JsonValue | undefined): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const name = value["name"]
  return typeof name === "string" ? name : null
}

function relatedServices(value: JsonValue | undefined): string | null {
  if (!Array.isArray(value)) return null
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      const name = text(item["name"])
      if (!name) return null
      const description = text(item["description"])
      const requirements = text(item["requirements"])
      return [name, description, requirements ? `Documentos: ${requirements}` : null]
        .filter((part): part is string => Boolean(part))
        .join(" - ")
    })
    .filter((item): item is string => Boolean(item))
  return items.length > 0 ? items.join(". ") : null
}

function relatedFaqQuestions(value: JsonValue | undefined): string | null {
  if (!Array.isArray(value)) return null
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null
      return text(item["question"])
    })
    .filter((item): item is string => Boolean(item))
  return items.length > 0 ? items.join(". ") : null
}

function attributesText(value: JsonValue | undefined): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const items = Object.entries(value)
    .filter(([, item]) => ["boolean", "string", "number"].includes(typeof item))
    .map(([key, item]) => `${key}: ${item === true ? "sim" : item === false ? "nao" : String(item)}`)
  return items.length > 0 ? items.join(", ") : null
}
