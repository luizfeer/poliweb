create table media_assets (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  uploaded_by_profile_id uuid references profiles(id) on delete set null,
  provider text not null default 'bunny' check (provider in ('bunny')),
  bucket text not null,
  storage_path text not null,
  cdn_url text not null,
  original_filename text,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  checksum_sha256 text,
  width integer,
  height integer,
  alt_text text,
  status text not null default 'active' check (status in ('active', 'deleted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (bucket, storage_path)
);

create table media_links (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  asset_id uuid not null references media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  role text not null check (role in ('logo', 'cover', 'gallery', 'avatar', 'attachment', 'ad')),
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (asset_id, entity_type, entity_id, role)
);

create unique index media_links_one_primary_per_role
  on media_links(entity_type, entity_id, role)
  where is_primary;

create index idx_media_assets_city on media_assets(city_id, status, created_at desc);
create index idx_media_links_entity on media_links(entity_type, entity_id, role, position);

create trigger media_assets_updated_at before update on media_assets
for each row execute function set_updated_at();

create trigger media_links_updated_at before update on media_links
for each row execute function set_updated_at();

alter table media_assets enable row level security;
alter table media_links enable row level security;

create policy "media_assets_read" on media_assets for select
using (status = 'active' or uploaded_by_profile_id = auth.uid() or public.is_city_admin(city_id));

create policy "media_assets_insert" on media_assets for insert
with check (uploaded_by_profile_id = auth.uid() and city_id is not null);

create policy "media_assets_update" on media_assets for update
using (uploaded_by_profile_id = auth.uid() or public.is_city_admin(city_id))
with check (uploaded_by_profile_id = auth.uid() or public.is_city_admin(city_id));

create policy "media_assets_delete" on media_assets for delete
using (uploaded_by_profile_id = auth.uid() or public.is_city_admin(city_id));

create policy "media_links_read" on media_links for select
using (true);

create policy "media_links_insert" on media_links for insert
with check (
  public.is_city_admin(city_id)
  or public.manages_entity(entity_type, entity_id)
  or (entity_type = 'business' and public.manages_business(entity_id))
  or (entity_type = 'realtor' and public.manages_realtor(entity_id))
  or exists (select 1 from accommodations e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from restaurants e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from fishing_guides e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from properties e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from classifieds e where e.id = entity_id and e.city_id = media_links.city_id and e.author_profile_id = auth.uid())
  or exists (select 1 from events e where e.id = entity_id and e.city_id = media_links.city_id and e.organizer_profile_id = auth.uid())
  or exists (select 1 from lost_pets e where e.id = entity_id and e.city_id = media_links.city_id and e.author_profile_id = auth.uid())
  or exists (select 1 from lost_and_found e where e.id = entity_id and e.city_id = media_links.city_id and e.author_profile_id = auth.uid())
);

create policy "media_links_update" on media_links for update
using (public.is_city_admin(city_id) or public.manages_entity(entity_type, entity_id))
with check (public.is_city_admin(city_id) or public.manages_entity(entity_type, entity_id));

create policy "media_links_delete" on media_links for delete
using (public.is_city_admin(city_id) or public.manages_entity(entity_type, entity_id));
