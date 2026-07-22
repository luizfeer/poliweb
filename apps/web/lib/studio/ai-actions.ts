'use server';

import { z } from 'zod';
import { anthropic, MODELS } from '@/lib/ai/anthropic';
import { requireProfile } from '@/lib/auth';
import { getCurrentCity } from '@/lib/cities';
import { createClient } from '@/lib/supabase/server';
import { gatherBusinessContext } from './business-context';
import {
  buildBusinessCopy,
  KIND_SECTION,
  seedSlideContent,
  type RamoCopy,
  type SlideContent,
} from './copy';
import {
  buildIntentSlides,
  FORMAT_IDS,
  INTENT_CAROUSELS,
  isAllowedPhotoSource,
  KIND_IDS,
  newSlideId,
  POST_INTENT_IDS,
  THEME_IDS,
  type BusinessContext,
  type KindId,
  type Slide,
  type ThemeId,
} from './types';

type SupabaseJobClient = {
  from: (
    table: string,
  ) => {
    insert: (values: Record<string, unknown> | Record<string, unknown>[]) => Promise<unknown>;
  };
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown }>;
};

async function db() {
  const supabase = await createClient();
  return supabase as unknown as SupabaseJobClient;
}

async function assertManagesBusiness(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('manages_business', { p_business_id: businessId });
  if (!data) throw new Error('Sem permissão para esse negócio.');
}

const generateSchema = z.object({
  businessId: z.string().uuid(),
  format: z.enum(FORMAT_IDS),
  intent: z.enum(POST_INTENT_IDS),
  freeText: z.string().trim().max(400).optional(),
  hasInstagram: z.boolean().optional(),
  handle: z.string().trim().max(60).optional(),
  pixKey: z.string().trim().max(80).optional(),
  assets: z
    .object({
      useCover: z.boolean().default(false),
      useLogo: z.boolean().default(false),
      galleryUrls: z.array(z.string()).max(10).default([]),
      productIds: z.array(z.string()).max(12).default([]),
      reviewId: z.string().nullable().default(null),
    })
    .default({ useCover: false, useLogo: false, galleryUrls: [], productIds: [], reviewId: null }),
});

export type GenerateCarouselResult = {
  ok: boolean;
  slides?: Slide[];
  usedAI?: boolean;
  note?: string;
  error?: string;
};

function themeFor(index: number): ThemeId {
  return index === 0 ? 'primary' : index % 2 === 0 ? 'paper' : 'ink';
}

/** Aplica as escolhas do briefing sobre o contexto carregado do servidor. */
function applyBriefing(
  ctx: BusinessContext,
  input: z.infer<typeof generateSchema>,
): BusinessContext {
  const next = { ...ctx };
  if (input.hasInstagram === false) {
    next.hasInstagram = false;
    next.instagram = null;
    // Sem Instagram: usa o nome do comércio (sem exemplo fixo) como assinatura.
    const slug = ctx.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    next.handle = `@${slug || 'meunegocio'}`;
  }
  if (input.handle && input.handle.trim()) {
    const at = input.handle.startsWith('@') ? input.handle : `@${input.handle}`;
    next.handle = at;
    next.instagram = at;
    next.hasInstagram = true;
  }
  if (input.pixKey && input.pixKey.trim()) next.pixKey = input.pixKey.trim();

  if (input.assets.productIds.length) {
    const wanted = new Set(input.assets.productIds);
    const picked = ctx.products.filter((p) => wanted.has(p.id));
    if (picked.length) next.products = picked;
  }
  if (input.assets.reviewId) {
    const picked = ctx.reviews.find((r) => r.id === input.assets.reviewId);
    if (picked) next.reviews = [picked, ...ctx.reviews.filter((r) => r.id !== picked.id)];
  }
  return next;
}

/** Escolhe a foto de capa para o card hero conforme o briefing. */
function pickHeroPhoto(ctx: BusinessContext, input: z.infer<typeof generateSchema>): string | null {
  const gallery = input.assets.galleryUrls.filter(isAllowedPhotoSource);
  if (input.assets.useCover && ctx.coverUrl && isAllowedPhotoSource(ctx.coverUrl)) return ctx.coverUrl;
  if (gallery.length) return gallery[0];
  if (ctx.coverUrl && isAllowedPhotoSource(ctx.coverUrl)) return ctx.coverUrl;
  return null;
}

/** Carrossel determinístico (sem IA), já com dados reais e fotos. */
function buildFallback(
  ctx: BusinessContext,
  copy: RamoCopy,
  input: z.infer<typeof generateSchema>,
): Slide[] {
  const slides = buildIntentSlides(ctx.ramo, input.format, input.intent, copy);
  const heroPhoto = pickHeroPhoto(ctx, input);
  const gallery = input.assets.galleryUrls.filter(isAllowedPhotoSource);
  let g = 0;
  return slides.map((s) => {
    if (s.kind === 'hero') return { ...s, photo: heroPhoto };
    if (gallery.length && g < gallery.length && (s.kind === 'novidade' || s.kind === 'depoimento')) {
      return { ...s, photo: gallery[g++] };
    }
    return s;
  });
}

