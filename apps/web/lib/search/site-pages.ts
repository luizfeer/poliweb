import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { SearchHit } from './types';
import {
  haystackMatchesSearchQuery,
  normalizeForSearch,
  scoreSearchMatch,
} from './query-tokens';

type SitePage = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  keywords: string[];
};

type SitePageRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  url: string;
  keywords: unknown;
  content: string;
};

const SITE_PAGES: SitePage[] = [
  {
    id: 'home',
    title: 'Início',
    subtitle: 'Portal Carmelitano',
    description: 'Atalhos, destaques, comércio, turismo, serviços e novidades da cidade.',
    url: '/',
    keywords: ['portal', 'inicio', 'home', 'cidade', 'carmo do rio claro'],
  },
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
    description: 'Telefones da Prefeitura, saúde, assistência social, emergência, segurança, Cemig, Copasa e serviços públicos.',
    url: '/servicos/telefones',
    keywords: ['telefone', 'telefones uteis', 'prefeitura', 'saude', 'cras', 'policia', 'samu', 'cemig', 'copasa'],
  },
  {
    id: 'postos-saude',
    title: 'Postos de saúde',
    subtitle: 'ESF, UBS e atendimento médico',
    description: 'Postos de saúde, ESFs, UBS, CAPS, Farmácia Municipal, Sala de Vacinas, vigilâncias e pronto atendimento.',
    url: '/servicos/saude',
    keywords: ['posto de saude', 'postos de saude', 'esf', 'ubs', 'psf', 'caps', 'vacina', 'farmacia municipal', 'samu'],
  },
  {
    id: 'clima',
    title: 'Clima',
    subtitle: 'Previsão e histórico',
    description: 'Previsão do tempo, temperatura, chuva e condições para Carmo do Rio Claro.',
    url: '/servicos/clima',
    keywords: ['tempo', 'previsao', 'chuva', 'temperatura', 'calor', 'frio'],
  },
  {
    id: 'balsas',
    title: 'Balsas',
    subtitle: 'Travessias de Furnas',
    description: 'Rotas, horários, alertas e detalhes das balsas da região.',
    url: '/balsas',
    keywords: ['balsa', 'balsas', 'travessia', 'furnas', 'horario', 'barco'],
  },
  {
    id: 'comercio',
    title: 'Comércio',
    subtitle: 'Guia comercial',
    description: 'Negócios, lojas, serviços, contatos, avaliações e páginas comerciais.',
    url: '/comercio',
    keywords: ['loja', 'negocio', 'servico', 'whatsapp', 'telefone', 'empresa'],
  },
  {
    id: 'buscar-comercio',
    title: 'Buscar comércio',
    subtitle: 'Filtros comerciais',
    description: 'Encontre negócios por nome, categoria, bairro e necessidade.',
    url: '/comercio/buscar',
    keywords: ['buscar comercio', 'catalogo', 'categoria', 'bairro'],
  },
  {
    id: 'turismo',
    title: 'Turismo',
    subtitle: 'Roteiros e experiências',
    description: 'Atrações, guias, hospedagem, restaurantes, pesca e pacotes turísticos.',
    url: '/turismo',
    keywords: ['passeio', 'roteiro', 'atrações', 'atracao', 'furnas', 'canastra'],
  },
  {
    id: 'onde-ficar',
    title: 'Onde ficar',
    subtitle: 'Hospedagem',
    description: 'Pousadas, hotéis, chalés, casas de temporada e ranchos.',
    url: '/turismo/onde-ficar',
    keywords: ['pousada', 'hotel', 'chale', 'rancho', 'airbnb', 'hospedagem'],
  },
  {
    id: 'onde-comer',
    title: 'Onde comer',
    subtitle: 'Restaurantes',
    description: 'Restaurantes, bares, cafés e opções para comer na cidade.',
    url: '/turismo/onde-comer',
    keywords: ['restaurante', 'bar', 'comida', 'almoco', 'jantar', 'lanche'],
  },
  {
    id: 'o-que-fazer',
    title: 'O que fazer',
    subtitle: 'Atrações turísticas',
    description: 'Praias, cachoeiras, mirantes, trilhas e pontos de interesse.',
    url: '/turismo/o-que-fazer',
    keywords: ['atracoes', 'cachoeira', 'praia', 'mirante', 'trilha', 'lazer'],
  },
  {
    id: 'pesca',
    title: 'Pesca',
    subtitle: 'Guias de pesca',
    description: 'Guias, serviços e informações para pesca esportiva em Furnas.',
    url: '/turismo/pesca',
    keywords: ['pescar', 'pescaria', 'guia de pesca', 'tucunare', 'barco'],
  },
  {
    id: 'pacotes',
    title: 'Pacotes turísticos',
    subtitle: 'Experiências prontas',
    description: 'Passeios e pacotes para conhecer a cidade e a região.',
    url: '/turismo/pacotes',
    keywords: ['pacote', 'experiencia', 'viagem', 'tour'],
  },
  {
    id: 'eventos',
    title: 'Agenda',
    subtitle: 'Eventos da comunidade',
    description: 'Eventos, festas, encontros, cursos e programação local.',
    url: '/comunidade/agenda',
    keywords: ['evento', 'agenda', 'festa', 'show', 'curso', 'fim de semana'],
  },
  {
    id: 'classificados',
    title: 'Classificados',
    subtitle: 'Itens, vagas e serviços',
    description: 'Anúncios de veículos, itens, vagas, serviços e oportunidades.',
    url: '/classificados',
    keywords: ['anuncio', 'venda', 'comprar', 'vaga', 'emprego', 'servico'],
  },
  {
    id: 'buscar-classificados',
    title: 'Buscar classificados',
    subtitle: 'Filtros de anúncios',
    description: 'Pesquise anúncios por tipo, categoria e termo.',
    url: '/classificados/buscar',
    keywords: ['buscar classificados', 'veiculo', 'item', 'emprego'],
  },
  {
    id: 'imoveis',
    title: 'Imóveis',
    subtitle: 'Compra e aluguel',
    description: 'Casas, terrenos, chácaras e imóveis para venda ou locação.',
    url: '/imoveis',
    keywords: ['casa', 'terreno', 'aluguel', 'venda', 'imobiliaria', 'chacara'],
  },
  {
    id: 'buscar-imoveis',
    title: 'Buscar imóveis',
    subtitle: 'Filtros imobiliários',
    description: 'Pesquise imóveis por bairro, tipo, preço e finalidade.',
    url: '/imoveis/buscar',
    keywords: ['buscar imoveis', 'comprar casa', 'alugar casa', 'lote'],
  },
  {
    id: 'sorteios',
    title: 'Sorteios',
    subtitle: 'Prêmios e pontos',
    description: 'Campanhas, prêmios e sorteios ativos para cidadãos.',
    url: '/sorteios',
    keywords: ['sorteio', 'premio', 'pontos', 'campanha'],
  },
  {
    id: 'anuncie',
    title: 'Anuncie',
    subtitle: 'Destaque seu negócio',
    description: 'Informações para divulgar negócios, turismo, imóveis e classificados.',
    url: '/anuncie',
    keywords: ['anunciar', 'publicidade', 'ads', 'divulgar'],
  },
  {
    id: 'privacidade',
    title: 'Privacidade',
    subtitle: 'LGPD',
    description: 'Política de privacidade e direitos sobre dados pessoais.',
    url: '/privacidade',
    keywords: ['lgpd', 'dados', 'privacidade', 'exclusao', 'opt-out'],
  },
];

