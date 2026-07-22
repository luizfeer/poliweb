-- Enfileira todos os registros ativos que existiam antes dos triggers
-- de indexação serem criados. Roda uma vez; idempotente via on conflict.

insert into indexing_queue (entity_type, entity_id, city_id, operation)
select 'business', id, city_id, 'upsert' from businesses
  where status = 'published' and city_id is not null
union all
select 'accommodation', id, city_id, 'upsert' from accommodations
  where status = 'published' and city_id is not null
union all
select 'restaurant', id, city_id, 'upsert' from restaurants
  where status = 'published' and city_id is not null
union all
select 'fishing_guide', id, city_id, 'upsert' from fishing_guides
  where status = 'published' and city_id is not null
union all
select 'event', id, city_id, 'upsert' from events
  where status = 'published' and city_id is not null
union all
select 'classified', id, city_id, 'upsert' from classifieds
  where status = 'published' and review_status = 'approved' and city_id is not null
union all
select 'property', id, city_id, 'upsert' from properties
  where status = 'published' and city_id is not null
union all
select 'attraction', id, city_id, 'upsert' from attractions
  where status = 'published' and city_id is not null
union all
select 'tour_package', id, city_id, 'upsert' from tour_packages
  where status = 'published' and city_id is not null
on conflict (entity_type, entity_id) do nothing;
