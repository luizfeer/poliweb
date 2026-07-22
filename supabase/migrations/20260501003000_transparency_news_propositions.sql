create table if not exists public.civic_news (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  source text not null check (source in ('city_hall', 'council')),
  title text not null,
  excerpt text,
  summary_ai text,
  raw_text text,
  source_url text not null,
  source_host text not null,
  thumbnail_url text,
  published_at timestamptz,
  scraped_at timestamptz not null default now(),
  raw_html_excerpt text,
  checksum text not null,
  parse_confidence numeric(3,2) not null default 0.80,
  parser_warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, source_url)
);

create table if not exists public.council_propositions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  external_id text not null,
  proposition_type text,
  number text,
  title text not null,
  author text,
  situation text,
  presented_at date,
  summary_ai text,
  raw_text text,
  source_url text not null,
  source_host text not null,
  download_url text,
  scraped_at timestamptz not null default now(),
  raw_html_excerpt text,
  checksum text not null,
  parse_confidence numeric(3,2) not null default 0.80,
  parser_warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, external_id)
);

drop trigger if exists trg_civic_news_updated_at on public.civic_news;
create trigger trg_civic_news_updated_at
before update on public.civic_news
for each row execute function public.set_updated_at();

drop trigger if exists trg_council_propositions_updated_at on public.council_propositions;
create trigger trg_council_propositions_updated_at
before update on public.council_propositions
for each row execute function public.set_updated_at();

alter table public.civic_news enable row level security;
alter table public.council_propositions enable row level security;

drop policy if exists "Public can read civic news" on public.civic_news;
create policy "Public can read civic news"
on public.civic_news
for select
using (true);

drop policy if exists "City admins manage civic news" on public.civic_news;
create policy "City admins manage civic news"
on public.civic_news
for all
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

drop policy if exists "Public can read council propositions" on public.council_propositions;
create policy "Public can read council propositions"
on public.council_propositions
for select
using (true);

drop policy if exists "City admins manage council propositions" on public.council_propositions;
create policy "City admins manage council propositions"
on public.council_propositions
for all
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

create index if not exists civic_news_city_source_published_idx
on public.civic_news (city_id, source, published_at desc nulls last);

create index if not exists council_propositions_city_presented_idx
on public.council_propositions (city_id, presented_at desc nulls last);

create index if not exists council_propositions_city_situation_idx
on public.council_propositions (city_id, situation);
