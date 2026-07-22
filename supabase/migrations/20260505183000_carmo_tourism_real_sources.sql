-- Reforço do conteúdo público de turismo de Carmo com dados reais de fontes oficiais.
-- Também impede que seeds demonstrativos antigos continuem publicados.

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.tour_packages tp
using carmo
where tp.city_id = carmo.id
  and (tp.slug ilike '%demo%' or tp.title ilike '%demo%');

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.tour_packages tp
set status = 'archived'::public.entity_status
from carmo
where tp.city_id = carmo.id
  and tp.slug in ('roteiro-montanhas-e-cachoeiras', 'roteiro-cultura-sabores-e-teares');

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.fishing_guides fg
using carmo
where fg.city_id = carmo.id
  and (fg.slug ilike '%demo%' or fg.full_name ilike '%demo%');

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.accommodations a
using carmo
where a.city_id = carmo.id
  and (a.slug ilike '%demo%' or a.name ilike '%demo%');

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.attractions a
set status = 'archived'::public.entity_status,
    featured = false,
    updated_at = now()
from carmo
where a.city_id = carmo.id
  and (
    a.slug in ('mirante-do-cristo', 'cachoeira-do-lobo')
    or a.slug ilike '%demo%'
    or a.name ilike '%demo%'
  );

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
      'Serra de 1.287 metros de altitude, símbolo de Carmo do Rio Claro, com a Igrejinha de Nossa Senhora Aparecida no topo, vista ampla para a região e uma das rampas naturais mais conhecidas para voo livre.',
      'Zona rural de Carmo do Rio Claro',
      'Visita recomendada com luz do dia',
      'Gratuito; operador ou guia sob consulta',
      'moderado a difícil',
      240,
      'Período seco, manhã cedo e dias de céu aberto',
      '["mirante","voo_livre","trilha","turismo_religioso","mountain_bike","motocross"]',
      '{"status":"a_confirmar","notes":"Acesso e segurança dependem de clima, estrada e atividade praticada."}',
      'Suba cedo, leve água e confirme condições de vento e estrada. Para voo livre, use apenas operadores habilitados.',
      'gratuito_com_servicos_sob_consulta',
      false,
      false,
      true
    ),
    (
      'lago-de-furnas',
      'Lago de Furnas',
      'lago',
      'O Mar de Minas em Carmo do Rio Claro reúne a maior área municipal alagada por Furnas, com cerca de 212 km², pesca esportiva e passeios por paisagens de cânions, cachoeiras e ilhas acessíveis pelo lago.',
      'Lago de Furnas, Carmo do Rio Claro',
      'Aberto para contemplação; passeios dependem de operadores',
      'Gratuito para contemplação; passeios náuticos sob consulta',
      'fácil',
      240,
      'Ano todo; melhor com tempo firme',
      '["passeio_de_barco","pesca_esportiva","canyons","cachoeiras_no_lago","marinas"]',
      '{"status":"a_confirmar","notes":"Atividades náuticas dependem de operador, clima e nível do lago."}',
      'Confirme duração, lotação, roteiro, colete e paradas antes de contratar passeio de barco ou catamarã.',
      'gratuito_com_passeios_sob_consulta',
      false,
      true,
      true
    ),
    (
      'aterro-santa-quiteria',
      'Aterro Santa Quitéria',
      'mirante',
      'Corredor turístico na MG-184, entre os km 14 e 14,5, com restaurantes, marinas, prainhas, pesca e vista para o Lago de Furnas. É uma das melhores áreas para almoço de peixe e fim de tarde.',
      'Aterro Santa Quitéria, Rodovia MG-184, km 14 a 14,5',
      'Serviços variam por estabelecimento',
      'Acesso público; consumo e marina sob consulta',
      'fácil',
      180,
      'Fim de tarde, fins de semana e dias de céu aberto',
      '["restaurantes","marinas","por_do_sol","pesca","lago"]',
      '{"status":"a_confirmar","notes":"A estrutura é formada por estabelecimentos privados e pode variar por dia."}',
      'Para almoço, confirme horário dos restaurantes. Para fotos, chegue antes do pôr do sol.',
      'gratuito_com_consumo_sob_consulta',
      false,
      true,
      true
    ),
    (
      'muari-museu-arqueologia-indigena',
      'MUARI - Museu de Arqueologia Indígena Antônio Adauto Leite',
      'museu',
      'Museu municipal no centro de Carmo, ao lado da Igreja Matriz, com acervo arqueológico indígena de importância nacional e internacional, mais de três mil peças e visitas educativas.',
      'Praça Maria Goulart, 29 - Centro',
      'Segunda a sexta, 9h às 17h, com intervalo das 12h às 14h; confirmar antes da visita',
      'Entrada franca',
      'fácil',
      90,
      'Ano todo',
      '["museu","arqueologia","historia_indigena","visita_guiada","visita_autoguiada","educativo"]',
      '{"status":"a_confirmar","notes":"Confirmar funcionamento temporário e acessibilidade com o museu."}',
      'Combine com a Igreja Matriz e reserve tempo para ler o contexto das peças.',
      'gratuito',
      false,
      true,
      true
    ),
    (
      'cachoeiras-de-furnas-por-barco',
      'Cachoeiras de Furnas por barco',
      'cachoeira',
      'Conjunto de cachoeiras que caem no Lago de Furnas e costumam integrar passeios de barco saindo de hospedagens e marinas da região dos cânions de Carmo do Rio Claro.',
      'Região dos cânions de Carmo do Rio Claro',
      'Conforme operador náutico',
      'Passeio sob consulta',
      'fácil a moderado',
      240,
      'Tempo firme e nível seguro do lago',
      '["cachoeiras","passeio_de_barco","canyons","banho","natureza"]',
      '{"status":"a_confirmar","notes":"Acesso depende de embarcação, clima e operador local."}',
      'Pergunte quais paradas entram no roteiro, se há banho permitido e se o barco fornece coletes.',
      'sob_consulta',
      false,
      true,
      true
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
)
insert into public.accommodations (
  city_id,
  district_id,
  slug,
  name,
  type,
  short_description,
  description,
  address,
  phone,
  whatsapp,
  website,
  instagram,
  amenities,
  near_lake,
  has_marina,
  cover_url,
  photos,
  status,
  featured,
  verified
)
select
  carmo.id,
  null,
  h.slug,
  h.name,
  h.type::public.accommodation_kind,
  h.short_description,
  h.description,
  h.address,
  h.phone,
  h.whatsapp,
  h.website,
  h.instagram,
  h.amenities::jsonb,
  h.near_lake,
  h.has_marina,
  null,
  '[]'::jsonb,
  'published'::public.entity_status,
  h.featured,
  true
