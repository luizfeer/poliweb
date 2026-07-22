-- Ajustes de apresentacao, tarifas e horarios das balsas apos revisao editorial.

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
), fare_ref as (
  select $${
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
      { "category": "Trator", "price": 15, "label": "R$ 15,00", "description": "Tratores e máquinas similares." }
    ]
  }$$::jsonb as fare
)
update public.ferry_routes r
set fare = fare_ref.fare,
    fare_summary = 'Tabela municipal de referência: automóvel/utilitário R$ 10,00; motocicleta R$ 2,50; caminhões entre R$ 15,00 e R$ 25,00 conforme eixos; trator R$ 15,00.',
    fare_warning = 'Valores baseados na Lei Municipal nº 2.126/2010. Recomenda-se confirmar se houve atualização das tarifas.',
    display = case r.slug
      when 'balsa-aguas-verdes-itaci-carmo' then jsonb_build_object(
        'cardTitle', 'Carmo → Itaci',
        'cardSubtitle', 'Balsa Águas Verdes',
        'priceLabel', 'Carro R$ 10 · moto R$ 2,50 · trator R$ 15',
        'scheduleLabel', 'Horários de referência',
        'ctaLabel', 'Ver horários'
      )
      else jsonb_build_object(
        'cardTitle', 'Carmo → Ponte do Itapiché',
        'cardSubtitle', 'Balsa Itapiché',
        'priceLabel', 'Carro R$ 10 · moto R$ 2,50 · trator R$ 15',
        'scheduleLabel', 'Segunda a sábado',
        'ctaLabel', 'Ver horários'
      )
    end,
    endpoint_a_label = case r.slug
      when 'balsa-aguas-verdes-itaci-carmo' then 'Carmo'
      else 'Carmo'
    end,
    endpoint_b_label = case r.slug
      when 'balsa-aguas-verdes-itaci-carmo' then 'Itaci'
      else 'Ponte do Itapiché'
    end,
    status = 'active_check_before_go',
    confidence = case r.slug
      when 'balsa-itapiche-carmo-ponte' then 'high'
      else 'medium'
    end,
    updated_at = now()
from crc, fare_ref
where r.city_id = crc.id
  and r.slug in ('balsa-aguas-verdes-itaci-carmo', 'balsa-itapiche-carmo-ponte');

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_routes r
set important_info = $$[
      "Horários podem mudar por manutenção, nível do lago ou decisão operacional."
    ]$$::jsonb,
    fare_warning = 'Confirme os horários antes de sair; a operação pode mudar por manutenção, nível do lago ou decisão operacional.',
    display = jsonb_build_object(
      'cardTitle', 'Campo do Meio → Itaci',
      'cardSubtitle', 'Balsa São Francisco II',
      'priceLabel', 'Tarifas a confirmar',
      'scheduleLabel', 'Horários de referência',
      'ctaLabel', 'Ver horários'
    ),
    updated_at = now()
from crc
where r.city_id = crc.id
  and r.slug = 'balsa-sao-francisco-ii-campo-do-meio-itaci';

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
), target_routes as (
  select r.id
  from public.ferry_routes r
  join crc on crc.id = r.city_id
  where r.slug in ('balsa-aguas-verdes-itaci-carmo', 'balsa-itapiche-carmo-ponte')
)
delete from public.ferry_schedule_items s
using target_routes tr
where s.route_id = tr.id;

with route as (
  select r.id, r.city_id
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro' and r.slug = 'balsa-aguas-verdes-itaci-carmo'
)
insert into public.ferry_schedule_items (route_id, city_id, direction, origin, destination, departs_at, notes, display_order)
select route.id, route.city_id, t.direction, t.origin, t.destination, t.departs_at::time,
  case when t.departs_at in ('14:00','14:30') then 'Horário incluído em abril de 2025.' else null end,
  t.ord
from route, (values
  ('Itaci → Carmo','Itaci','Carmo','06:00',1),
  ('Itaci → Carmo','Itaci','Carmo','07:00',2),
  ('Itaci → Carmo','Itaci','Carmo','08:30',3),
  ('Itaci → Carmo','Itaci','Carmo','10:00',4),
  ('Itaci → Carmo','Itaci','Carmo','12:30',5),
  ('Itaci → Carmo','Itaci','Carmo','14:00',6),
  ('Itaci → Carmo','Itaci','Carmo','16:30',7),
  ('Itaci → Carmo','Itaci','Carmo','17:30',8),
  ('Itaci → Carmo','Itaci','Carmo','19:30',9),
  ('Itaci → Carmo','Itaci','Carmo','21:15',10),
  ('Carmo → Itaci','Carmo','Itaci','06:30',1),
  ('Carmo → Itaci','Carmo','Itaci','07:30',2),
  ('Carmo → Itaci','Carmo','Itaci','09:00',3),
  ('Carmo → Itaci','Carmo','Itaci','11:00',4),
  ('Carmo → Itaci','Carmo','Itaci','13:00',5),
  ('Carmo → Itaci','Carmo','Itaci','14:30',6),
  ('Carmo → Itaci','Carmo','Itaci','15:30',7),
  ('Carmo → Itaci','Carmo','Itaci','17:00',8),
  ('Carmo → Itaci','Carmo','Itaci','18:00',9),
  ('Carmo → Itaci','Carmo','Itaci','20:00',10),
  ('Carmo → Itaci','Carmo','Itaci','21:30',11)
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
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','06:00',1),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','06:30',2),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','07:30',3),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','09:30',4),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','12:30',5),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','15:00',6),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','16:00',7),
  ('Carmo → Ponte','Carmo','Ponte do Itapiché','17:00',8),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','06:15',1),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','07:00',2),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','08:30',3),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','10:00',4),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','13:30',5),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','15:30',6),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','16:30',7),
  ('Ponte → Carmo','Ponte do Itapiché','Carmo','17:30',8)
) as t(direction, origin, destination, departs_at, ord);

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.ferry_alerts a
using public.ferry_routes r, crc
where a.route_id = r.id
  and r.city_id = crc.id
  and r.slug = 'balsa-sao-francisco-ii-campo-do-meio-itaci'
  and (
    a.message ilike '%imagem enviada corta%'
    or a.title ilike '%Fonte visual parcialmente cortada%'
  );
