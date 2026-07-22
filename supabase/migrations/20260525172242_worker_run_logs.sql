create table if not exists public.worker_run_logs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  city_id uuid references public.cities(id) on delete set null,
  city_slug text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worker_run_logs_started_idx
on public.worker_run_logs(started_at desc);

create index if not exists worker_run_logs_status_idx
on public.worker_run_logs(status, started_at desc);

create index if not exists worker_run_logs_job_idx
on public.worker_run_logs(job_name, started_at desc);

drop trigger if exists trg_worker_run_logs_updated_at on public.worker_run_logs;
create trigger trg_worker_run_logs_updated_at
before update on public.worker_run_logs
for each row execute function public.set_updated_at();

alter table public.worker_run_logs enable row level security;

drop policy if exists "worker_run_logs_super_read" on public.worker_run_logs;
create policy "worker_run_logs_super_read"
on public.worker_run_logs
for select
using (public.is_super_admin());

drop policy if exists "worker_run_logs_super_manage" on public.worker_run_logs;
create policy "worker_run_logs_super_manage"
on public.worker_run_logs
for all
using (public.is_super_admin())
with check (public.is_super_admin());
