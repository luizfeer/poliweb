-- Revisão curada das atrações de Carmo do Rio Claro.
-- Mantém no público apenas atrações reais e ricas; sementes antigas ficam arquivadas.

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.attractions a
set status = 'archived'::public.entity_status,
    featured = false,
    updated_at = now()
from carmo
where a.city_id = carmo.id
  and a.slug in (
    'mirante-do-cristo',
    'cachoeira-do-lobo',
    'cachoeira-pedra-molhada',
    'cachoeira-do-silvestre',
    'cachoeiras-de-furnas-por-barco',
    'igreja-matriz'
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
  lat,
  lng,
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
  a.lat,
  a.lng,
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
      'O maior cartão-postal de Carmo do Rio Claro. A serra chega a 1.287 metros de altitude e abre uma vista 360 graus para o Mar de Minas, para a área urbana e para cidades vizinhas. No topo fica a Capela Nossa Senhora Aparecida, ponto de fé e contemplação.',
      'Zona rural de Carmo do Rio Claro',
      null::double precision,
      null::double precision,
      'Visita recomendada com luz do dia. Amanhecer e fim de tarde são os melhores horários.',
      'Acesso gratuito. Passeios guiados de Jeep 4x4 costumam variar de R$ 100 a R$ 150 por pessoa, conforme agência e roteiro.',
      'moderado a difícil',
      240,
      'Período seco, amanhecer e dias de céu aberto',
      '["vista_360","trilha","voo_livre","jeep_4x4","moto","capela","fotografia","experiencia_cafe_no_topo"]',
      '{"status":"a_confirmar","notes":"Acesso e segurança dependem do clima, da estrada e do tipo de atividade."}',
      'Para uma experiência memorável, suba ao amanhecer e leve kit de café coado: chaleira bico de ganso, moedor, filtro e água. Para voo livre, use operador habilitado.',
      'gratuito_ou_guia_100_150',
      false,
      false,
      true
    ),
    (
      'lago-de-furnas',
      'Ponte Torta e Lago de Furnas',
      'lago',
      'A represa de Furnas banha grande parte do município e faz de Carmo um polo náutico do Mar de Minas. A Ponte Torta, também conhecida como Ponte do Poção, cruza o Lago de Furnas na BR-265 e é parada clássica para fotos de paisagem.',
      'BR-265, entre o distrito do Itaci e Carmo do Rio Claro',
      null::double precision,
      null::double precision,
      'Acesso livre para contemplação. Passeios náuticos dependem de operadores e clima.',
      'Acesso livre à ponte e às margens. Passeios de lancha na região costumam variar de R$ 80 a R$ 150 por pessoa.',
      'fácil',
      180,
      'Ano todo, com preferência por tempo firme e fim de tarde',
      '["ponte_torta","lago_de_furnas","passeio_de_lancha","caiaque","pesca_esportiva","fotografia","por_do_sol"]',
      '{"status":"a_confirmar","notes":"Verifique condições da ponte, trânsito e segurança antes da visita."}',
      'Pare para fotos com segurança, sem permanecer na pista. Em passeios de lancha, confirme rota, coletes, lotação e duração antes de sair.',
      'gratuito_ou_lancha_80_150',
      false,
      true,
      true
    ),
    (
      'parque-ecologico-do-paredao',
      'Parque Ecológico do Paredão',
      'parque',
      'Área de ecoturismo com muito verde, paredões rochosos, quedas d’água e poços naturais para banho. É uma opção para passar o dia com mais estrutura e clima de parque de natureza.',
      'Região do Lago de Furnas, próximo ao circuito Carmo do Rio Claro/Guapé',
      null::double precision,
      null::double precision,
      'Funcionamento e acesso devem ser confirmados antes da visita.',
      'Taxa de preservação geralmente simbólica, em torno de R$ 10, podendo variar em feriados.',
      'fácil a moderado',
      240,
      'Período seco e dias quentes',
      '["cachoeiras","poços_naturais","paredoes","restaurante_rustico","banho","natureza"]',
      '{"status":"a_confirmar","notes":"Confirme acesso, taxa, funcionamento e condições de chuva."}',
      'Vá com calçado que possa molhar, dinheiro para taxa/consumo e atenção a cabeças d’água em dias de chuva.',
      'taxa_media_10',
      false,
      true,
      true
    ),
    (
      'cachoeira-da-agua-limpa',
      'Cachoeira da Água Limpa',
      'cachoeira',
      'Cachoeira de águas cristalinas, com poços rasos para se refrescar e áreas mais fundas para nadar. É um dos nomes citados entre os pontos turísticos mais visitados de Carmo do Rio Claro.',
      'Zona rural de Carmo do Rio Claro',
      null::double precision,
      null::double precision,
      'Acesso e funcionamento conforme propriedade/operador local.',
      'Taxa de manutenção geralmente entre R$ 10 e R$ 15.',
      'fácil a moderado',
      180,
      'Período seco, manhã e dias de calor',
      '["agua_cristalina","pocos_naturais","banho","fotografia","natureza"]',
      '{"status":"a_confirmar","notes":"Confirme acesso e regras locais antes da visita."}',
      'Leve calçado antiderrapante, água e saco para trazer seu lixo de volta. Evite entrar em poços após chuva forte.',
      'taxa_10_15',
      false,
      true,
      true
    ),
    (
      'cachoeira-jacutinga',
      'Cachoeira Jacutinga',
      'cachoeira',
      'Cachoeira de acesso mais aventureiro, próxima ao circuito do Paredão, com caminhada entre árvores e poço grande para banho. É indicada para quem busca uma experiência de natureza mais rústica.',
      'Região da Jacutinga, zona rural de Carmo do Rio Claro',
      null::double precision,
      null::double precision,
      'Acesso e funcionamento conforme propriedade/operador local.',
      'Consultar taxa local.',
      'moderado',
      180,
      'Período seco',
      '["trilha","poço_grande","banho","bar_restaurante","banheiros","chuveiro","natureza"]',
      '{"status":"a_confirmar","notes":"Acesso pode exigir orientação local e muda conforme chuva."}',
      'Como o acesso é mais aventureiro, vá com orientação local, calçado fechado e evite dias de chuva forte.',
      'consultar',
      false,
      false,
      false
    ),
    (
      'muari-museu-arqueologia-indigena',
      'MUARI - Museu de Arqueologia Indígena Antônio Adauto Leite',
      'museu',
      'Museu municipal no centro de Carmo do Rio Claro, ao lado da Igreja Matriz. O acervo reúne mais de três mil peças arqueológicas indígenas e é tratado pela Prefeitura como o maior acervo indígena da América Latina. A coleção tem origem no trabalho de Antônio Adauto Leite, iniciado em 1969, e guarda a memória dos povos indígenas ligados à região do Itaci.',
      'Praça Maria Goulart, 29 - Centro, Carmo do Rio Claro',
      -20.9733112,
      -46.1184521,
      'Funcionamento temporário informado pela Prefeitura: segunda a sexta, 9h às 17h, com intervalo das 12h às 14h. Cadastros museais também registram atendimento em dias úteis e sábado; confirme antes de ir.',
      'Entrada franca. Contribuição voluntária pode ser aceita conforme orientação local.',
      'fácil',
      90,
      'Ano todo',
      '["arqueologia_indigena","mais_de_3000_pecas","visita_guiada","visita_autoguiada","educativo","centro_historico","ao_lado_da_matriz","sanitario"]',
      '{"status":"limitada","notes":"Cadastro MuseusBr informa que não possui infraestrutura específica para dificuldade de locomoção, deficiência auditiva/visual ou atendimento a turista estrangeiro."}',
      'Combine a visita com a Igreja Matriz e a Praça Maria Goulart. É uma parada essencial para entender a história indígena e arqueológica da região.',
      'gratuito',
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
  lat,
  lng,
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
    lat = excluded.lat,
    lng = excluded.lng,
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
    'parque-ecologico-do-paredao',
    'cachoeira-da-agua-limpa',
    'cachoeira-jacutinga',
    'muari-museu-arqueologia-indigena'
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
select attractions.id, s.kind, s.label, s.details, s.price, null
from attractions
join (
  values
    ('serra-da-tormenta', 'experiencia', 'Café no topo ao amanhecer', 'Suba cedo e prepare café coado fresco olhando o Mar de Minas.', null::numeric),
    ('serra-da-tormenta', 'aventura', 'Voo livre e 4x4', 'Paraglider e subida guiada dependem de operador habilitado e clima.', 100::numeric),
    ('lago-de-furnas', 'nautico', 'Passeios de lancha', 'Roteiros pelo Lago de Furnas e região da Ponte Torta.', 80::numeric),
    ('lago-de-furnas', 'pesca', 'Pesca esportiva', 'Atividade em pontos autorizados, com atenção às regras ambientais.', null::numeric),
    ('parque-ecologico-do-paredao', 'natureza', 'Poços naturais e quedas d’água', 'Estrutura para passar o dia em área verde com paredões.', 10::numeric),
    ('cachoeira-da-agua-limpa', 'natureza', 'Águas cristalinas', 'Poços rasos e áreas mais fundas para banho.', 10::numeric),
    ('cachoeira-jacutinga', 'apoio', 'Banheiros, chuveiro e bar/restaurante', 'Estrutura informada localmente; confirme funcionamento antes da visita.', null::numeric),
    ('muari-museu-arqueologia-indigena', 'cultural', 'Visita guiada ou autoguiada', 'Acervo arqueológico indígena com mais de três mil peças.', 0::numeric),
    ('muari-museu-arqueologia-indigena', 'educativo', 'Atividades para estudantes', 'Recepção de alunos, oficinas, visitação e contemplação.', 0::numeric)
) as s(slug, kind, label, details, price) on s.slug = attractions.slug;
