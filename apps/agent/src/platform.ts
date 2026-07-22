import type { createServiceClient } from './supabase.js';

type Supabase = ReturnType<typeof createServiceClient>;

const PLATFORM_FAQ = [
  {
    question: 'Como cadastrar meu comércio?',
    answer:
      'Para cadastrar seu comércio, acesse o menu "Painel" no topo do site, faça login e clique em "Cadastrar Comércio". Você precisará informar nome, endereço, telefone, horários de funcionamento e uma foto. É gratuito!',
  },
  {
    question: 'Como funciona o site?',
    answer:
      'O Carmo Local é um portal hiperlocal que reúne comércios, restaurantes, pousadas, atrativos turísticos e serviços de Carmo do Rio Claro. Cidadãos podem buscar informações, e comerciantes podem cadastrar seus negócios gratuitamente.',
  },
  {
    question: 'É gratuito cadastrar?',
    answer:
      'Sim! O cadastro básico de comércios é totalmente gratuito. Oferecemos também planos premium com destaques e anúncios.',
  },
  {
    question: 'Como anunciar no site?',
    answer:
      'Para anunciar, entre em contato pelo e-mail contato@carmodorioclaro.com.br ou acesse o painel do comerciante e solicite um plano de destaque.',
  },
  {
    question: 'Como editar meu comércio?',
    answer:
      'Faça login, acesse o Painel, clique em "Meus Comércios" e selecione o que deseja editar. Você pode atualizar fotos, horários, telefone, serviços e descrição.',
  },
  {
    question: 'Como reportar um erro?',
    answer:
      'Você pode reportar erros ou informações desatualizadas diretamente na ficha do comércio, clicando em "Sugerir correção", ou enviando e-mail para contato@carmodorioclaro.com.br.',
  },
  {
    question: 'O que é o Carmo Local?',
    answer:
      'O Carmo Local é o portal hiperlocal de Carmo do Rio Claro/MG. Nosso objetivo é conectar moradores, comerciantes e turistas, facilitando o acesso a informações sobre a cidade.',
  },
  {
    question: 'Como entrar em contato?',
    answer:
      'Entre em contato pelo e-mail contato@carmodorioclaro.com.br ou pelo WhatsApp disponível no rodapé do site.',
  },
];

export async function searchPlatformFAQ(
  query: string,
): Promise<{ question: string; answer: string }[]> {
  const normalized = query.toLowerCase();
  const queryWords = normalized.split(/\s+/).filter((w) => w.length > 2);

  // Mapeamento de sinônimos/conceitos para perguntas do FAQ
  const CONCEPT_MAP: Record<string, string[]> = {
    'Como cadastrar meu comércio?': [
      'cadastrar',
      'cadastro',
      'colocar',
      'incluir',
      'adicionar',
      'negocio',
      'comercio',
    ],
    'Como funciona o site?': ['funciona', 'site', 'plataforma', 'portal', 'como usar'],
    'É gratuito cadastrar?': ['gratuito', 'gratis', 'custo', 'preço', 'pago', 'de graça'],
    'Como anunciar no site?': [
      'anunciar',
      'anuncio',
      'divulgar',
      'publicidade',
      'propaganda',
      'destaque',
    ],
    'Como editar meu comércio?': ['editar', 'alterar', 'mudar', 'atualizar', 'modificar'],
    'Como reportar um erro?': ['reportar', 'erro', 'problema', 'bug', 'correcao', 'correção'],
    'O que é o Carmo Local?': ['o que é', 'sobre', 'quem somos', 'historia'],
    'Como entrar em contato?': ['contato', 'email', 'telefone', 'falar', 'duvida', 'ajuda'],
  };

  // Primeiro: match direto por texto
  const directMatches = PLATFORM_FAQ.filter((faq) => {
    const q = faq.question.toLowerCase();
    const a = faq.answer.toLowerCase();
    if (q.includes(normalized) || normalized.includes(q) || a.includes(normalized)) return true;
    const matches = queryWords.filter((word) => q.includes(word) || a.includes(word));
    return matches.length >= Math.min(2, queryWords.length);
  });

  if (directMatches.length > 0) return directMatches.slice(0, 3);

  // Segundo: match por conceitos/sinônimos
  const conceptMatches = PLATFORM_FAQ.filter((faq) => {
    const concepts = CONCEPT_MAP[faq.question];
    if (!concepts) return false;
    return queryWords.some((word) => concepts.includes(word));
  });

  return conceptMatches.slice(0, 3);
}

export async function getCityNews(supabase: Supabase, cityId: string, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('civic_news')
      .select('id, title, slug, excerpt, cover_url, published_at')
      .eq('city_id', cityId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getCityEvents(supabase: Supabase, cityId: string, limit = 5) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, start_at, end_at, location, cover_url')
      .eq('city_id', cityId)
      .gte('start_at', now)
      .order('start_at', { ascending: true })
      .limit(limit);

    if (error) return [];
    // normalize to starts_at/ends_at for the response-types contract
    return Array.isArray(data)
      ? data.map((e: any) => ({ ...e, starts_at: e.start_at, ends_at: e.end_at }))
      : [];
  } catch {
    return [];
  }
}
