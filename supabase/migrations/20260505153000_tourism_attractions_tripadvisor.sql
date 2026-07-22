-- Tourism attractions: ownership, reviews, moderated UGC photos, services and itinerary fields.

alter table public.attractions
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists google_place_id text,
  add column if not exists google_maps_url text,
  add column if not exists street_view_url text,
  add column if not exists rating numeric(2,1),
  add column if not exists reviews_count int default 0,
  add column if not exists google_summary text,
  add column if not exists google_summary_at timestamptz,
  add column if not exists google_photos jsonb default '[]'::jsonb,
  add column if not exists last_google_sync_at timestamptz,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists accessibility jsonb default '{}'::jsonb,
  add column if not exists amenities jsonb default '[]'::jsonb,
  add column if not exists tips text,
  add column if not exists price_range text,
  add column if not exists pet_friendly boolean default false,
  add column if not exists family_friendly boolean default false;

create unique index if not exists idx_attractions_google_place_id
on public.attractions(google_place_id)
where google_place_id is not null;

create index if not exists idx_attractions_city_slug on public.attractions(city_id, slug);
create index if not exists idx_attractions_city_status_type on public.attractions(city_id, status, type);
create index if not exists idx_attractions_owner on public.attractions(owner_profile_id);
create index if not exists idx_entity_managers_entity_profile on public.entity_managers(entity_type, entity_id, profile_id);

drop policy if exists "entity_managers_attraction_city_admin_create" on public.entity_managers;
create policy "entity_managers_attraction_city_admin_create" on public.entity_managers for insert
with check (
  entity_type = 'attraction'
  and exists (
    select 1
    from public.attractions a
    where a.id = entity_id
      and public.is_city_admin(a.city_id)
  )
);

create or replace function public.manages_attraction(p_attraction_id uuid)
returns boolean language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.attractions a
    where a.id = p_attraction_id
      and (
        a.owner_profile_id = auth.uid()
        or public.manages_entity('attraction', a.id)
        or public.is_city_admin(a.city_id)
      )
  );
$$;

drop policy if exists "attr_admin" on public.attractions;
drop policy if exists "attr_read" on public.attractions;

create policy "attr_read" on public.attractions for select
using (
  status = 'published'
  or owner_profile_id = auth.uid()
  or public.manages_entity('attraction', id)
  or public.is_city_admin(city_id)
);

create policy "attr_create" on public.attractions for insert
with check (public.is_merchant(city_id) or public.is_city_admin(city_id));

create policy "attr_update" on public.attractions for update
using (
  owner_profile_id = auth.uid()
  or public.manages_entity('attraction', id)
  or public.is_city_admin(city_id)
)
with check (
  owner_profile_id = auth.uid()
  or public.manages_entity('attraction', id)
  or public.is_city_admin(city_id)
);

create policy "attr_delete" on public.attractions for delete
using (public.is_city_admin(city_id));

create table if not exists public.attraction_reviews (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  comment text,
  photo_url text,
  status public.entity_status default 'pending',
  reply_owner text,
  reply_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (attraction_id, author_profile_id)
);

create trigger trg_attraction_reviews_updated
before update on public.attraction_reviews
for each row execute function public.set_updated_at();

alter table public.attraction_reviews enable row level security;

create index if not exists idx_attraction_reviews_attraction_status_created
on public.attraction_reviews(attraction_id, status, created_at desc);

create index if not exists idx_attraction_reviews_city_status
on public.attraction_reviews(city_id, status);

create policy "attraction_reviews_public_read" on public.attraction_reviews for select
using (
  status = 'published'
  or author_profile_id = auth.uid()
  or public.manages_attraction(attraction_id)
  or public.is_city_admin(city_id)
);

create policy "attraction_reviews_self_create" on public.attraction_reviews for insert
with check (
  author_profile_id = auth.uid()
  and exists (
    select 1
    from public.attractions a
    where a.id = attraction_id
      and a.city_id = attraction_reviews.city_id
      and a.status = 'published'
  )
);

create policy "attraction_reviews_self_update" on public.attraction_reviews for update
using (author_profile_id = auth.uid() and status in ('draft', 'pending'))
with check (author_profile_id = auth.uid() and status in ('draft', 'pending'));

create policy "attraction_reviews_moderate" on public.attraction_reviews for update
using (public.manages_attraction(attraction_id) or public.is_city_admin(city_id))
with check (public.manages_attraction(attraction_id) or public.is_city_admin(city_id));

create table if not exists public.attraction_photos (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  caption text,
  status public.entity_status default 'pending',
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_attraction_photos_updated
before update on public.attraction_photos
for each row execute function public.set_updated_at();

alter table public.attraction_photos enable row level security;

create index if not exists idx_attraction_photos_attraction_status_created
on public.attraction_photos(attraction_id, status, created_at desc);

create policy "attraction_photos_public_read" on public.attraction_photos for select
using (
  status = 'published'
  or author_profile_id = auth.uid()
  or public.manages_attraction(attraction_id)
  or public.is_city_admin(city_id)
);

create policy "attraction_photos_self_create" on public.attraction_photos for insert
with check (
  author_profile_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.attractions a
    where a.id = attraction_id
      and a.city_id = attraction_photos.city_id
      and a.status = 'published'
  )
);

create policy "attraction_photos_moderate" on public.attraction_photos for update
using (public.manages_attraction(attraction_id) or public.is_city_admin(city_id))
with check (public.manages_attraction(attraction_id) or public.is_city_admin(city_id));

create table if not exists public.attraction_services (
  id uuid primary key default gen_random_uuid(),
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  kind text not null,
  label text not null,
  details text,
  price numeric(10,2),
  contact_business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_attraction_services_updated
before update on public.attraction_services
for each row execute function public.set_updated_at();

alter table public.attraction_services enable row level security;

create index if not exists idx_attraction_services_attraction on public.attraction_services(attraction_id);

create policy "attraction_services_public_read" on public.attraction_services for select
using (
  exists (
    select 1
    from public.attractions a
    where a.id = attraction_id
      and (a.status = 'published' or public.manages_attraction(a.id) or public.is_city_admin(a.city_id))
  )
);

create policy "attraction_services_manage" on public.attraction_services for all
using (public.manages_attraction(attraction_id))
with check (public.manages_attraction(attraction_id));

alter table public.tour_packages
  add column if not exists itinerary jsonb default '[]'::jsonb,
  add column if not exists difficulty text,
  add column if not exists total_duration_hours numeric(5,2),
  add column if not exists total_distance_km numeric(6,2),
  add column if not exists gallery jsonb default '[]'::jsonb,
  add column if not exists featured boolean default false,
  add column if not exists updated_at timestamptz default now();

drop trigger if exists trg_tour_packages_updated on public.tour_packages;
create trigger trg_tour_packages_updated
before update on public.tour_packages
for each row execute function public.set_updated_at();

drop policy if exists "packages_provider_write" on public.tour_packages;
create policy "packages_provider_write" on public.tour_packages for all
using (
  public.is_city_admin(city_id)
  or (provider_business_id is not null and public.manages_business(provider_business_id))
)
with check (
  public.is_city_admin(city_id)
  or (provider_business_id is not null and public.manages_business(provider_business_id))
);

create index if not exists idx_tour_packages_city_featured
on public.tour_packages(city_id, featured, status);

drop policy if exists "storage_attraction_ugc_insert" on storage.objects;
create policy "storage_attraction_ugc_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tourism'
  and (storage.foldername(storage.objects.name))[2] = 'attractions'
  and exists (
    select 1
    from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and c.status = 'active'
  )
);
