import type { SearchEntityType } from '@/lib/chat/types';

import {
  haystackMatchesSearchQuery,
  normalizeForSearch,
  scoreSearchMatch,
} from './query-tokens';

export type LocalSearchHit = {
  entityType: SearchEntityType;
  entityId: string;
  score: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  url: string;
  coverUrl: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  source: 'semantic' | 'fulltext';
};

type SitePage = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  keywords: string[];
};

/** Páginas estáticas do portal — espelho de apps/web/lib/search/site-pages.ts */
const SITE_PAGES: SitePage[] = [
  {
    id: 'assistente',
    title: 'TormentaIA',
    subtitle: 'Assistente da cidade',
    description: 'Pergunte sobre roteiros, clima, balsas, comércio, eventos e serviços locais.',
    url: '/assistente',
    keywords: ['ia', 'assistente', 'perguntar', 'tormentaia', 'chat'],
  },
  {
    id: 'telefones-uteis',
    title: 'Telefones úteis',
    subtitle: 'Utilidade pública',
    description: 'Telefones da Prefeitura, saúde, emergência e serviços públicos.',
    url: '/servicos/telefones',
    keywords: ['telefone', 'telefones uteis', 'prefeitura', 'saude', 'samu'],
  },
  {
    id: 'postos-saude',
    title: 'Postos de saúde',
    subtitle: 'ESF, UBS e atendimento médico',
    description: 'Postos de saúde, ESFs, UBS e pronto atendimento.',
    url: '/servicos/saude',
    keywords: ['posto de saude', 'ubs', 'esf', 'farmacia municipal'],
  },
  {
    id: 'clima',
    title: 'Clima',
    subtitle: 'Previsão e histórico',
    description: 'Previsão do tempo para Carmo do Rio Claro.',
    url: '/servicos/clima',
    keywords: ['tempo', 'previsao', 'chuva', 'temperatura'],
  },
  {
    id: 'balsas',
    title: 'Balsas',
    subtitle: 'Travessias de Furnas',
    description: 'Rotas, horários e detalhes das balsas da região.',
    url: '/balsas',
    keywords: ['balsa', 'balsas', 'travessia', 'furnas', 'horario'],
  },
  {
    id: 'comercio',
    title: 'Comércio',
    subtitle: 'Guia comercial',
    description: 'Negócios, lojas, serviços e contatos.',
    url: '/comercio',
    keywords: ['loja', 'negocio', 'servico', 'empresa'],
  },
  {
    id: 'turismo',
    title: 'Turismo',
    subtitle: 'Roteiros e experiências',
    description: 'Atrações, guias, hospedagem, restaurantes e pacotes.',
    url: '/turismo',
    keywords: ['passeio', 'roteiro', 'atracoes', 'furnas'],
  },
  {
    id: 'onde-ficar',
    title: 'Onde ficar',
    subtitle: 'Pousadas',
    description: 'Pousadas, ranchos e hospedagens do guia comercial.',
    url: '/comercio/pousadas',
    keywords: ['pousada', 'hotel', 'chale', 'hospedagem', 'rancho'],
  },
  {
    id: 'onde-comer',
    title: 'Onde comer',
    subtitle: 'Restaurantes',
    description: 'Restaurantes, bares e cafés.',
    url: '/turismo/onde-comer',
    keywords: ['restaurante', 'bar', 'comida', 'almoco', 'jantar'],
  },
  {
    id: 'o-que-fazer',
    title: 'O que fazer',
    subtitle: 'Atrações turísticas',
    description: 'Praias, cachoeiras, mirantes e trilhas.',
    url: '/turismo/o-que-fazer',
    keywords: ['atracoes', 'cachoeira', 'praia', 'mirante', 'trilha'],
  },
  {
    id: 'eventos',
    title: 'Agenda',
    subtitle: 'Eventos da comunidade',
    description: 'Eventos, festas e programação local.',
    url: '/comunidade/agenda',
    keywords: ['evento', 'agenda', 'festa', 'show', 'fim de semana'],
  },
  {
    id: 'classificados',
    title: 'Classificados',
    subtitle: 'Itens, vagas e serviços',
    description: 'Anúncios de veículos, itens, vagas e serviços.',
    url: '/classificados',
    keywords: ['anuncio', 'venda', 'vaga', 'emprego'],
  },
  {
    id: 'imoveis',
    title: 'Imóveis',
    subtitle: 'Compra e aluguel',
    description: 'Casas, terrenos e imóveis para venda ou locação.',
    url: '/imoveis',
    keywords: ['casa', 'terreno', 'aluguel', 'venda', 'imobiliaria'],
  },
];

export function searchSitePages(query: string, limit = 8): LocalSearchHit[] {
  const normalized = normalizeForSearch(query);
  if (normalized.length < 2) return [];

  const hits: LocalSearchHit[] = [];

  for (const page of SITE_PAGES) {
    const haystack = normalizeForSearch(
      [page.title, page.subtitle, page.description, ...page.keywords].join(' '),
    );
    if (!haystackMatchesSearchQuery(haystack, normalized)) continue;

    const score = scoreSearchMatch(normalized, haystack);
    if (score <= 0) continue;

    hits.push({
      entityType: 'site_page',
      entityId: page.id,
      score,
      title: page.title,
      subtitle: page.subtitle,
      description: page.description,
      url: page.url,
      coverUrl: null,
      source: 'fulltext',
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
