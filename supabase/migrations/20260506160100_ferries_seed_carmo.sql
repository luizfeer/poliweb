-- Seed inicial das balsas de Carmo do Rio Claro.
-- Idempotente via on conflict (city_id, slug).

with crc as (select id from public.cities where slug = 'carmo-do-rio-claro')
insert into public.ferry_routes (
  city_id, slug, name, short_name, region, district,
  status, confidence, description, important_info,
  fare_summary, fare_warning, fare,
  display, seo, keywords,
  endpoint_a_label, endpoint_b_label,
  featured, display_order
)
select crc.id, v.slug, v.name, v.short_name, v.region, v.district,
       v.status, v.confidence, v.description, v.important_info::jsonb,
       v.fare_summary, v.fare_warning, v.fare::jsonb,
       v.display::jsonb, v.seo::jsonb, v.keywords,
       v.endpoint_a_label, v.endpoint_b_label,
       v.featured, v.display_order
from crc, (values
  (
    'balsa-itaci-carmo-do-rio-claro',
    'Balsa Itaci ⇄ Carmo do Rio Claro',
    'Balsa do Itaci',
    'Lago de Furnas',
    'Itaci',
    'active_check_before_go',
    'medium',
    'Travessia de balsa entre Carmo do Rio Claro e o distrito do Itaci, no Lago de Furnas. É uma das rotas mais importantes para moradores, trabalhadores, visitantes e turistas que acessam o distrito.',
    $$[
      "Moradores de Carmo do Rio Claro têm gratuidade.",
      "Não moradores pagam tarifa.",
      "Carros de não moradores pagam R$ 10,00.",
      "Veículos maiores variam conforme o tamanho.",
      "Caminhões podem chegar a R$ 25,00.",
      "Horários podem mudar em período de safra, festas, manutenção ou alteração da Prefeitura.",
      "Em eventos grandes no Itaci, como festas religiosas, a travessia pode funcionar em esquema especial.",
      "Evite depender do último horário se tiver compromisso marcado."
    ]$$,
    'Moradores de Carmo do Rio Claro não pagam. Para não moradores, carros pagam R$ 10,00. Veículos maiores variam conforme o tamanho, podendo chegar a R$ 25,00 para caminhões.',
    'Valores podem sofrer alterações. Confirme no local antes da travessia.',
    $${
      "currency": "BRL",
      "isFreeForResidents": true,
      "freeFor": ["Moradores de Carmo do Rio Claro"],
      "paidFor": ["Não moradores", "Turistas", "Visitantes", "Moradores de outras cidades"],
      "prices": [
        { "category": "Morador de Carmo do Rio Claro", "price": 0, "label": "Gratuito" },
        { "category": "Carro de não morador", "price": 10, "label": "R$ 10,00" },
        { "category": "Veículos maiores", "priceRange": { "min": 10, "max": 25 }, "label": "De R$ 10,00 a R$ 25,00, conforme o tamanho" },
        { "category": "Caminhão", "priceRange": { "min": 10, "max": 25 }, "label": "Até R$ 25,00, conforme o tamanho" }
      ]
    }$$,
    $${
      "cardTitle": "Balsa do Itaci",
      "cardSubtitle": "Carmo do Rio Claro ⇄ Itaci",
      "priceLabel": "Moradores grátis • Carros R$ 10 • Caminhões até R$ 25",
      "scheduleLabel": "Confira os horários antes de sair",
      "ctaLabel": "Ver horários"
    }$$,
    $${
      "title": "Horários da Balsa do Itaci em Carmo do Rio Claro",
      "description": "Veja os horários da Balsa do Itaci entre Carmo do Rio Claro e o distrito do Itaci, valores para moradores e não moradores, avisos importantes e informações da travessia."
    }$$,
    array['balsa Itaci','horário balsa Itaci','balsa Carmo do Rio Claro','Itaci Carmo do Rio Claro','Lago de Furnas','travessia Itaci'],
    'Itaci', 'Carmo do Rio Claro',
    true, 10
  ),
  (
    'balsa-itapiche-carmo-ponte',
    'Balsa Itapiché ⇄ Ponte',
    'Balsa do Itapiché',
    'Lago de Furnas',
    'Itapiché',
    'active_check_before_go',
    'high',
    'Travessia de balsa da região do Itapiché, ligando Carmo do Rio Claro ao sentido Ponte. Rota importante para moradores da zona rural e usuários da região.',
    $$[
      "Moradores de Carmo do Rio Claro têm gratuidade.",
      "Não moradores pagam tarifa.",
      "Carros de não moradores pagam R$ 10,00.",
      "Veículos maiores podem pagar valor maior, conforme o tamanho.",
      "Confira se está no sentido correto: Carmo → Ponte ou Ponte → Carmo.",
      "A travessia pode ser interrompida por manutenção ou férias dos balseiros."
    ]$$,
    'Moradores de Carmo do Rio Claro não pagam. Para não moradores, carros pagam R$ 10,00. Veículos maiores variam conforme o tamanho, podendo chegar a R$ 25,00 para caminhões.',
    'Valores podem sofrer alterações. Confirme no local antes da travessia.',
    $${
      "currency": "BRL",
      "isFreeForResidents": true,
      "freeFor": ["Moradores de Carmo do Rio Claro"],
      "paidFor": ["Não moradores", "Turistas", "Visitantes", "Moradores de outras cidades"],
      "prices": [
        { "category": "Morador de Carmo do Rio Claro", "price": 0, "label": "Gratuito" },
        { "category": "Carro de não morador", "price": 10, "label": "R$ 10,00" },
        { "category": "Veículos maiores", "priceRange": { "min": 10, "max": 25 }, "label": "De R$ 10,00 a R$ 25,00, conforme o tamanho" },
        { "category": "Caminhão", "priceRange": { "min": 10, "max": 25 }, "label": "Até R$ 25,00, conforme o tamanho" }
      ]
    }$$,
    $${
      "cardTitle": "Balsa do Itapiché",
      "cardSubtitle": "Carmo do Rio Claro ⇄ Ponte",
      "priceLabel": "Moradores grátis • Carros R$ 10 • Caminhões até R$ 25",
      "scheduleLabel": "Horários oficiais de 2025",
      "ctaLabel": "Ver horários"
    }$$,
    $${
      "title": "Horários da Balsa do Itapiché em Carmo do Rio Claro",
      "description": "Veja os horários da Balsa do Itapiché, sentido Carmo para Ponte e Ponte para Carmo, além de valores e informações importantes da travessia."
    }$$,
    array['balsa Itapiché','horário balsa Itapiché','balsa Ponte Carmo','Carmo do Rio Claro','balsa Lago de Furnas'],
    'Carmo do Rio Claro', 'Ponte',
    true, 20
  ),
  (
    'balsa-aguas-verdes-carmo-campo-do-meio',
    'Balsa Águas Verdes ⇄ Campo do Meio',
    'Balsa Águas Verdes',
    'Lago de Furnas',
    null,
    'schedule_missing',
    'route_confirmed_schedule_missing',
    'Travessia aquaviária da região de Águas Verdes, conectando Carmo do Rio Claro e Campo do Meio. A rota aparece entre as travessias estratégicas do Lago de Furnas.',
    $$[
      "Rota listada entre as travessias estratégicas do Lago de Furnas.",
      "Horários ainda precisam ser cadastrados ou confirmados.",
      "Boa rota para deixar como em breve ou consulte antes de ir."
    ]$$,
    'Moradores podem ter gratuidade conforme regra local. Para não moradores, use como referência carro a R$ 10,00 e veículos maiores até R$ 25,00.',
    'Horários e valores desta rota precisam ser confirmados antes de exibir como informação oficial.',
    $${
      "currency": "BRL",
      "isFreeForResidents": true,
      "freeFor": ["Moradores de Carmo do Rio Claro, quando aplicável"],
      "paidFor": ["Não moradores", "Turistas", "Visitantes", "Moradores de outras cidades"],
      "prices": [
        { "category": "Carro de não morador", "price": 10, "label": "R$ 10,00" },
        { "category": "Veículos maiores", "priceRange": { "min": 10, "max": 25 }, "label": "De R$ 10,00 a R$ 25,00, conforme o tamanho" }
      ]
    }$$,
    $${
      "cardTitle": "Balsa Águas Verdes",
      "cardSubtitle": "Carmo do Rio Claro ⇄ Campo do Meio",
      "priceLabel": "Valores a confirmar",
      "scheduleLabel": "Horários a confirmar",
      "ctaLabel": "Ver informações"
    }$$,
    $${
      "title": "Balsa Águas Verdes entre Carmo do Rio Claro e Campo do Meio",
      "description": "Informações sobre a travessia de balsa Águas Verdes, no Lago de Furnas, entre Carmo do Rio Claro e Campo do Meio."
    }$$,
    array['balsa Águas Verdes','Campo do Meio','Carmo do Rio Claro','Lago de Furnas','travessia Águas Verdes'],
    'Carmo do Rio Claro', 'Campo do Meio',
    false, 30
  )
) as v(slug, name, short_name, region, district, status, confidence, description, important_info,
       fare_summary, fare_warning, fare, display, seo, keywords,
       endpoint_a_label, endpoint_b_label, featured, display_order)