// ── Prompt ───────────────────────────────────────────────────────────────────
const KIND_GUIDE: Record<KindId, string> = {
  hero: 'Capa: tag curta (2-3 palavras), headline forte (até 6 palavras), sub de 1 frase, meta [horário/dia, bairro].',
  oferta: 'Oferta: tag, title, de, por, desconto, validade, sub. NUNCA invente preços/descontos — só use se vierem nos dados.',
  vitrine: 'Vitrine: titulo, subtitulo, items[] com {name, price, meta}. Use só produtos reais fornecidos.',
  ficha: 'Ficha: titulo, sub, cells[] com {icon, lbl, val}. Use horário/pagamento/contato reais.',
  horario: 'Horário: titulo, sub, rows[] {day, hours}, note. Use exatamente os horários reais fornecidos.',
  pix: 'Pix: titulo, sub, keyLabel, key, holder, foot. Use a chave Pix fornecida; não invente chave.',
  depoimento: 'Depoimento: tag, quote (avaliação real, pode encurtar), author (1º nome), stars, foot.',
  novidade: 'Recado: tag, titulo, texto, meta. Aviso curto e verdadeiro.',
  roteiro: 'Roteiro: titulo, sub, steps[] {time, label, ttl}.',
  cta: 'Fechamento: headline, sub, pills[] (diferenciais reais), button (ação no WhatsApp).',
};

function buildPrompt(ctx: BusinessContext, copy: RamoCopy, input: z.infer<typeof generateSchema>): string {
  const intentLabel = input.intent;
  const suggested = INTENT_CAROUSELS[input.intent].join(', ');
  const dados = {
    nome: ctx.name,
    arroba: ctx.handle,
    categoria: ctx.category,
    cidade: ctx.cidade,
    bairro: ctx.district,
    endereco: ctx.address,
    descricao: ctx.description,
    horarios: ctx.hoursText,
    pagamentos: ctx.payments,
    diferenciais: ctx.amenities,
    contato_whatsapp: Boolean(ctx.whatsapp || ctx.phone),
    chave_pix: ctx.pixKey,
    produtos: ctx.products.map((p) => ({ nome: p.name, preco: p.price, obs: p.meta })),
    avaliacoes: ctx.reviews.map((r) => ({ autor: r.author.split(' ')[0], nota: r.rating, texto: r.comment })),
  };

  return [
    `Você é diretor de arte de um portal hiperlocal. Monte o conteúdo de um carrossel de Instagram para um comércio de ${ctx.cidade}.`,
    `Objetivo do post: ${intentLabel}.`,
    input.freeText ? `Pedido do comerciante: "${input.freeText}".` : '',
    '',
    'DADOS REAIS DO COMÉRCIO (única fonte de verdade — não invente fatos, preços, datas, telefones ou chaves):',
    JSON.stringify(dados, null, 0),
    '',
    `Sugestão de sequência de cards (pode ajustar): ${suggested}.`,
    'Tipos de card disponíveis e o que cada um leva:',
    Object.entries(KIND_GUIDE)
      .map(([k, g]) => `- ${k}: ${g}`)
      .join('\n'),
    '',
    'Regras:',
    '- 3 a 5 cards. Sempre comece com "hero" e termine com "cta".',
    '- Use SOMENTE os dados fornecidos. Se não houver preço/oferta, não crie card de oferta.',
    '- Texto em PT-BR, caloroso, local, sem clichê genérico. Sem emojis em excesso (no máximo 1 por campo).',
    '- Se o comércio tem @ real, use-o; senão use o nome do comércio.',
    '',
    'Responda APENAS com JSON válido neste formato (sem markdown):',
    '{"cards":[{"kind":"hero","theme":"primary","content":{"tag":"...","headline":"...","sub":"...","meta":["...","..."]}}]}',
    'theme ∈ paper|ink|primary|accent. content tem só os campos do tipo do card.',
  ]
    .filter(Boolean)
    .join('\n');
}

type ParsedCard = { kind: KindId; theme?: ThemeId; content: Record<string, unknown> };

function isParsedCard(candidate: unknown): candidate is ParsedCard {
  if (!candidate || typeof candidate !== 'object') return false;
  const item = candidate as Record<string, unknown>;
  return KIND_IDS.includes(item.kind as KindId) && (item.theme === undefined || THEME_IDS.includes(item.theme as ThemeId));
}

function coerceCards(raw: unknown): ParsedCard[] {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { cards?: unknown })?.cards)
      ? ((raw as { cards?: unknown }).cards as unknown[])
      : [];
  const out: ParsedCard[] = [];
  for (const candidate of arr) {
    if (!isParsedCard(candidate)) continue;
    const content = candidate.content && typeof candidate.content === 'object' ? candidate.content : {};
    out.push({ kind: candidate.kind, theme: candidate.theme, content });
  }
  return out.slice(0, 12);
}

