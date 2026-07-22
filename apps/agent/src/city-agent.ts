import { stepCountIs } from 'ai';
import type { AgentEnv } from './config.js';
import { ctaForQuery, referralCtaForQuery } from './cta-map.js';
import { embedQuery } from './embeddings.js';
import { classifyIntent, type Intent } from './intent.js';
import { generateTextWithFallback } from './llm.js';
import { costUsd } from './pricing.js';
import { getCityEvents, getCityNews, searchPlatformFAQ } from './platform.js';
import { routeQuery } from './router.js';
import type {
  AgentResponse,
  AgentResponseBlock,
  ConversationMessage,
  CtaButton,
  EntityRef,
  HourEntry,
  SearchResultItem,
} from './response-types.js';
import type { createServiceClient } from './supabase.js';
import { createCityTools, fetchEntityList } from './tools.js';
import { ALL_ENTITY_TYPES, type EntityType } from './entities.js';

type Supabase = ReturnType<typeof createServiceClient>;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://carmolocal.com.br';

/** Detecta se a query é browsing de categoria pura (ex: "guias de turismo", "pousadas"). */
/** Palavras que indicam busca específica de item/serviço — se aparecerem, não ativa fast-path de categoria. */
const EXCLUSION_WORDS = [
  'vestido',
  'terno',
  'fantasia',
  'roupa',
  'roupas',
  'mesa',
  'cadeira',
  'talher',
  'prato',
  'copo',
  'panela',
  'buffet',
  'decoração',
  'decoracao',
  'flor',
  'balão',
  'balaozinho',
  'papelaria',
  'som',
  'dj',
  'iluminação',
  'iluminacao',
  'foto',
  'fotografo',
  'filmagem',
  'salão',
  'salao',
  'buffet',
  'bolo',
  'doce',
  'salgado',
  'carro',
  'moto',
  'van',
  'ônibus',
  'onibus',
  'frete',
  'mudança',
  'mudanca',
  'trator',
  'máquina',
  'maquina',
  'equipamento',
  'ferramenta',
  'inflável',
  'inflavel',
  'brinquedo',
  'pula-pula',
  'piscina',
  'quanto',
  'preço',
  'preco',
  'custa',
  'barato',
  'caro',
];

function hasExclusionWord(query: string): boolean {
  const q = query.toLowerCase();
  return EXCLUSION_WORDS.some((w) => q.includes(w));
}

function detectCategoryQuery(query: string): EntityType | null {
  const q = query.toLowerCase().trim();

  // Se tem palavra de exclusão, não ativa fast-path — deixa o LLM/search_entities resolver
  if (hasExclusionWord(q)) return null;

  // Só ativa fast-path se a query for CURTA (até 6 palavras) e CLARA de categoria
  const wordCount = q.split(/\s+/).length;
  if (wordCount > 8) return null;

  const CATEGORY_PATTERNS: Array<{ type: EntityType; regex: RegExp }> = [
    {
      type: 'tourism_guide',
      regex: /^\s*(quero\s+)?guias?\s+(de\s+)?turismo\s*$/,
    },
    {
      type: 'accommodation',
      regex: /^\s*(quero\s+|lista\s+de\s+|onde\s+)?pousadas?\s*$/,
    },
    {
      type: 'accommodation',
      regex: /^\s*(quero\s+|lista\s+de\s+)?hoteis?\s*$/,
    },
    {
      type: 'accommodation',
      regex: /^\s*(onde\s+)?ficar\s*$/,
    },
    {
      type: 'restaurant',
      regex: /^\s*(quero\s+|lista\s+de\s+)?restaurantes?\s*$/,
    },
    {
      type: 'restaurant',
      regex: /^\s*(onde\s+)?comer\s*$/,
    },
    {
      type: 'attraction',
      regex: /^\s*(principais\s+)?atraç(ão|ões|ao|oes)\s*$/,
    },
    {
      type: 'attraction',
      regex: /^\s*(o\s+que\s+)?(fazer|visitar|conhecer)\s*$/,
    },
    {
      type: 'tour_package',
      regex: /^\s*(quero\s+|lista\s+de\s+)?pacotes?\s*(tur(íi)stico(s)?)?\s*$/,
    },
    {
      type: 'tour_package',
      regex: /^\s*(quero\s+|lista\s+de\s+)?roteiros?\s*$/,
    },
    {
      type: 'fishing_guide',
      regex: /^\s*(quero\s+|lista\s+de\s+)?guias?\s+de\s+pesca\s*$/,
    },
    {
      type: 'fishing_spot',
      regex: /^\s*(quero\s+|lista\s+de\s+)?pontos?\s+de\s+pesca\s*$/,
    },
    {
      type: 'business',
      regex: /^\s*(quero\s+|lista\s+de\s+)?com(é|e)rcios?\s*$/,
    },
    {
      type: 'business',
      regex: /^\s*(quero\s+|lista\s+de\s+)?lojas?\s*$/,
    },
    {
      type: 'property',
      regex: /^\s*(quero\s+|lista\s+de\s+)?im(ó|o)veis?\s*$/,
    },
    {
      type: 'property',
      regex: /^\s*(quero\s+|lista\s+de\s+)?casas?\s+(a\s+venda|para\s+alugar)\s*$/,
    },
    {
      type: 'property',
      regex: /^\s*(quero\s+|lista\s+de\s+)?apartamentos?\s*$/,
    },
  ];

  for (const { type, regex } of CATEGORY_PATTERNS) {
    if (regex.test(q)) return type;
  }
  return null;
}

