-- ============================================================================
-- 0021 - COMMUNITY GROUPS: coletivos locais + diretorio de WhatsApp
-- ============================================================================

create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  slug text not null,
  name text not null,
  type text not null check (type in ('collective', 'association', 'project', 'whatsapp_group')),
  category text not null,
  short_description text,
  description text,
  cover_url text,
  thumbnail_url text,
  contact_name text,
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  instagram_url text,
  website_url text,
  whatsapp_invite_url text,
  neighborhood text,
  participation_instructions text,
  group_rules text,
  member_estimate int,
  is_official boolean not null default false,
  requires_approval boolean not null default false,
  last_verified_at timestamptz,
  status entity_status not null default 'pending',
  flagged_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create index if not exists idx_community_groups_city_status
on public.community_groups(city_id, status, type, created_at desc);

create index if not exists idx_community_groups_owner
on public.community_groups(owner_profile_id, city_id, updated_at desc);

create trigger trg_community_groups_updated
before update on public.community_groups
for each row execute function public.set_updated_at();

create table if not exists public.community_group_posts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  group_id uuid not null references public.community_groups(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text,
  post_type text not null check (post_type in ('notice', 'request', 'donation', 'opportunity', 'announcement', 'lost_found')),
  contact_phone text,
  contact_whatsapp text,
  contact_email text,
  external_url text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  status entity_status not null default 'pending',
  flagged_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_group_posts_group_status
on public.community_group_posts(group_id, status, created_at desc);

create index if not exists idx_community_group_posts_city_status
on public.community_group_posts(city_id, status, created_at desc);

create trigger trg_community_group_posts_updated
before update on public.community_group_posts
for each row execute function public.set_updated_at();

alter table public.community_groups enable row level security;
alter table public.community_group_posts enable row level security;

drop policy if exists "community_groups_read" on public.community_groups;
create policy "community_groups_read"
on public.community_groups for select
using (
  status = 'published'
  or owner_profile_id = auth.uid()
  or public.manages_entity('community_group', id)
  or public.is_city_admin(city_id)
);

drop policy if exists "community_groups_insert" on public.community_groups;
create policy "community_groups_insert"
on public.community_groups for insert
to authenticated
with check (owner_profile_id = auth.uid());

drop policy if exists "community_groups_update" on public.community_groups;
create policy "community_groups_update"
on public.community_groups for update
to authenticated
using (
  owner_profile_id = auth.uid()
  or public.manages_entity('community_group', id)
  or public.is_city_admin(city_id)
)
with check (
  owner_profile_id = auth.uid()
  or public.manages_entity('community_group', id)
  or public.is_city_admin(city_id)
);

drop policy if exists "community_groups_delete" on public.community_groups;
create policy "community_groups_delete"
on public.community_groups for delete
to authenticated
using (
  owner_profile_id = auth.uid()
  or public.manages_entity('community_group', id)
  or public.is_city_admin(city_id)
);

drop policy if exists "community_group_posts_read" on public.community_group_posts;
create policy "community_group_posts_read"
on public.community_group_posts for select
using (
  status = 'published'
  or author_profile_id = auth.uid()
  or public.is_city_admin(city_id)
  or exists (
    select 1
    from public.community_groups g
    where g.id = community_group_posts.group_id
      and g.city_id = community_group_posts.city_id
      and (
        g.owner_profile_id = auth.uid()
        or public.manages_entity('community_group', g.id)
      )
  )
);

drop policy if exists "community_group_posts_insert" on public.community_group_posts;
create policy "community_group_posts_insert"
on public.community_group_posts for insert
to authenticated
with check (
  author_profile_id = auth.uid()
  and exists (
    select 1
    from public.community_groups g
    where g.id = community_group_posts.group_id
      and g.city_id = community_group_posts.city_id
      and (
        g.owner_profile_id = auth.uid()
        or public.manages_entity('community_group', g.id)
        or public.is_city_admin(g.city_id)
      )
  )
);

drop policy if exists "community_group_posts_update" on public.community_group_posts;
create policy "community_group_posts_update"
on public.community_group_posts for update
to authenticated
using (
  author_profile_id = auth.uid()
  or public.is_city_admin(city_id)
  or exists (
    select 1
    from public.community_groups g
    where g.id = community_group_posts.group_id
      and g.city_id = community_group_posts.city_id
      and (
        g.owner_profile_id = auth.uid()
        or public.manages_entity('community_group', g.id)
      )
  )
)
with check (
  author_profile_id = auth.uid()
  or public.is_city_admin(city_id)
  or exists (
    select 1
    from public.community_groups g
    where g.id = community_group_posts.group_id
      and g.city_id = community_group_posts.city_id
      and (
        g.owner_profile_id = auth.uid()
        or public.manages_entity('community_group', g.id)
      )
  )
);

drop policy if exists "community_group_posts_delete" on public.community_group_posts;
create policy "community_group_posts_delete"
on public.community_group_posts for delete
to authenticated
using (
  author_profile_id = auth.uid()
  or public.is_city_admin(city_id)
  or exists (
    select 1
    from public.community_groups g
    where g.id = community_group_posts.group_id
      and g.city_id = community_group_posts.city_id
      and (
        g.owner_profile_id = auth.uid()
        or public.manages_entity('community_group', g.id)
      )
  )
);

alter table public.content_reports
  drop constraint if exists content_reports_entity_type_check;

alter table public.content_reports
  add constraint content_reports_entity_type_check
  check (entity_type in ('event', 'classified', 'lost_pet', 'lost_and_found', 'community_group', 'community_group_post'));
