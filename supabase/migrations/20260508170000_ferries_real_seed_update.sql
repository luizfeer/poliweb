-- Atualizacao das balsas com dados confirmados para Carmo/Itaci/regiao.
-- Mantem o modelo atual, mas adiciona campos editaveis para fonte, dias e cidades relacionadas.

alter table public.ferry_routes
  add column if not exists related_cities text[] not null default '{}',
  add column if not exists operating_days text[] not null default '{}',
  add column if not exists source jsonb not null default '{}'::jsonb;

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_routes r
set active = false,
    updated_at = now()
from crc
where r.city_id = crc.id
  and r.slug in (
    'balsa-itaci-carmo-do-rio-claro',
    'balsa-aguas-verdes-carmo-campo-do-meio'
  );

with crc as (select id from public.cities where slug = 'carmo-do-rio-claro')
insert into public.ferry_routes (
  city_id, slug, name, short_name, region, district,
  status, confidence, description, important_info,
  fare_summary, fare_warning, fare,
  display, seo, keywords,
  endpoint_a_label, endpoint_b_label,
  related_cities, operating_days, source,
  featured, display_order, active
)
select crc.id, v.slug, v.name, v.short_name, v.region, v.district,
       v.status, v.confidence, v.description, v.important_info::jsonb,
       v.fare_summary, v.fare_warning, v.fare::jsonb,
       v.display::jsonb, v.seo::jsonb, v.keywords,
       v.endpoint_a_label, v.endpoint_b_label,
       v.related_cities, v.operating_days, v.source::jsonb,
       v.featured, v.display_order, true
