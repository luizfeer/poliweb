-- OG image jobs para entidades do portal

-- 1) coluna og_image_url em businesses
alter table public.businesses add column if not exists og_image_url text;

-- 2) tabela de fila
create table if not exists public.og_image_jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  city_id uuid not null references public.cities(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  error text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  processed_at timestamptz,
  og_image_url text
);

-- 3) índices
create index if not exists idx_og_jobs_pending on public.og_image_jobs(city_id, status, created_at) where status = 'pending';
create index if not exists idx_og_jobs_entity on public.og_image_jobs(entity_type, entity_id);

-- 4) RLS
alter table public.og_image_jobs enable row level security;

drop policy if exists "og_jobs_select_service" on public.og_image_jobs;
create policy "og_jobs_select_service" on public.og_image_jobs
  for select using (true);

drop policy if exists "og_jobs_insert_service" on public.og_image_jobs;
create policy "og_jobs_insert_service" on public.og_image_jobs
  for insert with check (true);

drop policy if exists "og_jobs_update_service" on public.og_image_jobs;
create policy "og_jobs_update_service" on public.og_image_jobs
  for update using (true);

-- 5) trigger para enfileirar quando business muda (nome, capa ou fotos)
create or replace function public.enqueue_og_image_job()
returns trigger as $$
begin
  -- remove pendentes antigos para essa entidade
  delete from public.og_image_jobs
  where entity_type = TG_ARGV[0]
    and entity_id = new.id
    and status = 'pending';

  insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
  values (new.city_id, TG_ARGV[0], new.id, 'pending');

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_businesses_og_image on public.businesses;
create trigger trg_businesses_og_image
  after insert or update of name, cover_url, photos, slug on public.businesses
  for each row
  when (new.status = 'published')
  execute function public.enqueue_og_image_job('business');