export async function runCityAgent(input: {
  supabase: Supabase;
  env: AgentEnv;
  query: string;
  cityId: string;
  cityName: string;
  profileId?: string | null;
  channel?: string | null;
  conversation?: ConversationMessage[];
  pageContext?: string | null;
  isFirstMessage?: boolean;
}): Promise<AgentResponse> {
  const isFirst = input.isFirstMessage === true;
  const intent = classifyIntent(input.query);
  const startedAt = new Date().toISOString();
  const usedTools: string[] = [];
  const cta = ctaForQuery(input.query);
  const ctaOpt = cta.length > 0 ? { cta } : {};

  try {
    // ── 1. Router híbrido ──
    const action = await routeQuery(input.query, input.env);

    const directGarbageRows = await getDirectGarbageScheduleRows(
      input.supabase,
      input.cityId,
      input.query,
    );
    if (directGarbageRows) {
      usedTools.push('get_garbage_schedule');
      const blocks = formatToolResultBlocks(directGarbageRows);

      await logAiJob(input.supabase, {
        cityId: input.cityId,
        model: input.env.model,
        status: 'completed',
        startedAt,
        query: input.query,
        profileId: input.profileId ?? null,
        channel: input.channel ?? 'web',
        intent,
        blocks,
        usedTools,
        tokensInput: 0,
        tokensOutput: 0,
        costUsd: 0,
      });
      return {
        blocks,
        fallback: false,
        intent,
        model: input.env.model,
        title: isFirst ? makeFastPathTitle('hours', input.query) : null,
        ...ctaOpt,
      };
    }

    // ── Balsa ambígua: pergunta qual antes de chamar a tool ──
    const ferryAskWords = /\bbalsa\b|\bbalsas\b|travessia|travessias|\bferry\b/i;
    const ferrySpecific =
      /águas verdes|aguas verdes|itapiché|itapiche|são francisco|sao francisco|\bitaci\b|campo do meio|ponte do itapiché|ponte do itapiche/i;
    if (ferryAskWords.test(input.query) && !ferrySpecific.test(input.query)) {
      const historyText = (input.conversation ?? []).map((m) => m.text).join(' ');
      if (!ferrySpecific.test(historyText)) {
        const { data: routes } = await input.supabase
          .from('ferry_routes')
          .select('slug, name, short_name, endpoint_a_label, endpoint_b_label')
          .eq('city_id', input.cityId)
          .eq('active', true)
          .order('display_order', { ascending: true });
        const list = Array.isArray(routes) ? routes : [];
        if (list.length > 1) {
          const lines = list
            .map(
              (r: any) =>
                `- ${r.short_name ?? r.name} (${r.endpoint_a_label ?? '?'} ⇄ ${r.endpoint_b_label ?? '?'})`,
            )
            .join('\n');
          const text = `Temos ${list.length} travessias ativas no Lago de Furnas. Qual você quer ver?\n\n${lines}`;
          const ferryCta: CtaButton[] = list.map((r: any, i: number) => ({
            label: r.short_name ?? r.name,
            href: `/balsas/${r.slug}`,
            variant: i === 0 ? ('primary' as const) : ('secondary' as const),
          }));
          const blocks: AgentResponseBlock[] = [{ type: 'text', text }];
          usedTools.push('ferry_disambiguation');
          await logAiJob(input.supabase, {
            cityId: input.cityId,
            model: input.env.model,
            status: 'completed',
            startedAt,
            query: input.query,
            profileId: input.profileId ?? null,
            channel: input.channel ?? 'web',
            intent,
            blocks,
            usedTools,
            tokensInput: 0,
            tokensOutput: 0,
            costUsd: 0,
          });
          return {
            blocks,
            fallback: false,
            intent,
            model: input.env.model,
            title: isFirst ? makeFastPathTitle('hours', input.query) : null,
            cta: ferryCta,
          };
        }
      }
    }

    const itineraryResponse = await maybeBuildItineraryResponse({
      supabase: input.supabase,
      cityId: input.cityId,
      cityName: input.cityName,
      query: input.query,
      conversation: input.conversation ?? [],
    });
    if (itineraryResponse) {
      usedTools.push(...itineraryResponse.usedTools);

      await logAiJob(input.supabase, {
        cityId: input.cityId,
        model: input.env.model,
        status: 'completed',
        startedAt,
        query: input.query,
        profileId: input.profileId ?? null,
        channel: input.channel ?? 'web',
        intent,
        blocks: itineraryResponse.blocks,
        usedTools,
        tokensInput: 0,
        tokensOutput: 0,
        costUsd: 0,
      });
      return {
        blocks: itineraryResponse.blocks,
        fallback: itineraryResponse.fallback,
        intent,
        model: input.env.model,
        title: isFirst ? 'Roteiro personalizado' : null,
        ...ctaOpt,
      };
    }

    // FAQ direto
    if (action.type === 'faq') {
      const faqs = await searchPlatformFAQ(input.query);
      usedTools.push('get_platform_faq');
      const blocks: AgentResponseBlock[] = faqs.length
        ? [{ type: 'faq', items: faqs }]
        : [
            {
              type: 'fallback',
              text: `Não encontrei uma resposta específica para "${input.query}". Tente reformular ou entre em contato pelo e-mail contato@carmodorioclaro.com.br`,
            },
          ];

      await logAiJob(input.supabase, {
        cityId: input.cityId,
        model: input.env.model,
        status: 'completed',
        startedAt,
        query: input.query,
        profileId: input.profileId ?? null,
        channel: input.channel ?? 'web',
        intent,
        blocks,
        usedTools,
        tokensInput: 0,
        tokensOutput: 0,
        costUsd: 0,
      });
      return {
        blocks,
        fallback: !faqs.length,
        intent,
        model: input.env.model,
        title: isFirst ? makeFastPathTitle('faq', input.query) : null,
        ...ctaOpt,
      };
    }

    // Notícias direto
    if (action.type === 'news') {
      const news = await getCityNews(input.supabase, input.cityId, action.limit);
      usedTools.push('get_city_news');
      const blocks: AgentResponseBlock[] = news.length
        ? [
            {
              type: 'news',
              items: news.map((n: any) => ({
                title: n.title,
                slug: n.slug,
                excerpt: n.excerpt,
                cover_url: n.cover_url,
                published_at: n.published_at,
              })),
            },
          ]
        : [{ type: 'text', text: 'Não encontrei notícias recentes. Volte em breve!' }];

      await logAiJob(input.supabase, {
        cityId: input.cityId,
        model: input.env.model,
        status: 'completed',
        startedAt,
        query: input.query,
        profileId: input.profileId ?? null,
        channel: input.channel ?? 'web',
        intent,
        blocks,
        usedTools,
        tokensInput: 0,
        tokensOutput: 0,
        costUsd: 0,
      });
      return {
        blocks,
        fallback: !news.length,
        intent,
        model: input.env.model,
        title: isFirst ? makeFastPathTitle('news', input.query) : null,
        ...ctaOpt,
      };
    }

    // Eventos direto
    if (action.type === 'events') {
      const events = await getCityEvents(input.supabase, input.cityId, action.limit);
      usedTools.push('get_city_events');
      const blocks: AgentResponseBlock[] = events.length
        ? [
            {
              type: 'events',
              items: events.map((e: any) => ({
                title: e.title,
                slug: e.slug,
                starts_at: e.starts_at,
                ends_at: e.ends_at,
                location: e.location,
                cover_url: e.cover_url,
              })),
            },
          ]
        : [
            {
              type: 'text',
              text: 'Não encontrei eventos programados. A agenda está vazia no momento!',
            },
          ];

      await logAiJob(input.supabase, {
        cityId: input.cityId,
        model: input.env.model,
        status: 'completed',
        startedAt,
        query: input.query,
        profileId: input.profileId ?? null,
        channel: input.channel ?? 'web',
        intent,
        blocks,
        usedTools,
        tokensInput: 0,
        tokensOutput: 0,
        costUsd: 0,
      });
      return {
        blocks,
        fallback: !events.length,
        intent,
        model: input.env.model,
        title: isFirst ? makeFastPathTitle('events', input.query) : null,
        ...ctaOpt,
      };
    }

    // ── 1.4 Fast-path categoria pura (lista/browsing) ──
    // Evita depender do LLM escolher entre list_entities e search_entities.
    const categoryType = detectCategoryQuery(input.query);
    if (categoryType) {
      try {
        const items = await fetchEntityList({
          supabase: input.supabase,
          cityId: input.cityId,
          type: categoryType,
          limit: 8,
        });
        usedTools.push('list_entities');

        if (Array.isArray(items) && items.length > 0) {
          const searchItems: SearchResultItem[] = items.map((item: any) => ({
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            name: item.name,
            url: item.url ? `${APP_URL}${item.url}` : null,
            cover_url: item.cover_url ?? null,
          }));

          // Gera narrativa amigável ancorada nos resultados reais
          const entityNames = searchItems.map((i) => i.name).slice(0, 6);
          let narrative = '';
          try {
            const narrativeResult = await generateTextWithFallback(
              {
                prompt: [
                  `Você é um guia local de ${input.cityName}, na região do Lago de Furnas/Serra da Canastra (MG).`,
                  `O usuário perguntou: "${input.query}".`,
                  `Encontrei no banco local: ${entityNames.join(', ')}.`,
                  'Escreva 2 a 4 frases curtas em PT-BR, tom acolhedor de guia local. NÃO use markdown. NÃO liste em bullet. NÃO repita o nome da cidade em toda frase. Mencione 2 ou 3 nomes reais da lista acima.',
                ].join('\n\n'),
                temperature: 0.4,
                maxOutputTokens: 400,
              },
              input.env,
            );
            narrative = narrativeResult.result.text?.trim() ?? '';
            if (narrative.length >= 40) usedTools.push('narrative_pass');
          } catch (e) {
            console.error('[city-agent] category narrative pass failed:', e);
          }

          const blocks: AgentResponseBlock[] = [];
          if (narrative.length >= 40) {
            blocks.push({ type: 'text', text: narrative });
          }
          blocks.push({ type: 'search_results', items: searchItems });

          await logAiJob(input.supabase, {
            cityId: input.cityId,
            model: input.env.model,
            status: 'completed',
            startedAt,
            query: input.query,
            profileId: input.profileId ?? null,
            channel: input.channel ?? 'web',
            intent,
            blocks,
            usedTools,
            tokensInput: 0,
            tokensOutput: 0,
            costUsd: 0,
          });
          return {
            blocks,
            fallback: false,
            intent,
            model: input.env.model,
            title: isFirst ? makeFastPathTitle('search', input.query) : null,
            ...ctaOpt,
          };
        } else {
          // Resultado vazio — fallback acolhedor que sugere alternativas
          const friendlyFallbacks: Record<EntityType, string> = {
            tourism_guide:
              'Ainda não tenho guias de turismo cadastrados por aqui, mas posso te ajudar com outras coisas! Quer conhecer as atrações da região, ver onde ficar ou saber sobre os passeios de balsa?',
            accommodation:
              'Não encontrei hospedagens cadastradas no momento. Posso te mostrar atrações, restaurantes ou guias de turismo — o que prefere?',
            restaurant:
              'Não tenho restaurantes na lista agora. Quer ver onde ficar, o que fazer ou os eventos da cidade?',
            attraction:
              'Ainda não tenho atrações cadastradas. Posso te ajudar com hospedagem, restaurantes ou as balsas do Lago de Furnas.',
            tour_package:
              'Não encontrei pacotes turísticos por aqui. Quer saber das atrações, onde ficar ou os roteiros dos guias locais?',
            fishing_guide:
              'Ainda não tenho guias de pesca cadastrados. Quer conhecer os pontos de pesca ou as atrações da região?',
            fishing_spot:
              'Não encontrei pontos de pesca cadastrados. Posso te mostrar guias de turismo ou onde ficar.',
            business:
              'Não tenho comércios cadastrados no momento. Quer ver restaurantes, serviços ou atrações da cidade?',
            property:
              'Não encontrei imóveis cadastrados agora. Posso te ajudar com outras informações da cidade.',
            event:
              'Não tem eventos programados no momento. A agenda está vazia, mas posso te mostrar outras coisas!',
            classified:
              'Não encontrei classificados ativos. Quer ver comércios ou serviços da cidade?',
            emergency_contact:
              'Não tenho esses contatos cadastrados. Em emergência, ligue 192 (SAMU), 193 (Bombeiros) ou 190 (Polícia).',
            health_facility:
              'Não encontrei unidades de saúde cadastradas. Em emergência, procure o Pronto Socorro mais próximo.',
          };

          const blocks: AgentResponseBlock[] = [
            {
              type: 'text',
              text:
                friendlyFallbacks[categoryType] ??
                'Ainda não tenho isso cadastrado, mas posso te ajudar com outras informações da cidade! O que você gostaria de saber?',
            },
          ];

          await logAiJob(input.supabase, {
            cityId: input.cityId,
            model: input.env.model,
            status: 'completed',
            startedAt,
            query: input.query,
            profileId: input.profileId ?? null,
            channel: input.channel ?? 'web',
            intent,
            blocks,
            usedTools,
            tokensInput: 0,
            tokensOutput: 0,
            costUsd: 0,
          });
          const referralCta = referralCtaForQuery(input.query, input.cityName);
          const fallbackCtaOpt = referralCta
            ? { cta: [...(ctaOpt.cta ?? []), referralCta] }
            : ctaOpt;

          return {
            blocks,
            fallback: true,
            intent,
            model: input.env.model,
            title: isFirst ? makeFastPathTitle('search', input.query) : null,
            ...fallbackCtaOpt,
          };
        }
      } catch (e) {
        console.error('[city-agent] category fast-path error:', e);
        // continua pro LLM normal em caso de erro
      }
    }

    // ── 1.5 Busca direta de horário (comércio; NÃO usar para balsas — "balsas" colide com "balas" no embedding) ──
    const hoursWords =
      /aberto|abre|fecha|fechad|funciona|funcionamento|horário|horario|atende|que horas/i;
    const churchWords = /missa|culto|celebração|liturgia|programação.*igreja|horário.*igreja/i;
    const garbageContextWords =
      /\bcoleta\b|\blixo\b|res[íi]duo|recicl[áa]vel|org[âa]nico|descarte/i;
    const ferryContextWords =
      /\bbalsa\b|\bbalsas\b|travessia|travessias|ferry|itaci|itapiché|itapiche|águas verdes|aguas verdes|furnas|embarcaç|embarcac|\bbarca\b|lancha.*represa/i;
    if (
      hoursWords.test(input.query) &&
      !churchWords.test(input.query) &&
      !garbageContextWords.test(input.query) &&
      !ferryContextWords.test(input.query)
    ) {
      try {
        const embedding = await embedQuery(input.query, input.env);
        const { data: rows } = await input.supabase.rpc('match_embeddings', {
          p_city_id: input.cityId,
          p_query_vector: embedding,
          p_limit: 3,
          p_entity_types: null,
        });

        if (Array.isArray(rows) && rows.length > 0) {
          const first = rows[0];
          const [{ data: hoursData }, { data: entityData }] = await Promise.all([
            input.supabase
              .from('entity_hours')
              .select('weekday, starts_at, ends_at, kind, source_status')
              .eq('city_id', input.cityId)
              .eq('entity_type', first.entity_type)
              .eq('entity_id', first.entity_id)
              .eq('active', true),
            input.supabase
              .from(first.entity_type === 'business' ? 'businesses' : first.entity_type + 's')
              .select('name, slug, cover_url')
              .eq('id', first.entity_id)
              .eq('city_id', input.cityId)
              .maybeSingle(),
          ]);

          const name = entityData?.name ?? first.entity_type;
          const slug = entityData?.slug ?? null;
          const url = slug ? `${APP_URL}/comercio/negocio/${slug}` : null;

          const entityRef: EntityRef = {
            name,
            entity_type: first.entity_type,
            entity_id: first.entity_id,
            slug,
            url,
          };

          if (Array.isArray(hoursData) && hoursData.length > 0) {
            const now = new Date();
            const currentWeekday = now.getDay();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const hours: HourEntry[] = hoursData.map((h: any) => {
              const weekday = h.weekday ?? 0;
              const starts = h.starts_at ? parseTime(h.starts_at) : null;
              const ends = h.ends_at ? parseTime(h.ends_at) : null;
              const isToday = weekday === currentWeekday;
              const isOpenNow =
                isToday &&
                starts !== null &&
                ends !== null &&
                currentTime >= starts &&
                currentTime <= ends;

              return {
                weekday,
                starts_at: h.starts_at ? h.starts_at.slice(0, 5) : null,
                ends_at: h.ends_at ? h.ends_at.slice(0, 5) : null,
                label: `${weekdayLabel(weekday)}: ${h.starts_at ? h.starts_at.slice(0, 5) : '--:--'} às ${h.ends_at ? h.ends_at.slice(0, 5) : '--:--'}`,
                is_open_now: isOpenNow,
              };
            });

            const todayEntry = hours.find((h) => h.weekday === currentWeekday);
            const isOpenNow = todayEntry?.is_open_now ?? null;
            const statusLabel =
              isOpenNow === true
                ? `Aberto agora · fecha às ${todayEntry?.ends_at ?? '--:--'}`
                : isOpenNow === false
                  ? `Fechado agora · abre ${todayEntry ? `${weekdayLabel(todayEntry.weekday)} às ${todayEntry.starts_at}` : 'em breve'}`
                  : 'Horário não informado';

            const blocks: AgentResponseBlock[] = [
              {
                type: 'entity_hours',
                entity: entityRef,
                is_open_now: isOpenNow,
                hours,
                status_label: statusLabel,
              },
            ];
            usedTools.push('search_entities', 'get_entity_status');

            await logAiJob(input.supabase, {
              cityId: input.cityId,
              model: input.env.model,
              status: 'completed',
              startedAt,
              query: input.query,
              profileId: input.profileId ?? null,
              channel: input.channel ?? 'web',
              intent,
              blocks,
              usedTools,
              tokensInput: 0,
              tokensOutput: 0,
              costUsd: 0,
            });
            return {
              blocks,
              fallback: false,
              intent,
              model: input.env.model,
              title: isFirst ? makeFastPathTitle('hours', input.query) : null,
              ...ctaOpt,
            };
          } else {
            const blocks: AgentResponseBlock[] = [
              {
                type: 'text',
                text: `Encontrei **${name}**, mas não tenho os horários cadastrados. Recomendo ligar para confirmar.`,
              },
            ];
            usedTools.push('search_entities');

            await logAiJob(input.supabase, {
              cityId: input.cityId,
              model: input.env.model,
              status: 'completed',
              startedAt,
              query: input.query,
              profileId: input.profileId ?? null,
              channel: input.channel ?? 'web',
              intent,
              blocks,
              usedTools,
              tokensInput: 0,
              tokensOutput: 0,
              costUsd: 0,
            });
            return {
              blocks,
              fallback: false,
              intent,
              model: input.env.model,
              title: isFirst ? makeFastPathTitle('hours', input.query) : null,
              ...ctaOpt,
            };
          }
        }
      } catch (e) {
        console.error('[city-agent] hours direct search error:', e);
      }
    }

    // ── 2. Ações via LLM ──
    const isSearch = action.type === 'search';
    const isExploratory = isExploratoryQuery(input.query);
    const systemParts = [
      `Você é o assistente exclusivo de ${input.cityName}. NUNCA fale de outras cidades, estados ou países.`,
      'Você tem ferramentas para buscar informações reais no banco local. NUNCA invente dados.',
      '',
      'REGRAS DE USO DAS FERRAMENTAS:',
      isSearch
        ? `O usuário está buscando: "${input.query}". Use list_entities ou search_entities imediatamente (veja regra abaixo).`
        : 'Para qualquer comércio, atrativo ou serviço: use list_entities ou search_entities para encontrar a entidade.',
      'COMO ESCOLHER ENTRE list_entities E search_entities:',
      '- Use list_entities quando a pergunta for browsing de categoria inteira ("quais pousadas", "principais atrações", "guias de turismo", "lista de pacotes", "restaurantes", "o que conhecer", "me conta sobre"). Passe o `type` exato (ex.: "attraction", "tourism_guide", "fishing_guide", "tour_package", "accommodation", "restaurant", "event", "property"). Mais confiável.',
      '- Use search_entities apenas quando a pergunta tiver um conceito específico ("pousada perto do lago", "restaurante com vista", "trilha leve"). Sempre passe `types` filtrando pelo tipo certo.',
      'Após encontrar a entidade, use get_entity_status para horários ou get_entity_details para telefone/endereço/WhatsApp.',
      'Para notícias use get_city_news. Para eventos use get_city_events.',
      'Para SAMU, Bombeiros, Polícia, Defesa Civil, telefones públicos: use get_emergency_contacts.',
      'Para farmácia de plantão ou qual farmácia está aberta: use get_pharmacy_on_duty.',
      'Para coleta de lixo por bairro: use get_garbage_schedule.',
      'Para falta de água, corte de energia, alertas de trânsito: use get_service_alerts.',
      'Para missa, culto, programação de igrejas: use get_church_schedule.',
      'Para balsa, travessia, ferry, horário/valor de balsa (Lago de Furnas): há 3 balsas ativas — Águas Verdes (Carmo ⇄ Itaci), Itapiché (Carmo ⇄ Ponte do Itapiché) e São Francisco II (Campo do Meio ⇄ Itaci). Se o usuário NÃO indicar qual balsa quer (nem pelo nome — Águas Verdes/Itapiché/São Francisco — nem por trecho/rota — Carmo, Itaci, Campo do Meio, Ponte do Itapiché — nem no histórico recente), NÃO chame get_ferry_info ainda: pergunte qual ela quer citando NOME + ROTA das três (ex.: "Temos três balsas: Águas Verdes (Carmo ⇄ Itaci), Itapiché (Carmo ⇄ Ponte do Itapiché) e São Francisco II (Campo do Meio ⇄ Itaci). Qual você quer ver?") e pare. Se o usuário citar um nome, chame get_ferry_info com route_query=nome. Se citar apenas um trecho/ponto (ex.: "balsa para Campo do Meio"), passe `direction` com o ponto mencionado. Se a pergunta for "qual a próxima balsa de X", passe next_only=true. Após chamar get_ferry_info, NUNCA resuma ou repita os horários no texto — o widget já exibe tudo. Apenas diga algo curto como "Aqui estão os horários da travessia:" e pare.',
      'Encadeie as ferramentas conforme necessário (ex: buscar → consultar horário).',
      '',
      'CONTEXTO DA CONVERSA: Use o histórico para resolver referências como "ela", "esse lugar", "lá" — são entidades já mencionadas.',
    ];
    if (isExploratory) {
      systemParts.push(
        '',
        'PERGUNTA EXPLORATÓRIA: o usuário está pedindo um panorama (tipo "me conta sobre", "o que conhecer", "principais atrações", "como é tal lugar"). Use list_entities (NÃO search_entities) para puxar 5 a 8 itens da categoria certa. Depois ESCREVA narrativa em PT-BR: 3 a 6 frases em tom de guia local, organizadas por temas (natureza, cultura, gastronomia, etc), citando algumas das entidades retornadas pela ferramenta pelo nome. NÃO termine só com a lista — o texto narrativo é parte obrigatória da resposta. Se as ferramentas não retornarem nada relevante, escreva mesmo assim com conhecimento geral da região (geografia, contexto turístico de Furnas/Canastra) sem inventar entidades específicas.',
      );
    }
    if (input.pageContext) {
      systemParts.push(`CONTEXTO DA PÁGINA ATUAL: ${input.pageContext}`);
    }
    systemParts.push(
      '',
      'Responda em PT-BR, de forma direta e conversacional.',
      '',
      'REGRAS PARA QUANDO NÃO HOUVER RESULTADOS:',
      'Se as ferramentas não retornarem resultados, NUNCA use tom de rejeição seca. Seja sempre acolhedor e ofereça alternativas CONCRETAS baseadas no que existe na cidade.',
      'Exemplos de respostas boas:',
      '- "Ainda não tenho isso cadastrado, mas posso te ajudar com outras coisas! Quer saber sobre atrações, onde ficar, restaurantes ou os passeios de balsa?"',
      '- "Não encontrei exatamente isso, mas temos ótimas opções de pousadas, restaurantes e guias de turismo. Quer que eu liste alguma dessas?"',
      '- "Não tenho esse dado no momento. Posso te mostrar o que temos de melhor na cidade — atrações, hospedagem ou gastronomia?"',
    );
    if (isFirst) {
      systemParts.push(
        '',
        'IMPORTANTE — TÍTULO DA CONVERSA: ao final da sua resposta, em uma linha separada, escreva exatamente no formato `[TITULO: <3 a 5 palavras em PT-BR resumindo o tópico>]`. Regras estritas: sem aspas, sem ponto final, sem emojis, sem asteriscos ou markdown ao redor (NÃO use `**[TITULO: ...]**`), sem nenhum texto depois do `]`. O marcador é OBRIGATÓRIO mesmo que a resposta seja curta. Esse marcador será removido antes de exibir.',
      );
    }
    const systemMessage = systemParts.join('\n');

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    const history = (input.conversation ?? []).slice(-10);
    for (const msg of history) messages.push({ role: msg.role, content: msg.text });
    messages.push({ role: 'user', content: input.query });

    const resolved = await generateTextWithFallback(
      {
        system: systemMessage,
        messages,
        tools: createCityTools({ supabase: input.supabase, env: input.env, cityId: input.cityId }),
        temperature: 0.1,
        maxOutputTokens: 2048,
        stopWhen: stepCountIs(4),
        // Quando o router já classificou como busca, força o LLM a chamar uma tool antes de responder.
        ...(isSearch ? { toolChoice: 'required' as const } : {}),
      },
      input.env,
    );
    const result = resolved.result;
    const usedModelId = resolved.modelId;

    for (const step of result.steps) {
      usedTools.push(...step.toolCalls.map((c) => c.toolName));
    }

    let blocks: AgentResponseBlock[] = [];
    let llmTitle: string | null = null;

    // Coleta o último tool result que produziu lista (ignora resultados vazios/erros).
    let toolBlocks: AgentResponseBlock[] = [];
    for (let i = result.steps.length - 1; i >= 0; i--) {
      const step = result.steps[i];
      const tr = step?.toolResults?.[0];
      if (tr && Array.isArray(tr.output) && tr.output.length > 0) {
        toolBlocks = formatToolResultBlocks(tr.output);
        if (toolBlocks.length > 0) break;
      }
    }

    const hasFerry = toolBlocks.some((b) => b.type === 'ferry');
    const trimmedLlm = result.text?.trim() ?? '';

    // Para queries exploratórias: garantir narrativa. Se o 1º passe não produziu
    // texto (LLM parou após tool call), faz um 2º passe curto pedindo só a narrativa
    // ancorada nos resultados reais.
    let narrative = '';
    if (trimmedLlm) {
      const parsed = isFirst ? extractTitle(trimmedLlm) : { text: trimmedLlm, title: null };
      llmTitle = parsed.title;
      narrative = parsed.text.trim();
    }

    if (isExploratory && !hasFerry && toolBlocks.length > 0 && narrative.length < 80) {
      try {
        const entityNames = toolBlocks
          .flatMap((b) => {
            if (b.type === 'search_results') return b.items.map((i) => i.name);
            return [];
          })
          .slice(0, 8);
        const narrativePrompt = [
          `Você é um guia local de ${input.cityName}, na região do Lago de Furnas/Serra da Canastra (MG).`,
          `Pergunta do usuário: "${input.query}".`,
          entityNames.length > 0
            ? `Entidades reais encontradas no banco (use 2 a 4 delas pelo nome): ${entityNames.join(', ')}.`
            : 'Não há entidades específicas — fale do contexto geral da região.',
          'Escreva 3 a 5 frases em PT-BR, tom acolhedor de guia local, organizadas por temas (natureza, cultura, gastronomia). NÃO use markdown. NÃO liste em bullet. NÃO repita o nome da cidade em toda frase. NÃO invente atrações que não estão na lista acima.',
        ].join('\n\n');

        const narrativeResult = await generateTextWithFallback(
          {
            prompt: narrativePrompt,
            temperature: 0.4,
            maxOutputTokens: 600,
          },
          input.env,
        );
        const text = narrativeResult.result.text?.trim() ?? '';
        if (text.length >= 60) {
          narrative = text;
          usedTools.push('narrative_pass');
        }
      } catch (e) {
        console.error('[city-agent] narrative pass failed:', e);
      }
    }

    if (toolBlocks.length > 0) {
      if (isExploratory && !hasFerry && narrative.length >= 60) {
        blocks = [{ type: 'text', text: narrative }, ...toolBlocks];
      } else {
        blocks = toolBlocks;
      }
    } else if (narrative.length > 0) {
      blocks = [{ type: 'text', text: narrative }];
    }

    if (blocks.length === 0) {
      blocks = [
        {
          type: 'fallback',
          text: 'Não tenho essa informação no momento, mas posso te ajudar com outras coisas! Quer saber sobre atrações, onde ficar, restaurantes ou os passeios de balsa?',
        },
      ];
    }

    const usage = {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    };

    await logAiJob(input.supabase, {
      cityId: input.cityId,
      model: usedModelId,
      status: 'completed',
      startedAt,
      query: input.query,
      profileId: input.profileId ?? null,
      channel: input.channel ?? 'web',
      intent,
      blocks,
      usedTools,
      tokensInput: usage.inputTokens,
      tokensOutput: usage.outputTokens,
      costUsd: costUsd(usedModelId, usage),
    });

    const isFallback = blocks.length === 1 && blocks[0]?.type === 'fallback';
    const hasResults = blocks.some(
      (b) =>
        b.type === 'search_results' ||
        b.type === 'entity_hours' ||
        b.type === 'entity_details' ||
        b.type === 'garbage_schedule' ||
        b.type === 'ferry',
    );
    const referralCta = !hasResults ? referralCtaForQuery(input.query, input.cityName) : null;
    const finalCtaOpt = referralCta ? { cta: [...(ctaOpt.cta ?? []), referralCta] } : ctaOpt;

    return {
      blocks,
      fallback: isFallback,
      intent,
      model: usedModelId,
      title: isFirst ? (llmTitle ?? truncateTitle(input.query)) : null,
      ...finalCtaOpt,
    };
  } catch (error) {
    console.error('[city-agent] error:', error instanceof Error ? error.message : 'Unknown error');
    await logAiJob(input.supabase, {
      cityId: input.cityId,
      model: input.env.model,
      status: 'failed',
      startedAt,
      query: input.query,
      profileId: input.profileId ?? null,
      channel: input.channel ?? 'web',
      intent,
      blocks: [{ type: 'fallback', text: 'Ops, algo deu errado. Tente novamente em instantes.' }],
      usedTools,
      tokensInput: null,
      tokensOutput: null,
      costUsd: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      blocks: [{ type: 'fallback', text: 'Ops, algo deu errado. Tente novamente em instantes.' }],
      fallback: true,
      intent,
      model: input.env.model,
      title: isFirst ? truncateTitle(input.query) : null,
      ...ctaOpt,
    };
  }
}

function normalizeLocalText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

async function getDirectGarbageScheduleRows(
  supabase: Supabase,
  cityId: string,
  query: string,
): Promise<unknown[] | null> {
  const normalizedQuery = normalizeLocalText(query);
  if (!/\bcoleta\b|\blixo\b|residuo|recicl|organico|descarte/i.test(normalizedQuery)) {
    return null;
  }

  const { data, error } = await supabase
    .from('garbage_schedules')
    .select('day_of_week, type, start_time, end_time, notes, districts(name)')
    .eq('city_id', cityId)
    .eq('active', true)
    .order('day_of_week')
    .order('type')
    .limit(250);
  if (error || !Array.isArray(data)) return null;

  const rows = data.filter((row: unknown) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    const districts = (row as { districts?: { name?: unknown } | null }).districts;
    if (!districts || typeof districts.name !== 'string') return false;

    const districtName = normalizeLocalText(districts.name);
    if (normalizedQuery.includes(districtName)) return true;

    return districtName
      .split(/\s+/)
      .filter((part) => part.length >= 4)
      .some((part) => normalizedQuery.includes(part));
  });

  return rows.length > 0 ? rows : null;
}

