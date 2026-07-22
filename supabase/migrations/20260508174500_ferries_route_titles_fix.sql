-- Corrige titulos de rota e subtitulos dos cards de balsas.

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
update public.ferry_routes r
set endpoint_a_label = v.endpoint_a_label,
    endpoint_b_label = v.endpoint_b_label,
    display = jsonb_build_object(
      'cardTitle', v.card_title,
      'cardSubtitle', v.card_subtitle,
      'priceLabel', v.price_label,
      'scheduleLabel', v.schedule_label,
      'ctaLabel', v.cta_label
    ),
    updated_at = now()
from crc,
(values
  (
    'balsa-aguas-verdes-itaci-carmo',
    'Carmo',
    'Itaci',
    'Carmo → Itaci',
    'Balsa Águas Verdes',
    'Carro R$ 10 · moto R$ 2,50 · trator R$ 15',
    'Horários de referência',
    'Ver horários'
  ),
  (
    'balsa-itapiche-carmo-ponte',
    'Carmo',
    'Ponte do Itapiché',
    'Carmo → Ponte do Itapiché',
    'Balsa Itapiché',
    'Carro R$ 10 · moto R$ 2,50 · trator R$ 15',
    'Segunda a sábado',
    'Ver horários'
  ),
  (
    'balsa-sao-francisco-ii-campo-do-meio-itaci',
    'Campo do Meio',
    'Itaci',
    'Campo do Meio → Itaci',
    'Balsa São Francisco II',
    'Tarifas a confirmar',
    'Horários de referência',
    'Ver horários'
  )
) as v(slug, endpoint_a_label, endpoint_b_label, card_title, card_subtitle, price_label, schedule_label, cta_label)
where r.city_id = crc.id
  and r.slug = v.slug;
