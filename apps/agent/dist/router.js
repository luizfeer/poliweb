import { embedQuery } from './embeddings.js';
const KEYWORD_MAP = [
    // FAQ da plataforma
    {
        keywords: [
            'cadastrar',
            'cadastro',
            'como colocar',
            'como anunciar',
            'anunciar',
            'divulgar',
            'divulgar meu',
            'meu negocio',
            'meu negocio no site',
            'gratuito',
            'preço',
            'custo',
            'senha',
            'login',
            'entrar',
            'reportar erro',
            'sugerir correção',
            'como funciona',
            'o que é',
        ],
        action: { type: 'faq', question: '' },
    },
    // Notícias
    {
        keywords: [
            'noticia',
            'notícia',
            'novidade',
            'jornal',
            'informação da cidade',
            'o que aconteceu',
            'ultimas',
        ],
        action: { type: 'news', limit: 5 },
    },
    // Eventos
    {
        keywords: [
            'evento',
            'festa',
            'show',
            'agenda',
            'cultural',
            'o que vai acontecer',
            'fim de semana',
            'sábado',
            'domingo',
        ],
        action: { type: 'events', limit: 5 },
        exclude: /\baluga|aluguel|comprar|vender|preço|preco|quanto|custa|barato|caro|loja|comercio|comércio|vestido|mesa|cadeira|decoração|decoracao|buffet|som|dj|iluminação|iluminacao|foto|filmagem|salão|salao|bolo|doce|salgado|carro|moto|van|frete|mudança|mudanca|equipamento|ferramenta|inflável|inflavel|brinquedo|pula-pula/i,
    },
];
const FAQ_QUESTIONS = [
    'Como cadastrar meu comércio?',
    'Como funciona o site?',
    'É gratuito cadastrar?',
    'Como anunciar no site?',
    'Como editar meu comércio?',
    'Como reportar um erro?',
    'O que é o Carmo Local?',
    'Como entrar em contato?',
];
let faqEmbeddings = null;
/** Preenche embeddings do FAQ no startup (lazy). */
export async function initRouter(env) {
    if (faqEmbeddings)
        return;
    const embeddings = await Promise.all(FAQ_QUESTIONS.map(async (q) => ({
        question: q,
        embedding: await embedQuery(q, env),
    })));
    faqEmbeddings = embeddings;
}
export async function routeQuery(query, env) {
    const normalized = query.toLowerCase();
    // 1. Keywords hardcoded (rápido, barato, 100% consistente)
    for (const map of KEYWORD_MAP) {
        if (map.exclude && map.exclude.test(normalized))
            continue;
        if (map.keywords.some((k) => normalized.includes(k))) {
            if (map.action.type === 'faq') {
                return { type: 'faq', question: query };
            }
            return map.action;
        }
    }
    // 2. RAG por embedding no FAQ (cobre sinônimos e variações)
    if (faqEmbeddings && faqEmbeddings.length > 0) {
        const userEmbedding = await embedQuery(query, env);
        let best = { question: '', score: -1 };
        for (const faq of faqEmbeddings) {
            const score = cosineSimilarity(userEmbedding, faq.embedding);
            if (score > best.score) {
                best = { question: faq.question, score };
            }
        }
        if (best.score > 0.78) {
            return { type: 'faq', question: query };
        }
    }
    // 3. Detecta busca por categoria/lugar com palavras comuns
    // igreja/culto/missa ficam fora — usam get_church_schedule, não search_entities
    const searchWords = /restaurante|pousada|hotel|comercio|comércio|lanchonete|padaria|mercado|farmacia|farmácia|mecanico|mecânico|dentista|médico|medico|turismo|guia|passeio|roteiro|roteiros|itinerario|itinerário|viagem|pescaria|pesqueiro|cachoeira|trilha|balsa|barco|marina|travessia|transporte|embarca[çc][ãa]o|lota[çc][ãa]o|lugar|onde (posso|consigo|encontro)|o que fazer|tem algum|aluga|aluguel|vestido|fantasia|decoração|decoracao|buffet|som|dj|mesa|cadeira|talher|prato|copo|salão|salao|bolo|doce|salgado|carro|moto|van|frete|mudança|mudanca|equipamento|ferramenta|brinquedo|inflável|inflavel|pula-pula/i;
    if (searchWords.test(normalized)) {
        return { type: 'search', query };
    }
    // 4. Detecta perguntas de horário — deixa o LLM resolver com entity_status
    const hoursWords = /aberto|abre|fecha|fechad|funciona|funcionamento|horário|horario|atende|que horas/i;
    if (hoursWords.test(normalized)) {
        return { type: 'llm' };
    }
    // 5. Fallback: deixa o LLM decidir com tools
    return { type: 'llm' };
}
function cosineSimilarity(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        const av = a[i];
        const bv = b[i];
        dot += av * bv;
        normA += av * av;
        normB += bv * bv;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
