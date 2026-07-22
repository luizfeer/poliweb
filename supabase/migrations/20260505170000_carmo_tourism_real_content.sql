-- Conteúdo real inicial de turismo para Carmo do Rio Claro.
-- Remove seeds demonstrativos e publica atrações/roteiros baseados no planejamento turístico local.

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.tour_packages tp
using carmo
where tp.city_id = carmo.id
  and tp.slug = 'roteiro-pesca-furnas-demo';

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.fishing_guides fg
using carmo
where fg.city_id = carmo.id
  and fg.slug = 'guia-demo-furnas';

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.accommodations a
using carmo
where a.city_id = carmo.id
  and a.slug = 'pousada-demo-furnas';

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.attractions a
set status = 'archived'::public.entity_status,
    featured = false,
    updated_at = now()
from carmo
where a.city_id = carmo.id
  and a.slug in ('cachoeira-do-lobo', 'mirante-do-cristo');

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.attractions (
  city_id,
  slug,
  name,
  type,
  description,
  address,
  hours,
  entry_fee,
  difficulty,
  duration_minutes,
  cover_url,
  photos,
  best_season,
  amenities,
  accessibility,
  tips,
  price_range,
  pet_friendly,
  family_friendly,
  status,
  featured
)
select
  carmo.id,
  a.slug,
  a.name,
  a.type::public.attraction_kind,
  a.description,
  a.address,
  a.hours,
  a.entry_fee,
  a.difficulty,
  a.duration_minutes,
  null,
  '[]'::jsonb,
  a.best_season,
  a.amenities::jsonb,
  a.accessibility::jsonb,
  a.tips,
  a.price_range,
  a.pet_friendly,
  a.family_friendly,
  'published'::public.entity_status,
  a.featured
