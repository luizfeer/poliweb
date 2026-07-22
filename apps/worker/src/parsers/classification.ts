import type { DiaryActCategory } from "../types.js"

const CATEGORY_PATTERNS: Array<[DiaryActCategory, RegExp]> = [
  ["termo_aditivo", /\btermo\s+aditivo\b/i],
  ["processo_seletivo", /\bprocesso\s+seletivo\b/i],
  ["chamamento", /\bchamamento\b/i],
  ["licitacao", /\b(licita[cç][aã]o|preg[aã]o|concorr[eê]ncia|dispensa|inexigibilidade)\b/i],
  ["nomeacao", /\b(nomeia|nomea[cç][aã]o|exonera|designa)\b/i],
  ["convenio", /\bconv[eê]nio\b/i],
  ["resolucao", /\bresolu[cç][aã]o\b/i],
  ["portaria", /\bportaria\b/i],
  ["decreto", /\bdecreto\b/i],
  ["edital", /\bedital\b/i],
  ["extrato", /\bextrato\b/i],
  ["lei", /\blei\b/i],
]

const SENSITIVE_PATTERNS = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\bCPF\b/i,
  /\b(endere[cç]o residencial|rua|avenida|travessa)\b.+\b(n[ºo.]|numero)\b/i,
  /\b(prontu[aá]rio|laudo m[eé]dico|afastamento m[eé]dico|CID)\b/i,
  /\b(menor de idade|crian[cç]a|adolescente)\b/i,
]

export function classifyDiaryAct(text: string): DiaryActCategory {
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) {
      return category
    }
  }
  return "outros"
}

export function hasSensitiveData(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text))
}

export function normalizeTenderStatus(text: string): string {
  if (/\b(suspens|cancelad|anulad|revogad)\w*/i.test(text)) {
    return "cancelled"
  }
  if (/\b(homologad|adjudicad|vencedor|contratad)\w*/i.test(text)) {
    return "awarded"
  }
  if (/\b(encerrad|finalizad|fechad)\w*/i.test(text)) {
    return "closed"
  }
  return "open"
}

export function normalizeModality(text: string): string | null {
  const patterns: Array<[string, RegExp]> = [
    ["pregao", /\bpreg[aã]o\b/i],
    ["concorrencia", /\bconcorr[eê]ncia\b/i],
    ["dispensa", /\bdispensa\b/i],
    ["inexigibilidade", /\binexigibilidade\b/i],
    ["tomada_precos", /\btomada\s+de\s+pre[cç]os\b/i],
    ["chamada_publica", /\bchamada\s+p[uú]blica\b/i],
  ]

  for (const [modality, pattern] of patterns) {
    if (pattern.test(text)) {
      return modality
    }
  }
  return null
}