from carmo
cross join (
  values
    (
      'pousada-pontal-do-lago',
      'Pousada Pontal do Lago',
      'pousada',
      'Chalés às margens do Lago de Furnas, com vista para o lago, lazer e catamarã.',
      'Às margens do Lago de Furnas, oferece chalés com vista para o lago, piscina, quadras, playground, sala de jogos, prainha para mergulho e passeio de catamarã para contemplar cachoeiras do entorno.',
      'Rodovia MG-184, km 13, a 4 km do trevo da cidade',
      '(35) 3561-1426',
      null,
      'https://www.pontaldolago.com.br',
      null,
      '["vista_lago","piscina","quadras","playground","sala_de_jogos","prainha","catamara"]',
      true,
      true,
      true
    ),
    (
      'pousada-salto-da-cachoeira',
      'Pousada Salto da Cachoeira',
      'pousada',
      'Hospedagem na região dos cânions, com pier flutuante, pesca e passeios de barco.',
      'Localizada às margens do Lago de Furnas, na região dos cânions de Carmo, oferece pier flutuante para pesca, barcos para pontos de tucunaré e passeio para cachoeiras que deságuam no lago.',
      'Região dos cânions de Carmo do Rio Claro',
      '(19) 99754-1172',
      '(35) 99997-5491',
      'http://www.saltodacachoeira.com.br',
      null,
      '["beira_lago","pier","pesca","barco","canyons","restaurante"]',
      true,
      true,
      true
    ),
    (
      'hotel-varandas-da-montanha',
      'Hotel Varandas da Montanha',
      'hotel',
      'Hotel aos pés da Serra da Tormenta, com visual 360 graus e estrutura de lazer.',
      'Hotel em colina aos pés da Serra da Tormenta, com vista panorâmica, apartamentos amplos, café da manhã colonial, piscina, fitness center, spa e estrutura para eventos.',
      'Rua Padre Leopoldo Maimoni, 811 - Jardim América do Sul',
      '(35) 3561-2696',
      '(35) 99215-1975',
      'https://www.varandasdamontanha.com.br/',
      'varandas_da_montanha_hotel',
      '["vista_serra","cafe_da_manha","piscina","spa","fitness","eventos","estacionamento"]',
      false,
      false,
      true
    ),
    (
      'pousada-santa-ines',
      'Pousada Santa Inês',
      'pousada',
      'Pousada rural a 1,8 km do Aterro Santa Quitéria, com chalés, piscinas e pesqueiro.',
      'Hospedagem próxima ao Aterro Santa Quitéria, com chalés, piscinas adulto e infantil, quiosques com churrasqueira, pesqueiro e restaurante com porções e almoço mediante reserva.',
      'Rodovia MG-184, km 13, Bairro Cabaçal',
      '(35) 3561-1154',
      '(35) 99737-9175',
      null,
      'santainespousada',
      '["chales","piscina","quiosques","churrasqueira","pesqueiro","restaurante"]',
      true,
      false,
      false
    )
) as h(slug, name, type, short_description, description, address, phone, whatsapp, website, instagram, amenities, near_lake, has_marina, featured)
on conflict (city_id, slug) do update
set name = excluded.name,
    type = excluded.type,
    short_description = excluded.short_description,
    description = excluded.description,
    address = excluded.address,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    website = excluded.website,
    instagram = excluded.instagram,
    amenities = excluded.amenities,
    near_lake = excluded.near_lake,
    has_marina = excluded.has_marina,
    status = excluded.status,
    featured = excluded.featured,
    verified = excluded.verified,
    updated_at = now();

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.restaurants (
  city_id,
  district_id,
  slug,
  name,
  description,
  cuisine,
  price_range,
  address,
  phone,
  whatsapp,
  hours,
  delivery,
  cover_url,
  photos,
  status,
  featured
)
select
  carmo.id,
  null,
  r.slug,
  r.name,
  r.description,
  r.cuisine::jsonb,
  r.price_range,
  r.address,
  r.phone,
  r.whatsapp,
  r.hours::jsonb,
  false,
  null,
  '[]'::jsonb,
  'published'::public.entity_status,
  r.featured