from carmo
cross join (
  values
    (
      'serra-da-tormenta',
      'Serra da Tormenta',
      'trilha',
      'Ponto mais emblemático de aventura em Carmo do Rio Claro, com cerca de 1.287 metros de altitude, visual amplo para Furnas e uso tradicional para voo livre, trilhas, mountain bike, motocross e turismo de fé.',
      'Zona rural de Carmo do Rio Claro',
      'Visita recomendada com luz do dia',
      'Gratuito; guia ou operador sob consulta',
      'moderado a difícil',
      240,
      'Período seco e dias de céu aberto',
      '["mirante","trilha","voo_livre","turismo_de_fe"]',
      '{"status":"a_confirmar","notes":"Acesso e condições variam conforme clima e estrada."}',
      'Vá cedo, confira vento e chuva antes da subida e leve água. Para voo livre, use operadores habilitados.',
      'gratuito_com_servicos_sob_consulta',
      false,
      false,
      true
    ),
    (
      'lago-de-furnas',
      'Lago de Furnas',
      'lago',
      'O Mar de Minas estrutura a paisagem turística de Carmo, com grande área alagada no município, pesca esportiva, navegação, contemplação e passeios que conectam cânions, lagoas e bares flutuantes.',
      'Lago de Furnas, Carmo do Rio Claro',
      'Aberto para contemplação; passeios dependem de operadores',
      'Gratuito para contemplação; passeios náuticos sob consulta',
      'fácil',
      180,
      'Ano todo, com destaque para fins de tarde e temporada seca',
      '["passeio_de_lancha","pesca","por_do_sol","marinas"]',
      '{"status":"a_confirmar","notes":"Atividades náuticas dependem de operador, clima e nível do lago."}',
      'Para passeios de lancha, confirme duração, lotação, roteiro e itens inclusos antes de sair.',
      'gratuito_com_passeios_sob_consulta',
      false,
      true,
      true
    ),
    (
      'aterro-santa-quiteria',
      'Aterro Santa Quitéria',
      'mirante',
      'Trecho de acesso ao lago pela MG-184, conhecido por marinas, restaurantes, pesca e pelo pôr do sol na região da Ponte do Aterro.',
      'MG-184, km 14 a 14,5',
      'Aberto; serviços conforme operação local',
      'Gratuito para acesso público; consumo e marinas sob consulta',
      'fácil',
      120,
      'Fim de tarde e dias de céu aberto',
      '["por_do_sol","marinas","restaurantes","pesca"]',
      '{"status":"a_confirmar","notes":"Estrutura varia por estabelecimento."}',
      'Chegue antes do pôr do sol e confirme funcionamento de restaurantes e marinas em baixa temporada.',
      'gratuito_com_consumo_sob_consulta',
      false,
      true,
      true
    ),
    (
      'muari-museu-arqueologia-indigena',
      'MUARI - Museu de Arqueologia Indígena Antônio Adauto Leite',
      'museu',
      'Museu dedicado à arqueologia indígena, formado a partir da coleção iniciada por Antônio Adauto Leite em 1969, com mais de 3 mil peças e forte ligação com a memória Catu-auá e Cataguases.',
      'Centro de Carmo do Rio Claro',
      'Consultar agenda de visitação',
      'Consultar',
      'fácil',
      90,
      'Ano todo',
      '["museu","arqueologia","historia_indigena","educativo"]',
      '{"status":"a_confirmar","notes":"Confirmar horários e acessibilidade antes da visita."}',
      'Combine a visita com o centro histórico e reserve tempo para leitura das peças e contexto local.',
      'consultar',
      false,
      true,
      true
    ),
    (
      'cachoeira-pedra-molhada',
      'Cachoeira Pedra Molhada',
      'cachoeira',
      'Complexo natural com cachoeiras, corredeiras, área de camping e perfil de ecoturismo familiar, também procurado para atividades de aventura como rapel e cascading quando operadas por guias.',
      'Zona rural de Carmo do Rio Claro',
      'Conforme acesso e operação local',
      'Consultar operação local',
      'fácil a moderado',
      180,
      'Período seco',
      '["cachoeira","camping","corredeiras","aventura"]',
      '{"status":"a_confirmar","notes":"Condições de trilha e banho variam conforme chuva."}',
      'Evite dias de chuva forte, use calçado adequado e confirme regras de acesso antes de ir.',
      'consultar',
      false,
      true,
      true
    ),
    (
      'cachoeira-do-silvestre',
      'Cachoeira do Silvestre',
      'cachoeira',
      'Cachoeira próxima ao bairro Silvestre, conhecida pela água fria, paisagem de natureza preservada e visita mais rústica, indicada para quem busca banho de cachoeira e passeio de aventura leve.',
      'Bairro Silvestre, Carmo do Rio Claro',
      'Conforme acesso local',
      'Consultar acesso local',
      'moderado',
      150,
      'Período seco',
      '["cachoeira","banho","natureza","trilha"]',
      '{"status":"a_confirmar","notes":"Acesso pode exigir orientação local."}',
      'Leve água, retire seu lixo e confirme o caminho com moradores ou guias locais.',
      'consultar',
      false,
      false,
      true
    ),
    (
      'igreja-matriz',
      'Igreja Matriz de Nossa Senhora do Carmo',
      'igreja',
      'Referência religiosa e histórica no centro de Carmo do Rio Claro, ligada à formação urbana e às celebrações tradicionais da cidade.',
      'Centro de Carmo do Rio Claro',
      'Horários de missa e visitação conforme agenda paroquial',
      'Gratuito',
      'fácil',
      45,
      'Ano todo',
      '["religioso","historico","centro"]',
      '{"status":"a_confirmar","notes":"Confirmar acessibilidade e horários de celebração."}',
      'Inclua a Matriz em um roteiro a pé pelo centro, junto ao museu e ao comércio local.',
      'gratuito',
      false,
      true,
      false
    )
) as a(
  slug,
  name,
  type,
  description,
  address,
  hours,
  entry_fee,
  difficulty,
  duration_minutes,
  best_season,
  amenities,
  accessibility,
  tips,
  price_range,
  pet_friendly,
  family_friendly,
  featured
)
on conflict (city_id, slug) do update
set name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    address = excluded.address,
    hours = excluded.hours,
    entry_fee = excluded.entry_fee,
    difficulty = excluded.difficulty,
    duration_minutes = excluded.duration_minutes,
    best_season = excluded.best_season,
    amenities = excluded.amenities,
    accessibility = excluded.accessibility,
    tips = excluded.tips,
    price_range = excluded.price_range,
    pet_friendly = excluded.pet_friendly,
    family_friendly = excluded.family_friendly,
    status = excluded.status,
    featured = excluded.featured,
    updated_at = now();

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
target_attractions as (
  select a.id
  from public.attractions a
  join carmo on carmo.id = a.city_id
  where a.slug in (
    'serra-da-tormenta',
    'lago-de-furnas',
    'aterro-santa-quiteria',
    'muari-museu-arqueologia-indigena',
    'cachoeira-pedra-molhada',
    'cachoeira-do-silvestre',
    'igreja-matriz'
  )
)
delete from public.attraction_services s
using target_attractions t
where s.attraction_id = t.id;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
attractions as (
  select a.id, a.slug
  from public.attractions a
  join carmo on carmo.id = a.city_id
)
insert into public.attraction_services (attraction_id, kind, label, details, price, contact_business_id)
select attractions.id, s.kind, s.label, s.details, null, null
from attractions
join (
  values
    ('serra-da-tormenta', 'mirante', 'Vista panorâmica', 'Visual aberto para a cidade, montanhas e Lago de Furnas.'),
    ('serra-da-tormenta', 'aventura', 'Voo livre e trilhas', 'Atividades dependem de clima, guia e operador habilitado.'),
    ('lago-de-furnas', 'nautico', 'Passeios de lancha', 'Roteiros compartilhados ou exclusivos por operadores locais.'),
    ('lago-de-furnas', 'pesca', 'Pesca esportiva', 'Confirmar regras, documentação e períodos permitidos.'),
    ('aterro-santa-quiteria', 'apoio', 'Marinas e restaurantes', 'Serviços privados na região do Aterro Santa Quitéria.'),
    ('muari-museu-arqueologia-indigena', 'educativo', 'Visita cultural', 'Acervo arqueológico indígena e memória local.'),
    ('cachoeira-pedra-molhada', 'natureza', 'Cachoeiras e camping', 'Estrutura e cobrança devem ser confirmadas antes da visita.'),
    ('cachoeira-do-silvestre', 'natureza', 'Banho de cachoeira', 'Acesso rústico, recomendado com orientação local.'),
    ('igreja-matriz', 'religioso', 'Visitação e celebrações', 'Horários conforme agenda paroquial.')
) as s(slug, kind, label, details) on s.slug = attractions.slug;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
att as (
  select a.slug, a.id
  from public.attractions a
  join carmo on carmo.id = a.city_id
)
insert into public.tour_packages (
  city_id,
  provider_business_id,
  slug,
  title,
  description,
  duration_hours,
  price,
  includes,
  contact_phone,
  contact_whatsapp,
  cover_url,
  itinerary,
  difficulty,
  total_duration_hours,
  total_distance_km,
  gallery,
  featured,
  status
)
select
  carmo.id,
  null,
  r.slug,
  r.title,
  r.description,
  r.duration_hours,
  null,
  r.includes::jsonb,
  null,
  null,
  null,
  r.itinerary,
  r.difficulty,
  r.duration_hours,
  null,
  '[]'::jsonb,
  r.featured,
  'published'::public.entity_status
