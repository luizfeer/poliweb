create table if not exists public.entity_hours (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'business',
    'restaurant',
    'accommodation',
    'attraction',
    'utility',
    'emergency_contact',
    'health_facility'
  )),
  entity_id uuid not null,
  city_id uuid not null references public.cities(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time,
  kind text not null default 'regular' check (kind in ('regular', 'exception')),
  valid_from date,
  valid_until date,
  note text,
  source_status text not null default 'needs_verification' check (source_status in ('confirmed', 'needs_verification')),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_entity_hours_updated on public.entity_hours;
create trigger trg_entity_hours_updated
before update on public.entity_hours
for each row execute function public.set_updated_at();

create index if not exists idx_entity_hours_lookup
on public.entity_hours(city_id, entity_type, entity_id, weekday)
where active;

create index if not exists idx_entity_hours_weekday_starts
on public.entity_hours(city_id, weekday, starts_at)
where active and kind = 'regular';

create unique index if not exists uq_entity_hours_slot
on public.entity_hours(entity_type, entity_id, weekday, starts_at, kind, coalesce(valid_from, '1970-01-01'::date));

create or replace function public.entity_is_published(
  p_type text,
  p_entity_id uuid,
  p_city_id uuid
) returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  case p_type
    when 'business' then
      return exists (
        select 1 from public.businesses e
        where e.id = p_entity_id and e.city_id = p_city_id and e.status = 'published'
      );
    when 'restaurant' then
      return exists (
        select 1 from public.restaurants e
        where e.id = p_entity_id and e.city_id = p_city_id and e.status = 'published'
      );
    when 'accommodation' then
      return exists (
        select 1 from public.accommodations e
        where e.id = p_entity_id and e.city_id = p_city_id and e.status = 'published'
      );
    when 'attraction' then
      return exists (
        select 1 from public.attractions e
        where e.id = p_entity_id and e.city_id = p_city_id and e.status = 'published'
      );
    when 'emergency_contact' then
      return exists (
        select 1 from public.emergency_contacts e
        where e.id = p_entity_id and e.city_id = p_city_id and e.active
      );
    when 'health_facility' then
      return exists (
        select 1 from public.health_facilities e
        where e.id = p_entity_id and e.city_id = p_city_id and e.active
      );
    else
      return false;
  end case;
end;
$$;

alter table public.entity_hours enable row level security;

drop policy if exists "entity_hours_public_read" on public.entity_hours;
create policy "entity_hours_public_read"
on public.entity_hours for select
using (
  active
  and public.entity_is_published(entity_type, entity_id, city_id)
);

drop policy if exists "entity_hours_manager_write" on public.entity_hours;
create policy "entity_hours_manager_write"
on public.entity_hours for all
using (
  public.manages_entity(entity_type, entity_id)
  or public.is_city_admin(city_id)
)
with check (
  public.manages_entity(entity_type, entity_id)
  or public.is_city_admin(city_id)
);
