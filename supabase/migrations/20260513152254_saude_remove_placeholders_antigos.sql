-- Remove placeholders antigos de saude que nao fazem parte do seed curado de PSFs/UBS.

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
old_rows as (
  select id, city_id
  from public.health_facilities
  where city_id = (select id from carmo)
    and name in ('UPA Carmo 24h', 'UBS Centro')
)
insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
select 'health_facility', id, city_id, 'delete'
from old_rows
on conflict (entity_type, entity_id) do update
set operation = excluded.operation,
    city_id = excluded.city_id,
    processed_at = null,
    attempts = 0,
    last_error = null,
    enqueued_at = now();

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
delete from public.health_facilities
where city_id = (select id from carmo)
  and name in ('UPA Carmo 24h', 'UBS Centro');