from carmo
cross join lateral (
  values
    (
      'roteiro-mar-de-minas',
      'Mar de Minas e pôr do sol',
      'Roteiro para viver o Lago de Furnas em Carmo: contemplação, passeio náutico, marinas, pesca e fim de tarde no Aterro Santa Quitéria.',
      7.0::numeric,
      '["Lago de Furnas","Aterro Santa Quitéria","passeio náutico sob consulta","pôr do sol"]',
      'fácil',
      true,
      jsonb_build_array(
        jsonb_build_object('stop_order', 1, 'attraction_id', (select id from att where slug = 'lago-de-furnas'), 'custom_title', 'Lago de Furnas', 'duration_minutes', 120, 'notes', 'Comece pela contemplação do Mar de Minas e confirme opções de passeio com operadores.'),
        jsonb_build_object('stop_order', 2, 'custom_title', 'Passeio de lancha pelos cânions e lagoas', 'duration_minutes', 240, 'notes', 'Roteiro sob consulta, com opções compartilhadas ou exclusivas.'),
        jsonb_build_object('stop_order', 3, 'attraction_id', (select id from att where slug = 'aterro-santa-quiteria'), 'custom_title', 'Pôr do sol no Aterro Santa Quitéria', 'duration_minutes', 90, 'notes', 'Finalize nas marinas, restaurantes e mirantes do Aterro.')
      )
    ),
    (
      'roteiro-montanhas-e-cachoeiras',
      'Montanhas, mirantes e cachoeiras',
      'Roteiro de natureza para combinar Serra da Tormenta, banho de cachoeira e paisagens rurais de Carmo do Rio Claro.',
      8.0::numeric,
      '["Serra da Tormenta","Cachoeira Pedra Molhada","Cachoeira do Silvestre","orientação local recomendada"]',
      'moderado',
      true,
      jsonb_build_array(
        jsonb_build_object('stop_order', 1, 'attraction_id', (select id from att where slug = 'serra-da-tormenta'), 'custom_title', 'Serra da Tormenta', 'duration_minutes', 240, 'notes', 'Subida cedo, com checagem de clima e estrada.'),
        jsonb_build_object('stop_order', 2, 'attraction_id', (select id from att where slug = 'cachoeira-pedra-molhada'), 'custom_title', 'Cachoeira Pedra Molhada', 'duration_minutes', 180, 'notes', 'Confirme acesso, operação e condições de banho.'),
        jsonb_build_object('stop_order', 3, 'attraction_id', (select id from att where slug = 'cachoeira-do-silvestre'), 'custom_title', 'Cachoeira do Silvestre', 'duration_minutes', 120, 'notes', 'Passeio rústico, melhor com orientação local.')
      )
    ),
    (
      'roteiro-cultura-sabores-e-teares',
      'Cultura, sabores e teares',
      'Roteiro urbano para conhecer a memória indígena, a religiosidade, os doces artesanais e a tradição têxtil de Carmo do Rio Claro.',
      5.0::numeric,
      '["MUARI","Igreja Matriz","doces artesanais","tecelagem local"]',
      'fácil',
      false,
      jsonb_build_array(
        jsonb_build_object('stop_order', 1, 'attraction_id', (select id from att where slug = 'muari-museu-arqueologia-indigena'), 'custom_title', 'MUARI', 'duration_minutes', 90, 'notes', 'Confirme horário de visitação.'),
        jsonb_build_object('stop_order', 2, 'attraction_id', (select id from att where slug = 'igreja-matriz'), 'custom_title', 'Igreja Matriz de Nossa Senhora do Carmo', 'duration_minutes', 45, 'notes', 'Visita combinada com caminhada pelo centro.'),
        jsonb_build_object('stop_order', 3, 'custom_title', 'Doces artesanais de Carmo', 'duration_minutes', 60, 'notes', 'Inclua produtores e lojas locais conforme cadastro no comércio.'),
        jsonb_build_object('stop_order', 4, 'custom_title', 'Tecelagem artesanal', 'duration_minutes', 60, 'notes', 'Adicionar negócios locais quando cadastrados no módulo de comércio.')
      )
    )
) as r(slug, title, description, duration_hours, includes, difficulty, featured, itinerary)
on conflict (city_id, slug) do update
set provider_business_id = excluded.provider_business_id,
    title = excluded.title,
    description = excluded.description,
    duration_hours = excluded.duration_hours,
    price = excluded.price,
    includes = excluded.includes,
    contact_phone = excluded.contact_phone,
    contact_whatsapp = excluded.contact_whatsapp,
    itinerary = excluded.itinerary,
    difficulty = excluded.difficulty,
    total_duration_hours = excluded.total_duration_hours,
    total_distance_km = excluded.total_distance_km,
    gallery = excluded.gallery,
    featured = excluded.featured,
    status = excluded.status;
