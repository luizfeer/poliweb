-- Atualiza o cronograma de coleta de lixo de Carmo do Rio Claro.
-- O modelo atual é por bairro; aplicamos o cronograma oficial a todos os bairros cadastrados da cidade.

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.garbage_schedules g
using crc
where g.city_id = crc.id;

with crc as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
), city_districts as (
  select d.id as district_id, d.city_id
  from public.districts d
  join crc on crc.id = d.city_id
)
insert into public.garbage_schedules (
  city_id,
  district_id,
  type,
  day_of_week,
  start_time,
  end_time,
  notes,
  active
)
select
  d.city_id,
  d.district_id,
  slot.type::public.garbage_kind,
  slot.day_of_week,
  null::time,
  null::time,
  slot.notes,
  true
from city_districts d
cross join (values
  (
    'organic',
    1,
    'Antes do almoço. Coleta destinada a resíduos orgânicos e lixo comum doméstico: restos de comida, cascas de frutas, lixo de banheiro, guardanapos sujos e resíduos domésticos não recicláveis.'
  ),
  (
    'organic',
    3,
    'Antes do almoço. Coleta destinada a resíduos orgânicos e lixo comum doméstico: restos de comida, cascas de frutas, lixo de banheiro, guardanapos sujos e resíduos domésticos não recicláveis.'
  ),
  (
    'organic',
    5,
    'Antes do almoço. Coleta destinada a resíduos orgânicos e lixo comum doméstico: restos de comida, cascas de frutas, lixo de banheiro, guardanapos sujos e resíduos domésticos não recicláveis.'
  ),
  (
    'recyclable',
    2,
    'À noite. Coleta destinada a materiais recicláveis e resíduos secos: papel, papelão, plástico, garrafas PET, latas, metais, vidro e embalagens limpas.'
  ),
  (
    'recyclable',
    4,
    'À noite. Coleta destinada a materiais recicláveis e resíduos secos: papel, papelão, plástico, garrafas PET, latas, metais, vidro e embalagens limpas.'
  )
) as slot(type, day_of_week, notes);
