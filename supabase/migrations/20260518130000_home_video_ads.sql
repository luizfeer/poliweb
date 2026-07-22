-- Vídeo-anúncios da home do app mobile (módulo `ads`).
-- 1 cidade pode ter vários, com janela de exibição e prioridade.

create table if not exists public.home_video_ads (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  title text not null,
  subtitle text,
  cta_label text not null default 'Saiba mais',
  click_url text not null,
  video_url text not null,
  poster_url text,
  aspect_ratio numeric(4, 2) not null default 1.78 check (aspect_ratio between 0.5 and 3.0),
  mute_default boolean not null default true,
  priority integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_video_ads_city_active_idx
  on public.home_video_ads (city_id, status, priority desc)
  where status = 'active';

create index if not exists home_video_ads_window_idx
  on public.home_video_ads (starts_at, ends_at);

create or replace function public.tg_home_video_ads_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists home_video_ads_touch on public.home_video_ads;
create trigger home_video_ads_touch
  before update on public.home_video_ads
  for each row execute function public.tg_home_video_ads_touch();

alter table public.home_video_ads enable row level security;

drop policy if exists "public can read active video ads" on public.home_video_ads;
create policy "public can read active video ads"
  on public.home_video_ads
  for select
  using (
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "city admin manage video ads" on public.home_video_ads;
create policy "city admin manage video ads"
  on public.home_video_ads
  for all
  using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));

-- Métricas: impressões e cliques por anúncio.
create table if not exists public.home_video_ad_events (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.home_video_ads(id) on delete cascade,
  profile_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('impression', 'play', 'click', 'complete')),
  platform text check (platform in ('ios', 'android', 'web')),
  occurred_at timestamptz not null default now()
);

create index if not exists home_video_ad_events_ad_idx
  on public.home_video_ad_events (ad_id, event_type, occurred_at desc);

alter table public.home_video_ad_events enable row level security;

drop policy if exists "anyone can log ad events" on public.home_video_ad_events;
create policy "anyone can log ad events"
  on public.home_video_ad_events
  for insert
  with check (true);

drop policy if exists "city admin reads events" on public.home_video_ad_events;
create policy "city admin reads events"
  on public.home_video_ad_events
  for select
  using (
    exists (
      select 1 from public.home_video_ads a
      where a.id = home_video_ad_events.ad_id and public.is_city_admin(a.city_id)
    )
  );

comment on table public.home_video_ads is
  'Vídeo-anúncios exibidos na home do app mobile (apps/mobile). Filtrados por cidade + janela.';
comment on table public.home_video_ad_events is
  'Tracking de impressões/play/click/complete por vídeo-anúncio.';
