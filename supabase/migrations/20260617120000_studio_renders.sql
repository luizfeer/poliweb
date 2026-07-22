-- ============================================================================
-- STUDIO REELS — registro de renders de vídeo (MP4) gerados a partir das artes
-- ============================================================================
-- Fase 2 do Plano 16: o documento do Studio vira um Reels vertical animado e é
-- renderizado em MP4 (Remotion no media-processor) e guardado no R2. Esta tabela
-- guarda o histórico/estado de cada render. RLS no mesmo molde de art_pieces.

create table public.studio_renders (
  id             uuid primary key default gen_random_uuid(),
  city_id        uuid not null references public.cities(id) on delete cascade,
  business_id    uuid not null references public.businesses(id) on delete cascade,
  art_piece_id   uuid references public.art_pieces(id) on delete set null,
  status         text not null default 'queued' check (status in ('queued', 'rendering', 'done', 'error')),
  video_url      text,
  video_asset_id uuid references public.media_assets(id) on delete set null,
  error          text,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_studio_renders_business on public.studio_renders (business_id, created_at desc);
create index idx_studio_renders_city on public.studio_renders (city_id);

create trigger trg_studio_renders_updated
  before update on public.studio_renders
  for each row execute function public.set_updated_at();

alter table public.studio_renders enable row level security;

create policy "studio_renders_rw" on public.studio_renders for all
  using (public.manages_business(business_id) or public.is_city_admin(city_id))
  with check (public.manages_business(business_id) or public.is_city_admin(city_id));