from carmo
cross join (
  values
    (
      'restaurante-pontal-do-lago',
      'Restaurante Pontal do Lago',
      'Restaurante no Aterro Santa Quitéria, às margens do Lago de Furnas, conhecido por saladas, carnes e tilápia recheada.',
      '["mineira","peixes","tilapia","lago"]',
      '$$',
      'Aterro Santa Quitéria, Rodovia MG-184, km 14,5 - Zona Rural',
      '(35) 9868-5463',
      null,
      '{"todos":"11h às 15h"}',
      true
    ),
    (
      'restaurante-recanto-das-aguas',
      'Restaurante Recanto das Águas',
      'Restaurante no Aterro Santa Quitéria com peixes, massas e carnes no sistema self-service e à la carte.',
      '["mineira","peixes","massas","self_service"]',
      '$$',
      'Aterro Santa Quitéria, Rodovia MG-184, km 14,5 - Zona Rural',
      '(35) 99827-3695',
      '(35) 99919-0425',
      '{"terca_domingo":"8h às 21h"}',
      true
    ),
    (
      'bar-e-restaurante-prainha',
      'Bar e Restaurante Prainha',
      'Bar e restaurante no Aterro Santa Quitéria, com funcionamento de terça a domingo e vista para a área do lago.',
      '["mineira","bar","lago"]',
      '$$',
      'Aterro Santa Quitéria, Rodovia MG-184, km 14 - Zona Rural',
      '(35) 9112-2791',
      null,
      '{"terca_domingo":"8h às 21h"}',
      false
    ),
    (
      'restaurante-bom-prato',
      'Restaurante Bom Prato',
      'Restaurante no centro de Carmo do Rio Claro, com almoço todos os dias e jantar de segunda a sexta.',
      '["mineira","self_service","centro"]',
      '$',
      'Rua Wenceslau Braz, 20 - Centro',
      '(35) 3561-1792',
      '(35) 99992-1792',
      '{"segunda_sexta":"10h às 14h e 19h às 21h","sabado_domingo":"10h às 14h"}',
      false
    )
) as r(slug, name, description, cuisine, price_range, address, phone, whatsapp, hours, featured)
on conflict (city_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    cuisine = excluded.cuisine,
    price_range = excluded.price_range,
    address = excluded.address,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    hours = excluded.hours,
    status = excluded.status,
    featured = excluded.featured,
    updated_at = now();

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
  r.distance_km,
  '[]'::jsonb,
  r.featured,
  'published'::public.entity_status
from carmo
cross join lateral (
  values
    (
      'roteiro-mar-de-minas',
      'Mar de Minas, cânions e Aterro',
      'Dia de lago em Carmo: Lago de Furnas, passeio náutico por cachoeiras acessíveis por barco, almoço de peixe no Aterro Santa Quitéria e pôr do sol na água.',
      7.0::numeric,
      18.0::numeric,
      '["Lago de Furnas","passeio náutico sob consulta","cachoeiras no lago","restaurantes do Aterro Santa Quitéria","pôr do sol"]',
      'fácil',
      true,
      jsonb_build_array(
        jsonb_build_object('stop_order', 1, 'attraction_id', (select id from att where slug = 'lago-de-furnas'), 'custom_title', 'Lago de Furnas', 'duration_minutes', 60, 'notes', 'Comece pelo Mar de Minas, que em Carmo ocupa cerca de 212 km² de área alagada.'),
        jsonb_build_object('stop_order', 2, 'attraction_id', (select id from att where slug = 'cachoeiras-de-furnas-por-barco'), 'custom_title', 'Cachoeiras e cânions por barco', 'duration_minutes', 240, 'notes', 'Contrate operador local e confirme paradas, colete, lotação e condição do lago.'),
        jsonb_build_object('stop_order', 3, 'attraction_id', (select id from att where slug = 'aterro-santa-quiteria'), 'custom_title', 'Almoço e pôr do sol no Aterro Santa Quitéria', 'duration_minutes', 120, 'notes', 'Área com restaurantes e marinas na MG-184, km 14 a 14,5.')
      )
    ),
    (
      'roteiro-serra-fe-e-aventura',
      'Serra da Tormenta, fé e aventura',
      'Roteiro de meio dia focado na Serra da Tormenta: visual de altitude, Igrejinha de Nossa Senhora Aparecida, voo livre quando houver operador e caminhos de aventura.',
      5.0::numeric,
      null::numeric,
      '["Serra da Tormenta","Igrejinha de Nossa Senhora Aparecida","mirante natural","voo livre sob consulta","trilhas"]',
      'moderado',
      true,
      jsonb_build_array(
        jsonb_build_object('stop_order', 1, 'attraction_id', (select id from att where slug = 'serra-da-tormenta'), 'custom_title', 'Subida à Serra da Tormenta', 'duration_minutes', 180, 'notes', 'São 1.287 metros de altitude. Vá com tempo firme e confira o acesso.'),
        jsonb_build_object('stop_order', 2, 'custom_title', 'Igrejinha de Nossa Senhora Aparecida', 'duration_minutes', 45, 'notes', 'Parada de fé no topo da serra, citada pela Prefeitura como marco local.'),
        jsonb_build_object('stop_order', 3, 'custom_title', 'Voo livre ou contemplação', 'duration_minutes', 60, 'notes', 'A serra é reconhecida como rampa natural para voo livre; a prática exige operador habilitado.')
      )
    ),
    (
      'roteiro-centro-muari-e-matriz',
      'Centro histórico, MUARI e Matriz',
      'Roteiro urbano para conhecer o acervo arqueológico indígena, a Igreja Matriz e a memória cultural de Carmo antes de seguir para doces e artesanato.',
      4.0::numeric,
      2.0::numeric,
      '["MUARI","Igreja Matriz","Praça Maria Goulart","doces artesanais","tear manual"]',
      'fácil',
      false,
      jsonb_build_array(
        jsonb_build_object('stop_order', 1, 'attraction_id', (select id from att where slug = 'muari-museu-arqueologia-indigena'), 'custom_title', 'MUARI', 'duration_minutes', 90, 'notes', 'Museu ao lado da Matriz, com entrada franca e mais de três mil peças arqueológicas.'),
        jsonb_build_object('stop_order', 2, 'attraction_id', (select id from att where slug = 'igreja-matriz'), 'custom_title', 'Igreja Matriz de Nossa Senhora do Carmo', 'duration_minutes', 45, 'notes', 'Visita combinada com caminhada pela área central.'),
        jsonb_build_object('stop_order', 3, 'custom_title', 'Doces e tear manual', 'duration_minutes', 90, 'notes', 'Carmo é citada no circuito turístico pela tradição em doces e trabalhos em tear manual.')
      )
    )
) as r(slug, title, description, duration_hours, distance_km, includes, difficulty, featured, itinerary)
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
