-- ============================================================================
-- 0014 - COMMUNITY ADMIN: reports, flags, cron helpers and storage
-- ============================================================================

alter table public.classifieds
  add column if not exists flagged_count int not null default 0,
  add column if not exists updated_at timestamptz default now();

alter table public.lost_pets
  add column if not exists flagged_count int not null default 0,
  add column if not exists updated_at timestamptz default now();

alter table public.lost_and_found
  add column if not exists flagged_count int not null default 0,
  add column if not exists updated_at timestamptz default now();

create trigger trg_classifieds_updated
before update on public.classifieds
for each row execute function public.set_updated_at();

create trigger trg_lost_pets_updated
before update on public.lost_pets
for each row execute function public.set_updated_at();

create trigger trg_lost_and_found_updated
before update on public.lost_and_found
for each row execute function public.set_updated_at();

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete restrict,
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('event', 'classified', 'lost_pet', 'lost_and_found')),
  entity_id uuid not null,
  reason text not null check (reason in ('spam', 'inadequate', 'fake', 'match', 'other')),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (reporter_profile_id, entity_type, entity_id, reason)
);

create index if not exists idx_content_reports_city_status
on public.content_reports(city_id, status, created_at desc);

create index if not exists idx_content_reports_entity
on public.content_reports(entity_type, entity_id);

alter table public.content_reports enable row level security;

drop policy if exists "ai_jobs_moderate_ugc_enqueue" on public.ai_jobs;
create policy "ai_jobs_moderate_ugc_enqueue"
on public.ai_jobs for insert
to authenticated
with check (job_type = 'moderate_ugc');

drop policy if exists "content_reports_self_insert" on public.content_reports;
create policy "content_reports_self_insert"
on public.content_reports for insert
to authenticated
with check (
  reporter_profile_id = auth.uid()
  and exists (
    select 1 from public.cities c
    where c.id = city_id
      and exists (
        select 1 from public.city_modules cm
        where cm.city_id = c.id
          and cm.module_key in ('community', 'events', 'classifieds')
          and cm.enabled
      )
  )
);

drop policy if exists "content_reports_self_read" on public.content_reports;
create policy "content_reports_self_read"
on public.content_reports for select
to authenticated
using (reporter_profile_id = auth.uid() or public.is_city_admin(city_id));

drop policy if exists "content_reports_admin_update" on public.content_reports;
create policy "content_reports_admin_update"
on public.content_reports for update
to authenticated
using (public.is_city_admin(city_id))
with check (public.is_city_admin(city_id));

drop policy if exists "content_reports_admin_delete" on public.content_reports;
create policy "content_reports_admin_delete"
on public.content_reports for delete
to authenticated
using (public.is_city_admin(city_id));

create or replace function public.expire_classifieds()
returns void
language sql
security definer
as $$
  update public.classifieds
  set status = 'archived', updated_at = now()
  where expires_at < now()
    and status = 'published';
$$;

create or replace function public.auto_resolve_old_pets()
returns void
language sql
security definer
as $$
  update public.lost_pets
  set status = 'archived', updated_at = now()
  where status = 'lost'
    and created_at < now() - interval '90 days';
$$;

do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception when insufficient_privilege or undefined_file then
  null;
end $$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule('expire_classifieds');
    perform cron.unschedule('auto_resolve_old_pets');
    perform cron.schedule('expire_classifieds', '15 3 * * *', 'select public.expire_classifieds();');
    perform cron.schedule('auto_resolve_old_pets', '45 3 * * *', 'select public.auto_resolve_old_pets();');
  end if;
exception when others then
  null;
end $$;

insert into storage.buckets (id, name, public)
values ('community', 'community', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "storage_community_read" on storage.objects;
create policy "storage_community_read"
on storage.objects for select
to public
using (
  bucket_id = 'community'
  and (storage.foldername(storage.objects.name))[2] = 'community'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and (c.status = 'active' or public.is_super_admin())
  )
);

drop policy if exists "storage_community_insert" on storage.objects;
create policy "storage_community_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community'
  and (storage.foldername(storage.objects.name))[2] = 'community'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and (public.is_city_admin(c.id) or auth.uid() is not null)
  )
);

drop policy if exists "storage_community_update" on storage.objects;
create policy "storage_community_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'community'
  and (storage.foldername(storage.objects.name))[2] = 'community'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and public.is_city_admin(c.id)
  )
)
with check (
  bucket_id = 'community'
  and (storage.foldername(storage.objects.name))[2] = 'community'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and public.is_city_admin(c.id)
  )
);

drop policy if exists "storage_community_delete" on storage.objects;
create policy "storage_community_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'community'
  and (storage.foldername(storage.objects.name))[2] = 'community'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and public.is_city_admin(c.id)
  )
);

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.event_categories (city_id, slug, name, icon, display_order)
select carmo.id, item.slug, item.name, item.icon, item.display_order
from carmo
cross join (
  values
    ('cultural', 'Cultural', 'music', 10),
    ('religioso', 'Religioso', 'church', 20),
    ('esportivo', 'Esportivo', 'trophy', 30),
    ('gastronomico', 'Gastronomico', 'utensils', 40),
    ('infantil', 'Infantil', 'party-popper', 50)
) as item(slug, name, icon, display_order)
on conflict (city_id, slug) do update
set name = excluded.name,
    icon = excluded.icon,
    display_order = excluded.display_order;
