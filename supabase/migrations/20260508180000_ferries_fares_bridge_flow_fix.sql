-- Correcoes de tarifas, nomes de rota e avisos operacionais das balsas.

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_routes r
set important_info = $$[
      "Os valores de referência foram extraídos da Lei Municipal nº 2.126, de 16 de agosto de 2010.",
      "Confirme os valores atualizados antes da viagem, pois tarifas municipais podem sofrer alterações.",
      "O fluxo de veículos aumentou no Porto de Itaci desde que a Ponte Torta passou a limitar veículos a até 3,5 toneladas, principalmente no meio da semana."
    ]$$::jsonb,
    fare = (r.fare - 'residentExemption') || jsonb_build_object(
      'freeFor',
      jsonb_build_array('Veículos emplacados em Carmo do Rio Claro/MG, conforme regra municipal vigente')
    ),
    display = jsonb_build_object(
      'cardTitle', 'Carmo → Itaci',
      'cardSubtitle', 'Balsa Águas Verdes',
      'priceLabel', 'Carro R$ 10 · moto R$ 2,50 · trator R$ 15',
      'scheduleLabel', 'Horários de referência',
      'ctaLabel', 'Ver horários'
    ),
    updated_at = now()
from crc
where r.city_id = crc.id
  and r.slug = 'balsa-aguas-verdes-itaci-carmo';

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_routes r
set endpoint_b_label = 'Ponte Torta',
    related_cities = array['Carmo do Rio Claro','Ponte Torta','Guapé'],
    keywords = array['balsa Itapiché','balsa Itapiche','Carmo Ponte Torta','Ponte Torta','Guapé','Lago de Furnas'],
    description = 'Travessia da Balsa Itapiché, ligando Carmo do Rio Claro à região da Ponte Torta. Funciona de segunda a sábado, conforme horário divulgado pela Prefeitura.',
    important_info = $$[
      "Horários informados em imagem oficial/divulgada pela Prefeitura de Carmo do Rio Claro.",
      "Confirmar funcionamento em feriados, domingos e períodos de manutenção.",
      "Tarifas de referência seguem a mesma tabela municipal das balsas do Lago de Furnas usada na Águas Verdes, conforme Lei nº 2.126/2010.",
      "A Ponte Torta está limitada a veículos de até 3,5 toneladas; veículos maiores tendem a usar a travessia pelo Porto de Itaci."
    ]$$::jsonb,
    fare = (r.fare - 'residentExemption') || jsonb_build_object(
      'freeFor',
      jsonb_build_array('Veículos emplacados em Carmo do Rio Claro/MG, conforme regra municipal vigente')
    ),
    display = jsonb_build_object(
      'cardTitle', 'Carmo → Ponte Torta',
      'cardSubtitle', 'Balsa Itapiché',
      'priceLabel', 'Carro R$ 10 · moto R$ 2,50 · trator R$ 15',
      'scheduleLabel', 'Segunda a sábado',
      'ctaLabel', 'Ver horários'
    ),
    seo = jsonb_build_object(
      'title', 'Horários da Balsa Itapiché para Ponte Torta',
      'description', 'Veja os horários da Balsa Itapiché entre Carmo e Ponte Torta, de segunda a sábado, além de valores e avisos antes da travessia.'
    ),
    updated_at = now()
from crc
where r.city_id = crc.id
  and r.slug = 'balsa-itapiche-carmo-ponte';

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_schedule_items s
set direction = replace(direction, 'Ponte', 'Ponte Torta'),
    destination = case when destination in ('Ponte do Itapiché', 'Ponte') then 'Ponte Torta' else destination end,
    origin = case when origin in ('Ponte do Itapiché', 'Ponte') then 'Ponte Torta' else origin end,
    updated_at = now()
from public.ferry_routes r, crc
where s.route_id = r.id
  and r.city_id = crc.id
  and r.slug = 'balsa-itapiche-carmo-ponte';

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_alerts a
set message = replace(message, 'Ponte do Itapiché', 'Ponte Torta'),
    updated_at = now()
from public.ferry_routes r, crc
where a.route_id = r.id
  and r.city_id = crc.id
  and r.slug = 'balsa-itapiche-carmo-ponte';

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.ferry_alerts (city_id, route_id, type, title, message, display_order)
select r.city_id,
       r.id,
       'warning',
       'Fluxo maior no Porto de Itaci',
       'Com a Ponte Torta limitada a veículos de até 3,5 toneladas, o fluxo de carros aumentou na travessia do Porto de Itaci, principalmente no meio da semana.',
       3
from public.ferry_routes r
join crc on crc.id = r.city_id
where r.slug = 'balsa-aguas-verdes-itaci-carmo'
  and not exists (
    select 1
    from public.ferry_alerts a
    where a.route_id = r.id
      and a.title = 'Fluxo maior no Porto de Itaci'
  );

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_routes r
set fare_summary = 'Tabela de referência da Balsa São Francisco II: automóveis R$ 10,00; motos R$ 5,00; ônibus R$ 20,00; caminhões entre R$ 15,00 e R$ 50,00 conforme eixos.',
    fare_warning = 'Valores informados em placa local. Confirme antes de sair, pois tarifas podem mudar por decisão operacional.',
    fare = $${
      "currency": "BRL",
      "prices": [
        { "category": "Automóveis e utilitários", "price": 10, "label": "R$ 10,00" },
        { "category": "Utilitários com reboque", "price": 15, "label": "R$ 15,00" },
        { "category": "Bicicletas", "price": 3, "label": "R$ 3,00" },
        { "category": "Moto", "price": 5, "label": "R$ 5,00" },
        { "category": "Cavalo", "price": 5, "label": "R$ 5,00" },
        { "category": "Caminhão toco", "price": 15, "label": "R$ 15,00" },
        { "category": "Caminhão com 03 eixos", "price": 25, "label": "R$ 25,00" },
        { "category": "Caminhão com 04 eixos ou mais", "price": 50, "label": "R$ 50,00", "description": "Na placa, parte do texto está encoberta, mas indica caminhão de 4 eixos." },
        { "category": "Carroça ou charrete", "price": 10, "label": "R$ 10,00" },
        { "category": "Ônibus", "price": 20, "label": "R$ 20,00" },
        { "category": "Patrol", "price": 25, "label": "R$ 25,00" },
        { "category": "Colhedeira", "price": 25, "label": "R$ 25,00" },
        { "category": "Trator", "price": 15, "label": "R$ 15,00" }
      ]
    }$$::jsonb,
    display = jsonb_build_object(
      'cardTitle', 'Campo do Meio → Itaci',
      'cardSubtitle', 'Balsa São Francisco II',
      'priceLabel', 'Carro R$ 10 · moto R$ 5 · ônibus R$ 20',
      'scheduleLabel', 'Horários de referência',
      'ctaLabel', 'Ver horários'
    ),
    updated_at = now()
from crc
where r.city_id = crc.id
  and r.slug = 'balsa-sao-francisco-ii-campo-do-meio-itaci';

update public.ferry_routes
set important_info = (
  select coalesce(jsonb_agg(item), '[]'::jsonb)
  from jsonb_array_elements_text(important_info) as t(item)
  where item not ilike '%selo%'
)
where important_info::text ilike '%selo%';

update public.ferry_alerts
set message = replace(message, ' mediante selo identificador no para-brisa dianteiro', ''),
    updated_at = now()
where message ilike '%selo identificador%';
