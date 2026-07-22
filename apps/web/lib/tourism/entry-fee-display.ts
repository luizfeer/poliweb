export type AttractionEntryTone = 'free' | 'paid' | 'neutral';

export type AttractionEntryPresentation = {
  tone: AttractionEntryTone;
  /** Valor principal (valor em reais, “Grátis”, etc.) */
  title: string;
  /** Contexto curto opcional */
  description?: string;
};

const EXACT: Record<string, AttractionEntryPresentation> = {
  gratuito: {
    tone: 'free',
    title: 'Grátis',
    description: 'Sem cobrança de ingresso na entrada.',
  },
  consultar: {
    tone: 'neutral',
    title: 'Consultar no local',
    description: 'O valor pode mudar por temporada, feriado ou operador.',
  },
  taxa_10_15: {
    tone: 'paid',
    title: 'R$ 10 a R$ 15',
    description: 'Taxa de visita ou preservação (faixa típica).',
  },
  taxa_media_10: {
    tone: 'paid',
    title: 'Cerca de R$ 10',
    description: 'Taxa simbólica ou de preservação.',
  },
  gratuito_ou_guia_100_150: {
    tone: 'free',
    title: 'Acesso gratuito',
    description: 'Passeios guiados costumam de R$ 100 a R$ 150 por pessoa.',
  },
  gratuito_ou_lancha_80_150: {
    tone: 'free',
    title: 'Acesso gratuito',
    description: 'Passeios de lancha costumam de R$ 80 a R$ 150 por pessoa.',
  },
};

function prettySnakeWords(raw: string): string {
  return raw
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseTaxaRange(key: string): AttractionEntryPresentation | null {
  const m = /^taxa_(\d+)_(\d+)$/i.exec(key);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return {
    tone: 'paid',
    title: `R$ ${a} a R$ ${b}`,
    description: 'Taxa de visita ou preservação.',
  };
}

function parseTaxaMedia(key: string): AttractionEntryPresentation | null {
  const m = /^taxa_media_(\d+)$/i.exec(key);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return {
    tone: 'paid',
    title: `Cerca de R$ ${n}`,
    description: 'Taxa média informada.',
  };
}

function parseGratuitoOuServico(key: string): AttractionEntryPresentation | null {
  const m = /^gratuito_ou_([a-z0-9]+)_(\d+)_(\d+)$/i.exec(key);
  if (!m) return null;
  const kind = m[1]!.toLowerCase();
  const lo = Number(m[2]);
  const hi = Number(m[3]);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;

  const serviceHint =
    kind.includes('guia') ? 'Passeios guiados costumam'
    : kind.includes('lancha') ? 'Passeios de lancha costumam'
    : kind.includes('jeep') ? 'Passeios de jeep costumam'
    : 'Serviços opcionais costumam';

  return {
    tone: 'free',
    title: 'Acesso gratuito',
    description: `${serviceHint} de R$ ${lo} a R$ ${hi} por pessoa.`,
  };
}

/**
 * Texto curto para chips e meta de listagem (uma linha).
 */
export function formatAttractionEntryCompact(raw: string | null | undefined): string {
  const p = formatAttractionEntryPresentation(raw);
  if (p.description && p.tone === 'free' && p.title === 'Acesso gratuito') {
    const nums = p.description.match(/R\$\s*[\d.]+/g);
    if (nums && nums.length >= 2) {
      const a = nums[0]!.replace(/\s+/g, '');
      const b = nums[1]!.replace(/\s+/g, '');
      return `Grátis · ${a}–${b}`;
    }
    return 'Grátis · serviços pagos';
  }
  if (p.title.startsWith('R$')) {
    return p.title;
  }
  return p.title;
}

/**
 * Apresentação amigável para taxas/ingressos vindos de seeds, Google ou texto livre.
 */
export function formatAttractionEntryPresentation(raw: string | null | undefined): AttractionEntryPresentation {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length > 48 && !trimmed.includes('_')) {
    return { tone: 'neutral', title: trimmed };
  }

  if (!trimmed) {
    return {
      tone: 'neutral',
      title: 'Consultar no local',
      description: 'Valor não informado no portal.',
    };
  }

  const lower = trimmed.toLowerCase();

  if (/r\$\s*[\d.,]+/i.test(trimmed)) {
    return {
      tone: 'paid',
      title: trimmed.replace(/\s+a\s+/i, ' a ').replace(/\s+/g, ' ').trim(),
      description: 'Valores podem mudar; confirme antes de ir.',
    };
  }

  if (/^\${1,4}$/.test(trimmed)) {
    const hint =
      trimmed === '$' ? 'Faixa econômica'
      : trimmed === '$$' ? 'Faixa moderada'
      : trimmed === '$$$' ? 'Faixa alta'
      : 'Faixa premium';
    return {
      tone: 'paid',
      title: `${trimmed} (${hint})`,
      description: 'Indicador de preço do Google — referência geral.',
    };
  }

  const exact = EXACT[lower];
  if (exact) return exact;

  const range = parseTaxaRange(lower);
  if (range) return range;

  const media = parseTaxaMedia(lower);
  if (media) return media;

  const combo = parseGratuitoOuServico(lower);
  if (combo) return combo;

  if (!trimmed.includes('_')) {
    return { tone: 'neutral', title: trimmed };
  }

  return {
    tone: 'neutral',
    title: prettySnakeWords(trimmed),
    description: 'Código interno — confirme valores no local.',
  };
}
