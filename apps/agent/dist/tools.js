import { tool } from 'ai';
import { z } from 'zod';
import { embedQuery } from './embeddings.js';
import { ALL_ENTITY_TYPES, getEntityCoverColumn, getEntityDetails, getEntityNameColumn, getEntityPublicPath, getEntitySummary, getEntityTable, isEntityType, } from './entities.js';
import { formatStatusLabel, getStatus } from './hours.js';
import { getCityEvents, getCityNews, searchPlatformFAQ } from './platform.js';
export async function fetchEntityList(input) {
    const { supabase, cityId, type, limit } = input;
    const table = getEntityTable(type);
    const nameCol = getEntityNameColumn(type);
    const coverCol = getEntityCoverColumn(type);
    const cols = ['id', `name:${nameCol}`, 'slug'];
    if (coverCol)
        cols.push(`cover_url:${coverCol}`);
    let query = supabase
        .from(table)
        .select(cols.join(', '))
        .eq('city_id', cityId)
        .limit(limit ?? 8);
    const HAS_STATUS = {
        business: true,
        restaurant: true,
        accommodation: true,
        attraction: true,
        tourism_guide: true,
        tour_package: true,
        fishing_guide: true,
        fishing_spot: true,
        event: true,
        property: true,
        classified: true,
        emergency_contact: false,
        health_facility: false,
    };
    if (HAS_STATUS[type])
        query = query.eq('status', 'published');
    const ORDER = {
        attraction: [['featured', false]],
        accommodation: [['featured', false]],
        restaurant: [['featured', false]],
        tourism_guide: [['featured', false]],
        tour_package: [['featured', false]],
        fishing_guide: [['verified', false]],
        fishing_spot: [],
        business: [['featured', false]],
        event: [['starts_at', true]],
        property: [],
        classified: [],
        emergency_contact: [['display_order', true]],
        health_facility: [],
    };
    for (const [col, asc] of ORDER[type] ?? []) {
        query = query.order(col, { ascending: asc });
    }
    query = query.order(nameCol, { ascending: true });
    const { data, error } = await query;
    if (error)
        throw new Error(error.message);
    const basePath = getEntityPublicPath(type);
    const rows = (Array.isArray(data) ? data : []);
    return rows
        .filter((r) => r.id && r.name)
        .map((r) => ({
        entity_type: type,
        entity_id: r.id,
        name: r.name,
        slug: r.slug,
        url: basePath ? (r.slug ? `${basePath}/${r.slug}` : basePath) : null,
        cover_url: r.cover_url ?? null,
    }));
}
export function createCityTools(input) {
    const { supabase, env, cityId } = input;
    return {
        search_entities: tool({
            description: 'Busca entidades locais por significado semantico (embedding). Use para perguntas com conceito específico ("pousada perto do lago", "restaurante com vista", "trilha leve"). Para listar uma categoria inteira ("quero pousadas", "principais atrações", "guias de turismo") prefira list_entities.',
            inputSchema: z.object({
                query: z.string().min(2),
                types: z.array(z.string()).optional(),
            }),
            execute: async ({ query, types }) => {
                const embedding = await embedQuery(query, env);
                const entityTypes = types?.filter(isEntityType);
                const { data, error } = await supabase.rpc('match_embeddings', {
                    p_city_id: cityId,
                    p_query_vector: embedding,
                    p_limit: 8,
                    p_entity_types: entityTypes?.length ? entityTypes : null,
                });
                if (error)
                    throw new Error(error.message);
                const MIN_SIMILARITY = 0.4;
                const rows = (Array.isArray(data) ? data : []).filter((row) => row.score >= MIN_SIMILARITY);
                const summaries = await Promise.all(rows
                    .filter((row) => isEntityType(row.entity_type))
                    .map((row) => getEntitySummary(supabase, row.entity_type, row.entity_id, cityId, row.score)));
                return summaries.filter((summary) => summary !== null);
            },
        }),
        list_entities: tool({
            description: 'Lista entidades públicas de uma categoria, sem usar embedding. Use para queries de browsing puro: "quais pousadas", "principais atrações", "guias de turismo", "restaurantes", "lista de pacotes". Mais confiável que search_entities quando a pergunta é categoria inteira.',
            inputSchema: z.object({
                type: z.enum(ALL_ENTITY_TYPES),
                limit: z.number().min(1).max(20).optional(),
            }),
            execute: async ({ type, limit }) => {
                return fetchEntityList({ supabase, cityId, type, limit: limit ?? 8 });
            },
        }),
        get_entity_status: tool({
            description: 'Consulta horario estruturado e status aberto/fechado de uma entidade.',
            inputSchema: z.object({
                entity_type: z.string(),
                entity_id: z.string().uuid(),
                when: z.string().datetime().optional(),
            }),
            execute: async ({ entity_type, entity_id, when }) => {
                if (!isEntityType(entity_type))
                    return { error: 'Tipo de entidade invalido.' };
                const [summary, hoursResult] = await Promise.all([
                    getEntitySummary(supabase, entity_type, entity_id, cityId),
                    supabase
                        .from('entity_hours')
                        .select('weekday, starts_at, ends_at, kind, valid_from, valid_until, source_status, active')
                        .eq('city_id', cityId)
                        .eq('entity_type', entity_type)
                        .eq('entity_id', entity_id)
                        .eq('active', true),
                ]);
                if (hoursResult.error)
                    throw new Error(hoursResult.error.message);
                const status = getStatus(Array.isArray(hoursResult.data) ? hoursResult.data : [], when ? new Date(when) : new Date());
                return {
                    name: summary?.name ?? 'Entidade',
                    status,
                    message: formatStatusLabel(status),
                    source_status: status.sourceStatus,
                    next_opening: status.nextOpening ?? null,
                };
            },
        }),
        get_entity_details: tool({
            description: 'Consulta telefone, endereco, servicos e atributos de uma entidade.',
            inputSchema: z.object({
                entity_type: z.string(),
                entity_id: z.string().uuid(),
            }),
            execute: async ({ entity_type, entity_id }) => {
                if (!isEntityType(entity_type))
                    return { error: 'Tipo de entidade invalido.' };
                return getEntityDetails(supabase, entity_type, entity_id, cityId);
            },
        }),
        get_entity_faq: tool({
            description: 'Consulta perguntas frequentes especificas de uma entidade.',
            inputSchema: z.object({
                entity_type: z.string(),
                entity_id: z.string().uuid(),
                question: z.string().optional(),
            }),
            execute: async ({ entity_type, entity_id, question }) => {
                if (!isEntityType(entity_type))
                    return { error: 'Tipo de entidade invalido.' };
                const { data, error } = await supabase
                    .from('entity_faqs')
                    .select('question, answer')
                    .eq('city_id', cityId)
                    .eq('entity_type', entity_type)
                    .eq('entity_id', entity_id)
                    .eq('active', true)
                    .order('sort_order', { ascending: true });
                if (error)
                    throw new Error(error.message);
                const faqs = Array.isArray(data) ? data : [];
                if (!question)
                    return faqs.slice(0, 5);
                const normalized = question.toLowerCase();
                return faqs
                    .filter((faq) => {
                    const q = 'question' in faq && typeof faq.question === 'string'
                        ? faq.question.toLowerCase()
                        : '';
                    return q.includes(normalized) || normalized.includes(q);
                })
                    .slice(0, 3);
            },
        }),
        get_city_news: tool({
            description: 'Busca as ultimas noticias da cidade.',
            inputSchema: z.object({
                limit: z.number().min(1).max(10).optional(),
            }),
            execute: async ({ limit }) => {
                return getCityNews(supabase, cityId, limit ?? 5);
            },
        }),
        get_city_events: tool({
            description: 'Busca proximos eventos da cidade.',
            inputSchema: z.object({
                limit: z.number().min(1).max(10).optional(),
            }),
            execute: async ({ limit }) => {
                return getCityEvents(supabase, cityId, limit ?? 5);
            },
        }),
        get_platform_faq: tool({
            description: 'Responde perguntas sobre como usar o site, cadastrar comercio, anunciar, etc.',
            inputSchema: z.object({
                question: z.string().min(2),
            }),
            execute: async ({ question }) => {
                return searchPlatformFAQ(question);
            },
        }),
        get_emergency_contacts: tool({
            description: 'Retorna telefones de emergência e utilidade pública: SAMU, Bombeiros, Defesa Civil, Polícia, Copasa, Cemig, Prefeitura, etc.',
            inputSchema: z.object({
                category: z.enum(['emergencia', 'utilidade', 'prefeitura', 'saude']).optional(),
            }),
            execute: async ({ category }) => {
                const query = supabase
                    .from('emergency_contacts')
                    .select('name, phone, whatsapp, short_dial, description, hours, category')
                    .eq('city_id', cityId)
                    .eq('active', true)
                    .order('display_order', { ascending: true });
                if (category)
                    query.eq('category', category);
                const { data, error } = await query.limit(15);
                if (error)
                    throw new Error(error.message);
                return Array.isArray(data) ? data : [];
            },
        }),
        get_pharmacy_on_duty: tool({
            description: 'Consulta qual farmácia está de plantão hoje ou em uma data específica em Carmo do Rio Claro.',
            inputSchema: z.object({
                date: z.string().date().optional(),
            }),
            execute: async ({ date }) => {
                const targetDate = date ?? new Date().toISOString().slice(0, 10);
                const { data, error } = await supabase
                    .from('pharmacy_shifts')
                    .select('shift_type, notes, start_date, end_date, pharmacies(name, address, phone, whatsapp, is_24h, google_maps_url)')
                    .lte('start_date', targetDate)
                    .gte('end_date', targetDate)
                    .limit(3);
                if (error)
                    throw new Error(error.message);
                return Array.isArray(data) ? data : [];
            },
        }),
        get_garbage_schedule: tool({
            description: 'Retorna o calendário de coleta de lixo por bairro/distrito. Se bairro não informado, retorna todos.',
            inputSchema: z.object({
                district_name: z.string().optional(),
                day_of_week: z.number().min(0).max(6).optional(),
            }),
            execute: async ({ district_name, day_of_week }) => {
                const query = supabase
                    .from('garbage_schedules')
                    .select('day_of_week, type, start_time, end_time, notes, districts(name)')
                    .eq('city_id', cityId)
                    .eq('active', true);
                if (day_of_week !== undefined)
                    query.eq('day_of_week', day_of_week);
                const { data, error } = await query
                    .order('day_of_week')
                    .order('type')
                    .limit(250);
                if (error)
                    throw new Error(error.message);
                const rows = Array.isArray(data) ? data : [];
                if (!district_name)
                    return rows;
                const norm = district_name.toLowerCase();
                return rows.filter((row) => {
                    if (!row || typeof row !== 'object' || Array.isArray(row))
                        return false;
                    const districts = row.districts;
                    const name = typeof districts?.name === 'string' ? districts.name.toLowerCase() : '';
                    return name.includes(norm);
                });
            },
        }),
        get_service_alerts: tool({
            description: 'Busca alertas ativos de serviços: falta de água, corte de energia, trânsito, clima extremo, etc.',
            inputSchema: z.object({
                type: z.enum(['water', 'power', 'traffic', 'weather', 'other']).optional(),
            }),
            execute: async ({ type }) => {
                const now = new Date().toISOString();
                const query = supabase
                    .from('service_alerts')
                    .select('type, severity, title, description, affected_area, start_at, end_at, source')
                    .eq('city_id', cityId)
                    .eq('active', true)
                    .lte('start_at', now)
                    .order('severity', { ascending: false });
                if (type)
                    query.eq('type', type);
                const { data, error } = await query.limit(10);
                if (error)
                    throw new Error(error.message);
                return Array.isArray(data) ? data : [];
            },
        }),
        get_church_schedule: tool({
            description: 'Busca igrejas e horários de missas, cultos e reuniões em Carmo do Rio Claro. Retorna o calendário semanal completo de cada igreja, com indicação de quais itens são hoje. Use para qualquer pergunta sobre missa, culto, celebração, igrejas.',
            inputSchema: z.object({
                tradition: z.enum(['catolica', 'evangelica', 'adventista', 'outra']).optional(),
                church_name: z.string().optional(),
            }),
            execute: async ({ tradition, church_name }) => {
                const todayWeekday = new Date().getDay();
                let churchQuery = supabase
                    .from('churches')
                    .select('id, name, tradition, address, phone, whatsapp')
                    .eq('city_id', cityId)
                    .eq('status', 'published');
                if (tradition)
                    churchQuery = churchQuery.eq('tradition', tradition);
                if (church_name)
                    churchQuery = churchQuery.ilike('name', `%${church_name}%`);
                const { data: churches, error: churchError } = await churchQuery.limit(20);
                if (churchError)
                    throw new Error(churchError.message);
                if (!Array.isArray(churches) || churches.length === 0)
                    return [];
                const churchIds = churches.map((c) => c.id);
                // Retorna toda a semana — o modelo decide o que destacar
                const { data: schedules, error: schedError } = await supabase
                    .from('church_schedule_items')
                    .select('church_id, weekday, starts_at, ends_at, title, note, source_status')
                    .in('church_id', churchIds)
                    .eq('active', true)
                    .order('weekday')
                    .order('starts_at');
                if (schedError)
                    throw new Error(schedError.message);
                const scheduleMap = new Map();
                for (const s of (Array.isArray(schedules) ? schedules : [])) {
                    if (!scheduleMap.has(s.church_id))
                        scheduleMap.set(s.church_id, []);
                    scheduleMap.get(s.church_id).push({ ...s, is_today: s.weekday === todayWeekday });
                }
                return churches
                    .map((c) => ({
                    ...c,
                    weekly_schedule: scheduleMap.get(c.id) ?? [],
                    has_today: (scheduleMap.get(c.id) ?? []).some((s) => s.weekday === todayWeekday),
                }))
                    .filter((c) => c.weekly_schedule.length > 0);
            },
        }),
        get_ferry_info: tool({
            description: 'Consulta horários, valores e avisos das balsas/travessias do Lago de Furnas (Itaci, Itapiché, Águas Verdes etc.). Use para qualquer pergunta sobre balsa, travessia, ferry boat, horário de balsa, preço de balsa.',
            inputSchema: z.object({
                route_query: z
                    .string()
                    .optional()
                    .describe('Nome ou trecho do nome da balsa (ex: "Itaci", "Itapiché")'),
                direction: z
                    .string()
                    .optional()
                    .describe('Direção/sentido (ex: "Itaci → Carmo" ou apenas "Carmo")'),
                next_only: z
                    .boolean()
                    .optional()
                    .describe('Se true, retorna apenas a próxima saída a partir de agora'),
            }),
            execute: async ({ route_query, direction, next_only }) => {
                let routeQuery = supabase
                    .from('ferry_routes')
                    .select('id, slug, name, short_name, region, district, status, confidence, description, important_info, fare_summary, fare_warning, fare, endpoint_a_label, endpoint_b_label, related_cities, operating_days, source, featured')
                    .eq('city_id', cityId)
                    .eq('active', true)
                    .order('display_order', { ascending: true });
                if (route_query)
                    routeQuery = routeQuery.ilike('name', `%${route_query}%`);
                const { data: routes, error: routeError } = await routeQuery.limit(5);
                if (routeError)
                    throw new Error(routeError.message);
                const list = Array.isArray(routes) ? routes : [];
                if (list.length === 0)
                    return { error: 'Nenhuma balsa encontrada.' };
                const ids = list.map((r) => r.id);
                let scheduleQuery = supabase
                    .from('ferry_schedule_items')
                    .select('route_id, direction, origin, destination, departs_at, notes, active')
                    .in('route_id', ids)
                    .eq('active', true)
                    .order('direction', { ascending: true })
                    .order('departs_at', { ascending: true });
                if (direction)
                    scheduleQuery = scheduleQuery.ilike('direction', `%${direction}%`);
                const { data: schedules } = await scheduleQuery;
                const { data: alerts } = await supabase
                    .from('ferry_alerts')
                    .select('route_id, type, title, message')
                    .in('route_id', ids)
                    .eq('active', true)
                    .order('display_order', { ascending: true });
                const now = new Date();
                const parts = new Intl.DateTimeFormat('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }).formatToParts(now);
                const curHour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
                const curMin = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
                const curMinutes = (curHour % 24) * 60 + curMin;
                const allSchedules = (Array.isArray(schedules) ? schedules : []);
                const allAlerts = (Array.isArray(alerts) ? alerts : []);
                return list.map((r) => {
                    const routeSchedules = allSchedules.filter((s) => s.route_id === r.id);
                    const grouped = {};
                    for (const s of routeSchedules) {
                        const time = s.departs_at.slice(0, 5);
                        const bucket = grouped[s.direction] ?? (grouped[s.direction] = []);
                        bucket.push({ time, notes: s.notes });
                    }
                    for (const dir of Object.keys(grouped)) {
                        const items = grouped[dir] ?? [];
                        const nextIdx = items.findIndex((i) => {
                            const [h = 0, m = 0] = i.time.split(':').map(Number);
                            return h * 60 + m > curMinutes;
                        });
                        const nextItem = nextIdx >= 0 ? items[nextIdx] : undefined;
                        if (nextItem)
                            nextItem.isNext = true;
                        if (next_only)
                            grouped[dir] = nextItem ? [nextItem] : [];
                    }
                    return {
                        slug: r.slug,
                        name: r.short_name ?? r.name,
                        full_name: r.name,
                        region: r.region,
                        endpoints: `${r.endpoint_a_label ?? '?'} ⇄ ${r.endpoint_b_label ?? '?'}`,
                        status: r.status,
                        confidence: r.confidence,
                        description: r.description,
                        fare_summary: r.fare_summary,
                        fare_warning: r.fare_warning,
                        fare: r.fare,
                        important_info: r.important_info,
                        related_cities: r.related_cities,
                        operating_days: r.operating_days,
                        source: r.source,
                        schedules_by_direction: grouped,
                        total_departures: routeSchedules.length,
                        alerts: allAlerts.filter((a) => a.route_id === r.id),
                        public_url: `/balsas/${r.slug}`,
                    };
                });
            },
        }),
    };
}