from crc, (values
  (
    'balsa-aguas-verdes-itaci-carmo',
    'Balsa Águas Verdes',
    'Balsa Águas Verdes',
    'Lago de Furnas',
    'Itaci',
    'active_check_before_go',
    'medium',
    'Travessia pelo Lago de Furnas, ligando a região de Itaci/Carmo do Rio Claro. Serviço utilizado por moradores, visitantes, veículos, motocicletas, caminhões e transporte rural.',
    $$[
      "Os valores de referência foram extraídos da Lei Municipal nº 2.126, de 16 de agosto de 2010.",
      "Usuários com veículos emplacados em Carmo do Rio Claro/MG podem ter isenção, desde que possuam selo identificador colado no para-brisa dianteiro.",
      "Confirme os valores atualizados antes da viagem, pois tarifas municipais podem sofrer alterações."
    ]$$,
    'Tabela municipal de referência: automóvel/utilitário R$ 10,00; motocicleta R$ 2,50; caminhões entre R$ 15,00 e R$ 25,00 conforme eixos.',
    'Valores baseados na Lei Municipal nº 2.126/2010. Recomenda-se confirmar se houve atualização das tarifas.',
    $${
      "currency": "BRL",
      "isFreeForResidents": true,
      "freeFor": ["Veículos emplacados em Carmo do Rio Claro/MG com selo identificador"],
      "referenceTitle": "Preços das balsas em Carmo do Rio Claro, Itaci e região de Guapé",
      "referenceDescription": "Tabela de referência das tarifas municipais para travessias de balsa no Lago de Furnas, incluindo Itaci, Águas Verdes e Itapiché.",
      "residentExemption": "Veículos com placa de Carmo do Rio Claro/MG podem ser isentos mediante selo identificador no para-brisa dianteiro.",
      "prices": [
        { "category": "Automóvel / utilitário", "price": 10, "label": "R$ 10,00", "description": "Carros de passeio e veículos utilitários." },
        { "category": "Automóvel com reboque", "price": 15, "label": "R$ 15,00", "description": "Carro ou utilitário com reboque." },
        { "category": "Bicicleta", "price": 0, "label": "Sem cobrança informada", "description": "Na tabela da lei aparece sem cobrança informada." },
        { "category": "Caminhão toco", "price": 15, "label": "R$ 15,00", "description": "Caminhão de pequeno porte / toco." },
        { "category": "Caminhão com três eixos", "price": 20, "label": "R$ 20,00", "description": "Caminhão com três eixos." },
        { "category": "Caminhão com quatro ou mais eixos", "price": 25, "label": "R$ 25,00", "description": "Caminhão maior, com quatro ou mais eixos." },
        { "category": "Carroça e charrete", "price": 0, "label": "Sem cobrança informada", "description": "Na tabela da lei aparece sem cobrança informada." },
        { "category": "Gado a pé", "price": 5, "label": "R$ 5,00 por cabeça", "description": "Valor por cabeça." },
        { "category": "Motocicleta", "price": 2.5, "label": "R$ 2,50", "description": "Motos em geral." },
        { "category": "Ônibus", "price": 15, "label": "R$ 15,00", "description": "Ônibus." },
        { "category": "Trator normal com pneus", "price": 0, "label": "Sem cobrança informada", "description": "Na tabela da lei aparece sem cobrança informada." },
        { "category": "Trator esteira / patrol", "price": 15, "label": "R$ 15,00", "description": "Máquinas pesadas como trator de esteira e patrol." }
      ]
    }$$,
    $${
      "cardTitle": "Balsa Águas Verdes",
      "cardSubtitle": "Porto Itaci / Carmo do Rio Claro",
      "priceLabel": "Carro R$ 10 · moto R$ 2,50 · caminhões até R$ 25",
      "scheduleLabel": "Horários a confirmar",
      "ctaLabel": "Ver tarifas"
    }$$,
    $${
      "title": "Balsa Águas Verdes em Carmo do Rio Claro",
      "description": "Veja tarifas de referência, isenção para veículos de Carmo do Rio Claro e avisos da Balsa Águas Verdes no Lago de Furnas."
    }$$,
    array['balsa Águas Verdes','balsa Aguas Verdes','Porto Itaci','Carmo do Rio Claro','Itaci','Guapé','Lago de Furnas','tarifa balsa'],
    'Porto Itaci / Carmo do Rio Claro',
    'Lago de Furnas',
    array['Carmo do Rio Claro','Itaci','Guapé'],
    array[]::text[],
    '{"tipo":"lei_municipal","titulo":"Lei nº 2.126 de 16 de agosto de 2010","municipio":"Carmo do Rio Claro/MG"}',
    true,
    10
  ),
  (
    'balsa-itapiche-carmo-ponte',
    'Balsa Itapiché',
    'Balsa Itapiché',
    'Lago de Furnas',
    'Itapiché',
    'active_check_before_go',
    'high',
    'Travessia da Balsa Itapiché, ligando Carmo do Rio Claro à região da Ponte do Itapiché. Funciona de segunda a sábado, conforme horário divulgado pela Prefeitura.',
    $$[
      "Horários informados em imagem oficial/divulgada pela Prefeitura de Carmo do Rio Claro.",
      "Confirmar funcionamento em feriados, domingos e períodos de manutenção.",
      "Tarifas de referência seguem a tabela municipal das balsas do Lago de Furnas, conforme Lei nº 2.126/2010."
    ]$$,
    'Mesma tabela municipal de tarifas das balsas do Lago de Furnas, conforme Lei nº 2.126/2010.',
    'Confirme funcionamento em feriados, domingos e períodos de manutenção.',
    $${
      "currency": "BRL",
      "inheritsReference": "tarifas-balsas-carmo-rio-claro",
      "referenceSummary": "Mesma tabela municipal de tarifas das balsas do Lago de Furnas, conforme Lei nº 2.126/2010."
    }$$,
    $${
      "cardTitle": "Balsa Itapiché",
      "cardSubtitle": "Carmo / Ponte do Itapiché",
      "priceLabel": "Tabela municipal de referência",
      "scheduleLabel": "Segunda a sábado",
      "ctaLabel": "Ver horários"
    }$$,
    $${
      "title": "Horários da Balsa Itapiché em Carmo do Rio Claro",
      "description": "Veja os horários da Balsa Itapiché entre Carmo e Ponte do Itapiché, de segunda a sábado, e avisos antes da travessia."
    }$$,
    array['balsa Itapiché','balsa Itapiche','Carmo Ponte Itapiché','Ponte do Itapiché','Guapé','Lago de Furnas'],
    'Carmo',
    'Ponte do Itapiché',
    array['Carmo do Rio Claro','Ponte do Itapiché','Guapé'],
    array['segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'],
    '{"tipo":"imagem_divulgacao","titulo":"Horário de Travessia Balsa Itapiché"}',
    true,
    20
  ),
  (
    'balsa-sao-francisco-ii-campo-do-meio-itaci',
    'Balsa São Francisco II',
    'Balsa São Francisco II',
    'Lago de Furnas',
    'Itaci',
    'active_check_before_go',
    'medium',
    'Travessia da Balsa São Francisco II entre Campo do Meio e Itaci, utilizada para deslocamento local, turismo e acesso à região do Lago de Furnas.',
    $$[
      "A imagem enviada corta a parte inferior do quadro; pode haver mais um horário após 17:30 no sentido Itaci / Campo do Meio. Confirmar antes de publicar como informação definitiva.",
      "Horários podem mudar por manutenção, nível do lago ou decisão operacional."
    ]$$,
    null,
    'Confirme os horários antes de sair; a fonte visual enviada pode estar cortada na parte inferior.',
    '{}'::jsonb::text,
    $${
      "cardTitle": "Balsa São Francisco II",
      "cardSubtitle": "Campo do Meio / Itaci",
      "priceLabel": "Tarifas a confirmar",
      "scheduleLabel": "Horários de referência",
      "ctaLabel": "Ver horários"
    }$$,
    $${
      "title": "Horários da Balsa São Francisco II entre Campo do Meio e Itaci",
      "description": "Veja horários de referência da Balsa São Francisco II, entre Campo do Meio e Itaci, e avisos antes da travessia."
    }$$,
    array['Balsa São Francisco II','Campo do Meio','Itaci','Carmo do Rio Claro','Guapé','Lago de Furnas'],
    'Campo do Meio',
    'Itaci',
    array['Campo do Meio','Itaci','Carmo do Rio Claro','Guapé'],
    array[]::text[],
    '{"tipo":"placa_local","titulo":"Horário da Balsa São Francisco II - Campo do Meio / Itaci"}',
    true,
    30
  )
) as v(slug, name, short_name, region, district, status, confidence, description, important_info,
       fare_summary, fare_warning, fare, display, seo, keywords,
       endpoint_a_label, endpoint_b_label, related_cities, operating_days, source,
       featured, display_order)
