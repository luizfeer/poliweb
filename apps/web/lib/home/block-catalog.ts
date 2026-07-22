import type {
  AssistantCtaConfig,
  BannerCarouselConfig,
  BusinessPromoHeroConfig,
  CategoryGridConfig,
  CtaGridConfig,
  CustomHeroBannerConfig,
  EntityListConfig,
  FeaturedPromoGridConfig,
  FeaturesGridConfig,
  HeroCompositeConfig,
  HomeBlockConfigByType,
  HomeBlockType,
  LodgingMapConfig,
  NewsletterCtaConfig,
  PromoStripConfig,
  RawHtmlConfig,
  ServiceListConfig,
  TileStripConfig,
  TourismGatewayConfig,
  TransparencyPulseConfig,
  WeatherConfig,
  WideBannerConfig,
} from './types';

type CatalogEntry<T extends HomeBlockType> = {
  type: T;
  label: string;
  description: string;
  icon: string;
  defaultTitle: string | null;
  defaultConfig: HomeBlockConfigByType[T];
  requiresModules?: string[];
};

export const BLOCK_CATALOG: { [K in HomeBlockType]: CatalogEntry<K> } = {
  banner_carousel: {
    type: 'banner_carousel',
    label: 'Carrossel de banners',
    description: 'Slides com video ou imagem, link interno ou externo. Estilo Amazon 5.5.',
    icon: 'GalleryHorizontal',
    defaultTitle: null,
    defaultConfig: { intervalMs: 6000, aspectRatio: '4:5' } satisfies BannerCarouselConfig,
  },
  category_grid: {
    type: 'category_grid',
    label: 'Grade de categorias',
    description: 'Atalhos circulares com icone e cor.',
    icon: 'LayoutGrid',
    defaultTitle: 'Categorias',
    defaultConfig: {
      items: [
        { label: 'Lixo', icon: 'Trash2', href: '/servicos/coleta', tone: 'clay' },
        { label: 'Saude', icon: 'HeartPulse', href: '/servicos/saude', tone: 'cerrado' },
        { label: 'Telefones', icon: 'PhoneCall', href: '/servicos/telefones', tone: 'sky' },
        { label: 'Igrejas', icon: 'Church', href: '/comunidade/igrejas', tone: 'paper-deep' },
        { label: 'Assistente', icon: 'MessageCircleQuestion', href: '/assistente', tone: 'sky' },
        { label: 'Transparencia', icon: 'Landmark', href: '/transparencia', tone: 'sky' },
        { label: 'Comercio', icon: 'Store', href: '/comercio', tone: 'clay' },
        { label: 'Eventos', icon: 'CalendarDays', href: '/agenda', tone: 'sun' },
      ],
    } satisfies CategoryGridConfig,
  },
  entity_list: {
    type: 'entity_list',
    label: 'Listagem dinamica',
    description:
      'Puxa itens de um modulo (destaques, recentes, pousadas, atracoes, promocoes) com filtros.',
    icon: 'List',
    defaultTitle: 'Em destaque',
    defaultConfig: {
      source: 'businesses_featured',
      limit: 8,
      layout: 'hscroll',
    } satisfies EntityListConfig,
  },
  promo_strip: {
    type: 'promo_strip',
    label: 'Faixa de promocoes',
    description: 'Cupons ativos da cidade em rolagem horizontal.',
    icon: 'Tag',
    defaultTitle: 'Ofertas dos parceiros',
    defaultConfig: { limit: 8 } satisfies PromoStripConfig,
  },
  business_promo_hero: {
    type: 'business_promo_hero',
    label: 'Hero de captacao de comercio',
    description: 'Banner grande no topo convidando comerciantes a cadastrar.',
    icon: 'Megaphone',
    defaultTitle: null,
    defaultConfig: { href: '/comercio/cadastro' } satisfies BusinessPromoHeroConfig,
  },
  features_grid: {
    type: 'features_grid',
    label: 'Grade de funcionalidades',
    description: 'Cards 2x2 (ou 3) destacando funcoes recentes do portal. Icone + titulo + texto.',
    icon: 'LayoutPanelTop',
    defaultTitle: 'Novidades no Portal',
    defaultConfig: {
      columns: 2,
      kicker: 'Ultimas funcoes',
      items: [
        {
          title: 'Igrejas e horarios',
          text: 'Missas, cultos e encontros da semana.',
          href: '/comunidade/igrejas',
          icon: 'Church',
          tone: 'cerrado',
        },
        {
          title: 'Transparencia publica',
          text: 'Prefeitura, camara e licitacoes.',
          href: '/transparencia',
          icon: 'Landmark',
          tone: 'sky',
        },
        {
          title: 'Servicos de hoje',
          text: 'Coleta, plantao e telefones uteis.',
          href: '/servicos',
          icon: 'Sparkles',
          tone: 'clay',
        },
        {
          title: 'Sorteios locais',
          text: 'Campanhas e premios dos parceiros.',
          href: '/sorteios',
          icon: 'Tag',
          tone: 'sun',
        },
      ],
    } satisfies FeaturesGridConfig,
  },
  tile_strip: {
    type: 'tile_strip',
    label: 'Tiles de atalhos',
    description: 'Cards quadrados com titulo e illustracao (emoji). Estilo "Aproveite a cidade".',
    icon: 'LayoutDashboard',
    defaultTitle: 'Aproveite a cidade',
    defaultConfig: {
      items: [
        { title: 'Coleta na sua rua', subtitle: 'Ver calendario do bairro', illo: '🗑️', href: '/servicos/coleta' },
        { title: 'Farmacia hoje', subtitle: 'Plantao do dia', illo: '💊', href: '/servicos/farmacias' },
        { title: 'Eventos do fim de semana', subtitle: 'Agenda da cidade', illo: '🎉', href: '/agenda' },
        { title: 'Igrejas da cidade', subtitle: 'Guia completo', illo: '⛪', href: '/comunidade/igrejas' },
      ],
    } satisfies TileStripConfig,
  },
  service_list: {
    type: 'service_list',
    label: 'Lista de servicos',
    description: 'Linhas verticais com icone, titulo e subtitulo. Bom para servicos publicos.',
    icon: 'List',
    defaultTitle: 'Servicos publicos',
    defaultConfig: {
      actionHref: '/servicos',
      actionLabel: 'Ver tudo',
      items: [
        { icon: 'Trash2', title: 'Coleta de lixo', sub: 'Calendario por bairro', href: '/servicos/coleta', iconBg: 'clay-50', iconFg: 'clay-600' },
        { icon: 'Pill', title: 'Farmacia de plantao', sub: 'Plantao do dia', href: '/servicos/farmacias', iconBg: 'cerrado-100', iconFg: 'cerrado-700' },
        { icon: 'Droplet', title: 'Alertas da cidade', sub: 'Agua, energia, clima', href: '/servicos/alertas', iconBg: 'sky-100', iconFg: 'sky-700' },
        { icon: 'PhoneCall', title: 'Telefones uteis', sub: 'SAMU, Bombeiros, Defesa Civil', href: '/servicos/telefones', iconBg: 'paper' },
      ],
    } satisfies ServiceListConfig,
  },
  tourism_gateway: {
    type: 'tourism_gateway',
    label: 'Widget de turismo',
    description: 'Mostra atracoes, pacotes e guias da cidade. Requer modulo tourism ativo.',
    icon: 'Mountain',
    defaultTitle: null,
    defaultConfig: {
      attractionsLimit: 3,
      packagesLimit: 2,
      guidesLimit: 3,
    } satisfies TourismGatewayConfig,
    requiresModules: ['tourism'],
  },
  lodging_map: {
    type: 'lodging_map',
    label: 'Mapa de hospedagens',
    description: 'Banner com convite pro mapa de pousadas. Requer modulo tourism.',
    icon: 'MapPinned',
    defaultTitle: null,
    defaultConfig: { categorySlug: 'pousadas', limit: 6 } satisfies LodgingMapConfig,
    requiresModules: ['tourism'],
  },
  assistant_cta: {
    type: 'assistant_cta',
    label: 'CTA do assistente IA',
    description: 'Card com perguntas-exemplo pra abrir o /assistente.',
    icon: 'MessageCircleQuestion',
    defaultTitle: 'Pergunte ao assistente',
    defaultConfig: {
      href: '/assistente',
      questions: [
        'Qual farmacia esta de plantao hoje?',
        'Tem missa ou culto esta semana?',
        'Quais eventos acontecem no fim de semana?',
      ],
    } satisfies AssistantCtaConfig,
  },
  transparency_pulse: {
    type: 'transparency_pulse',
    label: 'Pulse de transparencia',
    description: 'Resumo de noticias oficiais, camara e licitacoes. Requer modulo transparency.',
    icon: 'Landmark',
    defaultTitle: 'Transparencia em destaque',
    defaultConfig: {} satisfies TransparencyPulseConfig,
    requiresModules: ['transparency'],
  },
  cta_grid: {
    type: 'cta_grid',
    label: 'Grade de CTAs',
    description: 'Cards de chamada (EmptyCta) com icone, titulo, descricao e link. 1 ou 2 colunas.',
    icon: 'LayoutGrid',
    defaultTitle: 'Comunidade',
    defaultConfig: {
      columns: 2,
      items: [
        { icon: 'Calendar', title: 'Tem evento pra divulgar?', description: 'Festas, feiras e shows da cidade.', cta: 'Abrir agenda', href: '/comunidade/agenda', tone: 'sun' },
        { icon: 'Tag', title: 'Achados e perdidos', description: 'Mural pra reunir quem perdeu e quem achou.', cta: 'Ver mural', href: '/comunidade/achados', tone: 'clay' },
        { icon: 'Users', title: 'Grupos e coletivos', description: 'Associacoes, ONGs, esportes e clubes.', cta: 'Ver grupos', href: '/comunidade/grupos', tone: 'cerrado' },
        { icon: 'Church', title: 'Sua igreja ja esta aqui?', description: 'Horarios, encontros e guia completo.', cta: 'Ver guia', href: '/comunidade/igrejas', tone: 'sky' },
      ],
    } satisfies CtaGridConfig,
  },
  newsletter_cta: {
    type: 'newsletter_cta',
    label: 'CTA de newsletter',
    description: 'Cadastro pro resumo semanal da cidade.',
    icon: 'Mail',
    defaultTitle: 'Resumo semanal',
    defaultConfig: {
      source: 'home',
      description: 'Receba os principais destaques da cidade por email. Confirmacao obrigatoria.',
    } satisfies NewsletterCtaConfig,
  },
  weather: {
    type: 'weather',
    label: 'Widget de clima',
    description: 'Previsao do tempo da cidade (atual + dias).',
    icon: 'CloudSun',
    defaultTitle: null,
    defaultConfig: {} satisfies WeatherConfig,
  },
  custom_hero_banner: {
    type: 'custom_hero_banner',
    label: 'Hero banner personalizavel',
    description:
      'Banner editorial com imagem unica, texto, CTA, cores, tipografia, overlay, posicao da imagem e animacoes.',
    icon: 'Sparkles',
    defaultTitle: null,
    defaultConfig: {
      template: 'merchant',
      layout: 'text_left',
      height: 'standard',
      fullBleed: false,
      imagePlacement: 'background',
      imageFit: 'cover',
      imagePositionX: 50,
      imagePositionY: 50,
      overlayOpacity: 64,
      overlayDirection: 'left',
      backgroundColor: '#7a2d14',
      accentColor: '#f4a23a',
      textColor: '#ffffff',
      eyebrow: 'Destaque local',
      headline: 'A cidade olhando pro seu negocio',
      subtitle: 'Crie uma chamada com imagem, movimento e personalidade pra campanha da semana.',
      badge: 'Novo',
      ctaLabel: 'Abrir destaque',
      secondaryLabel: '',
      secondaryHref: '',
      footerNote: '',
      font: 'display',
      headlineSize: 'lg',
      animation: 'shine',
    } satisfies CustomHeroBannerConfig,
  },
  wide_banner: {
    type: 'wide_banner',
    label: 'Banner full-width',
    description:
      'Um banner unico que ocupa toda a largura. Ideal pra proporções 5:1 ou 3:1 (3000x600 etc).',
    icon: 'PanelTop',
    defaultTitle: null,
    defaultConfig: { aspectRatio: '5:1', fullBleed: true } satisfies WideBannerConfig,
  },
  hero_composite: {
    type: 'hero_composite',
    label: 'Painel hero composto (web)',
    description:
      'Painel grande customizável: hero com imagem + CTA destacado + grid 2x2 de atalhos. Apenas desktop — o mobile ignora este bloco.',
    icon: 'LayoutPanelTop',
    defaultTitle: null,
    defaultConfig: {
      hero: {
        imageUrl: '',
        imageAlt: 'Vista da cidade ao entardecer',
        kicker: 'Mar de Minas · Aterro Santa Quitéria',
        headline: 'Carmo do Rio Claro, *pertinho do* mar de Minas.',
        subtitle:
          'Onde a Represa de Furnas vira praia, a Canastra começa e a praça ainda tem banquinho vago. Tudo da cidade — comércio, pousadas, serviços e câmara — em um lugar só.',
        actions: [
          { label: 'Guia de turismo', href: '/turismo', icon: 'Map' },
          { label: 'Onde ficar', href: '/turismo/onde-ficar', icon: 'BedDouble' },
          { label: 'Onde comer', href: '/turismo/onde-comer', icon: 'UtensilsCrossed' },
        ],
      },
      cta: {
        tone: 'clay',
        badge: '1º mês grátis',
        headline: 'Apareça no Portal antes do feriado.',
        description:
          'Cadastre seu comércio em 2 minutos. Aparece no guia, no mapa, na busca e no assistente IA. Sem fidelidade — cancela quando quiser.',
        ctaLabel: 'Quero cadastrar',
        ctaHref: '/comercio/cadastro',
        footerNote: 'Aprovação manual · oferta de lançamento',
      },
    } satisfies HeroCompositeConfig,
  },
  raw_html: {
    type: 'raw_html',
    label: 'HTML bruto (urgente)',
    description:
      'Bloco de HTML editavel direto pelo admin. Aparece no web e no app sem precisar de release. Imagens vem da galeria do bloco. HTML sempre sanitizado no render.',
    icon: 'Code2',
    defaultTitle: null,
    defaultConfig: {
      html:
        '<p>Edite este conteudo em <strong>Painel &rarr; Cidade &rarr; Home</strong>. Use o botao "Inserir imagem" pra colar URLs da galeria.</p>',
      padding: 'comfortable',
    } satisfies RawHtmlConfig,
  },
  featured_promo_grid: {
    type: 'featured_promo_grid',
    label: 'Grade de promoções em destaque',
    description:
      'Cards grandes coloridos (badge + título + imagem + seta) curados pelo admin. Grid no desktop, scroll no mobile.',
    icon: 'Sparkles',
    defaultTitle: 'Promoções da semana',
    defaultConfig: {
      columns: 3,
      items: [
        {
          badge: 'Festival da Tilápia',
          title: 'Rodízio a R$ 49,90 · sáb & dom no Aterro',
          subtitle: '8 restaurantes participam · combo com cachaça da Canastra inclusa',
          href: '/comercio?promo=tilapia',
          tone: 'cerrado',
        },
        {
          badge: 'Junho mecânico',
          title: '15% off em revisão antes da viagem',
          subtitle: '4 oficinas do Centro participam · agende pelo portal',
          href: '/comercio?promo=mecanico',
          tone: 'sky',
        },
        {
          badge: 'Sorteio do mês',
          title: '2 diárias na Pousada Pontal do Lago',
          subtitle: 'Concorra ao comprar em qualquer parceiro · sorteio dia 30/06',
          href: '/sorteios',
          tone: 'clay',
        },
      ],
    } satisfies FeaturedPromoGridConfig,
  },
};

export const BLOCK_TYPES = [
  'banner_carousel',
  'business_promo_hero',
  'category_grid',
  'features_grid',
  'entity_list',
  'tile_strip',
  'service_list',
  'promo_strip',
  'tourism_gateway',
  'lodging_map',
  'assistant_cta',
  'transparency_pulse',
  'cta_grid',
  'newsletter_cta',
  'weather',
  'custom_hero_banner',
  'wide_banner',
  'hero_composite',
  'featured_promo_grid',
  'raw_html',
] as const satisfies readonly HomeBlockType[];

export function getBlockMeta<T extends HomeBlockType>(type: T): CatalogEntry<T> {
  return BLOCK_CATALOG[type];
}