on conflict (city_id, slug) do nothing;

-- ── Horários ───────────────────────────────────────────────────────────────
with route as (
  select r.id, r.city_id
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro' and r.slug = 'balsa-itaci-carmo-do-rio-claro'
)
insert into public.ferry_schedule_items (route_id, city_id, direction, origin, destination, departs_at, notes, display_order)
select route.id, route.city_id, t.direction, t.origin, t.destination, t.departs_at::time,
  case when t.departs_at in ('14:00','14:30') then 'Horário incluído em abril de 2025.' else null end,
  t.ord
from route, (values
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','06:00',1),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','07:00',2),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','08:30',3),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','10:00',4),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','12:30',5),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','14:00',6),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','16:30',7),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','17:30',8),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','19:30',9),
  ('Itaci → Carmo','Itaci','Carmo do Rio Claro','21:15',10),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','06:30',1),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','07:30',2),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','09:00',3),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','11:00',4),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','13:00',5),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','14:30',6),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','15:30',7),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','17:00',8),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','18:00',9),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','20:00',10),
  ('Carmo → Itaci','Carmo do Rio Claro','Itaci','21:30',11)
) as t(direction, origin, destination, departs_at, ord)
on conflict do nothing;

with route as (
  select r.id, r.city_id
  from public.ferry_routes r
  join public.cities c on c.id = r.city_id
  where c.slug = 'carmo-do-rio-claro' and r.slug = 'balsa-itapiche-carmo-ponte'
)
insert into public.ferry_schedule_items (route_id, city_id, direction, origin, destination, departs_at, notes, display_order)
select route.id, route.city_id, t.direction, t.origin, t.destination, t.departs_at::time,
  'Horários publicados pela Prefeitura em fevereiro de 2025.', t.ord
