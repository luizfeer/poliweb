-- Church reviews must be scoped by city like every domain table.

alter table public.church_reviews
add column if not exists city_id uuid references public.cities(id) on delete restrict;

update public.church_reviews cr
set city_id = c.city_id
from public.churches c
where cr.church_id = c.id
  and cr.city_id is null;

alter table public.church_reviews
alter column city_id set not null;

create index if not exists idx_church_reviews_city_church
on public.church_reviews(city_id, church_id, status, created_at desc);
