-- ============================================================================
-- CARDÁPIO / CATÁLOGO — seções e itens do negócio (substitui o MOCK_CATALOG)
-- ============================================================================
-- O comerciante monta o cardápio sozinho no painel. Vira página pública
-- (/comercio/negocio/[slug]/cardapio), QR pra mesa e link pra bio.
--
-- v1 minimalista (sem option_groups ainda): nome, descrição, preço em centavos,
-- foto, disponibilidade e ordenação. O CatalogShell renderiza com optionGroups [].
--
-- RLS (mesmo molde do art_pieces + leitura pública como businesses):
--   - escrita: manages_business(business_id) ou is_city_admin(city_id)
--   - leitura: pública quando o negócio está 'published'; senão só quem gerencia.

-- ── business_menu_sections ──────────────────────────────────────────────────
create table if not exists public.business_menu_sections (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references public.cities(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null default 'Nova seção',
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_menu_sections_business on public.business_menu_sections (business_id, position);
create index if not exists idx_menu_sections_city on public.business_menu_sections (city_id);

create trigger trg_menu_sections_updated
  before update on public.business_menu_sections
  for each row execute function public.set_updated_at();

alter table public.business_menu_sections enable row level security;

create policy "menu_sections_read" on public.business_menu_sections for select
  using (
    public.manages_business(business_id)
    or public.is_city_admin(city_id)
    or exists (select 1 from public.businesses b where b.id = business_id and b.status = 'published')
  );

create policy "menu_sections_insert" on public.business_menu_sections for insert
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));

create policy "menu_sections_update" on public.business_menu_sections for update
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));

create policy "menu_sections_delete" on public.business_menu_sections for delete
  using (public.manages_business(business_id) or public.is_city_admin(city_id));

-- ── business_menu_items ─────────────────────────────────────────────────────
create table if not exists public.business_menu_items (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references public.cities(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  section_id  uuid not null references public.business_menu_sections(id) on delete cascade,
  name        text not null default 'Novo item',
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  photo_url   text,
  available   boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_menu_items_section on public.business_menu_items (section_id, position);
create index if not exists idx_menu_items_business on public.business_menu_items (business_id);
create index if not exists idx_menu_items_city on public.business_menu_items (city_id);

create trigger trg_menu_items_updated
  before update on public.business_menu_items
  for each row execute function public.set_updated_at();

alter table public.business_menu_items enable row level security;

create policy "menu_items_read" on public.business_menu_items for select
  using (
    public.manages_business(business_id)
    or public.is_city_admin(city_id)
    or exists (select 1 from public.businesses b where b.id = business_id and b.status = 'published')
  );

create policy "menu_items_insert" on public.business_menu_items for insert
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));

create policy "menu_items_update" on public.business_menu_items for update
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));

create policy "menu_items_delete" on public.business_menu_items for delete
  using (public.manages_business(business_id) or public.is_city_admin(city_id));
