-- OG image jobs: expande para todas as entidades do portal

-- 1) Adiciona og_image_url nas tabelas de entidades
alter table public.attractions      add column if not exists og_image_url text;
alter table public.accommodations   add column if not exists og_image_url text;
alter table public.restaurants      add column if not exists og_image_url text;
alter table public.fishing_guides   add column if not exists og_image_url text;
alter table public.tourism_guides   add column if not exists og_image_url text;
alter table public.properties       add column if not exists og_image_url text;
alter table public.churches         add column if not exists og_image_url text;
alter table public.ferry_routes     add column if not exists og_image_url text;

-- 2) Atualiza função de enfileiramento para suportar published/active
-- remove jobs pendentes antigos e insere novo
 create or replace function public.enqueue_og_image_job()
 returns trigger as $$
 declare
   is_published boolean := false;
   j jsonb;
 begin
   j := to_jsonb(new);

   -- determina se a entidade está "publicada"
   if j ? 'status' and j->>'status' = 'published' then
     is_published := true;
   elsif j ? 'active' and (j->>'active')::boolean = true then
     is_published := true;
   end if;

   if not is_published then
     return new;
   end if;

   delete from public.og_image_jobs
   where entity_type = TG_ARGV[0]
     and entity_id = new.id
     and status = 'pending';

   insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
   values (new.city_id, TG_ARGV[0], new.id, 'pending');

   return new;
 end;
 $$ language plpgsql;

-- 3) Triggers para cada entidade
-- attractions
 drop trigger if exists trg_attractions_og_image on public.attractions;
 create trigger trg_attractions_og_image
   after insert or update of name, cover_url, photos, slug on public.attractions
   for each row
   execute function public.enqueue_og_image_job('attraction');

-- accommodations
 drop trigger if exists trg_accommodations_og_image on public.accommodations;
 create trigger trg_accommodations_og_image
   after insert or update of name, cover_url, photos, slug on public.accommodations
   for each row
   execute function public.enqueue_og_image_job('accommodation');

-- restaurants
 drop trigger if exists trg_restaurants_og_image on public.restaurants;
 create trigger trg_restaurants_og_image
   after insert or update of name, cover_url, photos, slug on public.restaurants
   for each row
   execute function public.enqueue_og_image_job('restaurant');

-- fishing_guides (full_name + photo_url, sem cover_url)
 drop trigger if exists trg_fishing_guides_og_image on public.fishing_guides;
 create trigger trg_fishing_guides_og_image
   after insert or update of full_name, photo_url, slug on public.fishing_guides
   for each row
   execute function public.enqueue_og_image_job('fishing_guide');

-- tourism_guides
 drop trigger if exists trg_tourism_guides_og_image on public.tourism_guides;
 create trigger trg_tourism_guides_og_image
   after insert or update of name, cover_url, photos, slug on public.tourism_guides
   for each row
   execute function public.enqueue_og_image_job('tourism_guide');

-- properties (usa title em vez de name)
 drop trigger if exists trg_properties_og_image on public.properties;
 create trigger trg_properties_og_image
   after insert or update of title, cover_url, photos, slug on public.properties
   for each row
   execute function public.enqueue_og_image_job('property');

-- churches
 drop trigger if exists trg_churches_og_image on public.churches;
 create trigger trg_churches_og_image
   after insert or update of name, cover_url, slug on public.churches
   for each row
   execute function public.enqueue_og_image_job('church');

-- ferry_routes
 drop trigger if exists trg_ferry_routes_og_image on public.ferry_routes;
 create trigger trg_ferry_routes_og_image
   after insert or update of name, cover_url, slug on public.ferry_routes
   for each row
   execute function public.enqueue_og_image_job('ferry_route');
