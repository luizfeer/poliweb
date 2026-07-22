-- Tourism Guides: editorial guide pages (e.g. "Conheça Itaci", "Conheça Carmo")
-- Reuses the same Google integration pattern as attractions

create type guide_kind as enum ('distrito', 'cidade', 'tematico', 'roteiro');

create table tourism_guides (
  id             uuid primary key default gen_random_uuid(),
  city_id        uuid not null references cities(id),
  slug           text not null,
  aliases        text[] not null default '{}',
  kind           guide_kind not null default 'distrito',
  name           text not null,
  tagline        text,
  description    text,
  cover_url      text,
  photos         jsonb not null default '[]',

  -- Google Places integration (same pattern as attractions)
  google_place_id  text,
  google_maps_url  text,
  google_summary   text,
  google_photos    jsonb not null default '{}',

  -- Location
  address        text,
  lat            double precision,
  lng            double precision,

  -- Contact
  phone          text,
  whatsapp       text,
  website        text,
  instagram      text,

  -- Flexible content sections (hero, highlights, FAQ, seasons, places, ferry, etc.)
  sections       jsonb not null default '[]',
  seo            jsonb not null default '{}',
  practical_info jsonb not null default '[]',
  faq            jsonb not null default '[]',
  highlights     jsonb not null default '[]',
  content_blocks jsonb not null default '[]',

  -- Ratings (aggregated)
  rating         double precision,
  reviews_count  integer not null default 0,

  -- Ownership
  owner_profile_id uuid references profiles(id),
  status         entity_status not null default 'draft',
  featured       boolean not null default false,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint tourism_guides_city_slug_unique unique (city_id, slug)
);

-- Linked entities: connect guides to attractions, businesses, accommodations, restaurants
create table guide_linked_entities (
  id             uuid primary key default gen_random_uuid(),
  guide_id       uuid not null references tourism_guides(id) on delete cascade,
  entity_type    text not null, -- 'attraction', 'business', 'accommodation', 'restaurant', 'fishing_spot'
  entity_id      uuid not null,
  sort_order     integer not null default 0,
  label          text, -- optional override label
  description    text, -- optional override description
  created_at     timestamptz not null default now(),

  constraint guide_linked_entities_unique unique (guide_id, entity_type, entity_id)
);

-- Reviews (same pattern as attraction_reviews)
create table guide_reviews (
  id                uuid primary key default gen_random_uuid(),
  guide_id          uuid not null references tourism_guides(id) on delete cascade,
  city_id           uuid not null references cities(id),
  author_profile_id uuid not null references profiles(id),
  rating            smallint not null check (rating between 1 and 5),
  title             text,
  comment           text,
  photo_url         text,
  visit_date        date,
  status            entity_status not null default 'pending',
  reply_owner       text,
  reply_at          timestamptz,
  created_at        timestamptz not null default now()
);

-- Community photos (same pattern as attraction_photos)
create table guide_photos (
  id                uuid primary key default gen_random_uuid(),
  guide_id          uuid not null references tourism_guides(id) on delete cascade,
  city_id           uuid not null references cities(id),
  author_profile_id uuid not null references profiles(id),
  storage_path      text not null,
  caption           text,
  status            entity_status not null default 'pending',
  created_at        timestamptz not null default now()
);

-- Indexes
create index idx_tourism_guides_city on tourism_guides(city_id);
create index idx_tourism_guides_slug on tourism_guides(city_id, slug);
create index idx_tourism_guides_status on tourism_guides(status);
create index idx_guide_reviews_guide on guide_reviews(guide_id);
create index idx_guide_photos_guide on guide_photos(guide_id);
create index idx_guide_linked_entities_guide on guide_linked_entities(guide_id);

-- RLS
alter table tourism_guides enable row level security;
alter table guide_linked_entities enable row level security;
alter table guide_reviews enable row level security;
alter table guide_photos enable row level security;

-- Public read for published guides
create policy "tourism_guides_public_read" on tourism_guides
  for select using (status = 'published');

create policy "guide_linked_entities_public_read" on guide_linked_entities
  for select using (
    exists (select 1 from tourism_guides where id = guide_id and status = 'published')
  );

create policy "guide_reviews_public_read" on guide_reviews
  for select using (status = 'published');

create policy "guide_photos_public_read" on guide_photos
  for select using (status = 'published');

-- Admin write
create policy "tourism_guides_admin_write" on tourism_guides
  for all using (is_city_admin(city_id));

create policy "guide_linked_entities_admin_write" on guide_linked_entities
  for all using (
    exists (select 1 from tourism_guides where id = guide_id and is_city_admin(city_id))
  );

-- Auth users can create reviews/photos
create policy "guide_reviews_auth_insert" on guide_reviews
  for insert with check (auth.uid() = author_profile_id);

create policy "guide_photos_auth_insert" on guide_photos
  for insert with check (auth.uid() = author_profile_id);

-- Updated_at trigger (usa função padrão do core)
create trigger set_tourism_guides_updated_at
  before update on tourism_guides
  for each row execute function public.set_updated_at();