export function sitePageSearch(query: string, limit = 8): SearchHit[] {
  const normalized = normalizeForSearch(query);
  if (normalized.length < 2) return [];

  const hits: SearchHit[] = [];

  for (const page of SITE_PAGES) {
    const haystack = normalizeForSearch([
      page.title,
      page.subtitle,
      page.description,
      ...page.keywords,
    ].join(' '));

    if (!haystackMatchesSearchQuery(haystack, normalized)) continue;

    const hit: SearchHit = {
      entityType: 'site_page' as const,
      entityId: page.id,
      score: scoreSearchMatch(normalized, haystack),
      title: page.title,
      subtitle: page.subtitle,
      description: page.description,
      url: page.url,
      coverUrl: null,
      source: 'fulltext' as const,
    };

    if (hit.score > 0) hits.push(hit);
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function databaseSitePageSearch(query: string, cityId: string, limit = 8): Promise<SearchHit[]> {
  const normalized = normalizeForSearch(query);
  if (normalized.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_pages')
    .select('id,title,subtitle,description,url,keywords,content')
    .eq('city_id', cityId)
    .eq('active', true);

  if (error) return [];

  return ((data ?? []) as unknown as SitePageRow[])
    .map((page) => {
      const haystack = normalizeForSearch([
        page.title,
        page.subtitle,
        page.description,
        page.content,
        ...asStringArray(page.keywords),
      ].join(' '));

      if (!haystackMatchesSearchQuery(haystack, normalized)) return null;

      const hit: SearchHit = {
        entityType: 'site_page',
        entityId: page.id,
        score: scoreSearchMatch(normalized, haystack),
        title: page.title,
        subtitle: page.subtitle,
        description: page.description,
        url: page.url,
        coverUrl: null,
        source: 'fulltext',
      };

      return hit.score > 0 ? hit : null;
    })
    .filter((hit): hit is SearchHit => Boolean(hit))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