type ItineraryAttractionRow = {
  id: string;
  slug: string | null;
  name: string;
  type: string | null;
  description: string | null;
  address: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  cover_url: string | null;
  featured: boolean | null;
};

type ItineraryPackageRow = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  duration_hours: number | null;
  itinerary: unknown;
  difficulty: string | null;
  cover_url: string | null;
  featured: boolean | null;
};

type ItineraryPreference =
  | 'lake'
  | 'nature'
  | 'culture'
  | 'food'
  | 'family'
  | 'adventure'
  | 'fishing';

const ITINERARY_PREFERENCE_LABELS: Record<ItineraryPreference, string> = {
  lake: 'Lago de Furnas e passeios de água',
  nature: 'natureza, mirantes e cachoeiras',
  culture: 'cultura, centro histórico e artesanato',
  food: 'gastronomia local',
  family: 'programa leve para família',
  adventure: 'aventura e trilhas',
  fishing: 'pesca esportiva',
};

async function maybeBuildItineraryResponse(input: {
  supabase: Supabase;
  cityId: string;
  cityName: string;
  query: string;
  conversation: ConversationMessage[];
}): Promise<{ blocks: AgentResponseBlock[]; fallback: boolean; usedTools: string[] } | null> {
  if (!isItineraryBuildQuery(input.query, input.conversation)) return null;

  const days = extractItineraryDays(input.query);
  const preferences = extractItineraryPreferences(input.query);
  const hasUsefulPreferences = preferences.length > 0;

  if (!days || !hasUsefulPreferences) {
    const missing = [
      !days ? 'quantos dias ou turnos você tem' : null,
      !hasUsefulPreferences
        ? 'qual perfil prefere: Lago de Furnas, natureza/trilhas, cultura, comida, família ou pesca'
        : null,
    ].filter((item): item is string => item !== null);

    return {
      blocks: [
        {
          type: 'text',
          text: [
            `Consigo montar um roteiro por ${input.cityName}, mas preciso de ${missing.join(' e ')}.`,
            '',
            'Pode responder assim: "2 dias, Lago de Furnas e comida, com carro" ou "1 dia, passeio leve em família".',
          ].join('\n'),
        },
      ],
      fallback: false,
      usedTools: ['build_itinerary:clarify'],
    };
  }

  const [{ data: attractions, error: attractionsError }, { data: packages, error: packagesError }] =
    await Promise.all([
      input.supabase
        .from('attractions')
        .select(
          'id, slug, name, type, description, address, difficulty, duration_minutes, cover_url, featured',
        )
        .eq('city_id', input.cityId)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('name', { ascending: true })
        .limit(40),
      input.supabase
        .from('tour_packages')
        .select(
          'id, slug, title, description, duration_hours, itinerary, difficulty, cover_url, featured',
        )
        .eq('city_id', input.cityId)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

  if (attractionsError || packagesError) {
    console.error('[city-agent] itinerary query error:', attractionsError ?? packagesError);
    return {
      blocks: [
        {
          type: 'fallback',
          text: 'Não consegui consultar os atrativos agora. Tente de novo em instantes ou veja a página de turismo.',
        },
      ],
      fallback: true,
      usedTools: ['build_itinerary'],
    };
  }

  const attractionRows = normalizeAttractionRows(attractions);
  const packageRows = normalizePackageRows(packages);
  if (attractionRows.length === 0 && packageRows.length === 0) {
    return {
      blocks: [
        {
          type: 'text',
          text: 'Ainda não tenho atrativos publicados o suficiente para montar um roteiro confiável. Posso te mostrar hospedagens, restaurantes, guias ou informações de balsa.',
        },
      ],
      fallback: true,
      usedTools: ['build_itinerary'],
    };
  }

  const selectedAttractions = selectAttractionsForItinerary(attractionRows, preferences, days);
  const selectedPackages = selectPackagesForItinerary(packageRows, preferences);
  const text = formatItineraryText({
    cityName: input.cityName,
    days,
    preferences,
    attractions: selectedAttractions,
    packages: selectedPackages,
  });
  const cards = itinerarySearchResults(selectedAttractions, selectedPackages);
  const blocks: AgentResponseBlock[] = [{ type: 'text', text }];
  if (cards.length > 0) blocks.push({ type: 'search_results', items: cards });

  return {
    blocks,
    fallback: false,
    usedTools: ['build_itinerary'],
  };
}

function isItineraryBuildQuery(query: string, conversation: ConversationMessage[]): boolean {
  const normalized = normalizeLocalText(query);
  const isReplyToClarification = conversation
    .slice(-4)
    .some(
      (msg) =>
        msg.role === 'assistant' &&
        normalizeLocalText(msg.text).includes('montar um roteiro') &&
        normalizeLocalText(msg.text).includes('quantos dias'),
    );

  if (
    isReplyToClarification &&
    (extractItineraryDays(query) || extractItineraryPreferences(query).length > 0)
  ) {
    return true;
  }

  // Lista nua ("roteiros", "quero roteiros", "lista de roteiros") fica pro category fast-path
  const isBareRouteList = /^\s*(quero\s+|lista\s+de\s+)?roteiros?\s*$/.test(normalized);
  if (isBareRouteList) return false;

  const hasRouteWord = /\b(roteiro|roteiros|itinerario|itinerarios|programacao)\b/.test(normalized);
  if (hasRouteWord) return true;

  const hasViagemWord = /\bviagem\b/.test(normalized);
  const hasBuildWord =
    /\b(monta|montar|monte|planeja|planejar|planeje|cria|criar|crie|faz|fazer|faca|sugere|sugerir|sugira|personalizado|pra mim|para mim)\b/.test(
      normalized,
    );
  const hasDuration = extractItineraryDays(query) !== null;
  return hasViagemWord && (hasBuildWord || hasDuration);
}

function extractItineraryDays(query: string): number | null {
  const normalized = normalizeLocalText(query);
  const numeric = normalized.match(/\b(\d{1,2})\s*(dia|dias)\b/);
  if (numeric?.[1]) {
    const days = Number(numeric[1]);
    if (Number.isFinite(days) && days > 0) return Math.min(days, 7);
  }
  if (/\b(meio dia|manha|tarde)\b/.test(normalized)) return 1;
  if (/\b(um dia|1 dia|bate volta|bate-volta)\b/.test(normalized)) return 1;
  if (/\b(fim de semana|final de semana|sabado e domingo)\b/.test(normalized)) return 2;
  return null;
}

function extractItineraryPreferences(query: string): ItineraryPreference[] {
  const normalized = normalizeLocalText(query);
  const prefs: ItineraryPreference[] = [];
  const add = (pref: ItineraryPreference) => {
    if (!prefs.includes(pref)) prefs.push(pref);
  };

  if (/\b(lago|furnas|barco|lancha|marina|represa|agua|nautico)\b/.test(normalized)) add('lake');
  if (/\b(natureza|cachoeira|mirante|serra|trilha|rural|paisagem)\b/.test(normalized))
    add('nature');
  if (/\b(cultura|histor|museu|igreja|matriz|centro|artesanato|tear)\b/.test(normalized))
    add('culture');
  if (/\b(comida|gastronomia|restaurante|almoco|jantar|cafe|doce|queijo)\b/.test(normalized))
    add('food');
  if (/\b(familia|crianca|leve|idoso|tranquilo|acessivel)\b/.test(normalized)) add('family');
  if (/\b(aventura|radical|dificil|esporte|bike)\b/.test(normalized)) add('adventure');
  if (/\b(pesca|pescaria|tucunare|peixe)\b/.test(normalized)) add('fishing');

  return prefs;
}

function normalizeAttractionRows(value: unknown): ItineraryAttractionRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const item = row as Partial<ItineraryAttractionRow>;
    if (typeof item.id !== 'string' || typeof item.name !== 'string') return [];
    return [
      {
        id: item.id,
        slug: typeof item.slug === 'string' ? item.slug : null,
        name: item.name,
        type: typeof item.type === 'string' ? item.type : null,
        description: typeof item.description === 'string' ? item.description : null,
        address: typeof item.address === 'string' ? item.address : null,
        difficulty: typeof item.difficulty === 'string' ? item.difficulty : null,
        duration_minutes: typeof item.duration_minutes === 'number' ? item.duration_minutes : null,
        cover_url: typeof item.cover_url === 'string' ? item.cover_url : null,
        featured: typeof item.featured === 'boolean' ? item.featured : null,
      },
    ];
  });
}

