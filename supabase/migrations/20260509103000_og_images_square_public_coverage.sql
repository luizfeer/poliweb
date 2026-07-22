-- Completa cobertura de OG/WhatsApp para entidades publicas e evita URL cacheada.

alter table public.og_image_jobs add column if not exists og_square_image_url text;

alter table public.businesses       add column if not exists og_square_image_url text;
alter table public.attractions      add column if not exists og_square_image_url text;
alter table public.accommodations   add column if not exists og_square_image_url text;
alter table public.restaurants      add column if not exists og_square_image_url text;
alter table public.fishing_guides   add column if not exists og_square_image_url text;
alter table public.tourism_guides   add column if not exists og_square_image_url text;
alter table public.properties       add column if not exists og_square_image_url text;
alter table public.churches         add column if not exists og_square_image_url text;
alter table public.ferry_routes     add column if not exists og_square_image_url text;

alter table public.classifieds      add column if not exists og_image_url text;
alter table public.classifieds      add column if not exists og_square_image_url text;
alter table public.events           add column if not exists og_image_url text;
alter table public.events           add column if not exists og_square_image_url text;
alter table public.lost_pets        add column if not exists og_image_url text;
alter table public.lost_pets        add column if not exists og_square_image_url text;
alter table public.lost_and_found   add column if not exists og_image_url text;
alter table public.lost_and_found   add column if not exists og_square_image_url text;
alter table public.obituaries       add column if not exists og_image_url text;
alter table public.obituaries       add column if not exists og_square_image_url text;
alter table public.health_campaigns add column if not exists og_image_url text;
alter table public.health_campaigns add column if not exists og_square_image_url text;

create or replace function public.enqueue_og_image_job()
returns trigger as $$
declare
  is_public boolean := false;
  j jsonb;
begin
  j := to_jsonb(new);

  if j ? 'status' and j->>'status' = 'published' then
    is_public := true;
  elsif j ? 'active' and (j->>'active')::boolean = true then
    is_public := true;
  elsif j ? 'moderation_status' and j->>'moderation_status' = 'published' then
    is_public := true;
  end if;

  if not is_public then
    return new;
  end if;

  update public.og_image_jobs
  set status = 'failed',
      error = 'superseded by newer entity update',
      updated_at = now()
  where entity_type = TG_ARGV[0]
    and entity_id = new.id
    and status in ('pending', 'processing');

  insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
  values (new.city_id, TG_ARGV[0], new.id, 'pending');

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_businesses_og_image on public.businesses;
create trigger trg_businesses_og_image
  after insert or update of name, short_description, description, cover_url, photos, slug, status
  on public.businesses
  for each row
  execute function public.enqueue_og_image_job('business');

drop trigger if exists trg_attractions_og_image on public.attractions;
create trigger trg_attractions_og_image
  after insert or update of name, description, cover_url, photos, slug, status
  on public.attractions
  for each row
  execute function public.enqueue_og_image_job('attraction');

drop trigger if exists trg_accommodations_og_image on public.accommodations;
create trigger trg_accommodations_og_image
  after insert or update of name, description, cover_url, photos, slug, status
  on public.accommodations
  for each row
  execute function public.enqueue_og_image_job('accommodation');

drop trigger if exists trg_restaurants_og_image on public.restaurants;
create trigger trg_restaurants_og_image
  after insert or update of name, description, cover_url, photos, slug, status
  on public.restaurants
  for each row
  execute function public.enqueue_og_image_job('restaurant');

drop trigger if exists trg_fishing_guides_og_image on public.fishing_guides;
create trigger trg_fishing_guides_og_image
  after insert or update of full_name, about, photo_url, slug, status
  on public.fishing_guides
  for each row
  execute function public.enqueue_og_image_job('fishing_guide');

drop trigger if exists trg_tourism_guides_og_image on public.tourism_guides;
create trigger trg_tourism_guides_og_image
  after insert or update of name, description, cover_url, photos, slug, status
  on public.tourism_guides
  for each row
  execute function public.enqueue_og_image_job('tourism_guide');

drop trigger if exists trg_properties_og_image on public.properties;
create trigger trg_properties_og_image
  after insert or update of title, description, cover_url, photos, slug, status, review_status
  on public.properties
  for each row
  when (new.review_status = 'approved')
  execute function public.enqueue_og_image_job('property');

drop trigger if exists trg_churches_og_image on public.churches;
create trigger trg_churches_og_image
  after insert or update of name, description, short_description, cover_url, slug, status
  on public.churches
  for each row
  execute function public.enqueue_og_image_job('church');

drop trigger if exists trg_ferry_routes_og_image on public.ferry_routes;
create trigger trg_ferry_routes_og_image
  after insert or update of name, description, cover_url, slug, active
  on public.ferry_routes
  for each row
  execute function public.enqueue_og_image_job('ferry_route');

drop trigger if exists trg_classifieds_og_image on public.classifieds;
create trigger trg_classifieds_og_image
  after insert or update of title, description, price, category_label, cover_url, photos, slug, status, review_status
  on public.classifieds
  for each row
  when (new.review_status = 'approved')
  execute function public.enqueue_og_image_job('classified');

drop trigger if exists trg_events_og_image on public.events;
create trigger trg_events_og_image
  after insert or update of title, description, cover_url, photos, slug, status
  on public.events
  for each row
  execute function public.enqueue_og_image_job('event');

drop trigger if exists trg_lost_pets_og_image on public.lost_pets;
create trigger trg_lost_pets_og_image
  after insert or update of pet_name, description, cover_url, photos, moderation_status
  on public.lost_pets
  for each row
  execute function public.enqueue_og_image_job('lost_pet');

drop trigger if exists trg_lost_and_found_og_image on public.lost_and_found;
create trigger trg_lost_and_found_og_image
  after insert or update of item_description, location, cover_url, moderation_status
  on public.lost_and_found
  for each row
  execute function public.enqueue_og_image_job('lost_and_found');

drop trigger if exists trg_obituaries_og_image on public.obituaries;
create trigger trg_obituaries_og_image
  after insert or update of full_name, family_message, photo_url, status
  on public.obituaries
  for each row
  execute function public.enqueue_og_image_job('obituary');

drop trigger if exists trg_health_campaigns_og_image on public.health_campaigns;
create trigger trg_health_campaigns_og_image
  after insert or update of title, description, cover_url, active
  on public.health_campaigns
  for each row
  execute function public.enqueue_og_image_job('health_campaign');

insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select city_id, entity_type, entity_id, 'pending'
from (
  select city_id, 'business' entity_type, id entity_id from public.businesses where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'attraction', id from public.attractions where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'accommodation', id from public.accommodations where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'restaurant', id from public.restaurants where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'fishing_guide', id from public.fishing_guides where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'tourism_guide', id from public.tourism_guides where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'property', id from public.properties where status = 'published' and review_status = 'approved' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'church', id from public.churches where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'ferry_route', id from public.ferry_routes where active = true and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'classified', id from public.classifieds where status = 'published' and review_status = 'approved' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'event', id from public.events where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'lost_pet', id from public.lost_pets where moderation_status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'lost_and_found', id from public.lost_and_found where moderation_status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'obituary', id from public.obituaries where status = 'published' and (og_image_url is null or og_square_image_url is null)
  union all select city_id, 'health_campaign', id from public.health_campaigns where active = true and (og_image_url is null or og_square_image_url is null)
) queued
where not exists (
  select 1
  from public.og_image_jobs existing
  where existing.entity_type = queued.entity_type
    and existing.entity_id = queued.entity_id
    and existing.status in ('pending', 'processing')
);
