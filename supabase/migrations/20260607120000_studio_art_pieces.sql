-- ============================================================================
-- STUDIO DE ARTES — peças de arte do comerciante + fila de banner na home
-- ============================================================================
-- O comerciante monta artes (estilo Canva) no painel. Cada peça é guardada
-- como um documento JSON (slides: kind, theme, format, textos, foto) — fonte
-- de verdade independente de plataforma, pra reusar/editar e (no futuro)
-- renderizar nativo no app. O PNG final é gerado no cliente e:
--   - baixado pro Instagram, ou
--   - publicado como entity_post (Novidades), ou
--   - enviado pra fila home_banner_requests (aprovação do city_admin).
--
-- RLS: comerciante que gerencia o negócio (manages_business) cuida das próprias
-- peças e pedidos; city_admin enxerga tudo e aprova/recusa banners.

-- ── art_pieces ──────────────────────────────────────────────────────────────
create table if not exists public.art_pieces (
  id          uuid primary key default gen_random_uuid(),
  city_id     uuid not null references public.cities(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null default 'Nova arte',
  ramo        text not null default 'restaurante',
  format      text not null default 'feed-45',
  document    jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_art_pieces_business on public.art_pieces (business_id);
create index if not exists idx_art_pieces_city on public.art_pieces (city_id);

create trigger trg_art_pieces_updated
  before update on public.art_pieces
  for each row execute function public.set_updated_at();

alter table public.art_pieces enable row level security;

create policy "art_pieces_manage" on public.art_pieces for all
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));

-- ── home_banner_requests ────────────────────────────────────────────────────
create table if not exists public.home_banner_requests (
  id             uuid primary key default gen_random_uuid(),
  city_id        uuid not null references public.cities(id) on delete cascade,
  business_id    uuid not null references public.businesses(id) on delete cascade,
  art_piece_id   uuid references public.art_pieces(id) on delete set null,
  image_url      text not null,
  image_asset_id uuid references public.media_assets(id) on delete set null,
  title          text,
  link_url       text,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note    text,
  reviewed_by    uuid references public.profiles(id) on delete set null,
  reviewed_at    timestamptz,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_banner_requests_city_status on public.home_banner_requests (city_id, status);
create index if not exists idx_banner_requests_business on public.home_banner_requests (business_id);

create trigger trg_home_banner_requests_updated
  before update on public.home_banner_requests
  for each row execute function public.set_updated_at();

alter table public.home_banner_requests enable row level security;

-- comerciante: vê e cria os próprios pedidos (sempre como 'pending')
create policy "banner_req_read" on public.home_banner_requests for select
  using (public.manages_business(business_id) or public.is_city_admin(city_id));

create policy "banner_req_create" on public.home_banner_requests for insert
  with check (public.manages_business(business_id) and status = 'pending');

-- city_admin: aprova/recusa
create policy "banner_req_review" on public.home_banner_requests for update
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

create policy "banner_req_delete" on public.home_banner_requests for delete
  using (public.manages_business(business_id) or public.is_city_admin(city_id));