function normalizePackageRows(value: unknown): ItineraryPackageRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return [];
    const item = row as Partial<ItineraryPackageRow>;
    if (typeof item.id !== 'string' || typeof item.title !== 'string') return [];
    return [
      {
        id: item.id,
        slug: typeof item.slug === 'string' ? item.slug : null,
        title: item.title,
        description: typeof item.description === 'string' ? item.description : null,
        duration_hours: typeof item.duration_hours === 'number' ? item.duration_hours : null,
        itinerary: item.itinerary ?? [],
        difficulty: typeof item.difficulty === 'string' ? item.difficulty : null,
        cover_url: typeof item.cover_url === 'string' ? item.cover_url : null,
        featured: typeof item.featured === 'boolean' ? item.featured : null,
      },
    ];
  });
}

function selectAttractionsForItinerary(
  attractions: ItineraryAttractionRow[],
  preferences: ItineraryPreference[],
  days: number,
): ItineraryAttractionRow[] {
  const maxItems = Math.min(Math.max(days * 3, 3), 12);
  return attractions
    .map((item) => ({ item, score: scoreAttraction(item, preferences) }))
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, maxItems)
    .map(({ item }) => item);
}

function selectPackagesForItinerary(
  packages: ItineraryPackageRow[],
  preferences: ItineraryPreference[],
): ItineraryPackageRow[] {
  return packages
    .map((item) => ({ item, score: scorePackage(item, preferences) }))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 2)
    .map(({ item }) => item);
}

