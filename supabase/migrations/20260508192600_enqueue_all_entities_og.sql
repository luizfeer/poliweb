-- Enfileira OG image jobs para todas as entidades publicadas sem og_image_url

-- Businesses
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'business', id, 'pending'
from public.businesses
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'business' and entity_id = businesses.id and status = 'pending'
  );

-- Attractions
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'attraction', id, 'pending'
from public.attractions
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'attraction' and entity_id = attractions.id and status = 'pending'
  );

-- Accommodations
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'accommodation', id, 'pending'
from public.accommodations
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'accommodation' and entity_id = accommodations.id and status = 'pending'
  );

-- Restaurants
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'restaurant', id, 'pending'
from public.restaurants
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'restaurant' and entity_id = restaurants.id and status = 'pending'
  );

-- Fishing guides
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'fishing_guide', id, 'pending'
from public.fishing_guides
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'fishing_guide' and entity_id = fishing_guides.id and status = 'pending'
  );

-- Tourism guides
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'tourism_guide', id, 'pending'
from public.tourism_guides
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'tourism_guide' and entity_id = tourism_guides.id and status = 'pending'
  );

-- Properties
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'property', id, 'pending'
from public.properties
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'property' and entity_id = properties.id and status = 'pending'
  );

-- Churches
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'church', id, 'pending'
from public.churches
where status = 'published'
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'church' and entity_id = churches.id and status = 'pending'
  );

-- Ferry routes (usa active em vez de status)
insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, 'ferry_route', id, 'pending'
from public.ferry_routes
where active = true
  and og_image_url is null
  and not exists (
    select 1 from public.og_image_jobs
    where entity_type = 'ferry_route' and entity_id = ferry_routes.id and status = 'pending'
  );