on conflict (city_id, slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  region = excluded.region,
  district = excluded.district,
  status = excluded.status,
  confidence = excluded.confidence,
  description = excluded.description,
  important_info = excluded.important_info,
  fare_summary = excluded.fare_summary,
  fare_warning = excluded.fare_warning,
  fare = excluded.fare,
  display = excluded.display,
  seo = excluded.seo,
  keywords = excluded.keywords,
  endpoint_a_label = excluded.endpoint_a_label,
  endpoint_b_label = excluded.endpoint_b_label,
  related_cities = excluded.related_cities,
  operating_days = excluded.operating_days,
  source = excluded.source,
  featured = excluded.featured,
  display_order = excluded.display_order,
  active = true,
  updated_at = now();

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
), target_routes as (
  select r.id
  from public.ferry_routes r
  join crc on crc.id = r.city_id
  where r.slug in (
    'balsa-aguas-verdes-itaci-carmo',
    'balsa-itapiche-carmo-ponte',
    'balsa-sao-francisco-ii-campo-do-meio-itaci'
  )
)
delete from public.ferry_schedule_items s
using target_routes tr
where s.route_id = tr.id;

with route as (
  select r.id, r.city_id
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro' and r.slug = 'balsa-itapiche-carmo-ponte'
)
insert into public.ferry_schedule_items (route_id, city_id, direction, origin, destination, departs_at, notes, display_order)
select route.id, route.city_id, t.direction, t.origin, t.destination, t.departs_at::time,
  'Horários divulgados pela Prefeitura de Carmo do Rio Claro.', t.ord