function scoreAttraction(item: ItineraryAttractionRow, preferences: ItineraryPreference[]): number {
  const text = normalizeLocalText(
    [item.name, item.type, item.description, item.address, item.difficulty]
      .filter(Boolean)
      .join(' '),
  );
  let score = item.featured ? 8 : 0;
  for (const pref of preferences) score += preferenceScore(text, pref);
  if (preferences.includes('family') && /dificil|radical|longa/.test(text)) score -= 4;
  return score;
}

function scorePackage(item: ItineraryPackageRow, preferences: ItineraryPreference[]): number {
  const text = normalizeLocalText(
    [item.title, item.description, item.difficulty, JSON.stringify(item.itinerary)]
      .filter(Boolean)
      .join(' '),
  );
  let score = item.featured ? 8 : 0;
  for (const pref of preferences) score += preferenceScore(text, pref);
  return score;
}

function preferenceScore(text: string, pref: ItineraryPreference): number {
  const tests: Record<ItineraryPreference, RegExp> = {
    lake: /\b(lago|furnas|barco|lancha|marina|represa|agua|nautico)\b/,
    nature: /\b(natureza|cachoeira|mirante|serra|trilha|rural|paisagem)\b/,
    culture: /\b(cultura|histor|museu|igreja|matriz|centro|artesanato|tear)\b/,
    food: /\b(comida|gastronomia|restaurante|almoco|jantar|cafe|doce|queijo)\b/,
    family: /\b(familia|crianca|leve|tranquilo|facil|acessivel)\b/,
    adventure: /\b(aventura|radical|dificil|trilha|bike|serra)\b/,
    fishing: /\b(pesca|pescaria|tucunare|peixe)\b/,
  };
  return tests[pref].test(text) ? 10 : 0;
}

