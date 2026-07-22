create table if not exists public.live_feed_items (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  source_kind text not null check (
    source_kind in (
      'system',
      'portal',
      'partner_news',
      'civic_news',
      'business_promotion',
      'event',
      'utility',
      'weather',
      'traffic'
    )
  ),
  source_id uuid,
  dedupe_key text,
  label text not null,
  title text not null,
  suffix text,
  href text,
  source_name text,
  tone text not null default 'ink' check (tone in ('clay', 'cerrado', 'sun', 'sky', 'ink', 'green', 'red')),
  priority int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  published_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_feed_items_expiry_check check (expires_at is null or expires_at > starts_at)
);

create unique index if not exists live_feed_items_dedupe_idx
on public.live_feed_items(city_id, dedupe_key);

create index if not exists live_feed_items_public_idx
on public.live_feed_items(city_id, status, starts_at desc, priority desc, published_at desc)
where status = 'published';

create index if not exists live_feed_items_expiry_idx
on public.live_feed_items(city_id, expires_at)
where expires_at is not null;

drop trigger if exists trg_live_feed_items_updated_at on public.live_feed_items;
create trigger trg_live_feed_items_updated_at
before update on public.live_feed_items
for each row execute function public.set_updated_at();

alter table public.live_feed_items enable row level security;

drop policy if exists "live_feed_items_public_read" on public.live_feed_items;
create policy "live_feed_items_public_read"
on public.live_feed_items
for select
using (
  status = 'published'
  and starts_at <= now()
  and (expires_at is null or expires_at > now())
);

drop policy if exists "live_feed_items_city_admin_manage" on public.live_feed_items;
create policy "live_feed_items_city_admin_manage"
on public.live_feed_items
for all
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_items as (
  select
    carmo.id as city_id,
    item.source_kind,
    item.dedupe_key,
    item.label,
    item.title,
    item.suffix,
    item.href,
    item.source_name,
    item.tone,
    item.priority
  from carmo
  cross join (
    values
      ('system', 'portal-chegou', 'Portal:', 'Carmelitano chegou', 'serviços, comércio e agenda da cidade', '/', 'Portal Carmelitano', 'clay', 30),
      ('portal', 'publique-comercio', 'Comércio:', 'cadastre sua página', 'e apareça nas buscas locais', '/anuncie', 'Portal Carmelitano', 'cerrado', 20),
      ('portal', 'utilidades-cidade', 'Cidade:', 'telefones úteis e serviços', 'sempre à mão no portal', '/servicos', 'Portal Carmelitano', 'sky', 10),
      ('portal', 'agenda-comunidade', 'Comunidade:', 'eventos e avisos locais', 'ganham destaque no ao vivo', '/comunidade', 'Portal Carmelitano', 'sun', 5)
  ) as item(source_kind, dedupe_key, label, title, suffix, href, source_name, tone, priority)
)
insert into public.live_feed_items (
  city_id,
  source_kind,
  dedupe_key,
  label,
  title,
  suffix,
  href,
  source_name,
  tone,
  priority
)
select
  city_id,
  source_kind,
  dedupe_key,
  label,
  title,
  suffix,
  href,
  source_name,
  tone,
  priority
from seed_items
on conflict (city_id, dedupe_key) do update
set
  label = excluded.label,
  title = excluded.title,
  suffix = excluded.suffix,
  href = excluded.href,
  source_name = excluded.source_name,
  tone = excluded.tone,
  priority = excluded.priority,
  status = 'published',
  updated_at = now();
