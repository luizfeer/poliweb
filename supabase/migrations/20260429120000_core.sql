-- ============================================================================
-- 0001 — CORE: multi-cidade, perfis, papéis, ownership, audit, RLS helpers
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ── Tipos enumerados compartilhados ─────────────────────────────────────────

do $$ begin
  create type role_kind as enum ('super_admin', 'city_admin', 'moderator', 'merchant', 'citizen');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entity_status as enum ('draft', 'pending', 'published', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type city_status as enum ('active', 'coming_soon', 'paused');
exception when duplicate_object then null; end $$;

-- ── Cidades ─────────────────────────────────────────────────────────────────

create table cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  state char(2) not null,
  status city_status default 'active',
  timezone text default 'America/Sao_Paulo',
  lat double precision,
  lng double precision,
  population int,
  ibge_code text,
  hero_url text,
  about text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  slug text not null,
  name text not null,
  zone text, -- centro, norte, sul, leste, oeste, rural
  display_order int default 0,
  created_at timestamptz default now(),
  unique (city_id, slug)
);

create index idx_districts_city on districts(city_id);

-- ── Registro de módulos (turmas de funcionalidades por cidade) ─────────────

create table modules (
  key text primary key,
  name text not null,
  description text,
  icon text,
  default_enabled boolean default true,
  display_order int default 0
);

insert into modules (key, name, description, icon, display_order) values
  ('utilities',    'Utilidade pública',  'Coleta, telefones, farmácia, UBS, alertas',     'shield',        10),
  ('events',       'Agenda',             'Eventos da cidade',                              'calendar',      20),
  ('tourism',      'Turismo',            'Pousadas, atrações, restaurantes, pesca',        'mountain',      30),
  ('real_estate',  'Imobiliária',        'Imóveis venda/aluguel + imobiliárias',           'home',          40),
  ('businesses',   'Comércio',           'Guia comercial completo',                        'store',         50),
  ('classifieds',  'Classificados',      'Veículos, vagas, serviços',                      'tag',           60),
  ('community',    'Comunidade',         'Achados, pets, obituários',                      'heart',         70),
  ('transparency', 'Transparência',      'Diário Oficial, atas, licitações, obras',        'file-text',     80),
  ('ads',          'Anúncios',           'Slots de anúncios pagos',                        'megaphone',     90)
on conflict (key) do nothing;

create table city_modules (
  city_id uuid not null references cities(id) on delete cascade,
  module_key text not null references modules(key) on delete restrict,
  enabled boolean default true,
  config jsonb default '{}'::jsonb,
  primary key (city_id, module_key),
  created_at timestamptz default now()
);

create index idx_city_modules_enabled on city_modules(city_id) where enabled;

-- ── Perfis e papéis ─────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  default_city_id uuid references cities(id) on delete set null,
  bio text,
  consent_marketing boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Papéis são por cidade: alguém pode ser city_admin de Carmo + citizen de Capitólio.
-- city_id null + role 'super_admin' = administrador global.
create table profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  city_id uuid references cities(id) on delete cascade,
  role role_kind not null,
  granted_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (profile_id, city_id, role)
);

create index idx_profile_roles_lookup on profile_roles(profile_id, role);

-- ── Ownership genérico: qualquer entidade pode ter múltiplos managers ──────

create table entity_managers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  entity_type text not null,           -- 'business' | 'realtor' | 'accommodation' | ...
  entity_id uuid not null,
  role text not null default 'owner',  -- owner | editor | viewer
  invited_by uuid references profiles(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique (profile_id, entity_type, entity_id)
);

create index idx_entity_managers_lookup on entity_managers(entity_type, entity_id);
create index idx_entity_managers_profile on entity_managers(profile_id);

-- ── Audit log ───────────────────────────────────────────────────────────────

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  city_id uuid references cities(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_audit_city on audit_log(city_id, created_at desc);
create index idx_audit_entity on audit_log(entity_type, entity_id);

-- ── Funções de RLS ─────────────────────────────────────────────────────────

create or replace function public.is_super_admin()
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from profile_roles
    where profile_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_city_admin(p_city_id uuid)
returns boolean language sql security definer stable
as $$
  select public.is_super_admin() or exists (
    select 1 from profile_roles
    where profile_id = auth.uid()
      and city_id = p_city_id
      and role in ('city_admin', 'moderator')
  );
$$;

create or replace function public.is_merchant(p_city_id uuid)
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from profile_roles
    where profile_id = auth.uid()
      and city_id = p_city_id
      and role = 'merchant'
  );
$$;

-- Verifica se o usuário gerencia uma entidade específica (via entity_managers)
create or replace function public.manages_entity(p_entity_type text, p_entity_id uuid)
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from entity_managers
    where profile_id = auth.uid()
      and entity_type = p_entity_type
      and entity_id = p_entity_id
  );
$$;

-- ── Triggers ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_cities_updated   before update on cities   for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on profiles for each row execute function public.set_updated_at();

-- Cria profile automaticamente ao registrar em auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table cities          enable row level security;
alter table districts       enable row level security;
alter table modules         enable row level security;
alter table city_modules    enable row level security;
alter table profiles        enable row level security;
alter table profile_roles   enable row level security;
alter table entity_managers enable row level security;
alter table audit_log       enable row level security;

-- Cidades: leitura pública das ativas; escrita só super_admin
create policy "cities_read"  on cities for select using (status = 'active' or public.is_super_admin());
create policy "cities_write" on cities for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Distritos: leitura pública; escrita por city_admin
create policy "districts_read"  on districts for select using (true);
create policy "districts_write" on districts for all
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

-- Módulos: leitura pública; escrita só super_admin
create policy "modules_read"  on modules for select using (true);
create policy "modules_write" on modules for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "city_modules_read"  on city_modules for select using (true);
create policy "city_modules_write" on city_modules for all
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

-- Profiles: o próprio + super_admin
create policy "profiles_self_read"   on profiles for select using (id = auth.uid() or public.is_super_admin());
create policy "profiles_self_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_write" on profiles for all   using (public.is_super_admin()) with check (public.is_super_admin());

-- Profile roles: o próprio lê os seus; super_admin/city_admin gerenciam
create policy "profile_roles_self_read" on profile_roles for select using (profile_id = auth.uid() or public.is_super_admin() or public.is_city_admin(city_id));
create policy "profile_roles_admin"     on profile_roles for all
  using (public.is_super_admin() or public.is_city_admin(city_id))
  with check (public.is_super_admin() or public.is_city_admin(city_id));

-- Entity managers: o próprio + admin
create policy "entity_managers_self_read" on entity_managers for select using (profile_id = auth.uid() or public.is_super_admin());
create policy "entity_managers_self_create" on entity_managers for insert with check (profile_id = auth.uid() or public.is_super_admin());
create policy "entity_managers_admin"  on entity_managers for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Audit: leitura para admins
create policy "audit_admin_read" on audit_log for select using (public.is_super_admin() or public.is_city_admin(city_id));