function formatItineraryText(input: {
  cityName: string;
  days: number;
  preferences: ItineraryPreference[];
  attractions: ItineraryAttractionRow[];
  packages: ItineraryPackageRow[];
}): string {
  const preferenceText = input.preferences
    .map((pref) => ITINERARY_PREFERENCE_LABELS[pref])
    .join(', ');
  const lines = [
    `Montei uma sugestão de roteiro de ${input.days} ${input.days === 1 ? 'dia' : 'dias'} em ${input.cityName}, puxando para ${preferenceText}.`,
    'Use como base e confirme horários, acesso e condições antes de sair.',
    '',
  ];

  if (input.packages.length > 0) {
    lines.push(
      `Roteiros prontos do portal que combinam com a ideia: ${input.packages.map((item) => item.title).join(', ')}.`,
      '',
    );
  }

  const perDay = distributeByDay(input.attractions, input.days);
  perDay.forEach((dayItems, index) => {
    lines.push(`Dia ${index + 1}`);
    if (dayItems[0]) lines.push(`Manhã: ${describeAttraction(dayItems[0])}`);
    if (dayItems[1]) lines.push(`Tarde: ${describeAttraction(dayItems[1])}`);
    if (dayItems[2]) lines.push(`Fim de tarde/noite: ${describeAttraction(dayItems[2])}`);
    if (input.preferences.includes('food')) {
      lines.push('Refeição: encaixe um restaurante local perto do trecho escolhido.');
    }
    lines.push('');
  });

  lines.push(
    'Se quiser, eu ajusto o roteiro para ficar mais leve, mais econômico, com crianças, sem carro ou focado só no Lago de Furnas.',
  );
  return lines.join('\n').trim();
}