function cardsToSlides(
  cards: Array<{ kind: KindId; theme?: ThemeId; content: Record<string, unknown> }>,
  copy: RamoCopy,
  ctx: BusinessContext,
  input: z.infer<typeof generateSchema>,
): Slide[] {
  const heroPhoto = pickHeroPhoto(ctx, input);
  const gallery = input.assets.galleryUrls.filter(isAllowedPhotoSource);
  let g = heroPhoto && gallery[0] === heroPhoto ? 1 : 0;
  let heroAssigned = false;

  return cards.map((card, i) => {
    const section = KIND_SECTION[card.kind];
    const seed: SlideContent = seedSlideContent(card.kind, copy) ?? {};
    const merged: SlideContent = { ...seed };
    const seedSection = seed[section];
    const nextSection = { ...(seedSection && typeof seedSection === 'object' ? seedSection : {}), ...card.content };
    switch (section) {
      case 'hero':
        merged.hero = nextSection as NonNullable<SlideContent['hero']>;
        break;
      case 'vitrine':
        merged.vitrine = nextSection as NonNullable<SlideContent['vitrine']>;
        break;
      case 'oferta':
        merged.oferta = nextSection as NonNullable<SlideContent['oferta']>;
        break;
      case 'ficha':
        merged.ficha = nextSection as NonNullable<SlideContent['ficha']>;
        break;
      case 'horario':
        merged.horario = nextSection as NonNullable<SlideContent['horario']>;
        break;
      case 'pix':
        merged.pix = nextSection as NonNullable<SlideContent['pix']>;
        break;
      case 'depoimento':
        merged.depoimento = nextSection as NonNullable<SlideContent['depoimento']>;
        break;
      case 'novidade':
        merged.novidade = nextSection as NonNullable<SlideContent['novidade']>;
        break;
      case 'roteiro':
        merged.roteiro = nextSection as NonNullable<SlideContent['roteiro']>;
        break;
      case 'cta':
        merged.cta = nextSection as NonNullable<SlideContent['cta']>;
        break;
    }

    let photo: string | null = null;
    if (card.kind === 'hero' && !heroAssigned) {
      photo = heroPhoto;
      heroAssigned = true;
    } else if (gallery.length && g < gallery.length && (card.kind === 'novidade' || card.kind === 'depoimento')) {
      photo = gallery[g++];
    }

    return {
      id: newSlideId(),
      kind: card.kind,
      theme: card.theme ?? themeFor(i),
      format: input.format,
      photo,
      content: merged,
    } satisfies Slide;
  });
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const arrStart = body.indexOf('[');
  const from = start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
  if (from === -1) throw new Error('Sem JSON na resposta.');
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  return JSON.parse(body.slice(from, end + 1));
}

export async function generateArtCarouselAction(
  input: z.input<typeof generateSchema>,
): Promise<GenerateCarouselResult> {
  const city = await getCurrentCity();
  if (!city) return { ok: false, error: 'Cidade não encontrada.' };

  const auth = await requireProfile();
  const parsed = generateSchema.parse(input);
  await assertManagesBusiness(parsed.businessId);

  let ctx = await gatherBusinessContext(city.id, city.slug, city.name, parsed.businessId);
  ctx = applyBriefing(ctx, parsed);
  const copy = buildBusinessCopy(ctx);

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: true,
      usedAI: false,
      slides: buildFallback(ctx, copy, parsed),
      note: 'Carrossel montado com seus dados (IA indisponível no momento).',
    };
  }

  const supabase = await db();
  const jobInput = { business_id: parsed.businessId, intent: parsed.intent, actor_id: auth.profile.id };
  await supabase.from('ai_jobs').insert({
    city_id: city.id,
    job_type: 'studio_carousel',
    status: 'running',
    model: MODELS.sonnet,
    input_ref: jobInput,
    started_at: new Date().toISOString(),
  });

  try {
    const response = await anthropic().messages.create({
      model: MODELS.sonnet,
      max_tokens: 1600,
      messages: [{ role: 'user', content: buildPrompt(ctx, copy, parsed) }],
    });
    const textOut = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();

    const cards = coerceCards(extractJson(textOut));
    if (cards.length < 2) throw new Error('IA retornou poucos cards.');
    const slides = cardsToSlides(cards, copy, ctx, parsed);

    await supabase.from('ai_jobs').insert({
      city_id: city.id,
      job_type: 'studio_carousel',
      status: 'completed',
      model: MODELS.sonnet,
      input_ref: jobInput,
      output_ref: { cards: cards.length },
      tokens_input: response.usage.input_tokens,
      tokens_output: response.usage.output_tokens,
      finished_at: new Date().toISOString(),
    });

    return { ok: true, usedAI: true, slides };
  } catch (e) {
    await supabase.from('ai_jobs').insert({
      city_id: city.id,
      job_type: 'studio_carousel',
      status: 'error',
      model: MODELS.sonnet,
      input_ref: jobInput,
      output_ref: { error: e instanceof Error ? e.message : 'unknown' },
      finished_at: new Date().toISOString(),
    });
    return {
      ok: true,
      usedAI: false,
      slides: buildFallback(ctx, copy, parsed),
      note: 'Não consegui falar com a IA agora — montei o carrossel com seus dados.',
    };
  }
}
