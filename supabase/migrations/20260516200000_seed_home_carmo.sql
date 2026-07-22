-- ============================================================================
-- SEED: home do Carmo do Rio Claro reproduzindo o layout hardcoded antigo
-- usando os novos tipos de bloco do home builder.
-- Idempotente: limpa blocos existentes do layout de Carmo e recria do zero.
-- ============================================================================

do $$
declare
  v_city_id uuid;
  v_layout_id uuid;
begin
  select id into v_city_id from cities where slug = 'carmo-do-rio-claro';
  if v_city_id is null then
    raise notice 'cidade carmo-do-rio-claro nao encontrada, pulando seed';
    return;
  end if;

  -- Garante o layout (cria se nao existir, sem auth.uid())
  select id into v_layout_id from home_layouts where city_id = v_city_id;
  if v_layout_id is null then
    insert into home_layouts (city_id) values (v_city_id) returning id into v_layout_id;
  end if;

  -- Limpa blocos atuais (cascade limpa banners filhos)
  delete from home_blocks where layout_id = v_layout_id;

  insert into home_blocks (layout_id, city_id, type, position, enabled, title, config) values

  -- 0. Hero promocional
  (v_layout_id, v_city_id, 'business_promo_hero', 0, true, null,
   jsonb_build_object('href', '/comercio/cadastro')),

  -- 1. Categorias circulares (14 atalhos originais)
  (v_layout_id, v_city_id, 'category_grid', 1, true, 'Categorias',
   jsonb_build_object('items', jsonb_build_array(
     jsonb_build_object('label', 'Lixo',          'icon', 'Trash2',                 'href', '/servicos/coleta',      'tone', 'clay'),
     jsonb_build_object('label', 'Saude',         'icon', 'HeartPulse',             'href', '/servicos/saude',       'tone', 'cerrado'),
     jsonb_build_object('label', 'Telefones',     'icon', 'PhoneCall',              'href', '/servicos/telefones',   'tone', 'sky'),
     jsonb_build_object('label', 'Clima',         'icon', 'CloudSun',               'href', '/servicos/clima',       'tone', 'sky'),
     jsonb_build_object('label', 'Igrejas',       'icon', 'Church',                 'href', '/comunidade/igrejas',   'tone', 'paper-deep'),
     jsonb_build_object('label', 'Assistente',    'icon', 'MessageCircleQuestion',  'href', '/assistente',           'tone', 'sky'),
     jsonb_build_object('label', 'Transparencia', 'icon', 'Landmark',               'href', '/transparencia',        'tone', 'sky'),
     jsonb_build_object('label', 'Energia',       'icon', 'Zap',                    'href', '/servicos/energia',     'tone', 'sun'),
     jsonb_build_object('label', 'Agua',          'icon', 'Droplet',                'href', '/servicos/agua',        'tone', 'paper-deep'),
     jsonb_build_object('label', 'Guias',         'icon', 'BookOpen',               'href', '/turismo/guias',        'tone', 'cerrado'),
     jsonb_build_object('label', 'Pesca',         'icon', 'Fish',                   'href', '/turismo/pesca',        'tone', 'cerrado'),
     jsonb_build_object('label', 'Comercio',      'icon', 'Store',                  'href', '/comercio',             'tone', 'clay'),
     jsonb_build_object('label', 'Imoveis',       'icon', 'House',                  'href', '/imoveis',              'tone', 'sky'),
     jsonb_build_object('label', 'Eventos',       'icon', 'CalendarDays',           'href', '/agenda',               'tone', 'sun')
   ))),

  -- 2. Novidades no Portal (features grid)
  (v_layout_id, v_city_id, 'features_grid', 2, true, 'Novidades no Portal Carmelitano',
   jsonb_build_object(
     'kicker', 'Ultimas funcoes',
     'columns', 2,
     'items', jsonb_build_array(
       jsonb_build_object('title', 'Igrejas e horarios',     'text', 'Missas, cultos e encontros da semana.', 'href', '/comunidade/igrejas', 'icon', 'Church',   'tone', 'cerrado'),
       jsonb_build_object('title', 'Transparencia publica',  'text', 'Prefeitura, camara e licitacoes.',      'href', '/transparencia',      'icon', 'Landmark', 'tone', 'sky'),
       jsonb_build_object('title', 'Servicos de hoje',       'text', 'Coleta, plantao e telefones uteis.',    'href', '/servicos',           'icon', 'Sparkles', 'tone', 'clay'),
       jsonb_build_object('title', 'Sorteios locais',        'text', 'Campanhas e premios dos parceiros.',    'href', '/sorteios',           'icon', 'Tag',      'tone', 'sun')
     )
   )),

  -- 3. Negocios em destaque
  (v_layout_id, v_city_id, 'entity_list', 3, true, 'Negocios em destaque',
   jsonb_build_object(
     'source', 'businesses_featured',
     'limit', 8,
     'layout', 'hscroll',
     'actionHref', '/comercio/buscar?sort=featured',
     'actionLabel', 'Ver tudo'
   )),

  -- 4. Widget de turismo
  (v_layout_id, v_city_id, 'tourism_gateway', 4, true, null,
   jsonb_build_object('attractionsLimit', 3, 'packagesLimit', 2, 'guidesLimit', 3)),

  -- 5. Mapa de hospedagens
  (v_layout_id, v_city_id, 'lodging_map', 5, true, null,
   jsonb_build_object('categorySlug', 'pousadas', 'limit', 6)),

  -- 6. Assistente IA
  (v_layout_id, v_city_id, 'assistant_cta', 6, true, 'Pergunte ao assistente',
   jsonb_build_object(
     'href', '/assistente',
     'questions', jsonb_build_array(
       'Qual farmacia esta de plantao hoje?',
       'Tem missa ou culto esta semana?',
       'Quais eventos acontecem no fim de semana?'
     )
   )),

  -- 7. Ofertas dos parceiros (cupons)
  (v_layout_id, v_city_id, 'promo_strip', 7, true, 'Ofertas dos parceiros',
   jsonb_build_object('limit', 8)),

  -- 8. Aproveite a cidade (tile strip)
  (v_layout_id, v_city_id, 'tile_strip', 8, true, 'Aproveite a cidade',
   jsonb_build_object('items', jsonb_build_array(
     jsonb_build_object('title', 'Coleta na sua rua',         'subtitle', 'Ver calendario do bairro', 'illo', '🗑️', 'href', '/servicos/coleta'),
     jsonb_build_object('title', 'Farmacia hoje',             'subtitle', 'Plantao do dia',           'illo', '💊', 'href', '/servicos/farmacias'),
     jsonb_build_object('title', 'Eventos do fim de semana',  'subtitle', 'Agenda da cidade',         'illo', '🎉', 'href', '/agenda'),
     jsonb_build_object('title', 'Igrejas da cidade',         'subtitle', 'Guia completo',            'illo', '⛪', 'href', '/comunidade/igrejas')
   ))),

  -- 9. Pousadas em destaque
  (v_layout_id, v_city_id, 'entity_list', 9, true, 'Pousadas em destaque',
   jsonb_build_object(
     'source', 'tourism_lodgings',
     'limit', 6,
     'categorySlug', 'pousadas',
     'actionHref', '/turismo/onde-ficar',
     'actionLabel', 'Ver tudo'
   )),

  -- 10. Servicos publicos
  (v_layout_id, v_city_id, 'service_list', 10, true, 'Servicos publicos',
   jsonb_build_object(
     'actionHref', '/servicos',
     'actionLabel', 'Ver tudo',
     'items', jsonb_build_array(
       jsonb_build_object('icon', 'Trash2',    'title', 'Coleta de lixo',         'sub', 'Veja o calendario por bairro',   'href', '/servicos/coleta',     'iconBg', 'clay-50',     'iconFg', 'clay-600'),
       jsonb_build_object('icon', 'Pill',      'title', 'Farmacia de plantao',    'sub', 'Plantao do dia',                  'href', '/servicos/farmacias', 'iconBg', 'cerrado-100', 'iconFg', 'cerrado-700'),
       jsonb_build_object('icon', 'Droplet',   'title', 'Alertas da cidade',      'sub', 'Agua, energia, clima e transito', 'href', '/servicos/alertas',   'iconBg', 'sky-100',     'iconFg', 'sky-700'),
       jsonb_build_object('icon', 'PhoneCall', 'title', 'Telefones uteis',        'sub', 'SAMU 192 - Bombeiros 193',        'href', '/servicos/telefones', 'iconBg', 'paper')
     )
   )),

  -- 11. Comercios locais (recentes)
  (v_layout_id, v_city_id, 'entity_list', 11, true, 'Comercios locais',
   jsonb_build_object(
     'source', 'businesses_recent',
     'limit', 10,
     'actionHref', '/comercio',
     'actionLabel', 'Guia completo'
   )),

  -- 12. Transparencia
  (v_layout_id, v_city_id, 'transparency_pulse', 12, true, 'Transparencia em destaque',
   '{}'::jsonb),

  -- 13. Comunidade (cta grid 2x2)
  (v_layout_id, v_city_id, 'cta_grid', 13, true, 'Comunidade',
   jsonb_build_object(
     'columns', 2,
     'items', jsonb_build_array(
       jsonb_build_object('icon', 'Calendar', 'title', 'Tem um evento pra divulgar?', 'description', 'Festas, feiras, encontros e shows da cidade aparecem na agenda publica.', 'cta', 'Abrir agenda',  'href', '/comunidade/agenda',   'tone', 'sun'),
       jsonb_build_object('icon', 'Tag',      'title', 'Achados e perdidos',          'description', 'Mural para reunir quem perdeu e quem encontrou itens, documentos e objetos.', 'cta', 'Ver mural', 'href', '/comunidade/achados',  'tone', 'clay'),
       jsonb_build_object('icon', 'Users',    'title', 'Grupos e coletivos',          'description', 'Associacoes, ONGs, esportes, clubes, grupos de bairro e iniciativas locais.', 'cta', 'Ver grupos','href', '/comunidade/grupos',   'tone', 'cerrado'),
       jsonb_build_object('icon', 'Church',   'title', 'Sua igreja ja esta aqui?',    'description', 'Horarios de missa, culto e encontros. Se faltar a sua, manda mensagem.',     'cta', 'Ver guia',  'href', '/comunidade/igrejas',  'tone', 'sky')
     )
   )),

  -- 14. Newsletter
  (v_layout_id, v_city_id, 'newsletter_cta', 14, true, 'Resumo semanal',
   jsonb_build_object(
     'source', 'home',
     'description', 'Receba os principais destaques da cidade por email. Confirmacao obrigatoria.'
   )),

  -- 15. Clima
  (v_layout_id, v_city_id, 'weather', 15, true, null, '{}'::jsonb);

  raise notice 'Home do Carmo seedada com 16 blocos.';
end $$;