function distributeByDay(
  attractions: ItineraryAttractionRow[],
  days: number,
): ItineraryAttractionRow[][] {
  const buckets = Array.from({ length: days }, () => [] as ItineraryAttractionRow[]);
  attractions.forEach((item, index) => {
    const bucket = buckets[index % days];
    if (bucket && bucket.length < 3) bucket.push(item);
  });
  return buckets;
}

function describeAttraction(item: ItineraryAttractionRow): string {
  const parts = [item.name];
  if (item.type) parts.push(`perfil ${item.type}`);
  if (item.duration_minutes)
    parts.push(`reserve cerca de ${formatDuration(item.duration_minutes)}`);
  if (item.difficulty) parts.push(`dificuldade ${item.difficulty}`);
  return parts.join(' - ');
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours.toString().replace('.', ',')} h`;
}

function itinerarySearchResults(
  attractions: ItineraryAttractionRow[],
  packages: ItineraryPackageRow[],
): SearchResultItem[] {
  const packageItems: SearchResultItem[] = packages.map((item) => ({
    entity_type: 'tour_package',
    entity_id: item.id,
    name: item.title,
    url: item.slug ? `${APP_URL}/turismo/roteiros/${item.slug}` : `${APP_URL}/turismo/roteiros`,
    cover_url: item.cover_url,
  }));
  const attractionItems: SearchResultItem[] = attractions.slice(0, 6).map((item) => ({
    entity_type: 'attraction',
    entity_id: item.id,
    name: item.name,
    url: item.slug
      ? `${APP_URL}/turismo/o-que-fazer/${item.slug}`
      : `${APP_URL}/turismo/o-que-fazer`,
    cover_url: item.cover_url,
  }));
  return [...packageItems, ...attractionItems].slice(0, 8);
}

function formatToolResultBlocks(items: any[]): AgentResponseBlock[] {
  // get_ferry_info — projeta apenas os campos renderizados pelo AgentBlocksView
  if (items[0] && 'schedules_by_direction' in items[0]) {
    const ferryItems = items.map((item: any) => ({
      slug: item.slug,
      name: item.name,
      endpoints: item.endpoints,
      status: item.status,
      fare_summary: item.fare_summary ?? null,
      fare_warning: item.fare_warning ?? null,
      schedules_by_direction: item.schedules_by_direction,
      alerts: Array.isArray(item.alerts)
        ? item.alerts.slice(0, 5).map((a: any) => ({
            type: a.type,
            title: a.title,
            message: a.message,
          }))
        : [],
      public_url: item.public_url,
    }));
    return [{ type: 'ferry', items: ferryItems }];
  }

  // get_garbage_schedule
  if (items[0] && 'day_of_week' in items[0] && 'districts' in items[0]) {
    return [{ type: 'garbage_schedule', items: groupGarbageScheduleRows(items) }];
  }

  // search_entities
  if (items[0] && 'entity_type' in items[0]) {
    const searchItems: SearchResultItem[] = items.map((item: any) => ({
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      name: item.name,
      url: item.url ? `${APP_URL}${item.url}` : null,
      cover_url: item.cover_url ?? null,
      score: item.score,
    }));
    return [{ type: 'search_results', items: searchItems }];
  }

  // get_platform_faq
  if (items[0] && 'question' in items[0] && 'answer' in items[0]) {
    return [
      { type: 'faq', items: items.map((i: any) => ({ question: i.question, answer: i.answer })) },
    ];
  }

  // get_city_news
  if (items[0] && 'title' in items[0] && 'excerpt' in items[0]) {
    return [
      {
        type: 'news',
        items: items.map((i: any) => ({
          title: i.title,
          slug: i.slug,
          excerpt: i.excerpt,
          cover_url: i.cover_url,
          published_at: i.published_at,
        })),
      },
    ];
  }

  // get_city_events
  if (items[0] && 'title' in items[0] && 'starts_at' in items[0]) {
    return [
      {
        type: 'events',
        items: items.map((i: any) => ({
          title: i.title,
          slug: i.slug,
          starts_at: i.starts_at,
          ends_at: i.ends_at,
          location: i.location,
          cover_url: i.cover_url,
        })),
      },
    ];
  }

  return [{ type: 'text', text: JSON.stringify(items) }];
}

function groupGarbageScheduleRows(items: unknown[]) {
  const groups = new Map<
    string,
    {
      day_of_week: number;
      type: string;
      start_time: string | null;
      end_time: string | null;
      notes: string | null;
      districts: Array<{ name: string }>;
    }
  >();

  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const row = item as {
      day_of_week?: unknown;
      type?: unknown;
      start_time?: unknown;
      end_time?: unknown;
      notes?: unknown;
      districts?: { name?: unknown } | null;
    };
    if (typeof row.day_of_week !== 'number') continue;

    const type = typeof row.type === 'string' ? row.type : 'common';
    const startTime = typeof row.start_time === 'string' ? row.start_time : null;
    const endTime = typeof row.end_time === 'string' ? row.end_time : null;
    const notes = typeof row.notes === 'string' ? row.notes : null;
    const districtName =
      row.districts && typeof row.districts.name === 'string' ? row.districts.name : null;
    const key = [row.day_of_week, type, startTime ?? '', endTime ?? '', notes ?? ''].join('|');
    const current = groups.get(key) ?? {
      day_of_week: row.day_of_week,
      type,
      start_time: startTime,
      end_time: endTime,
      notes,
      districts: [],
    };

    if (districtName && !current.districts.some((district) => district.name === districtName)) {
      current.districts.push({ name: districtName });
    }
    groups.set(key, current);
  }

  return Array.from(groups.values()).sort(
    (a, b) => a.day_of_week - b.day_of_week || a.type.localeCompare(b.type),
  );
}

const EXPLORATORY_PATTERNS = [
  /me\s+(conta|fala|fale|diga)\s+(sobre|de|da|do)/i,
  /(conta|fala|fale)\s+(mais\s+)?(sobre|de|da|do)\b/i,
  /\bsobre\s+(a\s+cidade|o\s+distrito|a\s+regi[ãa]o)/i,
  /principa(is|l)\s+(atra[çc][õo]es|pontos|locais)/i,
  /o\s+que\s+(conhecer|fazer|visitar|tem\s+pra\s+fazer|h[áa]\s+pra\s+fazer)/i,
  /como\s+[ée]\s+(o|a|essa|esse|aquela|aquele|tal|esse\s+lugar)/i,
  /conhe[çc]a\s+/i,
  /panorama|hist[óo]ria\s+(da|do)\b|cultura\s+local|tradi[çc]ões/i,
  /vis[ãa]o\s+geral|res(uma|umo)\s+(sobre|de|da|do)/i,
];

function isExploratoryQuery(query: string): boolean {
  const q = query.trim();
  if (q.length < 12) return false;
  return EXPLORATORY_PATTERNS.some((re) => re.test(q));
}

function makeFastPathTitle(actionType: string, query: string): string {
  switch (actionType) {
    case 'faq':
      return 'Dúvida sobre o site';
    case 'news':
      return 'Notícias da cidade';
    case 'events':
      return 'Eventos próximos';
    case 'hours':
      return 'Horários';
    default:
      return truncateTitle(query);
  }
}

function truncateTitle(s: string): string {
  let t = s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '')
    .trim();
  if (!t) return 'Nova conversa';
  t = t.charAt(0).toLocaleUpperCase('pt-BR') + t.slice(1);
  return t.length > 40 ? `${t.slice(0, 40)}…` : t;
}

// Tolera acento (TÍTULO/TITULO), wrappers de markdown e tag em qualquer posição.
const TITLE_TAG = /\**\[\s*T[ÍI]TULO\s*:\s*([^\]\n]+?)\s*\]\**/giu;

function extractTitle(text: string): { text: string; title: string | null } {
  let lastTitle: string | null = null;
  const stripped = text.replace(TITLE_TAG, (_, group: string) => {
    const t = group?.trim() ?? '';
    if (t) lastTitle = t;
    return '';
  });
  const cleaned = stripped
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    text: cleaned,
    title: lastTitle ? truncateTitle(lastTitle) : null,
  };
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

function weekdayLabel(n: number | string): string {
  const labels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const idx = typeof n === 'string' ? parseInt(n, 10) : n;
  return labels[idx] ?? String(n);
}

async function logAiJob(
  supabase: Supabase,
  input: {
    cityId: string;
    model: string;
    status: 'completed' | 'failed';
    startedAt: string;
    query: string;
    profileId: string | null;
    channel: string;
    intent: Intent;
    blocks: AgentResponseBlock[];
    usedTools: string[];
    tokensInput: number | null;
    tokensOutput: number | null;
    costUsd: number;
    error?: string;
  },
) {
  await supabase.from('ai_jobs').insert({
    city_id: input.cityId,
    job_type: 'city_agent',
    status: input.status,
    model: input.model,
    input_ref: {
      query: input.query,
      profileId: input.profileId,
      channel: input.channel,
      intent: input.intent,
    },
    output_ref: { blocks: input.blocks, usedTools: input.usedTools },
    tokens_input: input.tokensInput,
    tokens_output: input.tokensOutput,
    cost_usd: input.costUsd,
    error: input.error ?? null,
    started_at: input.startedAt,
    finished_at: new Date().toISOString(),
  });
}
