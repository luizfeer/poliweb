create table entity_posts (
  id uuid default gen_random_uuid() primary key,
  city_id uuid not null references cities(id) on delete cascade,
  entity_type text not null check (entity_type in ('business', 'church')),
  entity_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  body text check (body is null or char_length(body) <= 2000),
  image_url text,
  button_label text check (button_label is null or char_length(button_label) <= 40),
  button_url text,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entity_posts_entity_idx on entity_posts (entity_type, entity_id, published_at desc);
create index entity_posts_city_idx on entity_posts (city_id, published_at desc);

alter table entity_posts enable row level security;

create policy "entity_posts_select" on entity_posts
  for select using (true);

create policy "entity_posts_manage" on entity_posts
  for all
  using (
    is_city_admin(city_id)
    or (entity_type = 'business' and manages_business(entity_id))
    or (
      entity_type = 'church'
      and exists (
        select 1 from profile_roles pr
        where pr.profile_id = auth.uid()
          and (pr.city_id = entity_posts.city_id or pr.city_id is null)
          and pr.role in ('moderator', 'city_admin', 'super_admin')
      )
    )
  )
  with check (
    is_city_admin(city_id)
    or (entity_type = 'business' and manages_business(entity_id))
    or (
      entity_type = 'church'
      and exists (
        select 1 from profile_roles pr
        where pr.profile_id = auth.uid()
          and (pr.city_id = entity_posts.city_id or pr.city_id is null)
          and pr.role in ('moderator', 'city_admin', 'super_admin')
      )
    )
  );
