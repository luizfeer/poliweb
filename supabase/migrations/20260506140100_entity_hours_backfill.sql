insert into public.entity_hours (
  entity_type,
  entity_id,
  city_id,
  weekday,
  starts_at,
  ends_at,
  kind,
  source_status,
  active
)
select
  'business',
  b.id,
  b.city_id,
  case slots.day_key
    when 'sun' then 0
    when 'mon' then 1
    when 'tue' then 2
    when 'wed' then 3
    when 'thu' then 4
    when 'fri' then 5
    when 'sat' then 6
  end,
  (slot.value->>'open')::time,
  nullif(slot.value->>'close', '')::time,
  'regular',
  'confirmed',
  true
from public.businesses b
cross join lateral jsonb_each(coalesce(b.hours, '{}'::jsonb)) as slots(day_key, day_value)
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(slots.day_value) = 'array' then slots.day_value else '[]'::jsonb end
) as slot(value)
where slots.day_key in ('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat')
  and slot.value ? 'open'
on conflict do nothing;

insert into public.entity_hours (
  entity_type,
  entity_id,
  city_id,
  weekday,
  starts_at,
  ends_at,
  kind,
  source_status,
  active
)
select
  'restaurant',
  r.id,
  r.city_id,
  case slots.day_key
    when 'sun' then 0
    when 'mon' then 1
    when 'tue' then 2
    when 'wed' then 3
    when 'thu' then 4
    when 'fri' then 5
    when 'sat' then 6
  end,
  (slot.value->>'open')::time,
  nullif(slot.value->>'close', '')::time,
  'regular',
  'confirmed',
  true
from public.restaurants r
cross join lateral jsonb_each(coalesce(r.hours, '{}'::jsonb)) as slots(day_key, day_value)
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(slots.day_value) = 'array' then slots.day_value else '[]'::jsonb end
) as slot(value)
where slots.day_key in ('sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat')
  and slot.value ? 'open'
on conflict do nothing;

comment on column public.businesses.hours is
  'Deprecated: use public.entity_hours. Kept temporarily as legacy fallback.';

comment on column public.restaurants.hours is
  'Deprecated: use public.entity_hours. Kept temporarily as legacy fallback.';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'utilities' and column_name = 'hours'
  ) then
    alter table public.utilities rename column hours to hours_legacy_text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attractions' and column_name = 'hours'
  ) then
    alter table public.attractions rename column hours to hours_legacy_text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'emergency_contacts' and column_name = 'hours'
  ) then
    alter table public.emergency_contacts rename column hours to hours_legacy_text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'health_facilities' and column_name = 'hours'
  ) then
    alter table public.health_facilities rename column hours to hours_legacy_text;
  end if;
end $$;
