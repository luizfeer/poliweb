-- ============================================================================
-- HOME BUILDER — layout customizavel por cidade (blocos reordenaveis + banners)
-- ============================================================================

do $$ begin
  create type home_block_type as enum (
    'banner_carousel',
    'category_grid',
    'entity_list',
    'promo_strip'
  );
exception when duplicate_object then null; end $$;

-- ── Layout (1 por cidade, criado on-demand) ─────────────────────────────────

create table home_layouts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null unique references cities(id) on delete cascade,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_home_layouts_updated before update on home_layouts
for each row execute function set_updated_at();

-- ── Blocos ──────────────────────────────────────────────────────────────────

create table home_blocks (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references home_layouts(id) on delete cascade,
  city_id uuid not null references cities(id) on delete cascade,
  type home_block_type not null,
  position integer not null default 0,
  enabled boolean not null default true,
  title text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_home_blocks_layout on home_blocks(layout_id, position);
create index idx_home_blocks_city on home_blocks(city_id, enabled, position);

create trigger trg_home_blocks_updated before update on home_blocks
for each row execute function set_updated_at();

-- ── Banners (filhos de blocos banner_carousel) ──────────────────────────────

create table home_block_banners (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references home_blocks(id) on delete cascade,
  city_id uuid not null references cities(id) on delete cascade,
  position integer not null default 0,
  title text,
  subtitle text,
  image_asset_id uuid not null references media_assets(id) on delete restrict,
  video_asset_id uuid references media_assets(id) on delete set null,
  link_type text not null default 'internal' check (link_type in ('internal', 'external', 'none')),
  link_url text,
  link_target text not null default '_self' check (link_target in ('_self', '_blank')),
  active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_home_banners_block on home_block_banners(block_id, position);
create index idx_home_banners_active on home_block_banners(block_id, active, start_at, end_at);

create trigger trg_home_banners_updated before update on home_block_banners
for each row execute function set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table home_layouts       enable row level security;
alter table home_blocks        enable row level security;
alter table home_block_banners enable row level security;

create policy "home_layouts_read"  on home_layouts for select using (true);
create policy "home_layouts_write" on home_layouts for all
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

create policy "home_blocks_read"  on home_blocks for select using (true);
create policy "home_blocks_write" on home_blocks for all
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

create policy "home_banners_read"  on home_block_banners for select using (true);
create policy "home_banners_write" on home_block_banners for all
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

-- ── Helper: garante o layout da cidade (cria se nao existir) ────────────────

create or replace function public.ensure_home_layout(p_city_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_layout_id uuid;
begin
  select id into v_layout_id from home_layouts where city_id = p_city_id;
  if v_layout_id is null then
    insert into home_layouts (city_id, updated_by)
    values (p_city_id, auth.uid())
    returning id into v_layout_id;
  end if;
  return v_layout_id;
end;
$$;