from route, (values
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','06:00',1),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','06:30',2),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','07:30',3),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','09:30',4),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','12:30',5),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','15:00',6),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','16:00',7),
  ('Carmo / Ponte','Carmo','Ponte do Itapiché','17:00',8),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','06:15',1),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','07:00',2),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','08:30',3)
) as t(direction, origin, destination, departs_at, ord);

with route as (
  select r.id, r.city_id
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro' and r.slug = 'balsa-itapiche-carmo-ponte'
)
insert into public.ferry_schedule_items (route_id, city_id, direction, origin, destination, departs_at, notes, display_order)
select route.id, route.city_id, t.direction, t.origin, t.destination, t.departs_at::time,
  'Horários divulgados pela Prefeitura de Carmo do Rio Claro.', t.ord
from route, (values
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','10:00',4),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','13:30',5),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','15:30',6),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','16:30',7),
  ('Ponte / Carmo','Ponte do Itapiché','Carmo','17:30',8)
) as t(direction, origin, destination, departs_at, ord);

with route as (
  select r.id, r.city_id
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro' and r.slug = 'balsa-sao-francisco-ii-campo-do-meio-itaci'
)
insert into public.ferry_schedule_items (route_id, city_id, direction, origin, destination, departs_at, notes, display_order)
select route.id, route.city_id, t.direction, t.origin, t.destination, t.departs_at::time,
  'Horários de placa local; confirmar antes de publicar como informação definitiva.', t.ord
from route, (values
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','06:30',1),
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','07:30',2),
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','09:30',3),
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','11:30',4),
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','13:00',5),
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','15:00',6),
  ('Campo do Meio / Itaci','Campo do Meio','Itaci','17:00',7),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','07:00',1),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','08:00',2),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','10:00',3),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','12:00',4),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','14:00',5),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','16:00',6),
  ('Itaci / Campo do Meio','Itaci','Campo do Meio','17:30',7)
) as t(direction, origin, destination, departs_at, ord);

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
), target_routes as (
  select r.id
  from public.ferry_routes r
  join crc on crc.id = r.city_id
  where r.slug in (
    'balsa-aguas-verdes-itaci-carmo',
    'balsa-itapiche-carmo-ponte',
    'balsa-sao-francisco-ii-campo-do-meio-itaci'
  )
)
delete from public.ferry_alerts a
using target_routes tr
where a.route_id = tr.id;

with route as (
  select r.id, r.city_id, r.slug
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro'
)
insert into public.ferry_alerts (city_id, route_id, type, title, message, display_order)
select route.city_id, route.id, a.type, a.title, a.message, a.ord
from route
join (values
  ('balsa-aguas-verdes-itaci-carmo','warning','Confirme valores atualizados','Valores baseados na Lei Municipal nº 2.126/2010. Tarifas municipais podem sofrer alterações.',1),
  ('balsa-aguas-verdes-itaci-carmo','info','Isenção para veículos de Carmo','Veículos emplacados em Carmo do Rio Claro/MG podem ter isenção mediante selo identificador no para-brisa dianteiro.',2),
  ('balsa-itapiche-carmo-ponte','warning','Confirme feriados e manutenção','A Balsa Itapiché funciona de segunda a sábado conforme divulgação da Prefeitura, mas feriados, domingos e manutenção precisam ser confirmados.',1),
  ('balsa-sao-francisco-ii-campo-do-meio-itaci','warning','Fonte visual parcialmente cortada','A imagem enviada corta a parte inferior do quadro; pode haver mais um horário após 17:30 no sentido Itaci / Campo do Meio.',1),
  ('balsa-sao-francisco-ii-campo-do-meio-itaci','maintenance','Horários sujeitos a operação','Horários podem mudar por manutenção, nível do lago ou decisão operacional.',2)
) as a(slug, type, title, message, ord) on a.slug = route.slug;