from route, (values
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','06:00',1),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','06:30',2),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','07:30',3),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','09:30',4),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','12:30',5),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','15:00',6),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','16:00',7),
  ('Carmo → Ponte','Carmo do Rio Claro','Ponte','17:00',8),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','06:15',1),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','07:00',2),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','08:30',3),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','10:00',4),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','13:30',5),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','15:30',6),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','16:30',7),
  ('Ponte → Carmo','Ponte','Carmo do Rio Claro','17:30',8)
) as t(direction, origin, destination, departs_at, ord)
on conflict do nothing;

-- ── Alertas ────────────────────────────────────────────────────────────────
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
  ('balsa-itaci-carmo-do-rio-claro','warning','Confirme antes de sair','Horários e valores podem mudar por manutenção, safra, eventos, nível do Lago de Furnas ou decisão do operador.',1),
  ('balsa-itaci-carmo-do-rio-claro','event','Eventos no Itaci','Em dias de festa, a travessia pode ter horários especiais, maior fila e restrição para veículos.',2),
  ('balsa-itaci-carmo-do-rio-claro','maintenance','Manutenção','A balsa pode ser suspensa temporariamente para manutenção. Verifique comunicados recentes da Prefeitura.',3),
  ('balsa-itapiche-carmo-ponte','warning','Horário sujeito a alteração','Mesmo com horários publicados, a travessia pode sofrer mudanças em períodos específicos.',1),
  ('balsa-itapiche-carmo-ponte','info','Planeje a volta','Confira o último horário de retorno para não ficar sem travessia.',2),
  ('balsa-aguas-verdes-carmo-campo-do-meio','warning','Horários a confirmar','Ainda não há horário confiável cadastrado para exibição automática.',1)
) as a(slug, type, title, message, ord) on a.slug = route.slug
on conflict do nothing;
